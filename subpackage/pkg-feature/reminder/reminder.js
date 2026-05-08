const HEFENG_KEY = 'ae814193d48e4a62957cea2ea86700d4'; // 和风天气 Key
const SHANGHAI_LOCATION = '101020100'; // 上海城市 ID
const HEFENG_BASE = 'https://mc3p42mp5y.re.qweatherapi.com'; // 天气接口
const IconData = require('../../../images/icons_data.js');
const i18n = require('../../../utils/i18n.js');

Page({
  data: {
    navTitle: '提醒',
    summaryL1: '今日提醒',
    summaryL2: '待完成',
    summaryL3: '已完成',
    sectionRoutine: '日常作息提醒',
    sectionRoutineSub: '可用于起床、饮水、散步、睡眠和用药提醒',
    sectionMarkAll: '全完成',
    sectionWeather: '天气预报与预警提醒',
    sectionWeatherSub: '根据天气变化提供出行、穿衣与健康建议',
    routineDoneText: '已完成',
    routinePendingText: '待提醒',
    markCompleteText: '标记完成',
    tabHome: '首页',
    tabReminder: '提醒',
    tabHealth: '健康',
    tabMine: '我的',
    weather: {
      city: '上海',
      dateText: '今日',
      weatherText: '加载中...',
      temp: '--℃',
      tempRange: '',       // 今日最低～最高
      humidity: '',        // 湿度
      windDir: '',         // 风向
      tip: '根据今日实时天气为您提供出行与健康建议。'
    },
    aiAvatar: IconData.ai_default_avatar,
    // Tab bar icons
    tabHomeIcon: IconData.tab_home,
    tabReminderIcon: IconData.tab_reminder,
    tabHealthIcon: IconData.tab_health,
    tabMineIcon: IconData.tab_mine,
    summary: {
      total: 8,
      pending: 5,
      completed: 3
    },
    routines: [
      { id: 1, title: '起床提醒', time: '07:30', desc: '起床后适当拉伸，帮助身体更快进入清醒状态。', enabled: true, done: true },
      { id: 2, title: '早餐提醒', time: '08:00', desc: '按时吃早餐，保持上午精力稳定。', enabled: true, done: true },
      { id: 3, title: '饮水提醒', time: '10:00', desc: '上午及时补水，避免长时间不喝水。', enabled: true, done: false },
      { id: 4, title: '午休提醒', time: '13:00', desc: '午间休息 20~30 分钟更有助于恢复精神。', enabled: false, done: false },
      { id: 5, title: '散步提醒', time: '18:30', desc: '饭后适量散步，有助于放松和活动身体。', enabled: true, done: false },
      { id: 6, title: '睡眠提醒', time: '22:30', desc: '建议在睡前半小时放下手机，帮助更好入睡。', enabled: true, done: false },
      { id: 7, title: '用药提醒', time: '21:00', desc: '按时查看今日药盒，避免漏服。', enabled: true, done: false }
    ],
    weatherAlerts: [
      { id: 1, level: '降雨提醒', title: '今晚有短时阵雨', desc: '18:00 后降雨概率较高，外出记得带伞，注意路面湿滑。', tag: '出行建议' },
      { id: 2, level: '温差提醒', title: '昼夜温差较明显', desc: '早晚气温偏低，老人和儿童外出可适当添衣。', tag: '穿衣建议' },
      { id: 3, level: '空气提醒', title: '空气质量整体良好', desc: '适合散步与轻度户外活动，敏感人群可避开车流密集路段。', tag: '健康建议' }
    ]
  },

  onShow() {
    this.applyReminderLocale();
    this.updateSummary();
    this.fetchShanghaiWeather();
  },

  applyReminderLocale() {
    const R = i18n.getReminderPage(i18n.getLocale());
    const t = R.tabs;
    this.setData({
      navTitle: R.navTitle,
      summaryL1: R.summaryL1,
      summaryL2: R.summaryL2,
      summaryL3: R.summaryL3,
      sectionRoutine: R.sectionRoutine,
      sectionRoutineSub: R.sectionRoutineSub,
      sectionMarkAll: R.sectionMarkAll,
      sectionWeather: R.sectionWeather,
      sectionWeatherSub: R.sectionWeatherSub,
      routineDoneText: R.done,
      routinePendingText: R.pending,
      markCompleteText: R.markComplete,
      tabHome: t.home,
      tabReminder: t.reminder,
      tabHealth: t.health,
      tabMine: t.mine
    });
  },

  fetchShanghaiWeather() {
    if (!HEFENG_KEY) {
      console.warn('请先在HEFENG_KEY中配置和风天气的 Key');
      return;
    }

    const now = new Date();
    const weekMap = ['日', '一', '二', '三', '四', '五', '六'];
    const dateText = `${now.getMonth() + 1}月${now.getDate()}日 星期${weekMap[now.getDay()]}`;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let nowData = null;
    let dailyToday = null;
    const checkAndApply = () => {
      if (!nowData) return;
      const w = nowData.now || {};
      const weather = {
        ...this.data.weather,
        city: '上海',
        dateText,
        weatherText: w.text || this.data.weather.weatherText,
        temp: w.temp != null ? `${w.temp}℃` : this.data.weather.temp,
        humidity: w.humidity != null ? `湿度 ${w.humidity}%` : '',
        windDir: w.windDir ? `${w.windDir} ${w.windScale || ''}级` : '',
        tempRange: '',
        tip: this.data.weather.tip
      };
      if (dailyToday) {
        weather.tempRange = `${dailyToday.tempMin || '--'}℃ / ${dailyToday.tempMax || '--'}℃`;
      }
      const { alerts, tip: dynamicTip } = this.buildWeatherAlerts(nowData, dailyToday);
      if (dynamicTip) weather.tip = dynamicTip;
      this.setData({ weather, weatherAlerts: alerts });
    };

    // 1. 实时天气（含湿度、风向）
    wx.request({
      url: `${HEFENG_BASE}/v7/weather/now`,
      method: 'GET',
      data: { location: SHANGHAI_LOCATION, key: HEFENG_KEY },
      success: (res) => {
        const data = res && res.data ? res.data : {};
        if (data.code === '200') {
          nowData = data;
          checkAndApply();
        }
      }
    });

    // 2. 逐日预报（今日最高最低温）
    wx.request({
      url: `${HEFENG_BASE}/v7/weather/3d`,
      method: 'GET',
      data: { location: SHANGHAI_LOCATION, key: HEFENG_KEY },
      success: (res) => {
        const data = res && res.data ? res.data : {};
        if (data.code === '200' && data.daily && data.daily.length) {
          dailyToday = data.daily.find(d => d.fxDate === todayStr) || data.daily[0];
          checkAndApply();
        }
      }
    });

  },

  buildWeatherAlerts(nowData, dailyToday) {
    const alerts = [];
    const now = (nowData && nowData.now) ? nowData.now : {};
    const text = (now.text || '').trim();
    const tempMin = dailyToday && dailyToday.tempMin != null ? Number(dailyToday.tempMin) : null;
    const tempMax = dailyToday && dailyToday.tempMax != null ? Number(dailyToday.tempMax) : null;
    const diff = (tempMin != null && tempMax != null) ? tempMax - tempMin : 0;

    let tip = '根据今日实时天气为您提供出行与健康建议。';

    // 降雨/雪/雷等
    if (/雨|雪|雷|雹|雾|霾|沙/.test(text)) {
      alerts.push({
        id: 'rain',
        level: '降雨提醒',
        title: text.indexOf('雨') !== -1 ? '今日有降水' : (text.indexOf('雪') !== -1 ? '今日有降雪' : '今日天气有变'),
        desc: '外出记得带伞，注意路面湿滑，老人儿童尽量减少外出。',
        tag: '出行建议'
      });
      tip = '今日有降水或恶劣天气，出行请带伞并注意安全。';
    }

    // 昼夜温差
    if (diff >= 8) {
      alerts.push({
        id: 'tempDiff',
        level: '温差提醒',
        title: '昼夜温差较明显',
        desc: '早晚气温偏低，老人和儿童外出可适当添衣，注意保暖。',
        tag: '穿衣建议'
      });
      if (!/雨|雪/.test(tip)) tip = '昼夜温差大，早晚请适当添衣。';
    }

    // 高温/低温
    if (tempMax != null && tempMax >= 35) {
      alerts.push({
        id: 'hot',
        level: '高温提醒',
        title: '今日气温较高',
        desc: '注意防暑降温，多补水，避免长时间户外暴晒。',
        tag: '健康建议'
      });
      tip = '今日高温，注意防暑补水。';
    } else if (tempMin != null && tempMin <= 0) {
      alerts.push({
        id: 'cold',
        level: '低温提醒',
        title: '早晚气温较低',
        desc: '注意防寒保暖，心脑血管人群尤其注意。',
        tag: '穿衣建议'
      });
      if (!/温差/.test(tip)) tip = '早晚较冷，注意添衣保暖。';
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'default',
        level: '天气贴士',
        title: '今日天气适宜',
        desc: '适合户外活动与出行，注意适时补水。',
        tag: '出行建议'
      });
    }

    return { alerts, tip };
  },

  updateSummary() {
    const routines = this.data.routines || [];
    const enabledList = routines.filter(item => item.enabled);
    const completedList = enabledList.filter(item => item.done);
    this.setData({
      summary: {
        total: enabledList.length,
        pending: Math.max(enabledList.length - completedList.length, 0),
        completed: completedList.length
      }
    });
  },

  toggleRoutine(e) {
    const { id } = e.currentTarget.dataset;
    const routines = (this.data.routines || []).map(item => {
      if (item.id === id) {
        return { ...item, enabled: !item.enabled };
      }
      return item;
    });
    this.setData({ routines });
    this.updateSummary();
  },

  markRoutineDone(e) {
    const { id } = e.currentTarget.dataset;
    const routines = (this.data.routines || []).map(item => {
      if (item.id === id && item.enabled) {
        return { ...item, done: !item.done };
      }
      return item;
    });
    this.setData({ routines });
    this.updateSummary();
  },

  markAllDone() {
    const routines = (this.data.routines || []).map(item => {
      if (item.enabled) {
        return { ...item, done: true };
      }
      return item;
    });
    this.setData({ routines });
    this.updateSummary();
    wx.showToast({ title: '今日提醒已完成', icon: 'success' });
  },

  switchTabPage(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;
    if (url === '/subpackage/pkg-feature/reminder/reminder') return;
    wx.reLaunch({ url });
  },

  goToChat() {
    wx.reLaunch({ url: '/subpackage/pkg-feature/chat/chat' });
  }
});