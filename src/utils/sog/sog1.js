import { Column, DataTable } from './data-table';
import { getGpuDevice, destroyGpuDevice } from './gpu-device';
import { cluster1d, kmeans } from './k-means';
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

// 写入位置数据为双WebP（高低位）
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

// 写入四元数旋转为WebP
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

        // 四元数归一化
        const l = Math.sqrt(q[0] ** 2 + q[1] ** 2 + q[2] ** 2 + q[3] ** 2);
        for (let j = 0; j < 4; ++j) q[j] /= l || 1;

        // 最大分量优化
        let maxComp = 0;
        for (let j = 1; j < 4; ++j) {
            if (Math.abs(q[j]) > Math.abs(q[maxComp])) maxComp = j;
        }
        if (q[maxComp] < 0) for (let j = 0; j < 4; ++j) q[j] *= -1;

        // 缩放适配
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

// K-means聚类压缩缩放并写入WebP
const writeScales = async (dataTable, indices, width, height, iterations, device) => {
    const scaleNames = ['scale_0', 'scale_1', 'scale_2'];
    const scaleColumns = scaleNames.map((name) => {
        const src = dataTable.getColumnByName(name).data;
        const dst = new Float32Array(indices.length);
        for (let i = 0; i < indices.length; ++i) dst[i] = src[indices[i]];
        return new Column(name, dst);
    });
    const scaleTable = new DataTable(scaleColumns);
    
    const scaleData = await cluster1d(scaleTable, iterations, device);

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

// K-means聚类压缩颜色+透明度并写入WebP
const writeColors = async (dataTable, indices, width, height, iterations, device) => {
    const colorNames = ['f_dc_0', 'f_dc_1', 'f_dc_2'];
    const colorColumns = colorNames.map((name) => {
        const src = dataTable.getColumnByName(name).data;
        const dst = new Float32Array(indices.length);
        for (let i = 0; i < indices.length; ++i) dst[i] = src[indices[i]];
        return new Column(name, dst);
    });
    const colorTable = new DataTable(colorColumns);
    
    const colorData = await cluster1d(colorTable, iterations, device);

    // 透明度Sigmoid变换
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

// K-means聚类压缩SH高阶系数并写入WebP
const writeSH = async (dataTable, indices, width, height, shBands, iterations, device) => {
    if (shBands === 0) return null;
    const shCoeffs = [0, 3, 8, 15][shBands];
    const shColumnNames = shNames.slice(0, shCoeffs * 3);

    // 检查SH列是否存在
    for (const name of shColumnNames) {
        if (!dataTable.hasColumn(name)) return null;
    }

    // 提取SH数据
    const shColumns = shColumnNames.map((name) => {
        const src = dataTable.getColumnByName(name).data;
        const dst = new Float32Array(indices.length);
        for (let i = 0; i < indices.length; ++i) dst[i] = src[indices[i]];
        return new Column(name, dst);
    });
    const shDataTable = new DataTable(shColumns);
    const paletteSize = Math.min(64, 2 ** Math.floor(Math.log2(indices.length / 1024))) * 1024;

    // 双层聚类
    const { centroids, labels } = await kmeans(shDataTable, paletteSize, iterations, device);
    const codebook = await cluster1d(centroids, iterations, device);

    // 写入聚类中心
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

    // 写入标签
    const labelsBuf = new Uint8Array(width * height * 4);
    for (let i = 0; i < indices.length; ++i) {
        const label = labels[i];
        labelsBuf[i * 4] = 0xff & label;
        labelsBuf[i * 4 + 1] = 0xff & (label >> 8);
        labelsBuf[i * 4 + 2] = 0;
        labelsBuf[i * 4 + 3] = 0xff;
    }

    // 编码WebP
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

/**
 * GSplatData 转 SOG 二进制Uint8Array
 * @param {import('playcanvas').GSplatData} gsplatData PlayCanvas高斯点数据
 * @param {Object} [options] 配置
 * @param {number} [options.iterations=10] K-means聚类迭代次数
 * @param {number} [options.maxSHBands=3] 最大SH阶数（0=关闭）
 * @returns {Promise<Uint8Array>} SOG二进制数据
 */
const gsplatDataToSog = async (gsplatData, options = {}) => {
    const { iterations = 5, maxSHBands = 3 } = options;
    let gpuDevice = null;

    try {
        // 定义提取属性（基础+SH）
        const baseMembers = [
            'x', 'y', 'z',
            'scale_0', 'scale_1', 'scale_2',
            'f_dc_0', 'f_dc_1', 'f_dc_2', 'opacity',
            'rot_0', 'rot_1', 'rot_2', 'rot_3'
        ];
        const shCoeffsTotal = [0, 3, 8, 15][maxSHBands];
        const memberNames = [...baseMembers, ...shNames.slice(0, shCoeffsTotal * 3)];

        // 提取数据到DataTable
        const { dataTable, count } = await extractFromGSplatData(gsplatData, memberNames);

        // 计算GPU友好纹理尺寸（4的倍数）
        const width = Math.ceil(Math.sqrt(count) / 4) * 4;
        const height = Math.ceil(count / width / 4) * 4;

        // 生成莫顿索引
        await yieldToRender();
        const indices = generateMortonIndices(dataTable);

        // 初始化WebGPU设备
        gpuDevice = await getGpuDevice();
        const device = gpuDevice.device;

        // 初始化打包器
        const bufferWriter = new BufferWriter();
        const zipWriter = new ZipWriter(bufferWriter);

        // 写入位置数据
        const means = await writeMeans(dataTable, indices, width, height);
        await zipWriter.file('means_l.webp', means.meansL);
        await zipWriter.file('means_u.webp', means.meansU);

        // 写入旋转数据
        const quatsWebp = await writeQuaternions(dataTable, indices, width, height);
        await zipWriter.file('quats.webp', quatsWebp);

        // 写入缩放数据
        const scales = await writeScales(dataTable, indices, width, height, iterations, device);
        await zipWriter.file('scales.webp', scales.webp);

        // 写入颜色+透明度
        const colors = await writeColors(dataTable, indices, width, height, iterations, device);
        await zipWriter.file('sh0.webp', colors.webp);

        // 写入SH高阶系数
        const dataSHBands = (() => {
            const idx = shNames.findIndex(v => !dataTable.hasColumn(v));
            return { 9: 1, 24: 2, [-1]: 3 }[idx] ?? 0;
        })();
        const outputSHBands = Math.min(dataSHBands, maxSHBands);
        const shN = outputSHBands > 0 ?
            await writeSH(dataTable, indices, width, height, outputSHBands, iterations, device) :
            null;
        if (shN) {
            await zipWriter.file('shN_centroids.webp', shN.centroidsWebp);
            await zipWriter.file('shN_labels.webp', shN.labelsWebp);
        }

        // 生成并写入meta.json
        const meta = {
            version: 2,
            asset: { generator: 'SuperSplat' },
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

        // 关闭打包器
        await zipWriter.close();
        const zipBuffers = bufferWriter.close();

        // 合并二进制缓冲区
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
    } finally {
        // 销毁GPU设备
        if (gpuDevice) destroyGpuDevice();
    }
};

export { gsplatDataToSog };