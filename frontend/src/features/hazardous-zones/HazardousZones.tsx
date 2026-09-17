import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Filter,
  Info,
  Layers,
  Move,
  Plus,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sliders,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import industrialMonitoringScene from "../../assets/industrial-monitoring.svg";
import { Button } from "../../components/ui/button";
import {
  useDeactivateHazardousZoneMutation,
  useDeleteHazardousZoneMutation,
  useHazardousZonesQuery,
  useSaveHazardousZoneMutation,
  type HazardousZoneService,
} from "../../hooks/queries/useHazardousZonesQuery";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
import { AccessibleDialog } from "../../shared/AccessibleDialog";
import { useMediaQuery } from "../../shared/useMediaQuery";
import { useHazardousZoneStore, type ZoneStatusFilter } from "../../stores/useHazardousZoneStore";
import type {
  Camera as CameraType,
  HazardousZone,
  HazardousZoneInput,
  NormalizedPoint,
  NormalizedZoneBounds,
} from "../../services/saw-service";

type HazardousZoneDraft = HazardousZoneInput;
type ZoneDrag =
  | {
      kind: "point";
      index: number;
    }
  | {
      kind: "move-polygon";
      startPointer: { x: number; y: number };
      startPoints: NormalizedPoint[];
    };
type ZoneLifecycleAction = {
  kind: "deactivate" | "delete";
  zone: HazardousZone;
};

const zoneStyles = [
  {
    border: "border-amber-400/90",
    bg: "bg-amber-400/20",
    svgFill: "rgba(251, 191, 36, 0.22)",
    svgStroke: "#fbbf24",
    text: "text-amber-300",
    badge: "bg-amber-500/20 text-amber-200 border-amber-400/40",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  },
  {
    border: "border-sky-400/90 border-dashed",
    bg: "bg-sky-400/20",
    svgFill: "rgba(56, 189, 248, 0.22)",
    svgStroke: "#38bdf8",
    text: "text-sky-300",
    badge: "bg-sky-500/20 text-sky-200 border-sky-400/40",
    dot: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]",
  },
  {
    border: "border-violet-400/90",
    bg: "bg-violet-400/20",
    svgFill: "rgba(167, 139, 250, 0.22)",
    svgStroke: "#a78bfa",
    text: "text-violet-300",
    badge: "bg-violet-500/20 text-violet-200 border-violet-400/40",
    dot: "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]",
  },
  {
    border: "border-emerald-400/90 border-dashed",
    bg: "bg-emerald-400/20",
    svgFill: "rgba(52, 211, 153, 0.22)",
    svgStroke: "#34d399",
    text: "text-emerald-300",
    badge: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
  },
];

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function normalized(value: number) {
  return Number(value.toFixed(4));
}

function pointInZone(event: React.PointerEvent<Element>, canvas: Element) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / rect.width),
    y: clamp((event.clientY - rect.top) / rect.height),
  };
}

function getZonePoints(zone: { bounds: NormalizedZoneBounds; points?: NormalizedPoint[] }): NormalizedPoint[] {
  if (zone.points && zone.points.length >= 3) {
    return zone.points;
  }
  const { x, y, width, height } = zone.bounds;
  return [
    { x: normalized(x), y: normalized(y) },
    { x: normalized(clamp(x + width)), y: normalized(y) },
    { x: normalized(clamp(x + width)), y: normalized(clamp(y + height)) },
    { x: normalized(x), y: normalized(clamp(y + height)) },
  ];
}

function computeBoundsFromPoints(points: NormalizedPoint[]): NormalizedZoneBounds {
  if (points.length === 0) return { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.max(0, Math.min(...xs));
  const maxX = Math.min(1, Math.max(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxY = Math.min(1, Math.max(...ys));
  return {
    x: normalized(minX),
    y: normalized(minY),
    width: normalized(Math.max(0.01, maxX - minX)),
    height: normalized(Math.max(0.01, maxY - minY)),
  };
}

function createHazardousZoneDraft(
  camera: CameraType,
  canonicalClasses: string[],
): HazardousZoneDraft {
  const points: NormalizedPoint[] = [
    { x: 0.2, y: 0.2 },
    { x: 0.5, y: 0.2 },
    { x: 0.5, y: 0.5 },
    { x: 0.2, y: 0.5 },
  ];
  return {
    name: "",
    cameraId: camera.id,
    active: true,
    bounds: computeBoundsFromPoints(points),
    points,
    requiredCanonicalPpeClasses: canonicalClasses.slice(0, 1),
    supervisorAreas: [camera.supervisorArea],
  };
}

function copyHazardousZone(zone: HazardousZone): HazardousZoneDraft {
  const points = getZonePoints(zone).map((p) => ({ ...p }));
  return {
    ...zone,
    bounds: { ...zone.bounds },
    points,
    requiredCanonicalPpeClasses: [...zone.requiredCanonicalPpeClasses],
    supervisorAreas: [...zone.supervisorAreas],
  };
}

export type HazardousZonesProps = {
  service?: HazardousZoneService;
};

function HazardousZonesContent({ service }: HazardousZonesProps) {
  const {
    cameras,
    zones,
    configuration,
    isLoading,
    error: queryError,
  } = useHazardousZonesQuery({ service });

  const saveMutation = useSaveHazardousZoneMutation({ service });
  const deactivateMutation = useDeactivateHazardousZoneMutation({ service });
  const deleteMutation = useDeleteHazardousZoneMutation({ service });

  const selectedCameraId = useHazardousZoneStore((state) => state.selectedCameraId);
  const setSelectedCameraId = useHazardousZoneStore((state) => state.setSelectedCameraId);
  const zoneStatusFilter = useHazardousZoneStore((state) => state.zoneStatusFilter);
  const setZoneStatusFilter = useHazardousZoneStore((state) => state.setZoneStatusFilter);

  const [draft, setDraft] = useState<HazardousZoneDraft>();
  const [drag, setDrag] = useState<ZoneDrag>();
  const [localError, setLocalError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [lifecycleAction, setLifecycleAction] = useState<ZoneLifecycleAction>();
  const canvasRef = useRef<HTMLDivElement>(null);
  const phoneZoneEditor = useMediaQuery("(max-width: 767px)");

  const effectiveCameraId =
    selectedCameraId && cameras?.some((c) => c.id === selectedCameraId)
      ? selectedCameraId
      : cameras?.[0]?.id;

  const selectedCamera = cameras?.find((camera) => camera.id === effectiveCameraId);
  const canonicalClasses = [
    ...new Set(
      configuration?.mappings
        .filter((mapping) => mapping.active)
        .map((mapping) => mapping.canonicalPpeClass) ?? [],
    ),
  ];
  const supervisorAreas = [...new Set(cameras?.map((camera) => camera.supervisorArea) ?? [])];
  const cameraZones =
    zones?.filter(
      (zone) =>
        zone.cameraId === effectiveCameraId &&
        (zoneStatusFilter === "all" || zone.active === (zoneStatusFilter === "active")),
    ) ?? [];
  const draftZone = draft?.id ? zones?.find((zone) => zone.id === draft.id) : undefined;
  const error = localError || queryError?.message;

  const draftPoints = draft ? getZonePoints(draft) : [];

  const updateDraft = <Field extends keyof HazardousZoneDraft>(
    field: Field,
    value: HazardousZoneDraft[Field],
  ) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
    setLocalError(undefined);
  };

  const updatePoints = (newPoints: NormalizedPoint[]) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        points: newPoints,
        bounds: computeBoundsFromPoints(newPoints),
      };
    });
    setLocalError(undefined);
  };

  const updatePoint = (index: number, key: "x" | "y", value: number) => {
    if (!draft) return;
    const points = getZonePoints(draft);
    const newPoints = points.map((pt, i) =>
      i === index ? { ...pt, [key]: normalized(clamp(value, 0, 1)) } : pt,
    );
    updatePoints(newPoints);
  };

  const addPointAtEdge = (edgeIndex: number) => {
    if (!draft) return;
    const points = getZonePoints(draft);
    const p1 = points[edgeIndex];
    const p2 = points[(edgeIndex + 1) % points.length];
    const newPt: NormalizedPoint = {
      x: normalized((p1.x + p2.x) / 2),
      y: normalized((p1.y + p2.y) / 2),
    };
    const newPoints = [
      ...points.slice(0, edgeIndex + 1),
      newPt,
      ...points.slice(edgeIndex + 1),
    ];
    updatePoints(newPoints);
  };

  const removePoint = (index: number) => {
    if (!draft) return;
    const points = getZonePoints(draft);
    if (points.length <= 3) {
      setLocalError("A polygon zone requires at least 3 points.");
      return;
    }
    const newPoints = points.filter((_, i) => i !== index);
    updatePoints(newPoints);
  };

  const addPoint = () => {
    if (!draft) return;
    const points = getZonePoints(draft);
    const last = points[points.length - 1];
    const first = points[0];
    const newPt: NormalizedPoint = {
      x: normalized(clamp((last.x + first.x) / 2 + 0.05, 0, 1)),
      y: normalized(clamp((last.y + first.y) / 2 + 0.05, 0, 1)),
    };
    updatePoints([...points, newPt]);
  };

  const resetToBox = () => {
    if (!draft) return;
    const boxPoints: NormalizedPoint[] = [
      { x: 0.2, y: 0.2 },
      { x: 0.5, y: 0.2 },
      { x: 0.5, y: 0.5 },
      { x: 0.2, y: 0.5 },
    ];
    updatePoints(boxPoints);
  };

  const openDraft = (zone?: HazardousZone) => {
    if (!selectedCamera || !configuration) return;
    setDraft(
      zone
        ? copyHazardousZone(zone)
        : createHazardousZoneDraft(selectedCamera, canonicalClasses),
    );
    setLocalError(undefined);
    setNotice(undefined);
  };

  const toggleSelection = (
    field: "requiredCanonicalPpeClasses" | "supervisorAreas",
    value: string,
  ) => {
    setDraft((current) => {
      if (!current) return current;
      const values = current[field];
      return {
        ...current,
        [field]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
    setLocalError(undefined);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    setLocalError(undefined);
    try {
      const points = getZonePoints(draft);
      const bounds = computeBoundsFromPoints(points);
      const payload: HazardousZoneDraft = {
        ...draft,
        points,
        bounds,
      };
      const saved = await saveMutation.mutateAsync(payload);
      setDraft(undefined);
      setNotice(`Hazardous Zone ${saved.name} saved.`);
    } catch (reason: unknown) {
      setLocalError(
        reason instanceof Error ? reason.message : "Hazardous Zone could not be saved.",
      );
    }
  };

  const confirmLifecycleAction = async () => {
    if (!lifecycleAction) return;
    setLocalError(undefined);
    try {
      if (lifecycleAction.kind === "deactivate") {
        const saved = await deactivateMutation.mutateAsync(lifecycleAction.zone.id);
        setNotice(`Hazardous Zone ${saved.name} deactivated.`);
      } else {
        await deleteMutation.mutateAsync(lifecycleAction.zone.id);
        setNotice(`Hazardous Zone ${lifecycleAction.zone.name} permanently deleted.`);
      }
      setDraft(undefined);
      setLifecycleAction(undefined);
    } catch (reason: unknown) {
      setLocalError(
        reason instanceof Error
          ? reason.message
          : "Hazardous Zone lifecycle could not be updated.",
      );
    }
  };

  const movePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draft || !drag || phoneZoneEditor) return;
    const point = pointInZone(event, canvasRef.current ?? event.currentTarget);
    const currentPoints = getZonePoints(draft);

    if (drag.kind === "point") {
      const updated = currentPoints.map((pt, i) =>
        i === drag.index
          ? { x: normalized(clamp(point.x, 0, 1)), y: normalized(clamp(point.y, 0, 1)) }
          : pt,
      );
      updatePoints(updated);
      return;
    }

    if (drag.kind === "move-polygon") {
      const deltaX = point.x - drag.startPointer.x;
      const deltaY = point.y - drag.startPointer.y;

      const minX = Math.min(...drag.startPoints.map((p) => p.x));
      const maxX = Math.max(...drag.startPoints.map((p) => p.x));
      const minY = Math.min(...drag.startPoints.map((p) => p.y));
      const maxY = Math.max(...drag.startPoints.map((p) => p.y));

      const clampedDeltaX = clamp(deltaX, -minX, 1 - maxX);
      const clampedDeltaY = clamp(deltaY, -minY, 1 - maxY);

      const updated = drag.startPoints.map((pt) => ({
        x: normalized(clamp(pt.x + clampedDeltaX, 0, 1)),
        y: normalized(clamp(pt.y + clampedDeltaY, 0, 1)),
      }));

      updatePoints(updated);
    }
  };

  const saving = saveMutation.isPending;
  const changingLifecycle = deactivateMutation.isPending || deleteMutation.isPending;

  if (error && !cameras) {
    return (
      <section aria-live="polite">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
            <ShieldAlert className="size-3.5 text-amber-600" />
            Operational Configuration
          </span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
          Hazardous Zones
        </h1>
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-rose-600 shrink-0" />
            <p className="font-semibold text-rose-900">Hazardous Zones could not be loaded</p>
          </div>
          <p className="mt-2 text-sm text-rose-800">{error}</p>
        </div>
      </section>
    );
  }

  if (isLoading || !cameras || !zones || !configuration || !selectedCamera) {
    return (
      <section aria-busy="true" aria-live="polite">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
            <ShieldAlert className="size-3.5 text-amber-600" />
            Operational Configuration
          </span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
          Hazardous Zones
        </h1>
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 shadow-xs">
          <div className="size-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium">Loading Zone Editor…</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="hazardous-zones-title" className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
              <ShieldAlert className="size-3.5 text-amber-600" />
              Operational configuration
            </span>
          </div>
          <h1
            className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950"
            id="hazardous-zones-title"
          >
            Hazardous Zones
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
            Configure PPE coverage on a simulated Camera Source frame. Coordinates are stored
            in normalized form so they remain consistent at every screen size.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-medium text-emerald-900 shadow-2xs"
          role="status"
        >
          <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
          <p>{notice}</p>
        </div>
      )}
      {error && (
        <div
          aria-live="assertive"
          className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-sm font-medium text-rose-900 shadow-2xs"
          role="alert"
        >
          <AlertTriangle className="size-5 text-rose-600 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Modern Control Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end">
          {/* Camera Source Selector */}
          <div className="lg:col-span-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select Camera Source
            </label>
            <div className="relative mt-1.5 flex items-center">
              <Camera className="absolute left-3.5 size-4 text-slate-400 pointer-events-none" />
              <select
                aria-label="Select Camera Source"
                className="block h-10 w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-sm font-medium text-slate-900 transition-colors hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/80"
                onChange={(event) => {
                  setSelectedCameraId(event.target.value);
                  setDraft(undefined);
                  setLocalError(undefined);
                }}
                value={selectedCamera.id}
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.name} · {camera.location}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 size-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Filter Status Selector */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Filter status
            </label>
            <div className="relative mt-1.5 flex items-center">
              <Filter className="absolute left-3.5 size-4 text-slate-400 pointer-events-none" />
              <select
                aria-label="Filter Hazardous Zone status"
                className="block h-10 w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-sm font-medium text-slate-900 transition-colors hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/80"
                onChange={(event) => setZoneStatusFilter(event.target.value as ZoneStatusFilter)}
                value={zoneStatusFilter}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3.5 size-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Feed Live Status Indicator */}
          <div className="sm:col-span-2 lg:col-span-2 flex items-center lg:justify-end">
            <div className="inline-flex w-full lg:w-auto items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                {cameraZones.length} Zones
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Frame Editor & Zones List */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* CCTV Vision Simulation Frame */}
        <section
          aria-label={`Frame Zone Editor ${selectedCamera.name}`}
          className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl"
        >
          {/* Surveillance HUD Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950 px-4 py-3 text-sm text-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-md bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-400 border border-rose-500/30">
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                LIVE 1080P
              </span>
              <span className="font-semibold text-slate-100">{selectedCamera.name}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-md bg-slate-800/80 px-2 py-0.5 font-mono text-xs text-slate-400">
                {selectedCamera.id}
              </span>
              <span className="rounded-full border border-amber-400/80 bg-amber-400/10 px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-widest text-amber-200">
                SIMULATION
              </span>
              {!draft ? (
                <Button
                  className="h-7.5 gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-xs"
                  onClick={() => openDraft()}
                  size="sm"
                >
                  <Plus className="size-3.5" />
                  Add Hazardous Zone
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-amber-300 border border-amber-400/30">
                    EDITING ({draftPoints.length} PTS)
                  </span>
                  <Button
                    className="h-7 text-xs text-slate-300 hover:text-white"
                    onClick={() => setDraft(undefined)}
                    size="sm"
                    variant="ghost"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Polygon Controls Ribbon (active during draft) */}
          {draft && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/90 px-4 py-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-400">Polygon Controls:</span>
                <span className="text-slate-400 hidden sm:inline">
                  Drag numbered points to adjust, or click (+) on edges to insert points
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="h-7 gap-1 border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
                  onClick={addPoint}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Plus className="size-3" />
                  Add Point
                </Button>
                <Button
                  className="h-7 gap-1 border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
                  onClick={resetToBox}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Reset to Box
                </Button>
              </div>
            </div>
          )}

          {/* Canvas Area */}
          <div
            aria-disabled={phoneZoneEditor}
            aria-label="Hazardous Zone canvas"
            className="relative aspect-video touch-none overflow-hidden bg-slate-900 select-none"
            onPointerCancel={phoneZoneEditor ? undefined : () => setDrag(undefined)}
            onPointerMove={phoneZoneEditor ? undefined : movePointer}
            onPointerUp={phoneZoneEditor ? undefined : () => setDrag(undefined)}
            ref={canvasRef}
          >
            <img
              alt="Illustration of a fictional industrial area for the Hazardous Zone editor"
              className="pointer-events-none h-full w-full object-cover"
              src={industrialMonitoringScene}
            />

            {/* SVG Polygon Layers */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              {/* Configured Zones (non-draft) */}
              {cameraZones.map((zone, index) => {
                if (draft?.id === zone.id) return null;
                const points = getZonePoints(zone);
                const svgPoints = points
                  .map((p) => `${p.x * 100},${p.y * 100}`)
                  .join(" ");
                const style = zoneStyles[index % zoneStyles.length];
                return (
                  <polygon
                    className="pointer-events-auto cursor-pointer transition-colors hover:fill-opacity-40"
                    fill={style.svgFill}
                    key={zone.id}
                    onClick={() => openDraft(zone)}
                    points={svgPoints}
                    stroke={style.svgStroke}
                    strokeDasharray={zone.active ? undefined : "2,1.5"}
                    strokeWidth="0.5"
                  />
                );
              })}

              {/* Draft Polygon Shape */}
              {draft && (
                <polygon
                  className="pointer-events-auto cursor-move"
                  fill="rgba(245, 158, 11, 0.28)"
                  onPointerDown={(event) => {
                    if (phoneZoneEditor) return;
                    event.stopPropagation();
                    const point = pointInZone(
                      event,
                      canvasRef.current ?? event.currentTarget,
                    );
                    setDrag({
                      kind: "move-polygon",
                      startPointer: point,
                      startPoints: draftPoints.map((p) => ({ ...p })),
                    });
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                  }}
                  points={draftPoints
                    .map((p) => `${p.x * 100},${p.y * 100}`)
                    .join(" ")}
                  stroke="#f59e0b"
                  strokeDasharray="1.5,1"
                  strokeWidth="0.75"
                />
              )}
            </svg>

            {/* Non-draft Zone Label Badges */}
            {cameraZones.map((zone) => {
              if (draft?.id === zone.id) return null;
              const points = getZonePoints(zone);
              const minY = Math.min(...points.map((p) => p.y));
              const topPoint = points.find((p) => p.y === minY) ?? points[0];
              return (
                <div
                  className="pointer-events-auto absolute -translate-y-full -translate-x-2"
                  key={`label-${zone.id}`}
                  style={{
                    left: `${topPoint.x * 100}%`,
                    top: `${topPoint.y * 100}%`,
                  }}
                >
                  <button
                    aria-label={`Select ${zone.name}`}
                    className="mb-1 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-slate-950/90 px-2 py-0.5 text-xs font-medium text-white shadow-md backdrop-blur-xs border border-slate-700/80 hover:border-amber-400 transition-colors"
                    disabled={phoneZoneEditor}
                    onClick={() => openDraft(zone)}
                    type="button"
                  >
                    <span
                      className={`size-1.5 rounded-full ${zone.active ? "bg-emerald-400" : "bg-slate-400"}`}
                    />
                    {zone.name}
                  </button>
                </div>
              );
            })}

            {/* Draft Interactive Handles */}
            {draft && (
              <>
                {/* Draft Badge */}
                {(() => {
                  const minY = Math.min(...draftPoints.map((p) => p.y));
                  const topPoint = draftPoints.find((p) => p.y === minY) ?? draftPoints[0];
                  return (
                    <div
                      className="pointer-events-none absolute -translate-y-full -translate-x-2 z-30"
                      style={{
                        left: `${topPoint.x * 100}%`,
                        top: `${topPoint.y * 100}%`,
                      }}
                    >
                      <span className="mb-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-slate-950 shadow-lg">
                        <Move className="size-3" />
                        {draft.name || (draft.id ? "Edit Zone" : "New Zone")} ({draftPoints.length} pts)
                      </span>
                    </div>
                  );
                })()}

                {/* Vertex Draggable Handles */}
                {draftPoints.map((p, i) => (
                  <button
                    aria-label={`Move point ${i + 1}`}
                    className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing focus-visible:outline-none z-20"
                    disabled={phoneZoneEditor}
                    key={`vertex-${i}`}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setDrag({ kind: "point", index: i });
                      event.currentTarget.setPointerCapture?.(event.pointerId);
                    }}
                    style={{
                      left: `${p.x * 100}%`,
                      top: `${p.y * 100}%`,
                    }}
                    type="button"
                  >
                    <span className="flex size-5 sm:size-6 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[11px] font-black text-slate-950 shadow-md transition-transform group-hover:scale-125 group-hover:bg-amber-400">
                      {i + 1}
                    </span>
                  </button>
                ))}

                {/* Edge Midpoint Insert Handles (+) */}
                {draftPoints.map((p, i) => {
                  const nextP = draftPoints[(i + 1) % draftPoints.length];
                  const midX = (p.x + nextP.x) / 2;
                  const midY = (p.y + nextP.y) / 2;
                  return (
                    <button
                      aria-label={`Insert point after point ${i + 1}`}
                      className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 z-10"
                      disabled={phoneZoneEditor}
                      key={`edge-${i}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        addPointAtEdge(i);
                      }}
                      style={{
                        left: `${midX * 100}%`,
                        top: `${midY * 100}%`,
                      }}
                      type="button"
                    >
                      <span className="flex size-4.5 items-center justify-center rounded-full border border-amber-300 bg-slate-950/90 text-amber-300 text-xs font-bold shadow-md opacity-80 group-hover:opacity-100 transition-all group-hover:scale-125 group-hover:bg-amber-500 group-hover:text-slate-950">
                        +
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Console Guidance Bar */}
          <div className="flex flex-wrap items-center gap-4 border-t border-slate-800/80 bg-slate-950 px-4 py-3 text-xs text-slate-300">
            {draft ? (
              <>
                <span className="hidden md:inline-flex items-center gap-2">
                  <Move className="size-3.5 text-amber-400" />
                  <span>Drag numbered points to reshape the polygon, or drag inside to move the zone.</span>
                </span>
                <span className="hidden md:inline-flex items-center gap-2">
                  <Plus className="size-3.5 text-amber-400" />
                  <span>Click (+) on any edge to insert a new vertex point.</span>
                </span>
              </>
            ) : (
              <span className="hidden md:inline-flex items-center gap-2">
                <Move className="size-3.5 text-amber-400" />
                <span>Click "Add Hazardous Zone" or select an existing zone to view & edit its polygon points.</span>
              </span>
            )}
            <span className="md:hidden inline-flex items-center gap-2 text-amber-300">
              <Info className="size-3.5 text-amber-400" />
              <span>On a phone, the frame is view-only. Use the point coordinates list below.</span>
            </span>
          </div>
        </section>

        {/* Zones in Frame Aside */}
        <aside className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-200/60">
                <Layers className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">Zones in frame</h2>
                <p className="text-xs text-slate-500">{cameraZones.length} zones configured.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto max-h-[520px] pr-1">
            {cameraZones.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <Layers className="mx-auto size-8 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-700">No zones configured</p>
                <p className="mt-1 text-xs text-slate-500">
                  Add a hazardous zone or draw polygon points to set up protection areas.
                </p>
                <Button
                  className="mt-3.5 gap-1.5 bg-amber-500 font-medium text-slate-950 shadow-xs hover:bg-amber-400 text-xs"
                  onClick={() => openDraft()}
                  size="sm"
                >
                  <Plus className="size-3.5" />
                  Add Hazardous Zone
                </Button>
              </div>
            ) : (
              cameraZones.map((zone, index) => {
                const style = zoneStyles[index % zoneStyles.length];
                return (
                  <article
                    aria-label={zone.name}
                    className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/40 p-3.5 transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs"
                    key={zone.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true" className={`size-2.5 rounded-full ${style.dot}`} />
                        <p className="font-semibold text-slate-950 text-sm">{zone.name}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          zone.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                            : "bg-slate-100 text-slate-600 border-slate-200/80"
                        }`}
                      >
                        {zone.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {zone.requiredCanonicalPpeClasses.map((ppe) => (
                        <span
                          className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/80"
                          key={ppe}
                        >
                          <Shield className="size-3 text-slate-400" />
                          {ppe}
                        </span>
                      ))}
                    </div>

                    <Button
                      className="mt-3.5 w-full justify-center gap-1.5 shadow-2xs group-hover:border-slate-300"
                      onClick={() => openDraft(zone)}
                      size="sm"
                      variant="outline"
                    >
                      <Sliders className="size-3.5 text-slate-500" />
                      Edit {zone.name}
                    </Button>
                  </article>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* Draft Editor Form */}
      {draft && (
        <form
          className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm"
          noValidate
          onSubmit={(event) => void save(event)}
        >
          {/* Form Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800 ring-1 ring-amber-200/60">
                <Sliders className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  {draft.id ? "Edit Hazardous Zone" : "Add Hazardous Zone"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Assign PPE and a Area Supervisor before saving the zone.
                </p>
              </div>
            </div>
            <Button
              className="gap-1.5"
              onClick={() => setDraft(undefined)}
              type="button"
              variant="outline"
            >
              <X className="size-4" />
              Cancel
            </Button>
          </div>

          {/* Form Inputs Grid */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Hazardous Zone name
              </label>
              <input
                aria-label="Hazardous Zone name"
                className="mt-1.5 block h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-medium text-slate-900 transition-colors hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/80"
                onChange={(event) => updateDraft("name", event.target.value)}
                placeholder="e.g. Main Gate Zone"
                value={draft.name}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Camera Source
              </label>
              <div className="relative mt-1.5 flex items-center">
                <Camera className="absolute left-3.5 size-4 text-slate-400 pointer-events-none" />
                <select
                  aria-label="Hazardous Zone Camera Source"
                  className="block h-10 w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-sm font-medium text-slate-900 transition-colors hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/80"
                  onChange={(event) => updateDraft("cameraId", event.target.value)}
                  value={draft.cameraId}
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.name} · {camera.location}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 size-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Required PPE Selection */}
          <fieldset className="mt-6">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Required PPE
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              {canonicalClasses.map((item) => {
                const isSelected = draft.requiredCanonicalPpeClasses.includes(item);
                return (
                  <label
                    className={`cursor-pointer inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/80 text-amber-900 ring-1 ring-amber-500/80 shadow-2xs"
                        : "border-slate-200/80 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60"
                    }`}
                    key={item}
                  >
                    <input
                      checked={isSelected}
                      className="sr-only"
                      onChange={() => toggleSelection("requiredCanonicalPpeClasses", item)}
                      type="checkbox"
                    />
                    <span
                      className={`flex size-4 items-center justify-center rounded border ${
                        isSelected
                          ? "border-amber-600 bg-amber-500 text-slate-950"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </span>
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Area Supervisor Selection */}
          <fieldset className="mt-6">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Area Supervisor
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              {supervisorAreas.map((item) => {
                const isSelected = draft.supervisorAreas.includes(item);
                return (
                  <label
                    className={`cursor-pointer inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/80 text-amber-900 ring-1 ring-amber-500/80 shadow-2xs"
                        : "border-slate-200/80 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60"
                    }`}
                    key={item}
                  >
                    <input
                      checked={isSelected}
                      className="sr-only"
                      onChange={() => toggleSelection("supervisorAreas", item)}
                      type="checkbox"
                    />
                    <span
                      className={`flex size-4 items-center justify-center rounded border ${
                        isSelected
                          ? "border-amber-600 bg-amber-500 text-slate-950"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </span>
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Active Status Toggle */}
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            {draft.id ? (
              <p className="text-sm text-slate-700">
                Current status:{" "}
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold border ${
                    draftZone?.active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                      : "bg-slate-100 text-slate-600 border-slate-200/80"
                  }`}
                >
                  {draftZone?.active ? "Active" : "Inactive"}
                </span>
                . Use the lifecycle action below to deactivate this Hazardous Zone.
              </p>
            ) : (
              <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-800 cursor-pointer">
                <input
                  checked={draft.active}
                  className="size-4.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  onChange={(event) => updateDraft("active", event.target.checked)}
                  type="checkbox"
                />
                <span>Active Hazardous Zone</span>
              </label>
            )}
          </div>

          {/* Polygon Vertices / Points Editor */}
          <fieldset className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <legend className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Polygon Vertices <span className="font-normal text-slate-500">({draftPoints.length} points)</span>
                </legend>
                <p className="mt-0.5 text-xs text-slate-500">
                  Adjust coordinate points (0.00–1.00) or add/remove vertices to customize the hazard zone shape.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="h-8 gap-1.5 text-xs"
                  onClick={addPoint}
                  type="button"
                  variant="outline"
                >
                  <Plus className="size-3.5" />
                  Add Point
                </Button>
                <Button
                  className="h-8 gap-1.5 text-xs text-slate-600"
                  onClick={resetToBox}
                  type="button"
                  variant="outline"
                >
                  Reset to Box
                </Button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {draftPoints.map((pt, i) => (
                <div
                  className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 shadow-2xs"
                  key={`point-input-${i}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span className="flex size-4.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">
                        {i + 1}
                      </span>
                      Point {i + 1}
                    </span>
                    {draftPoints.length > 3 && (
                      <button
                        aria-label={`Delete Point ${i + 1}`}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => removePoint(i)}
                        title="Delete Point"
                        type="button"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block font-medium text-slate-500">
                        X <span className="font-mono text-[10px]">({Math.round(pt.x * 100)}%)</span>
                      </label>
                      <input
                        aria-label={`Point ${i + 1} X coordinate`}
                        className="mt-1 block h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        max="1"
                        min="0"
                        onChange={(e) => updatePoint(i, "x", Number(e.target.value))}
                        step="0.01"
                        type="number"
                        value={pt.x}
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-500">
                        Y <span className="font-mono text-[10px]">({Math.round(pt.y * 100)}%)</span>
                      </label>
                      <input
                        aria-label={`Point ${i + 1} Y coordinate`}
                        className="mt-1 block h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        max="1"
                        min="0"
                        onChange={(e) => updatePoint(i, "y", Number(e.target.value))}
                        step="0.01"
                        type="number"
                        value={pt.y}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bounding Envelope Info */}
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Calculated Bounding Box:</span>
              <span className="font-mono text-slate-500">
                X: {draft.bounds.x} · Y: {draft.bounds.y} · Width: {draft.bounds.width} · Height: {draft.bounds.height}
              </span>
            </div>
          </fieldset>

          {/* Lifecycle Action Section */}
          {draftZone && (
            <section
              aria-label="Hazardous Zone lifecycle"
              className="mt-8 rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="size-5 text-amber-700" />
                <h3 className="font-semibold text-slate-950 text-base">
                  Hazardous Zone lifecycle
                </h3>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Deactivation is the primary action: the Hazardous Zone remains stored so
                its audit and configuration context can be traced.
              </p>
              {draftZone.active ? (
                <Button
                  className="mt-4 gap-2"
                  onClick={() =>
                    setLifecycleAction({ kind: "deactivate", zone: draftZone })
                  }
                  type="button"
                  variant="outline"
                >
                  <RotateCcw className="size-4 text-slate-500" />
                  Deactivate Hazardous Zone
                </Button>
              ) : (
                <p className="mt-4 text-sm font-medium text-slate-700">
                  This Hazardous Zone is already inactive.
                </p>
              )}
              {draftZone.hasViolationHistory ? (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border-l-4 border-amber-500 bg-amber-50/80 p-3.5 text-sm leading-6 text-amber-900">
                  <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    This Hazardous Zone has Violation History and cannot be permanently
                    deleted, in accordance with ADR-0002.
                  </p>
                </div>
              ) : (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-sm leading-6 text-slate-600">
                    This zone has no Violation History and can be permanently deleted.
                  </p>
                  <Button
                    className="mt-3 gap-2 hover:border-rose-300 hover:text-rose-700"
                    onClick={() =>
                      setLifecycleAction({ kind: "delete", zone: draftZone })
                    }
                    type="button"
                    variant="outline"
                  >
                    <Trash2 className="size-4 text-rose-500" />
                    Permanently delete Hazardous Zone
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Form Action Buttons */}
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button
              disabled={saving}
              onClick={() => setDraft(undefined)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-500 font-medium text-slate-950 shadow-xs hover:bg-amber-400"
              disabled={saving}
              type="submit"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Saving…</span>
                </span>
              ) : (
                "Save Hazardous Zone"
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Accessible Lifecycle Confirmation Dialog */}
      {lifecycleAction && (
        <AccessibleDialog
          label={`${lifecycleAction.kind === "deactivate" ? "Confirm deactivation" : "Confirm deletion"} ${lifecycleAction.zone.name}`}
          onDismiss={() => setLifecycleAction(undefined)}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-amber-50/50 p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                    lifecycleAction.kind === "deactivate"
                      ? "bg-amber-100 text-amber-800 ring-amber-200/60"
                      : "bg-rose-100 text-rose-800 ring-rose-200/60"
                  }`}
                >
                  {lifecycleAction.kind === "deactivate" ? (
                    <RotateCcw className="size-5" />
                  ) : (
                    <Trash2 className="size-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-950">
                    {lifecycleAction.kind === "deactivate"
                      ? "Deactivate Hazardous Zone?"
                      : "Permanently delete Hazardous Zone?"}
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-amber-800">
                    Zone: {lifecycleAction.zone.name}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {lifecycleAction.kind === "deactivate"
                  ? `Hazardous Zone ${lifecycleAction.zone.name} is no longer used by active monitoring, but remains available in configuration and retains its audit context.`
                  : `Hazardous Zone ${lifecycleAction.zone.name} will be removed from configuration and its Camera Source. This action cannot be undone.`}
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 bg-slate-50/50 p-4 sm:px-6">
              <Button
                className="w-full sm:w-auto justify-center"
                data-dialog-initial-focus
                disabled={changingLifecycle}
                onClick={() => setLifecycleAction(undefined)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className={`w-full sm:w-auto justify-center gap-2 ${
                  lifecycleAction.kind === "deactivate"
                    ? "bg-amber-500 font-semibold text-slate-950 hover:bg-amber-400 shadow-xs"
                    : "bg-rose-600 font-semibold text-white hover:bg-rose-700 shadow-xs"
                }`}
                disabled={changingLifecycle}
                onClick={() => void confirmLifecycleAction()}
                type="button"
              >
                {changingLifecycle ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Processing…</span>
                  </span>
                ) : lifecycleAction.kind === "deactivate" ? (
                  "Confirm deactivation"
                ) : (
                  "Confirm permanent deletion"
                )}
              </Button>
            </div>
          </div>
        </AccessibleDialog>
      )}
    </section>
  );
}

export function HazardousZones(props: HazardousZonesProps) {
  return (
    <EnsureQueryClient>
      <HazardousZonesContent {...props} />
    </EnsureQueryClient>
  );
}
