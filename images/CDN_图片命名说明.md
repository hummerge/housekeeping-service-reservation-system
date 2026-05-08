# 腾讯云 CDN 图片命名说明

将图片上传到腾讯云 COS 后，**必须按以下文件名精确命名**，否则小程序无法正确加载。

## 一、配置 CDN 链接

打开 `images/icons_data.js`，找到第 10 行附近的 `CDN_BASE`，替换为您的腾讯云存储桶访问地址：

```javascript
const CDN_BASE = 'https://您的存储桶ID.cos.地域.myqcloud.com';
```

或使用已配置 CDN 加速的自定义域名。

---

## 二、图标与 Banner 文件名对照表

### 1. 基础 UI 图标

| 腾讯云文件名 | 用途 |
|-------------|------|
| `icon-search.png` | 搜索框图标 |
| `icon-back.png` | 返回按钮 |
| `icon-more.png` | 更多入口 |
| `ai-default-avatar.png` | AI 头像（聊天、提醒等） |

### 2. 业务功能图标

| 腾讯云文件名 | 用途 |
|-------------|------|
| `icon-cleaning.png` | 家庭助洁 |
| `icon-cooking.png` | 上门做餐 |
| `icon-delivery.png` | 送货上门 |
| `icon-escort.png` | 上门陪护 |
| `icon-mail.png` | 邮件寄送 |
| `icon-meal-delivery.png` | 上门送餐 |
| `icon-nursing.png` | 上门护理 |
| `icon-repair.png` | 家电维修 |

### 3. Banner 宣传图（服务详情页大图）

| 腾讯云文件名 | 用途 |
|-------------|------|
| `home-promo.png` | 首页宣传横幅 |
| `banner-cleaning.png` | 家庭助洁 |
| `banner-cooking.png` | 上门做餐 |
| `banner-delivery.png` | 送货上门 |
| `banner-escort.png` | 上门陪护 |
| `banner-mail.png` | 邮件寄送 |
| `banner-meal-delivery.png` | 上门送餐 |
| `banner-nursing.png` | 上门护理 |
| `banner-repair.png` | 家电维修 |

### 4. TabBar 底部导航图标

| 腾讯云文件名 | 用途 |
|-------------|------|
| `tab-home.png` | 首页 |
| `tab-reminder.png` | 提醒 |
| `tab-health.png` | 健康 |
| `tab-mine.png` | 我的 |

### 5. 其他业务图片

| 腾讯云文件名 | 用途 |
|-------------|------|
| `img-repair.png` | 家电维修列表图 |
| `img-cleaning.png` | 家庭助洁列表图 |

---

## 三、命名规则

1. **全部使用小写**
2. **单词之间用连字符 `-`**（如 `icon-search.png`、`banner-meal-delivery.png`）
3. **文件扩展名必须是 `.png`**（如需其他格式需同步修改 `icons_data.js`）
4. **文件名不能有多余空格或特殊字符**

---

## 四、icons_data.js 中的 key 映射

代码中使用的 key（下划线）与腾讯云文件名的对应关系：

- `icon_search` → `icon-search.png`
- `icon_meal_delivery` → `icon-meal-delivery.png`
- `banner_meal_delivery` → `banner-meal-delivery.png`
- `ai_default_avatar` → `ai-default-avatar.png`

**规律**：`icons_data.js` 中 key 用下划线，腾讯云文件名用连字符；key 去掉下划线、替换为连字符即得到文件名。

---

## 五、小程序配置说明

正式上线前，需在 **微信公众平台 → 开发 → 开发管理 → 开发设置 → 服务器域名** 中，将腾讯云 COS 的域名加入 **downloadFile 合法域名**，否则图片可能无法加载。
