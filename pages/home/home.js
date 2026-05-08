const { getDistanceMeters, formatDistance } = require('../../utils/tencent-map');
const IconData = require('../../images/icons_data.js');
const i18n = require('../../utils/i18n.js');

Page({
  data: {
    searchQuery: '',
    searchResults: [],
    mapScale: 15,
    mapCenter: {
      latitude: 31.230416,
      longitude: 121.473701
    },
    userLocation: null,
    mapStatusText: '正在获取定位…',
    selectedMarkerId: null,
    selectedActivity: {},
    selectedActivityDistanceText: '',
    // 线下活动地点：后期只要往这里追加即可，markers 会自动生成
    // 注意：要展示/计算距离，请提供 latitude/longitude（GCJ-02）
    activityLocations: [
      {
        id: 1001,
        name: '线下活动地点',
        address: '请配置活动地点地址与经纬度',
        latitude: null,
        longitude: null
      }
    ],
    markers: [],
    aiAvatar: IconData.ai_default_avatar,
    serviceCategories: [],
    expandedCategoryId: '',
    langBtnLabel: '中',
    allServices: [],
    // 首页入口弹窗（左侧大类 -> 右侧子项）
    showQuickModal: false,
    activeQuickKey: '',
    quickModalTitle: '',
    quickModalItems: [],
    // IconData for WXML static images
    IconData: IconData,
    promoSlides: IconData.home_promo_slides && IconData.home_promo_slides.length
      ? IconData.home_promo_slides
      : [IconData.home_promo]
  },

  onLoad() {
    this.applyLocale();
    this.refreshMarkers();
    const first = (this.data.activityLocations || [])[0];
    if (first) {
      this.setSelectedActivityById(first.id);
    }
    this.refreshUserLocation();
  },

  onShow() {
    this.applyLocale();
    this.refreshUserLocation();
  },

  applyLocale() {
    const locale = i18n.getLocale();
    const H = i18n.getHomeStrings(locale);
    const patch = {
      locale,
      langBtnLabel: locale === 'zh' ? '中' : 'ENG',
      serviceCategories: i18n.buildServiceCategories(IconData),
      allServices: i18n.buildAllServicesForSearch(IconData, locale),
      ...H
    };
    this.setData(patch, () => {
      if (this.data.showQuickModal && this.data.activeQuickKey) {
        this.applyModalCategory(this.data.activeQuickKey);
      }
    });
  },

  toggleLocale() {
    const next = i18n.getLocale() === 'zh' ? 'en' : 'zh';
    i18n.setLocale(next);
    this.applyLocale();
    this.refreshUserLocation();
  },

  refreshMarkers() {
    const list = (this.data.activityLocations || [])
      .filter((p) => typeof p.id === 'number')
      .map((p) => {
        const hasCoord = typeof p.latitude === 'number' && typeof p.longitude === 'number';
        return {
          id: p.id,
          title: p.name || '',
          latitude: hasCoord ? p.latitude : this.data.mapCenter.latitude,
          longitude: hasCoord ? p.longitude : this.data.mapCenter.longitude,
          width: 28,
          height: 28,
          callout: {
            content: p.name || '',
            display: 'BYCLICK',
            padding: 6,
            borderRadius: 8
          }
        };
      });
    this.setData({ markers: list });
  },

  setSelectedActivityById(id) {
    const item = (this.data.activityLocations || []).find((p) => p.id === id);
    if (!item) return;
    this.setData({
      selectedMarkerId: id,
      selectedActivity: item
    });
    this.refreshSelectedDistance();
  },

  onMarkerTap(e) {
    const markerId = e && e.detail && e.detail.markerId;
    if (typeof markerId !== 'number') return;
    this.setSelectedActivityById(markerId);
  },

  async refreshSelectedDistance() {
    const user = this.data.userLocation;
    const act = this.data.selectedActivity;
    if (!user || !act || typeof act.latitude !== 'number' || typeof act.longitude !== 'number') {
      this.setData({ selectedActivityDistanceText: '' });
      return;
    }
    const { meters } = await getDistanceMeters(
      { latitude: user.latitude, longitude: user.longitude },
      { latitude: act.latitude, longitude: act.longitude },
      'walking'
    );
    this.setData({ selectedActivityDistanceText: formatDistance(meters) });
  },

  refreshUserLocation() {
    const locale = i18n.getLocale();
    const S = i18n.getHomeStrings(locale);
    wx.getSetting({
      success: (settingRes) => {
        const granted = settingRes && settingRes.authSetting && settingRes.authSetting['scope.userLocation'];
        if (granted === false) {
          this.setData({
            mapStatusText: S.mapStatusDenied
          });
          return;
        }
        wx.getLocation({
          type: 'gcj02',
          isHighAccuracy: true,
          success: (loc) => {
            const userLocation = { latitude: loc.latitude, longitude: loc.longitude };
            this.setData({
              userLocation,
              mapCenter: userLocation,
              mapStatusText: ''
            });
            this.refreshSelectedDistance();
          },
          fail: () => {
            this.setData({
              mapStatusText: S.mapStatusFail
            });
          }
        });
      },
      fail: () => {
        this.setData({
          mapStatusText: S.mapStatusSetting
        });
      }
    });
  },

  onSearchInput(e) {
    const value = (e.detail.value || '').trim();
    if (!value) {
      this.setData({
        searchQuery: '',
        searchResults: []
      });
      return;
    }
    const lower = value.toLowerCase();
    // 去重 map：type 相同的只保留第一条
    const seen = new Set();
    const raw = (this.data.allServices || []).filter((item) => {
      const nameMatch = item.name && item.name.indexOf(value) !== -1;
      if (!nameMatch) return false;
      if (seen.has(item.type)) return false;
      seen.add(item.type);
      return true;
    });
    this.setData({
      searchQuery: value,
      searchResults: raw.slice(0, 8)
    });
  },

  clearSearch() {
    this.setData({
      searchQuery: '',
      searchResults: []
    });
  },

  onResultTap(e) {
    const { pageKind, url, relaunchUrl } = e.currentTarget.dataset;
    if (!pageKind) return;
    // 关闭搜索结果
    this.setData({ searchQuery: '', searchResults: [] }, () => {
      if (pageKind === 'reLaunch' && relaunchUrl) {
        wx.reLaunch({ url: relaunchUrl });
      } else if (url) {
        wx.navigateTo({ url });
      }
    });
  },

  applyModalCategory(categoryId) {
    const cat = (this.data.serviceCategories || []).find((c) => c.id === categoryId);
    if (!cat) return;
    const items = (cat.children || []).map((ch) => ({
      key: ch.key,
      kind: ch.kind,
      label: ch.label,
      url: ch.url || '',
      relaunchUrl: ch.relaunchUrl || ''
    }));
    this.setData({
      activeQuickKey: categoryId,
      quickModalTitle: cat.title,
      quickModalItems: items
    });
  },

  openServiceModal() {
    const cats = this.data.serviceCategories || [];
    if (!cats.length) return;
    this.applyModalCategory(cats[0].id);
    this.setData({ showQuickModal: true });
  },

  onModalCategoryTap(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    this.applyModalCategory(id);
  },

  onCategoryHeaderTap(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    const cur = this.data.expandedCategoryId;
    this.setData({
      expandedCategoryId: cur === id ? '' : id
    });
  },

  runQuickNav(dataset, closeModal) {
    const { kind, phoneNumber, url, relaunchUrl } = dataset;
    if (!kind) return;

    if (kind === 'phone') {
      const num = phoneNumber || '';
      if (!num) return;
      const S = i18n.getHomeStrings(i18n.getLocale());
      wx.showModal({
        title: S.phoneModalTitle,
        content: S.phoneModalContent + ' ' + num + '？',
        confirmText: S.phoneModalConfirm,
        cancelText: S.phoneModalCancel,
        success: (res) => {
          if (!res.confirm) return;
          if (closeModal) this.setData({ showQuickModal: false });
          wx.makePhoneCall({ phoneNumber: num });
        }
      });
      return;
    }

    const after = () => {
      if (kind === 'navigateTo') {
        if (!url) return;
        wx.navigateTo({ url });
        return;
      }
      if (kind === 'reLaunch') {
        if (!relaunchUrl) return;
        wx.reLaunch({ url: relaunchUrl });
      }
    };

    if (closeModal) {
      this.setData({ showQuickModal: false }, after);
    } else {
      after();
    }
  },

  onCategoryChildTap(e) {
    this.runQuickNav(e.currentTarget.dataset, false);
  },

  closeQuickModal() {
    this.setData({ showQuickModal: false });
  },

  stopQuickModalTap() {
    // catchtap：阻止 mask 的点击事件冒泡
  },

  onQuickModalItemTap(e) {
    this.runQuickNav(e.currentTarget.dataset, true);
  },

  switchTabPage(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;
    if (url === '/pages/home/home') return;
    wx.reLaunch({ url });
  },

  goToChat() {
    wx.reLaunch({ url: '/subpackage/pkg-feature/chat/chat' });
  }
});

