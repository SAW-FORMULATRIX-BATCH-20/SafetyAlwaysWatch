import type { EpisodeStatus } from "./monitoring";

export type ViolationTimelineEntry = {
  status: EpisodeStatus;
  occurredAt: string;
  description: string;
};

export type ViolationNotificationRecipient = {
  name: string;
  role: "Human Resources (HR)" | "Area Supervisor";
  deliveryStatus: "sent" | "failed" | "pending";
};

export type ViolationRecord = {
  id: string;
  status: "confirmed" | "clearing" | "cleared";
  zoneId?: string;
  cameraId?: string;
  episodeId?: string;
  employeeId?: string;
  missingCanonicalPpeClasses?: string[];
  confidence?: number;
  detectedAt?: string;
  updatedAt?: string;
  scoreChange?: { before: number; after: number };
  notificationRecipients?: ViolationNotificationRecipient[];
  timeline?: ViolationTimelineEntry[];
};
