// 全局返回键处理插件（修复版）
export default {
  install(app) { // Vue 3 推荐用 app 而非 Vue
    const backHandlerQueue = [];

    // 修复：注册时接收组件实例 + 处理函数，而非依赖this._uid
    app.config.globalProperties.$registerBackHandler = function(handler) {
      const componentInstance = this; // 此时this是组件实例（Vue 3 配置项写法）
      const exists = backHandlerQueue.some(item => item.instance === componentInstance);
      if (!exists) {
        backHandlerQueue.push({
          instance: componentInstance, // 直接存组件实例（更可靠）
          handler: handler.bind(componentInstance) // 绑定this到组件实例
        });
        console.log(`注册返回处理函数，组件ID：${componentInstance.name || '未知'}`);
      }
      // 返回注销函数（更易用）
      return () => {
        const index = backHandlerQueue.findIndex(item => item.instance === componentInstance);
        if (index > -1) backHandlerQueue.splice(index, 1);
      };
    };

    // 简化注销方法
    app.config.globalProperties.$unregisterBackHandler = function() {
        console.log(`注销返回处理函数，组件ID：${this.name || '未知'}`);
      const index = backHandlerQueue.findIndex(item => item.instance === this);
      if (index > -1) backHandlerQueue.splice(index, 1);
    };

    window.vueBackHandler = () => {
      // 倒序执行：优先执行最后注册的组件
      for (let i = backHandlerQueue.length - 1; i >= 0; i--) {
        const item = backHandlerQueue[i];
        console.log(`执行返回处理函数，组件ID：${item.instance.name || '未知'}`);
        try {
            
          const handled = item.handler(); // handler已绑定组件实例
          if (handled) {
            return false; // Vue已处理，Flutter无需返回
          }
        } catch (e) {
          console.error('返回处理函数执行失败:', e);
          backHandlerQueue.splice(i, 1);
        }
      }

      // 路由返回逻辑（可选，修复注释中的router获取）
    //   const router = app.config.globalProperties.$router;
    //   if (router && router.currentRoute.fullPath !== router.options.routes[0].path) {
    //     router.go(-1);
    //     return false;
    //   }

      return true; // 交给Flutter处理
    };
  }
};