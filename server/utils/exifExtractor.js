const exifr = require('exifr');

// Returns { lat, lng } or null if no GPS data in image
const extractImageGPS = async (filePath) => {
  try {
    const gps = await exifr.gps(filePath);
    if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      return { lat: gps.latitude, lng: gps.longitude };
    }
    return null;
  } catch {
    return null;
  }
};

module.exports = extractImageGPS;
