// ============================================================
// 银发关怀 — AI聊天页面  v2（语音输入 + 朗读 + AI对话）
// ============================================================

// ===== AI 配置 =====
const AI_CONFIG = {
  // 第1步：第三方 API 地址
  URL: 'https://ai.shuaihong.fun/v1/chat/completions',
  // 第2步：API Key
  KEY: '————————————————————————————————————————————',
  // 第3步：模型名称
  MODEL: 'gemini-3-flash-preview',
};

// ===== 百度语音配置=====
const BAIDU_VOICE = {
  APP_ID: '————————————————',
  API_KEY: '——————————————————',
  SECRET_KEY: '——————————————————————',
};
// 百度 Token 获取接口
const BAIDU_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
// 百度 ASR 识别接口
const BAIDU_ASR_URL = 'https://vop.baidu.com/server_api';
// 百度 TTS 接口
const BAIDU_TTS_URL = 'https://tsn.baidu.com/text2audio';

// 开发者可在 app.js 中全局覆盖 AI_CONFIG / BAIDU_VOICE，格式相同
const app = typeof getApp === 'function' ? getApp() : {};
const finalAiConfig = (app.globalData && app.globalData.aiConfig) || AI_CONFIG;
const finalBaiduVoice = (app.globalData && app.globalData.baiduVoice) || BAIDU_VOICE;
const IconData = require('../../../images/icons_data.js');
const i18n = require('../../../utils/i18n.js');
const intentDispatch = require('../../../utils/intent-dispatch.js');
const { buildChatSystemPrompt } = require('../../../utils/chat-ai-prompt.js');

let msgIdCounter = 0;

// 从调用 start() 到 onStop/onError 为止为 true（不依赖 onStart，避免松手过早漏掉 stop）
let recordLifecycleActive = false;
// 手指是否仍按住麦克风（touchstart 同步置 true，任意松手置 false；用于挡住 getSetting/authorize 晚到的 start）
let micFingerDown = false;
// 已发起 stop，避免 mic+page 重复 touchend 连续调用 stop
let voiceStopInFlight = false;

// #region agent log
function _dbgLog(location, message, data, hypothesisId, runId) {
  const payload = {
    sessionId: '7203d7',
    location,
    message,
    data: data || {},
    timestamp: Date.now(),
    hypothesisId: hypothesisId || '',
    runId: runId || 'post-fix'
  };
  try {
    wx.request({
      url: 'http://127.0.0.1:7906/ingest/8973b03c-4e77-4191-9d50-db3cba448503',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '7203d7'
      },
      data: payload,
      fail: () => {}
    });
  } catch (e) {}
}
// #endregion

// 录音管理器
let recorderManager = null;
// TTS 播放器
let innerAudioContext = null;

Page({
  data: {
    messages: [],
    inputText: '',
    aiAvatar: IconData.ai_default_avatar,
    scrollTop: 0,
    showMoreMenu: false,
    statusBarHeight: 20,
    inputBarPaddingBottom: 0,

    // ===== 语音输入状态 =====
    isRecording: false,       // 是否正在录音
    recordingTime: 0,         // 录音时长（秒）
    voiceLevel: 0,            // 麦克风音量等级 0-9
    recordingTip: '按住说话', // 录音提示

    // ===== 朗读状态 =====
    ttsEnabled: true,         // 朗读开关
    ttsVolume: 0.8,           // 朗读音量 0~1
    ttsPlaying: false,        // 是否正在播放
    showVolumeSlider: false,  // 是否显示音量滑块
    currentPlayingId: null,   // 当前正在朗读的消息ID

    // ===== 百度语音 Token =====
    baiduAccessToken: '',
    navTitle: 'AI健康助手',
    navSubtitle: '',
    welcomeGreeting: '',
    welcomeDesc: '',
    inputPlaceholder: '',
    send: '发送',
    typing: '正在输入',
    chip1: '',
    chip2: '',
    chip3: '',
    chip4: '',
    chatMeLabel: '我',
    chatDisclaimer: ''
  },

  applyChatLocale() {
    const C = i18n.getChatPage(i18n.getLocale());
    this.setData({
      navTitle: C.navTitle,
      navSubtitle: C.navSubtitle,
      welcomeGreeting: C.welcomeGreeting,
      welcomeDesc: C.welcomeDesc,
      inputPlaceholder: C.inputPlaceholder,
      send: C.send,
      typing: C.typing,
      chip1: C.chip1,
      chip2: C.chip2,
      chip3: C.chip3,
      chip4: C.chip4,
      chatMeLabel: i18n.getLocale() === 'en' ? 'Me' : '我',
      recordingTip: C.tipHold,
      chatDisclaimer: C.chatDisclaimer
    });
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      inputBarPaddingBottom: sysInfo.safeArea
        ? (sysInfo.screenHeight - sysInfo.safeArea.bottom)
        : 0,
    });

    // 初始化录音管理器
    this.initRecorder();
    // 初始化 TTS 播放器
    this.initTTSPlayer();
    // 获取 AI 头像
    if (app.globalData && app.globalData.aiAvatar) {
      this.setData({ aiAvatar: app.globalData.aiAvatar });
    }
    this.applyChatLocale();
  },

  onShow() {
    this.applyChatLocale();
  },

  onUnload() {
    // 页面卸载时释放资源
    if (recorderManager) {
      try { recorderManager.stop(); } catch (e) {}
    }
    recordLifecycleActive = false;
    micFingerDown = false;
    voiceStopInFlight = false;
    if (innerAudioContext) {
      innerAudioContext.stop();
      innerAudioContext.destroy();
    }
  },

  // ============================================================
  // 录音管理初始化
  // ============================================================
  initRecorder() {
    recorderManager = wx.getRecorderManager();

    // 录音开始
    recorderManager.onStart(() => {
      // #region agent log
      _dbgLog('chat.js:recorder.onStart', 'recorder started', { ttsPlaying: this.data.ttsPlaying }, 'H1');
      // #endregion
      this.setData({ isRecording: true, recordingTime: 0, voiceLevel: 0 });
      // 启动计时器
      this.recordingTimer = setInterval(() => {
        this.setData({ recordingTime: this.data.recordingTime + 1 });
        // 模拟音量波动
        this.setData({ voiceLevel: Math.floor(Math.random() * 5) + 1 });
      }, 1000);
    });

    // 录音结束，返回临时文件路径
    recorderManager.onStop((res) => {
      recordLifecycleActive = false;
      voiceStopInFlight = false;
      // #region agent log
      _dbgLog('chat.js:recorder.onStop', 'recorder stopped', { duration: res && res.duration, hasPath: !!(res && res.tempFilePath) }, 'H2');
      // #endregion
      clearInterval(this.recordingTimer);
      const C = i18n.getChatPage(i18n.getLocale());
      this.setData({ isRecording: false, voiceLevel: 0, recordingTip: C.tipHold });
      if (res.duration < 500) {
        wx.showToast({ title: '说话时间太短', icon: 'none' });
        return;
      }
      // 上传百度语音识别
      this.recognizeSpeech(res.tempFilePath);
    });

    // 录音错误
    recorderManager.onError((err) => {
      recordLifecycleActive = false;
      voiceStopInFlight = false;
      // #region agent log
      _dbgLog('chat.js:recorder.onError', 'recorder error', { errMsg: err && err.errMsg, errCode: err && err.errCode }, 'H2');
      // #endregion
      clearInterval(this.recordingTimer);
      this.setData({ isRecording: false, voiceLevel: 0 });
      console.error('录音错误:', err);
      wx.showToast({ title: '录音失败，请检查权限', icon: 'none' });
    });
  },

  // ============================================================
  // TTS 播放器初始化
  // ============================================================
  initTTSPlayer() {
    innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.volume = this.data.ttsVolume;

    innerAudioContext.onPlay(() => {
      this.setData({ ttsPlaying: true });
    });

    innerAudioContext.onEnded(() => {
      this.setData({ ttsPlaying: false, currentPlayingId: null });
    });

    innerAudioContext.onError((err) => {
      console.error('TTS 播放错误:', err);
      this.setData({ ttsPlaying: false, currentPlayingId: null });
      wx.showToast({ title: '朗读失败', icon: 'none' });
    });
  },

  // ============================================================
  // 语音输入 — 按下开始录音
  // ============================================================
  onVoiceRecordStart() {
    micFingerDown = true;
    // #region agent log
    _dbgLog('chat.js:onVoiceRecordStart', 'touchstart', { isRecording: this.data.isRecording, ttsPlaying: this.data.ttsPlaying, micFingerDown }, 'H4');
    // #endregion
    // 检查权限
    wx.getSetting({
      success: (res) => {
        // #region agent log
        _dbgLog('chat.js:getSetting', 'auth scope.record', { recordAuth: res.authSetting['scope.record'], micFingerDown }, 'H4');
        // #endregion
        if (!micFingerDown) return;
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              if (!micFingerDown) return;
              this.startRecord();
            },
            fail: () => {
              wx.showModal({
                title: '需要麦克风权限',
                content: '请在设置中开启麦克风权限，以便使用语音输入',
                confirmText: '去设置',
                success: (modal) => {
                  if (modal.confirm) wx.openSetting();
                },
              });
            },
          });
        } else {
          this.startRecord();
        }
      },
    });
  },

  /** 页面任意位置松手 / 取消：解决手指滑出麦克风区域后 touchend 不在 mic 上的问题 */
  onPageVoiceTouchEnd() {
    this.endMicFingerGesture('page-touchend');
  },

  onPageVoiceTouchCancel() {
    this.endMicFingerGesture('page-touchcancel');
  },

  endMicFingerGesture(source) {
    // #region agent log
    _dbgLog('chat.js:endMicFingerGesture', source, {
      micFingerDown,
      recordLifecycleActive,
      voiceStopInFlight
    }, 'H6');
    // #endregion
    if (!micFingerDown && !recordLifecycleActive) return;
    micFingerDown = false;
    if (!recordLifecycleActive) return;
    if (voiceStopInFlight) return;
    voiceStopInFlight = true;
    const C = i18n.getChatPage(i18n.getLocale());
    this.setData({ recordingTip: C.tipRecognizing });
    recorderManager.stop();
  },

  startRecord() {
    // #region agent log
    _dbgLog('chat.js:startRecord', 'enter', {
      isRecording: this.data.isRecording,
      recordLifecycleActive,
      willSkip: !!recordLifecycleActive
    }, 'H1');
    // #endregion
    if (recordLifecycleActive) return;
    recordLifecycleActive = true;
    const C = i18n.getChatPage(i18n.getLocale());
    this.setData({ recordingTip: C.tipRecording });
    recorderManager.start({
      format: 'wav',
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000
      // 勿传 encodeBitRate：仅对 mp3/aac 有效，部分机型对 wav 传码率会导致与百度要求不一致
    });
  },

  // ============================================================
  // 语音输入 — 松开停止录音
  // ============================================================
  onVoiceRecordEnd() {
    this.endMicFingerGesture('mic-catch-touchend');
  },

  onVoiceRecordCancel() {
    this.endMicFingerGesture('mic-catch-touchcancel');
  },

  // ============================================================
  // 百度语音识别（ASR）
  // ============================================================
  async recognizeSpeech(filePath) {
    wx.showLoading({ title: '正在识别…' });

    try {
      // Step 1：获取百度 Access Token
      const token = await this.getBaiduAccessToken();
      if (!token) throw new Error('百度 Token 获取失败');

      // Step 2：上传音频到百度 ASR
      const text = await this.sendToBaiduASR(filePath, token);
      if (!text) throw new Error('未识别到文字');

      wx.hideLoading();
      // 将识别结果填入输入框
      this.setData({ inputText: text });

      // 自动发送（可选）：去掉注释即可自动发送语音识别内容
      // setTimeout(() => this.sendMessage(), 300);
    } catch (err) {
      wx.hideLoading();
      console.error('语音识别失败:', err);
      wx.showToast({ title: '语音识别失败，请重试', icon: 'none' });
    }
  },

  // 获取百度 Access Token（有效期内自动复用）
  getBaiduAccessToken() {
    return new Promise((resolve) => {
      // 优先使用缓存的 token
      if (this.data.baiduAccessToken) return resolve(this.data.baiduAccessToken);

      const params = {
        grant_type: 'client_credentials',
        client_id: finalBaiduVoice.API_KEY,
        client_secret: finalBaiduVoice.SECRET_KEY,
      };
      const query = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

      wx.request({
        url: `${BAIDU_TOKEN_URL}?${query}`,
        method: 'GET',
        success: (res) => {
          if (res.data && res.data.access_token) {
            this.setData({ baiduAccessToken: res.data.access_token });
            resolve(res.data.access_token);
          } else {
            console.error('百度 Token 获取失败:', res.data);
            resolve(null);
          }
        },
        fail: (err) => {
          console.error('百度 Token 请求失败:', err);
          resolve(null);
        },
      });
    });
  },

    // 发送音频到百度 ASR (修复版)
    sendToBaiduASR(filePath, token) {
      return new Promise((resolve, reject) => {
        const fs = wx.getFileSystemManager();
        // 1. 先读取文件的二进制数据
        fs.readFile({
          filePath: filePath,
          success: (res) => {
            const buffer = res.data; // 拿到 ArrayBuffer
            // 2. 使用 wx.request 直接发送二进制流
            wx.request({
              url: `${BAIDU_ASR_URL}?dev_pid=1537&token=${encodeURIComponent(token)}&cuid=wx_mini_${Date.now()}`,
              method: 'POST',
              header: {
                // 关键：告诉百度这是 wav 格式，采样率 16000
                'Content-Type': 'audio/wav; rate=16000'
              },
              data: buffer,
              success: (asrRes) => {
                const data = asrRes.data;
                if (data.err_no === 0 && data.result && data.result[0]) {
                  // 识别成功
                  const text = data.result[0].replace(/[，。？！、；：""''【】《》]$/, '');
                  resolve(text);
                } else {
                  console.error('百度 ASR 识别失败:', data);
                  // 如果还是报错 3311，说明录音文件的采样率可能不是 16000
                  resolve('');
                }
              },
              fail: (err) => {
                console.error('百度 ASR 请求失败:', err);
                reject(err);
              }
            });
          },
          fail: (err) => {
            console.error('读取录音文件失败:', err);
            reject(err);
          }
        });
      });
    },

  // ============================================================
  // 百度 TTS 朗读
  // ============================================================
  playTTS(text) {
    if (!this.data.ttsEnabled) return;

    // 停止当前播放
    if (innerAudioContext) {
      innerAudioContext.stop();
    }

    const params = {
      tex: encodeURIComponent(text),
      tok: this.data.baiduAccessToken || '',
      cuid: `wx_mini_${Date.now()}`,
      lan: 'ZH',
      ctp: 1,
      aue: 3,       // 3=mp3，6=pcm-16k，9=pcm-8k
      vol: 9,        // 音量 0-15
      per: 0,        // 0=普通女声，1=普通男声，3=情感女声，4=情感男声
      spd: 5,        // 语速 0-15
      pit: 5,        // 语调 0-15
    };
    const query = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
    const ttsUrl = `${BAIDU_TTS_URL}?${query}`;

    innerAudioContext.src = ttsUrl;
    innerAudioContext.volume = this.data.ttsVolume;
    innerAudioContext.play();
  },

  stopTTS() {
    if (innerAudioContext) {
      innerAudioContext.stop();
      this.setData({ ttsPlaying: false, currentPlayingId: null });
    }
  },

  // ============================================================
  // 朗读按钮 — 点击播放/停止当前 AI 消息
  // ============================================================
  onPlayTTS(e) {
    const { id, text } = e.currentTarget.dataset;

    // 如果正在播放同一消息，则停止
    if (this.data.ttsPlaying && this.data.currentPlayingId === id) {
      this.stopTTS();
      return;
    }

    // 获取百度 Token（确保有）
    if (!this.data.baiduAccessToken) {
      this.getBaiduAccessToken().then(() => {
        this.setData({ currentPlayingId: id }, () => {
          this.playTTS(text);
        });
      });
    } else {
      this.setData({ currentPlayingId: id }, () => {
        this.playTTS(text);
      });
    }
  },

  // ============================================================
  // TTS 开关切换
  // ============================================================
  onToggleTTS() {
    if (this.data.ttsPlaying) {
      this.stopTTS();
    }
    this.setData({ ttsEnabled: !this.data.ttsEnabled });
  },

  // ============================================================
  // 朗读开关（右上角按钮）
  // ============================================================
  onToggleTTSBtn() {
    const newEnabled = !this.data.ttsEnabled;
    this.setData({ ttsEnabled: newEnabled });
    if (!newEnabled && this.data.ttsPlaying) {
      this.stopTTS();
    }
    wx.showToast({
      title: newEnabled ? '朗读已开启' : '朗读已关闭',
      icon: 'none',
      duration: 1000,
    });
  },

  // ============================================================
  // 音量滑块 — 显示/隐藏
  // ============================================================
  onToggleVolumeSlider() {
    this.setData({ showVolumeSlider: !this.data.showVolumeSlider });
  },

  // ============================================================
  // 音量滑块 — 拖动调整
  // ============================================================
  onVolumeChange(e) {
    const vol = parseFloat((e.detail.value / 100).toFixed(2));
    this.setData({ ttsVolume: vol });
    if (innerAudioContext) {
      innerAudioContext.volume = vol;
    }
  },

  // ============================================================
  // 输入框
  // ============================================================
  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  // ============================================================
  // 发送消息
  // ============================================================
  sendMessage() {
    const text = this.data.inputText.trim();
    if (!text) return;

    const userMsg = { id: ++msgIdCounter, role: 'user', content: text };
    const newMessages = [...this.data.messages, userMsg];
    this.setData({
      messages: newMessages,
      inputText: '',
      showMoreMenu: false,
    });

    this.scrollToBottom();

    const aiMsgId = ++msgIdCounter;
    const loadingMsg = { id: aiMsgId, role: 'ai', content: '', loading: true };
    this.setData({ messages: [...this.data.messages, loadingMsg] });
    this.scrollToBottom();

    const apiMessages = newMessages.map(({ role, content }) => ({ role, content }));
    this.callAI(apiMessages)
      .then((reply) => {
        this.updateAiMessageFromRaw(aiMsgId, reply);
      })
      .catch((err) => {
        console.error('AI 请求失败:', err);
        this.updateAiMessagePlain(aiMsgId, '抱歉，网络开小差了，请稍后再试。');
      });
  },

  // ============================================================
  // 调用 AI（HTTP 直连）
  // ============================================================
  callAI(messages) {
    const mapped = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));
    const body = {
      model: finalAiConfig.MODEL,
      messages: [{ role: 'system', content: buildChatSystemPrompt() }, ...mapped],
      stream: false
    };

    return new Promise((resolve, reject) => {
      wx.request({
        url: finalAiConfig.URL,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalAiConfig.KEY}`,
        },
        data: body,
        success: (res) => {
          const data = res && res.data;
          const statusCode = res && res.statusCode;

          if (statusCode === 401) return reject(new Error('API Key 无效，请检查 KEY 配置'));
          if (statusCode === 403) return reject(new Error('无访问权限，请检查 KEY 或账户余额'));
          if (statusCode === 404) return reject(new Error('API 地址错误，请检查 URL 配置'));
          if (statusCode === 429) return reject(new Error('请求过于频繁，请稍后再试'));
          if (!data) return reject(new Error('网络请求无响应'));

          const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
          if (reply) return resolve(reply);

          const alt = data.result || data.response || data.text || data.content || data.reply || data.message;
          if (alt) return resolve(typeof alt === 'string' ? alt : JSON.stringify(alt));

          reject(new Error(`AI 返回格式异常（${statusCode}）`));
        },
        fail: (err) => reject(new Error(`网络请求失败: ${err && err.errMsg}`)),
      });
    });
  },

  // ============================================================
  // 更新 AI 消息（结构化 JSON 或纯文本错误提示）
  // ============================================================
  updateAiMessageFromRaw(id, raw) {
    const parsed = intentDispatch.parseAiPayload(raw);
    const locale = i18n.getLocale();
    let dispatch = null;
    if (parsed.dispatch) {
      const resolved = intentDispatch.resolveDispatch(parsed.dispatch, locale);
      if (resolved) {
        const C = i18n.getChatPage(locale);
        dispatch = {
          url: resolved.url,
          displayLabel: resolved.displayLabel,
          hintText: C.dispatchHintTpl.replace(/\{\{name\}\}/g, resolved.displayLabel)
        };
      }
    }
    const messages = this.data.messages.map((m) => {
      if (m.id !== id) return m;
      const next = { ...m, content: parsed.user_reply, loading: false };
      if (dispatch) next.dispatch = dispatch;
      else delete next.dispatch;
      return next;
    });
    this.setData({ messages });
    this.scrollToBottom();
  },

  updateAiMessagePlain(id, text) {
    const messages = this.data.messages.map((m) => {
      if (m.id !== id) return m;
      const next = { ...m, content: text, loading: false };
      delete next.dispatch;
      return next;
    });
    this.setData({ messages });
    this.scrollToBottom();
  },

  onDispatchTap(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;
    const C = i18n.getChatPage(i18n.getLocale());
    wx.showModal({
      title: C.dispatchConfirmTitle,
      content: C.dispatchConfirmContent,
      confirmText: C.dispatchConfirmOk,
      cancelText: C.dispatchConfirmCancel,
      success: (res) => {
        if (!res.confirm) return;
        wx.navigateTo({ url });
      }
    });
  },

  // ============================================================
  // 滚动到底部
  // ============================================================
  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollTop: this.data.scrollTop + 99999 });
    }, 50);
  },

  // ============================================================
  // 快捷问题
  // ============================================================
  quickAsk(e) {
    const q = e.currentTarget.dataset.q;
    this.setData({ inputText: q }, () => {
      this.sendMessage();
    });
  },

  // ============================================================
  // 展开/收起扩展面板
  // ============================================================
  toggleMoreMenu() {
    this.setData({ showMoreMenu: !this.data.showMoreMenu });
  },

  // ============================================================
  // 返回
  // ============================================================
  goBack() {
    if (this.data.ttsPlaying) this.stopTTS();
    // 聊天页由 reLaunch 打开，栈内无上一页，直接返回首页
    wx.reLaunch({ url: '/pages/home/home' });
  },

  // ============================================================
  // 更多菜单
  // ============================================================
  showMoreMenu() {
    wx.showActionSheet({
      itemList: ['清空聊天记录', '关于 AI 助手'],
      success: (res) => {
        if (res.tapIndex === 0) this.setData({ messages: [] });
      },
    });
  },
});
