import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import {
  useDeactivateFaceSampleMutation,
  useEnrollFaceSampleMutation,
  useFaceEnrollmentQuery,
  type FaceEnrollmentService,
} from "../../hooks/queries/useEmployeesQuery";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
import {
  EmployeeCapabilityError,
  FaceEnrollmentError,
  type DemoValidationOutcome,
  type FaceSample,
} from "../../services/saw-service";
import { useAuthStore } from "../../stores/useAuthStore";
import { AccessibleDialog } from "../../shared/AccessibleDialog";
import {
  CameraCaptureError,
  createBrowserCameraAdapter,
  type BrowserCameraAdapter,
  type CameraCaptureSession,
} from "./camera";

type Preview = { file: File; url: string };

const outcomeMessages: Record<string, string> = {
  unsupported_media_type: "Choose a JPEG or PNG image before continuing.",
  file_too_large: "Choose an image within the maximum allowed file size.",
  no_face: "No face was found in this demo validation outcome. Choose another image and try again.",
  multiple_faces: "More than one face was found in this demo validation outcome. Choose an image with one face.",
  low_quality: "This demo validation outcome indicates low image quality. Retake or replace the image.",
  duplicate: "This demo validation outcome indicates that this Face Sample already exists. Choose another image.",
  active_sample_limit: "This Employee already has the maximum number of active Face Samples. Deactivate one before enrolling another.",
  employee_not_found: "The requested Employee could not be found.",
  face_sample_not_found: "The requested Face Sample could not be found.",
  camera_permission_denied: "Camera permission was denied. Grant permission and try again, or upload an image instead.",
  camera_unavailable: "The camera could not be started. Check the device and try again, or upload an image instead.",
  camera_unsupported: "Camera capture requires a supported browser in a secure context. Upload an image instead.",
};

function messageFor(reason: unknown) {
  if (
    reason instanceof FaceEnrollmentError ||
    reason instanceof CameraCaptureError ||
    reason instanceof EmployeeCapabilityError
  ) {
    return outcomeMessages[reason.code] ?? "Face Enrollment could not be completed. Try again.";
  }
  return "Face Enrollment could not be completed. Try again.";
}

function sourcePreview(file: File): Preview {
  return { file, url: URL.createObjectURL(file) };
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export type FaceEnrollmentProps = {
  service?: FaceEnrollmentService;
  camera?: BrowserCameraAdapter;
};

function FaceEnrollmentContent({
  service,
  camera = createBrowserCameraAdapter(),
}: FaceEnrollmentProps) {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const authPersona = useAuthStore((state) => state.persona);
  const actor = authPersona?.name ?? "Admin/Safety Officer";

  const {
    employee,
    policy,
    samples,
    isLoading,
    isError,
    error: queryError,
  } = useFaceEnrollmentQuery({ employeeId, service });

  const enrollMutation = useEnrollFaceSampleMutation({ service });
  const deactivateMutation = useDeactivateFaceSampleMutation({ service });

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraSessionRef = useRef<CameraCaptureSession | undefined>(undefined);
  const [preview, setPreview] = useState<Preview>();
  const [demoOutcome, setDemoOutcome] = useState<DemoValidationOutcome>("success");
  const [stream, setStream] = useState<MediaStream>();
  const [notice, setNotice] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [deactivating, setDeactivating] = useState<FaceSample>();

  const releasePreview = () => {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return undefined;
    });
  };

  const stopCamera = () => {
    cameraSessionRef.current?.stop();
    cameraSessionRef.current = undefined;
    setStream(undefined);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      releasePreview();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const selectFile = (file: File | undefined) => {
    if (!file || !policy) return;
    if (!policy.acceptedMediaTypes.includes(file.type as "image/jpeg" | "image/png")) {
      setNotice(outcomeMessages.unsupported_media_type);
      return;
    }
    if (file.size > policy.maximumFileSizeBytes) {
      setNotice(outcomeMessages.file_too_large);
      return;
    }
    releasePreview();
    stopCamera();
    setPreview(sourcePreview(file));
    setNotice("Preview ready for confirmation.");
  };

  const startCamera = async () => {
    setNotice(undefined);
    releasePreview();
    try {
      stopCamera();
      const session = await camera.start();
      cameraSessionRef.current = session;
      setStream(session.stream);
    } catch (reason) {
      setNotice(messageFor(reason));
    }
  };

  const captureCamera = async () => {
    const session = cameraSessionRef.current;
    const video = videoRef.current;
    if (!session || !video) return;
    try {
      const captured = await session.capture(video);
      selectFile(captured);
    } catch (reason) {
      stopCamera();
      setNotice(messageFor(reason));
    }
  };

  const enroll = async () => {
    if (!employeeId || !preview || processing) return;
    setProcessing(true);
    setNotice("Validating Face Enrollment…");
    try {
      await enrollMutation.mutateAsync({
        employeeId,
        image: preview.file,
        demoOutcome,
        actor,
      });
      releasePreview();
      stopCamera();
      setNotice("Face Sample enrolled successfully. No source image was retained.");
    } catch (reason) {
      releasePreview();
      stopCamera();
      setNotice(messageFor(reason));
    } finally {
      setProcessing(false);
    }
  };

  const deactivate = async () => {
    if (!employeeId || !deactivating) return;
    try {
      await deactivateMutation.mutateAsync({
        employeeId,
        faceSampleId: deactivating.id,
      });
      setNotice("Face Sample deactivated. A replacement may now be enrolled.");
    } catch (reason) {
      setNotice(messageFor(reason));
    } finally {
      setDeactivating(undefined);
    }
  };

  if (isError) {
    return (
      <section className="mx-auto max-w-4xl py-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Face Enrollment
        </h1>
        <div
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
          role="alert"
        >
          {messageFor(queryError)}
        </div>
      </section>
    );
  }

  if (isLoading || !employee || !policy) {
    return (
      <section aria-busy="true" className="mx-auto max-w-4xl py-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">
          Face Enrollment
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          Loading Face Enrollment
        </h1>
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 shadow-xs">
          <div className="size-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium">Loading Face Enrollment…</p>
        </div>
      </section>
    );
  }

  const activeSamples = samples.filter((sample) => sample.active);
  const atCapacity = activeSamples.length >= policy.maximumActiveSamples;
  const maxMiB = policy.maximumFileSizeBytes / (1024 * 1024);

  return (
    <section className="mx-auto max-w-4xl py-2 sm:py-6">
      <div className="mb-4">
        <Link
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-amber-800"
          onClick={() => {
            stopCamera();
            releasePreview();
          }}
          to={`/employees/${employee.id}`}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          <span>Back to Employee details</span>
        </Link>
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">
          Face Enrollment
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Face Enrollment
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Capture or upload privacy-preserving biometric face samples for camera zone recognition.
        </p>
      </div>

      {/* Target Employee Banner */}
      <section
        aria-label="Employee being enrolled"
        className="mt-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-amber-50/10 p-5 sm:p-6">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 font-mono text-lg font-bold text-amber-900 ring-2 ring-white shadow-xs">
              {getInitials(employee.name ?? employee.id)}
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                {employee.name ?? employee.id}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-600">
                <span className="rounded-md border border-slate-300/80 bg-white px-2 py-0.5 font-mono font-medium text-slate-700 shadow-2xs">
                  {employee.employeeCode ?? employee.id}
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-medium text-amber-800">{employee.departmentId}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-2xs self-start sm:self-auto">
            <ShieldCheck aria-hidden="true" className="size-4 text-amber-600" />
            <p className="text-xs font-semibold text-slate-700">
              {activeSamples.length} of {policy.maximumActiveSamples} active Face Samples
            </p>
          </div>
        </div>
      </section>

      {/* Status Notice Banner */}
      {notice && (
        <div
          aria-live="polite"
          className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm text-amber-900 shadow-2xs"
          role="status"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-amber-700" />
          <p className="font-medium leading-relaxed">{notice}</p>
        </div>
      )}

      {/* Enrollment Action Section */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Add a Face Sample</h2>
        <p className="mt-1 text-sm text-slate-600">
          Accepts JPEG or PNG up to {maxMiB} MiB. At most {policy.maximumActiveSamples} active Face
          Samples can be enrolled.
        </p>

        {atCapacity ? (
          <div
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
            role="alert"
          >
            {outcomeMessages.active_sample_limit}
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:border-slate-400 hover:bg-slate-50"
                onClick={() => void startCamera()}
                type="button"
              >
                <Camera aria-hidden="true" className="size-4 text-amber-600" />
                <span>Use camera</span>
              </button>
              <label className="inline-flex w-full sm:w-auto items-center justify-center cursor-pointer gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:border-slate-400 hover:bg-slate-50">
                <Upload aria-hidden="true" className="size-4 text-amber-600" />
                <span>Upload image</span>
                <input
                  accept="image/jpeg,image/png"
                  aria-label="Upload a JPEG or PNG image"
                  className="sr-only"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                  type="file"
                />
              </label>
            </div>

            {stream && (
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-inner">
                <video
                  aria-label="Camera preview"
                  autoPlay
                  className="max-h-60 sm:max-h-80 w-full rounded-lg bg-slate-950 object-contain"
                  muted
                  playsInline
                  ref={videoRef}
                />
                <div className="mt-3 flex justify-center pb-1">
                  <button
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-xs transition-all hover:bg-amber-500 hover:shadow"
                    onClick={() => void captureCamera()}
                    type="button"
                  >
                    <Camera aria-hidden="true" className="size-4" />
                    <span>Capture image</span>
                  </button>
                </div>
              </div>
            )}

            {preview && (
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
                  <img
                    alt="Selected image preview"
                    className="max-h-60 sm:max-h-80 w-full object-contain p-2"
                    src={preview.url}
                  />
                </div>
                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 text-center"
                    onClick={releasePreview}
                    type="button"
                  >
                    Replace image
                  </button>
                  <button
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-xs transition-all hover:bg-amber-500 hover:shadow disabled:opacity-50"
                    disabled={processing}
                    onClick={() => void enroll()}
                    type="button"
                  >
                    {processing ? (
                      <>
                        <div className="size-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        <span>Processing Face Enrollment…</span>
                      </>
                    ) : (
                      <>
                        <Check aria-hidden="true" className="size-4" />
                        <span>Confirm Face Enrollment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-amber-200/60 bg-amber-50/40 p-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-800">
                <span className="flex items-center gap-1.5">
                  <Sparkles aria-hidden="true" className="size-3.5 text-amber-600" />
                  Demo validation outcome (demo only)
                </span>
                <div className="relative mt-2">
                  <select
                    aria-label="Demo validation outcome (demo only)"
                    className="block h-10 w-full appearance-none rounded-lg border border-amber-300/80 bg-white pl-3 pr-9 text-sm text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    onChange={(event) =>
                      setDemoOutcome(event.target.value as DemoValidationOutcome)
                    }
                    value={demoOutcome}
                  >
                    <option value="success">Successful enrollment</option>
                    <option value="no_face">No face</option>
                    <option value="multiple_faces">Multiple faces</option>
                    <option value="low_quality">Low quality</option>
                    <option value="duplicate">Duplicate face</option>
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </label>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end">
              <button
                className="w-full sm:w-auto justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 text-center"
                onClick={() => {
                  stopCamera();
                  releasePreview();
                  navigate(`/employees/${employee.id}`);
                }}
                type="button"
              >
                Cancel Face Enrollment
              </button>
            </div>
          </>
        )}
      </section>

      {/* Metadata Audit Section */}
      <section
        aria-label="Face Sample metadata"
        className="mt-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Face Samples</h2>
            <p className="mt-1 text-xs text-slate-500">
              This list contains metadata only. Source images and biometric data are not retained
              by this demo.
            </p>
          </div>
          <div className="self-start sm:self-auto rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {samples.length} total
          </div>
        </div>

        {samples.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            <ShieldAlert aria-hidden="true" className="mx-auto size-8 text-slate-400" />
            <p className="mt-2 font-medium">No Face Samples have been enrolled.</p>
            <p className="text-xs text-slate-400">
              Use the camera or upload a photo above to register a sample.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {samples.map((sample, index) => (
              <li
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50"
                key={sample.id}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 font-mono text-xs font-bold text-amber-800 ring-1 ring-amber-200/60">
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">Face Sample {index + 1}</p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          sample.active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            sample.active ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {sample.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      {sample.active ? "Active" : "Inactive"} · Enrolled{" "}
                      {new Date(sample.enrolledAt).toLocaleString()} by {sample.enrolledBy}
                      {sample.qualityScore ? ` · Quality score ${sample.qualityScore}` : ""}
                    </p>
                  </div>
                </div>
                {sample.active && (
                  <button
                    className="w-full sm:w-auto rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 shadow-2xs transition-colors hover:border-rose-300 hover:bg-rose-50 text-center"
                    onClick={() => setDeactivating(sample)}
                    type="button"
                  >
                    Deactivate Face Sample {index + 1}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Confirmation Dialog */}
      {deactivating && (
        <AccessibleDialog
          label="Confirm Face Sample deactivation"
          onDismiss={() => setDeactivating(undefined)}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-rose-50/50 p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle aria-hidden="true" className="size-5" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Deactivate this Face Sample?
                </h2>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                This keeps its audit metadata but removes it from the active Face Sample count.
              </p>
            </div>
            <div className="flex justify-end gap-3 bg-slate-50/50 p-4 sm:px-6">
              <button
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
                onClick={() => setDeactivating(undefined)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-xs transition-all hover:bg-amber-500"
                data-dialog-initial-focus
                onClick={() => void deactivate()}
                type="button"
              >
                Deactivate Face Sample
              </button>
            </div>
          </div>
        </AccessibleDialog>
      )}
    </section>
  );
}

export function FaceEnrollment(props: FaceEnrollmentProps) {
  return (
    <EnsureQueryClient>
      <FaceEnrollmentContent {...props} />
    </EnsureQueryClient>
  );
}
