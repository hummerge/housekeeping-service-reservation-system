Page({
  data: {
    order: null
  },

  onLoad(options) {
    const id = options.id || '';
    this.orderId = id;
    this.loadOrder(id);
  },

  onShow() {
    if (this.orderId) {
      this.loadOrder(this.orderId);
    }
  },

  loadOrder(id) {
    const orderList = wx.getStorageSync('orderList') || [];
    const order = orderList.find(item => item.id === id) || null;
    this.setData({ order });
  },

  goBack() {
    wx.navigateBack({
      fail() {
        wx.redirectTo({ url: '/subpackage/pkg-service/order-list/order-list' });
      }
    });
  },

  copyOrderNo() {
    const order = this.data.order;
    if (!order) return;
    wx.setClipboardData({
      data: order.id,
      success() {
        wx.showToast({ title: '订单编号已复制', icon: 'none' });
      }
    });
  },

  contactService() {
    wx.showToast({ title: '客服功能后续接入', icon: 'none' });
  },

  bookAgain() {
    const order = this.data.order;
    if (!order) return;
    wx.navigateTo({
      url: '/subpackage/pkg-service/service-booking/service-booking?type=' + order.type
    });
  },

  cancelOrder() {
    const order = this.data.order;
    if (!order) return;
    wx.showModal({
      title: '取消订单',
      content: '确认取消当前订单吗？',
      success: (res) => {
        if (!res.confirm) return;
        const orderList = (wx.getStorageSync('orderList') || []).map(item => {
          if (item.id !== order.id) return item;
          return {
            ...item,
            statusCode: 'cancelled',
            status: '已取消',
            statusText: '订单已取消',
            updateTime: this.getCurrentTimeText()
          };
        });
        wx.setStorageSync('orderList', orderList);
        this.loadOrder(order.id);
        wx.showToast({ title: '订单已取消', icon: 'none' });
      }
    });
  },

  getCurrentTimeText() {
    const date = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }
});