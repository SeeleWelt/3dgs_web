import { Column, DataTable } from './data-table';
import { generateMortonIndices } from './morton-order';
import { encodeWebP } from './webp-encoder';
import { BufferWriter } from './writer';
import { ZipWriter } from './zwriter';

// SH系数名称
const shNames = new Array(45).fill('').map((_, i) => `f_rest_${i}`);

// Sigmoid（透明度编码）
const sigmoid = (v) => 1 / (1 + Math.exp(-v));

// 位置对数变换（压缩）
const logTransform = (value) => {
    return Math.sign(value) * Math.log(Math.abs(value) + 1);
};

// 双RAF让出主线程
const yieldToRender = () => new Promise((resolve) => {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
    });
});

// 计算列最大/最小值
const calcMinMax = (dataTable, columnNames, indices) => {
    const columns = columnNames.map(name => dataTable.getColumnByName(name));
    const minMax = columnNames.map(() => [Infinity, -Infinity]);
    const row = {};

    for (let i = 0; i < indices.length; ++i) {
        dataTable.getRow(indices[i], row, columns);
        for (let j = 0; j < columnNames.length; ++j) {
            const value = row[columnNames[j]];
            if (value < minMax[j][0]) minMax[j][0] = value;
            if (value > minMax[j][1]) minMax[j][1] = value;
        }
    }
    return minMax;
};

// GSplatData 提取到 DataTable
const extractFromGSplatData = async (gsplatData, memberNames) => {
    const totalCount = gsplatData.numSplats;
    if (totalCount === 0) {
        throw new Error('GSplatData 中无有效高斯点数据');
    }

    const columns = memberNames.map(name => new Column(name, new Float32Array(totalCount)));
    const dataTable = new DataTable(columns);

    memberNames.forEach((name, j) => {
        const propData = gsplatData.getProp(name);
        if (propData) columns[j].data.set(propData);
    });

    await yieldToRender();
    return { dataTable, count: totalCount };
};

// ---------------- CPU K-means & Cluster ----------------
const pickRandomIndices = (n, m) => {
    const chosen = new Set();
    for (let j = n - m; j < n; j++) {
        const t = Math.floor(Math.random() * (j + 1));
        chosen.add(chosen.has(t) ? j : t);
    }
    return [...chosen];
};

const initializeCentroids = (dataTable, centroids, row) => {
    const indices = pickRandomIndices(dataTable.numRows, centroids.numRows);
    for (let i = 0; i < centroids.numRows; ++i) {
        dataTable.getRow(indices[i], row);
        centroids.setRow(i, row);
    }
};

const initializeCentroids1D = (dataTable, centroids) => {
    const data = dataTable.getColumn(0).data;
    const n = dataTable.numRows;
    const k = centroids.numRows;

    const sorted = Float32Array.from(data).sort((a, b) => a - b);
    const centroidsData = centroids.getColumn(0).data;
    for (let i = 0; i < k; ++i) {
        const quantile = (2 * i + 1) / (2 * k);
        const index = Math.min(Math.floor(quantile * n), n - 1);
        centroidsData[i] = sorted[index];
    }
};

const calcAverage = (dataTable, cluster, row) => {
    const keys = dataTable.columnNames;

    for (let i = 0; i < keys.length; ++i) {
        row[keys[i]] = 0;
    }

    const dataRow = {};
    for (let i = 0; i < cluster.length; ++i) {
        dataTable.getRow(cluster[i], dataRow);
        for (let j = 0; j < keys.length; ++j) {
            const key = keys[j];
            row[key] += dataRow[key];
        }
    }

    if (cluster.length > 0) {
        for (let i = 0; i < keys.length; ++i) {
            row[keys[i]] /= cluster.length;
        }
    }
};

const groupLabels = (labels, k) => {
    const clusters = [];
    for (let i = 0; i < k; ++i) clusters[i] = [];
    for (let i = 0; i < labels.length; ++i) {
        clusters[labels[i]].push(i);
    }
    return clusters;
};

const kmeansCpu = async (points, k, iterations, onProgress) => {
    if (points.numRows < k) {
        return {
            centroids: points.clone(),
            labels: new Uint32Array(points.numRows).map((_, i) => i)
        };
    }

    const row = {};
    const centroids = new DataTable(points.columns.map(c => new Column(c.name, new Float32Array(k))));
    if (points.numColumns === 1) {
        initializeCentroids1D(points, centroids);
    } else {
        initializeCentroids(points, centroids, row);
    }

    const labels = new Uint32Array(points.numRows);
    let steps = 0;

    const yieldEvery = 2048;
    while (steps < iterations) {
        // assign labels
        for (let i = 0; i < points.numRows; ++i) {
            let best = 0;
            let bestDist = Infinity;
            for (let c = 0; c < k; ++c) {
                let dist = 0;
                for (let j = 0; j < points.numColumns; ++j) {
                    const col = points.getColumn(j).data[i];
                    const cent = centroids.getColumn(j).data[c];
                    const d = col - cent;
                    dist += d * d;
                }
                if (dist < bestDist) {
                    bestDist = dist;
                    best = c;
                }
            }
            labels[i] = best;
            if ((i & (yieldEvery - 1)) === 0) {
                await yieldToRender();
            }
        }

        const groups = groupLabels(labels, k);
        for (let i = 0; i < centroids.numRows; ++i) {
            if (groups[i].length === 0) {
                const idx = Math.floor(Math.random() * points.numRows);
                points.getRow(idx, row);
                centroids.setRow(i, row);
            } else {
                calcAverage(points, groups[i], row);
                centroids.setRow(i, row);
            }
        }

        steps++;
        onProgress?.(steps / iterations * 100);
        await yieldToRender();
    }

    return { centroids, labels };
};

const cluster1dCpu = async (dataTable, iterations, onProgress) => {
    const { numColumns, numRows } = dataTable;

    // 自适应聚类数：避免大数据集时过大K导致崩溃
    const k = Math.max(16, Math.min(64, Math.floor(numRows / 2048))) || 16;

    const data = new Float32Array(numRows * numColumns);
    for (let i = 0; i < numColumns; ++i) {
        data.set(dataTable.getColumn(i).data, i * numRows);
    }

    const src = new DataTable([new Column('data', data)]);
    const { centroids, labels } = await kmeansCpu(src, k, iterations, onProgress);

    const centroidsData = centroids.getColumn(0).data;
    const order = Array.from(centroidsData).map((_, i) => i);
    order.sort((a, b) => centroidsData[a] - centroidsData[b]);

    const tmp = centroidsData.slice();
    for (let i = 0; i < order.length; ++i) {
        centroidsData[i] = tmp[order[i]];
    }

    const invOrder = [];
    for (let i = 0; i < order.length; ++i) {
        invOrder[order[i]] = i;
    }

    for (let i = 0; i < labels.length; i++) {
        labels[i] = invOrder[labels[i]];
    }

    const result = new DataTable(dataTable.columnNames.map(name => new Column(name, new Uint8Array(numRows))));
    for (let i = 0; i < numColumns; ++i) {
        result.getColumn(i).data.set(labels.subarray(i * numRows, (i + 1) * numRows));
    }

    return {
        centroids,
        labels: result
    };
};

// ---------------- Write Helpers ----------------
const writeMeans = async (dataTable, indices, width, height) => {
    const meansL = new Uint8Array(width * height * 4);
    const meansU = new Uint8Array(width * height * 4);
    const meansNames = ['x', 'y', 'z'];
    const meansMinMax = calcMinMax(dataTable, meansNames, indices).map(v => v.map(logTransform));
    const meansColumns = meansNames.map(name => dataTable.getColumnByName(name));
    const row = {};

    for (let i = 0; i < indices.length; ++i) {
        dataTable.getRow(indices[i], row, meansColumns);
        const x = 65535 * (logTransform(row.x) - meansMinMax[0][0]) / (meansMinMax[0][1] - meansMinMax[0][0] || 1);
        const y = 65535 * (logTransform(row.y) - meansMinMax[1][0]) / (meansMinMax[1][1] - meansMinMax[1][0] || 1);
        const z = 65535 * (logTransform(row.z) - meansMinMax[2][0]) / (meansMinMax[2][1] - meansMinMax[2][0] || 1);
        const ti = i;

        meansL[ti * 4] = x & 0xff;
        meansL[ti * 4 + 1] = y & 0xff;
        meansL[ti * 4 + 2] = z & 0xff;
        meansL[ti * 4 + 3] = 0xff;

        meansU[ti * 4] = (x >> 8) & 0xff;
        meansU[ti * 4 + 1] = (y >> 8) & 0xff;
        meansU[ti * 4 + 2] = (z >> 8) & 0xff;
        meansU[ti * 4 + 3] = 0xff;
    }

    const meansLWebp = await encodeWebP(meansL, width, height);
    const meansUWebp = await encodeWebP(meansU, width, height);

    return {
        meansL: meansLWebp,
        meansU: meansUWebp,
        mins: meansMinMax.map(v => v[0]),
        maxs: meansMinMax.map(v => v[1])
    };
};

const writeQuaternions = async (dataTable, indices, width, height) => {
    const quats = new Uint8Array(width * height * 4);
    const quatNames = ['rot_0', 'rot_1', 'rot_2', 'rot_3'];
    const quatColumns = quatNames.map(name => dataTable.getColumnByName(name));
    const row = {};
    const q = [0, 0, 0, 0];

    for (let i = 0; i < indices.length; ++i) {
        dataTable.getRow(indices[i], row, quatColumns);
        q[0] = row.rot_0;
        q[1] = row.rot_1;
        q[2] = row.rot_2;
        q[3] = row.rot_3;

        const l = Math.sqrt(q[0] ** 2 + q[1] ** 2 + q[2] ** 2 + q[3] ** 2);
        for (let j = 0; j < 4; ++j) q[j] /= l || 1;

        let maxComp = 0;
        for (let j = 1; j < 4; ++j) {
            if (Math.abs(q[j]) > Math.abs(q[maxComp])) maxComp = j;
        }
        if (q[maxComp] < 0) for (let j = 0; j < 4; ++j) q[j] *= -1;

        const sqrt2 = Math.sqrt(2);
        for (let j = 0; j < 4; ++j) q[j] *= sqrt2;

        const idx = [[1,2,3],[0,2,3],[0,1,3],[0,1,2]][maxComp];
        const ti = i;
        quats[ti * 4] = 255 * (q[idx[0]] * 0.5 + 0.5);
        quats[ti * 4 + 1] = 255 * (q[idx[1]] * 0.5 + 0.5);
        quats[ti * 4 + 2] = 255 * (q[idx[2]] * 0.5 + 0.5);
        quats[ti * 4 + 3] = 252 + maxComp;
    }

    const quatsWebp = await encodeWebP(quats, width, height);
    return quatsWebp;
};

const writeScales = async (dataTable, indices, width, height, iterations) => {
    const scaleNames = ['scale_0', 'scale_1', 'scale_2'];
    const scaleColumns = scaleNames.map((name) => {
        const src = dataTable.getColumnByName(name).data;
        const dst = new Float32Array(indices.length);
        for (let i = 0; i < indices.length; ++i) dst[i] = src[indices[i]];
        return new Column(name, dst);
    });
    const scaleTable = new DataTable(scaleColumns);

    const scaleData = await cluster1dCpu(scaleTable, iterations);

    const data = new Uint8Array(width * height * 4);
    const columns = scaleData.labels.columns.map(c => c.data);
    const numColumns = columns.length;
    for (let i = 0; i < indices.length; ++i) {
        data[i * 4] = columns[0][i];
        data[i * 4 + 1] = numColumns > 1 ? columns[1][i] : 0;
        data[i * 4 + 2] = numColumns > 2 ? columns[2][i] : 0;
        data[i * 4 + 3] = 255;
    }

    const scalesWebp = await encodeWebP(data, width, height);
    const codebook = Array.from(scaleData.centroids.getColumn(0).data);

    return {
        webp: scalesWebp,
        codebook: codebook
    };
};

const writeColors = async (dataTable, indices, width, height, iterations) => {
    const colorNames = ['f_dc_0', 'f_dc_1', 'f_dc_2'];
    const colorColumns = colorNames.map((name) => {
        const src = dataTable.getColumnByName(name).data;
        const dst = new Float32Array(indices.length);
        for (let i = 0; i < indices.length; ++i) dst[i] = src[indices[i]];
        return new Column(name, dst);
    });
    const colorTable = new DataTable(colorColumns);

    const colorData = await cluster1dCpu(colorTable, iterations);

    const opacity = dataTable.getColumnByName('opacity').data;
    const opacityData = new Uint8Array(indices.length);
    for (let i = 0; i < indices.length; ++i) {
        opacityData[i] = Math.max(0, Math.min(255, sigmoid(opacity[indices[i]]) * 255));
    }
    colorData.labels.addColumn(new Column('opacity', opacityData));

    const data = new Uint8Array(width * height * 4);
    const columns = colorData.labels.columns.map(c => c.data);
    for (let i = 0; i < indices.length; ++i) {
        data[i * 4] = columns[0][i];
        data[i * 4 + 1] = columns[1][i];
        data[i * 4 + 2] = columns[2][i];
        data[i * 4 + 3] = columns[3][i];
    }

    const colorsWebp = await encodeWebP(data, width, height);
    const codebook = Array.from(colorData.centroids.getColumn(0).data);

    return {
        webp: colorsWebp,
        codebook: codebook
    };
};

const writeSH = async (dataTable, indices, width, height, shBands, iterations) => {
    if (shBands === 0) return null;
    const shCoeffs = [0, 3, 8, 15][shBands];
    const shColumnNames = shNames.slice(0, shCoeffs * 3);

    for (const name of shColumnNames) {
        if (!dataTable.hasColumn(name)) return null;
    }

    const shColumns = shColumnNames.map((name) => {
        const src = dataTable.getColumnByName(name).data;
        const dst = new Float32Array(indices.length);
        for (let i = 0; i < indices.length; ++i) dst[i] = src[indices[i]];
        return new Column(name, dst);
    });
    const shDataTable = new DataTable(shColumns);
    const paletteSize = Math.min(64, 2 ** Math.floor(Math.log2(indices.length / 1024))) * 1024;

    const { centroids, labels } = await kmeansCpu(shDataTable, paletteSize, iterations);
    const codebook = await cluster1dCpu(centroids, iterations);

    const centroidsWidth = 64 * shCoeffs;
    const centroidsHeight = Math.ceil(centroids.numRows / 64);
    const centroidsBuf = new Uint8Array(centroidsWidth * centroidsHeight * 4);
    const centroidsRow = {};
    for (let i = 0; i < centroids.numRows; ++i) {
        codebook.labels.getRow(i, centroidsRow);
        for (let j = 0; j < shCoeffs; ++j) {
            const x = centroidsRow[shColumnNames[shCoeffs * 0 + j]];
            const y = centroidsRow[shColumnNames[shCoeffs * 1 + j]];
            const z = centroidsRow[shColumnNames[shCoeffs * 2 + j]];
            const pos = i * shCoeffs * 4 + j * 4;
            centroidsBuf[pos] = x;
            centroidsBuf[pos + 1] = y;
            centroidsBuf[pos + 2] = z;
            centroidsBuf[pos + 3] = 0xff;
        }
    }

    const labelsBuf = new Uint8Array(width * height * 4);
    for (let i = 0; i < indices.length; ++i) {
        const label = labels[i];
        labelsBuf[i * 4] = 0xff & label;
        labelsBuf[i * 4 + 1] = 0xff & (label >> 8);
        labelsBuf[i * 4 + 2] = 0;
        labelsBuf[i * 4 + 3] = 0xff;
    }

    const centroidsWebp = await encodeWebP(centroidsBuf, centroidsWidth, centroidsHeight);
    const labelsWebp = await encodeWebP(labelsBuf, width, height);

    return {
        count: paletteSize,
        bands: shBands,
        codebook: Array.from(codebook.centroids.getColumn(0).data),
        centroidsWebp: centroidsWebp,
        labelsWebp: labelsWebp
    };
};

// ---------------- Main ----------------
const gsplatDataToSog = async (gsplatData, options = {}) => {
    const { iterations = 8, maxSHBands = 3 } = options;

    try {
        const baseMembers = [
            'x', 'y', 'z',
            'scale_0', 'scale_1', 'scale_2',
            'f_dc_0', 'f_dc_1', 'f_dc_2', 'opacity',
            'rot_0', 'rot_1', 'rot_2', 'rot_3'
        ];
        const shCoeffsTotal = [0, 3, 8, 15][maxSHBands];
        const memberNames = [...baseMembers, ...shNames.slice(0, shCoeffsTotal * 3)];

        const { dataTable, count } = await extractFromGSplatData(gsplatData, memberNames);

        const width = Math.ceil(Math.sqrt(count) / 4) * 4;
        const height = Math.ceil(count / width / 4) * 4;

        await yieldToRender();
        const indices = generateMortonIndices(dataTable);

        const bufferWriter = new BufferWriter();
        const zipWriter = new ZipWriter(bufferWriter);

        const means = await writeMeans(dataTable, indices, width, height);
        await zipWriter.file('means_l.webp', means.meansL);
        await zipWriter.file('means_u.webp', means.meansU);

        const quatsWebp = await writeQuaternions(dataTable, indices, width, height);
        await zipWriter.file('quats.webp', quatsWebp);

        const scales = await writeScales(dataTable, indices, width, height, iterations);
        await zipWriter.file('scales.webp', scales.webp);

        const colors = await writeColors(dataTable, indices, width, height, iterations);
        await zipWriter.file('sh0.webp', colors.webp);

        const dataSHBands = (() => {
            const idx = shNames.findIndex(v => !dataTable.hasColumn(v));
            return { 9: 1, 24: 2, [-1]: 3 }[idx] ?? 0;
        })();
        const outputSHBands = Math.min(dataSHBands, maxSHBands);
        const shN = outputSHBands > 0 ?
            await writeSH(dataTable, indices, width, height, outputSHBands, iterations) :
            null;
        if (shN) {
            await zipWriter.file('shN_centroids.webp', shN.centroidsWebp);
            await zipWriter.file('shN_labels.webp', shN.labelsWebp);
        }

        const meta = {
            version: 2,
            asset: { generator: 'SuperSplat-CPU' },
            count,
            means: { mins: means.mins, maxs: means.maxs, files: ['means_l.webp', 'means_u.webp'] },
            scales: { codebook: scales.codebook, files: ['scales.webp'] },
            quats: { files: ['quats.webp'] },
            sh0: { codebook: colors.codebook, files: ['sh0.webp'] }
        };
        if (shN) {
            meta.shN = {
                count: shN.count,
                bands: shN.bands,
                codebook: shN.codebook,
                files: ['shN_centroids.webp', 'shN_labels.webp']
            };
        }
        const metaJson = new TextEncoder().encode(JSON.stringify(meta));
        await zipWriter.file('meta.json', metaJson);

        await zipWriter.close();
        const zipBuffers = bufferWriter.close();

        const totalLength = zipBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
        const sogBinary = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of zipBuffers) {
            sogBinary.set(buf, offset);
            offset += buf.byteLength;
        }
        if (offset !== totalLength) {
            throw new Error(`Buffer合并失败：预期${totalLength}字节，实际${offset}字节`);
        }

        return sogBinary;
    } catch (error) {
        console.log(error);
    }
};

export { gsplatDataToSog };
