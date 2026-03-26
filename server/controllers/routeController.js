const Complaint = require('../models/Complaint');
const https = require('https');

// Calls OSRM public demo server — no API key needed
// Uses "trip" service which solves Travelling Salesman Problem
const osrmTrip = (coords) =>
  new Promise((resolve, reject) => {
    // coords: [[lng,lat], ...]  — OSRM expects lng,lat order
    const coordStr = coords.map(([lng, lat]) => `${lng},${lat}`).join(';');
    const url = `https://router.project-osrm.org/trip/v1/driving/${coordStr}?roundtrip=false&source=first&destination=last&steps=false&overview=full&geometries=geojson`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });

const optimizeRoute = async (req, res) => {
  try {
    const { ids } = req.body; // array of complaint _ids
    if (!ids || ids.length < 2)
      return res.status(400).json({ message: 'Select at least 2 complaints.' });

    const complaints = await Complaint.find({ _id: { $in: ids } });
    if (complaints.length < 2)
      return res.status(404).json({ message: 'Complaints not found.' });

    // Build coord list in the order ids were provided
    const ordered = ids.map(id => complaints.find(c => c._id.toString() === id)).filter(Boolean);
    const coords = ordered.map(c => [
      c.location.coordinates ? c.location.coordinates[0] : c.location.lng,
      c.location.coordinates ? c.location.coordinates[1] : c.location.lat,
    ]);

    const osrmData = await osrmTrip(coords);

    if (osrmData.code !== 'Ok')
      return res.status(502).json({ message: 'Route service unavailable. Try again.' });

    const trip = osrmData.trips[0];
    // Map waypoint order back to complaints
    const sortedComplaints = osrmData.waypoints
      .sort((a, b) => a.waypoint_index - b.waypoint_index)
      .map(wp => ordered[wp.waypoint_index] || ordered[wp.location_index] || ordered[0]);

    res.json({
      orderedComplaints: sortedComplaints,
      totalDistance: (trip.distance / 1000).toFixed(2),   // km
      totalDuration: Math.round(trip.duration / 60),       // minutes
      geometry: trip.geometry,                             // GeoJSON LineString for map
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { optimizeRoute };
