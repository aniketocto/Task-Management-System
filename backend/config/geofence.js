const OFFICE_LAT = process.env.OFFICE_LAT;
const OFFICE_LNG = process.env.OFFICE_LNG;
const OFFICE_RADIUS_METERS = process.env.OFFICE_RADIUS_METERS;

// Haversine formula to compute distance in meters
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};



module.exports = {
  OFFICE_LAT,
  OFFICE_LNG,
  OFFICE_RADIUS_METERS,
  getDistanceMeters,
};
