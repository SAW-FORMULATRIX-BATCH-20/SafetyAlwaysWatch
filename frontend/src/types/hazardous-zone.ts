export type NormalizedZoneBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type HazardousZone = {
  id: string;
  name: string;
  cameraId: string;
  active: boolean;
  bounds: NormalizedZoneBounds;
  points?: NormalizedPoint[];
  requiredCanonicalPpeClasses: string[];
  supervisorAreas: string[];
};

export type HazardousZoneWithViolationHistory = HazardousZone & {
  hasViolationHistory: boolean;
};

export type HazardousZoneInput = Omit<HazardousZone, "id"> & { id?: string };
