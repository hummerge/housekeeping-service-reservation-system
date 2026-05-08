const STORAGE_KEY = 'app_locale';

const CATEGORY_DEF = [
  {
    id: 'medical',
    iconKey: 'icon_escort',
    title: { zh: '医疗陪护', en: 'Medical escort / nursing' },
    children: {
      zh: ['就医随行陪护', '住院看护陪护', '复查随访陪护', '血透治疗陪护'],
      en: [
        'Outpatient escort',
        'Inpatient nursing care',
        'Follow-up visit escort',
        'Hemodialysis escort'
      ]
    }
  },
  {
    id: 'daily',
    iconKey: 'icon_nursing',
    title: { zh: '日常照料陪护', en: 'Daily living care' },
    children: {
      zh: ['起居生活照料', '环境居家照料', '情绪陪伴照料'],
      en: ['Daily routine care', 'Home environment care', 'Emotional companionship']
    }
  },
  {
    id: 'rehab',
    iconKey: 'icon_nursing',
    title: { zh: '康复类陪护', en: 'Rehabilitation care' },
    children: {
      zh: ['术后康复陪护', '运动功能康复陪护', '神经康复陪护', '心理康复陪护'],
      en: [
        'Post-op rehabilitation',
        'Motor function rehab',
        'Neurological rehab',
        'Psychological rehab'
      ]
    }
  },
  {
    id: 'other',
    iconKey: 'icon_more',
    title: { zh: '其他', en: 'Other services' },
    children: [
      { key: 'o-repair', zh: '家电维修', en: 'Appliance repair', path: 'repair', pathType: 'booking' },
      { key: 'o-delivery', zh: '送货上门', en: 'Door-to-door delivery', path: 'delivery', pathType: 'detail' },
      { key: 'o-express', zh: '快递代取', en: 'Parcel pickup', path: 'services', pathType: 'services' },
      { key: 'o-mail', zh: '邮件寄送', en: 'Mail & courier', path: 'mail', pathType: 'detail' },
      { key: 'o-agency', zh: '业务代办', en: 'Errand service', path: 'services', pathType: 'services' },
      { key: 'o-cooking', zh: '上门做餐', en: 'Home cooking', path: 'cooking', pathType: 'booking' }
    ]
  }
];

const BOOKING_BASE = '/subpackage/pkg-service/service-booking/service-booking';
const DETAIL_BASE = '/subpackage/pkg-service/service-detail/service-detail';
const PAGE_SERVICES = '/subpackage/pkg-service/services/services';

function escortUrl(subLabel) {
  return `${BOOKING_BASE}?type=escort&sub=${encodeURIComponent(subLabel)}`;
}

function buildOtherChildUrl(item, loc) {
  const label = loc === 'en' ? item.en : item.zh;
  if (item.pathType === 'booking') {
    return `${BOOKING_BASE}?type=${item.path}&sub=${encodeURIComponent(label)}`;
  }
  if (item.pathType === 'detail') {
    return `${DETAIL_BASE}?type=${item.path}`;
  }
  return PAGE_SERVICES;
}

function buildServiceCategories(IconData) {
  const loc = getLocale();
  const list = [];
  for (const def of CATEGORY_DEF) {
    if (def.id === 'other') {
      list.push({
        id: def.id,
        title: def.title[loc],
        icon: IconData[def.iconKey],
        children: def.children.map((item) => ({
          key: item.key,
          label: loc === 'en' ? item.en : item.zh,
          kind: 'navigateTo',
          url: buildOtherChildUrl(item, loc)
        }))
      });
      continue;
    }
    const labels = def.children[loc];
    list.push({
      id: def.id,
      title: def.title[loc],
      icon: IconData[def.iconKey],
      children: labels.map((label) => ({
        key: `esc-${def.id}-${label}`,
        label,
        kind: 'navigateTo',
        url: escortUrl(label)
      }))
    });
  }
  return list;
}

const FIELD_LABEL_EN = {
  name: 'Contact',
  mobile: 'Mobile',
  address: 'Address',
  time: 'Appointment time',
  duration: 'Duration',
  condition: "Recipient's condition",
  project: 'Care items',
  receiver: 'Recipient details',
  remark: 'Notes',
  meal: 'Meal preference',
  device: 'Appliance type',
  area: 'Home size',
  people: 'Number of diners',
  goods: 'Item type'
};

const FIELD_PLACEHOLDER_EN = {
  name: 'Name',
  mobile: '11-digit mobile number',
  address: 'Full address',
  time: 'e.g. Tomorrow 9:00',
  duration: 'e.g. 4 hours',
  condition: 'Age, mobility, outing needs, etc.',
  project: 'e.g. dressing change, BP check',
  receiver: 'Name, phone, address',
  remark: 'Additional details',
  meal: 'e.g. senior meal, low salt',
  device: 'e.g. AC, fridge',
  area: 'e.g. 89㎡',
  people: 'e.g. 3',
  goods: 'e.g. groceries, documents'
};

const BOOKING_TYPE_META_EN = {
  escort: {
    name: 'Home escort',
    price: '¥80–200 / visit',
    placeholder: "Fill in the care recipient's situation and duration"
  },
  nursing: {
    name: 'Home nursing',
    price: '¥120–300 / visit',
    placeholder: 'Describe nursing items and recipient condition'
  },
  mail: {
    name: 'Mail service',
    price: '¥20–60 / visit',
    placeholder: 'Sender, pickup and delivery details'
  },
  mealDelivery: {
    name: 'Meal delivery',
    price: '¥30–88 / visit',
    placeholder: 'Meal type and delivery time'
  },
  repair: {
    name: 'Appliance repair',
    price: '¥20–60 / visit',
    placeholder: 'Appliance type and fault description'
  },
  cleaning: {
    name: 'Home cleaning',
    price: '¥30–80 / visit',
    placeholder: 'Area and cleaning needs'
  },
  cooking: {
    name: 'Home cooking',
    price: '¥88–188 / visit',
    placeholder: 'Headcount and dietary preferences'
  },
  delivery: {
    name: 'Delivery',
    price: '¥18–50 / visit',
    placeholder: 'What to deliver and when'
  }
};

function translateBookingFields(fields, locale) {
  if (locale !== 'en' || !fields) return fields;
  return fields.map((f) => ({
    ...f,
    label: FIELD_LABEL_EN[f.key] || f.label,
    placeholder: FIELD_PLACEHOLDER_EN[f.key] || f.placeholder
  }));
}

function localizeBookingService(type, baseService, subTitle, locale) {
  if (!baseService) return null;
  let name = baseService.name;
  let placeholder = baseService.placeholder;
  if (subTitle) {
    name = subTitle;
    if (locale === 'zh') {
      placeholder = `请填写「${subTitle}」服务对象情况、服务时长等`;
    } else if (type === 'escort') {
      placeholder = `Describe care recipient, duration, etc. for: ${subTitle}`;
    } else {
      placeholder = `Please fill in details for: ${subTitle}`;
    }
  }
  if (locale === 'en') {
    const meta = BOOKING_TYPE_META_EN[type];
    if (meta && !subTitle) {
      name = meta.name;
      placeholder = meta.placeholder;
    }
    return {
      ...baseService,
      name,
      placeholder,
      fields: translateBookingFields(baseService.fields, 'en')
    };
  }
  return {
    ...baseService,
    name,
    placeholder,
    fields: baseService.fields
  };
}

function getLocale() {
  try {
    const app = getApp();
    if (app && app.globalData && (app.globalData.locale === 'en' || app.globalData.locale === 'zh')) {
      return app.globalData.locale;
    }
  } catch (e) {
    // getApp may be unavailable during module load
  }
  try {
    const s = wx.getStorageSync(STORAGE_KEY);
    return s === 'en' ? 'en' : 'zh';
  } catch (e) {
    return 'zh';
  }
}

function setLocale(loc) {
  const v = loc === 'en' ? 'en' : 'zh';
  try {
    wx.setStorageSync(STORAGE_KEY, v);
  } catch (e) {}
  try {
    const app = getApp();
    if (app) app.globalData.locale = v;
  } catch (e) {}
}

function getHomeStrings(locale) {
  const zh = locale !== 'en';
  return {
    navTitle: zh ? '智养慧联' : 'Smart Care Link',
    searchPlaceholder: zh ? '搜索上门服务' : 'Search home services',
    searchEmpty: zh ? '未找到相关服务' : 'No matching services',
    serviceModalEntry: zh ? '服务分类' : 'Service menu',
    sectionMap: zh ? '附近线下活动地点' : 'Nearby offline venues',
    mapFallbackTitle: zh ? '线下活动地点' : 'Venue',
    mapAddrHint: zh ? '请在 markers 数据里配置活动地点 address/经纬度' : 'Configure venue address/coordinates in markers data',
    mapDistanceYou: zh ? '距离你' : 'Distance',
    tabHome: zh ? '首页' : 'Home',
    tabReminder: zh ? '提醒' : 'Alerts',
    tabHealth: zh ? '健康' : 'Health',
    tabMine: zh ? '我的' : 'Me',
    quickModalEmpty: zh ? '暂无可用内容' : 'No items',
    mapStatusDenied: zh ? '未开启定位权限，无法计算距离（可在设置中开启）' : 'Location off — distance unavailable',
    mapStatusFail: zh ? '定位失败：请检查系统定位服务是否开启' : 'Location failed — check system settings',
    mapStatusSetting: zh ? '无法获取定位权限状态' : 'Cannot read location permission',
    mapLocating: zh ? '正在获取定位…' : 'Getting location…',
    phoneModalTitle: zh ? '拨打确认' : 'Call confirm',
    phoneModalContent: zh ? '是否拨打' : 'Call',
    phoneModalConfirm: zh ? '拨打' : 'Call',
    phoneModalCancel: zh ? '取消' : 'Cancel',
  };
}

function buildAllServicesForSearch(IconData, locale) {
  const zh = locale !== 'en';
  const cat1 = zh ? '快捷入口' : 'Shortcuts';
  const cat2 = zh ? '上门服务' : 'On-site services';
  return [
    {
      type: 'healthMonitor',
      name: zh ? '健康监测' : 'Health monitoring',
      icon: IconData.icon_nursing,
      category: cat1,
      pageKind: 'reLaunch',
      relaunchUrl: '/subpackage/pkg-feature/health-monitor/health-monitor'
    },
    {
      type: 'emergency',
      name: zh ? '紧急呼救' : 'Emergency',
      icon: IconData.icon_mail,
      category: cat1,
      pageKind: 'navigateTo',
      url: '/subpackage/pkg-feature/emergency/emergency'
    },
    {
      type: 'escort',
      name: zh ? '上门陪护' : 'Home escort',
      icon: IconData.icon_escort,
      category: cat2,
      pageKind: 'navigateTo',
      url: '/subpackage/pkg-service/service-detail/service-detail?type=escort'
    },
    {
      type: 'nursing',
      name: zh ? '上门护理' : 'Home nursing',
      icon: IconData.icon_nursing,
      category: cat2,
      pageKind: 'navigateTo',
      url: '/subpackage/pkg-service/service-detail/service-detail?type=nursing'
    },
    {
      type: 'mealDelivery',
      name: zh ? '上门送餐' : 'Meal delivery',
      icon: IconData.icon_meal_delivery,
      category: cat2,
      pageKind: 'navigateTo',
      url: '/subpackage/pkg-service/service-booking/service-booking?type=cooking'
    },
    {
      type: 'repair',
      name: zh ? '家电维修' : 'Appliance repair',
      icon: IconData.icon_repair,
      category: cat2,
      pageKind: 'navigateTo',
      url: '/subpackage/pkg-service/service-booking/service-booking?type=repair'
    },
    {
      type: 'cleaning',
      name: zh ? '家庭助洁' : 'Home cleaning',
      icon: IconData.icon_cleaning,
      category: cat2,
      pageKind: 'navigateTo',
      url: '/subpackage/pkg-service/service-booking/service-booking?type=cleaning'
    },
    {
      type: 'cooking',
      name: zh ? '上门做餐' : 'Home cooking',
      icon: IconData.icon_meal_delivery,
      category: cat2,
      pageKind: 'navigateTo',
      url: '/subpackage/pkg-service/service-booking/service-booking?type=cooking'
    },
    {
      type: 'delivery',
      name: zh ? '送货上门' : 'Delivery',
      icon: IconData.icon_delivery,
      category: cat2,
      pageKind: 'navigateTo',
      url: '/subpackage/pkg-service/service-detail/service-detail?type=delivery'
    },
    {
      type: 'mail',
      name: zh ? '邮件寄送' : 'Mail service',
      icon: IconData.icon_mail,
      category: cat2,
      pageKind: 'navigateTo',
      url: '/subpackage/pkg-service/service-detail/service-detail?type=mail'
    },
    {
      type: 'services',
      name: zh ? '全部服务' : 'All services',
      icon: IconData.icon_more,
      category: cat1,
      pageKind: 'navigateTo',
      url: '/subpackage/pkg-service/services/services'
    }
  ];
}

function getMinePage(locale) {
  const zh = locale !== 'en';
  return {
    navTitle: zh ? '我的' : 'Profile',
    profileName: zh ? '微信用户' : 'WeChat user',
    profileSub: zh ? '后续可接入手机号、昵称、家庭成员信息' : 'Phone, nickname and family can be linked later',
    groups: [
      {
        title: zh ? '我的服务' : 'My services',
        items: [
          { name: zh ? '我的订单' : 'My orders', action: 'orders' },
          { name: zh ? '常用地址' : 'Saved addresses', action: 'comingSoon' },
          { name: zh ? '常用联系人' : 'Contacts', action: 'comingSoon' }
        ]
      },
      {
        title: zh ? '帮助与支持' : 'Help',
        items: [
          { name: zh ? '联系客服' : 'Customer service', action: 'contact' },
          { name: zh ? '意见反馈' : 'Feedback', action: 'comingSoon' },
          { name: zh ? '关于我们' : 'About', action: 'comingSoon' }
        ]
      }
    ],
    toastSoon: zh ? '该功能即将上线' : 'Coming soon',
    toastContactTitle: zh ? '拨打客服' : 'Call customer service',
    toastContactContent: zh ? '是否拨打客服热线？' : 'Call customer service hotline?',
    toastContactConfirm: zh ? '拨打' : 'Call',
    toastContactCancel: zh ? '取消' : 'Cancel'
  };
}

function getTabs(locale) {
  const zh = locale !== 'en';
  return {
    home: zh ? '首页' : 'Home',
    reminder: zh ? '提醒' : 'Alerts',
    health: zh ? '健康' : 'Health',
    mine: zh ? '我的' : 'Me'
  };
}

function getReminderPage(locale) {
  const zh = locale !== 'en';
  return {
    navTitle: zh ? '提醒' : 'Reminders',
    summaryL1: zh ? '今日提醒' : 'Today',
    summaryL2: zh ? '待完成' : 'Pending',
    summaryL3: zh ? '已完成' : 'Done',
    sectionRoutine: zh ? '日常作息提醒' : 'Daily routine',
    sectionRoutineSub: zh ? '可用于起床、饮水、散步、睡眠和用药提醒' : 'Wake-up, water, walk, sleep, medication',
    sectionMarkAll: zh ? '全完成' : 'Mark all done',
    sectionWeather: zh ? '天气预报与预警提醒' : 'Weather alerts',
    sectionWeatherSub: zh ? '根据天气变化提供出行、穿衣与健康建议' : 'Outfit and health tips by weather',
    done: zh ? '已完成' : 'Done',
    pending: zh ? '待提醒' : 'Pending',
    markComplete: zh ? '标记完成' : 'Complete',
    tabs: getTabs(locale)
  };
}

function getServicesPage(locale) {
  const zh = locale !== 'en';
  return {
    navTitle: zh ? '上门服务' : 'On-site services',
    bookBtn: zh ? '预约' : 'Book',
    priceLabel: zh ? '价格：' : 'Price: ¥',
    tabs: getTabs(locale),
    services: [
      { type: 'escort', name: zh ? '上门陪护' : 'Home escort', iconKey: 'icon_escort', bgColor: '#FDF4F5' },
      { type: 'nursing', name: zh ? '上门护理' : 'Home nursing', iconKey: 'icon_nursing', bgColor: '#F4E8EE' },
      { type: 'mail', name: zh ? '邮件寄送' : 'Mail service', iconKey: 'icon_mail', bgColor: '#F8EDF3' },
      { type: 'mealDelivery', name: zh ? '上门送餐' : 'Meal delivery', iconKey: 'icon_meal_delivery', bgColor: '#FDF4F5' },
      { type: 'repair', name: zh ? '家电维修' : 'Appliance repair', iconKey: 'icon_repair', bgColor: '#FCF4ED' },
      { type: 'cleaning', name: zh ? '家庭助洁' : 'Home cleaning', iconKey: 'icon_cleaning', bgColor: '#FDF4F5' },
      { type: 'cooking', name: zh ? '上门做餐' : 'Home cooking', iconKey: 'icon_cooking', bgColor: '#FDF4F5' },
      { type: 'delivery', name: zh ? '送货上门' : 'Delivery', iconKey: 'icon_delivery', bgColor: '#ECF6F3' },
      { type: 'more', name: zh ? '更多' : 'More', iconKey: 'icon_more', bgColor: '#EAF4F2' }
    ],
    featuredServices: [
      {
        type: 'repair',
        title: zh ? '上门家电维修' : 'On-site appliance repair',
        price: '20～60',
        desc: zh ? '专业人士上门维修' : 'Professional repair visit',
        imageKey: 'img_repair'
      },
      {
        type: 'cleaning',
        title: zh ? '家庭助洁' : 'Home cleaning',
        price: '30～80',
        desc: zh ? '提供全屋大扫除服务' : 'Whole-home deep cleaning',
        imageKey: 'img_cleaning'
      }
    ]
  };
}

function getChatPage(locale) {
  const zh = locale !== 'en';
  return {
    navTitle: zh ? 'AI健康助手' : 'AI Health Assistant',
    navSubtitle: zh ? '在线 · 随时为您服务' : 'Online · Here to help',
    welcomeGreeting: zh ? '您好，我是您的AI健康助手' : 'Hello, I am your AI health assistant',
    welcomeDesc: zh
      ? '可以打字输入，也可以长按下方麦克风说话。\nAI回复后点击右上方小喇叭可以朗读给您听。'
      : 'Type a message or hold the mic to speak.\nTap the speaker on AI replies to hear them aloud.',
    inputPlaceholder: zh ? '请输入您的问题，或长按麦克风说话…' : 'Ask a question or hold the mic…',
    send: zh ? '发送' : 'Send',
    typing: zh ? '正在输入' : 'Typing…',
    tipHold: zh ? '按住说话' : 'Hold to talk',
    tipRecording: zh ? '正在录音…' : 'Recording…',
    tipRecognizing: zh ? '识别中…' : 'Recognizing…',
    chip1: zh ? '今天适合做什么运动？' : 'What exercise fits today?',
    chip2: zh ? '最近天气如何，要注意什么？' : 'How is the weather? Any tips?',
    chip3: zh ? '如何改善睡眠质量？' : 'How to sleep better?',
    chip4: zh ? '老年人饮食有什么建议？' : 'Diet tips for seniors?',
    dispatchHintTpl: zh ? '是否需要我帮您转到「{{name}}」预约？' : 'Open booking for "{{name}}"? Tap here.',
    dispatchConfirmTitle: zh ? '跳转预约' : 'Open booking',
    dispatchConfirmContent: zh ? '将打开预约页面，填写信息后即可提交。' : 'You will open the booking form.',
    dispatchConfirmOk: zh ? '去预约' : 'Continue',
    dispatchConfirmCancel: zh ? '取消' : 'Cancel',
    chatDisclaimer: zh
      ? '温馨提示：回复仅供健康科普与就医参考，不能替代医生诊断；不适请及时就医，急症请拨打120。'
      : 'For general wellness info only—not a medical diagnosis. See a doctor for concerns; call emergency services if urgent.'
  };
}

function getOrderSuccessPage(locale) {
  const zh = locale !== 'en';
  return {
    navTitle: zh ? '预约成功' : 'Booking received',
    successTitle: zh ? '预约提交成功' : 'Request submitted',
    successDesc: zh ? '工作人员会尽快联系您，请保持电话畅通。' : 'Our team will call you soon. Please keep your phone on.',
    labelOrderId: zh ? '订单编号' : 'Order no.',
    labelService: zh ? '服务项目' : 'Service',
    labelPrice: zh ? '参考价格' : 'Price range',
    labelStatus: zh ? '预约状态' : 'Status',
    labelTime: zh ? '预约时间' : 'Preferred time',
    labelContact: zh ? '联系人' : 'Contact',
    labelAddress: zh ? '服务地址' : 'Address',
    labelCreated: zh ? '提交时间' : 'Submitted at',
    btnDetail: zh ? '查看订单详情' : 'View details',
    btnList: zh ? '查看我的订单' : 'My orders',
    btnHome: zh ? '返回首页' : 'Home'
  };
}

function getBookingPageUI(locale) {
  const zh = locale !== 'en';
  return {
    navTitle: zh ? '预约下单' : 'Book service',
    submit: zh ? '提交预约' : 'Submit',
    noticeTitle: zh ? '提交说明' : 'Note',
    noticeText: zh
      ? '当前为预约登记页，提交后由工作人员人工确认订单并安排服务人员。'
      : 'This is a booking request. Staff will confirm and assign a provider.',
    toastFill: zh ? '请先填写姓名、电话、地址和时间' : 'Please fill name, phone, address and time',
    toastPhone: zh ? '请输入正确的11位手机号' : 'Enter a valid 11-digit mobile number'
  };
}

function mapIconDataServices(bundle, IconData) {
  const services = (bundle.services || []).map((s) => ({
    type: s.type,
    name: s.name,
    icon: IconData[s.iconKey],
    bgColor: s.bgColor
  }));
  const featuredServices = (bundle.featuredServices || []).map((f) => ({
    type: f.type,
    title: f.title,
    price: f.price,
    desc: f.desc,
    image: IconData[f.imageKey]
  }));
  return { services, featuredServices };
}

module.exports = {
  CATEGORY_DEF,
  mapIconDataServices,
  STORAGE_KEY,
  getLocale,
  setLocale,
  buildServiceCategories,
  getHomeStrings,
  buildAllServicesForSearch,
  localizeBookingService,
  getMinePage,
  getTabs,
  getReminderPage,
  getServicesPage,
  getBookingPageUI,
  getChatPage,
  getOrderSuccessPage
};
