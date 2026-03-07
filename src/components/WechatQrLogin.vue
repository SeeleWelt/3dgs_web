<template>
  <div class="wx-login-container">
    <!-- 登录标题 -->
    <div class="login-title">微信扫码登录</div>

    <!-- 二维码展示区域 -->
    <div class="qrcode-box" v-if="showQrcode">
      <!-- 二维码图片 -->
      <img :src="qrcodeUrl" alt="微信登录二维码" class="qrcode-img" v-if="qrcodeUrl">
      <!-- 加载中提示 -->
      <div class="loading" v-else>二维码加载中...</div>
      <!-- 状态提示 -->
      <div class="status-text">{{ statusText }}</div>
    </div>

    <!-- 登录成功提示 -->
    <div class="success-box" v-else>
      <div class="success-icon">✓</div>
      <div class="success-text">登录成功！正在跳转...</div>
    </div>

    <!-- 刷新二维码按钮 -->
    <button 
      class="refresh-btn" 
      @click="refreshQrcode" 
      v-if="showQrcode && !isLoading"
    >
      刷新二维码
    </button>
  </div>
</template>

<script>
export default {
  name: 'WxQrcodeLogin',
  data() {
    return {
      qrcodeUrl: '', // 二维码图片地址
      showQrcode: true, // 是否显示二维码
      statusText: '请使用微信扫码登录', // 状态提示文本
      isLoading: false, // 加载状态
      loginTicket: '', // 登录票据
      pollTimer: null, // 轮询定时器
      appId: '你的微信开放平台APPID', // 替换为你的实际APPID
      redirectUri: '你的回调地址', // 替换为你的回调地址（需在微信开放平台配置）
      state: Math.random().toString(36).substr(2, 10), // 随机状态值，用于防CSRF
    };
  },
  mounted() {
    // 页面加载后初始化二维码
    this.initQrcode();
  },
  beforeUnmount() {
    // 组件销毁前清除定时器
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  },
  methods: {
    /**
     * 初始化登录二维码
     */
    async initQrcode() {
      try {
        this.isLoading = true;
        this.statusText = '正在获取二维码...';
        
        // 1. 调用后端接口获取微信二维码参数（实际项目中替换为你的后端接口）
        // 注：微信扫码登录需要后端先调用微信接口获取ticket，前端仅负责展示和轮询
        const res = await this.$axios.get('/api/wx/getQrcode', {
          params: {
            appId: this.appId,
            redirectUri: this.redirectUri,
            state: this.state
          }
        });

        if (res.code === 200) {
          // 2. 拼接二维码图片地址（微信官方二维码接口）
          this.qrcodeUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${this.appId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=code&scope=snsapi_login&state=${this.state}#wechat_redirect`;
          this.statusText = '请使用微信扫码登录';
          
          // 3. 启动轮询，监听扫码状态
          this.startPolling();
        } else {
          this.statusText = '获取二维码失败：' + res.msg;
        }
      } catch (error) {
        console.error('初始化二维码失败：', error);
        this.statusText = '网络异常，请刷新重试';
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 启动轮询，监听扫码状态
     */
    startPolling() {
      // 清除已有定时器
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
      }

      // 每3秒查询一次扫码状态
      this.pollTimer = setInterval(async () => {
        try {
          const res = await this.$axios.get('/api/wx/checkLoginStatus', {
            params: {
              state: this.state // 用state标识当前登录会话
            }
          });

          switch (res.data.status) {
            case 'waiting': // 未扫码
              break;
            case 'scanned': // 已扫码未确认
              this.statusText = '已扫码，请在微信中确认登录';
              break;
            case 'success': // 登录成功
              this.handleLoginSuccess(res.data);
              break;
            case 'expired': // 二维码过期
              this.statusText = '二维码已过期，请刷新重试';
              clearInterval(this.pollTimer);
              break;
            case 'cancel': // 用户取消登录
              this.statusText = '你已取消登录';
              clearInterval(this.pollTimer);
              break;
          }
        } catch (error) {
          console.error('查询登录状态失败：', error);
        }
      }, 3000);
    },

    /**
     * 处理登录成功逻辑
     */
    handleLoginSuccess(data) {
      // 清除轮询定时器
      clearInterval(this.pollTimer);
      
      // 隐藏二维码，显示成功提示
      this.showQrcode = false;
      
      // 存储登录凭证（如token）
      localStorage.setItem('token', data.token);
      
      // 跳转首页或之前的页面
      setTimeout(() => {
        this.$router.push('/home');
      }, 1500);
    },

    /**
     * 刷新二维码
     */
    refreshQrcode() {
      // 清除旧定时器
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
      }
      // 重新初始化
      this.initQrcode();
    }
  }
};
</script>

<style scoped>
/* .wx-login-container {
  width: 300px;
  margin: 50px auto;
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
} */

.login-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.qrcode-box {
  margin-bottom: 20px;
}

.qrcode-img {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  display: block;
}

.loading {
  height: 200px;
  line-height: 200px;
  color: #999;
}

.status-text {
  margin-top: 15px;
  font-size: 14px;
  color: #666;
}

.success-box {
  padding: 30px 0;
}

.success-icon {
  font-size: 48px;
  color: #4cd964;
  margin-bottom: 10px;
}

.success-text {
  font-size: 16px;
  color: #333;
}

.refresh-btn {
  padding: 8px 16px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn:hover {
  background-color: #06b058;
}
</style>