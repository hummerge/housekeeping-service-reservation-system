Page({
  data: {
    actions: [
      { name: '快速预约家电维修', url: '/subpackage/pkg-service/service-booking/service-booking?type=repair' },
      { name: '快速预约家庭助洁', url: '/subpackage/pkg-service/service-booking/service-booking?type=cleaning' },
      { name: '查看全部服务', url: '/subpackage/pkg-service/all-services/all-services' }
    ]
  },

  goAction(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },

  callService() {
    wx.showToast({ title: '后续可接入客服热线', icon: 'none' });
  }
});