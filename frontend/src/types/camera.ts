export type CameraStatus = "online" | "degraded" | "offline";

export type Camera = {
  id: string;
  name: string;
  location: string;
  zoneIds: string[];
  status: CameraStatus;
  lastUpdatedAt: string;
  supervisorArea: string;
};

export type CameraMetadata = Pick<Camera, "name" | "location">;

export type CameraScope = "all" | { type: "supervisor-area"; area: string };
