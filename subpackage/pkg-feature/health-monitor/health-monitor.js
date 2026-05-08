import * as echarts from './echarts';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getMoodColor(moodIndex) {
  const map = {
    0: '#2ecc71', // 😄
    1: '#8bc34a', // 🙂
    2: '#f1c40f', // 😐
    3: '#e67e22', // 😔
    4: '#e74c3c' // 😡
  };
  return map[moodIndex] || '#cccccc';
}

Page({
  data: {
    echarts,
    // Pulse Hub
    heartRate: 75,
    pulseRate: 92,
    heartBeatMs: 800,
    alarmOn: false,
    alarmText: '',
    alarmHeart: false,
    alarmPulse: false,
    alarmPhoneNumber: '120',

    // Soul Echo
    moods: [
      { index: 0, emoji: '😄' },
      { index: 1, emoji: '🙂' },
      { index: 2, emoji: '😐' },
      { index: 3, emoji: '😔' },
      { index: 4, emoji: '😡' }
    ],
    selectedMoodIndex: 2,
    moodText: '',
    moodHistory: [],

    // ECharts 24h 趋势图（懒加载，onReady 时 init）
    ecHeart: { lazyLoad: true },
    ecPulse: { lazyLoad: true }
  },

  onShow() {
    if (!this._inited) {
      this._inited = true;
      this.initMoodsAndTrends();
      this.initPulseWaveState();
    }
    this.startRealtime();
    this.drawAll();
  },

  onReady() {
    this.drawAll();
    // 懒加载 ECharts：在 onReady 后初始化两个趋势图
    const heartComp = this.selectComponent('#heartChart');
    const pulseComp = this.selectComponent('#pulseChart');
    if (heartComp && typeof heartComp.init === 'function') {
      heartComp.init((canvas, w, h, dpr) => this.initHeartChart(canvas, w, h, dpr));
    }
    if (pulseComp && typeof pulseComp.init === 'function') {
      pulseComp.init((canvas, w, h, dpr) => this.initPulseChart(canvas, w, h, dpr));
    }
  },

  getHeartOption() {
    const series = (this.heartTrendSeries || []).slice();
    const color = this.data.alarmHeart ? '#ff4d4d' : '#39ff14';
    const hours = series.map((_, i) => (i + 1) + '时');
    return {
      grid: { left: 36, right: 16, top: 20, bottom: 28 },
      xAxis: { type: 'category', data: hours, boundaryGap: false, axisLine: { lineStyle: { color: '#ddd' } }, axisLabel: { fontSize: 12 } },
      yAxis: { type: 'value', scale: true, splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } }, axisLabel: { fontSize: 12 } },
      series: [{ type: 'line', data: series, smooth: true, symbol: 'none', lineStyle: { color, width: 2 }, areaStyle: { color: echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: color + '40' }, { offset: 1, color: color + '08' }]) } }]
    };
  },

  getPulseOption() {
    const series = (this.pulseTrendSeries || []).slice();
    const color = this.data.alarmPulse ? '#ff4d4d' : '#39ff14';
    const hours = series.map((_, i) => (i + 1) + '时');
    return {
      grid: { left: 36, right: 16, top: 20, bottom: 28 },
      xAxis: { type: 'category', data: hours, boundaryGap: false, axisLine: { lineStyle: { color: '#ddd' } }, axisLabel: { fontSize: 12 } },
      yAxis: { type: 'value', scale: true, splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } }, axisLabel: { fontSize: 12 } },
      series: [{ type: 'line', data: series, smooth: true, symbol: 'none', lineStyle: { color, width: 2 }, areaStyle: { color: echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: color + '40' }, { offset: 1, color: color + '08' }]) } }]
    };
  },

  initHeartChart(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
    canvas.setChart(chart);
    chart.setOption(this.getHeartOption());
    this.heartChart = chart;
    return chart;
  },

  initPulseChart(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
    canvas.setChart(chart);
    chart.setOption(this.getPulseOption());
    this.pulseChart = chart;
    return chart;
  },

  onHide() {
    this.stopRealtime();
  },

  onUnload() {
    this.stopRealtime();
  },

  initMoodsAndTrends() {
    const moodHistory = [];
    for (let i = 0; i < 7; i++) {
      const idx = clamp(this.data.selectedMoodIndex + (Math.random() > 0.5 ? 1 : 0) - 1, 0, 4);
      moodHistory.push({
        day: i,
        color: getMoodColor(idx)
      });
    }

    const baseHeart = 75;
    const basePulse = 92;
    this.heartTrendSeries = Array.from({ length: 24 }, () => Math.round(baseHeart + (Math.random() - 0.5) * 18));
    this.pulseTrendSeries = Array.from({ length: 24 }, () => Math.round(basePulse + (Math.random() - 0.5) * 20));

    this.setData({ moodHistory });
  },

  initPulseWaveState() {
    // 用心率作为“主频”模拟脉搏波形
    this.pulsePhase = 0;
    this.pulseWavePoints = Array.from({ length: 60 }, () => 0);
  },

  startRealtime() {
    this.stopRealtime();

    // WebSocket 路径（后续你接服务器推送即可）：
    // 1) 先把地址写到 storage：`healthWsUrl`
    // 2) 服务端推送：{ "heartRate": 75, "pulseRate": 92 } 或 { ... , "alarm": true }
    const wsUrl = wx.getStorageSync('healthWsUrl') || '';
    if (wsUrl) {
      this.connectWebSocket(wsUrl);
    }

    // 先用模拟数据跑通“实时感”，等你接入 WS/手环后即可替换
    this.mockTimer = setInterval(() => {
      const payload = this.generateMockPayload();
      this.applyRealtimePayload(payload, { from: 'mock' });
    }, 900);
  },

  stopRealtime() {
    if (this.mockTimer) {
      clearInterval(this.mockTimer);
      this.mockTimer = null;
    }
    if (this.wsTimer) {
      clearInterval(this.wsTimer);
      this.wsTimer = null;
    }
    if (this.wsConnected) {
      try {
        wx.closeSocket();
      } catch (e) {
        // ignore
      }
    }
    this.wsConnected = false;
  },

  connectWebSocket(wsUrl) {
    if (!this.wsHandlersInited) {
      this.wsHandlersInited = true;

      wx.onSocketOpen(() => {
        this.wsConnected = true;
        // 如果已经有 WS，停止模拟计时，避免冲突
        if (this.mockTimer) {
          clearInterval(this.mockTimer);
          this.mockTimer = null;
        }
      });

      wx.onSocketMessage((res) => {
        let payload = null;
        try {
          payload = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        } catch (e) {
          payload = null;
        }
        if (!payload) return;
        this.applyRealtimePayload(payload, { from: 'ws' });
      });

      wx.onSocketError(() => {
        // WS 不通时仍保留模拟数据
        this.wsConnected = false;
      });

      wx.onSocketClose(() => {
        this.wsConnected = false;
      });
    }

    // 开始连接（事件回调由 onSocket* 接管）
    try {
      wx.connectSocket({ url: wsUrl });
    } catch (e) {
      // ignore
    }
  },

  generateMockPayload() {
    const driftHeart = (Math.random() - 0.5) * 10;
    const driftPulse = (Math.random() - 0.5) * 12;
    let heartRate = Math.round(this.data.heartRate + driftHeart);
    let pulseRate = Math.round(this.data.pulseRate + driftPulse);

    // 偶尔制造一次异常，用于演示预警 UI
    if (Math.random() < 0.08) {
      heartRate = Math.random() < 0.5 ? 40 : 125;
      pulseRate = Math.random() < 0.5 ? 46 : 130;
    }

    heartRate = clamp(heartRate, 35, 160);
    pulseRate = clamp(pulseRate, 35, 160);

    return { heartRate, pulseRate };
  },

  applyRealtimePayload(payload) {
    const heartRate = Number(payload.heartRate);
    const pulseRate = Number(payload.pulseRate);
    if (!Number.isFinite(heartRate) || !Number.isFinite(pulseRate)) return;

    // 预警阈值（后续可从配置/云端下发）
    const alarmHeart = heartRate < 50 || heartRate > 110;
    const alarmPulse = pulseRate < 50 || pulseRate > 120;
    const alarmOn = !!(alarmHeart || alarmPulse);

    const heartBeatMs = clamp(Math.round(60000 / heartRate), 220, 1300);
    const alarmText = alarmOn
      ? alarmHeart && alarmPulse
        ? '心率与脉搏均异常'
        : alarmHeart
          ? '心率异常，请尽快处理'
          : '脉搏异常，请尽快处理'
      : '';

    // waveform points 更新：用“主频 + 波形噪声”模拟心电/脉搏流动感
    const beatFreq = heartRate / 60; // beats per second
    this.pulsePhase += beatFreq * 0.9 * Math.PI * 2; // 与 interval 粗略对齐
    const sample =
      Math.sin(this.pulsePhase) * (0.45 + Math.random() * 0.15) + (Math.random() - 0.5) * 0.22;
    const nextPoints = this.pulseWavePoints.slice(1);
    nextPoints.push(clamp(sample, -1, 1));
    this.pulseWavePoints = nextPoints;

    // 24h 趋势（占位模拟）：滑动更新 series
    this.heartTrendSeries = this.heartTrendSeries.slice(1).concat([heartRate]);
    this.pulseTrendSeries = this.pulseTrendSeries.slice(1).concat([pulseRate]);

    this.setData({
      heartRate,
      pulseRate,
      heartBeatMs,
      alarmOn,
      alarmText,
      alarmHeart,
      alarmPulse
    });

    this.drawPulseWave();
    // 更新 ECharts 趋势图（若已初始化）
    if (this.heartChart) this.heartChart.setOption(this.getHeartOption());
    if (this.pulseChart) this.pulseChart.setOption(this.getPulseOption());
  },

  onSelectMood(e) {
    const idx = Number(e.currentTarget.dataset.index);
    if (!Number.isFinite(idx)) return;

    // 点击震动反馈
    try {
      wx.vibrateShort();
    } catch (err) {
      // ignore
    }

    const moodHistory = (this.data.moodHistory || []).slice();
    if (moodHistory.length) {
      moodHistory[moodHistory.length - 1] = {
        day: moodHistory[moodHistory.length - 1].day,
        color: getMoodColor(idx)
      };
    }

    this.setData({
      selectedMoodIndex: idx,
      moodHistory
    });
  },

  onMoodTextInput(e) {
    this.setData({ moodText: e.detail.value || '' });
  },

  onOneKeyCall() {
    const num = this.data.alarmPhoneNumber || '120';
    wx.showModal({
      title: '确认呼叫',
      content: '是否立即拨打 ' + num + '？',
      confirmText: '呼叫',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return;
        wx.makePhoneCall({ phoneNumber: num });
      }
    });
  },

  drawAll() {
    this.drawPulseWave();
  },

  drawPulseWave() {
    const width = 300;
    const height = 120;
    const ctx = wx.createCanvasContext('pulseWave', this);

    ctx.clearRect(0, 0, width, height);

    // baseline / grid
    ctx.setStrokeStyle('rgba(255,255,255,0.12)');
    ctx.setLineWidth(1);
    for (let i = 1; i <= 3; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const color = this.data.alarmOn ? '#ff4d4d' : '#39ff14';
    ctx.setStrokeStyle(color);
    ctx.setLineWidth(2);

    const baseline = height / 2;
    const amplitude = height * 0.34;

    const points = this.pulseWavePoints || [];
    if (!points.length) return;

    const step = width / (points.length - 1);
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = i * step;
      const y = baseline - points[i] * amplitude;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.draw(true);
  },

});

