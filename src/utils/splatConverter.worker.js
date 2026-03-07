// 导入所需的模块（注意：Worker中无法直接import，需确保这些模块支持Worker环境）
import {
    readFile,
    writeFile,
    getInputFormat,
    getOutputFormat,
    MemoryReadFileSystem,
    MemoryFileSystem,
    WebPCodec,
    logger
} from '@playcanvas/splat-transform';

if (typeof self !== 'undefined') {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
        ? import.meta.env.BASE_URL
        : '/';
    console.log('Worker base URL:', base);
    WebPCodec.wasmUrl = new URL(`${base}webp.wasm`, self.location.origin).toString();
    console.log('Worker WebPCodec.wasmUrl:', WebPCodec.wasmUrl);
}

const emitProgress = (payload = {}) => {
    self.postMessage({
        type: 'progress',
        ...payload
    });
};

const postResultToMainThread = (payload = {}) => {
    const transferList = [];
    const candidate = payload?.outputBuffer;

    if (candidate instanceof ArrayBuffer) {
        transferList.push(candidate);
    } else if (ArrayBuffer.isView(candidate) && candidate.buffer instanceof ArrayBuffer) {
        transferList.push(candidate.buffer);
    }

    if (transferList.length > 0) {
        self.postMessage(payload, transferList);
        return;
    }

    self.postMessage(payload);
};

const formatArgs = (args) => args
    .map((item) => {
        if (typeof item === 'string') {
            return item;
        }
        try {
            return JSON.stringify(item);
        } catch (error) {
            return String(item);
        }
    })
    .join(' ');

const setupWorkerLogger = () => {
    logger.setQuiet(false);
    logger.setLogger({
        log: (...args) => emitProgress({ level: 'log', message: formatArgs(args) }),
        warn: (...args) => emitProgress({ level: 'warn', message: formatArgs(args) }),
        error: (...args) => emitProgress({ level: 'error', message: formatArgs(args) }),
        debug: (...args) => emitProgress({ level: 'debug', message: formatArgs(args) }),
        output: (text) => emitProgress({ level: 'output', message: typeof text === 'string' ? text : String(text) }),
        onProgress: (node) => {
            const total = Number(node?.totalSteps || 0);
            const step = Number(node?.step || 0);
            const ratio = total > 0 ? step / total : 0;
            emitProgress({
                level: 'progress',
                message: node?.stepName || '',
                step,
                total,
                ratio,
                depth: Number(node?.depth || 0)
            });
        }
    });
};

const createWebGpuDeviceFactory = () => {
    let tried = false;
    let device = null;

    return async () => {
        if (tried) {
            return device || undefined;
        }

        tried = true;

        if (!self.navigator?.gpu) {
            emitProgress({ level: 'info', message: 'WebGPU is not supported in this environment. Using CPU compression.' });
            return undefined;
        }

        try {
            if (typeof self.window === 'undefined') {
                self.window = self;
            }

            const { createGraphicsDevice, DEVICETYPE_WEBGPU } = await import('playcanvas');
            const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : null;
            if (!canvas) {
                emitProgress({ level: 'info', message: 'OffscreenCanvas is not supported in this worker. Using CPU compression.' });
                return undefined;
            }

            const created = await createGraphicsDevice(canvas, {
                deviceTypes: [DEVICETYPE_WEBGPU],
                antialias: false,
                depth: false,
                stencil: false,
                powerPreference: 'high-performance'
            });

            if (!created?.isWebGPU) {
                created?.destroy?.();
                emitProgress({ level: 'info', message: 'Failed to create a WebGPU device. Using CPU compression.' });
                return undefined;
            }

            device = created;
            emitProgress({ level: 'info', message: 'WebGPU acceleration enabled.' });
            return device;
        } catch (error) {
            emitProgress({
                level: 'warn',
                message: `Failed to create WebGPU device. Falling back to CPU: ${error?.message || error}`
            });
            return undefined;
        }
    };
};

// 监听主线程消息
self.onmessage = async (e) => {
    setupWorkerLogger();
    const createDevice = createWebGpuDeviceFactory();
    let gpuDevice = null;

    try {
        const { buffer, fileName } = e.data;
        emitProgress({ level: 'info', message: 'Starting SOG conversion...' });
        
        // PLY转SOG核心逻辑
        const inputName = fileName.endsWith('.ply') ? fileName : `${fileName}.ply`;
        const inputFormat = getInputFormat(inputName);
        const fileSystem = new MemoryReadFileSystem();
        fileSystem.set(inputName, new Uint8Array(buffer));

        // 让出时间片（Worker中无需yieldToUI，直接异步处理）
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const dataTables = await readFile({
            filename: inputName,
            inputFormat,
            options: { iterations: 10 },
            params: [],
            fileSystem
        });

        // Write to in-memory buffer
        const memFs = new MemoryFileSystem();
        const outputFormat = getOutputFormat('output.sog', {});
        await new Promise(resolve => setTimeout(resolve, 0));
        
        await writeFile({
            filename: 'output.sog',
            outputFormat,
            dataTable: dataTables[0],
            options: { iterations: 10 },
            createDevice: async () => {
                gpuDevice = await createDevice();
                return gpuDevice;
            }
        }, memFs);

        // Get the output data
        const outputBuffer = memFs.results.get('output.sog');
        emitProgress({ level: 'success', message: 'SOG conversion completed.', done: true });

        // 向主线程发送结果
        postResultToMainThread({
            success: true,
            outputBuffer,
            fileName
        });
    } catch (error) {
        emitProgress({ level: 'error', message: error?.message || 'SOG conversion failed.', done: true });
        // 发送错误信息
        self.postMessage({
            success: false,
            error: error.message
        });
    } finally {
        try {
            gpuDevice?.destroy?.();
        } catch (error) {
            emitProgress({ level: 'warn', message: `Failed to release WebGPU device: ${error?.message || error}` });
        }
    }
};