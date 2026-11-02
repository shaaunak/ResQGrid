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
  // Architectural enterprise GIS palette
  darkest: '#F1F5F7',      // Soft atmospheric background
  navy: '#DCE4E8',         // Base terrain plane
  surface: '#FFFFFF',      // Crisp architectural facade
  card: '#F8FAFC',         // Secondary facade
  border: '#CBD5E1',       // Structure outlines and grid
  slate: '#64748B',        // Muted annotations
  teal: '#146D73',         // Responders & brand primary
  tealBright: '#0D9488',   // Active telemetry sweep
  amber: '#D77A34',        // High severity
  red: '#C84343',          // Critical emergency
  green: '#347F68',        // Low / Resolved state
  water: '#38BDF8',        // Coastal water
  waterDeep: '#0284C7',    // Deep river channel
  road: '#94A3B8',         // Major highways and expressways
  building: '#FFFFFF',     // Clean architectural stone/concrete
  buildingLit: '#E2E8F0',  // Warm concrete variation
  windowGlow: '#0284C7',   // Dynamic accent
};

