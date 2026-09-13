import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AccessibleDialog } from "../../shared/AccessibleDialog";
import {
  FaceEnrollmentError,
  EmployeeCapabilityError,
  type Employee,
  type EmployeeDirectoryCapability,
  type FaceEnrollmentCapability,
  type FaceEnrollmentPolicy,
  type DemoValidationOutcome,
  type FaceSample,
} from "../../services/saw-service";
import { CameraCaptureError, createBrowserCameraAdapter, type BrowserCameraAdapter, type CameraCaptureSession } from "./camera";

type FaceEnrollmentService = EmployeeDirectoryCapability & FaceEnrollmentCapability;
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
  if (reason instanceof FaceEnrollmentError || reason instanceof CameraCaptureError || reason instanceof EmployeeCapabilityError) {
    return outcomeMessages[reason.code] ?? "Face Enrollment could not be completed. Try again.";
  }
  return "Face Enrollment could not be completed. Try again.";
}

function sourcePreview(file: File): Preview {
  return { file, url: URL.createObjectURL(file) };
}

export function FaceEnrollment({ service, camera = createBrowserCameraAdapter() }: { service: FaceEnrollmentService; camera?: BrowserCameraAdapter }) {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraSessionRef = useRef<CameraCaptureSession | undefined>(undefined);
  const [employee, setEmployee] = useState<Employee>();
  const [policy, setPolicy] = useState<FaceEnrollmentPolicy>();
  const [samples, setSamples] = useState<FaceSample[]>([]);
  const [preview, setPreview] = useState<Preview>();
  const [demoOutcome, setDemoOutcome] = useState<DemoValidationOutcome>("success");
  const [stream, setStream] = useState<MediaStream>();
  const [notice, setNotice] = useState<string>();
  const [loadFailed, setLoadFailed] = useState(false);
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
    let active = true;
    if (!employeeId) return undefined;
    Promise.all([service.getEmployee(employeeId), service.getFaceEnrollmentPolicy(), service.getFaceSamples(employeeId)])
      .then(([nextEmployee, nextPolicy, nextSamples]) => {
        if (!active) return;
        setEmployee(nextEmployee);
        setPolicy(nextPolicy);
        setSamples(nextSamples);
      })
      .catch((reason) => {
        if (!active) return;
        setNotice(messageFor(reason));
        setLoadFailed(true);
      });
    return () => {
      active = false;
      stopCamera();
      releasePreview();
    };
  }, [employeeId, service]);

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
      const sample = await service.enrollFaceSample({ employeeId, image: preview.file, demoOutcome, actor: "Admin/Safety Officer" });
      releasePreview();
      stopCamera();
      setSamples((current) => [...current, sample]);
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
      const updated = await service.deactivateFaceSample(employeeId, deactivating.id);
      setSamples((current) => current.map((sample) => sample.id === updated.id ? updated : sample));
      setNotice("Face Sample deactivated. A replacement may now be enrolled.");
    } catch (reason) {
      setNotice(messageFor(reason));
    } finally {
      setDeactivating(undefined);
    }
  };

  if (loadFailed) return <section><h1>Face Enrollment</h1><p role="alert">{notice}</p></section>;
  if (!employee || !policy) return <section aria-busy="true"><h1>Loading Face Enrollment</h1><p>Loading Face Enrollment…</p></section>;

  const activeSamples = samples.filter((sample) => sample.active);
  const atCapacity = activeSamples.length >= policy.maximumActiveSamples;
  const maxMiB = policy.maximumFileSizeBytes / (1024 * 1024);

  return (
    <section className="mx-auto max-w-3xl">
      <Link className="text-sm text-amber-800 underline" onClick={() => { stopCamera(); releasePreview(); }} to={`/employees/${employee.id}`}>Back to Employee details</Link>
      <p className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Face Enrollment</p>
      <h1 className="mt-2 text-3xl font-semibold">Face Enrollment</h1>
      <section aria-label="Employee being enrolled" className="mt-5 border border-slate-200 bg-white p-4">
        <p className="text-lg font-semibold">{employee.name ?? employee.id}</p>
        <p className="font-mono text-sm text-slate-600">{employee.employeeCode ?? employee.id}</p>
        <p className="mt-3 text-sm text-slate-600">{activeSamples.length} of {policy.maximumActiveSamples} active Face Samples</p>
      </section>
      {notice && <p aria-live="polite" className="mt-5 border-l-2 border-amber-500 bg-amber-50 p-3 text-sm" role="status">{notice}</p>}
      <section className="mt-5 border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-semibold">Add a Face Sample</h2>
        <p className="mt-2 text-sm text-slate-600">Accepts JPEG or PNG up to {maxMiB} MiB. At most {policy.maximumActiveSamples} active Face Samples can be enrolled.</p>
        {atCapacity ? <p className="mt-4" role="alert">{outcomeMessages.active_sample_limit}</p> : <>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded border px-3 py-2 text-sm" onClick={() => void startCamera()} type="button">Use camera</button>
            <label className="rounded border px-3 py-2 text-sm">Upload image<input accept="image/jpeg,image/png" aria-label="Upload a JPEG or PNG image" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} type="file" /></label>
          </div>
          {stream && <div className="mt-5"><video aria-label="Camera preview" autoPlay className="max-h-72 w-full bg-slate-950" muted playsInline ref={videoRef} /><button className="mt-3 rounded border px-3 py-2 text-sm" onClick={() => void captureCamera()} type="button">Capture image</button></div>}
          {preview && <div className="mt-5"><img alt="Selected image preview" className="max-h-72 w-full object-contain" src={preview.url} /><div className="mt-3 flex flex-wrap gap-3"><button className="rounded border px-3 py-2 text-sm" onClick={releasePreview} type="button">Replace image</button><button className="rounded bg-amber-400 px-3 py-2 text-sm font-medium" disabled={processing} onClick={() => void enroll()} type="button">{processing ? "Processing Face Enrollment…" : "Confirm Face Enrollment"}</button></div></div>}
          <label className="mt-5 block text-sm font-medium">Demo validation outcome (demo only)
            <select aria-label="Demo validation outcome (demo only)" className="mt-1 block rounded border p-2" onChange={(event) => setDemoOutcome(event.target.value as DemoValidationOutcome)} value={demoOutcome}>
              <option value="success">Successful enrollment</option><option value="no_face">No face</option><option value="multiple_faces">Multiple faces</option><option value="low_quality">Low quality</option><option value="duplicate">Duplicate face</option>
            </select>
          </label>
          <button className="mt-5 rounded border px-3 py-2 text-sm" onClick={() => { stopCamera(); releasePreview(); navigate(`/employees/${employee.id}`); }} type="button">Cancel Face Enrollment</button>
        </>}
      </section>
      <section aria-label="Face Sample metadata" className="mt-5 border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-semibold">Face Samples</h2>
        <p className="mt-2 text-sm text-slate-600">This list contains metadata only. Source images and biometric data are not retained by this demo.</p>
        {samples.length === 0 ? <p className="mt-4">No Face Samples have been enrolled.</p> : <ul className="mt-4 space-y-3">{samples.map((sample, index) => <li className="border p-3" key={sample.id}><p className="font-medium">Face Sample {index + 1}</p><p className="text-sm">{sample.active ? "Active" : "Inactive"} · Enrolled {new Date(sample.enrolledAt).toLocaleString()} by {sample.enrolledBy}{sample.qualityScore ? ` · Quality score ${sample.qualityScore}` : ""}</p>{sample.active && <button className="mt-2 rounded border px-3 py-1 text-sm" onClick={() => setDeactivating(sample)} type="button">Deactivate Face Sample {index + 1}</button>}</li>)}</ul>}
      </section>
      {deactivating && <AccessibleDialog label="Confirm Face Sample deactivation" onDismiss={() => setDeactivating(undefined)}><div className="w-full max-w-md bg-white p-6"><h2 className="text-xl font-semibold">Deactivate this Face Sample?</h2><p className="mt-3">This keeps its audit metadata but removes it from the active Face Sample count.</p><div className="mt-6 flex justify-end gap-3"><button className="rounded border px-3 py-2" onClick={() => setDeactivating(undefined)} type="button">Cancel</button><button className="rounded bg-amber-400 px-3 py-2" data-dialog-initial-focus onClick={() => void deactivate()} type="button">Deactivate Face Sample</button></div></div></AccessibleDialog>}
    </section>
  );
}
