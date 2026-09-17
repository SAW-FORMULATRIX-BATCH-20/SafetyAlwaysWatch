import type {
  CanonicalPpeClassConfiguration,
  FaceEnrollmentPolicy,
  SafetySettings,
} from "../../../types";

export const defaultSafetySettings: SafetySettings = {
  initialScore: 100,
  escalationThreshold: 60,
  deductions: [
    { canonicalPpeClass: "Safety Helmet", points: 10 },
    { canonicalPpeClass: "Safety Vest", points: 8 },
    { canonicalPpeClass: "Safety Boots", points: 12 },
    { canonicalPpeClass: "Hearing Protection", points: 6 },
  ],
  confirmThresholdSeconds: 5,
  clearThresholdSeconds: 3,
  minimumConfidence: 0.5,
  resetTime: "00:00",
  recapLeadMinutes: 15,
  timeZone: "Asia/Jakarta",
};

export const defaultFaceEnrollmentPolicy: FaceEnrollmentPolicy = {
  acceptedMediaTypes: ["image/jpeg", "image/png"],
  maximumFileSizeBytes: 5 * 1024 * 1024,
  maximumActiveSamples: 5,
};

export const defaultCanonicalPpeClassConfiguration: CanonicalPpeClassConfiguration = {
  mappings: [
    {
      id: "PPE-01",
      yoloIndex: 0,
      rawLabel: "helmet",
      canonicalPpeClass: "Safety Helmet",
      complianceCategory: "compliance",
      active: true,
    },
    {
      id: "PPE-02",
      yoloIndex: 1,
      rawLabel: "hardhat",
      canonicalPpeClass: "Safety Helmet",
      complianceCategory: "compliance",
      active: true,
    },
    {
      id: "PPE-03",
      yoloIndex: 2,
      rawLabel: "mask",
      canonicalPpeClass: "Face Mask",
      complianceCategory: "compliance",
      active: true,
    },
    {
      id: "PPE-04",
      yoloIndex: 3,
      rawLabel: "Face Mask",
      canonicalPpeClass: "Face Mask",
      complianceCategory: "compliance",
      active: true,
    },
    {
      id: "PPE-05",
      yoloIndex: 4,
      rawLabel: "no_vest",
      canonicalPpeClass: "Safety Vest",
      complianceCategory: "violation",
      active: true,
    },
  ],
  modelFileMetadata: {
    fileName: "saw-ppe-demo.onnx",
    sizeBytes: 2048000,
    mimeType: "application/octet-stream",
  },
};
