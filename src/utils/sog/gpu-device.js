/**
 * WebGPU device management for SOG compression.
 * Creates a standalone WebGPU graphics device using PlayCanvas's WebgpuGraphicsDevice.
 * 纯JS版本：移除TS类型注解，适配浏览器原生JS环境
 */
import {
    PIXELFORMAT_BGRA8,
    Texture,
    WebgpuGraphicsDevice
} from 'playcanvas';

/**
 * Wrapper for a WebGPU graphics device used for compute operations.
 * WebGPU设备包装类：管理设备和后台缓冲区，提供销毁方法
 */
class GpuDevice {
    constructor(device, backbuffer) {
        this.device = device;
        this.backbuffer = backbuffer;
    }

    // 销毁设备和缓冲区，释放WebGPU资源
    destroy() {
        this.backbuffer.destroy();
        this.device.destroy();
    }
}

// 缓存GPU设备，避免重复创建（跨导出复用）
let cachedDevice = null;

/**
 * Create or retrieve a cached WebGPU device for compute operations.
 * 创建设备/获取缓存的WebGPU设备，仅创建一次并复用
 * @returns {Promise<GpuDevice>} GpuDevice实例
 * @throws {Error} WebGPU不可用时抛出错误
 */
const getGpuDevice = async () => {
    // 已有缓存设备，直接返回
    if (cachedDevice) {
        return cachedDevice;
    }

    // 检测WebGPU是否可用
    if (!navigator.gpu) {
        throw new Error('WebGPU is not available in this browser');
    }

    // 创建最小化canvas（PlayCanvas创建WebGPU设备必需）
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;

    // 初始化PlayCanvas WebGPU图形设备
    const graphicsDevice = new WebgpuGraphicsDevice(canvas, {
        antialias: false,
        depth: false,
        stencil: false
    });

    // 真正创建WebGPU设备（异步）
    await graphicsDevice.createDevice();

    // 创建PlayCanvas要求的外部后台缓冲区
    const backbuffer = new Texture(graphicsDevice, {
        width: 1024,
        height: 512,
        name: 'SogComputeBackbuffer',
        mipmaps: false,
        format: PIXELFORMAT_BGRA8
    });

    // 绑定外部后台缓冲区（PlayCanvas内部属性，忽略语法提示）
    graphicsDevice.externalBackbuffer = backbuffer;

    // 缓存设备并返回
    cachedDevice = new GpuDevice(graphicsDevice, backbuffer);
    return cachedDevice;
};

/**
 * Destroy the cached GPU device if it exists.
 * 销毁缓存的GPU设备，清理资源
 * 建议在序列化完成/页面销毁时调用
 */
const destroyGpuDevice = () => {
    if (cachedDevice) {
        cachedDevice.destroy();
        cachedDevice = null;
    }
};

// 导出核心方法和类，供其他模块调用
export { GpuDevice, getGpuDevice, destroyGpuDevice };