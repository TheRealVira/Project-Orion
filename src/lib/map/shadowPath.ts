/**
 * Helper to generate smooth shadow path for day/night terminator
 */

type ProjectionFunction = (coordinates: [number, number]) => [number, number] | null;

export function generateShadowPath(
  terminatorCoords: Array<[number, number]>,
  projection: ProjectionFunction,
  zoom: number,
  sunPosition: { longitude: number; latitude: number } | null
): string | null {
  if (terminatorCoords.length === 0) return null;

  // Determine which hemisphere is in darkness based on sun position
  // If sun is south of equator (negative latitude), northern hemisphere is dark
  // If sun is north of equator (positive latitude), southern hemisphere is dark
  const isDarkNorth = sunPosition ? sunPosition.latitude < 0 : false;
  const darkPole = isDarkNorth ? 90 : -90;

  // Project all terminator points first
  const projectedTerminator = terminatorCoords
    .map(([lon, lat]) => projection([lon, lat]))
    .filter((coord): coord is [number, number] => coord !== null);

  if (projectedTerminator.length === 0) return null;

  const pathParts: string[] = [];

  // Start at the first terminator point
  pathParts.push(`M ${projectedTerminator[0][0]},${projectedTerminator[0][1]}`);

  // Create smooth cubic Bézier curve through terminator points
  // Using Catmull-Rom to cubic Bézier conversion for smoothness
  for (let i = 0; i < projectedTerminator.length - 1; i++) {
    const p0 = i > 0 ? projectedTerminator[i - 1] : projectedTerminator[i];
    const p1 = projectedTerminator[i];
    const p2 = projectedTerminator[i + 1];
    const p3 = i < projectedTerminator.length - 2 ? projectedTerminator[i + 2] : p2;

    // Catmull-Rom to Bézier conversion
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    pathParts.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`);
  }

  // Complete the circle around the dark pole
  const lastLat = terminatorCoords[terminatorCoords.length - 1][1];
  const eastEdgeStart = projection([180, lastLat]);
  if (eastEdgeStart) pathParts.push(`L ${eastEdgeStart[0]},${eastEdgeStart[1]}`);

  // Travel to dark pole on eastern edge
  const latStep = isDarkNorth ? 5 : -5;
  for (let lat = lastLat + latStep; isDarkNorth ? lat <= darkPole : lat >= darkPole; lat += latStep) {
    const pt = projection([180, lat]);
    if (pt) pathParts.push(`L ${pt[0]},${pt[1]}`);
  }

  // Arc along the dark pole from east to west
  for (let lon = 180; lon >= -180; lon -= 3) {
    const polePt = projection([lon, darkPole]);
    if (polePt) pathParts.push(`L ${polePt[0]},${polePt[1]}`);
  }

  // Travel from dark pole to first terminator latitude on western edge
  const firstLat = terminatorCoords[0][1];
  const westStep = isDarkNorth ? -2 : 2;
  for (let lat = darkPole; isDarkNorth ? lat >= firstLat - 5 : lat <= firstLat + 5; lat += westStep) {
    const pt = projection([-180, lat]);
    if (pt) pathParts.push(`L ${pt[0]},${pt[1]}`);
  }

  // Add final point and close path
  const westEdgeEnd = projection([-180, firstLat]);
  if (westEdgeEnd) pathParts.push(`L ${westEdgeEnd[0]},${westEdgeEnd[1]}`);
  pathParts.push(`L ${projectedTerminator[0][0]},${projectedTerminator[0][1]}`);
  pathParts.push('Z');

  return pathParts.join(' ');
}
