/**
 * AI 聊天意图分发：白名单子类与预约 URL，与 i18n CATEGORY_DEF 保持一致。
 */
const { CATEGORY_DEF } = require('./i18n.js');

const BOOKING_BASE = '/subpackage/pkg-service/service-booking/service-booking';
const DETAIL_BASE = '/subpackage/pkg-service/service-detail/service-detail';
const PAGE_SERVICES = '/subpackage/pkg-service/services/services';

function escortUrl(label) {
  return `${BOOKING_BASE}?type=escort&sub=${encodeURIComponent(label)}`;
}

function urlForOther(item, loc) {
  const label = loc === 'en' ? item.en : item.zh;
  if (item.pathType === 'booking') {
    return `${BOOKING_BASE}?type=${item.path}&sub=${encodeURIComponent(label)}`;
  }
  if (item.pathType === 'detail') {
    return `${DETAIL_BASE}?type=${item.path}`;
  }
  return PAGE_SERVICES;
}

function normalize(s) {
  return (s == null ? '' : String(s)).trim();
}

/**
 * @param {{ sub_zh?: string, sub_en?: string }} raw — 模型返回的 dispatch 对象
 * @param {'zh'|'en'} locale
 * @returns {{ url: string, displayLabel: string } | null}
 */
function resolveDispatch(raw, locale) {
  if (!raw || typeof raw !== 'object') return null;
  const subZh = normalize(raw.sub_zh);
  const subEn = normalize(raw.sub_en);
  const loc = locale === 'en' ? 'en' : 'zh';

  for (const def of CATEGORY_DEF) {
    if (def.id === 'other') {
      for (const item of def.children) {
        if (subZh && item.zh === subZh) {
          return {
            displayLabel: loc === 'en' ? item.en : item.zh,
            url: urlForOther(item, loc)
          };
        }
        if (subEn && item.en === subEn) {
          return {
            displayLabel: loc === 'en' ? item.en : item.zh,
            url: urlForOther(item, loc)
          };
        }
      }
    } else {
      const zhArr = def.children.zh;
      const enArr = def.children.en;
      for (let i = 0; i < zhArr.length; i++) {
        if (subZh && zhArr[i] === subZh) {
          const label = loc === 'en' ? enArr[i] : zhArr[i];
          return { displayLabel: loc === 'en' ? enArr[i] : zhArr[i], url: escortUrl(label) };
        }
        if (subEn && enArr[i] === subEn) {
          const label = loc === 'en' ? enArr[i] : zhArr[i];
          return { displayLabel: loc === 'en' ? enArr[i] : zhArr[i], url: escortUrl(label) };
        }
      }
    }
  }
  return null;
}

function stripAndParseJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  try {
    return JSON.parse(t);
  } catch (e) {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch (e2) {
        return null;
      }
    }
  }
  return null;
}

/**
 * 解析模型返回：仅 JSON 有效时拆分 user_reply / dispatch，否则整段为 user_reply。
 */
function parseAiPayload(raw) {
  const obj = stripAndParseJson(raw);
  if (obj && typeof obj === 'object' && typeof obj.user_reply === 'string') {
    const dispatch =
      obj.dispatch != null && typeof obj.dispatch === 'object' && !Array.isArray(obj.dispatch)
        ? obj.dispatch
        : null;
    return { user_reply: obj.user_reply.trim() || raw, dispatch };
  }
  return { user_reply: typeof raw === 'string' ? raw : String(raw || ''), dispatch: null };
}

/** 写入 system 提示词的白名单子类列表（sub_zh / sub_en） */
function getWhitelistForPrompt() {
  const lines = [];
  for (const def of CATEGORY_DEF) {
    if (def.id === 'other') {
      for (const item of def.children) {
        lines.push(`- sub_zh: "${item.zh}" | sub_en: "${item.en}"`);
      }
    } else {
      for (let i = 0; i < def.children.zh.length; i++) {
        lines.push(`- sub_zh: "${def.children.zh[i]}" | sub_en: "${def.children.en[i]}"`);
      }
    }
  }
  return lines.join('\n');
}

module.exports = {
  resolveDispatch,
  parseAiPayload,
  getWhitelistForPrompt
};
