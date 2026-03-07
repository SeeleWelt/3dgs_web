import { Picker as PickerPC, Vec3, Vec4 } from 'playcanvas';

// 复用原有的类型化数组和向量常量
const float32 = new Float32Array(1);
const uint8 = new Uint8Array(float32.buffer);
const two = new Vec4(2, 2, 2, 1);
const one = new Vec4(1, 1, 1, 0);

class Picker {
    /**
     * 初始化屏幕拾取器
     * @param {import('playcanvas').AppBase} app - PlayCanvas 应用实例
     * @param {import('playcanvas').Entity} camera - 用于拾取的相机实体（需包含 camera 组件）
     */
    constructor(app, camera) {
        this.app = app;
        this.camera = camera;
        this.picker = null; // 延迟初始化 PickerPC 实例
    }

    /**
     * 根据屏幕坐标拾取 3D 世界坐标
     * @param {number} x - 屏幕X坐标（像素值）
     * @param {number} y - 屏幕Y坐标（像素值）
     * @returns {Promise<import('playcanvas').Vec3|null>} 3D世界坐标，拾取失败返回null
     */
    async pick(x, y, width, height) {
        const app = this.app;
        const camera = this.camera;
        const graphicsDevice = app.graphicsDevice;


        // 适配 WebGL2 与非 WebGL2 的 Y 轴坐标差异
        y = graphicsDevice.isWebGL2 ? height - y - 1 : y;

        // 按需创建 PickerPC 实例（避免初始化时占用资源）
        if (!this.picker) {
            this.picker = new PickerPC(app, width, height);
        }

        const picker = this.picker;
        // 调整拾取器尺寸与画布匹配
        picker.resize(width, height);
        // 准备拾取环境：绑定相机、场景和渲染层
        picker.prepare(
            camera.camera,
            app.scene,  
            [app.scene.layers.getLayerByName('World')] // 仅拾取 "World" 层的物体
        );
        // 渲染并读取目标像素的颜色缓冲区（包含深度信息）
        const pixels = await picker.renderTarget.colorBuffer.read(x, y, 1, 1, {
            renderTarget: picker.renderTarget,
            immediate: true
        });

        // 若 pixels 长度不是 4 或全为 0，直接返回 null
        if (!pixels || pixels.length !== 4 || pixels.every(v => v === 0)) {
        console.error("无效像素数据，拾取失败");
        return null;
        }

        // 解码深度值后添加日志
        for (let i = 0; i < 4; ++i) {
        uint8[i] = pixels[i];
        }
        const depth = float32[0];

        // 增强校验：深度值无效直接返回 null
        if (!isFinite(depth) || depth <= 0 || depth >= 1) {
            return null;
        }
        // 1. 屏幕坐标 -> 裁剪空间坐标（NDC 标准化设备坐标）
        const pos = new Vec4(x / width, y / height, depth, 1)
            .mul(two) // 缩放为 [-1,1] 范围
            .sub(one); // 偏移到标准裁剪空间

        // 适配非 WebGL2 环境的 Y 轴方向
        if (!graphicsDevice.isWebGL2) {
            pos.y *= -1;
        }

        // 2. 裁剪空间 -> 视图空间（逆投影变换）
        camera.camera.projectionMatrix.clone().invert().transformVec4(pos, pos);

        // 3. 透视除法（齐次坐标转 3D 坐标）
        pos.mulScalar(1.0 / pos.w);

        // 4. 视图空间 -> 世界空间（应用相机的世界变换）
        const pos3 = new Vec3(pos.x, pos.y, pos.z);
        camera.getWorldTransform().transformPoint(pos3, pos3);

        return pos3;
    }
}

export { Picker };