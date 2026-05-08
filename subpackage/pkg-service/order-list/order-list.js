const tabs = [
  { key: 'all', name: '全部' },
  { key: 'pending', name: '待确认' },
  { key: 'confirmed', name: '待上门' },
  { key: 'serving', name: '服务中' },
  { key: 'completed', name: '已完成' },
  { key: 'cancelled', name: '已取消' }
];

Page({
  data: {
    tabs,
    activeTab: 'all',
    orderList: [],
    filteredList: []
  },

  onShow() {
    this.loadOrders();
  },

  loadOrders() {
    const orderList = wx.getStorageSync('orderList') || [];
    this.setData({ orderList }, () => {
      this.filterOrders();
    });
  },

  filterOrders() {
    const { activeTab, orderList } = this.data;
    const filteredList = activeTab === 'all'
      ? orderList
      : orderList.filter(item => item.statusCode === activeTab);
    this.setData({ filteredList });
  },

  switchTab(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ activeTab: key }, () => {
      this.filterOrders();
    });
  },

  goBack() {
    wx.navigateBack({
      fail() {
        wx.reLaunch({ url: '/subpackage/pkg-feature/mine/mine' });
      }
    });
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: '/subpackage/pkg-service/order-detail/order-detail?id=' + id
    });
  },

  goBooking() {
    wx.reLaunch({ url: '/subpackage/pkg-service/services/services' });
  },

  contactService() {
    wx.showToast({ title: '客服功能后续接入', icon: 'none' });
  },

  cancelOrder(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '取消订单',
      content: '确认取消该订单吗？',
      success: (res) => {
        if (!res.confirm) return;
        const orderList = (wx.getStorageSync('orderList') || []).map(item => {
          if (item.id !== id) return item;
          return {
            ...item,
            statusCode: 'cancelled',
            status: '已取消',
            statusText: '订单已取消',
            updateTime: this.getCurrentTimeText()
          };
        });
        wx.setStorageSync('orderList', orderList);
        this.loadOrders();
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