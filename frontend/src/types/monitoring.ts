export type MonitoringScenario =
  | "normal"
  | "missing-ppe"
  | "unidentified"
  | "camera-offline"
  | "score-escalation";

export type EpisodeStatus = "candidate" | "confirmed" | "clearing" | "cleared";

export type MonitoringSimulationState = "normal" | "episode" | "offline";

export type MonitoringFrame = {
  confidence: number;
  isCompliant: boolean;
  elapsedSeconds: number;
};

export type MonitoringSimulation = {
  scenario: MonitoringScenario;
  cameraId: string;
  state: MonitoringSimulationState;
  episodeId?: string;
  episodeStatus: EpisodeStatus;
  confidence: number;
  identity: "employee" | "unidentified";
  employeeId?: string;
  identityLabel: string;
  missingCanonicalPpeClasses: string[];
  confirmationElapsedSeconds: number;
  clearingElapsedSeconds: number;
  eventId?: string;
  scoreChange?: {
    before: number;
    after: number;
    crossedEscalationThreshold: boolean;
  };
};
