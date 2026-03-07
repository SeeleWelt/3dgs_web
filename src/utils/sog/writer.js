// defines the interface for a stream writer class. all functions are async.

// write data to a file stream
class FileStreamWriter {
    constructor(stream) {
        let cursor = 0;

        stream.seek(0);

        this.write = async (data) => {
            cursor += data.byteLength;
            await stream.write(data);
        };

        this.close = async () => {
            await stream.truncate(cursor);
            await stream.close();
            return true;
        };
    }
}

// write data to a memory buffer
class BufferWriter {
    constructor() {
        const buffers = [];
        let buffer;
        let cursor = 0;

        this.write = (data) => {
            let readcursor = 0;

            while (readcursor < data.byteLength) {
                const readSize = data.byteLength - readcursor;

                // allocate buffer
                if (!buffer) {
                    buffer = new Uint8Array(Math.max(5 * 1024 * 1024, readSize));
                }

                const writeSize = buffer.byteLength - cursor;
                const copySize = Math.min(readSize, writeSize);

                buffer.set(data.subarray(readcursor, readcursor + copySize), cursor);

                readcursor += copySize;
                cursor += copySize;

                if (cursor === buffer.byteLength) {
                    buffers.push(buffer);
                    buffer = null;
                    cursor = 0;
                }
            }
        };

        this.close = () => {
            if (buffer) {
                buffers.push(new Uint8Array(buffer.buffer, 0, cursor));
                buffer = null;
                cursor = 0;
            }
            return buffers;
        };
    }
}

// write to a memory download buffer and trigger a browser download when closed
class DownloadWriter {
    constructor(filename) {
        const bufferWriter = new BufferWriter();

        this.write = (data) => {
            bufferWriter.write(data);
        };

        this.close = () => {
            const buffers = bufferWriter.close();

            // download file to client
            const blob = new Blob(buffers, { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);

            const lnk = document.createElement('a');
            lnk.download = filename;
            lnk.href = url;

            // create a "fake" click-event to trigger the download
            if (document.createEvent) {
                const e = document.createEvent('MouseEvents');
                e.initMouseEvent('click', true, true, window,
                    0, 0, 0, 0, 0, false, false, false,
                    false, 0, null);
                lnk.dispatchEvent(e);
            } else {
                lnk.fireEvent?.('onclick');
            }

            window.URL.revokeObjectURL(url);

            return true;
        };
    }
}

class ProgressWriter {
    constructor(writer, totalBytes, progress) {
        let cursor = 0;

        this.write = async (data) => {
            cursor += data.byteLength;
            await writer.write(data);
            progress?.(cursor, totalBytes);
        };

        this.close = () => {
            if (cursor !== totalBytes) {
                throw new Error(`ProgressWriter: expected ${totalBytes} bytes, but wrote ${cursor} bytes`);
            }
            progress?.(cursor, totalBytes);
            return totalBytes;
        };
    }
}

export { FileStreamWriter, BufferWriter, DownloadWriter, ProgressWriter };