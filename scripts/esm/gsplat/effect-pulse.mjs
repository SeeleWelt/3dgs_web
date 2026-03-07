import { Vec3, Color } from 'playcanvas';
import { GsplatShaderEffect } from './gsplat-shader-effect.mjs';

// GLSL 着色器（修改进度计算，从循环改为单次）
const pulseGLSL = /* glsl */`
uniform float uTime;
uniform vec3 uCenter;
uniform float uPulseRadius;
uniform float uPulseSpeed;
uniform float uPulseFrequency;
uniform float uScaleAmplitude;
uniform vec3 uPulseColor;
uniform float uColorIntensity;
uniform float uMaxDistance;
uniform float uTotalDuration; // 新增：特效总时长

// 共享全局变量
float g_dist3D;
float g_pulseProgress;
float g_globalProgress; // 新增：全局进度（0-1，单次完成）

void initShared(vec3 center) {
    g_dist3D = length(center - uCenter);
    // 计算全局进度（0-1，超过1则完成）
    g_globalProgress = clamp(uTime / uTotalDuration, 0.0, 1.0);
    // 计算当前脉冲在该位置的进度（基于全局进度，非循环）
    g_pulseProgress = (g_globalProgress * uPulseSpeed - g_dist3D / uPulseRadius) * uPulseFrequency;
    // 限制进度在0-1之间，避免循环
    g_pulseProgress = clamp(g_pulseProgress, 0.0, 1.0);
}

void modifySplatCenter(inout vec3 center) {
    initShared(center);
    
    // 超出最大距离或特效已完成则不修改
    if (g_dist3D > uMaxDistance || g_globalProgress >= 1.0) return;
    
    // 脉冲膨胀时的位置偏移（沿中心向外）
    vec3 dir = normalize(center - uCenter);
    float expandAmount = sin(g_pulseProgress * 3.14159 * 2.0) * uScaleAmplitude * 0.1;
    center += dir * expandAmount;
}

void modifySplatRotationScale(vec3 originalCenter, vec3 modifiedCenter, inout vec4 rotation, inout vec3 scale) {
    // 超出最大距离则隐藏
    if (g_dist3D > uMaxDistance) {
        scale = vec3(0.0);
        return;
    }
    
    // 特效完成后恢复原始大小和形状
    if (g_globalProgress >= 1.0) {
        return;
    }
    
    float origSize = gsplatGetSizeFromScale(scale);
    // 脉冲周期内的大小变化（正弦曲线）
    float scaleFactor = 1.0 + sin(g_pulseProgress * 3.14159 * 2.0) * uScaleAmplitude;
    scaleFactor = clamp(scaleFactor, 0.5, 2.0); // 限制缩放范围，避免过度变形
    gsplatMakeSpherical(scale, origSize * scaleFactor);
}

void modifySplatColor(vec3 center, inout vec4 color) {
    if (g_dist3D > uMaxDistance) return;
    
    // 特效完成后恢复原始颜色
    if (g_globalProgress >= 1.0) {
        return;
    }
    
    // 脉冲颜色叠加（脉冲峰值时颜色最强）
    float colorFactor = pow(sin(g_pulseProgress * 3.14159), 2.0) * uColorIntensity;
    color.rgb = mix(color.rgb, uPulseColor, colorFactor);
    // 保持透明度
    color.a = max(color.a, 0.1);
}
`;

// WGSL 着色器（同步修改）
const pulseWGSL = /* wgsl */`
uniform uTime: f32;
uniform uCenter: vec3f;
uniform uPulseRadius: f32;
uniform uPulseSpeed: f32;
uniform uPulseFrequency: f32;
uniform uScaleAmplitude: f32;
uniform uPulseColor: vec3f;
uniform uColorIntensity: f32;
uniform uMaxDistance: f32;
uniform uTotalDuration: f32; // 新增：特效总时长

var<private> g_dist3D: f32;
var<private> g_pulseProgress: f32;
var<private> g_globalProgress: f32; // 新增：全局进度

fn initShared(center: vec3f) {
    g_dist3D = length(center - uniform.uCenter);
    // 计算全局进度（0-1，超过1则完成）
    g_globalProgress = clamp(uniform.uTime / uniform.uTotalDuration, 0.0, 1.0);
    // 计算当前脉冲在该位置的进度（基于全局进度，非循环）
    g_pulseProgress = (g_globalProgress * uniform.uPulseSpeed - g_dist3D / uniform.uPulseRadius) * uniform.uPulseFrequency;
    // 限制进度在0-1之间，避免循环
    g_pulseProgress = clamp(g_pulseProgress, 0.0, 1.0);
}

fn modifySplatCenter(center: ptr<function, vec3f>) {
    initShared(*center);
    
    // 超出最大距离或特效已完成则不修改
    if (g_dist3D > uniform.uMaxDistance || g_globalProgress >= 1.0) return;
    
    let dir = normalize(*center - uniform.uCenter);
    let expandAmount = sin(g_pulseProgress * 3.14159 * 2.0) * uniform.uScaleAmplitude * 0.1;
    *center += dir * expandAmount;
}

fn modifySplatRotationScale(originalCenter: vec3f, modifiedCenter: vec3f, rotation: ptr<function, vec4f>, scale: ptr<function, vec3f>) {
    if (g_dist3D > uniform.uMaxDistance) {
        *scale = vec3f(0.0);
        return;
    }
    
    // 特效完成后恢复原始大小和形状
    if (g_globalProgress >= 1.0) {
        return;
    }
    
    let origSize = gsplatGetSizeFromScale(*scale);
    let scaleFactor = 1.0 + sin(g_pulseProgress * 3.14159 * 2.0) * uniform.uScaleAmplitude;
    let clampedFactor = clamp(scaleFactor, 0.5, 2.0);
    gsplatMakeSpherical(scale, origSize * clampedFactor);
}

fn modifySplatColor(center: vec3f, color: ptr<function, vec4f>) {
    if (g_dist3D > uniform.uMaxDistance) return;
    
    // 特效完成后恢复原始颜色
    if (g_globalProgress >= 1.0) {
        return;
    }
    
    let colorFactor = pow(sin(g_pulseProgress * 3.14159), 2.0) * uniform.uColorIntensity;
    (*color).rgb = mix((*color).rgb, uniform.uPulseColor, colorFactor);
    (*color).a = max((*color).a, 0.1);
}
`;

// 特效类（核心修改 isEffectComplete 方法）
class GsplatEffectPulse extends GsplatShaderEffect {
    static scriptName = 'gsplatEffectPulse';

    _centerArray = [0, 0, 0];
    _pulseColorArray = [0, 0, 0];

    // 特效参数（可在编辑器调整）
    center = new Vec3(0, 0, 0);          // 脉冲中心
    pulseRadius = 5.0;                   // 脉冲半径
    pulseSpeed = 1.0;                    // 脉冲传播速度
    pulseFrequency = 2.0;                // 脉冲频率（每秒次数）
    scaleAmplitude = 0.8;                // 缩放振幅（0-1）
    pulseColor = new Color(1.0, 0.2, 0.8); // 脉冲颜色（洋红）
    colorIntensity = 0.6;                // 颜色叠加强度
    maxDistance = 50.0;                  // 最大影响距离
    totalDuration = 3.0;                 // 新增：特效总时长（秒），控制单次动画长度

    getShaderGLSL() {
        return pulseGLSL;
    }

    getShaderWGSL() {
        return pulseWGSL;
    }

    updateEffect(effectTime, dt) {
        this.setUniform('uTime', effectTime);
        
        // 更新中心坐标
        this._centerArray[0] = this.center.x;
        this._centerArray[1] = this.center.y;
        this._centerArray[2] = this.center.z;
        this.setUniform('uCenter', this._centerArray);

        // 更新脉冲参数
        this.setUniform('uPulseRadius', this.pulseRadius);
        this.setUniform('uPulseSpeed', this.pulseSpeed);
        this.setUniform('uPulseFrequency', this.pulseFrequency);
        this.setUniform('uScaleAmplitude', this.scaleAmplitude);

        // 更新颜色参数
        this._pulseColorArray[0] = this.pulseColor.r;
        this._pulseColorArray[1] = this.pulseColor.g;
        this._pulseColorArray[2] = this.pulseColor.b;
        this.setUniform('uPulseColor', this._pulseColorArray);
        this.setUniform('uColorIntensity', this.colorIntensity);

        this.setUniform('uMaxDistance', this.maxDistance);
        this.setUniform('uTotalDuration', this.totalDuration); // 传递总时长到着色器
    }

    isEffectComplete() {
        // 核心修改：当特效时间超过总时长时，判定为完成
        // effectTime 是从特效启动开始计时的时间
        return this.effectTime >= this.totalDuration;
    }
}

export { GsplatEffectPulse };