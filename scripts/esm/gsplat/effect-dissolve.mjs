import { Vec3, Color } from 'playcanvas';
import { GsplatShaderEffect } from './gsplat-shader-effect.mjs';

// GLSL 着色器（新增颜色混合模式，dissolveColor精准生效）
const dissolveGLSL = /* glsl */`
uniform float uTime;
uniform vec3 uCenter;                // 恢复中心（模型局部坐标）
uniform float uNoiseScale;           // 噪点缩放（越小越粗糙）
uniform float uEdgeSmoothness;       // 恢复边缘平滑度
uniform vec3 uDissolveColor;         // 高亮色（精准生效）
uniform float uColorBlendMode;       // 0=叠加（默认），1=替换（直接显示设置的颜色）
uniform float uMaxDistance;          // 最大影响距离
uniform float uDissolveIntensity;    // 溶解/恢复基础强度（抖动/旋转/缩放）
uniform float uHighlightIntensity;   // 高亮色强度（0~+∞，控制浓淡）
uniform float uColorHoldRatio;       // 0~1 颜色持续占比，1=全程高亮
uniform float uTotalDuration;        // 固定3秒总时长
uniform float uRollbackDuration;     // 状态回滚缓冲时长（丝滑核心）

// 柏林噪点（自然纹理，保留原逻辑）
float random(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5431))) * 43758.5453);
}
float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = random(i);
    float b = random(i + vec3(1.0, 0.0, 0.0));
    float c = random(i + vec3(0.0, 1.0, 0.0));
    float d = random(i + vec3(1.0, 1.0, 0.0));
    float e = random(i + vec3(0.0, 0.0, 1.0));
    float f_val = random(i + vec3(1.0, 0.0, 1.0));
    float g = random(i + vec3(0.0, 1.0, 1.0));
    float h = random(i + vec3(1.0, 1.0, 1.0));
    return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
               mix(mix(e, f_val, f.x), mix(g, h, f.x), f.y), f.z);
}

// 共享变量
float g_dist3D;
float g_restoreProgress;    // 恢复进度（1→0，3秒完成）
float g_rollbackProgress;   // 状态回滚进度（0→1，末尾缓冲）
float g_colorFadeProgress;  // 颜色消退进度（0→1），仅由colorHoldRatio控制
float g_finalIntensity;     // 基础效果最终强度（抖动/旋转/缩放）
float g_finalHighlightInt;  // 高亮色最终强度（纯颜色控制）

void initShared(vec3 center) {
    g_dist3D = length(center - uCenter);
    g_restoreProgress = clamp(1.0 - (uTime / uTotalDuration), 0.0, 1.0);
    
    // 状态回滚缓冲
    float rollbackStartTime = uTotalDuration - uRollbackDuration;
    g_rollbackProgress = uTime < rollbackStartTime ? 0.0 : smoothstep(rollbackStartTime, uTotalDuration, uTime);

    // 基础效果强度：和颜色完全解耦
    g_finalIntensity = uDissolveIntensity * pow(1.0 - g_rollbackProgress, 2.0);

    // 颜色消退进度：colorHoldRatio=1时始终为0
    float colorHoldTime = uTotalDuration * uColorHoldRatio;
    g_colorFadeProgress = smoothstep(colorHoldTime, uTotalDuration, uTime);
    g_colorFadeProgress = clamp(g_colorFadeProgress, 0.0, 1.0);

    // 高亮色最终强度
    g_finalHighlightInt = uHighlightIntensity * (1.0 - g_colorFadeProgress) * pow(1.0 - g_rollbackProgress, 1.5);
}

void modifySplatCenter(inout vec3 center) {
    initShared(center);
    if (g_dist3D > uMaxDistance || g_finalIntensity <= 0.0) return;
    
    vec3 noiseVec = vec3(noise(center * uNoiseScale + uTime * 2.0),
                         noise(center * uNoiseScale * 1.2 + uTime * 2.2),
                         noise(center * uNoiseScale * 0.8 + uTime * 1.8));
    vec3 jitter = (noiseVec - 0.5) * 0.2 * g_finalIntensity;
    center = mix(center + jitter, center, g_rollbackProgress);
}

void modifySplatRotationScale(vec3 originalCenter, vec3 modifiedCenter, inout vec4 rotation, inout vec3 scale) {
    initShared(originalCenter);
    if (g_dist3D > uMaxDistance) return;
    
    float noiseVal = noise(originalCenter * uNoiseScale);
    float restoreThreshold = g_restoreProgress - (noiseVal * uEdgeSmoothness * (1.0 - g_rollbackProgress * 0.5));
    restoreThreshold = clamp(restoreThreshold, 0.0, 1.0);
    
    float scaleFactor = smoothstep(0.0, 0.99, restoreThreshold);
    vec3 targetScale = mix(vec3(0.0), scale, 1.0 - scaleFactor);
    scale = mix(targetScale, scale, g_rollbackProgress);
    
    if (g_finalIntensity > 0.0) {
        float rotateAmplitude = 1.0 * g_finalIntensity;
        vec4 targetRot = rotation;
        targetRot.x += noise(originalCenter) * g_restoreProgress * rotateAmplitude;
        targetRot.y += noise(originalCenter * 2.0) * g_restoreProgress * rotateAmplitude;
        rotation = mix(targetRot, rotation, g_rollbackProgress);
    }
}

void modifySplatColor(vec3 center, inout vec4 color) {
    initShared(center);
    if (g_dist3D > uMaxDistance || g_finalHighlightInt <= 0.0) return;
    
    // 加宽边缘检测，确保高亮效果明显
    float noiseVal = noise(center * uNoiseScale);
    float restoreThreshold = g_restoreProgress - (noiseVal * uEdgeSmoothness);
    float edge = smoothstep(0.6, 0.99, restoreThreshold) * (1.0 - smoothstep(0.99, 1.2, restoreThreshold));
    
    // 高亮色基础计算
    vec3 highlight = uDissolveColor * edge * g_finalHighlightInt;
    // 【核心修改】根据混合模式选择叠加/替换
    vec3 finalColor;
    if (uColorBlendMode < 0.5) {
        // 0=叠加模式（原逻辑，适合高亮）
        finalColor = color.rgb + highlight;
    } else {
        // 1=替换模式（直接显示设置的颜色，精准生效）
        finalColor = mix(color.rgb, uDissolveColor, edge * g_finalHighlightInt);
    }
    
    // 高亮色随回滚平滑融合到原始纹理
    color.rgb = mix(finalColor, color.rgb, g_rollbackProgress * 0.5);
    
    // 透明度丝滑恢复+回滚
    float alphaFactor = smoothstep(0.0, 0.99, restoreThreshold);
    float targetAlpha = mix(0.0, color.a, 1.0 - alphaFactor);
    color.a = mix(targetAlpha, color.a, g_rollbackProgress);
}
`;

// WGSL 着色器（同步新增颜色混合模式）
const dissolveWGSL = /* wgsl */`
uniform uTime: f32;
uniform uCenter: vec3f;
uniform uNoiseScale: f32;
uniform uEdgeSmoothness: f32;
uniform uDissolveColor: vec3f;
uniform uColorBlendMode: f32;       // 0=叠加，1=替换
uniform uMaxDistance: f32;
uniform uDissolveIntensity: f32;
uniform uHighlightIntensity: f32;
uniform uColorHoldRatio: f32;       // 0~1 颜色持续占比，1=全程高亮
uniform uTotalDuration: f32;
uniform uRollbackDuration: f32;     // 仅保留回滚参数

fn random(p: vec3f) -> f32 {
    return fract(sin(dot(p, vec3f(12.9898, 78.233, 45.5431))) * 43758.5453);
}
fn noise(p: vec3f) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let f_smooth = f * f * (3.0 - 2.0 * f);
    let a = random(i);
    let b = random(i + vec3f(1.0, 0.0, 0.0));
    let c = random(i + vec3f(0.0, 1.0, 0.0));
    let d = random(i + vec3f(1.0, 1.0, 0.0));
    let e = random(i + vec3f(0.0, 0.0, 1.0));
    let f_val = random(i + vec3f(1.0, 0.0, 1.0));
    let g = random(i + vec3f(0.0, 1.0, 1.0));
    let h = random(i + vec3f(1.0, 1.0, 1.0));
    return mix(mix(mix(a, b, f_smooth.x), mix(c, d, f_smooth.x), f_smooth.y),
               mix(mix(e, f_val, f_smooth.x), mix(g, h, f_smooth.x), f_smooth.y), f_smooth.z);
}

var<private> g_dist3D: f32;
var<private> g_restoreProgress: f32;
var<private> g_rollbackProgress: f32;
var<private> g_colorFadeProgress: f32;
var<private> g_finalIntensity: f32;
var<private> g_finalHighlightInt: f32;

fn initShared(center: vec3f) {
    g_dist3D = length(center - uniform.uCenter);
    g_restoreProgress = clamp(1.0 - (uniform.uTime / uniform.uTotalDuration), 0.0, 1.0);
    
    // 状态回滚缓冲
    let rollbackStartTime = uniform.uTotalDuration - uniform.uRollbackDuration;
    g_rollbackProgress = uniform.uTime < rollbackStartTime ? 0.0 : smoothstep(rollbackStartTime, uniform.uTotalDuration, uniform.uTime);

    // 基础效果强度：和颜色完全解耦
    g_finalIntensity = uniform.uDissolveIntensity * pow(1.0 - g_rollbackProgress, 2.0);

    // 颜色消退进度：colorHoldRatio=1时始终为0
    let colorHoldTime = uniform.uTotalDuration * uniform.uColorHoldRatio;
    g_colorFadeProgress = smoothstep(colorHoldTime, uniform.uTotalDuration, uniform.uTime);
    g_colorFadeProgress = clamp(g_colorFadeProgress, 0.0, 1.0);

    // 高亮色最终强度
    g_finalHighlightInt = uniform.uHighlightIntensity * (1.0 - g_colorFadeProgress) * pow(1.0 - g_rollbackProgress, 1.5);
}

fn modifySplatCenter(center: ptr<function, vec3f>) {
    initShared(*center);
    if (g_dist3D > uniform.uMaxDistance || g_finalIntensity <= 0.0) return;
    
    let noiseVec = vec3f(noise(*center * uniform.uNoiseScale + uniform.uTime * 2.0),
                         noise(*center * uniform.uNoiseScale * 1.2 + uniform.uTime * 2.2),
                         noise(*center * uniform.uNoiseScale * 0.8 + uniform.uTime * 1.8));
    let jitter = (noiseVec - 0.5) * 0.2 * g_finalIntensity;
    *center = mix(*center + jitter, *center, g_rollbackProgress);
}

fn modifySplatRotationScale(originalCenter: vec3f, modifiedCenter: vec3f, rotation: ptr<function, vec4f>, scale: ptr<function, vec3f>) {
    initShared(originalCenter);
    if (g_dist3D > uniform.uMaxDistance) return;
    
    let noiseVal = noise(originalCenter * uniform.uNoiseScale);
    let restoreThreshold = g_restoreProgress - (noiseVal * uniform.uEdgeSmoothness * (1.0 - g_rollbackProgress * 0.5));
    let clampedThreshold = clamp(restoreThreshold, 0.0, 1.0);
    
    let scaleFactor = smoothstep(0.0, 0.99, clampedThreshold);
    let targetScale = mix(vec3f(0.0), *scale, 1.0 - scaleFactor);
    *scale = mix(targetScale, *scale, g_rollbackProgress);
    
    if (g_finalIntensity > 0.0) {
        let rotateAmplitude = 1.0 * g_finalIntensity;
        var targetRot = *rotation;
        targetRot.x += noise(originalCenter) * g_restoreProgress * rotateAmplitude;
        targetRot.y += noise(originalCenter * 2.0) * g_restoreProgress * rotateAmplitude;
        *rotation = mix(targetRot, *rotation, g_rollbackProgress);
    }
}

fn modifySplatColor(center: vec3f, color: ptr<function, vec4f>) {
    initShared(center);
    if (g_dist3D > uniform.uMaxDistance || g_finalHighlightInt <= 0.0) return;
    
    // 加宽边缘检测，确保高亮效果明显
    let noiseVal = noise(center * uniform.uNoiseScale);
    let restoreThreshold = g_restoreProgress - (noiseVal * uniform.uEdgeSmoothness);
    let edge = smoothstep(0.6, 0.99, restoreThreshold) * (1.0 - smoothstep(0.99, 1.2, restoreThreshold));
    
    // 高亮色基础计算
    let highlight = uniform.uDissolveColor * edge * g_finalHighlightInt;
    // 根据混合模式选择叠加/替换
    var finalColor: vec3f;
    if (uniform.uColorBlendMode < 0.5) {
        // 0=叠加模式
        finalColor = (*color).rgb + highlight;
    } else {
        // 1=替换模式（精准显示设置的颜色）
        finalColor = mix((*color).rgb, uniform.uDissolveColor, edge * g_finalHighlightInt);
    }
    
    // 高亮色随回滚平滑融合到原始纹理
    (*color).rgb = mix(finalColor, (*color).rgb, g_rollbackProgress * 0.5);
    
    // 透明度恢复
    let alphaFactor = smoothstep(0.0, 0.99, restoreThreshold);
    let targetAlpha = mix(0.0, (*color).a, 1.0 - alphaFactor);
    (*color).a = mix(targetAlpha, (*color).a, g_rollbackProgress);
}
`;

// 特效类（新增颜色混合模式参数）
class GsplatEffectDissolve extends GsplatShaderEffect {
    static scriptName = 'gsplatEffectDissolve';

    _centerArray = [0, 0, 0];
    _dissolveColorArray = [0, 0, 0];

    // 基础参数（新增colorBlendMode）
    center = new Vec3(0, 0, 0);          // 恢复中心
    noiseScale = 2.5;                    // 噪点细腻度
    edgeSmoothness = 0.4;                // 边缘平滑度
    dissolveColor = new Color(1.0, 0.0, 0.0); // 纯红色（现在会精准显示）
    colorBlendMode = 1.0;                // 0=叠加（原逻辑），1=替换（精准显示颜色）
    maxDistance = 30.0;                  // 最大影响距离
    dissolveIntensity = 1.2;             // 基础效果强度（抖动/旋转/缩放）
    highlightIntensity = 20.0;           // 高亮色浓淡（替换模式下调大更明显）
    colorHoldRatio = 1.0;                // 0~1 颜色持续占比，1=全程高亮
    totalDuration = 3.0;                 // 固定3秒总时长
    rollbackDuration = 0.3;              // 末尾丝滑回滚时长

    getShaderGLSL() {
        return dissolveGLSL;
    }

    getShaderWGSL() {
        return dissolveWGSL;
    }

    updateEffect(effectTime, dt) {
        this.setUniform('uTime', effectTime);
        // 传递恢复中心
        this._centerArray[0] = this.center.x;
        this._centerArray[1] = this.center.y;
        this._centerArray[2] = this.center.z;
        this.setUniform('uCenter', this._centerArray);
        // 传递所有核心参数
        this.setUniform('uNoiseScale', this.noiseScale);
        this.setUniform('uEdgeSmoothness', this.edgeSmoothness);
        // 颜色参数
        this._dissolveColorArray[0] = this.dissolveColor.r;
        this._dissolveColorArray[1] = this.dissolveColor.g;
        this._dissolveColorArray[2] = this.dissolveColor.b;
        this.setUniform('uDissolveColor', this._dissolveColorArray);
        this.setUniform('uColorBlendMode', this.colorBlendMode); // 混合模式
        // 核心控制参数
        this.setUniform('uMaxDistance', this.maxDistance);
        this.setUniform('uDissolveIntensity', this.dissolveIntensity);
        this.setUniform('uHighlightIntensity', this.highlightIntensity);
        this.setUniform('uColorHoldRatio', this.colorHoldRatio); // 颜色时长
        // 时长参数
        this.setUniform('uTotalDuration', this.totalDuration);
        this.setUniform('uRollbackDuration', this.rollbackDuration);
    }

    isEffectComplete() {
        return this.effectTime >= this.totalDuration;
    }
}

export { GsplatEffectDissolve };