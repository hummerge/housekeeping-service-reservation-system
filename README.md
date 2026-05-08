# 🏠 家政/客房清洁服务预订系统 (Housekeeping Service Reservation System)

![WeChat](https://img.shields.io/badge/Platform-WeChat_Mini_Program-07C160?logo=wechat)
![Cloud](https://img.shields.io/badge/Backend-WeChat_CloudBase-blue)
![License](https://img.shields.io/badge/License-MIT-green)

这是一个类似京东服务体系的**家政与客房清洁服务预订**微信小程序。本项目提供了一站式的服务浏览、在线预约、订单管理体验，旨在为用户提供便捷的家政服务聚合平台。

## ✨ 核心特性 (Key Features)

- 🛒 **京东式服务体验**：清晰的服务分类、详细的服务介绍与便捷的加购/预约流程。
- ☁️ **Serverless 云开发**：采用微信云开发（云函数、云数据库、云存储），无需自行搭建和维护传统后端服务器。
- 🌐 **多语言支持 (i18n)**：内置中英双语切换功能（基于本地缓存 `wx.getStorageSync`），满足不同用户群体的需求。
- 📦 **分包加载优化**：采用主包+子包的架构设计，大幅提升小程序首次加载与启动速度。
- 🛠️ **组件化与 npm 生态**：引入了外部 npm 包（`miniprogram_npm`），提升开发效率与界面美观度。

## 📂 项目结构 (Project Structure)

```text
├── 云函数/               # 云开发后端逻辑（数据库操作、支付接口等）
├── 页面/                 # 小程序主包页面（首页、分类、购物车、个人中心等）
├── 子包/                 # 小程序分包页面（订单详情、地址管理等，优化性能）
├── 图片/                 # 静态图片资源
├── 工具/                 # 公共工具类函数、全局配置等
├── miniprogram_npm/      # 构建后的 npm 依赖包
├── app.js                # 小程序全局入口（包含多语言初始化与云开发环境挂载）
├── app.json              # 小程序全局配置（路由、导航栏、分包配置等）
├── app.wxss              # 全局样式表
└── project.config.json   # 微信开发者工具项目配置
