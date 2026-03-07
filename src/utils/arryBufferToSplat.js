import { GSplatData } from "playcanvas";

const deserializeFromSSplat = (data) => {
    // 计算总 splat 数量（每个 splat 占用 32 字节）
    const totalSplats = Math.floor(data.byteLength / 32);
    console.log(totalSplats, data.byteLength);
    const dataView = new DataView(data);

    // 初始化各类数据存储数组
    const storage_x = new Float32Array(totalSplats);
    const storage_y = new Float32Array(totalSplats);
    const storage_z = new Float32Array(totalSplats);
    const storage_opacity = new Float32Array(totalSplats);
    const storage_rot_0 = new Float32Array(totalSplats);
    const storage_rot_1 = new Float32Array(totalSplats);
    const storage_rot_2 = new Float32Array(totalSplats);
    const storage_rot_3 = new Float32Array(totalSplats);
    const storage_f_dc_0 = new Float32Array(totalSplats);
    const storage_f_dc_1 = new Float32Array(totalSplats);
    const storage_f_dc_2 = new Float32Array(totalSplats);
    const storage_scale_0 = new Float32Array(totalSplats);
    const storage_scale_1 = new Float32Array(totalSplats);
    const storage_scale_2 = new Float32Array(totalSplats);
    const storage_state = new Uint8Array(totalSplats);

    const SH_C0 = 0.28209479177387814;
    let off;

    // 遍历解析每个 splat 的数据
    for (let i = 0; i < totalSplats; i++) {
        off = i * 32;
        // 解析位置信息 (x/y/z)
        storage_x[i] = dataView.getFloat32(off + 0, true);
        storage_y[i] = dataView.getFloat32(off + 4, true);
        storage_z[i] = dataView.getFloat32(off + 8, true);

        // 解析缩放信息（取对数）
        storage_scale_0[i] = Math.log(dataView.getFloat32(off + 12, true));
        storage_scale_1[i] = Math.log(dataView.getFloat32(off + 16, true));
        storage_scale_2[i] = Math.log(dataView.getFloat32(off + 20, true));

        // 解析颜色 SH 系数
        storage_f_dc_0[i] = (dataView.getUint8(off + 24) / 255 - 0.5) / SH_C0;
        storage_f_dc_1[i] = (dataView.getUint8(off + 25) / 255 - 0.5) / SH_C0;
        storage_f_dc_2[i] = (dataView.getUint8(off + 26) / 255 - 0.5) / SH_C0;

        // 解析不透明度（sigmoid 反函数）
        storage_opacity[i] = -Math.log(255 / dataView.getUint8(off + 27) - 1);

        // 解析四元数旋转信息（归一化到 [-1, 1] 范围）
        storage_rot_0[i] = (dataView.getUint8(off + 28) - 128) / 128;
        storage_rot_1[i] = (dataView.getUint8(off + 29) - 128) / 128;
        storage_rot_2[i] = (dataView.getUint8(off + 30) - 128) / 128;
        storage_rot_3[i] = (dataView.getUint8(off + 31) - 128) / 128;
    }

    // 修正：storage_state 是 Uint8Array，但属性声明为 float，这里转换为 Float32Array 保持类型一致
    // const storage_state_float = new Float32Array(storage_state);
    console.log("解析成功");
    // 返回结构化的 GSplatData 实例
    return new GSplatData([{
        name: 'vertex',
        count: totalSplats,
        properties: [
            { type: 'float', name: 'x', storage: storage_x, byteSize: 4 },
            { type: 'float', name: 'y', storage: storage_y, byteSize: 4 },
            { type: 'float', name: 'z', storage: storage_z, byteSize: 4 },
            { type: 'float', name: 'opacity', storage: storage_opacity, byteSize: 4 },
            { type: 'float', name: 'rot_0', storage: storage_rot_0, byteSize: 4 },
            { type: 'float', name: 'rot_1', storage: storage_rot_1, byteSize: 4 },
            { type: 'float', name: 'rot_2', storage: storage_rot_2, byteSize: 4 },
            { type: 'float', name: 'rot_3', storage: storage_rot_3, byteSize: 4 },
            { type: 'float', name: 'f_dc_0', storage: storage_f_dc_0, byteSize: 4 },
            { type: 'float', name: 'f_dc_1', storage: storage_f_dc_1, byteSize: 4 },
            { type: 'float', name: 'f_dc_2', storage: storage_f_dc_2, byteSize: 4 },
            { type: 'float', name: 'scale_0', storage: storage_scale_0, byteSize: 4 },
            { type: 'float', name: 'scale_1', storage: storage_scale_1, byteSize: 4 },
            { type: 'float', name: 'scale_2', storage: storage_scale_2, byteSize: 4 },
            { type: 'float', name: 'state', storage: storage_state, byteSize: 4 }
        ]
    }]);
};


export default deserializeFromSSplat;