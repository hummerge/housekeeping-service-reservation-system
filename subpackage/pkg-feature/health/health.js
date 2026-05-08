function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

Page({
  data: {
    todaySteps: 0,
    stepTarget: 8000,
    stepRingPercent: 0,
    calories: 0,
    durationMinutes: 0,
    trend7Days: [],
    suggestion: '同步微信步数后，将为您生成个性化的今日健康建议。',
    scienceCards: [
      {
        title: '为什么建议每天 8000 步？',
        desc: '研究显示，每天 6000-8000 步有助于心血管健康、控制体重，适合多数老年人作为日常活动目标。'
      },
      {
        title: '走路也算运动',
        desc: '中等强度的步行可以改善下肢血液循环，配合拉伸和补水，对关节和心肺功能都有好处。'
      },
      {
        title: '安全运动小提示',
        desc: '穿舒适防滑鞋，饭后至少等待 1 小时再散步，如出现胸闷、头晕等不适应立即休息并就医。'
      }
    ],
    showWeRunAuth: false
  },

  onShow() {
    this.loadTodayStep();
  },

  onReady() {
    this.drawStepRing(0);
  },

  loadTodayStep() {
    wx.getSetting({
      success: (res) => {
        const hasAuth = !!res.authSetting['scope.werun'];
        if (hasAuth) {
          this.setData({ showWeRunAuth: false });
          this.fetchWeRunData();
        } else {
          this.setData({ showWeRunAuth: true });
          // 首次进入时仍然给出默认示例数据，避免界面为空
          if (!this.data.todaySteps) {
            this.useMockStep();
          }
        }
      },
      fail: () => {
        this.useMockStep();
      }
    });
  },

  onTapAuthWeRun() {
    wx.authorize({
      scope: 'scope.werun',
      success: () => {
        this.setData({ showWeRunAuth: false });
        this.fetchWeRunData();
      },
      fail: () => {
        wx.showToast({
          title: '未授权步数，将使用示例数据',
          icon: 'none'
        });
        this.useMockStep();
      }
    });
  },

  fetchWeRunData() {
    if (!wx.cloud) {
      wx.showToast({
        title: '基础库过低，已使用示例步数',
        icon: 'none'
      });
      this.useMockStep();
      return;
    }

    wx.getWeRunData({
      success: (res) => {
        wx.cloud.callFunction({
          name: 'getWeRunData',
          data: {
            // 使用 CloudID 由云函数侧自动完成解密
            weRunData: wx.cloud.CloudID(res.cloudID)
          },
          success: (resp) => {
            const result = resp.result || {};
            const weRunData = result.weRunData || {};
            const stepInfoList = (weRunData.data && weRunData.data.stepInfoList) || [];

            if (!stepInfoList.length) {
              this.useMockStep();
              return;
            }

            const todayInfo = stepInfoList[stepInfoList.length - 1] || {};
            const todaySteps = todayInfo.step || 0;
            this.updateStepRelatedData(todaySteps, stepInfoList);
          },
          fail: () => {
            this.useMockStep();
          }
        });
      },
      fail: () => {
        this.useMockStep();
      }
    });
  },

  useMockStep() {
    const mockStepsList = [4200, 5300, 6000, 8000, 7000, 9000, 10000];
    const todaySteps = mockStepsList[mockStepsList.length - 1];
    const now = Date.now();
    const stepInfoList = mockStepsList.map((step, index) => {
      return {
        timestamp: Math.floor(
          (now - (mockStepsList.length - 1 - index) * 24 * 60 * 60 * 1000) / 1000
        ),
        step
      };
    });

    this.updateStepRelatedData(todaySteps, stepInfoList);
  },

  updateStepRelatedData(todaySteps, stepInfoList) {
    const stepTarget = this.data.stepTarget || 8000;
    const ratio = Math.min(todaySteps / stepTarget, 1);
    const calories = Math.round(todaySteps * 0.04); // 约 0.04 kcal / 步
    const durationMinutes = Math.round(todaySteps / 100); // 简单估算：100 步约 1 分钟

    // 最近 7 天趋势
    const recentList = stepInfoList.slice(-7);
    const maxStep = recentList.reduce((max, item) => Math.max(max, item.step || 0), 1);
    const trend7Days = recentList.map((item) => {
      const date = new Date(item.timestamp * 1000);
      const day = `${date.getMonth() + 1}/${date.getDate()}`;
      return {
        day,
        step: item.step || 0,
        ratio: Math.max(((item.step || 0) / maxStep), 0.1) // 保证至少有一点高度
      };
    });

    const suggestion = this.generateSuggestion(todaySteps, stepTarget);

    this.setData(
      {
        todaySteps,
        stepRingPercent: Math.round(ratio * 100),
        calories,
        durationMinutes,
        trend7Days,
        suggestion
      },
      () => {
        this.drawStepRing(ratio);
      }
    );
  },

  generateSuggestion(todaySteps, target) {
    if (!todaySteps) {
      return '今天还没有记录到步数，建议饭后和傍晚各散步 15-20 分钟，循序渐进地养成习惯。';
    }

    const percent = todaySteps / target;
    if (percent < 0.5) {
      return '今天的活动量还偏少，建议增加 1-2 次短距离散步，每次 10-15 分钟，注意穿舒适的鞋子。';
    }
    if (percent < 1) {
      return '离今日目标还差一点点，可以在晚饭后再散步一会儿，有助于睡眠和血糖控制。';
    }
    return '恭喜您已完成今日步数目标，注意适当拉伸和补水，避免一次性运动量过大。';
  },

  drawStepRing(percent) {
    const ctx = wx.createCanvasContext('stepRing', this);
    const size = 200;
    const center = size / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, size, size);

    // 底环
    ctx.setStrokeStyle('#F0E6D8');
    ctx.setLineWidth(10);
    ctx.setLineCap('round');
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // 进度环
    if (percent > 0) {
      ctx.setStrokeStyle('#F4A261');
      ctx.beginPath();
      ctx.arc(
        center,
        center,
        radius,
        -Math.PI / 2,
        -Math.PI / 2 + 2 * Math.PI * clamp(percent, 0, 1),
        false
      );
      ctx.stroke();
    }

    ctx.draw();
  }
});

