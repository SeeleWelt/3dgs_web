import { Vec3, Color } from 'playcanvas';
import { GsplatShaderEffect } from './gsplat-shader-effect.mjs';

// GLSL 着色器（优化版）
const lightSweepGLSL = /* glsl */`
uniform float uTime;
uniform vec3 uSweepDir;       // 扫光方向（单位向量）
uniform float uSweepSpeed;    // 扫光速度
uniform float uSweepWidth;    // 扫光宽度
uniform vec3 uHighlightColor; // 高光颜色
uniform float uHighlightIntensity; // 高光强度
uniform float uShadowIntensity;   // 阴影强度
uniform float uMaxDistance;   // 最大影响距离
uniform float uPulseFreq;     // 脉冲频率（增加灵动性）
uniform float uEdgeSmooth;    // 边缘平滑度
uniform float uProgress;      // 扫光进度（0-1-0 循环）

// 共享变量
float g_dotProduct;
float g_sweepProgress;
float g_sweepIntensity;

void initShared(vec3 center) {
    // 计算中心点在扫光方向上的投影
    g_dotProduct = dot(center, normalize(uSweepDir));
    // 扫光进度（随时间移动）
    g_sweepProgress = uTime * uSweepSpeed - g_dotProduct;
    
    // 计算扫光核心强度（添加脉冲效果）
    float baseIntensity = smoothstep(-uSweepWidth * uEdgeSmooth, 0.0, g_sweepProgress) - 
                          smoothstep(0.0, uSweepWidth * uEdgeSmooth, g_sweepProgress);
    // 添加正弦脉冲，让扫光有呼吸效果
    g_sweepIntensity = baseIntensity * (0.5 + 0.5 * sin(uTime * uPulseFreq));
    // 限制强度范围
    g_sweepIntensity = clamp(g_sweepIntensity, 0.0, 1.0);
}

void modifySplatCenter(inout vec3 center) {
    initShared(center);
    
    float dist = length(center);
    if (dist > uMaxDistance) return;
    
    // 距离衰减，边缘效果更弱
    float distAttenuation = 1.0 - smoothstep(uMaxDistance * 0.5, uMaxDistance, dist);
    // 扫光经过时的微小抬升（更自然的曲线）
    float liftAmount = pow(g_sweepIntensity, 1.5) * 0.15 * uHighlightIntensity * distAttenuation;
    // 叠加轻微的垂直波动
    liftAmount *= (1.0 + 0.1 * sin(g_dotProduct * 2.0 + uTime * 1.5));
    center.y += liftAmount;
}

void modifySplatRotationScale(vec3 originalCenter, vec3 modifiedCenter, inout vec4 rotation, inout vec3 scale) {
    float dist = length(originalCenter);
    if (dist > uMaxDistance) return;
    
    float distAttenuation = 1.0 - smoothstep(uMaxDistance * 0.5, uMaxDistance, dist);
    // 扫光经过时轻微放大（非线性缩放更自然）
    float scaleBoost = pow(g_sweepIntensity, 1.2) * 0.25;
    float scaleFactor = 1.0 + scaleBoost * distAttenuation;
    scale *= scaleFactor;
    
    // 非扫光区域轻微缩小（模拟阴影，更柔和）
    float shadowFactor = 1.0 - (1.0 - g_sweepIntensity) * uShadowIntensity * 0.08 * distAttenuation;
    scale *= shadowFactor;
    
    // 添加微小的随机缩放变化
    float random = fract(sin(dot(originalCenter, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
    scale *= 1.0 + (random - 0.5) * 0.02 * g_sweepIntensity;
}

void modifySplatColor(vec3 center, inout vec4 color) {
    float dist = length(center);
    if (dist > uMaxDistance) return;
    
    float distAttenuation = 1.0 - smoothstep(uMaxDistance * 0.3, uMaxDistance, dist);
    float finalIntensity = g_sweepIntensity * distAttenuation;
    
    // 添加高光颜色（带渐变）
    vec3 highlight = uHighlightColor * finalIntensity * uHighlightIntensity;
    // 高光颜色随距离渐变
    highlight *= (1.0 + 0.3 * sin(dist * 0.5 + uTime * 2.0));
    color.rgb += highlight;
    
    // 辉光效果：高光区域额外提亮
    color.rgb += pow(finalIntensity, 2.0) * uHighlightColor * 0.5;
    
    // 非扫光区域添加阴影（更柔和的过渡）
    float shadow = 1.0 - (1.0 - finalIntensity) * uShadowIntensity * 0.8;
    color.rgb *= shadow;
    
    // 动态透明度，扫光区域更亮更透
    color.a = mix(color.a, max(color.a, 0.3), finalIntensity);
    // 确保最小透明度
    color.a = max(color.a, 0.15);
    
    // 颜色饱和度调整
    float saturation = 1.0 + finalIntensity * 0.3;
    vec3 gray = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));
    color.rgb = mix(gray, color.rgb, saturation);
}
`;

// WGSL 着色器（优化版）
const lightSweepWGSL = /* wgsl */`
uniform uTime: f32;
uniform uSweepDir: vec3f;
uniform uSweepSpeed: f32;
uniform uSweepWidth: f32;
uniform uHighlightColor: vec3f;
uniform uHighlightIntensity: f32;
uniform uShadowIntensity: f32;
uniform uMaxDistance: f32;
uniform uPulseFreq: f32;
uniform uEdgeSmooth: f32;
uniform uProgress: f32;

var<private> g_dotProduct: f32;
var<private> g_sweepProgress: f32;
var<private> g_sweepIntensity: f32;

fn initShared(center: vec3f) {
    g_dotProduct = dot(center, normalize(uniform.uSweepDir));
    g_sweepProgress = uniform.uTime * uniform.uSweepSpeed - g_dotProduct;
    
    // 计算扫光核心强度（添加脉冲效果）
    let baseIntensity = smoothstep(-uniform.uSweepWidth * uniform.uEdgeSmooth, 0.0, g_sweepProgress) - 
                        smoothstep(0.0, uniform.uSweepWidth * uniform.uEdgeSmooth, g_sweepProgress);
    // 添加正弦脉冲，让扫光有呼吸效果
    g_sweepIntensity = baseIntensity * (0.5 + 0.5 * sin(uniform.uTime * uniform.uPulseFreq));
    // 限制强度范围
    g_sweepIntensity = clamp(g_sweepIntensity, 0.0, 1.0);
}

fn modifySplatCenter(center: ptr<function, vec3f>) {
    initShared(*center);
    
    let dist = length(*center);
    if (dist > uniform.uMaxDistance) return;
    
    // 距离衰减，边缘效果更弱
    let distAttenuation = 1.0 - smoothstep(uniform.uMaxDistance * 0.5, uniform.uMaxDistance, dist);
    // 扫光经过时的微小抬升（更自然的曲线）
    let liftAmount = pow(g_sweepIntensity, 1.5) * 0.15 * uniform.uHighlightIntensity * distAttenuation;
    // 叠加轻微的垂直波动
    let liftVariation = 1.0 + 0.1 * sin(g_dotProduct * 2.0 + uniform.uTime * 1.5);
    (*center).y += liftAmount * liftVariation;
}

fn modifySplatRotationScale(originalCenter: vec3f, modifiedCenter: vec3f, rotation: ptr<function, vec4f>, scale: ptr<function, vec3f>) {
    let dist = length(originalCenter);
    if (dist > uniform.uMaxDistance) return;
    
    let distAttenuation = 1.0 - smoothstep(uniform.uMaxDistance * 0.5, uniform.uMaxDistance, dist);
    // 扫光经过时轻微放大（非线性缩放更自然）
    let scaleBoost = pow(g_sweepIntensity, 1.2) * 0.25;
    let scaleFactor = 1.0 + scaleBoost * distAttenuation;
    *scale *= scaleFactor;
    
    // 非扫光区域轻微缩小（模拟阴影，更柔和）
    let shadowFactor = 1.0 - (1.0 - g_sweepIntensity) * uniform.uShadowIntensity * 0.08 * distAttenuation;
    *scale *= shadowFactor;
    
    // 添加微小的随机缩放变化
    let random = fract(sin(dot(originalCenter, vec3f(12.9898, 78.233, 45.5432))) * 43758.5453);
    *scale *= 1.0 + (random - 0.5) * 0.02 * g_sweepIntensity;
}

fn modifySplatColor(center: vec3f, color: ptr<function, vec4f>) {
    let dist = length(center);
    if (dist > uniform.uMaxDistance) return;
    
    let distAttenuation = 1.0 - smoothstep(uniform.uMaxDistance * 0.3, uniform.uMaxDistance, dist);
    let finalIntensity = g_sweepIntensity * distAttenuation;
    
    // 添加高光颜色（带渐变）
    var highlight = uniform.uHighlightColor * finalIntensity * uniform.uHighlightIntensity;
    // 高光颜色随距离渐变
    highlight *= (1.0 + 0.3 * sin(dist * 0.5 + uniform.uTime * 2.0));
    (*color).rgb += highlight;
    
    // 辉光效果：高光区域额外提亮
    (*color).rgb += pow(finalIntensity, 2.0) * uniform.uHighlightColor * 0.5;
    
    // 非扫光区域添加阴影（更柔和的过渡）
    let shadow = 1.0 - (1.0 - finalIntensity) * uniform.uShadowIntensity * 0.8;
    (*color).rgb *= shadow;
    
    // 动态透明度，扫光区域更亮更透
    (*color).a = mix((*color).a, max((*color).a, 0.3), finalIntensity);
    // 确保最小透明度
    (*color).a = max((*color).a, 0.15);
    
    // 颜色饱和度调整
    let saturation = 1.0 + finalIntensity * 0.3;
    let gray = vec3f(dot((*color).rgb, vec3f(0.299, 0.587, 0.114)));
    (*color).rgb = mix(gray, (*color).rgb, saturation);
}
`;

// 特效类（优化版）
class GsplatEffectLightSweep extends GsplatShaderEffect {
    static scriptName = 'gsplatEffectLightSweep';

    _sweepDirArray = [1, 0, 0];
    _highlightColorArray = [0, 0, 0];
    
    // 基础参数
    sweepDir = new Vec3(1, 0, 0);        // 扫光方向（默认X轴）
    sweepSpeed = 2.0;                    // 扫光速度
    sweepWidth = 5.0;                    // 扫光宽度
    highlightColor = new Color(0.2, 1.0, 1.0); // 高光颜色（青色）
    highlightIntensity = 1.2;            // 高光强度
    shadowIntensity = 0.3;               // 阴影强度
    maxDistance = 50.0;                  // 最大影响距离
    
    // 新增灵动参数
    pulseFreq = 3.5;                     // 脉冲频率（呼吸效果）
    edgeSmooth = 1.2;                    // 边缘平滑度
    cycleDuration = 8.0;                 // 单次循环时长（秒）
    fadeOutTime = 1.5;                   // 淡出复位时间
    _cycleTime = 0;                      // 当前循环时间
    _isResetting = false;                // 是否正在复位
    
    // 随机波动参数
    _speedVariation = 0.0;               // 速度随机变化
    _widthVariation = 0.0;               // 宽度随机变化
    _colorOffset = new Color(0, 0, 0);   // 颜色偏移
    
    getShaderGLSL() {
        return lightSweepGLSL;
    }

    getShaderWGSL() {
        return lightSweepWGSL;
    }

    updateEffect(effectTime, dt) {
        // 更新循环时间
        this._cycleTime += dt;
        
        // 随机波动更新（每帧微小变化）
        if (Math.random() < 0.1) {
            this._speedVariation = Math.sin(effectTime * 0.8) * 0.3;
            this._widthVariation = Math.sin(effectTime * 1.2) * 0.5;
            // 颜色微小偏移
            this._colorOffset.r = Math.sin(effectTime * 0.5) * 0.1;
            this._colorOffset.g = Math.sin(effectTime * 0.7) * 0.1;
            this._colorOffset.b = Math.sin(effectTime * 0.9) * 0.1;
        }
        
        // 循环控制：完成一次循环后平滑复位
        let progress = 1.0;
        if (this._cycleTime > this.cycleDuration) {
            this._isResetting = true;
            // 计算淡出进度
            const fadeProgress = (this._cycleTime - this.cycleDuration) / this.fadeOutTime;
            progress = 1.0 - Math.min(fadeProgress, 1.0);
            
            // 复位完成
            if (fadeProgress >= 1.0) {
                this._cycleTime = 0;
                this._isResetting = false;
            }
        }
        
        // 应用进度缩放（复位时逐渐减弱效果）
        const scaledTime = effectTime * progress;
        this.setUniform('uTime', scaledTime);
        this.setUniform('uProgress', progress);
        
        // 更新扫光方向
        this._sweepDirArray[0] = this.sweepDir.x;
        this._sweepDirArray[1] = this.sweepDir.y;
        this._sweepDirArray[2] = this.sweepDir.z;
        this.setUniform('uSweepDir', this._sweepDirArray);

        // 应用速度随机波动
        const finalSpeed = (this.sweepSpeed + this._speedVariation) * progress;
        this.setUniform('uSweepSpeed', finalSpeed);
        
        // 应用宽度随机波动
        const finalWidth = (this.sweepWidth + this._widthVariation) * progress;
        this.setUniform('uSweepWidth', finalWidth);

        // 更新高光颜色（带动态偏移）
        this._highlightColorArray[0] = Math.max(0, Math.min(1, this.highlightColor.r + this._colorOffset.r));
        this._highlightColorArray[1] = Math.max(0, Math.min(1, this.highlightColor.g + this._colorOffset.g));
        this._highlightColorArray[2] = Math.max(0, Math.min(1, this.highlightColor.b + this._colorOffset.b));
        this.setUniform('uHighlightColor', this._highlightColorArray);

        // 设置基础参数
        this.setUniform('uHighlightIntensity', this.highlightIntensity * progress);
        this.setUniform('uShadowIntensity', this.shadowIntensity);
        this.setUniform('uMaxDistance', this.maxDistance);
        
        // 设置新增灵动参数
        this.setUniform('uPulseFreq', this.pulseFreq);
        this.setUniform('uEdgeSmooth', this.edgeSmooth);
    }

    isEffectComplete() {
        // 扫光特效循环播放，永不结束
        return false;
    }
    
    // 手动复位方法（可选）
    resetEffect() {
        this._cycleTime = 0;
        this._isResetting = false;
        this._speedVariation = 0;
        this._widthVariation = 0;
    }
    
    // 设置循环时长
    setCycleDuration(duration) {
        this.cycleDuration = Math.max(2.0, duration);
    }
    
    // 调整扫光颜色
    setHighlightColor(r, g, b) {
        this.highlightColor.set(r, g, b);
    }
    
    // 调整脉冲频率（更灵动/更舒缓）
    setPulseFrequency(freq) {
        this.pulseFreq = Math.max(0.5, freq);
    }
}

export { GsplatEffectLightSweep };