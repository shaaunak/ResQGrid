// Mumbai center reference for 3D projection
export const MUMBAI_CENTER = {
  lat: 19.055,
  lon: 72.865,
};

// Scale multiplier to map GPS coordinates to miniature 3D space
const SCALE = 320;

/**
 * Projects real-world Mumbai GPS coordinates (lat, lon) to a 3D Vector3 position [x, y, z].
 * x corresponds to longitude (East-West), z corresponds to negative latitude (North-South).
 */
export function geoTo3D(
  lat: number,
  lon: number,
  altitude: number = 0.5
): [number, number, number] {
  const x = (lon - MUMBAI_CENTER.lon) * SCALE;
  const z = -(lat - MUMBAI_CENTER.lat) * SCALE;
  return [x, altitude, z];
}

export const TACTICAL_PALETTE = {
  darkest: '#0b1320',
  navy: '#142235',
  surface: '#1c2d44',
  card: '#223652',
  border: '#2e4566',
  slate: '#526276',
  teal: '#137C82',
  tealBright: '#17a2a8',
  amber: '#E7A645',
  red: '#CF4B4B',
  green: '#10b981',
  water: '#0a1d37',
  road: '#1a293e',
  building: '#18283d',
  buildingLit: '#243b59',
  windowGlow: '#e0f2fe',
};

