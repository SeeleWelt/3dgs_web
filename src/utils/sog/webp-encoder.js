/**
 * Vue CLI终极版 WebP无损编码工具
 * 适配：public/webp/webp.mjs + public/webp/webp.wasm
 * 核心：通过index.html的<script>全局引入，直接调用window.createModule
 * （Emscripten打包WASM的官方推荐加载方式）
 */
// Module实例缓存
let webpModule = null;
let modulePromise = null;

/**
 * 初始化WASM模块（单例+异常重置，直接调用全局createModule）
 */
const initWebPModule = async () => {
  if (webpModule) return webpModule;
  if (modulePromise) return modulePromise;

  // 检查全局createModule是否存在（验证index.html的<script>是否引入成功）
  if (typeof window.createModule !== 'function') {
    throw new Error('全局createModule方法不存在，请检查public/index.html是否正确引入/webp/webp.mjs');
  }

  modulePromise = (async () => {
    try {
      // 直接调用全局createModule，初始化WASM
      webpModule = await window.createModule({
        locateFile: (path) => {
          // 指向public/webp下的wasm文件，浏览器直接请求
          if (path.endsWith('.wasm')) {
            return '/webp/webp.wasm';
          }
          return path;
        }
      });
      return webpModule;
    } catch (err) {
      modulePromise = null;
      console.error('WebP WASM模块初始化失败：', err);
      throw err;
    }
  })();

  return await modulePromise;
};

/**
 * 核心方法：RGBA编码为无损WebP（保留原有业务逻辑，无任何修改）
 * @param rgba - Canvas的RGBA Uint8Array数据
 * @param width - 图片宽度
 * @param height - 图片高度
 * @returns WebP的Uint8Array数据
 */
const encodeWebP = async (rgba, width, height) => {
  const Module = await initWebPModule();
  const stride = width * 4;
  const inPtr = Module._malloc(rgba.length);
  const outPtrPtr = Module._malloc(4);
  const outSizePtr = Module._malloc(4);

  try {
    Module.HEAPU8.set(rgba, inPtr);
    const encodeOk = Module._webp_encode_lossless_rgba(inPtr, width, height, stride, outPtrPtr, outSizePtr);
    if (!encodeOk) throw new Error('WebP无损编码失败，请检查图片RGBA数据/宽高是否合法');

    const outPtr = Module.HEAPU32[outPtrPtr >> 2];
    const outSize = Module.HEAPU32[outSizePtr >> 2];
    const webpData = Module.HEAPU8.slice(outPtr, outPtr + outSize);

    Module._webp_free(outPtr);
    return webpData;
  } finally {
    Module._free(inPtr);
    Module._free(outPtrPtr);
    Module._free(outSizePtr);
  }
};

export { encodeWebP };