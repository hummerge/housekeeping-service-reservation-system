Page({
  data: {
    categories: [
      {
        title: '生活照护',
        items: [
          { type: 'escort', name: '上门陪护' },
          { type: 'nursing', name: '上门护理' }
        ]
      },
      {
        title: '便民跑腿',
        items: [
          { type: 'mail', name: '邮件寄送' },
          { type: 'delivery', name: '送货上门' }
        ]
      },
      {
        title: '居家服务',
        items: [
          { type: 'mealDelivery', name: '上门送餐' },
          { type: 'repair', name: '家电维修' },
          { type: 'cleaning', name: '家庭助洁' },
          { type: 'cooking', name: '上门做餐' }
        ]
      }
    ]
  },

  goBack() {
    wx.navigateBack({
      fail() {
        wx.reLaunch({ url: '/subpackage/pkg-service/services/services' });
      }
    });
  },

  goDetail(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({ url: '/subpackage/pkg-service/service-detail/service-detail?type=' + type });
  }
});