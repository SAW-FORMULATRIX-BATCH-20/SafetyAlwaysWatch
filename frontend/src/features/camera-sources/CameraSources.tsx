import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Camera as CameraIcon,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Radio,
  RotateCcw,
  Search,
  Shield,
  X,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import type { Persona } from "../../application/personas";
import { formatWib } from "../../shared/formatters";
import type { Camera, CameraMetadata, CameraStatus, HazardousZone } from "../../services/saw-service";
import {
  useCameraSourcesQuery,
  useUpdateCameraMetadataMutation,
  type CameraSourceService,
} from "../../hooks/queries/useCameraSourcesQuery";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
import { AccessibleDialog } from "../../shared/AccessibleDialog";
import { useCameraSourceStore } from "../../stores/useCameraSourceStore";
import { useAuthStore } from "../../stores/useAuthStore";

const cameraStatusDetails: Record<
  CameraStatus,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
    pulse: boolean;
  }
> = {
  online: {
    label: "Active",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
    dotClass: "bg-emerald-500",
    pulse: true,
  },
  degraded: {
    label: "Degraded",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/90",
    dotClass: "bg-amber-500",
    pulse: false,
  },
  offline: {
    label: "Offline",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    dotClass: "bg-slate-400",
    pulse: false,
  },
};

function ConnectionStatus({ status }: { status: CameraStatus }) {
  const { label, badgeClass, dotClass, pulse } = cameraStatusDetails[status];

  return (
    <span
      aria-label={`Connection status: ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide shadow-2xs ${badgeClass}`}
    >
      <span className="relative flex size-2">
        {pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotClass}`} />
        )}
        <span className={`relative inline-flex size-2 rounded-full ${dotClass}`} />
      </span>
      {label}
    </span>
  );
}

function CameraDetails({
  camera,
  canEdit,
  notice,
  onDismissNotice,
  onSaved,
  onClose,
  zones,
}: {
  camera: Camera;
  canEdit: boolean;
  notice?: string;
  onDismissNotice?: () => void;
  onSaved: (metadata: CameraMetadata) => void;
  onClose: () => void;
  zones: HazardousZone[];
}) {
  const [draft, setDraft] = useState<CameraMetadata>({ name: camera.name, location: camera.location });
  const [validationError, setValidationError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDraft({ name: camera.name, location: camera.location });
    setValidationError(undefined);
  }, [camera.id, camera.name, camera.location]);

  const updateDraft = (field: keyof CameraMetadata, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setValidationError(undefined);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.location.trim()) {
      setValidationError("Camera Source name and location are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSaved({ name: draft.name.trim(), location: draft.location.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  const linkedZones = zones.filter((zone) => camera.zoneIds.includes(zone.id));

  return (
    <AccessibleDialog label={`Camera Source Details - ${camera.name}`} onDismiss={onClose}>
      <section
        aria-labelledby="camera-detail-title"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <CameraIcon aria-hidden="true" className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-950" id="camera-detail-title">
                  Camera Source Details
                </h2>
                <ConnectionStatus status={camera.status} />
              </div>
              <p className="font-mono text-xs text-slate-500">
                ID: {camera.id} · {camera.supervisorArea}
              </p>
            </div>
          </div>
          <button
            aria-label="Close details"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-5">
          {notice && (
            <div
              aria-live="polite"
              className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-sm font-medium text-emerald-900 shadow-2xs"
              role="status"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <span>{notice}</span>
              </div>
              {onDismissNotice && (
                <button
                  aria-label="Dismiss notice"
                  className="rounded p-1 text-emerald-700 hover:bg-emerald-100"
                  onClick={onDismissNotice}
                  type="button"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}

          {canEdit ? (
            <form className="space-y-4" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-800">
                  Camera Source name
                  <input
                    aria-label="Camera Source name"
                    className="mt-1.5 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-2xs transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    onChange={(event) => updateDraft("name", event.target.value)}
                    value={draft.name}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-800">
                  Location
                  <input
                    aria-label="Location"
                    className="mt-1.5 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-2xs transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    onChange={(event) => updateDraft("location", event.target.value)}
                    value={draft.location}
                  />
                </label>
              </div>

              {validationError && (
                <div
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  role="alert"
                >
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    className="bg-amber-400 font-medium text-slate-950 hover:bg-amber-300 shadow-xs ring-2 ring-amber-400/30"
                    disabled={isSubmitting}
                    type="submit"
                    variant="primary"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving…
                      </span>
                    ) : (
                      "Save metadata demo"
                    )}
                  </Button>
                  <Button
                    disabled={isSubmitting || (draft.name === camera.name && draft.location === camera.location)}
                    onClick={() => setDraft({ name: camera.name, location: camera.location })}
                    type="button"
                    variant="outline"
                  >
                    Reset draft
                  </Button>
                </div>
            
              </div>
            </form>
          ) : (
            <div>
              <dl className="grid gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Camera Source name</dt>
                  <dd className="mt-1 text-base font-semibold text-slate-950">{camera.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Location</dt>
                  <dd className="mt-1 text-base font-medium text-slate-950">{camera.location}</dd>
                </div>
              </dl>
              
            </div>
          )}

          {/* Specifications & Audit Specs */}
          <dl className="grid gap-3.5 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Source ID</dt>
              <dd className="mt-1 font-mono text-sm font-semibold text-slate-950">{camera.id}</dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Area Supervisor scope</dt>
              <dd className="mt-1 font-medium text-slate-950">{camera.supervisorArea}</dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Related Hazardous Zones</dt>
              <dd className="mt-1 font-medium text-slate-950">{camera.zoneIds.join(", ")}</dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Latest update</dt>
              <dd className="mt-1 font-mono text-xs text-slate-950">{formatWib(camera.lastUpdatedAt)}</dd>
            </div>
          </dl>

          {/* Linked Hazardous Zones list */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Associated Hazardous Zones Status
            </p>
            <ul aria-label="Hazardous Zone status" className="mt-2.5 flex flex-wrap gap-2 text-sm">
              {linkedZones.length > 0 ? (
                linkedZones.map((zone) => (
                  <li
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
                      zone.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                    key={zone.id}
                  >
                    <Shield className="size-3.5" />
                    <span>
                      {zone.name} · {zone.active ? "Active" : "Inactive"}
                    </span>
                    <span className={`size-1.5 rounded-full ${zone.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                  </li>
                ))
              ) : (
                <li className="text-xs italic text-slate-400">No active hazardous zones assigned.</li>
              )}
            </ul>
          </div>

          <p className="rounded-md border-l-3 border-amber-500 bg-amber-50/60 p-3 text-xs leading-5 text-slate-600">
            Connection details show only safe demo metadata. Sensitive streaming credentials and RTSP secrets are strictly
            masked.
          </p>
        </div>
      </section>
    </AccessibleDialog>
  );
}

function CameraCard({
  camera,
  isSelected,
  onSelect,
  zones,
}: {
  camera: Camera;
  isSelected: boolean;
  onSelect: () => void;
  zones: HazardousZone[];
}) {
  const linkedZones = zones.filter((zone) => camera.zoneIds.includes(zone.id));

  return (
    <article
      aria-label={camera.name}
      className={`group flex flex-col rounded-xl border bg-white shadow-2xs transition-all duration-200 hover:shadow-md ${
        isSelected ? "border-amber-500 ring-2 ring-amber-500/50 shadow-sm" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* CCTV Mock Feed Header */}
      <div className="flex items-center justify-between rounded-t-xl bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-800 text-amber-400">
            <CameraIcon aria-hidden="true" className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-white">{camera.name}</h2>
            </div>
            <p className="font-mono text-[11px] text-slate-400">{camera.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center rounded-sm bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
            1080p · 25 FPS
          </span>
          <ConnectionStatus status={camera.status} />
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5">
        <dl className="grid gap-3.5 text-sm sm:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <span>
              <dt className="text-xs font-medium text-slate-500">Location</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{camera.location}</dd>
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Radio aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <span>
              <dt className="text-xs font-medium text-slate-500">Supervisor Area</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{camera.supervisorArea}</dd>
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <span>
              <dt className="text-xs font-medium text-slate-500">Latest update</dt>
              <dd className="mt-0.5 font-mono text-xs text-slate-900">{formatWib(camera.lastUpdatedAt)}</dd>
            </span>
          </div>
        </dl>

        {/* Linked Hazardous Zones chips */}
        <div className="mt-4 border-t border-slate-100 pt-3.5">
          <div className="flex items-center justify-between">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Related Hazardous Zones</dt>
            <dd className="font-mono text-xs text-slate-400">{camera.zoneIds.length} observed</dd>
          </div>
          {camera.zoneIds.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {camera.zoneIds.map((zoneId) => {
                const matchedZone = linkedZones.find((z) => z.id === zoneId);
                return (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${
                      matchedZone?.active
                        ? "border-amber-200 bg-amber-50/80 text-amber-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                    key={zoneId}
                  >
                    <Shield className="size-3" />
                    <span>{matchedZone?.name ?? zoneId}</span>
                    {matchedZone && (
                      <span
                        className={`size-1.5 rounded-full ${
                          matchedZone.active ? "bg-amber-500" : "bg-slate-400"
                        }`}
                      />
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="mt-1.5 text-xs italic text-slate-400">No zones linked to this source</p>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-5 flex items-center justify-between border-t border-slate-100">
          <Button
            aria-label={`View details ${camera.name}`}
            className={`w-full sm:w-auto transition-all ${
              isSelected
                ? "bg-amber-400 font-medium text-slate-950 hover:bg-amber-300 shadow-xs ring-2 ring-amber-400/50"
                : "hover:border-amber-400 hover:text-amber-800"
            }`}
            onClick={onSelect}
            variant={isSelected ? "primary" : "outline"}
          >
            View details
          </Button>
          {isSelected && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
              <Check className="size-3.5" /> Selected
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export type CameraSourcesProps = {
  persona?: Persona;
  service?: CameraSourceService;
};

function CameraSourcesContent({ persona: propPersona, service: propService }: CameraSourcesProps) {
  const authPersona = useAuthStore((state) => state.persona);
  const persona = propPersona ?? authPersona;

  const { cameras, zones, isLoading, error } = useCameraSourcesQuery({ persona, service: propService });
  const updateMetadataMutation = useUpdateCameraMetadataMutation({ service: propService });

  const searchTerm = useCameraSourceStore((state) => state.searchTerm);
  const setSearchTerm = useCameraSourceStore((state) => state.setSearchTerm);
  const statusFilter = useCameraSourceStore((state) => state.statusFilter);
  const setStatusFilter = useCameraSourceStore((state) => state.setStatusFilter);
  const selectedCameraId = useCameraSourceStore((state) => state.selectedCameraId);
  const setSelectedCameraId = useCameraSourceStore((state) => state.setSelectedCameraId);
  const notice = useCameraSourceStore((state) => state.notice);
  const setNotice = useCameraSourceStore((state) => state.setNotice);
  const resetStore = useCameraSourceStore((state) => state.reset);

  const filteredCameras = (cameras ?? []).filter((camera) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [camera.name, camera.location, camera.id, ...camera.zoneIds].some((value) =>
        value.toLowerCase().includes(query),
      );
    return matchesSearch && (statusFilter === "all" || camera.status === statusFilter);
  });
  const selectedCamera = cameras?.find((camera) => camera.id === selectedCameraId);

  const saveMetadata = async (camera: Camera, metadata: CameraMetadata) => {
    await updateMetadataMutation.mutateAsync({ id: camera.id, metadata });
    setNotice("Camera Source metadata updated.");
  };

  if (error) {
    return (
      <section aria-live="polite">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Camera Sources</h1>
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50/90 p-6" role="alert">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Camera Sources could not be loaded.</p>
              {error.message !== "Camera Sources could not be loaded." && (
                <p className="mt-1 text-sm text-red-800">{error.message}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading || cameras === undefined || zones === undefined) {
    return (
      <section aria-busy="true" aria-live="polite">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Camera Sources</h1>
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="size-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading Camera Sources…</p>
        </div>
      </section>
    );
  }

  const canEdit = persona?.role === "admin";

  const onlineCount = cameras.filter((c) => c.status === "online").length;
  const degradedCount = cameras.filter((c) => c.status === "degraded").length;
  const offlineCount = cameras.filter((c) => c.status === "offline").length;

  return (
    <section className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational configuration</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-950">Camera Sources</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
            Monitor pilot video sources, locations, observed zones, and data freshness.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-2xs">
          <CameraIcon aria-hidden="true" className="size-4 text-amber-600" />
          {cameras.length} sources registered
        </span>
      </div>

      {/* KPI Stats Quick-Filters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
            statusFilter === "all"
              ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 shadow-2xs"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
          }`}
          onClick={() => setStatusFilter("all")}
          type="button"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">All Sources</span>
          <span className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">{cameras.length}</span>
          <span className="mt-1 text-[11px] text-slate-500">100% total fleet</span>
        </button>

        <button
          className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
            statusFilter === "online"
              ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-2xs"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
          }`}
          onClick={() => setStatusFilter(statusFilter === "online" ? "all" : "online")}
          type="button"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">Active</span>
            <span className="size-2 rounded-full bg-emerald-500" />
          </div>
          <span className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-950">{onlineCount}</span>
          <span className="mt-1 text-[11px] text-emerald-700">Streaming normally</span>
        </button>

        <button
          className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
            statusFilter === "degraded"
              ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 shadow-2xs"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
          }`}
          onClick={() => setStatusFilter(statusFilter === "degraded" ? "all" : "degraded")}
          type="button"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-700">Degraded</span>
            <span className="size-2 rounded-full bg-amber-500" />
          </div>
          <span className="mt-1.5 text-2xl font-bold tracking-tight text-amber-950">{degradedCount}</span>
          <span className="mt-1 text-[11px] text-amber-700">Frame drops or latency</span>
        </button>

        <button
          className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
            statusFilter === "offline"
              ? "border-slate-500 bg-slate-100 ring-1 ring-slate-500 shadow-2xs"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
          }`}
          onClick={() => setStatusFilter(statusFilter === "offline" ? "all" : "offline")}
          type="button"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-600">Offline</span>
            <span className="size-2 rounded-full bg-slate-400" />
          </div>
          <span className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">{offlineCount}</span>
          <span className="mt-1 text-[11px] text-slate-500">Needs technician visit</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
          <label className="block text-sm font-medium text-slate-800">
            Search Camera Sources
            <div className="relative mt-1.5">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-400"
              />
              <input
                aria-label="Search Camera Source"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 text-sm text-slate-900 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Name, location, ID, or zone"
                value={searchTerm}
              />
              {searchTerm && (
                <button
                  aria-label="Clear search"
                  className="absolute right-2.5 top-2.5 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  onClick={() => setSearchTerm("")}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </label>

          <label className="block text-sm font-medium text-slate-800">
            Filter status
            <select
              aria-label="Filter status"
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              onChange={(event) => setStatusFilter(event.target.value as CameraStatus | "all")}
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="online">Active</option>
              <option value="degraded">Degraded</option>
              <option value="offline">Offline</option>
            </select>
          </label>

          {(searchTerm || statusFilter !== "all") && (
            <div className="flex items-end">
              <Button
                className="h-10 gap-1.5 text-slate-700 hover:text-slate-900"
                onClick={() => {
                  resetStore();
                }}
                type="button"
                variant="outline"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results counter */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <p>Showing {filteredCameras.length} of {cameras.length} Camera Sources</p>
        {(searchTerm || statusFilter !== "all") && (
          <span className="text-xs font-medium text-amber-700">Filter applied</span>
        )}
      </div>

      {/* Status Notice on main page */}
      {notice && !selectedCamera && (
        <div
          aria-live="polite"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-medium text-emerald-900 shadow-2xs"
          role="status"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button
            aria-label="Dismiss notice"
            className="rounded p-1 text-emerald-700 hover:bg-emerald-100"
            onClick={() => setNotice(undefined)}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Camera Grid or Empty states */}
      {cameras.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <CameraIcon className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-900">No Camera Sources are registered</p>
          <p className="mt-1 text-sm text-slate-600">Add Camera Sources to start monitoring coverage.</p>
        </div>
      ) : filteredCameras.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Search className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-900">No Camera Sources match.</p>
          <p className="mt-1 text-sm text-slate-600">Change the search term or status filter.</p>
          <Button
            className="mt-4"
            onClick={() => {
              resetStore();
            }}
            variant="outline"
          >
            Clear active filters
          </Button>
        </div>
      ) : (
        <div aria-label="Camera Source list" className="grid gap-5 xl:grid-cols-2" role="list">
          {filteredCameras.map((camera) => (
            <CameraCard
              camera={camera}
              isSelected={selectedCameraId === camera.id}
              key={camera.id}
              onSelect={() => setSelectedCameraId(camera.id)}
              zones={zones}
            />
          ))}
        </div>
      )}

      {/* Selected Camera Details in Pop-up Modal */}
      {selectedCamera && (
        <CameraDetails
          camera={selectedCamera}
          canEdit={canEdit}
          key={selectedCamera.id}
          notice={notice}
          onClose={() => setSelectedCameraId(undefined)}
          onDismissNotice={() => setNotice(undefined)}
          onSaved={(metadata) => void saveMetadata(selectedCamera, metadata)}
          zones={zones}
        />
      )}
    </section>
  );
}

export function CameraSources(props: CameraSourcesProps) {
  return (
    <EnsureQueryClient>
      <CameraSourcesContent {...props} />
    </EnsureQueryClient>
  );
}
