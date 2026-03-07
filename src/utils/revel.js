import {GsplatRevealRadial} from '../../scripts/esm/gsplat/reveal-radial.mjs';
import { GsplatRevealGridEruption } from '../../scripts/esm/gsplat/reveal-grid-eruption.mjs';
import { GsplatRevealRain } from '../../scripts/esm/gsplat/reveal-rain.mjs';
// 导入新增的4个特效
import { GsplatEffectPulse } from '../../scripts/esm/gsplat/effect-pulse.mjs';
import { GsplatEffectDissolve } from '../../scripts/esm/gsplat/effect-dissolve.mjs';
import { GsplatEffectLightSweep } from '../../scripts/esm/gsplat/effect-light-sweep.mjs';
import { GsplatEffectLattice } from '../../scripts/esm/gsplat/effect-lattice.mjs';

// 扩展特效类型枚举，包含所有特效
export const GsplatEffectType = Object.freeze({
    RADIAL: 'radial',
    RAIN: 'rain',
    GRID: 'grid',
    PULSE: 'pulse',       // 脉冲膨胀
    DISSOLVE: 'dissolve', // 溶解消散
    LIGHT_SWEEP: 'lightSweep', // 光影扫过
    LATTICE: 'lattice'    // 晶格化变形
});

// ===================== 原有特效配置 =====================
const createRadialScript = (entity) => {
    const script = entity.script?.create(GsplatRevealRadial);
    if (script) {
        script.center.set(0, 0, 0);
        script.speed = 2;
        script.acceleration = 0;
        script.delay = 0;
        script.dotTint.set(0, 1, 1); // 青色
        script.waveTint.set(1, 0.5, 0); // 橙色
        script.oscillationIntensity = 0.3;
        script.endRadius = 25;
    }
    return script;
};

const createRainScript = (entity) => {
    const script = entity.script?.create(GsplatRevealRain);
    if (script) {
        script.center.set(0, 0, 0);
        script.distance = 10;
        script.speed = 3;
        script.acceleration = 0;
        script.flightTime = 1;
        script.rainSize = 0.010;
        script.rotation = 0.9; // 下落时旋转90%圆周
        script.fallTint.set(1, 0.5, 1); // 下落时品红色
        script.fallTintIntensity = 0.6;
        script.hitTint.set(2, 0, 0); // 落地时亮红色闪光
        script.hitDuration = 0.5;
        script.endRadius = 25;
    }
    return script;
};

const createGridScript = (entity) => {
    const script = entity.script?.create(GsplatRevealGridEruption);
    if (script) {
        script.center.set(0, 0, 0);
        script.blockCount = 10;
        script.blockSize = 2;
        script.delay = 0;
        script.duration = 1.0;
        script.dotSize = 0.01;
        script.moveTint.set(1, 0, 0); // 移动时品红色
        script.moveTintIntensity = 0.4; // 20% 混合原色
        script.landTint.set(2, 2, 0); // 落地时黄色闪光
        script.landDuration = 0.6;
        script.endRadius = 25;
    }
    return script;
};

// ===================== 新增特效配置 =====================
/**
 * 创建脉冲膨胀特效
 * @param {pc.Entity} entity - 3DGS实体
 * @returns {GsplatEffectPulse} 特效脚本实例
 */
const createPulseScript = (entity) => {
    const script = entity.script?.create(GsplatEffectPulse);
    if (script) {
        script.center.set(0, 0, 0);          // 脉冲中心
        script.pulseRadius = 5.0;             // 脉冲半径
        script.pulseSpeed = 1.0;              // 脉冲传播速度
        script.pulseFrequency = 2.0;          // 脉冲频率（每秒次数）
        script.scaleAmplitude = 0.8;          // 缩放振幅
        script.pulseColor.set(1.0, 0.2, 0.8); // 脉冲颜色（洋红）
        script.colorIntensity = 0.6;          // 颜色叠加强度
        script.maxDistance = 25;              // 最大影响距离
    }
    return script;
};

/**
 * 创建溶解消散特效
 * @param {pc.Entity} entity - 3DGS实体
 * @returns {GsplatEffectDissolve} 特效脚本实例
 */
const createDissolveScript = (entity) => {
    const script = entity.script?.create(GsplatEffectDissolve);
    if (script) {
        script.center.set(0, 0, 0);          // 溶解中心
        script.dissolveSpeed = 0.3;           // 溶解速度
        script.dissolveRadius = 20.0;         // 溶解影响半径
        script.noiseScale = 5.0;              // 噪点缩放（越小越粗糙）
        script.edgeSmoothness = 0.2;          // 溶解边缘平滑度
        script.dissolveColor.set(1.0, 1.0, 0.0); // 溶解边缘颜色（黄色）
        script.maxDistance = 25;              // 最大影响距离
    }
    return script;
};

/**
 * 创建光影扫过特效
 * @param {pc.Entity} entity - 3DGS实体
 * @returns {GsplatEffectLightSweep} 特效脚本实例
 */
const createLightSweepScript = (entity) => {
    const script = entity.script?.create(GsplatEffectLightSweep);
    if (script) {
        script.sweepDir.set(1, 0, 0);        // 扫光方向（X轴）
        script.sweepSpeed = 2.0;             // 扫光速度
        script.sweepWidth = 5.0;             // 扫光宽度
        script.highlightColor.set(0.2, 1.0, 1.0); // 高光颜色（青色）
        script.highlightIntensity = 1.2;     // 高光强度
        script.shadowIntensity = 0.3;        // 阴影强度
        script.maxDistance = 25;             // 最大影响距离
    }
    return script;
};

/**
 * 创建晶格化变形特效
 * @param {pc.Entity} entity - 3DGS实体
 * @returns {GsplatEffectLattice} 特效脚本实例
 */
const createLatticeScript = (entity) => {
    const script = entity.script?.create(GsplatEffectLattice);
    if (script) {
        script.latticeSize.set(2.0, 2.0, 2.0); // 晶格大小
        script.warpAmplitude = 0.5;            // 扭曲振幅
        script.warpSpeed = 1.0;                // 扭曲速度
        script.latticeIntensity = 0.8;         // 晶格化强度
        script.latticeColor.set(0.8, 0.2, 1.0); // 晶格颜色（紫粉色）
        script.maxDistance = 25;               // 最大影响距离
    }
    return script;
};

// ===================== 核心管理函数 =====================
/**
 * 移除所有3DGS特效脚本
 * @param {pc.Entity} entity - 3DGS实体
 */
const removeAllEffects = (entity) => {
    if (!entity || !entity.script) return;

    // 销毁原有特效
    entity.script.destroy(GsplatRevealRadial.scriptName);
    entity.script.destroy(GsplatRevealRain.scriptName);
    entity.script.destroy(GsplatRevealGridEruption.scriptName);
    
    // 销毁新增特效
    entity.script.destroy(GsplatEffectPulse.scriptName);
    entity.script.destroy(GsplatEffectDissolve.scriptName);
    entity.script.destroy(GsplatEffectLightSweep.scriptName);
    entity.script.destroy(GsplatEffectLattice.scriptName);
};  

/**
 * 创建指定类型的3DGS特效（自动销毁已有特效）
 * @param {pc.Entity} entity - 3DGS实体
 * @param {GsplatEffectType} effectName - 特效类型
 * @returns {object|null} 新建的特效脚本实例，失败则返回null
 */
const createEffect = (entity, effectName) => {
    // 校验参数合法性
    if (!entity || !entity.script || !Object.values(GsplatEffectType).includes(effectName)) {
        console.warn('创建3DGS特效失败：参数不合法', { entity, effectName });
        return null;
    }

    // 销毁所有已有特效
    removeAllEffects(entity);

    // 根据类型创建对应特效
    let scriptInstance = null;
    switch (effectName) {
        case GsplatEffectType.RADIAL:
            scriptInstance = createRadialScript(entity);
            break;
        case GsplatEffectType.RAIN:
            scriptInstance = createRainScript(entity);
            break;
        case GsplatEffectType.GRID:
            scriptInstance = createGridScript(entity);
            break;
        case GsplatEffectType.PULSE:
            scriptInstance = createPulseScript(entity);
            break;
        case GsplatEffectType.DISSOLVE:
            scriptInstance = createDissolveScript(entity);
            break;
        case GsplatEffectType.LIGHT_SWEEP:
            scriptInstance = createLightSweepScript(entity);
            break;
        case GsplatEffectType.LATTICE:
            scriptInstance = createLatticeScript(entity);
            break;
        default:
            console.warn('未知的3DGS特效类型', effectName);
            break;
    }

    if (scriptInstance) {
        console.log(`成功创建3DGS特效：${effectName}`);
    } else {
        console.error(`创建3DGS特效失败：${effectName}`);
    }

    return scriptInstance;
};

// 导出扩展后的API
export { 
    createEffect, 
    removeAllEffects,
    // 可选：导出单个特效创建函数，方便单独使用
    createRadialScript,
    createRainScript,
    createGridScript,
    createPulseScript,
    createDissolveScript,
    createLightSweepScript,
    createLatticeScript
};