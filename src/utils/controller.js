
import {
    math,
    DualGestureSource,
    FlyController,
    GamepadSource,
    InputFrame,
    KeyboardMouseSource,
    MultiTouchSource,
    OrbitController,
    Pose,
    PROJECTION_PERSPECTIVE,
    Vec2,
    Vec3,
    BoundingBox,
    GSplatData
} from 'playcanvas';
import * as pc from 'playcanvas';
import { Splat, State } from './splat';
import { gsplatDataToSog } from './sog/sog1.cpu';
import { message } from 'ant-design-vue';
// 移除 TypeScript type 定义，直接使用对象/数组
const tmpV1 = new Vec3();
const tmpV2 = new Vec3();

const pose = new Pose();

const frame = new InputFrame({
    move: [0, 0, 0],
    rotate: [0, 0, 0]
});


// const gizmoTheme = {
//     // 基础形状颜色（X红/Y绿/Z蓝/F面灰/XYZ整体浅灰，所有alpha=0）
//     shapeBase: {
//     x: new pc.Color(1, 0, 0,1), 
//     y: new pc.Color(0, 1, 0,1), 
//     z: new pc.Color(0, 0, 1, 1), 
//     f: new pc.Color(0.7, 0.7, 0.7, 1), 
//     xyz: new pc.Color(0.9, 0.9, 0.9, 1) 
//     },
//     // 悬浮形状颜色（比基础色更亮，所有alpha=0）
//     shapeHover: {
//     x: new pc.Color(1, 0.3, 0.3, 0), // 浅红 X轴悬浮
//     y: new pc.Color(0.3, 1, 0.3, 0), // 浅绿 Y轴悬浮
//     z: new pc.Color(0.3, 0.3, 1, 0), // 浅蓝 Z轴悬浮
//     f: new pc.Color(0.85, 0.85, 0.85, 0), // 浅灰 面悬浮
//     xyz: new pc.Color(0.95, 0.95, 0.95, 0) // 极浅灰 整体悬浮
//     },
//     // 辅助线颜色（比基础轴色浅，所有alpha=0）
//     guideBase: {
//     x: new pc.Color(1, 0.2, 0.2, 0), // 浅红 X轴辅助线
//     y: new pc.Color(0.2, 1, 0.2, 0), // 浅绿 Y轴辅助线
//     z: new pc.Color(0.2, 0.2, 1, 0)  // 浅蓝 Z轴辅助线
//     },
//     // 辅助线遮挡值（默认0.8，保持标准值）
//     guideOcclusion: 0.8,
//     // 禁用状态颜色（暗灰色，alpha=0）
//     disabled: new pc.Color(0.4, 0.4, 0.4, 0)
// };

export const damp = (damping, dt) => 1 - Math.pow(damping, dt * 1000);

const getNow = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
const yieldToUI = () => new Promise((resolve) => {
    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => resolve(), { timeout: 50 });
    } else if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => resolve());
    } else {
        setTimeout(resolve, 0);
    }
});

const applyDeadZone = (stick, low, high) => {
    const mag = Math.sqrt(stick[0] * stick[0] + stick[1] * stick[1]);
    if (mag < low) {
        stick.fill(0);
        return;
    }
    const scale = (mag - low) / (high - low);
    stick[0] *= scale / mag;
    stick[1] *= scale / mag;
};

const screenToWorld = (camera, dx, dy, dz, out = new Vec3()) => {
    const { system, fov, aspectRatio, horizontalFov, projection, orthoHeight } = camera;
    const { width, height } = system.app.graphicsDevice.clientRect;

    // normalize deltas to device coord space
    out.set(
        -(dx / width) * 2,
        (dy / height) * 2,
        0
    );

    // calculate half size of the view frustum at the current distance
    const halfSize = tmpV2.set(0, 0, 0);
    if (projection === PROJECTION_PERSPECTIVE) {
        const halfSlice = dz * Math.tan(0.5 * fov * math.DEG_TO_RAD);
        if (horizontalFov) {
            halfSize.set(
                halfSlice,
                halfSlice / aspectRatio,
                0
            );
        } else {
            halfSize.set(
                halfSlice * aspectRatio,
                halfSlice,
                0
            );
        }
    } else {
        halfSize.set(
            orthoHeight * aspectRatio,
            orthoHeight,
            0
        );
    }

    // scale by device coord space
    out.mul(halfSize);

    return out;
};

class CameraControls {
    constructor(app, camera, observer) {
        this._app = app;
        this._camera = camera;
        this._observer = observer;
        
        // 初始化属性（移除类型注解）
        this._zoomRange = new Vec2();
        this._desktopInput = new KeyboardMouseSource();
        this._orbitMobileInput = new MultiTouchSource();
        this._flyMobileInput = new DualGestureSource();
        this._gamepadInput = new GamepadSource();
        this._flyController = new FlyController();
        this._orbitController = new OrbitController();
        this._controller = null;
        this._pose = new Pose();
        this._mode = null;
        this._rotation = this._camera.entity.getEulerAngles();

        // 核心变更：单一Splat实例属性（初始为null）
        this._splat = null;
        // 记录当前关联的entity，用于判断是否需要重新创建Splat
        this._currentSplatEntity = null;

        // 状态对象（移除类型注解）
        this._state = {
            axis: new Vec3(),
            mouse: [0, 0, 0],
            shift: 0,
            ctrl: 0,
            touches: 0
        };

        // 可配置属性（移除类型注解）
        this.moveSpeed = 3;
        this.orbitSpeed = 5;
        this.pinchSpeed = 0.4;
        this.wheelSpeed = 0.06;
        this.gamepadDeadZone = new Vec2(0.3, 0.6);
        this.stopNormal = false;
        this.rotation = 0; // 屏幕旋转角度：0/90/-90
        this.autoRotateSpeed = 30; 
        this.autoRotateFrameAngle= 0;
        this.cameraResetDuration = 0.35;
        this._cameraResetTransition = null;
        this._lastResetFocus = null;
        this.hasUserInteracted = false;
        this._lastCantFlyWarningTime = 0; // 上次无法进入飞行模式提示的时间

        this.isFirstTouchRecorded = false; // 首次触摸记录标记
        this.pixelToAngleRatio = 3.33; // 初始默认值，首次触摸后会自动更新

        // 触摸点击检测相关配置和状态
        this.touchTapThreshold = 10; // 拖动阈值（像素），小于此值视为点击
        this.touchTapCallback = null; // 点击回调函数
        this._touchStartPos = null; // 触摸开始位置
        this._touchMoved = false; // 触摸是否已拖动
        this._touchActive = false; // 是否有活跃的触摸

        // 虚拟摇杆相关配置（固定左下角）
        this._joystickConfig = {
            radius: 60, // 摇杆圆圈半径（像素）
            thumbRadius: 20, // 摇杆小球半径（像素）
            deadZone: 0.1, // 死区大小（0-1）
            maxDistance: 50, // 小球最大移动距离（像素，相对圆圈中心）
            opacity: 0.7, // 透明度
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // 圆圈背景色
            thumbColor: 'rgba(255, 255, 255, 0.8)', // 小球颜色
            borderColor: 'rgba(255, 255, 255, 1)', // 边框颜色
            borderWidth: 2, // 边框宽度
            fixedMargin: 100, // 固定边距（距离屏幕边缘的距离，适配左下角）
        };


        // 虚拟摇杆状态（核心变更：移除touchStartCenter，新增固定centerPos）
        this._joystick = {
            element: null, // 摇杆容器元素
            background: null, // 摇杆圆圈元素
            thumb: null, // 摇杆小球元素
            centerPos: null, // 摇杆圆圈固定中心（左下角，适配旋转）
            currentPos: null, // 当前触摸位置
            stickValue: [0, 0], // 摇杆输出值（-1到1）
            touchId: null, // 对应的触摸ID
            isTouching: false, // 仅标记是否正在触摸摇杆（非激活状态）
        };

        this._rotateTouch = {
            isActive: false,       // 右侧旋转触摸是否激活
            touchId: null,         // 对应的触摸ID
            startPos: null,        // 触摸开始位置
            lastPos: null,         // 上一帧触摸位置
            delta: [0, 0]          // 触摸偏移量（对应 rightInput 的 [x, y]）
        };

        // set orbit controller defaults
        this._orbitController.zoomRange = new Vec2(4, 50);
        this._orbitController.pitchRange = new Vec2(-90, 90);
        this._orbitController.rotateDamping = 0.98;
        this._orbitController.moveDamping = 0.98;
        this._orbitController.zoomDamping = 0.90;

        // set fly controller defaults
        this._flyController.pitchRange = new Vec2(-90, 90);
        this._flyController.rotateDamping = 0.97;
        this._flyController.moveDamping = 0.97;

        // attach input
        this._desktopInput.attach(this._app.graphicsDevice.canvas);
        this._orbitMobileInput.attach(this._app.graphicsDevice.canvas);
        // this._flyMobileInput.attach(this._app.graphicsDevice.canvas);
        this._gamepadInput.attach(this._app.graphicsDevice.canvas);

        // 监听触摸事件，用于检测单纯点击和摇杆控制
        this._setupTouchEventListeners();

        // 移动端检测只做一次
        this.isMobile = this._isMobileDevice();
        console.log('是否移动端设备:', this.isMobile);
        // 只在移动端创建摇杆UI
        if (this.isMobile) {
            this._createJoystickUI();
        }

        // 初始化摇杆固定中心位置
        if (this.isMobile) {
            this._updateJoystickFixedCenter();
        }

        // pose
        
        this._pose.look(this._camera.entity.getPosition(), Vec3.ZERO);
        
        // mode
        this.mode = 'orbit';
        this.gizmos =[];
        this._sogProgressHandler = null;
    }

    setSogProgressHandler(handler) {
        this._sogProgressHandler = typeof handler === 'function' ? handler : null;
    }

    clearSogProgressHandler() {
        this._sogProgressHandler = null;
    }

    _emitSogProgress(payload) {
        if (typeof this._sogProgressHandler !== 'function') {
            return;
        }

        try {
            this._sogProgressHandler(payload);
        } catch (error) {
            console.warn('SOG progress callback failed:', error);
        }
    }

    // 私有方法：获取/创建Splat实例（核心修改）
    _getSplatInstance(entity) {
        // 如果entity变化 或 无Splat实例 → 重新创建
        if (!this._splat || this._currentSplatEntity !== entity) {
            this._splat = new Splat(entity);
            this._currentSplatEntity = entity;
        }
        return this._splat;
    }

    // 模式切换回调
    setModeChangeCallback(cb) {
        this._modeChangeCallback = typeof cb === 'function' ? cb : null;
    }

    // 私有方法：更新摇杆固定中心位置（适配屏幕旋转和窗口大小）
    _updateJoystickFixedCenter() {
        const joystick = this._joystick;
        const config = this._joystickConfig;
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const halfRadius = config.radius; // 圆圈半径的一半（中心偏移量）

        // 根据屏幕旋转角度，计算左下角固定中心位置
        switch (this.rotation) {
            case 0:
                // 0°（正常竖屏）：左下角（距离左、下边缘fixedMargin）
                joystick.centerPos = {
                    x: config.fixedMargin / 2 + halfRadius,
                    y: winHeight - config.fixedMargin - halfRadius
                };
                break;
            case -90:
                // -90°（向左旋转）：左上角（距离左、上边缘fixedMargin）
                joystick.centerPos = {
                    x: config.fixedMargin + halfRadius,
                    y: config.fixedMargin + halfRadius
                };
                break;
            case 90:
                // 90°（向右旋转）：右下角（距离右、下边缘fixedMargin）
                joystick.centerPos = {
                    x: winWidth - config.fixedMargin - halfRadius,
                    y: winHeight - config.fixedMargin - halfRadius
                };
                break;
            default:
                // 默认：0°竖屏左下角
                joystick.centerPos = {
                    x: config.fixedMargin + halfRadius,
                    y: winHeight - config.fixedMargin - halfRadius
                };
                break;
        }

        // 更新摇杆容器的固定位置
        if (joystick.element) {
            joystick.element.style.left = `${joystick.centerPos.x - halfRadius}px`;
            joystick.element.style.top = `${joystick.centerPos.y - halfRadius}px`;
        }
    }

    // 私有方法：创建虚拟摇杆UI元素（核心变更：固定左下角定位，不跟随触摸）
    _createJoystickUI() {
        const body = document.body;
        const config = this._joystickConfig;
        const joystick = this._joystick;
        const halfRadius = config.radius;

        // 创建摇杆容器（固定定位，左下角）
        const joystickEl = document.createElement('div');
        joystickEl.style.position = 'fixed'; // 固定定位，不随屏幕滚动/触摸移动
        joystickEl.style.pointerEvents = 'none'; // 容器不拦截事件，仅用于承载元素
        joystickEl.style.opacity = '0'; // 默认隐藏
        joystickEl.style.transition = 'opacity 0.2s ease';
        joystickEl.style.zIndex = '1000'; // 确保在最上层
        // 固定容器大小，与圆圈一致
        joystickEl.style.width = `${config.radius * 2}px`;
        joystickEl.style.height = `${config.radius * 2}px`;
        // 初始位置（后续由_updateJoystickFixedCenter更新）
        joystickEl.style.left = `${config.fixedMargin}px`;
        joystickEl.style.top = `${window.innerHeight - config.fixedMargin - config.radius * 2}px`;

        // 创建摇杆圆圈背景
        const backgroundEl = document.createElement('div');
        backgroundEl.style.position = 'absolute';
        backgroundEl.style.width = `${config.radius * 2}px`;
        backgroundEl.style.height = `${config.radius * 2}px`;
        backgroundEl.style.borderRadius = '50%';
        backgroundEl.style.backgroundColor = config.backgroundColor;
        backgroundEl.style.border = `${config.borderWidth}px solid ${config.borderColor}`;
        backgroundEl.style.opacity = `${config.opacity}`;
        backgroundEl.style.boxSizing = 'border-box';
        backgroundEl.style.left = '0';
        backgroundEl.style.top = '0';
        backgroundEl.style.pointerEvents = 'none'; // 圆圈不拦截事件

        // 创建摇杆小球
        const thumbEl = document.createElement('div');
        thumbEl.style.position = 'absolute';
        thumbEl.style.width = `${config.thumbRadius * 2}px`;
        thumbEl.style.height = `${config.thumbRadius * 2}px`;
        thumbEl.style.borderRadius = '50%';
        thumbEl.style.backgroundColor = config.thumbColor;
        thumbEl.style.opacity = `${config.opacity}`;
        thumbEl.style.boxSizing = 'border-box';
        thumbEl.style.pointerEvents = 'none'; // 小球不拦截事件
        // 初始位置：圆圈中心
        thumbEl.style.left = `${halfRadius - config.thumbRadius}px`;
        thumbEl.style.top = `${halfRadius - config.thumbRadius}px`;

        // 组装摇杆元素
        joystickEl.appendChild(backgroundEl);
        joystickEl.appendChild(thumbEl);
        body.appendChild(joystickEl);

        // 保存引用
        joystick.element = joystickEl;
        joystick.background = backgroundEl;
        joystick.thumb = thumbEl;
    }
            // 4. 计算小球相对圆圈中心的偏移（核心：限制在圆圈内）
            // 判断是否为移动端
    _isMobileDevice() {
        // 只用于构造时检测
        return /Mobi|Android|iPhone|iPad|iPod|Mobile|Tablet|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // 私有方法：更新摇杆UI位置和状态（飞行模式自动显示，固定左下角）
    _updateJoystickUI() {
        if (!this.isMobile) return;
        const joystick = this._joystick;
        const config = this._joystickConfig;
        const halfRadius = config.radius;

        // 1. 模式判断：仅飞行模式显示，轨道模式隐藏
        if (this._mode !== 'fly') {
            joystick.element.style.opacity = '0';
            // 飞行模式退出时重置摇杆状态
            joystick.stickValue = [0, 0];
            joystick.isTouching = false;
            joystick.touchId = null;
            joystick.currentPos = null;
            // 重置小球位置到圆圈中心
            joystick.thumb.style.left = `${halfRadius - config.thumbRadius}px`;
            joystick.thumb.style.top = `${halfRadius - config.thumbRadius}px`;
            return;
        }

        // 2. 飞行模式：显示摇杆，确保固定中心位置最新
        this._updateJoystickFixedCenter();
        joystick.element.style.opacity = '1';
        joystick.element.style.pointerEvents = 'none';

        // 3. 无活跃触摸时，直接返回（保持当前状态）
        if (!joystick.isTouching || !joystick.centerPos || !joystick.currentPos) {
            return;
        }

        const center = joystick.centerPos;
        const current = joystick.currentPos;
        // 转换为相对摇杆容器的本地坐标（容器左上角为原点）
        const localX = current.x - (center.x - halfRadius);
        const localY = current.y - (center.y - halfRadius);
        let dx = localX - halfRadius;
        let dy = localY - halfRadius;

        // 计算偏移距离，限制在圆圈有效范围内（扣除小球半径，避免超出）
        const maxValidDistance = halfRadius - config.thumbRadius;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxValidDistance) {
            // 超出范围时，按比例缩放偏移量，保持方向不变
            const scale = maxValidDistance / distance;
            dx *= scale;
            dy *= scale;
        }

        // 5. 更新小球位置（基于固定圆圈中心，确保在圆圈内）
        joystick.thumb.style.left = `${halfRadius - config.thumbRadius + dx}px`;
        joystick.thumb.style.top = `${halfRadius - config.thumbRadius + dy}px`;
    }

    // 私有方法：计算摇杆输出值（核心变更：基于固定左下角中心，限制在maxDistance内）
    _calculateStickValue(touchPos) {
        const joystick = this._joystick;
        const config = this._joystickConfig;

        // 无固定中心时，返回0值
        if (!joystick.centerPos) return [0, 0];
        const center = joystick.centerPos;

        // 计算相对固定中心的偏移
        const dx = touchPos.x - center.x;
        const dy = touchPos.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 1. 死区处理
        if (distance < config.deadZone * config.maxDistance) {
            return [0, 0];
        }

        // 2. 限制最大距离（相对固定中心的最大偏移）
        const clampedDistance = Math.min(distance, config.maxDistance);

        // 3. 计算归一化输出值（-1 到 1），修复上下方向反转
        const x = dx / clampedDistance;
        const y = -dy / clampedDistance;

        return [x, y];
    }

    // 辅助方法：判断触摸点是否在左下角摇杆区域内（固定范围）
    _isTouchInFixedJoystickArea(touchPos) {
        const joystick = this._joystick;
        const config = this._joystickConfig;

        // 无固定中心时，返回false
        if (!joystick.centerPos) return false;

        // 计算触摸点与摇杆中心的距离
        const dx = touchPos.x - joystick.centerPos.x;
        const dy = touchPos.y - joystick.centerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 触摸点在摇杆圆圈范围内（扩大1.5倍，提升触摸容错）
        return distance <= config.radius * 1.5;
    }

    // 私有方法：设置触摸事件监听器（核心优化：仅响应左下角固定摇杆区域触摸）
    _setupTouchEventListeners() {
        const canvas = this._app.graphicsDevice.canvas;
        const joystick = this._joystick;
        const config = this._joystickConfig;

        // 触摸开始：仅响应左下角固定摇杆区域的触摸
        canvas.addEventListener('touchstart', (e) => {
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                const touchPos = { x: touch.clientX, y: touch.clientY };
                const touchId = touch.identifier;

                // 1. 飞行模式 + 触摸点在固定摇杆区域 + 未被其他触摸占用 → 响应摇杆
                if (this._mode === 'fly' && !joystick.touchId && this._isTouchInFixedJoystickArea(touchPos)) {
                    // 设置摇杆触摸状态
                    joystick.isTouching = true;
                    joystick.touchId = touchId;
                    joystick.currentPos = { ...touchPos };

                    // 计算初始摇杆输出值
                    joystick.stickValue = this._calculateStickValue(touchPos);
                    e.preventDefault(); // 阻止默认滚动，提升体验
                    continue; // 跳过其他逻辑
                }

                // 2. 原有轨道模式点击逻辑（不变）
                if (this._mode === 'orbit' && !this._touchActive) {
                    this._touchStartPos = {
                        x: touchPos.x,
                        y: touchPos.y,
                        touchId: touchId,
                        time: Date.now()
                    };
                    this._touchMoved = false;
                    this._touchActive = true;
                }

                // 3. 原有飞行模式右侧旋转触摸逻辑（不变）
                if (this._mode === 'fly' && !this._rotateTouch.isActive) {
                    let isInValidArea = false;
                    const winWidth = window.innerWidth;
                    const winHeight = window.innerHeight;
                    switch (this.rotation) {
                        case 0:
                            isInValidArea = touchPos.x > winWidth / 2;
                            break;
                        case -90:
                            isInValidArea = touchPos.y > winHeight / 2;
                            break;
                        case 90:
                            isInValidArea = touchPos.y < winHeight / 2;
                            break;
                    }
                    if (isInValidArea) {
                        this._rotateTouch.isActive = true;
                        this._rotateTouch.touchId = touchId;
                        this._rotateTouch.startPos = { ...touchPos };
                        this._rotateTouch.lastPos = { ...touchPos };
                        this._rotateTouch.delta = [0, 0];
                        continue;
                    }
                }
            }
        });

        // 触摸移动：仅更新固定摇杆区域内的触摸状态
        canvas.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                const touchPos = { x: touch.clientX, y: touch.clientY };
                const touchId = touch.identifier;

                // 1. 飞行模式 + 摇杆正在被触摸 → 更新摇杆
                if (this._mode === 'fly' && joystick.isTouching && touchId === joystick.touchId) {
                    // 更新当前触摸位置
                    joystick.currentPos = { ...touchPos };

                    // 计算新的摇杆输出值
                    joystick.stickValue = this._calculateStickValue(touchPos);

                    // 更新摇杆UI（自动限制小球在圆圈内）
                    this._updateJoystickUI();

                    e.preventDefault();
                    continue;
                }

                // 2. 原有轨道模式拖动判断逻辑（不变）
                if (this._mode === 'orbit' && this._touchActive && this._touchStartPos?.touchId === touchId) {
                    const dx = touchPos.x - this._touchStartPos.x;
                    const dy = touchPos.y - this._touchStartPos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > this.touchTapThreshold) {
                        this._touchMoved = true;
                    }
                }

                // 3. 原有飞行模式右侧旋转触摸逻辑（不变）
                if (this._mode === 'fly' && this._rotateTouch.isActive && touchId === this._rotateTouch.touchId) {
                    const dx = touchPos.x - this._rotateTouch.lastPos.x;
                    const dy = touchPos.y - this._rotateTouch.lastPos.y;
                    const normalizedX = dx;
                    const normalizedY = dy;
                    this._rotateTouch.delta = [normalizedX, normalizedY];
                    this._rotateTouch.lastPos = { ...touchPos };
                    continue;
                }
            }
        });

        // 触摸结束：重置摇杆触摸状态
        canvas.addEventListener('touchend', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const touchId = touch.identifier;
                const touchPos = { x: touch.clientX, y: touch.clientY };

                // 1. 飞行模式 + 摇杆正在被触摸 → 重置摇杆状态
                if (this._mode === 'fly' && joystick.isTouching && touchId === joystick.touchId) {
                    joystick.isTouching = false;
                    joystick.stickValue = [0, 0];
                    joystick.touchId = null;
                    joystick.currentPos = null;

                    // 重置小球位置到圆圈中心
                    const halfRadius = config.radius;
                    joystick.thumb.style.left = `${halfRadius - config.thumbRadius}px`;
                    joystick.thumb.style.top = `${halfRadius - config.thumbRadius}px`;
                    continue;
                }

                // 2. 原有轨道模式点击回调逻辑（不变）
                if (this._mode === 'orbit' && this._touchActive && this._touchStartPos?.touchId === touchId) {
                    if (!this._touchMoved) {
                        const rect = canvas.getBoundingClientRect();
                        const offsetX = Math.max(0, Math.min(Math.round(touchPos.x - rect.left), rect.width));
                        const offsetY = Math.max(0, Math.min(Math.round(touchPos.y - rect.top), rect.height));

                        if (typeof this.touchTapCallback === 'function') {
                            this.touchTapCallback({
                                offsetX,
                                offsetY,
                                touchPosX: touchPos.x,
                                touchPosY: touchPos.y,
                                timestamp: Date.now()
                            });
                        }
                    }
                    this._touchStartPos = null;
                    this._touchMoved = false;
                    this._touchActive = false;
                }

                // 3. 原有飞行模式右侧旋转触摸逻辑（不变）
                if (this._mode === 'fly' && this._rotateTouch.isActive && touchId === this._rotateTouch.touchId) {
                    this._rotateTouch.isActive = false;
                    this._rotateTouch.touchId = null;
                    this._rotateTouch.startPos = null;
                    this._rotateTouch.lastPos = null;
                    this._rotateTouch.delta = [0, 0];
                    continue;
                }
            }
        });

        // 触摸取消：同上，重置摇杆状态
        canvas.addEventListener('touchcancel', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const touchId = touch.identifier;

                // 飞行模式 + 摇杆正在被触摸 → 重置摇杆状态
                if (this._mode === 'fly' && joystick.isTouching && touchId === joystick.touchId) {
                    joystick.isTouching = false;
                    joystick.stickValue = [0, 0];
                    joystick.touchId = null;
                    joystick.currentPos = null;

                    // 重置小球位置到圆圈中心
                    const halfRadius = config.radius;
                    joystick.thumb.style.left = `${halfRadius - config.thumbRadius}px`;
                    joystick.thumb.style.top = `${halfRadius - config.thumbRadius}px`;
                    continue;
                }

                // 原有轨道模式状态重置（不变）
                if (this._mode === 'orbit' && this._touchActive && this._touchStartPos?.touchId === touchId) {
                    this._touchStartPos = null;
                    this._touchMoved = false;
                    this._touchActive = false;
                }

                // 原有飞行模式右侧旋转触摸逻辑（不变）
                if (this._mode === 'fly' && this._rotateTouch.isActive && touchId === this._rotateTouch.touchId) {
                    this._rotateTouch.isActive = false;
                    this._rotateTouch.touchId = null;
                    this._rotateTouch.startPos = null;
                    this._rotateTouch.lastPos = null;
                    this._rotateTouch.delta = [0, 0];
                    continue;
                }
            }
        });

        // 新增：窗口大小变化时，更新摇杆固定中心和UI
        window.addEventListener('resize', () => {
            this._updateJoystickFixedCenter();
            if (this._mode === 'fly' && joystick.isTouching) {
                this._updateJoystickUI();
            }
        });

        // 新增：屏幕旋转角度变更时，更新摇杆固定中心
        this._app.on('rotationChanged', () => {
            this._updateJoystickFixedCenter();
            if (this._mode === 'fly' && joystick.isTouching) {
                this._updateJoystickUI();
            }
        });
    }

    // 设置触摸点击回调函数
    setTouchTapCallback(callback) {
        if (typeof callback === 'function' || callback === null) {
            this.touchTapCallback = callback;
        } else {
            console.warn('触摸点击回调必须是函数或null');
        }
    }

    // 缩放范围 getter/setter
    set zoomRange(range) {
        this._zoomRange.x = range.x;
        this._zoomRange.y = range.y <= range.x ? Infinity : range.y;
        this._orbitController.zoomRange = this._zoomRange;
    }

    get zoomRange() {
        return this._zoomRange;
    }

    // 模式 getter/setter（飞行模式激活时强制显示摇杆）
    set mode(mode) {
        const joystick = this._joystick;
        if (this._mode === mode) return;
        this._mode = mode;

        // 切换模式时重置摇杆状态
        joystick.isTouching = false;
        joystick.stickValue = [0, 0];
        joystick.touchId = null;
        joystick.currentPos = null;

        // 切换模式时重置点击状态
        this._touchStartPos = null;
        this._touchMoved = false;
        this._touchActive = false;

        // 切换控制器
        if (this._controller) this._controller.detach();
        switch (this._mode) {
            case 'orbit':
                this._controller = this._orbitController;
                break;
            case 'fly':
                this._controller = this._flyController;
                // 飞行模式激活时，强制更新摇杆UI（自动显示，固定左下角）
                this._updateJoystickFixedCenter();
                this._updateJoystickUI();
                break;
        }
        this._controller.attach(this._pose, false);
    }

    get mode() {
        return this._mode;
    }
    setCameraPosition(position){
        this._camera.entity.setPosition(position);
        console.log("获取角度", this._camera.entity.getPosition())
    }

    // 聚焦指定实体
    focusOnEntity(entity, position) {
        const aabb = this.calculateEntityAabb(entity);
        if (!aabb) return;
        const halfExtents = aabb.halfExtents;
        const radius = Math.max(halfExtents.x, halfExtents.y, halfExtents.z);
        const fov = this._camera.fov * math.DEG_TO_RAD;
        const fitDistance = radius*1.2 / Math.sin(0.5 * fov);
        const padding = 1.1;
        const targetDistance = fitDistance * padding;

        // 更新缩放范围：最小值为刚好看到物体的距离
        const currentZoomRange = this._orbitController.zoomRange || new Vec2(fitDistance, 50);
        const maxZoom = Math.max(currentZoomRange.y, targetDistance * 3);
        this.zoomRange = new Vec2(0, maxZoom);

        const modelYHeight = halfExtents.y * 2; 
        const yOffset = modelYHeight * 0.2; 

        const lookDir = position 
            ? new Vec3().subVectors(position, aabb.center).normalize() 
            : new Vec3(0, 0, 1); 

        const cameraTargetPos = aabb.center.clone()
            .add(lookDir.mulScalar(targetDistance))
            .add(new Vec3(0, yOffset, 0)); 

        this.reset(aabb.center, cameraTargetPos);
        return aabb.center;
    }

    // 计算实体包围盒
    calculateEntityAabb(entity) {
        const meshInstances = [];
        // 收集所有网格实例
        entity.findComponents('render').forEach(render => meshInstances.push(...render.meshInstances));
        entity.findComponents('model').forEach(model => meshInstances.push(...model.meshInstances));
        entity.findComponents('gsplat').forEach(gsplat => {
            if (gsplat.instance?.meshInstance) meshInstances.push(gsplat.instance.meshInstance);
        });

        if (meshInstances.length === 0) return null;
        const aabb = new BoundingBox();
        aabb.copy(meshInstances[0].aabb);
        meshInstances.slice(1).forEach(mi => aabb.add(mi.aabb));

        const splat = this._getSplatInstance(entity);
        if (!splat || !splat.splatData || splat.splatData.numSplats === 0) {
            console.warn('无法计算包围盒：无有效3DGS数据');
            return null;
        }
        const gsplatData = splat.splatData;
        const x = gsplatData.getProp('x');
        const y = gsplatData.getProp('y');
        const z = gsplatData.getProp('z');
        const numPoints = gsplatData.numSplats;

        // 直接计算 min/max
        let minX = x[0], maxX = x[0];
        let minY = y[0], maxY = y[0];
        let minZ = z[0], maxZ = z[0];

        for (let i = 1; i < numPoints; i++) {
            if (x[i] < minX) minX = x[i];
            if (x[i] > maxX) maxX = x[i];
            if (y[i] < minY) minY = y[i];
            if (y[i] > maxY) maxY = y[i];
            if (z[i] < minZ) minZ = z[i];
            if (z[i] > maxZ) maxZ = z[i];
        }

        const halfExtents = new Vec3(
            (maxX - minX) / 2,
            (maxY - minY) / 2,
            (maxZ - minZ) / 2
        );

        aabb.halfExtents.copy(halfExtents);
        return aabb;
    }

    /**
     * 生成符合PlayCanvas 3DGS规范的PLY文件（兼容官方工具链）
     * @param {pc.Entity} entity - 包含Gsplat的目标实体
     * @param {string} fileName - 下载文件名（默认：3dgs_filtered.ply）
     * @param {boolean} isBinary - 是否生成二进制格式（推荐true，符合3DGS标准）
     * @returns {boolean} 生成结果
     */
    generate3dgsFile(entity, fileName = '3dgs_filtered.ply', download=true) {
        const splat = this._getSplatInstance(entity);
        if (!splat || !splat.splatData || splat.splatData.numSplats === 0) {
            console.error('生成失败：无有效3DGS数据');
            return false;
        }

        const gsplatData = splat.splatData;
        const totalPoints = gsplatData.numSplats;
        const stateArray = gsplatData.getProp('state');
        // 1. 筛选未被删除的有效高斯点
        const validIndices = [];
        for (let i = 0; i < totalPoints; i++) {
            if (stateArray[i] !== State.deleted) {
                validIndices.push(i);
            }
        }

        if (validIndices.length === 0) {
            console.error('生成失败：无有效高斯点（已全部删除）');
            return false;
        }
        console.log(`生成3DGS PLY：保留 ${validIndices.length}/${totalPoints} 个高斯点`);

        // 2. 提取3DGS核心属性（严格遵循官方规范顺序）
        const props = {
            // 几何属性
            x: gsplatData.getProp('x'),
            y: gsplatData.getProp('y'),
            z: gsplatData.getProp('z'),
            scale_0: gsplatData.getProp('scale_0'),
            scale_1: gsplatData.getProp('scale_1'),
            scale_2: gsplatData.getProp('scale_2'),
            rot_0: gsplatData.getProp('rot_0'),
            rot_1: gsplatData.getProp('rot_1'),
            rot_2: gsplatData.getProp('rot_2'),
            rot_3: gsplatData.getProp('rot_3'),
            // 外观属性
            opacity: gsplatData.getProp('opacity'),
            f_dc_0: gsplatData.getProp('f_dc_0'),
            f_dc_1: gsplatData.getProp('f_dc_1'),
            f_dc_2: gsplatData.getProp('f_dc_2'),
            // 高阶球谐系数（f_rest_0 ~ f_rest_44，共45个）
            f_rest: []
        };

        // 加载45个高阶球谐系数
        for (let i = 0; i < 45; i++) {
            const restProp = gsplatData.getProp(`f_rest_${i}`);
            if (!restProp) {
                console.warn(`警告：缺少f_rest_${i}，使用默认值0`);
                props.f_rest.push(new Array(totalPoints).fill(0));
            } else {
                props.f_rest.push(restProp);
            }
        }

        return this._generateBinary3dgs(validIndices, props, fileName, download);
    }

    async _generateBinary3dgs(validIndices, props, fileName, download) {
        const pointCount = validIndices.length;
        const encoder = new TextEncoder();
        const timeSliceMs = 8;
        let lastYieldTime = getNow();
        
        const headerLines = [
            "ply",
            "format binary_little_endian 1.0",
            `element vertex ${pointCount}`,
            "property float x",
            "property float y",
            "property float z",
            "property float scale_0",
            "property float scale_1",
            "property float scale_2",
            "property float rot_0",
            "property float rot_1",
            "property float rot_2",
            "property float rot_3",
            "property float opacity",
            "property float f_dc_0",
            "property float f_dc_1",
            "property float f_dc_2"
        ];
        // 追加45个高阶球谐系数属性
        for (let i = 0; i < 45; i++) headerLines.push(`property float f_rest_${i}`);
        headerLines.push("end_header");
        // 拼接头部并添加换行符（关键：每个换行符占1字节）
        const headerStr = headerLines.join('\n') + '\n';
        // 精准计算头部字节数（TextEncoder.encode返回实际Uint8数组长度）
        const headerBytes = encoder.encode(headerStr);
        const headerByteLength = headerBytes.length;

        const floatByteSize = 4; // 每个float占4字节
        // 每个点的字节数：10(几何)+4(外观)+45(球谐) = 59个float → 59*4=236字节/点
        const bytesPerPoint = (10 + 4 + 45) * floatByteSize; 
        // 总缓冲区大小 = 头部字节数 + 所有点的字节数（无任何冗余/缺失）
        const totalBufferSize = headerByteLength + (pointCount * bytesPerPoint);
        console.log(`内存分配 → 头部: ${headerByteLength}字节 | 点数据: ${pointCount * bytesPerPoint}字节 | 总计: ${totalBufferSize}字节`);

        const buffer = new ArrayBuffer(totalBufferSize);
        const dataView = new DataView(buffer);
        let offset = 0;

        // 写入头部
        for (let i = 0; i < headerByteLength; i++) {
            if (offset >= totalBufferSize) {
                console.error('头部写入越界：offset=', offset, '总长度=', totalBufferSize);
                return null;
            }
            dataView.setUint8(offset++, headerBytes[i]);
        }

        for (let idx = 0; idx < validIndices.length; idx++) {
            const pointIndex = validIndices[idx];
            
            // 预校验：当前点的写入是否会越界
            const requiredOffset = offset + bytesPerPoint;
            if (requiredOffset > totalBufferSize) {
                console.error(`点${idx}写入越界 → 当前offset=${offset} | 需要offset=${requiredOffset} | 总长度=${totalBufferSize}`);
                return null;
            }

            // 几何属性（x/y/z/scale0-2/rot0-3  10个float）
            dataView.setFloat32(offset, props.x[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.y[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.z[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.scale_0[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.scale_1[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.scale_2[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.rot_0[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.rot_1[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.rot_2[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.rot_3[pointIndex], true); offset += floatByteSize;

            // 外观属性（opacity/f_dc0-2  4个float）
            dataView.setFloat32(offset, props.opacity[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.f_dc_0[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.f_dc_1[pointIndex], true); offset += floatByteSize;
            dataView.setFloat32(offset, props.f_dc_2[pointIndex], true); offset += floatByteSize;

            //  高阶球谐系数（f_rest0-44  45个float）
            for (let i = 0; i < 45; i++) {
                dataView.setFloat32(offset, props.f_rest[i][pointIndex], true);
                offset += floatByteSize;
            }

            if (getNow() - lastYieldTime >= timeSliceMs) {
                await yieldToUI();
                lastYieldTime = getNow();
            }
        }


        // 总写入偏移量是否等于总缓冲区大小
        if (offset !== totalBufferSize) {
            console.warn(`内存校验警告 → 写入偏移量(${offset}) ≠ 总长度(${totalBufferSize})`);
        }

        if(fileName.endsWith('.ply')){
            if(download)
            {
                try {
                    let blob = new Blob([buffer], { type: 'application/octet-stream' });
                    let url = URL.createObjectURL(blob);
                    let a = document.createElement('a');
                    
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    // 立即清理内存
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (e) {
                    console.error('❌ 二进制PLY生成失败：', e);
                    return null;
                }
            }
            return buffer;
        }
        else{
            const outputBuffer = await this._convertPlyBufferToSog(buffer, fileName);
            if(download)
            {
                try {
                    let blob = new Blob([outputBuffer], { type: 'application/octet-stream' });
                    let url = URL.createObjectURL(blob);
                    let a = document.createElement('a');
                    
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    // 立即清理内存
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (e) {
                    console.error('❌ 二进制PLY生成失败：', e);
                    return null;
                }
            }
            return outputBuffer
        }
    }

    async _convertPlyBufferToSog(buffer, fileName) {
        if (typeof Worker === 'undefined') {
            this._emitSogProgress({ level: 'info', message: 'Worker is not supported in this environment. Falling back to main-thread conversion.' });
            return this._convertPlyBufferToSogOnMainThread(buffer, fileName);
        }

        this._emitSogProgress({ level: 'info', message: 'Worker conversion started.' });

        return new Promise((resolve, reject) => {
            const worker = new Worker(new URL('./splatConverter.worker.js', import.meta.url), { type: 'module' });

            const cleanup = () => {
                worker.onmessage = null;
                worker.onerror = null;
                worker.terminate();
            };

            worker.onmessage = (event) => {
                const data = event.data || {};
                if (data.type === 'progress') {
                    this._emitSogProgress(data);
                    return;
                }

                const { success, outputBuffer, error } = data;
                cleanup();
                if (success && outputBuffer) {
                    this._emitSogProgress({ level: 'success', message: 'SOG conversion completed.', done: true });
                    resolve(outputBuffer);
                    return;
                }
                this._emitSogProgress({ level: 'error', message: error || 'Worker SOG conversion failed.', done: true });
                reject(new Error(error || 'Worker SOG conversion failed.'));
            };

            worker.onerror = (event) => {
                cleanup();
                this._emitSogProgress({ level: 'error', message: event?.message || 'Worker execution error.', done: true });
                reject(new Error(event?.message || 'Worker execution error.'));
            };

            try {
                worker.postMessage({ buffer, fileName });
            } catch (error) {
                cleanup();
                this._emitSogProgress({ level: 'error', message: error?.message || 'Failed to send message to worker.', done: true });
                reject(error);
            }
        }).catch(async (error) => {
            console.warn('Worker conversion failed. Falling back to main-thread conversion:', error);
            this._emitSogProgress({ level: 'warn', message: 'Worker conversion failed. Falling back to main-thread conversion.' });
            return this._convertPlyBufferToSogOnMainThread(buffer, fileName);
        });
    }

    async _convertPlyBufferToSogOnMainThread(buffer, fileName) {
        this._emitSogProgress({ level: 'info', message: 'Converting on main thread (CPU)...' });

        const {
            readFile,
            writeFile,
            getInputFormat,
            getOutputFormat,
            MemoryFileSystem,
            MemoryReadFileSystem,
        } = await import('@playcanvas/splat-transform');

        const inputName = fileName.endsWith('.ply') ? fileName : `${fileName}.ply`;
        const inputFormat = getInputFormat(inputName);
        const fileSystem = new MemoryReadFileSystem();
        fileSystem.set(inputName, new Uint8Array(buffer));

        await yieldToUI();
        const dataTables = await readFile({
            filename: inputName,
            inputFormat,
            options: { iterations: 10 },
            params: [],
            fileSystem
        });

        const memFs = new MemoryFileSystem();
        const outputFormat = getOutputFormat('output.sog', {});
        await yieldToUI();
        await writeFile({
            filename: 'output.sog',
            outputFormat,
            dataTable: dataTables[0],
            options: { iterations: 10 }
        }, memFs);
        await yieldToUI();

        this._emitSogProgress({ level: 'success', message: 'Main-thread conversion completed.', done: true });

        return memFs.results.get('output.sog');
    }

    _filterGsplatData(validIndices, gsplatData) {
        // 修复：定义总点数（原高斯点数量，用于f_rest缺失时的默认值初始化）
        const totalPoints = gsplatData.numSplats || 0;
        const pointCount = validIndices.length;

        //  提取所有原始属性（基础属性 + 45个f_rest高阶球谐）
        const props = {
            // 几何/外观基础属性
            x: gsplatData.getProp('x'),
            y: gsplatData.getProp('y'),
            z: gsplatData.getProp('z'),
            scale_0: gsplatData.getProp('scale_0'),
            scale_1: gsplatData.getProp('scale_1'),
            scale_2: gsplatData.getProp('scale_2'),
            rot_0: gsplatData.getProp('rot_0'),
            rot_1: gsplatData.getProp('rot_1'),
            rot_2: gsplatData.getProp('rot_2'),
            rot_3: gsplatData.getProp('rot_3'),
            opacity: gsplatData.getProp('opacity'),
            f_dc_0: gsplatData.getProp('f_dc_0'),
            f_dc_1: gsplatData.getProp('f_dc_1'),
            f_dc_2: gsplatData.getProp('f_dc_2'),
            state: gsplatData.getProp('state'), // 补全state属性（原GSplatData配置中有）
            // 高阶球谐系数容器（f_rest_0 ~ f_rest_44）
            f_rest: []
        };

        //  加载并校验45个高阶球谐系数f_rest_0 ~ f_rest_44，缺失则填充0
        for (let i = 0; i < 45; i++) {
            const restPropKey = `f_rest_${i}`;
            const restProp = gsplatData.getProp(restPropKey);
            if (!restProp || restProp.length === 0) {
                console.warn(`警告：缺少高斯点属性${restPropKey}，使用默认值0填充`);
                // 缺失时创建全0数组，长度匹配原高斯点数量
                props.f_rest.push(new Float32Array(totalPoints).fill(0));
            } else {
                props.f_rest.push(restProp);
            }
        }

        //  空值判断：无有效点则返回空的GSplatData实例（结构一致，避免后续报错）
        if (pointCount === 0) {
            console.warn('过滤后无有效高斯点，返回空GSplatData实例');
            const emptyFloat32 = new Float32Array(0);
            const emptyProps = [];
            // 基础属性配置
            const basePropNames = ['x','y','z','opacity','rot_0','rot_1','rot_2','rot_3','f_dc_0','f_dc_1','f_dc_2','scale_0','scale_1','scale_2','state'];
            basePropNames.forEach(name => {
                emptyProps.push({ type: 'float', name, storage: emptyFloat32, byteSize: 4 });
            });
            // 45个f_rest属性配置
            for (let i = 0; i < 45; i++) {
                emptyProps.push({ type: 'float', name: `f_rest_${i}`, storage: emptyFloat32, byteSize: 4 });
            }
            // 返回空GSplatData实例
            return new GSplatData([{
                name: 'vertex',
                count: 0,
                properties: emptyProps
            }]);
        }

        // 初始化过滤后的属性容器（预分配Float32Array内存，高性能）
        const filtedProps = {
            // 基础属性
            x: new Float32Array(pointCount),
            y: new Float32Array(pointCount),
            z: new Float32Array(pointCount),
            scale_0: new Float32Array(pointCount),
            scale_1: new Float32Array(pointCount),
            scale_2: new Float32Array(pointCount),
            rot_0: new Float32Array(pointCount),
            rot_1: new Float32Array(pointCount),
            rot_2: new Float32Array(pointCount),
            rot_3: new Float32Array(pointCount),
            opacity: new Float32Array(pointCount),
            f_dc_0: new Float32Array(pointCount),
            f_dc_1: new Float32Array(pointCount),
            f_dc_2: new Float32Array(pointCount),
            state: new Float32Array(pointCount),
            // 45个高阶球谐系数容器（f_rest_0 ~ f_rest_44）
            f_rest: new Array(45).fill(0).map(() => new Float32Array(pointCount))
        };

        // 一次遍历有效索引：过滤基础属性 + 45个f_rest属性（计算量最小）
        validIndices.forEach((pointIndex, newIdx) => {
            // 过滤基础属性
            filtedProps.x[newIdx] = props.x[pointIndex];
            filtedProps.y[newIdx] = props.y[pointIndex];
            filtedProps.z[newIdx] = props.z[pointIndex];
            filtedProps.scale_0[newIdx] = props.scale_0[pointIndex];
            filtedProps.scale_1[newIdx] = props.scale_1[pointIndex];
            filtedProps.scale_2[newIdx] = props.scale_2[pointIndex];
            filtedProps.rot_0[newIdx] = props.rot_0[pointIndex];
            filtedProps.rot_1[newIdx] = props.rot_1[pointIndex];
            filtedProps.rot_2[newIdx] = props.rot_2[pointIndex];
            filtedProps.rot_3[newIdx] = props.rot_3[pointIndex];
            filtedProps.opacity[newIdx] = props.opacity[pointIndex];
            filtedProps.f_dc_0[newIdx] = props.f_dc_0[pointIndex];
            filtedProps.f_dc_1[newIdx] = props.f_dc_1[pointIndex];
            filtedProps.f_dc_2[newIdx] = props.f_dc_2[pointIndex];
            filtedProps.state[newIdx] = props.state[pointIndex] || 0; // state缺失则填0
            // 过滤45个高阶球谐系数
            for (let i = 0; i < 45; i++) {
                filtedProps.f_rest[i][newIdx] = props.f_rest[i][pointIndex];
            }
        });

        // ========== 新增：打印数据量大小统计 ==========
        const FLOAT32_BYTE = 4; // 单个Float32占4字节
        const basePropCount = 15; // 基础属性数量（x/y/z等15个）
        const shPropCount = 45;   // 高阶球谐系数数量
        const totalPropCount = basePropCount + shPropCount; // 总属性数

        // 计算各部分字节数
        const baseDataSize = basePropCount * pointCount * FLOAT32_BYTE;
        const shDataSize = shPropCount * pointCount * FLOAT32_BYTE;
        const totalDataSize = totalPropCount * pointCount * FLOAT32_BYTE;

        // 格式化字节数（B→KB→MB，保留2位小数）
        const formatSize = (bytes) => {
            if (bytes < 1024) return `${bytes.toFixed(2)} B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        };

        // 打印详细数据量
        console.log('【高斯点过滤完成-数据量统计】', {
            有效点数量: pointCount,
            基础属性数: basePropCount,
            高阶球谐数: shPropCount,
            单点位字节数: totalPropCount * FLOAT32_BYTE, // 单个点的所有属性占用字节
            基础属性数据量: formatSize(baseDataSize),
            高阶球谐数据量: formatSize(shDataSize),
            总数据量: formatSize(totalDataSize)
        });

        // 构建GSplatData的properties配置
        const gsplatProperties = [
            { type: 'float', name: 'x', storage: filtedProps.x, byteSize: 4 },
            { type: 'float', name: 'y', storage: filtedProps.y, byteSize: 4 },
            { type: 'float', name: 'z', storage: filtedProps.z, byteSize: 4 },
            { type: 'float', name: 'opacity', storage: filtedProps.opacity, byteSize: 4 },
            { type: 'float', name: 'rot_0', storage: filtedProps.rot_0, byteSize: 4 },
            { type: 'float', name: 'rot_1', storage: filtedProps.rot_1, byteSize: 4 },
            { type: 'float', name: 'rot_2', storage: filtedProps.rot_2, byteSize: 4 },
            { type: 'float', name: 'rot_3', storage: filtedProps.rot_3, byteSize: 4 },
            { type: 'float', name: 'f_dc_0', storage: filtedProps.f_dc_0, byteSize: 4 },
            { type: 'float', name: 'f_dc_1', storage: filtedProps.f_dc_1, byteSize: 4 },
            { type: 'float', name: 'f_dc_2', storage: filtedProps.f_dc_2, byteSize: 4 },
            { type: 'float', name: 'scale_0', storage: filtedProps.scale_0, byteSize: 4 },
            { type: 'float', name: 'scale_1', storage: filtedProps.scale_1, byteSize: 4 },
            { type: 'float', name: 'scale_2', storage: filtedProps.scale_2, byteSize: 4 },
            { type: 'float', name: 'state', storage: filtedProps.state, byteSize: 4 }
        ];

        // 追加45个高阶球谐系数的属性配置（f_rest_0 ~ f_rest_44）
        for (let i = 0; i < 45; i++) {
            gsplatProperties.push({
                type: 'float',
                name: `f_rest_${i}`,
                storage: filtedProps.f_rest[i],
                byteSize: 4
            });
        }

        // 返回GSplatData实例（和原格式完全一致，包含所有过滤后属性）
        return new GSplatData([{
            name: 'vertex',
            count: pointCount,
            properties: gsplatProperties
        }]);
    }

    async generateBinary3dgsSog(entity, fileName = "test.sog")
    {
        const splat = this._getSplatInstance(entity);
        if (!splat || !splat.splatData || splat.splatData.numSplats === 0) {
            console.error('生成失败：无有效3DGS数据');
            return false;
        }

        const gsplatData = splat.splatData;
        const totalPoints = gsplatData.numSplats;
        const stateArray = gsplatData.getProp('state');
        const validIndices = [];
        for (let i = 0; i < totalPoints; i++) {
            if (stateArray[i] !== State.deleted) {
                validIndices.push(i);
            }
        }

        if (validIndices.length === 0) {
            console.error('生成失败：无有效高斯点（已全部删除）');
            return false;
        }
        const filtedGsplatData = this._filterGsplatData(validIndices, gsplatData)
        const arraybuffer = await gsplatDataToSog(filtedGsplatData);
        const sogBlob = new Blob([arraybuffer], { type: 'application/octet-stream' });
        const sogUrl = URL.createObjectURL(sogBlob);
         const a = document.createElement('a');
        a.href = sogUrl;
        a.download = fileName; // 自定义下载文件名
        document.body.appendChild(a);
        a.click(); // 模拟点击

        // 清理资源
        document.body.removeChild(a);
        URL.revokeObjectURL(sogUrl);
        return arraybuffer
    }

    // 裁剪高斯数据到指定包围盒范围内
    clipGsplatDataByAabb(entity) {
        // 获取单一Splat实例
        const splat = this._getSplatInstance(entity);
        const gsplatData = splat.splatData;
        console.log(splat);

        // 筛选在范围内的点的索引
        const validIndices = [];
        const pointCount = gsplatData.numSplats;

        for (let i = 0; i < pointCount / 2; i++) {
            validIndices.push(i);
        }
        splat.updateSplatState(validIndices, State.deleted, true);
        
        // 如果没有有效点，直接返回
        if (validIndices.length === 0) {
            console.warn('没有找到符合裁剪范围的高斯点');
            return;
        }

        console.log(`裁剪完成：保留 ${validIndices.length}/${pointCount} 个高斯点`);
    }

    clipGsplatDataByAllFaces(entity) {
        // 1. 查找对应的包围盒父实体
        const bboxEntity = this._app.root.findByName(`bbox_${entity.name}`);
        if (!bboxEntity) {
            console.warn(`未找到实体${entity.name}的包围盒，无法修改面位置`);
            return false;
        }

        // 2. 获取单一Splat实例
        const splat = this._getSplatInstance(entity);
        const gsplatData = splat.splatData;
        if (!gsplatData || gsplatData.numSplats === 0) {
            console.warn('Gsplat数据为空，跳过裁剪');
            return;
        }

        // 3. 所有面的配置：面名称 → 裁剪轴 + 裁剪方向
        const allFaceConfigs = {
            'y+': { axis: 'y', direction: -1 }, // y+面：裁剪y轴大于faceEntity.y的点
            'y-': { axis: 'y', direction: 1 },// y-面：裁剪y轴小于faceEntity.y的点
            'x+': { axis: 'x', direction: 1 }, // x+面：裁剪x轴大于faceEntity.x的点
            'x-': { axis: 'x', direction: -1 },// x-面：裁剪x轴小于faceEntity.x的点
            'z+': { axis: 'z', direction: -1 }, // z+面：裁剪z轴大于faceEntity.z的点
            'z-': { axis: 'z', direction: 1 } // z-面：裁剪z轴小于faceEntity.z的点
        };

        // 4. 预加载所有有效面的裁剪阈值（过滤掉未找到的面）
        const validFaceClips = [];
        const localAabb = splat.assetRecource.aabb;

        for (const [faceName, config] of Object.entries(allFaceConfigs)) {
            console.log("localAabb", localAabb)
            // 查找当前面实体
            const faceEntity = bboxEntity.findByName(`bbox_face_${entity.name}_${faceName}`);
            if (!faceEntity) {
                console.warn(`未找到包围盒面: bbox_face_${entity.name}_${faceName}，跳过该面裁剪`);
                continue;
            }

            // 计算该面的裁剪阈值（统一坐标系）
            const faceWorldPos = faceEntity.getLocalPosition();
            let clipValue;
            if(config.axis === 'x')
                clipValue = localAabb.center[config.axis] + faceWorldPos[config.axis];
            else
                clipValue = localAabb.center[config.axis] - faceWorldPos[config.axis];

            validFaceClips.push({
                faceName,
                axis: config.axis,
                direction: config.direction,
                clipValue
            });
        }

        // 无有效裁剪面时直接返回
        if (validFaceClips.length === 0) {
            console.warn('无有效可裁剪的面，跳过Gsplat裁剪');
            return;
        }

        // 5. 获取所有高斯点的位置数据（世界空间）
        const positions = {
            x: gsplatData.getProp('x'),
            y: gsplatData.getProp('y'),
            z: gsplatData.getProp('z')
        };
        const scales = {
            x: gsplatData.getProp('scale_0'),
            y: gsplatData.getProp('scale_1'),
            z: gsplatData.getProp('scale_2')
        };
        const pointCount = gsplatData.numSplats;
        const deleteIndices = new Set(); // 使用Set避免重复删除同一索引

        const axisRules = {
            x: { min: Infinity, max: -Infinity },
            y: { min: Infinity, max: -Infinity },
            z: { min: Infinity, max: -Infinity }
        };

        validFaceClips.forEach(clipConfig => {
            const { axis, direction, clipValue } = clipConfig;
            if (direction === -1) {
                axisRules[axis].min = clipValue;
            } else {
                axisRules[axis].max = clipValue;
            }
        });

        const hasCompleteRange = ['x', 'y', 'z'].every(axis =>
            Number.isFinite(axisRules[axis].min) &&
            Number.isFinite(axisRules[axis].max) &&
            axisRules[axis].min < axisRules[axis].max
        );
        if (!hasCompleteRange) {
            console.warn('包围盒裁剪范围不完整，跳过本次裁剪');
            return false;
        }

        const aabbHalf = localAabb?.halfExtents;
        const referenceExtent = Math.max(
            Number(aabbHalf?.x) || 0,
            Number(aabbHalf?.y) || 0,
            Number(aabbHalf?.z) || 0,
            1
        );
        const adaptiveEpsilon = Math.max(referenceExtent * 0.0005, 0.0001);

        const xSpan = Math.max(axisRules.x.max - axisRules.x.min, adaptiveEpsilon);
        const ySpan = Math.max(axisRules.y.max - axisRules.y.min, adaptiveEpsilon);
        const zSpan = Math.max(axisRules.z.max - axisRules.z.min, adaptiveEpsilon);
        
        // 6. 批量遍历所有高斯点，判断是否需要裁剪（x/y/z 需同时在所有面范围内才保留）
        for (let i = 0; i < pointCount; i++) {
            const scaleX = Number(scales.x?.[i]);
            const scaleY = Number(scales.y?.[i]);
            const scaleZ = Number(scales.z?.[i]);

            const extentX = Math.min(
                Number.isFinite(scaleX) ? Math.max(Math.exp(scaleX), 0) : 0,
                xSpan * 0.25
            );
            const extentY = Math.min(
                Number.isFinite(scaleY) ? Math.max(Math.exp(scaleY), 0) : 0,
                ySpan * 0.25
            );
            const extentZ = Math.min(
                Number.isFinite(scaleZ) ? Math.max(Math.exp(scaleZ), 0) : 0,
                zSpan * 0.25
            );

            const xMin = axisRules.x.min + adaptiveEpsilon;
            const xMax = axisRules.x.max - adaptiveEpsilon;
            const yMin = axisRules.y.min + adaptiveEpsilon;
            const yMax = axisRules.y.max - adaptiveEpsilon;
            const zMin = axisRules.z.min + adaptiveEpsilon;
            const zMax = axisRules.z.max - adaptiveEpsilon;

            // 判断当前点（含高斯半径）是否完全在裁剪范围内
            const isInXRange = positions.x[i] - extentX >= xMin && positions.x[i] + extentX <= xMax;
            const isInYRange = positions.y[i] - extentY >= yMin && positions.y[i] + extentY <= yMax;
            const isInZRange = positions.z[i] - extentZ >= zMin && positions.z[i] + extentZ <= zMax;

            // 只要有一个轴超出范围，就标记为待删除
            const needDelete = !isInXRange || !isInYRange || !isInZRange;

            if (needDelete) {
                deleteIndices.add(i);
            }
        }

        // 7. 处理裁剪结果
        const deleteCount = deleteIndices.size;
        console.log("deleteIndices", deleteIndices);
        if (deleteCount === 0) {
            console.log(`没有需要裁剪的高斯点（检测了${validFaceClips.length}个有效面）`);
            return;
        }

        // 8. 转换Set为数组，更新Gsplat状态：标记待删除的索引为deleted
        const deleteIndexArray = Array.from(deleteIndices);
        splat.updateSplatState(deleteIndexArray, State.deleted, true);

        console.log(`Gsplat批量裁剪完成：检测${validFaceClips.length}个有效面，删除${deleteCount}/${pointCount}个高斯点`);
        return true;
    }

    clipGsplatDataByFace(entity, faceName) {
        // 2. 查找对应的包围盒父实体
        const bboxEntity = this._app.root.findByName(`bbox_${entity.name}`);
        if (!bboxEntity) {
            console.warn(`未找到实体${entity.name}的包围盒，无法修改面位置`);
            return false;
        }

        // 1. 获取单一Splat实例
        const splat = this._getSplatInstance(entity);
        const gsplatData = splat.splatData;
        if (!gsplatData || gsplatData.numSplats === 0) {
            console.warn('Gsplat数据为空，跳过裁剪');
            return;
        }

        // 2. 核心配置：面名称 → 裁剪轴 + 裁剪方向
        const faceConfig = {
            'y+': { axis: 'y', direction: -1 }, // y+面：裁剪y轴大于faceEntity.y的点
            'y-': { axis: 'y', direction: 1 },// y-面：裁剪y轴小于faceEntity.y的点
            'x+': { axis: 'x', direction: 1 }, // x+面：裁剪x轴大于faceEntity.x的点
            'x-': { axis: 'x', direction: -1 },// x-面：裁剪x轴小于faceEntity.x的点
            'z+': { axis: 'z', direction: -1 }, // z+面：裁剪z轴大于faceEntity.z的点
            'z-': { axis: 'z', direction: 1 } // z-面：裁剪z轴小于faceEntity.z的点
        };
        const config = faceConfig[faceName];
        if (!config) {
            console.error(`无效的面名称：${faceName}，仅支持x+/x-/y+/y-/z+/z-`);
            return;
        }
        const faceEntity = bboxEntity.findByName(`bbox_face_${entity.name}_${faceName}`);
        // 3. 获取faceEntity的世界坐标（关键：高斯点是世界空间，需统一坐标系）
        const faceWorldPos = faceEntity.getLocalPosition();
        // let clipValue = ; // 裁剪阈值（如y+面的世界y坐标）
        const local_aabb = splat.assetRecource.aabb;
        let clipValue;
        if(config.axis === 'x')
            clipValue = local_aabb.center[config.axis] + faceWorldPos[config.axis];
        else
            clipValue = local_aabb.center[config.axis] - faceWorldPos[config.axis];
        // 4. 获取所有高斯点的位置数据（世界空间）
        const positions = {
            x: gsplatData.getProp('x'),
            y: gsplatData.getProp('y'),
            z: gsplatData.getProp('z')
        };
        const scales = {
            x: gsplatData.getProp('scale_0'),
            y: gsplatData.getProp('scale_1'),
            z: gsplatData.getProp('scale_2')
        };
        const pointCount = gsplatData.numSplats;
        const deleteIndices = []; // 待删除的高斯点索引

        const aabbHalf = local_aabb?.halfExtents;
        const referenceExtent = Math.max(
            Number(aabbHalf?.x) || 0,
            Number(aabbHalf?.y) || 0,
            Number(aabbHalf?.z) || 0,
            1
        );
        const adaptiveEpsilon = Math.max(referenceExtent * 0.0005, 0.0001);
        const axisSpan = Math.max((Number(aabbHalf?.[config.axis]) || 0) * 2, adaptiveEpsilon);

        // 5. 遍历筛选待删除的高斯点
        for (let i = 0; i < pointCount; i++) {
            const pointValue = positions[config.axis][i]; // 当前点的裁剪轴坐标
            const scaleValue = Number(scales[config.axis]?.[i]);
            const extent = Math.min(
                Number.isFinite(scaleValue) ? Math.max(Math.exp(scaleValue), 0) : 0,
                axisSpan * 0.25
            );

            // 判断是否在裁剪范围内（根据方向筛选）
            const isOutOfClip = config.direction === 1
                ? (pointValue + extent) > (clipValue - adaptiveEpsilon)
                : (pointValue - extent) < (clipValue + adaptiveEpsilon);

            if (isOutOfClip) {
                deleteIndices.push(i);
            }
        }

        // 6. 处理裁剪结果
        if (deleteIndices.length === 0) {
            console.log(`没有需要裁剪的高斯点（${faceName}面，裁剪阈值：${clipValue}）`);
            return;
        }
        console.log("deleteIndices", deleteIndices);
        // 7. 更新Gsplat状态：标记待删除的索引为deleted
        splat.updateSplatState(deleteIndices, State.deleted, true);
        console.log(`Gsplat裁剪完成：${faceName}面裁剪阈值${clipValue}，删除${deleteIndices.length}/${pointCount}个高斯点`);
    }

    resetEntity(entity)
    {
        const splat = this._getSplatInstance(entity);
        const gsplatData = splat.splatData;
        if (!gsplatData || gsplatData.numSplats === 0) {
            console.warn('Gsplat数据为空，跳过裁剪');
            return;
        }
        
        const indices = [];
        for (let i = 0; i < gsplatData.numSplats; i++) {
            indices.push(i);
        }
        splat.updateSplatState(indices, State.deleted, false);
    }
    // ---------------------- 调用示例 ----------------------
    /**
     * 联动包围盒面拖动与Gsplat裁剪
     * @param {pc.Entity} targetEntity - 目标实体（包含Gsplat）
     * @param {string} faceName - 面名称（x+/x-/y+/y+/z+/z-）
     * @param {number} newCoord - 面的新坐标（本地坐标）
     */
    onBboxFaceDrag(targetEntity, faceName, newCoord) {
        // 1. 修改包围盒面位置（你的原有逻辑）
        this.modifyBboxFacePosition(targetEntity, faceName, newCoord);

        // 3. 裁剪Gsplat数据（核心：根据拖动后的面位置裁剪）
        this.clipGsplatDataByFace(targetEntity, faceName);
    }

    destroyEntityBoundingBox(entity) {
        const existingBox = this._app.root.findByName(`bbox_${entity.name}`);
        if (existingBox) {
            existingBox.destroy();
        }
        if(this.gizmos.length > 0)
        {
            this.gizmos.forEach(gizmo => gizmo.destroy());
        }
    }

    drawEntityBoundingBox(entity, useRedColor = false, opacity = 0.2) {
        // const gizmoLayer = this._app.scene.layers.getLayerByName('Gizmo');
        
        // 移除已存在的包围盒实体
        const existingBox = this._app.root.findByName(`bbox_${entity.name}`);
        if (existingBox) {
            existingBox.destroy();
        }

        // 计算实体的包围盒
        const aabb = this.calculateEntityAabb(entity);
        console.log("box aabb", aabb);
        if (!aabb) {
            console.warn('无法计算实体包围盒，跳过绘制:', entity.name);
            return;
        }

        // 创建包围盒父实体（跟随目标实体）
        const boxEntity = new pc.Entity(`bbox_${entity.name}`);
        this._app.root.addChild(boxEntity);
        boxEntity.setLocalPosition(aabb.center.x, aabb.center.y, aabb.center.z);
        // 定义两种材质颜色（灰白色/红色）
        const colorConfig = useRedColor
            ? { diffuse: '#ff3333', emissive: '#ff6666' }  // 红色
            : { diffuse: '#f0f0f0', emissive: '#f8f8f8' }; // 灰白色

        // 立方体半边长（AABB的半扩展值）
        const halfExtents = aabb.halfExtents;
        console.log("halfExtents",halfExtents);
        
        // 修复：6个面的正确配置（位置、旋转、缩放）
        // 核心修正：每个面的旋转适配Plane几何体的默认朝向，缩放匹配半边长
        const faceConfigs = [
            // 前面（+Z）：Plane默认朝+Z，无需额外旋转
            {
                name: 'z+',
                pos: [0, 0, halfExtents.z],
                rot: [0, 0, 0],
                scale: [halfExtents.x * 2, halfExtents.y * 2, 0.01]
            },
            // 后面（-Z）：绕Y轴旋转180°，朝向-Z
            {
                name: 'z-',
                pos: [0, 0, -halfExtents.z],
                rot: [0, 0, 0],
                scale: [halfExtents.x * 2, halfExtents.y * 2, 0.01]
            },
            // 左面（-X）：绕Y轴旋转90°，朝向-X
            {
                name: 'x-',
                pos: [-halfExtents.x, 0, 0],
                rot: [0, 0, 0],
                scale: [0.01, halfExtents.y * 2, halfExtents.z * 2]
            },
            // 右面（+X）：绕Y轴旋转-90°，朝向+X
            {
                name: 'x+',
                pos: [halfExtents.x, 0, 0],
                rot: [0, 0, 0],
                scale: [0.01, halfExtents.y * 2, halfExtents.z * 2]
            },
            // 顶面（+Y）：绕X轴旋转-90°，朝向+Y
            {
                name: 'y+',
                pos: [0, halfExtents.y, 0],
                rot: [0, 0, 0],
                scale: [halfExtents.x * 2, 0.01, halfExtents.z * 2]
            },
            // 底面（-Y）：绕X轴旋转90°，朝向-Y
            {
                name: 'y-',
                pos: [0, -halfExtents.y, 0],
                rot: [0, 0, 0],
                scale: [halfExtents.x * 2, 0.01, halfExtents.z * 2]
            }
        ];

        // 创建6个平面组成立方体
        faceConfigs.forEach((config) => {
            // 创建材质（优化透明渲染）
            const material = new pc.StandardMaterial();
            material.name = `bbox_material_${entity.name}_${config.name}`;
            material.diffuse = new pc.Color().fromString(colorConfig.diffuse);
            material.emissive = new pc.Color().fromString(colorConfig.emissive);
            material.opacity = opacity;
            material.blendType = pc.BLEND_NORMAL; // 改用ALPHA混合更适合半透明
            material.cull = pc.CULLFACE_NONE;    // 双面渲染
            material.depthWrite = false;         // 半透明禁用深度写入避免遮挡
            material.depthTest = true;
            material.update();

            const faceEntity = new pc.Entity(`bbox_face_${entity.name}_${config.name}`);
            boxEntity.addChild(faceEntity);

            // 设置平面的本地变换（基于父实体，父实体已居中）
            faceEntity.setLocalPosition(config.pos[0], config.pos[1], config.pos[2]);
            faceEntity.setLocalEulerAngles(config.rot[0], config.rot[1], config.rot[2]);
            faceEntity.setLocalScale(config.scale[0], config.scale[1], config.scale[2]);

            // 添加平面渲染组件
            faceEntity.addComponent('render', {
                type: 'box',
                material: material,
                castShadows: false,
                receiveShadows: false
            });
            // const gizmo = new pc.TranslateGizmo(this._camera, gizmoLayer);
            
            // this.gizmos.push(gizmo);
            // gizmo.enableShape('x', true);
            // gizmo.enableShape('y', false);
            // gizmo.enableShape('z', false);
            // gizmo.enableShape('xy', false);
            // gizmo.enableShape('xz', false);
            // gizmo.enableShape('yz', false);
            // gizmo.enableShape('xyz', false);
            // gizmo.size = 0.5;
            // console.log(gizmo);
            // gizmo.setTheme(gizmoTheme);
            // gizmo.attach([faceEntity]);
            // gizmo.on('transform:start',() => {
            //     this.stopNormal = true;
            //     const material = gizmo.nodes[0].render.material;
            //      material.emissive.fromString("#ff0000");
            //      material.update();
            // })
            // // gizmo.on('transform:move', (pointDelta, angleDelta) => {
            // //         console.log(`Transformation moved by ${pointDelta} (angle: ${angleDelta})`);
            // // });
            // gizmo.on('transform:end',() => {this.stopNormal = false})
        });

        // 监听实体销毁，自动清理包围盒资源
        const cleanup = () => {
            if (boxEntity && !boxEntity.destroyed) {
                boxEntity.destroy();
            }
            if(this.gizmos.length > 0)
            {
                this.gizmos.forEach(gizmo => gizmo.destroy());
            }
        };

        entity.on('destroy', cleanup);

        // 额外的清理保护（防止内存泄漏）
        boxEntity.on('destroy', () => {
            entity.off('destroy', cleanup);
        });
    }

    clearBBoxFaceColor(entity) {
        const validFaces = ['x+', 'x-', 'y+', 'y-', 'z+', 'z-'];
        validFaces.forEach(faceName => {
            this.modifyBBoxFaceColor(entity, faceName, "#ffffff");
        });
    }

    modifyBBoxFaceColor(entity, faceName, color, opacity = 0.2, emissiveColor) {
        // 2. 查找包围盒父实体
        const boxEntity = this._app.root.findByName(`bbox_${entity.name}`);
        if (!boxEntity || boxEntity.destroyed) {
            console.warn(`modifyBBoxFaceColor: 未找到实体${entity.name}的包围盒`);
            return false;
        }

        // 3. 查找目标面实体
        const faceEntityName = `bbox_face_${entity.name}_${faceName}`;
        const faceEntity = boxEntity.findByName(faceEntityName);
        if (!faceEntity || faceEntity.destroyed) {
            console.warn(`modifyBBoxFaceColor: 未找到${entity.name}的${faceName}面实体`);
            return false;
        }

        // 4. 获取并修改材质颜色
        const renderComp = faceEntity.render;
        if (!renderComp || !renderComp.material) {
            console.error(`modifyBBoxFaceColor: ${faceName}面缺少渲染组件或材质`);
            return false;
        }

        const material = renderComp.material;
        try {
            // 设置主颜色
            material.diffuse.fromString(color);
            // 设置自发光颜色（未传则自动生成浅化版本）
            if (emissiveColor) {
                material.emissive.fromString(emissiveColor);
            } else {
                // 自动生成浅化的自发光色（在原颜色基础上提高亮度）
                const diffuse = material.diffuse;
                material.emissive.set(
                    Math.min(diffuse.r + 0.1, 1),
                    Math.min(diffuse.g + 0.1, 1),
                    Math.min(diffuse.b + 0.1, 1)
                );
            }
            // 设置透明度
            material.opacity = Math.max(0, Math.min(1, opacity));
            // 更新材质生效
            material.update();

            return true;
        } catch (e) {
            console.error(`modifyBBoxFaceColor: 修改颜色失败`, e);
            return false;
        }
    }

    fixedNumber(num) {
        return Number.parseFloat(num.toFixed(2));
    }

    calculateAabbAxisLimits(entity) {
        const aabb = this.calculateEntityAabb(entity);
        if (!aabb) {
            console.warn('无法计算实体包围盒，无法获取坐标限制:', entity.name);
            return null;
        }
        return {
            'x': [-this.fixedNumber(aabb.halfExtents.x), this.fixedNumber(aabb.halfExtents.x)],
            'y': [-this.fixedNumber(aabb.halfExtents.y), this.fixedNumber(aabb.halfExtents.y)],
            'z': [-this.fixedNumber(aabb.halfExtents.z), this.fixedNumber(aabb.halfExtents.z)],
        };
    }

    getFaceLocalPosition(entity, faceName) {
        const bboxEntity = this._app.root.findByName(`bbox_${entity.name}`);
        if (!bboxEntity) {
            console.warn(`未找到实体${entity.name}的包围盒，无法修改面位置`);
            return false;
        }

        // 3. 直接查找目标面实体（无需映射，面名称已改为x+/y+等）
        const faceEntity = bboxEntity.findByName(`bbox_face_${entity.name}_${faceName}`);
        if (!faceEntity) {
            console.warn(`未找到包围盒面: bbox_face_${entity.name}_${faceName}`);
            return false;
        }
        const axis = faceName[0];
        const pos = faceEntity.getLocalPosition();
        console.log(pos, axis);
        return this.fixedNumber(pos[axis]);
    }

    /**
     * 修改包围盒指定面的位置（同步调整关联面尺寸，保持立方体完整性）
     * @param {pc.Entity} entity - 目标实体（原实体，非包围盒实体）
     * @param {string} faceName - 要修改的面名称（x+/x-/y+/y-/z+/z-）
     * @param {number} newCoord - 新的坐标值（仅修改对应轴，如y+只改Y轴）
     * @returns {boolean} 是否修改成功
     */
    modifyBboxFacePosition(entity, faceName, newCoord) {
        // 2. 查找对应的包围盒父实体
        const bboxEntity = this._app.root.findByName(`bbox_${entity.name}`);
        if (!bboxEntity) {
            console.warn(`未找到实体${entity.name}的包围盒，无法修改面位置`);
            return false;
        }

        // 3. 直接查找目标面实体（无需映射，面名称已改为x+/y+等）
        const faceEntity = bboxEntity.findByName(`bbox_face_${entity.name}_${faceName}`);
        if (!faceEntity) {
            console.warn(`未找到包围盒面: bbox_face_${entity.name}_${faceName}`);
            return false;
        }

        // 5. 定义面与轴的映射关系 + 关联面配置（完全基于x+/y+等命名）
        const faceConfigMap = {
            "y+": { // 顶面
                axis: 'y',
                limitKey: 'y+',
                // 关联面：x-/x+/z+/z-（需要调整Y轴方向的缩放）
                relatedFaces: [
                    { name: 'x-', scaleAxis: 'y', scaleIdx: 1 },
                    { name: 'x+', scaleAxis: 'y', scaleIdx: 1 },
                    { name: 'z+', scaleAxis: 'y', scaleIdx: 1 },
                    { name: 'z-', scaleAxis: 'y', scaleIdx: 1 }
                ]
            },
            "y-": { // 底面
                axis: 'y',
                limitKey: 'y-',
                relatedFaces: [
                    { name: 'x-', scaleAxis: 'y', scaleIdx: 1 },
                    { name: 'x+', scaleAxis: 'y', scaleIdx: 1 },
                    { name: 'z+', scaleAxis: 'y', scaleIdx: 1 },
                    { name: 'z-', scaleAxis: 'y', scaleIdx: 1 }
                ]
            },
            "x-": { // 左面
                axis: 'x',
                limitKey: 'x-',
                // 关联面：y+/y-/z+/z-（需要调整X轴方向的缩放）
                relatedFaces: [
                    { name: 'y+', scaleAxis: 'x', scaleIdx: 0 },
                    { name: 'y-', scaleAxis: 'x', scaleIdx: 0 },
                    { name: 'z+', scaleAxis: 'x', scaleIdx: 0 },
                    { name: 'z-', scaleAxis: 'x', scaleIdx: 0 }
                ]
            },
            "x+": { // 右面
                axis: 'x',
                limitKey: 'x+',
                relatedFaces: [
                    { name: 'y+', scaleAxis: 'x', scaleIdx: 0 },
                    { name: 'y-', scaleAxis: 'x', scaleIdx: 0 },
                    { name: 'z+', scaleAxis: 'x', scaleIdx: 0 },
                    { name: 'z-', scaleAxis: 'x', scaleIdx: 0 }
                ]
            },
            "z+": { // 前面
                axis: 'z',
                limitKey: 'z+',
                // 关联面：y+/y-/x-/x+（需要调整Z轴方向的缩放）
                relatedFaces: [
                    { name: 'y+', scaleAxis: 'z', scaleIdx: 2 },
                    { name: 'y-', scaleAxis: 'z', scaleIdx: 2 },
                    { name: 'x-', scaleAxis: 'z', scaleIdx: 2 },
                    { name: 'x+', scaleAxis: 'z', scaleIdx: 2 }
                ]
            },
            "z-": { // 后面
                axis: 'z',
                limitKey: 'z-',
                relatedFaces: [
                    { name: 'y+', scaleAxis: 'z', scaleIdx: 2 },
                    { name: 'y-', scaleAxis: 'z', scaleIdx: 2 },
                    { name: 'x-', scaleAxis: 'z', scaleIdx: 2 },
                    { name: 'x+', scaleAxis: 'z', scaleIdx: 2 }
                ]
            }
        };

        const axisInfo = faceConfigMap[faceName];
        const currentPos = faceEntity.getLocalPosition();
        const originalCoord = currentPos[axisInfo.axis]; // 目标面原始坐标
        const offset = newCoord - originalCoord; // 坐标偏移量
        
        // 7. 修改目标面的坐标（仅修改对应轴）
        const newPos = {
            x: currentPos.x,
            y: currentPos.y,
            z: currentPos.z
        };
        newPos[axisInfo.axis] = newCoord;
        faceEntity.setLocalPosition(newPos.x, newPos.y, newPos.z);

        const is_minus = faceName.endsWith('-')
        // 8. 同步调整关联面的缩放（保持立方体闭合）
        axisInfo.relatedFaces.forEach(related => {
            const relatedFaceEntity = bboxEntity.findByName(`bbox_face_${entity.name}_${related.name}`);
            if (!relatedFaceEntity) {
                console.warn(`未找到关联面: bbox_face_${entity.name}_${related.name}`);
                return;
            }

            // 获取关联面当前缩放
            const currentScale = relatedFaceEntity.getLocalScale();
            const currentPos = relatedFaceEntity.getLocalPosition();
            const newScale = [currentScale.x, currentScale.y, currentScale.z];
            const newPos = [currentPos.x, currentPos.y, currentPos.z];
            // 根据偏移量调整对应轴的缩放（偏移量*2：因为缩放是"长度"，坐标是"位置"）
            newScale[related.scaleIdx] =is_minus ? newScale[related.scaleIdx] - (offset)
                                                :newScale[related.scaleIdx] + (offset);
            newPos[related.scaleIdx] = newPos[related.scaleIdx] + (offset / 2);
            // 确保缩放为正（避免出现负缩放）
            if (newScale[related.scaleIdx] < 0.01) {
                newScale[related.scaleIdx] = 0.01;
                console.warn(`${related.name}面缩放最小值限制为0.01`);
            }

            // 应用新缩放
            relatedFaceEntity.setLocalScale(newScale[0], newScale[1], newScale[2]);
            relatedFaceEntity.setLocalPosition(newPos[0], newPos[1], newPos[2]);
        });

        return true;
    }

    // 重置相机（支持平滑过渡）
    reset(focus, position, options = {}) {
        this.mode = 'orbit';
        const nextFocus = focus.clone ? focus.clone() : new Vec3(focus.x, focus.y, focus.z);
        const targetPose = new Pose().look(position, nextFocus);
        const immediate = !!options.immediate;
        const duration = Number.isFinite(options.duration)
            ? Math.max(0, options.duration)
            : this.cameraResetDuration;

        const focusDistance = Math.max(0.0001, this._pose.position.distance(nextFocus));
        const previousFocus = (this._cameraResetTransition?.currentFocus && this._cameraResetTransition.currentFocus.clone)
            ? this._cameraResetTransition.currentFocus.clone()
            : this._pose.position.clone().add(this._camera.entity.forward.clone().mulScalar(focusDistance));

        this._lastResetFocus = {
            previous: previousFocus.clone(),
            current: nextFocus.clone()
        };

        if (immediate || duration <= 0) {
            this._cameraResetTransition = null;
            this._controller.attach(targetPose, false);
            this._pose.copy(targetPose);
            return;
        }

        this._cameraResetTransition = {
            elapsed: 0,
            duration,
            startPosition: this._pose.position.clone(),
            endPosition: targetPose.position.clone(),
            startFocus: previousFocus,
            endFocus: nextFocus,
            currentFocus: previousFocus.clone(),
            targetPose
        };
    }

    resetUserInteractionFlag() {
        this.hasUserInteracted = false;
    }

    _isKeyboardInputBlockedByFocusedElement() {
        if (typeof document === 'undefined') return false;
        const activeElement = document.activeElement;
        if (!activeElement) return false;

        const canvasElement = this._app?.graphicsDevice?.canvas;
        if (canvasElement && activeElement === canvasElement) {
            return false;
        }

        const tagName = activeElement.tagName?.toUpperCase?.() || '';
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
            return true;
        }

        if (activeElement.isContentEditable) {
            return true;
        }

        const role = (activeElement.getAttribute?.('role') || '').toLowerCase();
        if (role === 'textbox' || role === 'combobox' || role === 'searchbox' || role === 'spinbutton') {
            return true;
        }

        if (activeElement.closest?.('.ant-select, .ant-select-dropdown, .ant-input, .ant-input-affix-wrapper')) {
            return true;
        }

        return false;
    }
    // 更新方法
    update(dt, isLoopPlaying, isVideoPlaying, cantFly = false) {
        // console.log(this._camera.entity.getPosition());
        if(this.stopNormal) return; 
        const keyCode = KeyboardMouseSource.keyCode;
        const joystick = this._joystick;
        const { key, button, mouse, wheel } = this._desktopInput.read();
        const { touch, pinch, count } = this._orbitMobileInput.read();
        // const { leftInput, rightInput } = this._flyMobileInput.read();
        const { leftStick, rightStick } = this._gamepadInput.read();
        const isKeyboardBlocked = this._isKeyboardInputBlockedByFocusedElement();
        const keyValue = (code) => (isKeyboardBlocked ? 0 : key[code]);

        const hasKeyboardInput = !!(
            keyValue(keyCode.W) || keyValue(keyCode.A) || keyValue(keyCode.S) || keyValue(keyCode.D) ||
            keyValue(keyCode.Q) || keyValue(keyCode.E) ||
            keyValue(keyCode.UP) || keyValue(keyCode.DOWN) || keyValue(keyCode.LEFT) || keyValue(keyCode.RIGHT) ||
            keyValue(keyCode.SHIFT) || keyValue(keyCode.CTRL)
        );
        const hasMouseInput = !!(
            wheel[0] ||
            button[0] || button[1] || button[2]
        );
        const hasPauseTriggerInput = !!(
            hasKeyboardInput ||
            hasMouseInput
        );
        if (hasPauseTriggerInput) {
            this.hasUserInteracted = true;
        }

        // console.log(dt);

        // 游戏手柄死区处理
        applyDeadZone(leftStick, this.gamepadDeadZone.x, this.gamepadDeadZone.y);
        applyDeadZone(rightStick, this.gamepadDeadZone.x, this.gamepadDeadZone.y);

        // 更新状态
        this._state.axis.add(tmpV1.set(
            (keyValue(keyCode.D) - keyValue(keyCode.A)) + (keyValue(keyCode.RIGHT) - keyValue(keyCode.LEFT)),
            (keyValue(keyCode.E) - keyValue(keyCode.Q)),
            (keyValue(keyCode.W) - keyValue(keyCode.S)) + (keyValue(keyCode.UP) - keyValue(keyCode.DOWN))
        ));
        this._state.mouse.forEach((_, i) => this._state.mouse[i] += button[i]);
        this._state.shift += keyValue(keyCode.SHIFT);
        this._state.ctrl += keyValue(keyCode.CTRL);
        this._state.touches += count[0];

        // 键盘输入时切换到飞行模式
        if (!cantFly && this._mode !== 'fly' && this._state.axis.length() > 0) {
            this.mode = 'fly';
            // 回调通知
            if (this._modeChangeCallback) {
                this._modeChangeCallback('fly');
            }
        }else if(cantFly && this._state.axis.length() > 0 )
        {
            const now = Date.now();
            if (now - this._lastCantFlyWarningTime >= 3000) {
                message.warn("编辑模式下无法进入飞行模式");
                this._lastCantFlyWarningTime = now;
            }
        }

        const orbit = Number(this._mode === 'orbit');
        const fly = Number(this._mode === 'fly');
        const double = Number(this._state.touches > 1);
        const pan = this._state.mouse[2] || Number(button[2] === -1) || double;
        const distance = this._pose.distance;
        const { deltas } = frame;
        this.autoRotateFrameAngle = this.autoRotateSpeed * dt;
        // 桌面端移动
        const v = tmpV1.set(0, 0, 0);
        const keyMove = this._state.axis.clone().normalize();
        v.add(keyMove.mulScalar(fly * this.moveSpeed * (this._state.shift ? 2 : this._state.ctrl ? 0.5 : 1) * dt));
        const panMove = screenToWorld(this._camera, mouse[0], mouse[1], distance);
        v.add(panMove.mulScalar(pan));
        const wheelMove = new Vec3(0, 0, -wheel[0]);
        v.add(wheelMove.mulScalar(this.wheelSpeed * dt));
        deltas.move.append([v.x, v.y, orbit ? -v.z : v.z]);

        // 桌面端旋转
        v.set(0, 0, 0);
        const mouseRotate = new Vec3(mouse[0], mouse[1], 0);
        v.add(mouseRotate.mulScalar((1 - pan) * this.orbitSpeed * dt));
        deltas.rotate.append([v.x, v.y, v.z]);

        // 移动端移动
        v.set(0, 0, 0);
        const orbitMove = screenToWorld(this._camera, touch[0], touch[1], distance);
        v.add(orbitMove.mulScalar(orbit * pan));
        
        // 飞行模式：优先虚拟摇杆，否则使用原有触摸
        if (fly && joystick.isTouching) {
            let joystickMove;
            if(this.rotation === 0)
            {
                joystickMove = new Vec3(joystick.stickValue[0], 0, joystick.stickValue[1]);
            }else if(this.rotation === -90)
            {
                joystickMove = this.rotatePosClockwiseZ(
                    new Vec3(joystick.stickValue[1], 0, joystick.stickValue[0]),
                    this.rotation
                )
            }else if(this.rotation === 90){
                joystickMove = this.rotatePosClockwiseZ(
                    new Vec3(-joystick.stickValue[1], 0, -joystick.stickValue[0]),
                    this.rotation
                )
            }
            v.add(joystickMove.mulScalar(fly* this.moveSpeed * dt));
        } else {
            // const flyMove = new Vec3(leftInput[0], 0, -leftInput[1]);
            // v.add(flyMove.mulScalar(fly * this.moveSpeed * dt));
        }

        const pinchMove = new Vec3(0, 0, pinch[0]);
        v.add(pinchMove.mulScalar(orbit * double * this.pinchSpeed * dt));
        deltas.move.append([v.x, v.y, v.z]);

        // 移动端旋转
        v.set(0, 0, 0);
        const orbitRotate = new Vec3(touch[0], touch[1], 0);
        v.add(orbitRotate.mulScalar(orbit * (1 - pan) * this.orbitSpeed * dt));
        // const flyRotate = new Vec3(rightInput[0], rightInput[1], 0);
        // v.add(flyRotate.mulScalar(fly * this.orbitSpeed * dt));
        let flyRotate;
        if(this.rotation === 0)
        {
            flyRotate = new Vec3(this._rotateTouch.delta[0], this._rotateTouch.delta[1], 0);
        }else if(this.rotation  === -90)
        {
            flyRotate = this.rotatePosClockwiseZ(
                new Vec3(this._rotateTouch.delta[1], this._rotateTouch.delta[0], 0),
                this.rotation
            )
        }
        
        v.add(flyRotate.mulScalar(fly * this.orbitSpeed * dt));
        deltas.rotate.append([v.x, v.y, v.z]);

        // 游戏手柄移动
        v.set(0, 0, 0);
        const stickMove = new Vec3(leftStick[0], 0, -leftStick[1]);
        v.add(stickMove.mulScalar(this.moveSpeed * dt));
        deltas.move.append([v.x, v.y, v.z]);

        // 游戏手柄旋转
        v.set(0, 0, 0);
        const stickRotate = new Vec3(rightStick[0], rightStick[1], 0);
        v.add(stickRotate.mulScalar(this.orbitSpeed * dt));
        deltas.rotate.append([v.x, v.y, v.z]);

        // 更新摇杆UI
        this._updateJoystickUI();

        // XR模式处理
        if (this._app.xr?.active) {
            frame.read();
            return;
        }

        // 更新相机位置和角度
        if (this._cameraResetTransition) {
            const transition = this._cameraResetTransition;
            transition.elapsed = Math.min(transition.elapsed + dt, transition.duration);
            let t = transition.duration > 0 ? transition.elapsed / transition.duration : 1;
            // 常见先快后慢的 ease-out（如 cubic）
            t = 1 - Math.pow(1 - t, 1); // cubic ease-out
            this._pose.position.lerp(transition.startPosition, transition.endPosition, t);  
            transition.currentFocus.lerp(transition.startFocus, transition.endFocus, t);
            this._pose.look(this._pose.position, transition.currentFocus);

            if (t >= 1) {
                this._pose.copy(transition.targetPose);
                this._controller.attach(transition.targetPose, false);
                this._cameraResetTransition = null;
            }
        } else {
            this._pose.copy(this._controller.update(frame, dt));
        }
        
        const originalPos = this._pose.position;
        const originalAngles = this._pose.angles; 
        // this._camera.entity.setPosition(originalPos);
        // this._camera.entity.setEulerAngles(originalAngles);

        const rotatedPos = this.rotatePosClockwiseZ(originalPos, this.rotation);

        const rotatedAngles = this.rotateAngleClockwiseZ(originalAngles, this.rotation);

        this._camera.entity.setPosition(rotatedPos);
        this._camera.entity.setEulerAngles(rotatedAngles);
    }

    rotatePosClockwiseZ(pos, angle) {
        const rad = pc.math.DEG_TO_RAD*angle; // 度转弧度
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        // 通用旋转矩阵计算（顺时针旋转对应负弧度，等价于以下公式）
        return new pc.Vec3(
            pos.x * cos + pos.y * sin,
            -pos.x * sin + pos.y * cos,
            pos.z
        );
    }

    rotateAngleClockwiseZ(angles, angle) {
        // 通用旋转矩阵计算（顺时针旋转对应负弧度，等价于以下公式）
        return new pc.Vec3(
            angles.x,
            angles.y,
            angles.z - angle
        );
    }

    destroy() {
        // 移除事件监听
        const canvas = this._app.graphicsDevice.canvas;
        canvas.removeEventListener('touchstart', this._onTouchStart);
        canvas.removeEventListener('touchmove', this._onTouchMove);
        canvas.removeEventListener('touchend', this._onTouchEnd);
        canvas.removeEventListener('touchcancel', this._onTouchCancel);

        // 移除摇杆UI
        if (this._joystick.element?.parentNode) {
            this._joystick.element.parentNode.removeChild(this._joystick.element);
        }

        // 移除光环容器和所有光环元素
        if (this._auraContainer?.parentNode) {
            this._auraContainer.parentNode.removeChild(this._auraContainer);
        }

        // 销毁资源
        this._desktopInput.destroy();
        this._orbitMobileInput.destroy();
        this._flyMobileInput.destroy();
        this._gamepadInput.destroy();
        this._flyController.destroy();
        this._orbitController.destroy();

        // 释放Splat引用
        this._splat = null;
        this._currentSplatEntity = null;

        // 释放引用
        this.touchTapCallback = null;
    }
}

export default CameraControls;