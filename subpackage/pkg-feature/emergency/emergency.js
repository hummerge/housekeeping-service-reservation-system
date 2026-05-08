Page({
  onCallTap(e) {
    const phoneNumber = e && e.currentTarget && e.currentTarget.dataset
      ? e.currentTarget.dataset.phoneNumber
      : '';
    const num = phoneNumber ? String(phoneNumber) : '';
    if (!num) return;

    // 直接拉起手机拨号，并自动填入号码
    wx.makePhoneCall({ phoneNumber: num });
  }
});

