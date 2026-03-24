import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function RouteLayer({ geometry }) {
  const map = useMap();

  useEffect(() => {
    if (!geometry) return;

    // geometry is a GeoJSON LineString from OSRM
    // coordinates are [lng, lat] — Leaflet needs [lat, lng]
    const latlngs = geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    const line = L.polyline(latlngs, {
      color: '#6366f1',
      weight: 5,
      opacity: 0.85,
      dashArray: null,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    // Animated dashed overlay for visual flair
    const dash = L.polyline(latlngs, {
      color: '#a5b4fc',
      weight: 3,
      opacity: 0.6,
      dashArray: '10 8',
    }).addTo(map);

    map.fitBounds(line.getBounds(), { padding: [40, 40] });

    return () => {
      map.removeLayer(line);
      map.removeLayer(dash);
    };
  }, [geometry, map]);

  return null;
}
