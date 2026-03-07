import { Vec3, Color } from 'playcanvas';
import { GsplatShaderEffect } from './gsplat-shader-effect.mjs';

// GLSL 着色器（核心修改：自定义局部中心点+强度全链路生效+距离基于模型局部坐标）
const latticeGLSL = /* glsl */`
uniform float uTime;
uniform vec3 uLatticeSize;      // 晶格大小（X/Y/Z）
uniform float uWarpAmplitude;   // 基础扭曲振幅
uniform float uWarpSpeed;       // 扭曲速度
uniform float uLatticeIntensity;// 整体强度（全局控制，调参立竿见影）
uniform vec3 uLatticeColor;     // 晶格颜色
uniform float uMaxDistance;     // 模型局部坐标下的最大影响距离
uniform float uTotalDuration;   // 特效总时长
uniform float uFadeDuration;    // 末尾衰减时长
uniform vec3 uModelStartPoint;  // 模型局部坐标的指定开始点（核心！从这里开始晶格化）

// 共享变量
float g_dist3D;                 // 模型局部坐标下：当前点到指定开始点的距离
vec3 g_latticePos;              // 晶格化后的局部坐标位置
float g_globalProgress;         // 全局进度（0-1）
float g_fadeProgress;           // 衰减进度（1→0，动画末尾渐变减弱）
float g_finalIntensity;         // 最终有效强度（强度*衰减，全链路生效）

// 晶格化函数：基于模型局部坐标吸附到晶格网格
vec3 latticeize(vec3 pos, vec3 latticeSize, vec3 startPoint) {
    // 从指定开始点开始计算晶格，而非世界原点
    vec3 relativePos = pos - startPoint;
    return startPoint + floor(relativePos / latticeSize) * latticeSize + latticeSize * 0.5;
}

void initShared(vec3 modelLocalCenter) {
    // 1. 计算：模型局部坐标下，当前点到指定开始点的直线距离（核心！从指定点出发）
    g_dist3D = length(modelLocalCenter - uModelStartPoint);
    
    // 2. 全局进度：0→1 线性推进，超过1固定为1
    g_globalProgress = clamp(uTime / uTotalDuration, 0.0, 1.0);
    
    // 3. 衰减进度：动画前(totalDuration-fadeDuration)秒满效果，末尾平滑减到0
    float fadeStart = uTotalDuration - uFadeDuration;
    g_fadeProgress = g_globalProgress < (fadeStart / uTotalDuration) 
        ? 1.0 
        : 1.0 - smoothstep(fadeStart / uTotalDuration, 1.0, g_globalProgress);
    
    // 4. 最终有效强度：整体强度 * 衰减进度（全链路唯一强度因子，调参立竿见影）
    g_finalIntensity = uLatticeIntensity * g_fadeProgress;
    
    // 5. 基于模型局部坐标+指定开始点，计算晶格化位置
    g_latticePos = latticeize(modelLocalCenter, uLatticeSize, uModelStartPoint);
}

void modifySplatCenter(inout vec3 modelLocalCenter) {
    initShared(modelLocalCenter);
    
    // 超出最大距离 或 无有效强度 → 不修改位置
    if (g_dist3D > uMaxDistance || g_finalIntensity <= 0.0) return;
    
    // 晶格扭曲：基础振幅 * 最终强度（强度直接控制扭曲幅度）
    float warpTime = g_globalProgress * uWarpSpeed * uTotalDuration;
    vec3 warp = sin(g_latticePos * 2.0 + warpTime) * uWarpAmplitude * g_finalIntensity;
    modelLocalCenter += warp;
    
    // 晶格吸附：吸附力度 * 最终强度（强度控制吸附强弱）
    vec3 dirToLattice = g_latticePos - modelLocalCenter;
    modelLocalCenter += dirToLattice * g_finalIntensity * 0.2; // 0.2为基础吸附系数
}

void modifySplatRotationScale(vec3 originalCenter, vec3 modifiedCenter, inout vec4 rotation, inout vec3 scale) {
    initShared(originalCenter);
    
    if (g_dist3D > uMaxDistance || g_finalIntensity <= 0.0) return;
    
    // 晶格缩放变形：变形幅度 * 最终强度（强度控制缩放扭曲）
    float warpTime = g_globalProgress * uWarpSpeed * uTotalDuration;
    float latticeScaleOffset = sin(length(g_latticePos) * 0.5 + warpTime) * 0.3 * g_finalIntensity;
    float latticeScale = 1.0 + latticeScaleOffset; // 基于1（原始大小）做偏移，更自然
    scale *= latticeScale;
    
    // 晶格方向拉伸：拉伸幅度 * 最终强度（强度控制拉伸强弱）
    float stretchFactor = 0.15 * g_finalIntensity; // 0.15为基础拉伸系数
    scale.x *= (1.0 + sin(g_latticePos.y * uWarpSpeed) * stretchFactor);
    scale.z *= (1.0 + cos(g_latticePos.x * uWarpSpeed) * stretchFactor);
}

void modifySplatColor(vec3 modelLocalCenter, inout vec4 color) {
    initShared(modelLocalCenter);
    
    if (g_dist3D > uMaxDistance || g_finalIntensity <= 0.0) return;
    
    // 晶格颜色叠加：叠加力度 * 最终强度（强度控制颜色深浅）
    float warpTime = g_globalProgress * uWarpSpeed * uTotalDuration;
    float latticeDot = dot(sin(g_latticePos * 1.0 + warpTime), vec3(0.5));
    float colorMixFactor = pow(abs(latticeDot), 2.0) * g_finalIntensity;
    color.rgb = mix(color.rgb, uLatticeColor, colorMixFactor);
    
    // 晶格边缘亮度：边缘对比 * 最终强度（强度控制边缘明暗）
    float edge = smoothstep(0.0, uLatticeSize.x * 0.5, distance(modelLocalCenter, g_latticePos));
    float edgeDarken = edge * 0.2 * g_finalIntensity;
    color.rgb *= (1.0 - edgeDarken);
}
`;

// WGSL 着色器（和GLSL逻辑完全对齐：指定开始点+强度全链路生效）
const latticeWGSL = /* wgsl */`
uniform uTime: f32;
uniform uLatticeSize: vec3f;
uniform uWarpAmplitude: f32;
uniform uWarpSpeed: f32;
uniform uLatticeIntensity: f32;
uniform uLatticeColor: vec3f;
uniform uMaxDistance: f32;
uniform uTotalDuration: f32;
uniform uFadeDuration: f32;
uniform uModelStartPoint: vec3f; // 模型局部坐标的指定开始点

var<private> g_dist3D: f32;
var<private> g_latticePos: vec3f;
var<private> g_globalProgress: f32;
var<private> g_fadeProgress: f32;
var<private> g_finalIntensity: f32;

fn latticeize(pos: vec3f, latticeSize: vec3f, startPoint: vec3f) -> vec3f {
    let relativePos = pos - startPoint;
    return startPoint + floor(relativePos / latticeSize) * latticeSize + latticeSize * 0.5;
}

fn initShared(modelLocalCenter: vec3f) {
    g_dist3D = length(modelLocalCenter - uniform.uModelStartPoint);
    g_globalProgress = clamp(uniform.uTime / uniform.uTotalDuration, 0.0, 1.0);
    
    let fadeStart = uniform.uTotalDuration - uniform.uFadeDuration;
    g_fadeProgress = g_globalProgress < (fadeStart / uniform.uTotalDuration) 
        ? 1.0 
        : 1.0 - smoothstep(fadeStart / uniform.uTotalDuration, 1.0, g_globalProgress);
    
    g_finalIntensity = uniform.uLatticeIntensity * g_fadeProgress;
    g_latticePos = latticeize(modelLocalCenter, uniform.uLatticeSize, uniform.uModelStartPoint);
}

fn modifySplatCenter(center: ptr<function, vec3f>) {
    initShared(*center);
    
    if (g_dist3D > uniform.uMaxDistance || g_finalIntensity <= 0.0) return;
    
    let warpTime = g_globalProgress * uniform.uWarpSpeed * uniform.uTotalDuration;
    let warp = sin(g_latticePos * 2.0 + warpTime) * uniform.uWarpAmplitude * g_finalIntensity;
    *center += warp;
    
    let dirToLattice = g_latticePos - *center;
    *center += dirToLattice * g_finalIntensity * 0.2;
}

fn modifySplatRotationScale(originalCenter: vec3f, modifiedCenter: vec3f, rotation: ptr<function, vec4f>, scale: ptr<function, vec3f>) {
    initShared(originalCenter);
    
    if (g_dist3D > uniform.uMaxDistance || g_finalIntensity <= 0.0) return;
    
    let warpTime = g_globalProgress * uniform.uWarpSpeed * uniform.uTotalDuration;
    let latticeScaleOffset = sin(length(g_latticePos) * 0.5 + warpTime) * 0.3 * g_finalIntensity;
    let latticeScale = 1.0 + latticeScaleOffset;
    *scale *= latticeScale;
    
    let stretchFactor = 0.15 * g_finalIntensity;
    (*scale).x *= (1.0 + sin(g_latticePos.y * uniform.uWarpSpeed) * stretchFactor);
    (*scale).z *= (1.0 + cos(g_latticePos.x * uniform.uWarpSpeed) * stretchFactor);
}

fn modifySplatColor(center: vec3f, color: ptr<function, vec4f>) {
    initShared(center);
    
    if (g_dist3D > uniform.uMaxDistance || g_finalIntensity <= 0.0) return;
    
    let warpTime = g_globalProgress * uniform.uWarpSpeed * uniform.uTotalDuration;
    let latticeDot = dot(sin(g_latticePos * 1.0 + warpTime), vec3f(0.5));
    let colorMixFactor = pow(abs(latticeDot), 2.0) * g_finalIntensity;
    (*color).rgb = mix((*color).rgb, uniform.uLatticeColor, colorMixFactor);
    
    let edge = smoothstep(0.0, uniform.uLatticeSize.x * 0.5, distance(center, g_latticePos));
    let edgeDarken = edge * 0.2 * g_finalIntensity;
    (*color).rgb *= (1.0 - edgeDarken);
}
`;

// 特效类（新增模型局部开始点参数+强度逻辑重构+默认参数优化）
class GsplatEffectLattice extends GsplatShaderEffect {
    static scriptName = 'gsplatEffectLattice';

    _latticeSizeArray = [0, 0, 0];
    _latticeColorArray = [0, 0, 0];
    _modelStartPointArray = [0, 0, 0]; // 模型局部开始点数组

    // 特效参数（全部可配置，注释说明清晰）
    latticeSize = new Vec3(2.0, 2.0, 2.0); // 晶格大小，值越小晶格越密集
    warpAmplitude = 0.6;                   // 基础扭曲振幅，配合强度控制最终扭曲
    warpSpeed = 0.8;                       // 扭曲速度，值越小动画越舒缓
    latticeIntensity = 0.5;                // 整体强度（核心！0=无效果，1=满效果，>1可超强度）
    latticeColor = new Color(0.8, 0.2, 1.0);// 晶格叠加颜色（紫粉色）
    maxDistance = 30.0;                    // 模型局部坐标下的最大影响距离（超出则无效果）
    totalDuration = 4.0;                   // 特效总时长（建议3~5秒）
    fadeDuration = 1.5;                    // 末尾衰减时长（建议总时长的1/3~1/2）
    modelStartPoint = new Vec3(0, 0, 0);   // 模型局部坐标的指定开始点【核心】，默认模型中心

    getShaderGLSL() {
        return latticeGLSL;
    }

    getShaderWGSL() {
        return latticeWGSL;
    }

    updateEffect(effectTime, dt) {
        this.setUniform('uTime', effectTime);
        
        // 传递晶格大小
        this._latticeSizeArray[0] = this.latticeSize.x;
        this._latticeSizeArray[1] = this.latticeSize.y;
        this._latticeSizeArray[2] = this.latticeSize.z;
        this.setUniform('uLatticeSize', this._latticeSizeArray);

        // 传递核心动效参数
        this.setUniform('uWarpAmplitude', this.warpAmplitude);
        this.setUniform('uWarpSpeed', this.warpSpeed);
        this.setUniform('uLatticeIntensity', this.latticeIntensity);

        // 传递晶格颜色
        this._latticeColorArray[0] = this.latticeColor.r;
        this._latticeColorArray[1] = this.latticeColor.g;
        this._latticeColorArray[2] = this.latticeColor.b;
        this.setUniform('uLatticeColor', this._latticeColorArray);

        // 传递范围+时长参数
        this.setUniform('uMaxDistance', this.maxDistance);
        this.setUniform('uTotalDuration', this.totalDuration);
        this.setUniform('uFadeDuration', this.fadeDuration);

        // 传递【核心】模型局部开始点（从这里开始晶格化）
        this._modelStartPointArray[0] = this.modelStartPoint.x;
        this._modelStartPointArray[1] = this.modelStartPoint.y;
        this._modelStartPointArray[2] = this.modelStartPoint.z;
        this.setUniform('uModelStartPoint', this._modelStartPointArray);
    }

    isEffectComplete() {
        // 总时长结束则判定特效完成，触发管理器自动清理
        return this.effectTime >= this.totalDuration;
    }
}

export { GsplatEffectLattice };