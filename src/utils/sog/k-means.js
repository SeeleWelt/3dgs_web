/**
 * K-means clustering algorithm using WebGPU compute shaders.
 * Port of splat-transform's k-means.ts.
 * 转换为纯JavaScript版本，移除所有TypeScript类型注解
 */


import { Column, DataTable } from './data-table';
import { GpuClustering } from './gpu-clustering';

/**
 * Use Floyd's algorithm to pick m unique random indices from 0..n-1.
 */
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

/**
 * In the 1D case, use quantile-based initialization for better handling of skewed data.
 */
const initializeCentroids1D = (dataTable, centroids) => {
    const data = dataTable.getColumn(0).data;
    const n = dataTable.numRows;
    const k = centroids.numRows;

    // Sort data to compute quantiles
    const sorted = Float32Array.from(data).sort((a, b) => a - b);

    const centroidsData = centroids.getColumn(0).data;
    for (let i = 0; i < k; ++i) {
        // Place centroid at the center of its expected cluster region
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

    for (let i = 0; i < k; ++i) {
        clusters[i] = [];
    }

    for (let i = 0; i < labels.length; ++i) {
        clusters[labels[i]].push(i);
    }

    return clusters;
};

/**
 * Perform k-means clustering using WebGPU compute shaders.
 *
 * @param points - DataTable of points to cluster
 * @param k - Number of clusters
 * @param iterations - Number of iterations to run
 * @param device - WebGPU graphics device
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns Centroids and cluster assignments
 */
const kmeans = async (
    points,
    k,
    iterations,
    device,
    onProgress
) => {
    // too few data points
    if (points.numRows < k) {
        return {
            centroids: points.clone(),
            labels: new Uint32Array(points.numRows).map((_, i) => i)
        };
    }

    const row = {};

    // construct centroids data table and assign initial values
    const centroids = new DataTable(points.columns.map(c => new Column(c.name, new Float32Array(k))));
    if (points.numColumns === 1) {
        initializeCentroids1D(points, centroids);
    } else {
        initializeCentroids(points, centroids, row);
    }

    const gpuClustering = new GpuClustering(device, points.numColumns, k);
    const labels = new Uint32Array(points.numRows);

    let converged = false;
    let steps = 0;

    while (!converged) {
        await gpuClustering.execute(points, centroids, labels);

        // calculate the new centroid positions
        const groups = groupLabels(labels, k);
        for (let i = 0; i < centroids.numRows; ++i) {
            if (groups[i].length === 0) {
                // re-seed this centroid to a random point to avoid zero vector
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

        if (steps >= iterations) {
            converged = true;
        }
    }

    gpuClustering.destroy();

    return { centroids, labels };
};

/**
 * Cluster a multi-column DataTable into 256 clusters.
 * Returns labels (indices into 256 centroids) and the centroid codebook.
 *
 * @param dataTable - DataTable with multiple columns to cluster
 * @param iterations - Number of k-means iterations
 * @param device - WebGPU graphics device
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns Labels DataTable with same shape as input, and centroids array
 */
const cluster1d = async (
    dataTable,
    iterations,
    device,
    onProgress
) => {
    const { numColumns, numRows } = dataTable;

    // construct 1d points from the columns of data
    const data = new Float32Array(numRows * numColumns);
    for (let i = 0; i < numColumns; ++i) {
        data.set(dataTable.getColumn(i).data, i * numRows);
    }

    const src = new DataTable([new Column('data', data)]);

    const { centroids, labels } = await kmeans(src, 256, iterations, device, onProgress);

    // order centroids smallest to largest
    const centroidsData = centroids.getColumn(0).data;
    const order = Array.from(centroidsData).map((_, i) => i);
    order.sort((a, b) => centroidsData[a] - centroidsData[b]);

    // reorder centroids
    const tmp = centroidsData.slice();
    for (let i = 0; i < order.length; ++i) {
        centroidsData[i] = tmp[order[i]];
    }

    const invOrder = [];
    for (let i = 0; i < order.length; ++i) {
        invOrder[order[i]] = i;
    }

    // reorder labels
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

export { kmeans, cluster1d };