const { TENCENT_MAP_KEY } = require('./config');

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(from, to) {
  const R = 6378137;
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLat = lat2 - lat1;
  const dLng = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters) {
  if (meters == null || Number.isNaN(Number(meters))) return '';
  const m = Number(meters);
  if (m < 1000) return `${Math.round(m)} m`;
  const km = m / 1000;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

function hasKey() {
  return typeof TENCENT_MAP_KEY === 'string' && TENCENT_MAP_KEY.trim().length > 0;
}

/**
 * 优先使用腾讯地图距离接口（可返回步行等路线距离）；没有 key 时回退直线距离。
 * @param {{ latitude:number, longitude:number }} from
 * @param {{ latitude:number, longitude:number }} to
 * @param {'walking'|'driving'|'bicycling'} mode
 * @returns {Promise<{ meters:number, source:'tencent'|'haversine' }>}
 */
function getDistanceMeters(from, to, mode = 'walking') {
  if (!from || !to) return Promise.resolve({ meters: NaN, source: 'haversine' });
  if (!hasKey()) {
    return Promise.resolve({ meters: haversineMeters(from, to), source: 'haversine' });
  }

  const url = 'https://apis.map.qq.com/ws/distance/v1/';
  return new Promise((resolve) => {
    wx.request({
      url,
      method: 'GET',
      data: {
        mode,
        from: `${from.latitude},${from.longitude}`,
        to: `${to.latitude},${to.longitude}`,
        key: TENCENT_MAP_KEY.trim()
      },
      success(res) {
        const result = res && res.data;
        const first = result && result.result && result.result.elements && result.result.elements[0];
        const meters = first && typeof first.distance === 'number' ? first.distance : NaN;
        if (!Number.isNaN(meters)) {
          resolve({ meters, source: 'tencent' });
          return;
        }
        resolve({ meters: haversineMeters(from, to), source: 'haversine' });
      },
      fail() {
        resolve({ meters: haversineMeters(from, to), source: 'haversine' });
      }
    });
  });
}

module.exports = {
  haversineMeters,
  formatDistance,
  getDistanceMeters,
  hasKey
};

