// 健康栏页面逻辑
// 接入微信步数 wx.getWeRunData + 云函数 getWeRunData 解密

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// 微信小程序不包含 requestAnimationFrame，使用 setTimeout polyfill
const requestAnimationFrame = global.requestAnimationFrame || function(cb) { return setTimeout(cb, 16); };

// 健康百科数据
const ALL_ARTICLES = [
  // 膳食经
  {
    id: 'diet-1',
    category: 'diet',
    emoji: '🥗',
    title: '低盐低油营养餐：胡萝卜小米粥',
    desc: '保护心血管、易消化的暖胃佳品，适合早晚食用',
    categoryLabel: '膳食经',
    readTime: '3 分钟'
  },
  {
    id: 'diet-2',
    category: 'diet',
    emoji: '🥣',
    title: '三高人群必看：黑木耳凉拌菜',
    desc: '降低血液粘稠度，每周 2-3 次有助于血管健康',
    categoryLabel: '膳食经',
    readTime: '2 分钟'
  },
  {
    id: 'diet-3',
    category: 'diet',
    emoji: '🍵',
    title: '饭后一杯山楂茶，帮助消化又养胃',
    desc: '山楂含黄酮类物质，适量饮用有益老年人消化系统',
    categoryLabel: '膳食经',
    readTime: '1 分钟'
  },
  {
    id: 'diet-4',
    category: 'diet',
    emoji: '🥚',
    title: '每天一颗蛋，补足优质蛋白',
    desc: '蛋黄富含卵磷脂，建议水煮或蒸蛋方式保留营养',
    categoryLabel: '膳食经',
    readTime: '2 分钟'
  },
  // 筋骨堂
  {
    id: 'stretch-1',
    category: 'stretch',
    emoji: '🧘',
    title: '晨起 5 分钟拉伸操，舒展全身关节',
    desc: '动作轻柔不剧烈，适合老年人每日晨间活动',
    categoryLabel: '筋骨堂',
    readTime: '5 分钟'
  },
  {
    id: 'stretch-2',
    category: 'stretch',
    emoji: '🦵',
    title: '久坐必做：膝关节保护操',
    desc: '减少关节磨损，增强下肢稳定性，降低跌倒风险',
    categoryLabel: '筋骨堂',
    readTime: '4 分钟'
  },
  {
    id: 'stretch-3',
    category: 'stretch',
    emoji: '🙏',
    title: '睡前放松操：改善睡眠质量',
    desc: '配合深呼吸，帮助全身肌肉放松，快速入睡',
    categoryLabel: '筋骨堂',
    readTime: '3 分钟'
  },
  {
    id: 'stretch-4',
    category: 'stretch',
    emoji: '💆',
    title: '颈椎保健操：低头族的福音',
    desc: '每天 3 分钟，缓解颈部僵硬，预防颈椎病',
    categoryLabel: '筋骨堂',
    readTime: '3 分钟'
  },
  // 心经
  {
    id: 'mental-1',
    category: 'mental',
    emoji: '🌿',
    title: '子女不在身边，如何排解孤独感？',
    desc: '培养兴趣爱好、主动社交，让晚年生活更充实',
    categoryLabel: '心经',
    readTime: '4 分钟'
  },
  {
    id: 'mental-2',
    category: 'mental',
    emoji: '☀️',
    title: '老年人情绪管理：遇事不急不躁',
    desc: '情绪波动影响血压，试试"数数法"平复心情',
    categoryLabel: '心经',
    readTime: '3 分钟'
  },
  {
    id: 'mental-3',
    category: 'mental',
    emoji: '🎵',
    title: '听音乐也能养生：古典乐的舒缓力量',
    desc: '每天听 20 分钟轻音乐，可降低焦虑和血压水平',
    categoryLabel: '心经',
    readTime: '2 分钟'
  },
  {
    id: 'mental-4',
    category: 'mental',
    emoji: '📖',
    title: '活到老学到老：阅读延缓大脑衰老',
    desc: '研究表明，阅读习惯可降低老年痴呆风险 35%',
    categoryLabel: '心经',
    readTime: '3 分钟'
  }
];

Page({
  data: {
    // 步数相关
    todaySteps: 0,
    displaySteps: '0',
    stepTarget: 10000,
    stepRingPercent: 0,

    // 指标
    calories: 0,
    distance: '0.00',
    activeMinutes: 0,

    // AI 健康私语
    wisdomText: '同步微信步数后，将为您生成个性化的今日健康建议。',
    showWeRunAuth: false,

    // 健康百科
    articles: ALL_ARTICLES,
    activeTab: 'all',
    filteredArticles: ALL_ARTICLES
  },

  onLoad() {
    // 默认展示全部文章
    this.setData({ filteredArticles: ALL_ARTICLES });
  },

  onShow() {
    this.loadTodayStep();
  },

  onReady() {
    this.drawVitalityRing(0);
  },

  goBack() {
    wx.reLaunch({ url: '/pages/home/home' });
  },

  // ==================== 微信步数相关 ====================

  loadTodayStep() {
    wx.getSetting({
      success: (res) => {
        const hasAuth = !!res.authSetting['scope.werun'];
        if (hasAuth) {
          this.setData({ showWeRunAuth: false });
          this.fetchWeRunData();
        } else {
          this.setData({ showWeRunAuth: true });
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
    // 随机模拟步数（3000-11000之间），方便演示不同状态
    const mockStepsList = [4200, 5300, 6000, 8000, 7000, 9000, 8542];
    const todaySteps = mockStepsList[mockStepsList.length - 1];
    const now = Date.now();
    const stepInfoList = mockStepsList.map((step, index) => ({
      timestamp: Math.floor(
        (now - (mockStepsList.length - 1 - index) * 24 * 60 * 60 * 1000) / 1000
      ),
      step
    }));

    this.updateStepRelatedData(todaySteps, stepInfoList);
  },

  updateStepRelatedData(todaySteps, stepInfoList) {
    const stepTarget = this.data.stepTarget || 10000;
    const ratio = Math.min(todaySteps / stepTarget, 1);
    const calories = Math.round(todaySteps * 0.04);
    const activeMinutes = Math.round(todaySteps / 100);
    const distance = (todaySteps * 0.0006).toFixed(2); // 约 0.6m/步

    // 生成 AI 健康私语
    const wisdomText = this.generateWisdom(todaySteps);

    // 步数动画（从0渐变到目标值）
    this.animateSteps(todaySteps);

    this.setData(
      {
        todaySteps,
        stepRingPercent: Math.round(ratio * 100),
        calories,
        activeMinutes,
        distance,
        wisdomText
      },
      () => {
        this.drawVitalityRing(ratio);
      }
    );
  },

  // ==================== 步数数字动画 ====================

  animateSteps(targetSteps) {
    const duration = 1200;
    const startTime = Date.now();
    const startSteps = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out 缓动
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentSteps = Math.round(startSteps + (targetSteps - startSteps) * eased);
      const displaySteps = currentSteps.toLocaleString();

      this.setData({ displaySteps });

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  },

  // ==================== 绘制步数能量环 ====================

  drawVitalityRing(percent) {
    const ctx = wx.createCanvasContext('vitalityRing', this);
    const size = 300;
    const center = size / 2;
    const radius = center - 14;

    ctx.clearRect(0, 0, size, size);

    // 底环（半透明浅色）
    ctx.setStrokeStyle('rgba(231, 111, 81, 0.12)');
    ctx.setLineWidth(14);
    ctx.setLineCap('round');
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // 进度环（橙色渐变）
    if (percent > 0) {
      const endAngle = -Math.PI / 2 + 2 * Math.PI * clamp(percent, 0, 1);
      const startAngle = -Math.PI / 2;

      // 创建渐变
      ctx.setLineWidth(14);
      ctx.setLineCap('round');

      // 绘制渐变环（用多个色段模拟渐变效果）
      const segments = 36;
      const totalAngle = endAngle - startAngle;

      for (let i = 0; i < Math.ceil(totalAngle * segments / (2 * Math.PI)); i++) {
        const segStart = startAngle + (i / segments) * 2 * Math.PI;
        const segEnd = Math.min(segStart + (1 / segments) * 2 * Math.PI, endAngle);

        // 色值从 #F4A261 到 #E76F51 渐变
        const t = i / segments;
        const r = Math.round(244 + (231 - 244) * t);
        const g = Math.round(162 + (111 - 162) * t);
        const b = Math.round(97 + (81 - 97) * t);

        ctx.setStrokeStyle(`rgb(${r}, ${g}, ${b})`);
        ctx.beginPath();
        ctx.arc(center, center, radius, segStart, segEnd, false);
        ctx.stroke();
      }
    }

    ctx.draw();
  },

  // ==================== AI 健康私语生成 ====================

  generateWisdom(todaySteps) {
    if (!todaySteps) {
      return '今天还没有记录到步数，建议饭后和傍晚各散步 15-20 分钟，循序渐进地养成习惯。';
    }

    if (todaySteps < 3000) {
      return '您今天动得太少啦，像我一样多活动活动身体嘛。建议下楼散步 15 分钟，晒晒太阳，呼吸一下新鲜空气，对骨骼和心情都好哦。';
    }

    if (todaySteps >= 3000 && todaySteps <= 8000) {
      return '很棒！身体正在微微发热，建议喝一杯温水，继续保持哦。适度运动有助于血液循环，让子女也放心呢。';
    }

    if (todaySteps > 8000 && todaySteps <= 10000) {
      return '接近目标了！加油再走几步就能完成今日 10,000 步。建议运动后休息 10 分钟再喝水，给身体一个缓冲的时间。';
    }

    if (todaySteps > 10000) {
      return '太厉害了！今日运动量超标，记得揉揉膝盖，早点休息哦。运动虽好，但也要注意身体，别太勉强自己啦。';
    }

    return '今天状态不错，继续保持规律的运动习惯，对健康最有帮助啦！';
  },

  // ==================== 健康百科 Tab 切换 ====================

  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    let filteredArticles = ALL_ARTICLES;

    if (tab !== 'all') {
      filteredArticles = ALL_ARTICLES.filter(item => item.category === tab);
    }

    this.setData({
      activeTab: tab,
      filteredArticles
    });
  },

  // ==================== 文章点击 ====================

  onArticleTap(e) {
    const articleId = e.currentTarget.dataset.id;
    const article = ALL_ARTICLES.find(item => item.id === articleId);
    if (article) {
      wx.showModal({
        title: article.title,
        content: article.desc + '\n\n' + `阅读时间：${article.readTime}\n分类：${article.categoryLabel}`,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // ==================== 查看更多 ====================

  onTapMoreLibrary() {
    wx.showToast({
      title: '更多健康内容即将上线',
      icon: 'none'
    });
  }
});
