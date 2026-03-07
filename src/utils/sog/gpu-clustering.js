/**
 * WebGPU compute shader for k-means clustering.
 * Port of splat-transform's gpu-clustering.ts using PlayCanvas Compute API.
 */
import {
    BUFFERUSAGE_COPY_DST,
    BUFFERUSAGE_COPY_SRC,
    SHADERLANGUAGE_WGSL,
    SHADERSTAGE_COMPUTE,
    UNIFORMTYPE_UINT,
    BindGroupFormat,
    BindStorageBufferFormat,
    BindUniformBufferFormat,
    Compute,
    FloatPacking,
    Shader,
    StorageBuffer,
    UniformBufferFormat,
    UniformFormat
} from 'playcanvas';

// import { DataTable } from './data-table';

/**
 * 生成WGSL计算着色器代码（适配列数、F16精度）
 * @param {number} numColumns 数据列数
 * @param {boolean} useF16 是否使用F16浮点精度（节省显存，需设备支持）
 * @returns {string} WGSL着色器代码
 */
const clusterWgsl = (numColumns, useF16) => {
    const floatType = useF16 ? 'f16' : 'f32';

    return /* wgsl */ `
${useF16 ? 'enable f16;' : ''}

struct Uniforms {
    numPoints: u32,
    numCentroids: u32
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> points: array<${floatType}>;
@group(0) @binding(2) var<storage, read> centroids: array<${floatType}>;
@group(0) @binding(3) var<storage, read_write> results: array<u32>;

const numColumns = ${numColumns};   // number of columns in the points and centroids tables
const chunkSize = 128u;             // must be a multiple of 64
var<workgroup> sharedChunk: array<${floatType}, numColumns * chunkSize>;

// calculate the squared distance between the point and centroid
fn calcDistanceSqr(point: array<${floatType}, numColumns>, centroid: u32) -> f32 {
    var result = 0.0;

    var ci = centroid * numColumns;

    for (var i = 0u; i < numColumns; i++) {
        let v = f32(point[i] - sharedChunk[ci+i]);
        result += v * v;
    }

    return result;
}

@compute @workgroup_size(64)
fn main(
    @builtin(local_invocation_index) local_id : u32,
    @builtin(global_invocation_id) global_id: vec3u,
    @builtin(num_workgroups) num_workgroups: vec3u
) {
    // calculate row index for this thread point
    let pointIndex = global_id.x + global_id.y * num_workgroups.x * 64u;

    // copy the point data from global memory
    var point: array<${floatType}, numColumns>;
    if (pointIndex < uniforms.numPoints) {
        for (var i = 0u; i < numColumns; i++) {
            point[i] = points[pointIndex * numColumns + i];
        }
    }

    var mind = 1000000.0;
    var mini = 0u;

    // work through the list of centroids in shared memory chunks
    let numChunks = u32(ceil(f32(uniforms.numCentroids) / f32(chunkSize)));
    for (var i = 0u; i < numChunks; i++) {

        // copy this thread's slice of the centroid shared chunk data
        let dstRow = local_id * (chunkSize / 64u);
        let srcRow = min(uniforms.numCentroids, i * chunkSize + local_id * chunkSize / 64u);
        let numRows = min(uniforms.numCentroids, srcRow + chunkSize / 64u) - srcRow;

        var dst = dstRow * numColumns;
        var src = srcRow * numColumns;

        for (var c = 0u; c < numRows * numColumns; c++) {
            sharedChunk[dst + c] = centroids[src + c];
        }

        // wait for all threads to finish writing their part of centroids shared memory buffer
        workgroupBarrier();

        // loop over the next chunk of centroids finding the closest
        if (pointIndex < uniforms.numPoints) {
            let thisChunkSize = min(chunkSize, uniforms.numCentroids - i * chunkSize);
            for (var c = 0u; c < thisChunkSize; c++) {
                let d = calcDistanceSqr(point, c);
                if (d < mind) {
                    mind = d;
                    mini = i * chunkSize + c;
                }
            }
        }

        // next loop will overwrite the shared memory, so wait
        workgroupBarrier();
    }

    if (pointIndex < uniforms.numPoints) {
        results[pointIndex] = mini;
    }
}
`;
};

/**
 * 向上取整到指定倍数
 * @param {number} value 目标值
 * @param {number} multiple 倍数
 * @returns {number} 取整后的值
 */
const roundUp = (value, multiple) => {
    return Math.ceil(value / multiple) * multiple;
};

/**
 * 将DataTable的列数据交叉存储到定型数组（适配F16/F32）
 * @param {Uint16Array|Float32Array} result 输出数组（F16=Uint16Array，F32=Float32Array）
 * @param {DataTable} dataTable 源数据表
 * @param {number} numRows 要处理的行数
 * @param {number} rowOffset 行偏移量
 */
const interleaveData = (result, dataTable, numRows, rowOffset) => {
    const { numColumns } = dataTable;

    if (result instanceof Uint16Array) {
        // 交叉存储F16（半精度），通过FloatPacking转成16位无符号整数
        for (let c = 0; c < numColumns; ++c) {
            const column = dataTable.columns[c];
            for (let r = 0; r < numRows; ++r) {
                result[r * numColumns + c] = FloatPacking.float2Half(column.data[rowOffset + r]);
            }
        }
    } else {
        // 交叉存储F32（单精度）浮点数据
        for (let c = 0; c < numColumns; ++c) {
            const column = dataTable.columns[c];
            for (let r = 0; r < numRows; ++r) {
                result[r * numColumns + c] = column.data[rowOffset + r];
            }
        }
    }
};

/**
 * GPU加速的k-means聚类核心类
 * 基于WebGPU计算着色器，为每个点快速查找最近的聚类中心，适配高斯溅射大数据量场景
 * @class GpuClustering
 * @param {import('playcanvas').WebgpuGraphicsDevice} device PlayCanvas WebGPU图形设备
 * @param {number} numColumns 数据列数（对应高斯点的属性维度）
 * @param {number} numCentroids 聚类中心数量（k值）
 */
class GpuClustering {
    constructor(device, numColumns, numCentroids) {
        this.device = device;
        this.numColumns = numColumns;
        this.numCentroids = numCentroids;

        // 检测设备是否支持F16着色器精度，支持则使用（节省显存/提升速度）
        this.useF16 = !!(('supportsShaderF16' in device) && device.supportsShaderF16);

        // 计算着色器工作组配置：64线程/工作组，1024工作组/批次
        const workgroupSize = 64;
        const workgroupsPerBatch = 1024;
        this.batchSize = workgroupsPerBatch * workgroupSize;

        // 创建绑定组格式：关联UniformBuffer和3个StorageBuffer（点/聚类中心/结果）
        this.bindGroupFormat = new BindGroupFormat(device, [
            new BindUniformBufferFormat('uniforms', SHADERSTAGE_COMPUTE),
            new BindStorageBufferFormat('pointsBuffer', SHADERSTAGE_COMPUTE, true),
            new BindStorageBufferFormat('centroidsBuffer', SHADERSTAGE_COMPUTE, true),
            new BindStorageBufferFormat('resultsBuffer', SHADERSTAGE_COMPUTE)
        ]);

        // 创建聚类计算着色器（WGSL）
        this.shader = new Shader(device, {
            name: 'compute-cluster',
            shaderLanguage: SHADERLANGUAGE_WGSL,
            cshader: clusterWgsl(numColumns, this.useF16),
            computeUniformBufferFormats: {
                uniforms: new UniformBufferFormat(device, [
                    new UniformFormat('numPoints', UNIFORMTYPE_UINT),
                    new UniformFormat('numCentroids', UNIFORMTYPE_UINT)
                ])
            },
            computeBindGroupFormat: this.bindGroupFormat
        });

        // 初始化交叉存储的数组（适配F16/F32），行数列数交叉排列，GPU内存访问更友好
        this.interleavedPoints = this.useF16 ?
            new Uint16Array(roundUp(numColumns * this.batchSize, 2)) :
            new Float32Array(numColumns * this.batchSize);
        this.interleavedCentroids = this.useF16 ?
            new Uint16Array(roundUp(numColumns * numCentroids, 2)) :
            new Float32Array(numColumns * numCentroids);
        // 初始化聚类结果数组（每个点对应一个聚类中心索引，32位无符号整数）
        this.resultsData = new Uint32Array(this.batchSize);

        // 创建WebGPU存储缓冲区：点数据/聚类中心（仅拷贝目标），结果（拷贝源+目标）
        this.pointsBuffer = new StorageBuffer(
            device,
            this.interleavedPoints.byteLength,
            BUFFERUSAGE_COPY_DST
        );

        this.centroidsBuffer = new StorageBuffer(
            device,
            this.interleavedCentroids.byteLength,
            BUFFERUSAGE_COPY_DST
        );

        this.resultsBuffer = new StorageBuffer(
            device,
            this.resultsData.byteLength,
            BUFFERUSAGE_COPY_SRC | BUFFERUSAGE_COPY_DST
        );

        // 初始化PlayCanvas Compute计算对象，关联着色器和缓冲区
        this.compute = new Compute(device, this.shader, 'compute-cluster');
        this.compute.setParameter('pointsBuffer', this.pointsBuffer);
        this.compute.setParameter('centroidsBuffer', this.centroidsBuffer);
        this.compute.setParameter('resultsBuffer', this.resultsBuffer);
    }

    /**
     * 执行GPU聚类：为每个点查找最近的聚类中心
     * @param {DataTable} points 待聚类的点数据表（高斯点属性）
     * @param {DataTable} centroids 聚类中心数据表
     * @param {Uint32Array} labels 输出数组：存储每个点的聚类中心索引（长度=points.numRows）
     * @returns {Promise<void>}
     */
    async execute(points, centroids, labels) {
        const numPoints = points.numRows;
        const numBatches = Math.ceil(numPoints / this.batchSize);

        // 上传聚类中心数据到GPU缓冲区（一次性上传，所有批次复用）
        interleaveData(this.interleavedCentroids, centroids, this.numCentroids, 0);
        this.centroidsBuffer.write(0, this.interleavedCentroids, 0, this.interleavedCentroids.length);
        this.compute.setParameter('numCentroids', this.numCentroids);

        // 分批次处理点数据（避免GPU缓冲区溢出，适配百万级高斯点）
        for (let batch = 0; batch < numBatches; batch++) {
            const currentBatchSize = Math.min(numPoints - batch * this.batchSize, this.batchSize);
            const groups = Math.ceil(currentBatchSize / 64);

            // 上传当前批次的点数据到GPU缓冲区
            interleaveData(this.interleavedPoints, points, currentBatchSize, batch * this.batchSize);
            const writeLength = this.useF16 ?
                roundUp(this.numColumns * currentBatchSize, 2) :
                this.numColumns * currentBatchSize;
            this.pointsBuffer.write(0, this.interleavedPoints, 0, writeLength);
            this.compute.setParameter('numPoints', currentBatchSize);

            // 配置并调度WebGPU计算任务
            this.compute.setupDispatch(groups);
            this.device.computeDispatch([this.compute], `cluster-dispatch-${batch}`);

            // 从GPU读取聚类结果，写入输出labels数组
            await this.resultsBuffer.read(0, currentBatchSize * 4, this.resultsData, true);
            labels.set(this.resultsData.subarray(0, currentBatchSize), batch * this.batchSize);
        }
    }

    /**
     * 销毁GPU资源（释放缓冲区、着色器、绑定组等），避免内存泄漏
     */
    destroy() {
        this.pointsBuffer.destroy();
        this.centroidsBuffer.destroy();
        this.resultsBuffer.destroy();
        this.shader.destroy();
        this.bindGroupFormat.destroy();
    }
}

export { GpuClustering };