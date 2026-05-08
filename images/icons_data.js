/**
 * 资源管理中心 - 腾讯云 CDN 版
 *
 * 【配置 CDN 链接】
 * 请将下方 CDN_BASE 替换为您在腾讯云 COS 控制台获取的存储桶访问地址。
 * 格式示例：https://您的存储桶ID.cos.地域.myqcloud.com
 * 或使用已配置 CDN 加速域名的地址。
 */
// ========== 在这里填写您的腾讯云 CDN 地址 ==========
const CDN_BASE = 'https://wxxcx-1413626180.cos.ap-shanghai.myqcloud.com';
// =================================================

/**
 * icons_data 映射说明（JS 中 key 与 腾讯云文件名的对应关系）
 * - 代码中统一使用 下划线 作为 key：icon_escort、banner_cleaning
 * - 腾讯云上的文件名使用 连字符：icon-escort.png、banner-cleaning.png
 * - 以下列表为完整映射，上传到 COS 时请严格按「文件名」命名
 */
const IconData = {
  // === 基础 UI 图标 ===
  'icon_search': `${CDN_BASE}/icon-search.png`,
  'icon_back': `${CDN_BASE}/icon-back.png`,
  'icon_more': `${CDN_BASE}/icon-more.png`,
  'ai_default_avatar': `${CDN_BASE}/ai-default-avatar.png`,

  // === 业务功能图标 ===
  'icon_cleaning': `${CDN_BASE}/icon-cleaning.png`,
  'icon_cooking': `${CDN_BASE}/icon-cooking.png`,
  'icon_delivery': `${CDN_BASE}/icon-delivery.png`,//上门服务
  'icon_escort': `${CDN_BASE}/icon-escort.png`,
  'icon_mail': `${CDN_BASE}/icon-mail.png`,//紧急呼救
  'icon_meal_delivery': `${CDN_BASE}/icon-meal-delivery.png`,//餐饮服务
  'icon_nursing': `${CDN_BASE}/icon-nursing.png`,
  'icon_repair': `${CDN_BASE}/icon-repair.png`,

  // === 首页 Banner & 宣传图 ===
  'home_promo': `${CDN_BASE}/home-promo.png`,
  /** 首页轮播宣传图（按顺序播放，请在 COS 上传同名文件或使用自定义 URL 替换） */
  'home_promo_slides': [
    `${CDN_BASE}/home-promo.png`,
    `${CDN_BASE}/promo-slide-2.png`,
    `${CDN_BASE}/promo-slide-3.png`,
    `${CDN_BASE}/promo-slide-4.png`,
    `${CDN_BASE}/promo-slide-5.png`
  ],
  'banner_cleaning': `${CDN_BASE}/banner-cleaning.png`,
  'banner_cooking': `${CDN_BASE}/banner-cooking.png`,
  'banner_delivery': `${CDN_BASE}/banner-delivery.png`,
  'banner_escort': `${CDN_BASE}/banner-escort.png`,
  'banner_mail': `${CDN_BASE}/banner-mail.png`,
  'banner_meal_delivery': `${CDN_BASE}/banner-meal-delivery.png`,
  'banner_nursing': `${CDN_BASE}/banner-nursing.png`,
  'banner_repair': `${CDN_BASE}/banner-repair.png`,

  // === TabBar 底部导航图标 ===
  'tab_home': `${CDN_BASE}/tab-home.png`,
  'tab_reminder': `${CDN_BASE}/tab-reminder.png`,
  'tab_health': `${CDN_BASE}/tab-health.png`,
  'tab_mine': `${CDN_BASE}/tab-mine.png`,

  // === 其他业务图片 ===
  'img_repair': `${CDN_BASE}/img-repair.png`,
  'img_cleaning': `${CDN_BASE}/img-cleaning.png`
};

module.exports = IconData;
