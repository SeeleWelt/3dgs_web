/**
 * Morton ordering (Z-order curve) for spatial coherence.
 * Sorts indices into morton order based on 3D positions.
 * 莫顿排序（Z阶曲线）：基于3D坐标对索引做空间相干性排序，提升高斯点渲染/压缩的局部性
 */
// import { DataTable } from './data-table';

/**
 * Sort the provided indices into morton order based on x, y, z positions.
 * 对传入的索引数组按3D坐标做莫顿排序（原地修改数组）
 * @param {DataTable} dataTable 包含x、y、z列的3D坐标数据表
 * @param {Uint32Array} indices 待排序的索引数组（会原地修改）
 * @throws {Error} 数据表缺少x/y/z列时抛出错误
 */
const sortMortonOrder = (dataTable, indices) => {
    const cx = dataTable.getColumnByName('x')?.data;
    const cy = dataTable.getColumnByName('y')?.data;
    const cz = dataTable.getColumnByName('z')?.data;

    if (!cx || !cy || !cz) {
        throw new Error('DataTable must have x, y, z columns for morton ordering');
    }

    const generate = (indices) => {
        // 3D莫顿码编码核心方法（经典位运算实现）
        // 参考：https://fgiesen.wordpress.com/2009/12/13/decoding-morton-codes/
        const encodeMorton3 = (x, y, z) => {
            // 位扩展：将10位数据分散到32位中，每2位留一个空位
            const Part1By2 = (x) => {
                x &= 0x000003ff; // 保留低10位
                x = (x ^ (x << 16)) & 0xff0000ff;
                x = (x ^ (x << 8)) & 0x0300f00f;
                x = (x ^ (x << 4)) & 0x030c30c3;
                x = (x ^ (x << 2)) & 0x09249249;
                return x;
            };
            // z占第2位、y占第1位、x占第0位，拼接为最终3D莫顿码
            return (Part1By2(z) << 2) + (Part1By2(y) << 1) + Part1By2(x);
        };

        let mx, my, mz; // 坐标最小值
        let Mx, My, Mz; // 坐标最大值

        // 计算3D坐标的包围盒（x/y/z的最大/最小值）
        for (let i = 0; i < indices.length; ++i) {
            const ri = indices[i];
            const x = cx[ri];
            const y = cy[ri];
            const z = cz[ri];

            if (mx === undefined) {
                mx = Mx = x;
                my = My = y;
                mz = Mz = z;
            } else {
                if (x < mx) mx = x; else if (x > Mx) Mx = x;
                if (y < my) my = y; else if (y > My) My = y;
                if (z < mz) mz = z; else if (z > Mz) Mz = z;
            }
        }

        if (mx === undefined) return;

        const xlen = Mx - mx;
        const ylen = My - my;
        const zlen = Mz - mz;

        // 过滤非有限值，避免计算异常
        if (!isFinite(xlen) || !isFinite(ylen) || !isFinite(zlen)) {
            return;
        }

        // 所有点坐标完全相同，无需排序
        if (xlen === 0 && ylen === 0 && zlen === 0) {
            return;
        }

        // 计算坐标缩放系数：将3D坐标归一化到[0,1023]整数范围（10位精度）
        const xmul = (xlen === 0) ? 0 : 1024 / xlen;
        const ymul = (ylen === 0) ? 0 : 1024 / ylen;
        const zmul = (zlen === 0) ? 0 : 1024 / zlen;

        // 为每个索引生成对应的莫顿码
        const morton = new Uint32Array(indices.length);
        for (let i = 0; i < indices.length; ++i) {
            const ri = indices[i];
            const x = cx[ri];
            const y = cy[ri];
            const z = cz[ri];

            // 归一化到[0,1023]并转为无符号整数
            const ix = Math.min(1023, (x - mx) * xmul) >>> 0;
            const iy = Math.min(1023, (y - my) * ymul) >>> 0;
            const iz = Math.min(1023, (z - mz) * zmul) >>> 0;

            morton[i] = encodeMorton3(ix, iy, iz);
        }

        // 按莫顿码排序，得到索引的排序顺序
        const order = Array.from(indices).map((_, i) => i);
        order.sort((a, b) => morton[a] - morton[b]);

        // 根据排序顺序更新原索引数组（原地修改）
        const tmpIndices = indices.slice();
        for (let i = 0; i < indices.length; ++i) {
            indices[i] = tmpIndices[order[i]];
        }

        // 递归排序大桶：莫顿码相同的片段若长度>256，再次递归排序提升空间局部性
        let start = 0;
        let end = 1;
        while (start < indices.length) {
            while (end < indices.length && morton[order[end]] === morton[order[start]]) {
                ++end;
            }

            if (end - start > 256) {
                generate(indices.subarray(start, end));
            }

            start = end;
        }
    };

    generate(indices);
};

/**
 * Generate indices array for a DataTable sorted in morton order.
 * 生成按莫顿排序的索引数组（从0到numRows-1初始化后排序）
 * @param {DataTable} dataTable 包含x、y、z列的3D坐标数据表
 * @returns {Uint32Array} 按莫顿排序后的索引数组
 */
const generateMortonIndices = (dataTable) => {
    const result = new Uint32Array(dataTable.numRows);
    // 初始化索引：0,1,2,...,numRows-1
    for (let i = 0; i < result.length; ++i) {
        result[i] = i;
    }
    // 对索引做莫顿排序
    sortMortonOrder(dataTable, result);
    return result;
};

export { sortMortonOrder, generateMortonIndices };