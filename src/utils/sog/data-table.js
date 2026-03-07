/**
 * Lightweight data table for organizing gaussian splat data.
 * Port of splat-transform's DataTable with minimal dependencies.
 */

/**
 * 单个数据列类，承载高斯点的某一类属性数据
 * @class Column
 * @param {string} name 列名（对应高斯点属性：x/scale_0/f_dc_0 等）
 * @param {TypedArray} data 列数据（各类定型数组，所有列长度一致）
 */
class Column {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }

    /**
     * 克隆当前列（数据深拷贝）
     * @returns {Column} 克隆后的新列
     */
    clone() {
        return new Column(this.name, this.data.slice());
    }
}

/**
 * 高斯点数据表核心类，按列组织数据（所有列行数一致）
 * @class DataTable
 * @param {Column[]} columns 列数组，至少包含一列
 * @throws {Error} 无列/列行数不一致时抛出错误
 */
class DataTable {
    constructor(columns) {
        if (columns.length === 0) {
            throw new Error('DataTable must have at least one column');
        }

        // 校验所有列的行数（数据长度）一致
        for (let i = 1; i < columns.length; i++) {
            if (columns[i].data.length !== columns[0].data.length) {
                throw new Error(`Column '${columns[i].name}' has inconsistent number of rows: expected ${columns[0].data.length}, got ${columns[i].data.length}`);
            }
        }

        this.columns = columns;
    }

    // ---------- 行相关属性/方法 ----------
    /**
     * 获取数据表总行数（所有列长度一致，取第一列长度）
     * @type {number}
     */
    get numRows() {
        return this.columns[0].data.length;
    }

    /**
     * 获取指定索引的行数据，挂载到传入的row对象
     * @param {number} index 行索引
     * @param {Object} [row={}] 接收行数据的对象，避免重复创建
     * @param {Column[]} [columns=this.columns] 要获取的列，默认所有列
     * @returns {Object} 包含列名-值的行对象
     */
    getRow(index, row = {}, columns = this.columns) {
        for (const column of columns) {
            row[column.name] = column.data[index];
        }
        return row;
    }

    /**
     * 设置指定索引的行数据
     * @param {number} index 行索引
     * @param {Object} row 包含列名-值的行对象
     * @param {Column[]} [columns=this.columns] 要设置的列，默认所有列
     */
    setRow(index, row, columns = this.columns) {
        for (const column of columns) {
            if (Object.prototype.hasOwnProperty.call(row, column.name)) {
                column.data[index] = row[column.name];
            }
        }
    }

    // ---------- 列相关属性/方法 ----------
    /**
     * 获取数据表总列数
     * @type {number}
     */
    get numColumns() {
        return this.columns.length;
    }

    /**
     * 获取所有列名的数组
     * @type {string[]}
     */
    get columnNames() {
        return this.columns.map(column => column.name);
    }

    /**
     * 通过索引获取指定列
     * @param {number} index 列索引
     * @returns {Column} 对应列实例
     */
    getColumn(index) {
        return this.columns[index];
    }

    /**
     * 通过列名获取指定列（找不到返回undefined）
     * @param {string} name 列名
     * @returns {Column|undefined} 对应列实例或undefined
     */
    getColumnByName(name) {
        return this.columns.find(column => column.name === name);
    }

    /**
     * 检查数据表是否包含指定列名的列
     * @param {string} name 列名
     * @returns {boolean} 存在返回true，否则false
     */
    hasColumn(name) {
        return this.columns.some(column => column.name === name);
    }

    /**
     * 新增一列到数据表
     * @param {Column} column 要新增的列实例
     * @throws {Error} 新增列行数与表总行数不一致时抛出错误
     */
    addColumn(column) {
        if (column.data.length !== this.numRows) {
            throw new Error(`Column '${column.name}' has inconsistent number of rows: expected ${this.numRows}, got ${column.data.length}`);
        }
        this.columns.push(column);
    }

    // ---------- 通用方法 ----------
    /**
     * 克隆整个数据表（所有列数据深拷贝）
     * @returns {DataTable} 克隆后的新数据表
     */
    clone() {
        return new DataTable(this.columns.map(c => c.clone()));
    }
}

// 导出核心类，供SOG序列化/GSplatData转SOG等模块使用
export { Column, DataTable };