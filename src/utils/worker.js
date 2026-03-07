// sog-converter.worker.js
import {
    readFile,
    writeFile,
    getInputFormat,
    getOutputFormat,
    MemoryReadFileSystem,
    MemoryFileSystem,
} from '@playcanvas/splat-transform';

// 监听主线程消息
self.onmessage = async (e) => {
    try {
        const { buffer, fileName } = e.data;
        
        // PLY转SOG核心逻辑
        const inputName = fileName.endsWith('.ply') ? fileName : `${fileName}.ply`;
        const inputFormat = getInputFormat(inputName);
        const fileSystem = new MemoryReadFileSystem();
        fileSystem.set(inputName, new Uint8Array(buffer));

        // 读取PLY文件
        const dataTables = await readFile({
            filename: inputName,
            inputFormat,
            options: { iterations: 10 },
            params: [],
            fileSystem
        });

        // 写入SOG文件到内存
        const memFs = new MemoryFileSystem();
        const outputFormat = getOutputFormat('output.sog', {});
        await writeFile({
            filename: 'output.sog',
            outputFormat,
            dataTable: dataTables[0],
            options: { iterations: 10 }
        }, memFs);

        // 获取转换后的SOG数据
        const outputBuffer = memFs.results.get('output.sog');
        
        // 发送结果回主线程
        self.postMessage({
            success: true,
            buffer: outputBuffer,
            fileName
        }, [outputBuffer]); // 传输缓冲区，避免拷贝
    } catch (error) {
        // 发送错误信息
        self.postMessage({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
};