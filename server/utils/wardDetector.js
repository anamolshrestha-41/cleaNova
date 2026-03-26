const https = require('https');

// Kathmandu ward centres — fallback for point-in-polygon when Nominatim doesn't return a ward
const KTM_WARDS = [
  { ward: 1,  lat: 27.7172, lng: 85.3240 }, { ward: 2,  lat: 27.7195, lng: 85.3175 },
  { ward: 3,  lat: 27.7210, lng: 85.3100 }, { ward: 4,  lat: 27.7230, lng: 85.3050 },
  { ward: 5,  lat: 27.7260, lng: 85.2990 }, { ward: 6,  lat: 27.7290, lng: 85.3060 },
  { ward: 7,  lat: 27.7315, lng: 85.3130 }, { ward: 8,  lat: 27.7340, lng: 85.3200 },
  { ward: 9,  lat: 27.7360, lng: 85.3270 }, { ward: 10, lat: 27.7380, lng: 85.3340 },
  { ward: 11, lat: 27.7050, lng: 85.3150 }, { ward: 12, lat: 27.7080, lng: 85.3220 },
  { ward: 13, lat: 27.7100, lng: 85.3290 }, { ward: 14, lat: 27.7120, lng: 85.3360 },
  { ward: 15, lat: 27.7140, lng: 85.3430 }, { ward: 16, lat: 27.7000, lng: 85.3310 },
  { ward: 17, lat: 27.6970, lng: 85.3380 }, { ward: 18, lat: 27.6940, lng: 85.3450 },
  { ward: 19, lat: 27.6910, lng: 85.3520 }, { ward: 20, lat: 27.6880, lng: 85.3590 },
  { ward: 21, lat: 27.7160, lng: 85.3500 }, { ward: 22, lat: 27.7180, lng: 85.3570 },
  { ward: 23, lat: 27.7200, lng: 85.3640 }, { ward: 24, lat: 27.7220, lng: 85.3710 },
  { ward: 25, lat: 27.7240, lng: 85.3780 }, { ward: 26, lat: 27.7050, lng: 85.3600 },
  { ward: 27, lat: 27.7020, lng: 85.3670 }, { ward: 28, lat: 27.6990, lng: 85.3740 },
  { ward: 29, lat: 27.6960, lng: 85.3810 }, { ward: 30, lat: 27.6930, lng: 85.3880 },
  { ward: 31, lat: 27.7300, lng: 85.3400 }, { ward: 32, lat: 27.7320, lng: 85.3470 },
];

// Nearest ward centre by Euclidean distance (fallback)
const nearestWard = (lat, lng) => {
  let best = null, bestDist = Infinity;
  for (const w of KTM_WARDS) {
    const d = (w.lat - lat) ** 2 + (w.lng - lng) ** 2;
    if (d < bestDist) { bestDist = d; best = w.ward; }
  }
  return best;
};

// Nominatim reverse geocode — returns ward number or null
const reverseGeocode = (lat, lng) =>
  new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=16`;
    const req = https.get(url, { headers: { 'User-Agent': 'CleaNova/1.0 (hackathon project)' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const addr = json.address || {};
          const candidates = [
            addr.quarter,
            addr.suburb,
            addr.neighbourhood,
            addr.city_district,
            addr.county,
            addr.state_district,
            json.display_name,
          ];
          for (const c of candidates) {
            if (!c) continue;
            const match =
              c.match(/ward\s*(?:no\.?\s*)?(\d+)/i) ||
              c.match(/\bw(\d+)\b/i) ||
              c.match(/\u0935\u0921\u093e\s*(?:\u0928\u0902\.?\s*)?(\d+)/);
            if (match) {
              const n = parseInt(match[1]);
              if (n >= 1 && n <= 32) return resolve(n);
            }
          }
          resolve(null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(2000, () => { req.destroy(); resolve(null); });
  });

// Main export: tries Nominatim first, falls back to nearest ward centre
const detectWard = async (lat, lng) => {
  const fromNominatim = await reverseGeocode(lat, lng);
  if (fromNominatim) return fromNominatim;
  return nearestWard(lat, lng);
};

module.exports = detectWard;
