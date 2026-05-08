const i18n = require('../../../utils/i18n.js');

const CUSTOMER_SERVICE_PHONE = '15615842551';

Page({
  data: {
    navTitle: '我的',
    profileName: '',
    profileSub: '',
    groups: [],
    toastSoon: ''
  },

  onShow() {
    this.applyLocale();
  },

  applyLocale() {
    const P = i18n.getMinePage(i18n.getLocale());
    this.setData(P);
  },

  onMenuTap(e) {
    const { action } = e.currentTarget.dataset;
    if (action === 'orders') {
      wx.navigateTo({ url: '/subpackage/pkg-service/order-list/order-list' });
      return;
    }
    if (action === 'contact') {
      const P = i18n.getMinePage(i18n.getLocale());
      wx.showModal({
        title: P.toastContactTitle,
        content: P.toastContactContent + ' ' + CUSTOMER_SERVICE_PHONE + '？',
        confirmText: P.toastContactConfirm,
        cancelText: P.toastContactCancel,
        success: (res) => {
          if (!res.confirm) return;
          wx.makePhoneCall({ phoneNumber: CUSTOMER_SERVICE_PHONE });
        }
      });
      return;
    }
    wx.showToast({ title: this.data.toastSoon, icon: 'none' });
  }
});
