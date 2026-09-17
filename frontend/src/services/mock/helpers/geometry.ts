import type { HazardousZoneInput, NormalizedZoneBounds } from "../../../types";

export function validateAndComputeZoneBounds(zone: HazardousZoneInput): NormalizedZoneBounds {
  if (zone.points) {
    if (zone.points.length < 3) {
      throw new Error("A polygon zone requires at least 3 points.");
    }
    for (const p of zone.points) {
      if (
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        p.x < 0 ||
        p.x > 1 ||
        p.y < 0 ||
        p.y > 1
      ) {
        throw new Error("Polygon point coordinates must be between 0 and 1.");
      }
    }
    const xs = zone.points.map((p) => p.x);
    const ys = zone.points.map((p) => p.y);
    const minX = Math.max(0, Math.min(...xs));
    const maxX = Math.min(1, Math.max(...xs));
    const minY = Math.max(0, Math.min(...ys));
    const maxY = Math.min(1, Math.max(...ys));
    zone.bounds = {
      x: Number(minX.toFixed(4)),
      y: Number(minY.toFixed(4)),
      width: Number(Math.max(0.01, maxX - minX).toFixed(4)),
      height: Number(Math.max(0.01, maxY - minY).toFixed(4)),
    };
  }

  const { x, y, width, height } = zone.bounds;
  if (
    ![x, y, width, height].every((value) => Number.isFinite(value)) ||
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0 ||
    x + width > 1 ||
    y + height > 1
  ) {
    throw new Error("Hazardous Zone coordinates must be between 0 and 1.");
  }

  return zone.bounds;
}
