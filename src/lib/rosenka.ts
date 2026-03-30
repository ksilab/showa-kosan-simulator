import rosenkaData from '@/data/rosenka.json';

export type CityCode = '10201' | '10202' | '10204' | '10209' | '10464' | '10384';

export interface RosenkaMap {
  [key: string]: {
    name: string;
    areas: Record<string, number>;
  };
}

const data = rosenkaData as unknown as RosenkaMap & {
  metadata: { fallbackValue: number };
};

/**
 * Get roadside value (rosenka) for a specific area.
 * Returns the fallback value if area is not found.
 */
export function getRosenka(cityCode: CityCode, areaName: string): number {
  const city = data[cityCode];
  if (!city) return data.metadata.fallbackValue;
  
  return city.areas[areaName] ?? data.metadata.fallbackValue;
}

/**
 * Get all available areas for a city.
 */
export function getAreasForCity(cityCode: CityCode): string[] {
  return Object.keys(data[cityCode]?.areas || {});
}

/**
 * Get list of cities supported.
 */
export function getSupportedCities() {
  return Object.entries(data)
    .filter(([key]) => key !== 'metadata')
    .map(([id, val]) => ({ id: id as CityCode, name: (val as any).name }));
}

/**
 * Calculate estimated land value based on roadside value, area, and optional factors.
 */
export function calculateEstimatedLandValue(
  rosenka: number,
  areaSqm: number,
  factors: { shape?: number; depth?: number; frontRoadWidth?: number } = {}
): number {
  const baseValue = rosenka * areaSqm;
  
  // Simple adjustment factors (default to 1.0)
  const shapeFactor = factors.shape ?? 1.0;
  const depthFactor = factors.depth ?? 1.0;
  
  return Math.round(baseValue * shapeFactor * depthFactor);
}
