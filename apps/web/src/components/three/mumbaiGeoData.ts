// Real-world Mumbai Geography: Footprints, Elevation Zones, Road Networks, and Waterways
// Study areas: Kurla & Mithi River basin, Bandra-Kurla Complex (BKC), Dadar-Hindmata, Dharavi, Andheri

export interface FootprintPolygon {
  name: string;
  sector: 'Kurla' | 'BKC' | 'Dadar' | 'Dharavi' | 'Andheri';
  points: [number, number][]; // [lon, lat]
  levels: number;
  type: 'residential' | 'commercial' | 'hospital' | 'infrastructure';
  roofColor?: string;
  wallColor?: string;
}

// Elevation heightmap: low-lying flood-prone zones (Mithi River, Kurla, Hindmata) have low or negative elevation offsets
export const ELEVATION_ZONES = [
  // Kurla West & Kranti Nagar near Mithi River: -1.2m below highway level (extremely flood prone)
  { lat: 19.0726, lon: 72.8845, radius: 0.025, baseHeight: -0.4, label: 'Kurla Low Basin' },
  // Hindmata Dadar: -0.9m depression
  { lat: 19.0178, lon: 72.8478, radius: 0.018, baseHeight: -0.3, label: 'Hindmata Flyover Depression' },
  // Dharavi 90ft road marsh area
  { lat: 19.0434, lon: 72.8567, radius: 0.020, baseHeight: -0.2, label: 'Dharavi Marsh' },
  // BKC elevated commercial area: +1.0m
  { lat: 19.0650, lon: 72.8680, radius: 0.020, baseHeight: 0.6, label: 'BKC Commercial Ridge' },
  // Andheri West ridge: +1.5m
  { lat: 19.1136, lon: 72.8697, radius: 0.025, baseHeight: 0.8, label: 'Andheri Elevated Sector' },
];

export function getElevationAt(lat: number, lon: number): number {
  let elevation = 0.1;
  for (const zone of ELEVATION_ZONES) {
    const dLat = lat - zone.lat;
    const dLon = lon - zone.lon;
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);
    if (dist < zone.radius) {
      const weight = 1 - dist / zone.radius;
      elevation += zone.baseHeight * weight * 1.5;
    }
  }
  return elevation;
}

// Real polyline of the Mithi River meandering from Powai through Kurla/BKC into Mahim Bay
export const MITHI_RIVER_COORDINATES: [number, number][] = [
  [72.9050, 19.1180], // Powai overflow
  [72.8980, 19.1020], // Saki Naka
  [72.8890, 19.0880], // Kurla industrial bypass
  [72.8845, 19.0726], // Kranti Nagar / Kurla West Bridge
  [72.8710, 19.0630], // BKC northern boundary
  [72.8580, 19.0520], // Dharavi edge
  [72.8430, 19.0430], // Mahim Creek
  [72.8340, 19.0380], // Arabian Sea / Mahim Bay
];

// Western Coastline polyline (Arabian Sea)
export const COASTLINE_COORDINATES: [number, number][] = [
  [72.8120, 19.1450], // Versova / Juhu North
  [72.8220, 19.1000], // Juhu Beach
  [72.8250, 19.0750], // Khar Danda
  [72.8210, 19.0550], // Bandstand / Bandra Fort
  [72.8340, 19.0380], // Mahim Bay
  [72.8360, 19.0150], // Dadar Chowpatty
  [72.8200, 18.9700], // Haji Ali
  [72.8050, 18.9400], // Malabar Hill
  [72.8140, 18.9050], // Colaba Point
];

// Real Road Networks (Western Express Highway, LBS Marg, S.V. Road, Eastern Freeway)
export const ROAD_POLYLINES: { name: string; points: [number, number][] }[] = [
  {
    name: 'Western Express Highway (WEH)',
    points: [
      [72.8697, 19.1136], // Andheri
      [72.8560, 19.0850], // Vile Parle
      [72.8480, 19.0600], // Bandra
      [72.8400, 19.0400], // Mahim Cause Way
    ],
  },
  {
    name: 'Lal Bahadur Shastri (LBS) Marg',
    points: [
      [72.8950, 19.1050], // Ghatkopar
      [72.8845, 19.0726], // Kurla West
      [72.8680, 19.0500], // Sion
    ],
  },
  {
    name: 'Bandra-Kurla Complex Arterial',
    points: [
      [72.8480, 19.0600], // Bandra Kalanagar
      [72.8650, 19.0640], // BKC Central Avenue
      [72.8845, 19.0726], // Kurla Connector
    ],
  },
  {
    name: 'Dr. Babasaheb Ambedkar Road (Hindmata)',
    points: [
      [72.8619, 19.0390], // Sion Circle
      [72.8478, 19.0178], // Hindmata Dadar
      [72.8423, 19.0028], // Parel TT
    ],
  },
];

// Realistic building footprints across the 5 primary sectors
export const MUMBAI_BUILDING_FOOTPRINTS: FootprintPolygon[] = [
  // 1. Kurla / Mithi River Basin Sector (Dense mixed residential & industrial)
  {
    name: 'Kurla Transit Residential Block A',
    sector: 'Kurla',
    points: [[72.8830, 19.0720], [72.8840, 19.0720], [72.8840, 19.0732], [72.8830, 19.0732]],
    levels: 4,
    type: 'residential',
  },
  {
    name: 'Kranti Nagar Riverfront Complex',
    sector: 'Kurla',
    points: [[72.8850, 19.0715], [72.8862, 19.0715], [72.8862, 19.0728], [72.8850, 19.0728]],
    levels: 3,
    type: 'residential',
  },
  {
    name: 'Kurla Railway Transit Hub',
    sector: 'Kurla',
    points: [[72.8870, 19.0680], [72.8890, 19.0680], [72.8890, 19.0700], [72.8870, 19.0700]],
    levels: 5,
    type: 'infrastructure',
  },
  {
    name: 'LBS Marg Relief Warehouse',
    sector: 'Kurla',
    points: [[72.8820, 19.0750], [72.8835, 19.0750], [72.8835, 19.0765], [72.8820, 19.0765]],
    levels: 2,
    type: 'commercial',
  },

  // 2. Bandra-Kurla Complex (BKC) (Modern high-rise commercial towers)
  {
    name: 'BKC Financial Center Tower 1',
    sector: 'BKC',
    points: [[72.8620, 19.0620], [72.8645, 19.0620], [72.8645, 19.0645], [72.8620, 19.0645]],
    levels: 14,
    type: 'commercial',
  },
  {
    name: 'BKC Financial Center Tower 2',
    sector: 'BKC',
    points: [[72.8660, 19.0630], [72.8685, 19.0630], [72.8685, 19.0655], [72.8660, 19.0655]],
    levels: 16,
    type: 'commercial',
  },
  {
    name: 'MMRDA Administrative Headquarters',
    sector: 'BKC',
    points: [[72.8630, 19.0665], [72.8655, 19.0665], [72.8655, 19.0685], [72.8630, 19.0685]],
    levels: 10,
    type: 'infrastructure',
  },
  {
    name: 'Asian Heart Institute Hospital',
    sector: 'BKC',
    points: [[72.8690, 19.0610], [72.8715, 19.0610], [72.8715, 19.0630], [72.8690, 19.0630]],
    levels: 8,
    type: 'hospital',
  },

  // 3. Dadar & Hindmata (High-density colonial & modern towers)
  {
    name: 'Hindmata Flyover Commercial Center',
    sector: 'Dadar',
    points: [[72.8465, 19.0170], [72.8485, 19.0170], [72.8485, 19.0185], [72.8465, 19.0185]],
    levels: 8,
    type: 'commercial',
  },
  {
    name: 'KEM Hospital & Medical College',
    sector: 'Dadar',
    points: [[72.8410, 19.0020], [72.8440, 19.0020], [72.8440, 19.0050], [72.8410, 19.0050]],
    levels: 9,
    type: 'hospital',
  },
  {
    name: 'Dadar Central Residential Heights',
    sector: 'Dadar',
    points: [[72.8490, 19.0200], [72.8510, 19.0200], [72.8510, 19.0225], [72.8490, 19.0225]],
    levels: 15,
    type: 'residential',
  },

  // 4. Dharavi Sector (Extremely dense low-rise workshops & shelters)
  {
    name: 'Dharavi Sector 5 Transit Center',
    sector: 'Dharavi',
    points: [[72.8550, 19.0420], [72.8575, 19.0420], [72.8575, 19.0440], [72.8550, 19.0440]],
    levels: 3,
    type: 'residential',
  },
  {
    name: '90 Feet Road Community School',
    sector: 'Dharavi',
    points: [[72.8585, 19.0435], [72.8605, 19.0435], [72.8605, 19.0450], [72.8585, 19.0450]],
    levels: 3,
    type: 'infrastructure',
  },

  // 5. Andheri Sector (Commercial IT parks & elevated transit)
  {
    name: 'Andheri West Transit Hub',
    sector: 'Andheri',
    points: [[72.8680, 19.1120], [72.8710, 19.1120], [72.8710, 19.1150], [72.8680, 19.1150]],
    levels: 11,
    type: 'commercial',
  },
  {
    name: 'MIDC Emergency Relief Depot',
    sector: 'Andheri',
    points: [[72.8730, 19.1140], [72.8755, 19.1140], [72.8755, 19.1165], [72.8730, 19.1165]],
    levels: 4,
    type: 'infrastructure',
  },
];

