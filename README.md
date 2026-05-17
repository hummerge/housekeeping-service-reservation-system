# 智养慧联 · 银发健康与居家服务小程序

> 面向老年人及其家属的微信小程序：**AI 健康助手 + 语音交互 + 居家养老服务预约**，界面大字号、流程简化，降低数字鸿沟。  
> 项目代号 / 工程名：**温颐时光**（`project.config.json`）  
> 当前状态：**个人开发 · 内测体验版**（尚未商用上架）

---

## 项目简介

「智养慧联」将健康咨询与线下服务预约整合在同一入口：老人可用**语音或文字**向 AI 提问，系统在合规前提下给出通俗健康科普；当需求与平台服务匹配时，由 **意图分发（Agent）** 引导至对应预约页面（如上门护理、助餐、陪护、保洁等）。

主要研发工具：**Cursor**；大模型当前对接 **Gemini Flash** 系列（可扩展至其他 OpenAI 兼容接口）。

---

## 核心功能

| 模块 | 说明 |
|------|------|
| **AI 健康助手** | 结构化 JSON 回复（`user_reply` + 可选 `dispatch`），禁止诊断，侧重科普与就医方向提示 |
| **意图分发** | 白名单服务子类与 `i18n` 目录一致，模型输出 `dispatch` 后一键跳转预约 |
| **语音输入** | 长按麦克风 → 微信录音 → 百度 ASR → 文本填入输入框 |
| **朗读（TTS）** | 百度语音合成，朗读 AI 回复，方便视力较弱用户 |
| **服务预约** | 分类浏览、详情、下单、订单列表与详情 |
| **健康与关怀** | 用药提醒、健康监测图表（ECharts）、紧急入口、快捷操作 |
| **首页** | 服务分类、搜索、宣传轮播（腾讯云 COS）、线下活动地图 |
| **多语言** | 中英文界面切换（`utils/i18n.js`） |

---

## 技术栈

- **前端**：微信小程序（WXML / WXSS / JS），分包加载 `subpackage`
- **图表**：`echarts` + `echarts-for-weixin`
- **云开发**：微信云开发（`wx.cloud`），云函数示例：`aiChat`、`getWeRunData`
- **AI**：OpenAI 兼容 Chat Completions API（`subpackage/pkg-feature/chat/chat.js`）
- **语音**：百度语音识别（ASR）+ 语音合成（TTS）
- **静态资源**：腾讯云 COS CDN（`images/icons_data.js`）
- **地图**：腾讯地图距离计算（`utils/tencent-map.js`）

---

## 目录结构

```
智养慧联/
├── app.js / app.json / app.wxss    # 小程序入口
├── pages/home/                     # 首页
├── subpackage/
│   ├── pkg-feature/                # 功能分包：聊天、提醒、健康、紧急等
│   └── pkg-service/                # 服务分包：预约、订单、服务列表
├── utils/
│   ├── i18n.js                     # 文案与分类定义
│   ├── chat-ai-prompt.js           # AI 系统提示词
│   ├── intent-dispatch.js          # 意图白名单与跳转
│   └── tencent-map.js
├── images/
│   ├── icons_data.js               # CDN 资源映射（勿提交密钥）
│   └── CDN_图片命名说明.md
├── cloudfunctions/
│   ├── aiChat/                     # 可选：服务端转发 AI 请求
│   └── getWeRunData/
├── miniprogram_npm/                # npm 构建产物
└── project.config.json             # 微信开发者工具工程配置
```

---

## 本地运行

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（建议稳定版）
- Node.js（用于安装 npm 依赖与构建 `miniprogram_npm`）

### 步骤

1. **克隆仓库**

   ```bash
   git clone <你的仓库地址>
   cd 智养慧联
   ```

2. **安装依赖并构建 npm**

   ```bash
   npm install
   ```

   在微信开发者工具中：**工具 → 构建 npm**，生成 `miniprogram_npm`。

3. **导入项目**

   - 打开微信开发者工具 → 导入项目  
   - 目录选择本仓库根目录  
   - AppID 使用你的小程序 AppID（或使用测试号体验）

4. **配置密钥**

   在 `subpackage/pkg-feature/chat/chat.js` 或 `app.js` 的 `globalData` 中配置（推荐后者集中管理）：

   | 配置项 | 说明 |
   |--------|------|
   | `AI_CONFIG.URL` | OpenAI 兼容接口地址（需含 `/v1/chat/completions`） |
   | `AI_CONFIG.KEY` | API Key |
   | `AI_CONFIG.MODEL` | 模型名称，如 `gemini-3-flash-preview` |
   | `BAIDU_VOICE` | 百度语音 APP_ID / API_KEY / SECRET_KEY |
   | `CDN_BASE` | `images/icons_data.js` 中腾讯云 COS 访问域名 |

   > ⚠️ **提交 GitHub 前请删除或替换代码中的真实 Key**，仅保留示例占位符。

5. **百度 ASR 注意**

   上传识别时需带采样率参数，与录音一致（当前为 **16000**）：

   `...&rate=16000`

6. **开发者工具设置**

   - 详情 → 本地设置：按需勾选「不校验合法域名」（仅本地调试）  
   - 真机预览需在微信公众平台配置 request / uploadFile 合法域名

---

## AI 对话与意图分发说明

- 系统提示词见 `utils/chat-ai-prompt.js`  
- 模型应**只输出 JSON**，前端在 `chat.js` 中解析并渲染  
- `dispatch` 子类名称必须与 `utils/intent-dispatch.js` 白名单完全一致，避免跳转错误  

示例结构：

```json
{
  "user_reply": "给用户看的正文",
  "dispatch": null
}
```

或（需要预约时）：

```json
{
  "user_reply": "…",
  "dispatch": {
    "sub_zh": "血透治疗陪护",
    "sub_en": "Hemodialysis escort",
    "reason": "…",
    "confidence": 0.75
  }
}
```

---

## 静态资源（COS）

图标与 Banner 通过 CDN 引用，命名规则见 `images/CDN_图片命名说明.md`。  
在 `images/icons_data.js` 中修改 `CDN_BASE` 为你的存储桶地址，并按说明上传对应文件名。

---

## 合规声明

- 本产品 **不提供医疗诊断**，AI 仅作健康科普与就医方向提示。  
- 急症或严重症状应提示用户及时就医或拨打 120。  
- 语音、定位等能力需用户授权，并在隐私指引中说明用途。

---

## 开发计划

- [ ] 完善内测反馈与语音链路稳定性  
- [ ] 云函数统一代理 AI 请求，避免 Key 暴露在前端  
- [ ] 扩大服务类目与订单闭环  
- [ ] 评估接入更多大模型（含小米 MiMo 等）做效果对比  

---

## 作者与许可

- **开发者**：hummerge   

如有问题或合作意向，欢迎通过 GitHub Issues 反馈。

---

<p align="center">智养慧联 — 让科技更懂银发生活</p>
