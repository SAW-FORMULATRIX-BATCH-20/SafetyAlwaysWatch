export type SafetyDeduction = {
  canonicalPpeClass: string;
  points: number;
};

export type PpeComplianceCategory = "compliance" | "violation";

export type CanonicalPpeClassMapping = {
  id: string;
  yoloIndex: number;
  rawLabel: string;
  canonicalPpeClass: string;
  complianceCategory: PpeComplianceCategory;
  active: boolean;
};

export type OnnxModelMetadata = {
  fileName: string;
  sizeBytes: number;
  mimeType: string;
};

export type CanonicalPpeClassConfiguration = {
  mappings: CanonicalPpeClassMapping[];
  modelFileMetadata?: OnnxModelMetadata;
};

export type SafetySettings = {
  initialScore: number;
  escalationThreshold: number;
  deductions: SafetyDeduction[];
  confirmThresholdSeconds: number;
  clearThresholdSeconds: number;
  minimumConfidence: number;
  resetTime: string;
  recapLeadMinutes: number;
  timeZone: "Asia/Jakarta";
};
