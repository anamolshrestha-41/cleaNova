import L from 'leaflet';

const colors = {
  pending:      { fill: '#f59e0b', stroke: '#d97706', label: '#fff' },
  'in-progress':{ fill: '#3b82f6', stroke: '#2563eb', label: '#fff' },
  resolved:     { fill: '#10b981', stroke: '#059669', label: '#fff' },
};

// Returns a Leaflet DivIcon with a colored SVG pin
export function makeMarkerIcon(status, selected = false) {
  const c = colors[status] || colors.pending;
  const size = selected ? 38 : 30;
  const ring = selected ? `<circle cx="16" cy="16" r="15" fill="none" stroke="${c.stroke}" stroke-width="2.5" stroke-dasharray="4 2"/>` : '';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 32 40">
      ${ring}
      <circle cx="16" cy="14" r="12" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>
      <polygon points="10,22 22,22 16,32" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="16" cy="14" r="5" fill="white" opacity="0.9"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
}

export const STATUS_COLORS = colors;
