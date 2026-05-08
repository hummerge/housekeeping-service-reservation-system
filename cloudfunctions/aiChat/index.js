// cloudfunctions/aiChat/index.js
// ============================================================
// 银发关怀 — AI 对话云函数
// 作用：接收小程序传来的对话历史，发给第三方 AI 接口，返回 AI 的回复
// 部署：微信开发者工具 → 云函数目录 → 右键「aiChat」→「上传并部署」
// ============================================================

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ============================================================
// ⚙️ AI 配置（必须填写，否则无法使用）
// 请把以下三个值替换成你自己的信息
// ============================================================

const AI_CONFIG = {
  // 第一步：填入你的第三方 API 地址（OpenAI 兼容格式）
  // 示例：'https://api.openai.com/v1/chat/completions'
  // 示例：'https://api.siliconflow.cn/v1/chat/completions'
  URL: 'https://shapi.zeabur.app/v1/chat/completions',

  // 第二步：填入你的 API Key
  KEY: 'sk-zezrVuJRoW1Iain2iotNuLo7QCwaPRgkRU1ylqfReTmYJqd8',

  // 第三步：填入模型名称（可选）
  MODEL: 'gemini-3-flash-preview',
};

// 系统提示词（可自定义 AI 的人设和行为）
const SYSTEM_PROMPT = `你是一位温暖、专业的 AI 健康助手，服务于老年人群体。
请用简洁、亲切、易懂的语言回答问题，避免使用过于专业的术语。
如果涉及医疗建议，请提醒用户"仅供参考，具体请咨询医生"。
你的名字是「温颐」，性格温和有耐心，像子女一样关心老人的健康生活。`;

// ============================================================
// 入口函数
// ============================================================
exports.main = async (event, context) => {
  const { messages = [], model } = event;

  // 参数校验
  if (!messages || messages.length === 0) {
    return { success: false, error: '消息列表不能为空' };
  }

  // 构造请求体（OpenAI 兼容格式）
  const requestBody = {
    model: model || AI_CONFIG.MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
    stream: false,
  };

  try {
    // 直接使用 HTTP 调用（若需改用云托管代理，请参考上方 cloudCallContainer 的方式）
    if (!AI_CONFIG.URL || !AI_CONFIG.URL.includes('/v1/')) {
      console.error('[aiChat] URL 缺少 /v1/ 前缀，当前 URL:', AI_CONFIG.URL);
      return {
        success: false,
        error: `API 地址配置错误：${AI_CONFIG.URL} 可能缺少 /v1/ 前缀，请检查 URL 配置`,
      };
    }
    const response = await httpRequest(AI_CONFIG.URL, AI_CONFIG.KEY, requestBody);

    // 解析 OpenAI 兼容格式返回
    const reply = response.choices
      && response.choices[0]
      && response.choices[0].message
      && response.choices[0].message.content;

    if (!reply) {
      console.error('AI 返回格式异常:', JSON.stringify(response));
      return { success: false, error: 'AI 返回格式异常', raw: response };
    }

    return {
      success: true,
      reply,
      model: response.model || model || AI_CONFIG.MODEL,
      usage: response.usage,
    };
  } catch (err) {
    console.error('aiChat 云函数错误:', err);
    return {
      success: false,
      error: err.message || 'AI 请求失败，请稍后重试',
    };
  }
};

// ============================================================
// HTTP 请求封装（使用 wx-server-sdk 内置能力）
// ============================================================
function httpRequest(url, key, body) {
  return new Promise((resolve, reject) => {
    const http = cloud.getHttpClient();
    http.request({
      url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      success: (res) => {
        // 防御：检测 HTML 响应（常见于 URL 路径错误，如缺少 /v1/）
        const dataStr = typeof res.data === 'string' ? res.data.trim() : '';
        const isHtmlResponse =
          dataStr.startsWith('<!') || dataStr.startsWith('<html');

        if (isHtmlResponse) {
          return reject(
            new Error(
              `API 地址配置错误：${url} 返回了 HTML 而非 JSON，可能 URL 缺少 /v1/ 前缀或地址不正确`
            )
          );
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(res.data));
          } catch {
            resolve(res.data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.data}`));
        }
      },
      fail: reject,
    });
  });
}
