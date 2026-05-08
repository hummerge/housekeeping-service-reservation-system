App({
  globalData: {
    locale: 'zh'
  },

  onLaunch() {
    const saved = wx.getStorageSync('app_locale');
    if (saved === 'en' || saved === 'zh') {
      this.globalData.locale = saved;
    }

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上基础库以使用云开发能力');
      return;
    }

    wx.cloud.init({
      traceUser: true
      // 如需指定云环境，请在此处配置 env，例如：
      // env: 'your-env-id'
    });
  }
});