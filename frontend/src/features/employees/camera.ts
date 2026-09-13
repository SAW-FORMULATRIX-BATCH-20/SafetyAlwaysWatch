export type CameraCaptureSession = {
  stream: MediaStream;
  capture(video: HTMLVideoElement): Promise<File>;
  stop(): void;
};

export interface BrowserCameraAdapter {
  start(): Promise<CameraCaptureSession>;
}

export type CameraFailureCode = "camera_permission_denied" | "camera_unavailable" | "camera_unsupported";

export class CameraCaptureError extends Error {
  constructor(public readonly code: CameraFailureCode) {
    super(code);
    this.name = "CameraCaptureError";
  }
}

function mediaFailure(reason: unknown): CameraCaptureError {
  if (reason instanceof DOMException && (reason.name === "NotAllowedError" || reason.name === "SecurityError")) {
    return new CameraCaptureError("camera_permission_denied");
  }
  return new CameraCaptureError("camera_unavailable");
}

function canvasFile(video: HTMLVideoElement): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new CameraCaptureError("camera_unavailable"));
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new CameraCaptureError("camera_unavailable"));
        return;
      }
      resolve(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }));
    }, "image/jpeg");
  });
}

export function createBrowserCameraAdapter(): BrowserCameraAdapter {
  return {
    async start() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new CameraCaptureError("camera_unsupported");
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        return {
          stream,
          capture: canvasFile,
          stop: () => stream.getTracks().forEach((track) => track.stop()),
        };
      } catch (reason) {
        throw mediaFailure(reason);
      }
    },
  };
}

export function createDeterministicCameraAdapter(image = new File(["camera-demo"], "camera-capture.jpg", { type: "image/jpeg" })): BrowserCameraAdapter {
  const stream = { getTracks: () => [] } as unknown as MediaStream;
  return {
    async start() {
      return { stream, capture: async () => image, stop: () => undefined };
    },
  };
}
