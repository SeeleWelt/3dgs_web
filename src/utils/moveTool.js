// 从PlayCanvas SDK中导入内置的平移Gizmo类
import { TranslateGizmo } from 'playcanvas';

// 导入本地自定义的父类和工具类
import { TransformTool } from './transform-tool';
import { Events } from '../events';
import { Scene } from '../scene';

// 定义MoveTool类，继承自TransformTool
class MoveTool extends TransformTool {
    /**
     * 构造函数：初始化移动工具
     * @param {Events} events - 事件管理实例
     * @param {Scene} scene - 场景管理实例
     */
    constructor(events, scene) {
        // 1. 创建PlayCanvas平移Gizmo实例（与TS逻辑一致）
        const gizmo = new TranslateGizmo(scene.camera.entity.camera, scene.gizmoLayer);

        // 2. 调用父类TransformTool的构造函数，传递初始化参数
        super(gizmo, events, scene);
    }
}

// 导出MoveTool类，供其他文件导入使用
export { MoveTool };