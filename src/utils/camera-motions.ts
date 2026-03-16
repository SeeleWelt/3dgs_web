/**
 * 相机运镜工具 - 常见运镜类型实现
 * 基于 PlayCanvas 的 Vec3 进行计算
 */

import * as pc from 'playcanvas';

/**
 * 运镜参数配置
 */
export interface CameraMotionOptions {
  /** 焦点位置 */
  focus: pc.Vec3;
  /** 基础向量（从焦点指向相机位置） */
  baseVector: pc.Vec3;
  /** 角度（度） */
  angle: number;
  /** 是否立即应用 */
  immediate?: boolean;
}

/**
 * 椭圆轨道参数
 */
export interface EllipseOrbitOptions extends CameraMotionOptions {
  /** X轴缩放系数 */
  scaleX?: number;
  /** Z轴缩放系数 */
  scaleZ?: number;
}

/**
 * 螺旋运镜参数
 */
export interface SpiralOptions extends CameraMotionOptions {
  /** 高度变化系数（每度变化量） */
  heightFactor?: number;
  /** 半径变化系数 */
  radiusFactor?: number;
}

/**
 * 推拉运镜参数
 */
export interface DollyOptions extends CameraMotionOptions {
  /** 距离系数（控制近远效果） */
  distanceFactor?: number;
  /** 振荡周期 */
  oscillationPeriod?: number;
}

/**
 * 摇摆运镜参数
 */
export interface SwingOptions extends CameraMotionOptions {
  /** 摇摆幅度（度） */
  swingAmplitude?: number;
  /** 摇摆中心角度 */
  swingCenter?: number;
}

/**
 * 贝塞尔路径点
 */
export interface BezierPoint {
  position: pc.Vec3;
  controlIn?: pc.Vec3;
  controlOut?: pc.Vec3;
}

/**
 * 缓动函数类型
 */
export type EasingFunction = (t: number) => number;

/**
 * 常用缓动函数
 */
export const Easing = {
  /** 线性 */
  linear: (t: number) => t,

  /** 缓入 - 二次 */
  easeInQuad: (t: number) => t * t,

  /** 缓出 - 二次 */
  easeOutQuad: (t: number) => t * (2 - t),

  /** 缓入缓出 - 二次 */
  easeInOutQuad: (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  /** 缓入 - 三次 */
  easeInCubic: (t: number) => t * t * t,

  /** 缓出 - 三次 */
  easeOutCubic: (t: number) => (--t) * t * t + 1,

  /** 缓入缓出 - 三次 */
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  /** 平滑缓动 */
  smoothstep: (t: number) => t * t * (3 - 2 * t),

  /** 弹性缓出 */
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * 圆形轨道运镜
 * 绕焦点做完美的圆形旋转
 *
 * @param options - 运镜参数
 * @returns 相机目标位置
 */
export function applyOrbitMotion(options: CameraMotionOptions): pc.Vec3 {
  const { focus, baseVector, angle, immediate = true } = options;

  if (!focus || !baseVector) {
    return new pc.Vec3();
  }

  const rad = -angle * pc.math.DEG_TO_RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotatedVec = new pc.Vec3(
    baseVector.x * cos + baseVector.z * sin,
    baseVector.y,
    -baseVector.x * sin + baseVector.z * cos
  );

  return focus.clone().add(rotatedVec);
}

/**
 * 椭圆轨道运镜
 * 绕焦点做椭圆旋转，更符合人眼观察习惯
 *
 * @param options - 椭圆轨道参数
 * @returns 相机目标位置
 */
export function applyEllipseOrbit(options: EllipseOrbitOptions): pc.Vec3 {
  const {
    focus,
    baseVector,
    angle,
    scaleX = 1.0,
    scaleZ = 0.7,
    immediate = true,
  } = options;

  if (!focus || !baseVector) {
    return new pc.Vec3();
  }

  const rad = -angle * pc.math.DEG_TO_RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotatedVec = new pc.Vec3(
    (baseVector.x * cos + baseVector.z * sin) * scaleX,
    baseVector.y,
    (-baseVector.x * sin + baseVector.z * cos) * scaleZ
  );

  return focus.clone().add(rotatedVec);
}

/**
 * 螺旋运镜
 * 边旋转边升降，产生螺旋上升/下降的效果
 *
 * @param options - 螺旋运镜参数
 * @returns 相机目标位置
 */
export function applySpiralMotion(options: SpiralOptions): pc.Vec3 {
  const {
    focus,
    baseVector,
    angle,
    heightFactor = 0.3,
    radiusFactor = 1.0,
    immediate = true,
  } = options;

  if (!focus || !baseVector) {
    return new pc.Vec3();
  }

  const rad = -angle * pc.math.DEG_TO_RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // 高度随角度变化
  const heightChange = angle * heightFactor;

  // 半径随角度微调
  const radiusMultiplier = 1.0 + radiusFactor * Math.sin(rad);

  const rotatedVec = new pc.Vec3(
    (baseVector.x * cos + baseVector.z * sin) * radiusMultiplier,
    baseVector.y + heightChange,
    (-baseVector.x * sin + baseVector.z * cos) * radiusMultiplier
  );

  return focus.clone().add(rotatedVec);
}

/**
 * 推拉运镜
 * 模拟相机推进拉远效果
 *
 * @param options - 推拉运镜参数
 * @returns 相机目标位置
 */
export function applyDollyMotion(options: DollyOptions): pc.Vec3 {
  const {
    focus,
    baseVector,
    angle,
    distanceFactor = 0.3,
    oscillationPeriod = 2,
    immediate = true,
  } = options;

  if (!focus || !baseVector) {
    return new pc.Vec3();
  }

  const rad = -angle * pc.math.DEG_TO_RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // 距离随角度变化（近-远-近）
  const radiusMultiplier = 1.0 + distanceFactor * Math.sin(rad * oscillationPeriod);

  const rotatedVec = new pc.Vec3(
    baseVector.x * cos + baseVector.z * sin,
    baseVector.y,
    -baseVector.x * sin + baseVector.z * cos
  );

  // 应用距离变化
  rotatedVec.mulScalar(radiusMultiplier);

  return focus.clone().add(rotatedVec);
}

/**
 * 摇摆运镜
 * 模拟钟摆式的摇摆效果
 *
 * @param options - 摇摆运镜参数
 * @returns 相机目标位置
 */
export function applySwingMotion(options: SwingOptions): pc.Vec3 {
  const {
    focus,
    baseVector,
    angle,
    swingAmplitude = 30,
    swingCenter = 0,
    immediate = true,
  } = options;

  if (!focus || !baseVector) {
    return new pc.Vec3();
  }

  // 计算摇摆偏移
  const swingOffset = swingAmplitude * Math.sin(angle * pc.math.DEG_TO_RAD);
  const effectiveAngle = angle + swingOffset + swingCenter;

  const rad = -effectiveAngle * pc.math.DEG_TO_RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotatedVec = new pc.Vec3(
    baseVector.x * cos + baseVector.z * sin,
    baseVector.y,
    -baseVector.x * sin + baseVector.z * cos
  );

  return focus.clone().add(rotatedVec);
}

/**
 * 贝塞尔曲线位置计算
 * 计算三次贝塞尔曲线上的点
 *
 * @param p0 - 起点
 * @param p1 - 控制点1
 * @param p2 - 控制点2
 * @param p3 - 终点
 * @param t - 参数 [0, 1]
 * @returns 曲线上的点
 */
export function cubicBezier(
  p0: pc.Vec3,
  p1: pc.Vec3,
  p2: pc.Vec3,
  p3: pc.Vec3,
  t: number
): pc.Vec3 {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  const result = new pc.Vec3();
  result.x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
  result.y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;
  result.z = mt3 * p0.z + 3 * mt2 * t * p1.z + 3 * mt * t2 * p2.z + t3 * p3.z;

  return result;
}

/**
 * Catmull-Rom 样条插值
 * 保证路径连续且经过所有控制点
 *
 * @param p0 - 控制点0
 * @param p1 - 控制点1（曲线起点）
 * @param p2 - 控制点2（曲线终点）
 * @param p3 - 控制点3
 * @param t - 参数 [0, 1]
 * @returns 插值点
 */
function catmullRom(p0: pc.Vec3, p1: pc.Vec3, p2: pc.Vec3, p3: pc.Vec3, t: number): pc.Vec3 {
  const t2 = t * t;
  const t3 = t2 * t;

  const result = new pc.Vec3();
  result.x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  result.y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  result.z = 0.5 * ((2 * p1.z) + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3);

  return result;
}

/**
 * 沿预设路径移动相机（Catmull-Rom 样条）
 *
 * @param pathPoints - 路径点数组
 * @param t - 进度 [0, 1]
 * @param easing - 缓动函数
 * @returns 路径上的位置
 */
export function applyPathMotion(
  pathPoints: pc.Vec3[],
  t: number,
  easing: EasingFunction = Easing.easeInOutQuad
): pc.Vec3 {
  if (!pathPoints || pathPoints.length < 2) {
    return new pc.Vec3();
  }

  const n = pathPoints.length;

  // 只有一个点
  if (n === 1) {
    return pathPoints[0].clone();
  }

  const easedT = easing(Math.min(1, Math.max(0, t)));
  const segments = n - 1;
  const segmentT = easedT * segments;
  const segmentIndex = Math.floor(Math.min(segmentT, segments - 1));
  const localT = segmentT - segmentIndex;

  // 获取四个控制点，处理边界情况
  const p0 = pathPoints[Math.max(0, segmentIndex - 1)];
  const p1 = pathPoints[segmentIndex];
  const p2 = pathPoints[Math.min(segmentIndex + 1, n - 1)];
  const p3 = pathPoints[Math.min(segmentIndex + 2, n - 1)];

  return catmullRom(p0, p1, p2, p3, localT);
}

/**
 * 基于时间区间的路径运动
 * 根据每段路径的实际时长来计算位置
 *
 * @param pathPoints - 路径点数组（至少2个点）
 * @param time - 当前时间（秒）
 * @param durations - 每段路径的持续时间数组，长度应为 pathPoints.length - 1
 *                   例如：[2, 3, 1] 表示第1→2点用2秒，第2→3点用3秒，第3→4点用1秒
 * @param easing - 缓动函数
 * @returns 路径上的位置
 *
 * @example
 * const pathPoints = [p0, p1, p2, p3];
 * const durations = [2, 3, 1]; // 第0→1点2秒，第1→2点3秒，第2→3点1秒
 * const pos = applyTimedPathMotion(pathPoints, 1.5, durations); // 1.5秒时的位置（在第1段中间）
 */
export function applyTimedPathMotion(
  pathPoints: pc.Vec3[],
  time: number,
  durations: number[],
  easing: EasingFunction = Easing.easeInOutQuad
): pc.Vec3 {
  if (!pathPoints || pathPoints.length < 2 || !durations || durations.length < 1) {
    return pathPoints?.[0] ? pathPoints[0].clone() : new pc.Vec3();
  }

  const n = pathPoints.length;
  const segmentCount = n - 1;

  // 验证 durations 长度
  if (durations.length !== segmentCount) {
    console.warn(`durations length (${durations.length}) does not match path segments (${segmentCount}), using available durations`);
  }

  // 计算总时间
  const totalDuration = durations.reduce((sum, d) => sum + d, 0);

  if (totalDuration <= 0) {
    return pathPoints[0].clone();
  }

  // 只有一个点
  if (n === 1) {
    return pathPoints[0].clone();
  }

  // 边界处理
  const clampedTime = Math.max(0, Math.min(time, totalDuration));

  // 计算累计时间数组
  const cumulativeTimes: number[] = [0];
  for (let i = 0; i < durations.length; i++) {
    cumulativeTimes.push(cumulativeTimes[i] + durations[i]);
  }

  // 找到当前时间所在的段
  let segmentIndex = 0;
  for (let i = 0; i < segmentCount; i++) {
    if (clampedTime >= cumulativeTimes[i] && clampedTime <= cumulativeTimes[i + 1]) {
      segmentIndex = i;
      break;
    }
    if (i === segmentCount - 1) {
      segmentIndex = segmentCount - 1;
    }
  }

  // 计算在当前段内的局部时间 [0, 1]
  const segmentStartTime = cumulativeTimes[segmentIndex];
  const segmentEndTime = cumulativeTimes[Math.min(segmentIndex + 1, cumulativeTimes.length - 1)];
  const segmentDuration = segmentEndTime - segmentStartTime;

  if (segmentDuration <= 0) {
    return pathPoints[Math.min(segmentIndex + 1, n - 1)].clone();
  }

  const localT = (clampedTime - segmentStartTime) / segmentDuration;

  // 应用缓动
  const easedLocalT = easing(Math.min(1, Math.max(0, localT)));

  // 获取四个控制点
  const p0 = pathPoints[Math.max(0, segmentIndex - 1)];
  const p1 = pathPoints[segmentIndex];
  const p2 = pathPoints[Math.min(segmentIndex + 1, n - 1)];
  const p3 = pathPoints[Math.min(segmentIndex + 2, n - 1)];

  return catmullRom(p0, p1, p2, p3, easedLocalT);
}

/**
 * 复合运镜
 * 组合多种运镜效果
 *
 * @param baseFocus - 基础焦点
 * @param baseVector - 基础向量
 * @param angle - 角度
 * @param motionTypes - 运镜类型及参数数组
 * @returns 最终相机位置
 */
export function applyCompositeMotion(
  baseFocus: pc.Vec3,
  baseVector: pc.Vec3,
  angle: number,
  motionTypes: Array<{
    type: 'orbit' | 'ellipse' | 'spiral' | 'dolly' | 'swing';
    weight: number;
    options?: Record<string, any>;
  }>
): pc.Vec3 {
  if (!baseFocus || !baseVector || !motionTypes?.length) {
    return baseFocus.clone().add(baseVector);
  }

  let totalWeight = 0;
  const vectors: { vec: pc.Vec3; weight: number }[] = [];

  for (const motion of motionTypes) {
    let targetPos: pc.Vec3;

    switch (motion.type) {
      case 'orbit':
        targetPos = applyOrbitMotion({
          focus: baseFocus,
          baseVector,
          angle,
          ...motion.options,
        });
        break;
      case 'ellipse':
        targetPos = applyEllipseOrbit({
          focus: baseFocus,
          baseVector,
          angle,
          ...motion.options,
        });
        break;
      case 'spiral':
        targetPos = applySpiralMotion({
          focus: baseFocus,
          baseVector,
          angle,
          ...motion.options,
        });
        break;
      case 'dolly':
        targetPos = applyDollyMotion({
          focus: baseFocus,
          baseVector,
          angle,
          ...motion.options,
        });
        break;
      case 'swing':
        targetPos = applySwingMotion({
          focus: baseFocus,
          baseVector,
          angle,
          ...motion.options,
        });
        break;
      default:
        targetPos = baseFocus.clone().add(baseVector);
    }

    vectors.push({
      vec: targetPos.sub(baseFocus),
      weight: motion.weight,
    });
    totalWeight += motion.weight;
  }

  // 加权平均
  const result = new pc.Vec3();
  for (const v of vectors) {
    result.add(v.vec.clone().mulScalar(v.weight / totalWeight));
  }

  return baseFocus.clone().add(result);
}

/**
 * 8字形运镜（∞形）
 * 模拟相机做∞形状运动
 *
 * @param focus - 焦点位置
 * @param baseVector - 基础向量
 * @param angle - 角度
 * @returns 相机目标位置
 */
export function applyFigureEightMotion(
  focus: pc.Vec3,
  baseVector: pc.Vec3,
  angle: number
): pc.Vec3 {
  if (!focus || !baseVector) {
    return new pc.Vec3();
  }

  const rad = angle * pc.math.DEG_TO_RAD;

  // 8字形参数 - XZ平面
  const baseLength = baseVector.length();
  const amplitudeX = baseLength;
  const amplitudeZ = baseLength * 0.4; // Z轴幅度

  // X轴单周期，Z轴双周期 → 形成8字
  const x = Math.sin(rad) * amplitudeX;
  const z = Math.sin(rad * 2) * amplitudeZ;

  // 构建以焦点为中心的XZ平面坐标系
  // normalizedBase 指向原始相机方向
  const normalizedBase = baseVector.clone().normalize();

  // 计算垂直于 baseVector 的方向（在XZ平面）
  // 原始向量可能在Y方向有分量，需要投影到XZ平面
  const baseXZ = new pc.Vec3(normalizedBase.x, 0, normalizedBase.z);
  if (baseXZ.length() < 1e-6) {
    // 如果原始方向接近垂直，使用默认方向
    baseXZ.set(1, 0, 0);
  }
  baseXZ.normalize();

  // 垂直方向
  const perpendicular = new pc.Vec3(-baseXZ.z, 0, baseXZ.x).normalize();

  // 在XZ平面构建8字偏移
  const offset = new pc.Vec3();
  offset.add(baseXZ.clone().mulScalar(x));
  offset.add(perpendicular.clone().mulScalar(z));

  // 保持原始高度
  offset.y = baseVector.y;

  return focus.clone().add(offset);
}

/**
 * 渐变过渡运镜
 * 在两个位置之间平滑过渡
 *
 * @param fromPos - 起始位置
 * @param toPos - 目标位置
 * @param t - 进度 [0, 1]
 * @param easing - 缓动函数
 * @returns 过渡位置
 */
export function applyTransitionMotion(
  fromPos: pc.Vec3,
  toPos: pc.Vec3,
  t: number,
  easing: EasingFunction = Easing.easeInOutQuad
): pc.Vec3 {
  const easedT = easing(Math.min(1, Math.max(0, t)));
  const result = new pc.Vec3();
  result.lerp(fromPos, toPos, easedT);
  return result;
}

/**
 * 运镜类型枚举
 */
export enum MotionType {
  ORBIT = 'orbit',
  ELLIPSE = 'ellipse',
  SPIRAL = 'spiral',
  DOLLY = 'dolly',
  SWING = 'swing',
  FIGURE_EIGHT = 'figureEight',
  PATH = 'path',
  TRANSITION = 'transition',
}

/**
 * 通用运镜接口
 */
export interface MotionConfig {
  type: MotionType;
  params?: Record<string, any>;
}

/**
 * 默认运镜配置
 */
export const DefaultMotionConfigs: Record<MotionType, MotionConfig> = {
  [MotionType.ORBIT]: {
    type: MotionType.ORBIT,
    params: {},
  },
  [MotionType.ELLIPSE]: {
    type: MotionType.ELLIPSE,
    params: { scaleX: 1.0, scaleZ: 0.7 },
  },
  [MotionType.SPIRAL]: {
    type: MotionType.SPIRAL,
    params: { heightFactor: 0.3, radiusFactor: 0.1 },
  },
  [MotionType.DOLLY]: {
    type: MotionType.DOLLY,
    params: { distanceFactor: 0.3, oscillationPeriod: 2 },
  },
  [MotionType.SWING]: {
    type: MotionType.SWING,
    params: { swingAmplitude: 30, swingCenter: 0 },
  },
  [MotionType.FIGURE_EIGHT]: {
    type: MotionType.FIGURE_EIGHT,
    params: {},
  },
  [MotionType.PATH]: {
    type: MotionType.PATH,
    params: { points: [], easing: Easing.easeInOutQuad },
  },
  [MotionType.TRANSITION]: {
    type: MotionType.TRANSITION,
    params: { easing: Easing.easeInOutQuad },
  },
};
