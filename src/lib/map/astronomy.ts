/**
 * Astronomical calculations for sun and moon positions
 */

export interface CelestialPosition {
  longitude: number;
  latitude: number;
}

export interface TerminatorData {
  sunPosition: CelestialPosition;
  moonPosition: CelestialPosition;
  terminatorCoords: Array<[number, number]>;
}

/**
 * Calculate sun and moon positions and the day/night terminator line
 */
export function calculateTerminator(date: Date): TerminatorData {
  // Calculate Julian date
  const JD = date.getTime() / 86400000 + 2440587.5;
  const n = JD - 2451545.0;
  
  // Mean longitude of the sun
  const L = (280.460 + 0.9856474 * n) % 360;
  
  // Mean anomaly
  const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
  
  // Ecliptic longitude
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  
  // Obliquity of ecliptic
  const epsilon = (23.439 - 0.0000004 * n) * Math.PI / 180;
  
  // Solar declination in radians
  const declination = Math.asin(Math.sin(epsilon) * Math.sin(lambda));
  
  // Calculate subsolar point (where sun is directly overhead)
  // The sun moves 15 degrees per hour westward (360 degrees / 24 hours)
  // At noon UTC (12:00), sun should be at 0° longitude (Greenwich)
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const subsolarLng = -(hours - 12) * 15; // Negative because sun moves west
  const subsolarLat = (declination * 180) / Math.PI;
  
  // Calculate moon position
  const lunarDay = 29.53; // Average lunar day in Earth days
  const moonPhaseOffset = (n % lunarDay) / lunarDay * 360;
  const moonLambda = ((L + moonPhaseOffset) % 360) * Math.PI / 180;
  const moonDeclination = Math.asin(Math.sin(epsilon) * Math.sin(moonLambda) * 0.95);
  const moonHourOffset = (moonPhaseOffset / 360) * 24;
  const moonLng = -((hours + moonHourOffset - 12) * 15);
  const moonLat = (moonDeclination * 180) / Math.PI;
  
  // Generate terminator line points
  const coords: Array<[number, number]> = [];
  for (let lon = -180; lon <= 180; lon += 5) {
    const hourAngle = ((lon - subsolarLng) * Math.PI) / 180;
    const tanDeclination = Math.tan(declination);
    
    if (Math.abs(tanDeclination) < 0.001) {
      coords.push([lon, 0]);
    } else {
      const latRad = Math.atan(-Math.cos(hourAngle) / tanDeclination);
      const lat = (latRad * 180) / Math.PI;
      
      if (!isNaN(lat) && isFinite(lat) && Math.abs(lat) <= 90) {
        coords.push([lon, lat]);
      }
    }
  }
  
  return {
    sunPosition: { longitude: subsolarLng, latitude: subsolarLat },
    moonPosition: { 
      longitude: ((moonLng + 360) % 360) - 180, 
      latitude: Math.max(-90, Math.min(90, moonLat)) 
    },
    terminatorCoords: coords,
  };
}
