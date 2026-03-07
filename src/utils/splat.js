// import {
//     ADDRESS_CLAMP_TO_EDGE,
//     FILTER_NEAREST,
//     PIXELFORMAT_R8,
//     Texture
// } from 'playcanvas';

import { fragmentShader,vertexShader, gsplatCenter} from './shaders';
// 恢复三个状态（bit位标识）
const State = {
    selected: 1,  // 第1位：选中
    deleted: 2,   // 第2位：删除
    locked: 4     // 第3位：锁定
};

class Splat {
    constructor(entity) {
        const asset = entity.gsplat._assetReference?.asset
        const splatResource = asset.resource;
        const splatData = splatResource.gsplatData;
        const device = splatResource.device;
        console.log(asset, splatResource,splatData, device);
        this.asset = asset;
        this.entity = entity;
        this.assetRecource = splatResource;
        this.splatData = splatData;
        this.numSplats = splatData.numSplats;
        this.numDeleted = 0;   // 已删除数量
        this.numLocked = 0;    // 已锁定数量
        this.numSelected = 0;  // 已选中数量

        // 初始化顶点状态属性（存储选中/删除/锁定状态）
        if (!this.splatData.getProp('state')) {
            this.splatData.getElement('vertex').properties.push({
                type: 'uchar',
                name: 'state',
                storage: new Uint8Array(this.splatData.numSplats),
                byteSize: 1
            });
        }

        // 创建状态纹理（GPU端读取状态）
        // this.stateTexture = new Texture(device, {
        //     name: 'splatState',
        //     width: splatResource.colorTexture.width,
        //     height: splatResource.colorTexture.height,
        //     format: PIXELFORMAT_R8,
        //     mipmaps: false,
        //     minFilter: FILTER_NEAREST,
        //     magFilter: FILTER_NEAREST,
        //     addressU: ADDRESS_CLAMP_TO_EDGE,
        //     addressV: ADDRESS_CLAMP_TO_EDGE
        // });
        // this._setupCustomShader();
        // 初始化状态计数
        this.calculateStateCounts();
        // 初始化排序映射（过滤已删除点）
        this.updateSorterMapping();
    }

        // ========== 新增方法：配置自定义着色器 ==========
    _setupCustomShader() {
        const instance = this.entity.gsplat.instance;
        const material = instance.material;
        console.log("material", material);
        // 1. 传递状态纹理给材质
        material.setParameter('splatState', this.stateTexture);

        // // 2. 定义颜色参数（可根据需要调整）
        // material.setParameter('selectedColor', [1.0, 0.0, 0.0, 1.0]); // 选中：红色
        // material.setParameter('lockedColor', [0.5, 0.5, 0.5, 1.0]);  // 锁定：灰色
        // material.setParameter('normalColor', [1.0, 1.0, 1.0, 1.0]);  // 正常：白色


        // 4. 替换材质的片元着色器（适配PlayCanvas GSplat的着色器结构）
        if (material.shaderChunks && material.shaderChunks.glsl) {
            console.log("glsl", material.shaderChunks.glsl);
            // 如果是新版PlayCanvas的GSplat
            material.shaderChunks.glsl.set('gsplatCenterVS', gsplatCenter);
            material.shaderChunks.glsl.set('gsplatVS', vertexShader);   // 顶点着色器
            material.shaderChunks.glsl.set('gsplatPS', fragmentShader);
        } else {
            // 兼容旧版：直接替换shader（需要保留原有顶点着色器）
            const shader = material.shader.clone();
            shader.fragment = fragmentShader;
            material.shader = shader;
        }

        // 5. 更新材质
        material.update();
    }

    // ========== 新增：修改颜色的方法（可选） ==========
    /**
     * 修改不同状态的显示颜色
     * @param {string} type 状态类型：selected/locked/normal
     * @param {number[]} color RGBA数组，0-1范围
     */
    setStateColor(type, color) {
        const material = this.entity.gsplat.instance.material;
        switch(type) {
            case 'selected':
                material.setParameter('selectedColor', color);
                break;
            case 'locked':
                material.setParameter('lockedColor', color);
                break;
            case 'normal':
                material.setParameter('normalColor', color);
                break;
        }
        material.update();
    }


    /**
     * 核心方法：标记指定ID的高斯点为【删除】状态
     * @param {number[]} splatIds 要删除的高斯点ID数组
     */
    markSplatsAsDeleted(splatIds) {
        const stateArray = this.splatData.getProp('state');
        if (!stateArray) return;
        // 更新GPU状态纹理 + 状态计数 + 渲染映射
        // this.updateStateTexture(stateArray);
        // 标记删除状态（同时确保删除的点取消选中/锁定）
        splatIds.forEach(id => {
            if (id >= 0 && id < stateArray.length) {
                stateArray[id] = (stateArray[id] & ~(State.selected | State.locked)) | State.deleted;
            }
        });

        
        this.calculateStateCounts();
        this.updateSorterMapping();
    }

    /**
     * 批量更新高斯点状态（通用方法，支持选中/锁定/删除）
     * @param {number[]} splatIds 目标高斯点ID数组
     * @param {number} state 要设置的状态（State.selected/State.deleted/State.locked）
     * @param {boolean} isAdd 是否添加该状态（true=添加，false=移除）
     */
    updateSplatState(splatIds, state, isAdd) {
        const stateArray = this.splatData.getProp('state');
        if (!stateArray) return;


        splatIds.forEach(id => {
            if (id >= 0 && id < stateArray.length) {
                if (state === State.deleted) {
                    stateArray[id] = isAdd 
                        ? (stateArray[id] & ~(State.selected | State.locked)) | State.deleted 
                        : stateArray[id] & ~State.deleted;
                } else {
    
                    if ((stateArray[id] & State.deleted) === 0) {
                        stateArray[id] = isAdd 
                            ? stateArray[id] | state 
                            : stateArray[id] & ~state;
                    }
                }
            }
        });

        // 同步更新
        // this.updateStateTexture(stateArray);

        this.calculateStateCounts();
        if (state === State.deleted) {
            this.updateSorterMapping(); // 只有删除状态需要更新渲染映射
        }
    }

    /**
     * 更新GPU状态纹理（让渲染管线感知状态变化）
     */
    updateStateTexture(stateArray) {
        const textureData = this.stateTexture.lock();
        textureData.set(stateArray);
        this.stateTexture.unlock();
    }

    /**
     * 计算所有状态的数量（选中/删除/锁定）
     */
    calculateStateCounts() {
        const stateArray = this.splatData.getProp('state');
        if (!stateArray) return;

        this.numDeleted = 0;
        this.numLocked = 0;
        this.numSelected = 0;

        for (let i = 0; i < stateArray.length; i++) {
            const s = stateArray[i];
            if (s & State.deleted) {
                this.numDeleted++;
            } else if (s & State.locked) {
                this.numLocked++;
            } else if (s & State.selected) {
                this.numSelected++;
            }
        }

        // 有效高斯点数量 = 总数 - 已删除数量
        this.numSplats = stateArray.length - this.numDeleted;
    }

    /**
     * 更新排序映射（过滤已删除的高斯点，仅渲染未删除的点）
     */
    updateSorterMapping() {
        const stateArray = this.splatData.getProp('state');
        if (!stateArray) return;


        // 创建映射表：只保留未删除的点
        this.sorterMapping = new Uint32Array(this.numSplats);
        let idx = 0;
        for (let i = 0; i < stateArray.length; i++) {
            if ((this.numDeleted === 0 || (stateArray[i] & State.deleted) === 0)) {
                this.sorterMapping[idx++] = i;
            }
        }
        console.log("sort",this.sorterMapping.length);
        // 同步到GSplat组件的排序器（根据你的实际场景启用）
        if (this.entity?.gsplat?.instance?.sorter) {
            this.entity.gsplat.instance.sorter.setMapping(this.sorterMapping);
        }
    }

    /**
     * 辅助方法：取消指定高斯点的删除状态（恢复显示）
     * @param {number[]} splatIds 要恢复的高斯点ID数组
     */
    unmarkSplatsAsDeleted(splatIds) {
        this.updateSplatState(splatIds, State.deleted, false);
    }

    /**
     * 辅助方法：标记指定高斯点为选中状态
     * @param {number[]} splatIds 要选中的高斯点ID数组
     */
    markSplatsAsSelected(splatIds) {
        this.updateSplatState(splatIds, State.selected, true);
    }

    /**
     * 辅助方法：标记指定高斯点为锁定状态
     * @param {number[]} splatIds 要锁定的高斯点ID数组
     */
    markSplatsAsLocked(splatIds) {
        this.updateSplatState(splatIds, State.locked, true);
    }
}

// 导出供外部使用
export { Splat, State };