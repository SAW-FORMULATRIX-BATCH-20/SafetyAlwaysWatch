import { useEffect, useRef, useState } from "react";
import {
  Camera as CameraIcon,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  TriangleAlert,
  WifiOff,
} from "lucide-react";

import { Button } from "../components/ui/button";
import industrialMonitoringScene from "../assets/industrial-monitoring.svg";
import { cameraScopeFor, type Persona } from "./personas";
import { AccessibleDialog } from "../shared/AccessibleDialog";
import { formatWib } from "../shared/formatters";
import {
  type Camera,
  type CameraMetadata,
  type CameraSourceCapability,
  type CameraStatus,
  type CanonicalPpeClassConfiguration,
  type CanonicalPpeClassMapping,
  type CanonicalPpeClassCapability,
  type HazardousZoneCapability,
  type NormalizedZoneBounds,
  type HazardousZone,
  type HazardousZoneInput,
  type HazardousZoneWithViolationHistory,
} from "../services/saw-service";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
}

const cameraStatusDetailss: Record<CameraStatus, {
  label: string;
  Icon: typeof CheckCircle2;
  className: string;
}> = {
  online: { label: "Active", Icon: CheckCircle2, className: "text-emerald-700" },
  degraded: { label: "Terganggu", Icon: TriangleAlert, className: "text-amber-700" },
  offline: { label: "Offline", Icon: WifiOff, className: "text-slate-600" },
};

function ConnectionStatus({ status }: { status: CameraStatus }) {
  const { Icon, label, className } = cameraStatusDetailss[status];

  return (
    <span aria-label={`Status koneksi: ${label}`} className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}>
      <Icon aria-label={`Ikon status ${label}`} className="size-4" role="img" />
      {label}
    </span>
  );
}

function CameraDetails({
  camera,
  canEdit,
  onSaved,
  zones,
}: {
  camera: Camera;
  canEdit: boolean;
  onSaved: (metadata: CameraMetadata) => void;
  zones: HazardousZone[];
}) {
  const [draft, setDraft] = useState<CameraMetadata>({ name: camera.name, location: camera.location });
  const [validationError, setValidationError] = useState<string>();

  const updateDraft = (field: keyof CameraMetadata, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setValidationError(undefined);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.location.trim()) {
      setValidationError("Camera Source name and location are required.");
      return;
    }
    onSaved({ name: draft.name.trim(), location: draft.location.trim() });
  };

  return (
    <section aria-labelledby="camera-detail-title" className="border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Metadata operasional</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950" id="camera-detail-title">Camera Source Details</h2>
        </div>
        <ConnectionStatus status={camera.status} />
      </div>
      {canEdit ? (
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-800">
            Name Camera Source
            <input
              className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              onChange={(event) => updateDraft("name", event.target.value)}
              value={draft.name}
            />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Location
            <input
              className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              onChange={(event) => updateDraft("location", event.target.value)}
              value={draft.location}
            />
          </label>
          {validationError && <p className="text-sm text-red-700" role="alert">{validationError}</p>}
          <Button type="submit">Save metadata demo</Button>
        </form>
      ) : (
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Name Camera Sources</dt><dd className="mt-1 font-medium text-slate-950">{camera.name}</dd></div>
          <div><dt className="text-slate-500">Location</dt><dd className="mt-1 font-medium text-slate-950">{camera.location}</dd></div>
        </dl>
      )}
      <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">ID sumber</dt><dd className="mt-1 font-mono text-slate-950">{camera.id}</dd></div>
        <div><dt className="text-slate-500">Area Supervisor scope</dt><dd className="mt-1 text-slate-950">{camera.supervisorArea}</dd></div>
        <div><dt className="text-slate-500">Related Hazardous Zones</dt><dd className="mt-1 text-slate-950">{camera.zoneIds.join(", ")}</dd></div>
        <div><dt className="text-slate-500">Latest update</dt><dd className="mt-1 font-mono text-slate-950">{formatWib(camera.lastUpdatedAt)}</dd></div>
      </dl>
      <ul aria-label="Status Hazardous Zone" className="mt-5 flex flex-wrap gap-2 text-sm">{zones.filter((zone) => camera.zoneIds.includes(zone.id)).map((zone) => <li className="border border-slate-200 bg-slate-50 px-2 py-1" key={zone.id}>{zone.name} · {zone.active ? "Active" : "Inactive"}</li>)}</ul>
      <p className="mt-5 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-600">Connection details show only safe demo metadata.</p>
    </section>
  );
}

function CameraCard({ camera, onSelect }: { camera: Camera; onSelect: () => void }) {
  return (
    <article aria-label={camera.name} className="border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CameraIcon aria-hidden="true" className="size-5 text-slate-500" />
            <h2 className="font-semibold text-slate-950">{camera.name}</h2>
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500">{camera.id}</p>
        </div>
        <ConnectionStatus status={camera.status} />
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div className="flex gap-2"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" /><span><dt className="text-slate-500">Location</dt><dd className="mt-0.5 text-slate-900">{camera.location}</dd></span></div>
        <div><dt className="text-slate-500">Related Hazardous Zones</dt><dd className="mt-0.5 text-slate-900">{camera.zoneIds.join(", ")}</dd></div>
        <div className="flex gap-2"><Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" /><span><dt className="text-slate-500">Latest update</dt><dd className="mt-0.5 font-mono text-xs text-slate-900">{formatWib(camera.lastUpdatedAt)}</dd></span></div>
      </dl>
      <Button className="mt-5" onClick={onSelect} variant="outline">View details {camera.name}</Button>
    </article>
  );
}

export function Cameras({ persona, service }: { persona: Persona; service: CameraSourceCapability & HazardousZoneCapability }) {
  const [cameras, setCameras] = useState<Camera[]>();
  const [zones, setZones] = useState<HazardousZone[]>();
  const [error, setError] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CameraStatus | "all">("all");
  const [selectedCameraId, setSelectedCameraId] = useState<string>();
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    let active = true;
    Promise.all([service.getCameras(cameraScopeFor(persona)), service.getHazardousZone()]).then(([nextCameras, nextZones]) => {
      if (active) {
        setCameras(nextCameras);
        setZones(nextZones);
      }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Camera Sources could not be loaded.");
    });
    return () => {
      active = false;
    };
  }, [persona, service]);

  const filteredCameras = (cameras ?? []).filter((camera) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [camera.name, camera.location, camera.id, ...camera.zoneIds]
      .some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === "all" || camera.status === statusFilter);
  });
  const selectedCamera = cameras?.find((camera) => camera.id === selectedCameraId);

  const saveMetadata = async (camera: Camera, metadata: CameraMetadata) => {
    const savedCamera = await service.updateCameraMetadata(camera.id, metadata);
    setCameras((current) => current?.map((item) => item.id === savedCamera.id ? savedCamera : item));
    setNotice("Metadata Camera Source diperbarui.");
  };

  if (error) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Camera Sources</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Camera Source tidak dapat dimuat</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }
  if (cameras === undefined || zones === undefined) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Camera Sources</h1><p className="mt-6 text-slate-600">Loading Camera Source…</p></section>;
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational configuration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Camera Sources</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Monitor pilot video sources, locations, observed zones, and data freshness.</p></div>
        <span className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"><CameraIcon aria-hidden="true" className="size-4" />{cameras.length} sources registered</span>
      </div>
      <div className="mt-8 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <label className="block text-sm font-medium text-slate-800">Search Camera Sources<div className="relative mt-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><input aria-label="Search Camera Source" className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Name, location, ID, or zone" value={searchTerm} /></div></label>
        <label className="block text-sm font-medium text-slate-800">Filter status<select aria-label="Filter status" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setStatusFilter(event.target.value as CameraStatus | "all")} value={statusFilter}><option value="all">All statuses</option><option value="online">Active</option><option value="degraded">Degraded</option><option value="offline">Offline</option></select></label>
      </div>
      <p className="mt-4 text-sm text-slate-600">Showing {filteredCameras.length} of {cameras.length} Camera Sources</p>
      {notice && <p aria-live="polite" className="mt-3 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {cameras.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No Camera Sources are registered</p><p className="mt-1 text-sm text-slate-600">Add Camera Sources to start monitoring coverage.</p></div> : filteredCameras.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No Camera Sources match.</p><p className="mt-1 text-sm text-slate-600">Change the search term or status filter.</p></div> : <div aria-label="Camera Source list" className="mt-4 grid gap-4 xl:grid-cols-2" role="list">{filteredCameras.map((camera) => <CameraCard camera={camera} key={camera.id} onSelect={() => { setSelectedCameraId(camera.id); setNotice(undefined); }} />)}</div>}
      {selectedCamera && <div className="mt-6"><CameraDetails camera={selectedCamera} canEdit={persona.role === "admin"} key={selectedCamera.id} onSaved={(metadata) => void saveMetadata(selectedCamera, metadata)} zones={zones} /></div>}
    </section>
  );
}

 type PpeMappingDraft = {
  id?: string;
  yoloIndex: string;
  rawLabel: string;
  canonicalPpeClass: string;
  complianceCategory: CanonicalPpeClassMapping["complianceCategory"];
  active: boolean;
};

function copyCanonicalPpeClassConfiguration(configuration: CanonicalPpeClassConfiguration): CanonicalPpeClassConfiguration {
  return JSON.parse(JSON.stringify(configuration)) as CanonicalPpeClassConfiguration;
}

function createPpeMappingDraft(mapping?: CanonicalPpeClassMapping): PpeMappingDraft {
  return mapping
    ? { ...mapping, yoloIndex: String(mapping.yoloIndex) }
    : { yoloIndex: "", rawLabel: "", canonicalPpeClass: "", complianceCategory: "compliance", active: true };
}

function ppeComplianceCategoryLabel(category: CanonicalPpeClassMapping["complianceCategory"]) {
  return category === "compliance" ? "Compliant" : "Violation";
}

function createPpeMappingId(mappings: CanonicalPpeClassMapping[]) {
  let sequence = mappings.length + 1;
  let id = `PPE-${String(sequence).padStart(2, "0")}`;
  while (mappings.some((mapping) => mapping.id === id)) {
    sequence += 1;
    id = `PPE-${String(sequence).padStart(2, "0")}`;
  }
  return id;
}

export function CanonicalPpeClasses({ service }: { service: CanonicalPpeClassCapability }) {
  const [configuration, setConfiguration] = useState<CanonicalPpeClassConfiguration>();
  const [draft, setDraft] = useState<PpeMappingDraft>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [saving, setSaving] = useState(false);
  const phoneLayout = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    let active = true;
    service.getCanonicalPpeClassConfiguration().then((nextConfiguration) => {
      if (active) setConfiguration(nextConfiguration);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Configuration Canonical PPE Classes tidak dapat dimuat.");
    });
    return () => {
      active = false;
    };
  }, [service]);

  const updateDraft = <Field extends keyof PpeMappingDraft>(field: Field, value: PpeMappingDraft[Field]) => {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setError(undefined);
    setNotice(undefined);
  };

  const saveConfiguration = async (nextConfiguration: CanonicalPpeClassConfiguration, successMessage: string) => {
    setSaving(true);
    setError(undefined);
    try {
      const saved = await service.updateCanonicalPpeClassConfiguration(nextConfiguration);
      setConfiguration(saved);
      setNotice(successMessage);
      return saved;
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Configuration Canonical PPE Classes tidak dapat disimpan.");
      return undefined;
    } finally {
      setSaving(false);
    }
  };

  const submitMapping = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configuration || !draft) return;

    const yoloIndex = Number(draft.yoloIndex);
    if (!Number.isInteger(yoloIndex) || yoloIndex < 0) {
      setError("Indeks YOLO harus berupa bilangan bulat nol atau lebih.");
      return;
    }
    if (!draft.rawLabel.trim() || !draft.canonicalPpeClass.trim()) {
      setError("Label mentah dan Canonical PPE Classes wajib diisi.");
      return;
    }
    if (configuration.mappings.some((mapping) => mapping.id !== draft.id && mapping.yoloIndex === yoloIndex)) {
      setError(`Indeks YOLO ${yoloIndex} sudah digunakan.`);
      return;
    }

    const nextMapping: CanonicalPpeClassMapping = {
      id: draft.id ?? createPpeMappingId(configuration.mappings),
      yoloIndex,
      rawLabel: draft.rawLabel.trim(),
      canonicalPpeClass: draft.canonicalPpeClass.trim(),
      complianceCategory: draft.complianceCategory,
      active: draft.active,
    };
    const nextConfiguration = copyCanonicalPpeClassConfiguration(configuration);
    const existingIndex = nextConfiguration.mappings.findIndex((mapping) => mapping.id === nextMapping.id);
    if (existingIndex === -1) nextConfiguration.mappings.push(nextMapping);
    else nextConfiguration.mappings[existingIndex] = nextMapping;

    const saved = await saveConfiguration(nextConfiguration, "Mapping Canonical PPE Classes disimpan.");
    if (saved) setDraft(undefined);
  };

  const selectModelFile = async (file: File | undefined) => {
    if (!file || !configuration) return;
    const nextConfiguration = copyCanonicalPpeClassConfiguration(configuration);
    nextConfiguration.modelFileMetadata = {
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
    };
    await saveConfiguration(nextConfiguration, "Metadata model ONNX demo disimpan.");
  };

  if (error && !configuration) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Canonical PPE Classes</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Configuration Canonical PPE Classes tidak dapat dimuat</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }
  if (!configuration) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Canonical PPE Classes</h1><p className="mt-6 text-slate-600">Loading konfigurasi Canonical PPE Classes…</p></section>;
  }

  const preview = draft ?? createPpeMappingDraft();
  const modelFileMetadata = configuration.modelFileMetadata;
  const yoloIndexError = error?.startsWith("Indeks YOLO") ? error : undefined;

  return (
    <section aria-labelledby="canonical-ppe-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Configuration interpretasi model</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950" id="canonical-ppe-title">Canonical PPE Classes</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Terjemahkan label keluaran model menjadi Canonical PPE Classes yang dapat dipakai konsisten oleh Hazardous Zone.</p></div>
        <Button onClick={() => { setDraft(createPpeMappingDraft()); setError(undefined); setNotice(undefined); }}>Add mapping</Button>
      </div>

      {notice && <p aria-live="polite" className="mt-5 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
      {error && !yoloIndexError && <p aria-live="assertive" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}

      {!phoneLayout && <div className="mt-8 overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Daftar mapping Canonical PPE Classes</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Indeks YOLO</th><th className="px-4 py-3">Label mentah</th><th className="px-4 py-3">Canonical PPE Classes</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Tindakan</span></th></tr></thead>
          <tbody>{configuration.mappings.map((mapping) => <tr className="border-b border-slate-100 last:border-0" key={mapping.id}><td className="px-4 py-3 font-mono text-slate-950">{mapping.yoloIndex}</td><td className="px-4 py-3 font-mono text-slate-700">{mapping.rawLabel}</td><td className="px-4 py-3 font-medium text-slate-950">{mapping.canonicalPpeClass}</td><td className="px-4 py-3">{ppeComplianceCategoryLabel(mapping.complianceCategory)}</td><td className="px-4 py-3">{mapping.active ? "Active" : "Inactive"}</td><td className="px-4 py-3 text-right"><Button onClick={() => { setDraft(createPpeMappingDraft(mapping)); setError(undefined); setNotice(undefined); }} size="sm" variant="outline">Edit mapping {mapping.rawLabel}</Button></td></tr>)}</tbody>
        </table>
      </div>}
      {phoneLayout && <div aria-label="Daftar mapping Canonical PPE Classes untuk ponsel" className="mt-8 space-y-3" role="list">
        {configuration.mappings.map((mapping) => <article aria-label={mapping.rawLabel} className="border border-slate-200 bg-white p-4" key={mapping.id} role="listitem"><dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div><dt className="text-slate-500">Indeks YOLO</dt><dd className="mt-1 font-mono text-slate-950">{mapping.yoloIndex}</dd></div><div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-medium text-slate-950">{mapping.active ? "Active" : "Inactive"}</dd></div><div><dt className="text-slate-500">Label mentah</dt><dd className="mt-1 text-slate-950">{mapping.rawLabel}</dd></div><div><dt className="text-slate-500">Canonical PPE Classes</dt><dd className="mt-1 font-medium text-slate-950">{mapping.canonicalPpeClass}</dd></div><div className="col-span-2"><dt className="text-slate-500">Kategori</dt><dd className="mt-1 text-slate-950">{ppeComplianceCategoryLabel(mapping.complianceCategory)}</dd></div></dl><Button className="mt-4" onClick={() => { setDraft(createPpeMappingDraft(mapping)); setError(undefined); setNotice(undefined); }} size="sm" variant="outline">Edit mapping {mapping.rawLabel}</Button></article>)}
      </div>}

      {draft && <form className="mt-6 border border-slate-200 bg-white p-5 sm:p-6" noValidate onSubmit={(event) => void submitMapping(event)}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-950">{draft.id ? "Edit mapping" : "Add mapping"}</h2><p className="mt-1 text-sm text-slate-600">Setiap indeks YOLO hanya boleh digunakan satu kali.</p></div><Button onClick={() => setDraft(undefined)} type="button" variant="outline">Cancel</Button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-800">Indeks YOLO<input aria-describedby={yoloIndexError ? "yolo-index-error" : undefined} aria-invalid={Boolean(yoloIndexError)} aria-label="Indeks YOLO" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" min="0" onChange={(event) => updateDraft("yoloIndex", event.target.value)} step="1" type="number" value={draft.yoloIndex} />{yoloIndexError && <span className="mt-1 block text-xs font-normal text-red-700" id="yolo-index-error" role="alert">{yoloIndexError}</span>}</label>
          <label className="block text-sm font-medium text-slate-800">Label mentah<input aria-label="Label mentah" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("rawLabel", event.target.value)} value={draft.rawLabel} /></label>
          <label className="block text-sm font-medium text-slate-800">Canonical PPE Classes<input aria-label="Canonical PPE Classes" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("canonicalPpeClass", event.target.value)} value={draft.canonicalPpeClass} /></label>
          <label className="block text-sm font-medium text-slate-800">Interpretation category<select aria-label="Interpretation category" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("complianceCategory", event.target.value as CanonicalPpeClassMapping["complianceCategory"])} value={draft.complianceCategory}><option value="compliance">Compliant</option><option value="violation">Violation</option></select></label>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-800"><input checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} type="checkbox" />Mapping aktif</label>
        <aside aria-label="Preview interpretasi mapping" className="mt-5 border-l-2 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-slate-700"><span className="font-medium">Preview interpretasi: </span>{preview.rawLabel.trim() || "Label mentah"} akan dipahami sebagai <span className="font-medium">{preview.canonicalPpeClass.trim() || "Canonical PPE Classes"}</span> dengan kategori {ppeComplianceCategoryLabel(preview.complianceCategory).toLowerCase()}.</aside>
        <div className="mt-5 flex justify-end"><Button disabled={saving} type="submit">{saving ? "Saving…" : "Save mapping"}</Button></div>
      </form>}

      <section aria-labelledby="onnx-metadata-title" className="mt-6 border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950" id="onnx-metadata-title">Metadata model ONNX</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Pemilih file ini hanya menyimpan name dan metadata demo. Validasi maupun inferensi model ONNX memerlukan backend dan tidak dilakukan di browser.</p>
        <label className="mt-5 block text-sm font-medium text-slate-800">Select file ONNX demo<input accept=".onnx,application/octet-stream" aria-label="Select file ONNX demo" className="mt-1 block w-full text-sm text-slate-700" onChange={(event) => void selectModelFile(event.target.files?.[0])} type="file" /></label>
        {modelFileMetadata && <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3"><div><dt className="text-slate-500">Name file</dt><dd className="mt-1 font-mono text-slate-950">{modelFileMetadata.fileName}</dd></div><div><dt className="text-slate-500">Ukuran</dt><dd className="mt-1 text-slate-950">{Math.round(modelFileMetadata.sizeBytes / 1024)} KB</dd></div><div><dt className="text-slate-500">Tipe</dt><dd className="mt-1 font-mono text-slate-950">{modelFileMetadata.mimeType}</dd></div></dl>}
      </section>
    </section>
  );
}

type HazardousZoneDraft = HazardousZoneInput;
type ZoneDrag = {
  kind: "move" | "resize";
  pointer: { x: number; y: number };
  bounds: NormalizedZoneBounds;
};
type ZoneLifecycleAction = {
  kind: "deactivate" | "delete";
  zone: HazardousZone;
};

const zonePatterns = ["border-amber-300 bg-amber-400/15", "border-sky-300 bg-sky-400/15 border-dashed", "border-violet-300 bg-violet-400/15", "border-emerald-300 bg-emerald-400/15 border-dashed"];

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function normalized(value: number) {
  return Number(value.toFixed(4));
}

function pointInZone(event: React.PointerEvent<HTMLElement>, canvas: HTMLElement) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / rect.width),
    y: clamp((event.clientY - rect.top) / rect.height),
  };
}

function createHazardousZoneDraft(camera: Camera, canonicalClasses: string[]): HazardousZoneDraft {
  return {
    name: "",
    cameraId: camera.id,
    active: true,
    bounds: { x: 0.2, y: 0.2, width: 0.3, height: 0.3 },
    requiredCanonicalPpeClasses: canonicalClasses.slice(0, 1),
    supervisorAreas: [camera.supervisorArea],
  };
}

function copyHazardousZone(zone: HazardousZone): HazardousZoneDraft {
  return {
    ...zone,
    bounds: { ...zone.bounds },
    requiredCanonicalPpeClasses: [...zone.requiredCanonicalPpeClasses],
    supervisorAreas: [...zone.supervisorAreas],
  };
}

export function HazardousZoneEditor({ service }: { service: CameraSourceCapability & HazardousZoneCapability & CanonicalPpeClassCapability }) {
  const [cameras, setCameras] = useState<Camera[]>();
  const [zones, setZones] = useState<HazardousZoneWithViolationHistory[]>();
  const [configuration, setConfiguration] = useState<CanonicalPpeClassConfiguration>();
  const [selectedCameraId, setSelectedCameraId] = useState<string>();
  const [draft, setDraft] = useState<HazardousZoneDraft>();
  const [drag, setDrag] = useState<ZoneDrag>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [zoneStatusFilter, setZoneStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [lifecycleAction, setLifecycleAction] = useState<ZoneLifecycleAction>();
  const [changingLifecycle, setChangingLifecycle] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const phoneZoneEditor = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    let active = true;
    Promise.all([service.getCameras(), service.getHazardousZone(), service.getCanonicalPpeClassConfiguration()])
      .then(([nextCameras, nextZones, nextConfiguration]) => {
        if (!active) return;
        setCameras(nextCameras);
        setZones(nextZones);
        setConfiguration(nextConfiguration);
        setSelectedCameraId(nextCameras[0]?.id);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Hazardous Zone tidak dapat dimuat.");
      });
    return () => {
      active = false;
    };
  }, [service]);

  const selectedCamera = cameras?.find((camera) => camera.id === selectedCameraId);
  const canonicalClasses = [...new Set(configuration?.mappings.filter((mapping) => mapping.active).map((mapping) => mapping.canonicalPpeClass) ?? [])];
  const supervisorAreas = [...new Set(cameras?.map((camera) => camera.supervisorArea) ?? [])];
  const cameraZones = zones?.filter((zone) => zone.cameraId === selectedCameraId && (zoneStatusFilter === "all" || zone.active === (zoneStatusFilter === "active"))) ?? [];
  const draftZone = draft?.id ? zones?.find((zone) => zone.id === draft.id) : undefined;

  const updateDraft = <Field extends keyof HazardousZoneDraft>(field: Field, value: HazardousZoneDraft[Field]) => {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setError(undefined);
  };

  const setBounds = (bounds: NormalizedZoneBounds) => updateDraft("bounds", bounds);

  const openDraft = (zone?: HazardousZone) => {
    if (!selectedCamera || !configuration) return;
    setDraft(zone ? copyHazardousZone(zone) : createHazardousZoneDraft(selectedCamera, canonicalClasses));
    setError(undefined);
    setNotice(undefined);
  };

  const toggleSelection = (field: "requiredCanonicalPpeClasses" | "supervisorAreas", value: string) => {
    setDraft((current) => {
      if (!current) return current;
      const values = current[field];
      return { ...current, [field]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] };
    });
    setError(undefined);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(undefined);
    try {
      const saved = await service.saveHazardousZone(draft);
      setZones((current) => {
        const existing = current?.findIndex((zone) => zone.id === saved.id) ?? -1;
        if (existing === -1) return [...(current ?? []), saved];
        return current!.map((zone) => zone.id === saved.id ? saved : zone);
      });
      setDraft(undefined);
      setNotice(`Hazardous Zone ${saved.name} disimpan.`);
      setCameras(await service.getCameras());
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Hazardous Zone tidak dapat disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const confirmLifecycleAction = async () => {
    if (!lifecycleAction) return;
    setChangingLifecycle(true);
    setError(undefined);
    try {
      if (lifecycleAction.kind === "deactivate") {
        const saved = await service.deactivateHazardousZone(lifecycleAction.zone.id);
        setZones((current) => current?.map((zone) => zone.id === saved.id ? saved : zone));
        setNotice(`Hazardous Zone ${saved.name} dinonaktifkan.`);
      } else {
        await service.deleteHazardousZone(lifecycleAction.zone.id);
        setZones((current) => current?.filter((zone) => zone.id !== lifecycleAction.zone.id));
        setNotice(`Hazardous Zone ${lifecycleAction.zone.name} dihapus permanen.`);
      }
      setDraft(undefined);
      setCameras(await service.getCameras());
      setLifecycleAction(undefined);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Lifecycle Hazardous Zone tidak dapat diperbarui.");
    } finally {
      setChangingLifecycle(false);
    }
  };

  const beginDrawing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draft || draft.id || !selectedCamera || phoneZoneEditor) return;
    const point = pointInZone(event, event.currentTarget);
    setBounds({ x: point.x, y: point.y, width: 0.01, height: 0.01 });
    setDrag({ kind: "resize", pointer: point, bounds: { x: point.x, y: point.y, width: 0.01, height: 0.01 } });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const movePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draft || !drag || phoneZoneEditor) return;
    const point = pointInZone(event, event.currentTarget);
    if (drag.kind === "move") {
      const deltaX = point.x - drag.pointer.x;
      const deltaY = point.y - drag.pointer.y;
      setBounds({ ...drag.bounds, x: normalized(clamp(drag.bounds.x + deltaX, 0, 1 - drag.bounds.width)), y: normalized(clamp(drag.bounds.y + deltaY, 0, 1 - drag.bounds.height)) });
      return;
    }
    setBounds({ ...drag.bounds, width: normalized(clamp(point.x - drag.bounds.x, 0.01, 1 - drag.bounds.x)), height: normalized(clamp(point.y - drag.bounds.y, 0.01, 1 - drag.bounds.y)) });
  };

  if (error && !cameras) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Hazardous Zones</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Hazardous Zones could not be loaded</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }
  if (!cameras || !zones || !configuration || !selectedCamera) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Hazardous Zones</h1><p className="mt-6 text-slate-600">Loading Zone Editor…</p></section>;
  }

  return (
    <section aria-labelledby="hazardous-zones-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational configuration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950" id="hazardous-zones-title">Hazardous Zones</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Configure PPE coverage on a simulated Camera Source frame. Coordinates are stored in normalized form so they remain consistent at every screen size.</p></div>
        <Button onClick={() => openDraft()}>Add Hazardous Zone</Button>
      </div>
      {notice && <p aria-live="polite" className="mt-5 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
      {error && <p aria-live="assertive" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}

      <label className="mt-8 block max-w-md text-sm font-medium text-slate-800">Select Camera Sources<select aria-label="Select Camera Source" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setSelectedCameraId(event.target.value); setDraft(undefined); setError(undefined); }} value={selectedCamera.id}>{cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name} · {camera.location}</option>)}</select></label>
      <label className="mt-4 block max-w-md text-sm font-medium text-slate-800">Filter status<select aria-label="Filter Hazardous Zone status" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setZoneStatusFilter(event.target.value as "all" | "active" | "inactive")} value={zoneStatusFilter}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <section aria-label={`Frame Zone Editor ${selectedCamera.name}`} className="overflow-hidden border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3 text-sm text-slate-200"><span className="font-medium">{selectedCamera.name}</span><span className="font-mono text-xs text-slate-400">{selectedCamera.id}</span></div>
          <div aria-disabled={phoneZoneEditor} aria-label="Hazardous Zone canvas" className="relative aspect-video touch-none overflow-hidden bg-slate-900" onPointerDown={beginDrawing} onPointerMove={movePointer} onPointerUp={() => setDrag(undefined)} ref={canvasRef}>
            <img alt="Illustration of a fictional industrial area for the Hazardous Zone editor" className="pointer-events-none h-full w-full object-cover" src={industrialMonitoringScene} />
            <span className="absolute right-4 top-4 border border-amber-300 bg-slate-950/90 px-2 py-1 font-mono text-[10px] font-medium tracking-[0.12em] text-amber-200">SIMULASI</span>
            {cameraZones.map((zone, index) => {
              const displayedZone = draft?.id === zone.id ? draft : zone;
              return <div className={`absolute border-2 ${zonePatterns[index % zonePatterns.length]} pointer-events-none md:pointer-events-auto`} key={zone.id} style={{ left: `${displayedZone.bounds.x * 100}%`, top: `${displayedZone.bounds.y * 100}%`, width: `${displayedZone.bounds.width * 100}%`, height: `${displayedZone.bounds.height * 100}%` }}><button aria-label={`Move ${zone.name}`} className="absolute inset-0 w-full cursor-move text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" onClick={() => openDraft(zone)} onPointerDown={(event) => { event.stopPropagation(); const point = pointInZone(event, canvasRef.current ?? event.currentTarget); setDraft(copyHazardousZone(zone)); setDrag({ kind: "move", pointer: point, bounds: zone.bounds }); event.currentTarget.setPointerCapture?.(event.pointerId); }} type="button"><span className="absolute -top-6 left-0 whitespace-nowrap bg-slate-950/90 px-2 py-1 text-xs font-medium text-white">{zone.name}</span><span className="sr-only">Move zone with pointer.</span></button><button aria-label={`Resize ${zone.name}`} className="absolute -bottom-1 -right-1 z-10 size-3 cursor-se-resize border border-white bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" onPointerDown={(event) => { event.stopPropagation(); setDraft(copyHazardousZone(zone)); setDrag({ kind: "resize", pointer: { x: 0, y: 0 }, bounds: zone.bounds }); event.currentTarget.setPointerCapture?.(event.pointerId); }} type="button"><span className="sr-only">Resize zone</span></button></div>;
            })}
            {draft && !draft.id && <div aria-label="New Hazardous Zone" className="pointer-events-none absolute border-2 border-dashed border-amber-300 bg-amber-400/15" style={{ left: `${draft.bounds.x * 100}%`, top: `${draft.bounds.y * 100}%`, width: `${draft.bounds.width * 100}%`, height: `${draft.bounds.height * 100}%` }} />}
          </div>
          <p className="border-t border-slate-700 px-4 py-3 text-xs leading-5 text-slate-300"><span className="hidden md:inline">Draw a new zone, or drag an existing zone to move it.</span><span className="md:hidden">On a phone, the frame is view-only. Use the coordinate inputs below.</span></p>
        </section>
        <aside className="border border-slate-200 bg-white p-5"><h2 className="text-lg font-semibold text-slate-950">Zones in frame</h2><p className="mt-1 text-sm text-slate-600">{cameraZones.length} zones configured.</p><div className="mt-5 space-y-3">{cameraZones.map((zone, index) => <article aria-label={zone.name} className="border border-slate-200 p-3" key={zone.id}><div className="flex items-start gap-2"><span aria-hidden="true" className={`mt-1 size-3 border-2 ${zonePatterns[index % zonePatterns.length]}`} /><div><p className="font-medium text-slate-950">{zone.name}</p><p className="mt-1 text-xs text-slate-600">{zone.active ? "Active" : "Inactive"} · {zone.requiredCanonicalPpeClasses.join(", ")}</p></div></div><Button className="mt-3" onClick={() => openDraft(zone)} size="sm" variant="outline">Edit {zone.name}</Button></article>)}</div></aside>
      </div>

      {draft && <form className="mt-6 border border-slate-200 bg-white p-5 sm:p-6" noValidate onSubmit={(event) => void save(event)}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-950">{draft.id ? "Edit Hazardous Zone" : "Add Hazardous Zone"}</h2><p className="mt-1 text-sm text-slate-600">Assign PPE and a Area Supervisor before saving the zone.</p></div><Button onClick={() => setDraft(undefined)} type="button" variant="outline">Cancel</Button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-800">Hazardous Zone name<input aria-label="Hazardous Zone name" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("name", event.target.value)} value={draft.name} /></label><label className="block text-sm font-medium text-slate-800">Camera Source<select aria-label="Hazardous Zone Camera Source" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("cameraId", event.target.value)} value={draft.cameraId}>{cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}</select></label></div>
        <fieldset className="mt-5"><legend className="text-sm font-medium text-slate-800">Required PPE</legend><div className="mt-2 flex flex-wrap gap-3">{canonicalClasses.map((item) => <label className="inline-flex items-center gap-2 text-sm text-slate-800" key={item}><input checked={draft.requiredCanonicalPpeClasses.includes(item)} onChange={() => toggleSelection("requiredCanonicalPpeClasses", item)} type="checkbox" />{item}</label>)}</div></fieldset>
        <fieldset className="mt-5"><legend className="text-sm font-medium text-slate-800">Area Supervisor</legend><div className="mt-2 flex flex-wrap gap-3">{supervisorAreas.map((item) => <label className="inline-flex items-center gap-2 text-sm text-slate-800" key={item}><input checked={draft.supervisorAreas.includes(item)} onChange={() => toggleSelection("supervisorAreas", item)} type="checkbox" />{item}</label>)}</div></fieldset>
        {draft.id ? <p className="mt-5 text-sm text-slate-700">Current status: <span className="font-medium">{draftZone?.active ? "Active" : "Inactive"}</span>. Use the lifecycle action below to deactivate this Hazardous Zone.</p> : <label className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-800"><input checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} type="checkbox" />Active Hazardous Zone</label>}
        <fieldset className="mt-5"><legend className="text-sm font-medium text-slate-800">Normalized coordinates <span className="font-normal text-slate-500">(0–1)</span></legend><div className="mt-2 grid gap-3 grid-cols-2 sm:grid-cols-4">{(["x", "y", "width", "height"] as const).map((field) => <label className="text-xs font-medium text-slate-600" key={field}>{field === "x" ? "X" : field === "y" ? "Y" : field === "width" ? "Width" : "Height"}<input aria-label={`Coordinate ${field}`} className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" max="1" min="0" onChange={(event) => setBounds({ ...draft.bounds, [field]: Number(event.target.value) })} step="0.01" type="number" value={draft.bounds[field]} /></label>)}</div></fieldset>
        {draftZone && <section aria-label="Hazardous Zone lifecycle" className="mt-6 border-t border-slate-200 pt-5"><h3 className="font-medium text-slate-950">Hazardous Zone lifecycle</h3><p className="mt-1 text-sm leading-6 text-slate-600">Deactivation is the primary action: the Hazardous Zone remains stored so its audit and configuration context can be traced.</p>{draftZone.active ? <Button className="mt-4" onClick={() => setLifecycleAction({ kind: "deactivate", zone: draftZone })} type="button" variant="outline">Deactivate Hazardous Zone</Button> : <p className="mt-4 text-sm font-medium text-slate-700">This Hazardous Zone is already inactive.</p>}{draftZone.hasViolationHistory ? <p className="mt-4 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-700">This Hazardous Zone has Violation History and cannot be permanently deleted, in accordance with ADR-0002.</p> : <div className="mt-4"><p className="text-sm leading-6 text-slate-600">This zone has no Violation History and can be permanently deleted.</p><Button className="mt-3" onClick={() => setLifecycleAction({ kind: "delete", zone: draftZone })} type="button" variant="outline">Permanently delete Hazardous Zone</Button></div>}</section>}
        <div className="mt-6 flex justify-end"><Button disabled={saving} type="submit">{saving ? "Saving…" : "Save Hazardous Zone"}</Button></div>
      </form>}
      {lifecycleAction && <AccessibleDialog label={`${lifecycleAction.kind === "deactivate" ? "Confirm deactivation" : "Confirm deletion"} ${lifecycleAction.zone.name}`} onDismiss={() => setLifecycleAction(undefined)}><div className="w-full max-w-lg border border-slate-200 bg-white p-6 shadow-xl"><h2 className="text-xl font-semibold text-slate-950">{lifecycleAction.kind === "deactivate" ? "Deactivate Hazardous Zone?" : "Permanently delete Hazardous Zone?"}</h2><p className="mt-3 text-sm leading-6 text-slate-700">{lifecycleAction.kind === "deactivate" ? `Hazardous Zone ${lifecycleAction.zone.name} is no longer used by active monitoring, but remains available in configuration and retains its audit context.` : `Hazardous Zone ${lifecycleAction.zone.name} will be removed from configuration and its Camera Source. This action cannot be undone.`}</p><div className="mt-6 flex justify-end gap-3"><Button data-dialog-initial-focus disabled={changingLifecycle} onClick={() => setLifecycleAction(undefined)} type="button" variant="outline">Cancel</Button><Button disabled={changingLifecycle} onClick={() => void confirmLifecycleAction()} type="button">{changingLifecycle ? "Processing…" : lifecycleAction.kind === "deactivate" ? "Confirm deactivation" : "Confirm permanent deletion"}</Button></div></div></AccessibleDialog>}
    </section>
  );
}
