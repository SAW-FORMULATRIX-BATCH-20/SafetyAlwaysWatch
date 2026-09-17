import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle2,
  Clock3,
  EyeOff,
  Layers,
  LayoutGrid,
  MapPin,
  Maximize2,
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Tv,
  UserX,
  WifiOff,
} from "lucide-react";

import type { Persona } from "../../application/personas";
import industrialMonitoringScene from "../../assets/industrial-monitoring.svg";
import { Button } from "../../components/ui/button";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
import type { Camera as CameraType, MonitoringScenario } from "../../services/saw-service";
import { formatWib } from "../../shared/formatters";
import {
  useLiveMonitoringQuery,
  useProcessMonitoringFrameMutation,
  useSelectMonitoringScenarioMutation,
  type LiveMonitoringService,
} from "../../hooks/queries/useLiveMonitoringQuery";
import { useLiveMonitoringStore } from "../../stores/useLiveMonitoringStore";

const episodeLabels = {
  candidate: "Pending Confirmation",
  confirmed: "Violation",
  clearing: "Clearing",
  cleared: "Cleared",
} as const;

export function LiveMonitoring({
  persona,
  service,
}: {
  persona: Persona;
  service: LiveMonitoringService;
}) {
  return (
    <EnsureQueryClient>
      <LiveMonitoringContent persona={persona} service={service} />
    </EnsureQueryClient>
  );
}

function LiveMonitoringContent({
  persona,
  service,
}: {
  persona: Persona;
  service: LiveMonitoringService;
}) {
  const {
    cameras,
    zones,
    simulation,
    settings,
    notificationLogs,
    isLoading,
    isError,
  } = useLiveMonitoringQuery({ persona, service });

  const selectScenarioMutation = useSelectMonitoringScenarioMutation({ service });
  const processFrameMutation = useProcessMonitoringFrameMutation({ service });

  const selectedCameraId = useLiveMonitoringStore((state) => state.selectedCameraId);
  const setSelectedCameraId = useLiveMonitoringStore((state) => state.setSelectedCameraId);
  const notificationFeed = useLiveMonitoringStore((state) => state.notificationFeed);
  const setNotificationFeed = useLiveMonitoringStore((state) => state.setNotificationFeed);
  const viewMode = useLiveMonitoringStore((state) => state.viewMode);
  const setViewMode = useLiveMonitoringStore((state) => state.setViewMode);
  const showSimulator = useLiveMonitoringStore((state) => state.showSimulator);
  const setShowSimulator = useLiveMonitoringStore((state) => state.setShowSimulator);
  const toggleSimulator = useLiveMonitoringStore((state) => state.toggleSimulator);

  const [activeScenario, setActiveScenario] = useState<MonitoringScenario>("normal");

  useEffect(() => {
    return () => {
      useLiveMonitoringStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    if (!cameras || !simulation) return;
    setSelectedCameraId((current) =>
      current && cameras.some((camera: CameraType) => camera.id === current)
        ? current
        : cameras.some((camera: CameraType) => camera.id === simulation.cameraId)
        ? simulation.cameraId
        : cameras[0]?.id,
    );
  }, [cameras, simulation, setSelectedCameraId]);

  useEffect(() => {
    if (
      simulation?.eventId &&
      simulation.scoreChange?.crossedEscalationThreshold &&
      notificationLogs
    ) {
      const recipientCount = notificationLogs.filter(
        (log) => log.violationId === simulation.eventId,
      ).length;
      setNotificationFeed(
        `Violation Event ${simulation.eventId}: ${recipientCount} simulated recipients recorded.`,
      );
    }
  }, [simulation, notificationLogs, setNotificationFeed]);

  const selectScenario = async (scenario: MonitoringScenario) => {
    setActiveScenario(scenario);
    const next = await selectScenarioMutation.mutateAsync(scenario);
    if (cameras?.some((camera) => camera.id === next.cameraId)) {
      setSelectedCameraId(next.cameraId);
    }
  };

  const processFrame = async (isCompliant: boolean, confidence = 0.96) => {
    if (!settings || !simulation) return;
    const elapsedSeconds =
      simulation.episodeStatus === "candidate"
        ? settings.confirmThresholdSeconds
        : settings.clearThresholdSeconds;
    const next = await processFrameMutation.mutateAsync({
      confidence,
      isCompliant,
      elapsedSeconds,
    });
    if (next.eventId && next.scoreChange?.crossedEscalationThreshold) {
      const logs = await service.getNotificationSimulationLogs();
      const recipientCount = logs.filter((log) => log.violationId === next.eventId).length;
      setNotificationFeed(
        `Violation Event ${next.eventId}: ${recipientCount} simulated recipients recorded.`,
      );
    }
  };

  if (isError) {
    return (
      <section aria-live="polite">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live Monitoring</h1>
        <div className="mt-6 border border-red-200 bg-red-50 p-6 rounded-xl">
          <p className="font-medium text-red-900">Live Monitoring could not be loaded.</p>
          <p className="mt-1 text-sm text-red-800">Please try again.</p>
        </div>
      </section>
    );
  }

  if (isLoading || !cameras || !zones || !simulation || !settings) {
    return (
      <section aria-busy="true" aria-live="polite">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live Monitoring</h1>
        <p className="mt-6 text-slate-600">Loading Live Monitoring…</p>
      </section>
    );
  }

  const selectedCamera = cameras.find((camera) => camera.id === selectedCameraId);
  if (!selectedCamera) {
    return (
      <section aria-live="polite">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live Monitoring</h1>
        <div className="mt-6 border border-dashed border-slate-300 bg-white p-6 rounded-xl">
          <p className="font-medium text-slate-900">No Camera Sources in your scope</p>
          <p className="mt-1 text-sm text-slate-600">
            Select an assigned area with a Camera Source to start monitoring.
          </p>
        </div>
      </section>
    );
  }

  const displayed = simulation.cameraId === selectedCamera.id ? simulation : undefined;
  const offline = selectedCamera.status === "offline" || displayed?.state === "offline";
  const hasClearedEpisode = displayed?.state === "episode" && displayed.episodeStatus === "cleared";
  const activeEpisode = displayed?.state === "episode" && !hasClearedEpisode;
  const activeZoneIds = selectedCamera.zoneIds.filter((zoneId) =>
    zones.some((zone) => zone.id === zoneId && zone.active),
  );

  return (
    <section className="space-y-6">
      {/* Header Bar with Level-Wide Controls */}
      <div className="border-b border-slate-200/80 pb-5 space-y-2">
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-900">
              <Activity className="h-3 w-3 text-amber-700" />
              Operational Monitoring
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-mono">
              <Radio className="h-3 w-3 text-emerald-600 animate-pulse" />
              Real-Time Feed
            </span>
          </div>

          {showSimulator ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 font-mono text-xs font-semibold tracking-wider text-amber-950 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              SIMULATION MODE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 font-mono text-xs font-semibold tracking-wider text-emerald-950 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE PRODUCTION
            </span>
          )}
        </div>

        {/* Title and Controls Row (Aligned side-by-side on desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Live Monitoring</h1>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600">
              {showSimulator
                ? "Simulated monitoring of Hazardous Zones and Detected Persons without a real camera or RTSP connection."
                : "Real-time production surveillance feed monitoring Hazardous Zones and Detected Personnel across active facility cameras."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
            {/* View Mode Switcher placed directly to the right of Live Monitoring title on desktop */}
            <div
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/90 p-1 shadow-2xs"
              role="group"
              aria-label="Layout view mode"
            >
              <button
                type="button"
                onClick={() => setViewMode("single")}
                aria-label="Single camera view"
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === "single"
                    ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                }`}
              >
                <Tv className="h-3.5 w-3.5 text-slate-700" />
                Single View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Multi-camera grid view"
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5 text-slate-700" />
                Grid View ({cameras.length})
              </button>
            </div>

            {/* Quick Toggle Simulator / Production Preview */}
            <button
              type="button"
              onClick={toggleSimulator}
              aria-label={showSimulator ? "Switch to production preview" : "Switch to simulation mode"}
              title={showSimulator ? "Hide simulation controls to preview production UI" : "Show simulation controls"}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                showSimulator
                  ? "border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950"
                  : "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 ring-1 ring-emerald-300/40"
              }`}
            >
              {showSimulator ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-amber-800" />
                  <span>Hide Simulator</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Show Simulator</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Camera Source Selector Card - Only visible in Single Focus View */}
      {viewMode === "single" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-xl">
              <label
                htmlFor="camera-source-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
              >
                Select Camera Source
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Camera className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  id="camera-source-select"
                  aria-label="Select Camera Source"
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 shadow-xs transition-colors hover:bg-white focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  onChange={(event) => setSelectedCameraId(event.target.value)}
                  value={selectedCamera.id}
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.name} · {camera.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Camera Status & Location Chips */}
            <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto pt-2 sm:pt-4">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                <span className="text-slate-500 font-medium">Status:</span>
                <span
                  className={`inline-flex items-center gap-1.5 font-semibold ${
                    offline
                      ? "text-rose-700"
                      : selectedCamera.status === "online"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      offline
                        ? "bg-rose-500"
                        : selectedCamera.status === "online"
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-amber-500"
                    }`}
                  />
                  {offline ? "Offline" : selectedCamera.status === "online" ? "Active" : "Degraded"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 font-mono">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{selectedCamera.location}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Violation Episode Simulator Deck - Collapsible for Production Preview */}
      {showSimulator && (
        <section
          aria-label="Violation Episode simulator"
          className="rounded-xl border border-amber-200/90 bg-linear-to-b from-amber-50/70 to-orange-50/40 p-5 shadow-xs"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-800">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">Violation Episode simulator</h2>
                <p className="text-xs text-slate-600">
                  These controls use deterministic demo data only; they do not send alarms or store snapshots.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 font-mono text-[11px] font-medium text-amber-900 border border-amber-200 hidden sm:inline">
                Deterministic Engine
              </span>
              <button
                type="button"
                onClick={() => setShowSimulator(false)}
                aria-label="Hide simulator controls"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100/80 hover:bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-950 transition-colors cursor-pointer shadow-2xs"
              >
                <EyeOff className="h-3.5 w-3.5 text-amber-800" />
                Hide Simulator (Production Preview)
              </button>
            </div>
          </div>

          {/* Preset Scenarios */}
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-900/80 mb-2.5">
              1. Select Monitoring Scenario
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void selectScenario("normal")}
                size="sm"
                variant="outline"
                className={`flex items-center gap-1.5 transition-all ${
                  activeScenario === "normal"
                    ? "border-amber-500 bg-amber-100/90 text-amber-950 font-semibold shadow-xs ring-1 ring-amber-400/50"
                    : "bg-white/80 hover:bg-white text-slate-700"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Normal operation scenario
              </Button>
              <Button
                onClick={() => void selectScenario("missing-ppe")}
                size="sm"
                variant="outline"
                className={`flex items-center gap-1.5 transition-all ${
                  activeScenario === "missing-ppe"
                    ? "border-amber-500 bg-amber-100/90 text-amber-950 font-semibold shadow-xs ring-1 ring-amber-400/50"
                    : "bg-white/80 hover:bg-white text-slate-700"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                Missing PPE scenario
              </Button>
              <Button
                onClick={() => void selectScenario("unidentified")}
                size="sm"
                variant="outline"
                className={`flex items-center gap-1.5 transition-all ${
                  activeScenario === "unidentified"
                    ? "border-amber-500 bg-amber-100/90 text-amber-950 font-semibold shadow-xs ring-1 ring-amber-400/50"
                    : "bg-white/80 hover:bg-white text-slate-700"
                }`}
              >
                <UserX className="h-3.5 w-3.5 text-amber-600" />
                Unknown person scenario
              </Button>
              <Button
                onClick={() => void selectScenario("camera-offline")}
                size="sm"
                variant="outline"
                className={`flex items-center gap-1.5 transition-all ${
                  activeScenario === "camera-offline"
                    ? "border-amber-500 bg-amber-100/90 text-amber-950 font-semibold shadow-xs ring-1 ring-amber-400/50"
                    : "bg-white/80 hover:bg-white text-slate-700"
                }`}
              >
                <WifiOff className="h-3.5 w-3.5 text-slate-600" />
                Camera offline scenario
              </Button>
              <Button
                onClick={() => void selectScenario("score-escalation")}
                size="sm"
                variant="outline"
                className={`flex items-center gap-1.5 transition-all ${
                  activeScenario === "score-escalation"
                    ? "border-amber-500 bg-amber-100/90 text-amber-950 font-semibold shadow-xs ring-1 ring-amber-400/50"
                    : "bg-white/80 hover:bg-white text-slate-700"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                Score escalation scenario
              </Button>
            </div>
          </div>

          {/* Frame Processing Stream (When Episode active) */}
          {simulation.state === "episode" && (
            <div className="mt-4 rounded-lg border border-amber-300/80 bg-white/70 p-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-amber-700 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                    2. Stream Frame Processing (Advance Episode Lifecycle)
                  </span>
                </div>
                <span className="font-mono text-xs text-amber-950 font-medium">
                  Episode Status: <strong className="text-slate-950 font-semibold">{episodeLabels[simulation.episodeStatus]}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Send simulated inspection frames to advance the state machine across confirmation and clearing countdowns.
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  onClick={() => void processFrame(false)}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-xs flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Process non-compliant frame
                </Button>
                <Button
                  onClick={() => void processFrame(true)}
                  size="sm"
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Process compliant frame
                </Button>
                <Button
                  onClick={() => void processFrame(false, 0.2)}
                  size="sm"
                  variant="outline"
                  className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                >
                  <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                  Low-confidence frame
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Simulation Notification Feed */}
      {notificationFeed && (
        <section
          aria-label="Simulation notification feed"
          className="rounded-xl border-l-4 border-amber-500 border-y border-r border-amber-200 bg-amber-50/90 p-4 shadow-xs"
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-900 mt-0.5">
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-950">
                  SIMULATION
                </p>
                <span className="text-slate-400">·</span>
                <span className="text-xs text-amber-800 font-medium">Broadcast Alert Triggered</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-950">{notificationFeed}</p>
              <p className="mt-1 text-xs text-slate-600">No real Telegram messages or audible alarms are sent.</p>
            </div>
          </div>
        </section>
      )}

      {/* VIEW MODE 1: Multi-Camera Grid View */}
      {viewMode === "grid" ? (
        <section aria-label="Multi-camera monitoring grid" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-slate-100 px-4 py-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="h-5 w-5 text-amber-400" />
              <div>
                <h2 className="font-semibold text-sm sm:text-base">CCTV Security Video Wall</h2>
                <p className="text-xs text-slate-400">
                  Simultaneous feed matrix for {cameras.length} camera sources. Click any feed to focus.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-emerald-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {cameras.filter((c) => c.status === "online").length}/{cameras.length} Active
              </span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cameras.map((camera) => {
              const isCameraOffline =
                camera.status === "offline" ||
                (simulation.cameraId === camera.id && simulation.state === "offline");
              const isSimulatedTarget = simulation.cameraId === camera.id;
              const isEpisode = isSimulatedTarget && simulation.state === "episode";
              const isEpisodeCleared = isEpisode && simulation.episodeStatus === "cleared";
              const isEpisodeActive = isEpisode && !isEpisodeCleared;
              const cameraZones = camera.zoneIds.filter((zoneId) =>
                zones.some((zone) => zone.id === zoneId && zone.active),
              );

              return (
                <div
                  key={camera.id}
                  onClick={() => {
                    setSelectedCameraId(camera.id);
                    setViewMode("single");
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCameraId(camera.id);
                      setViewMode("single");
                    }
                  }}
                  aria-label={`Inspect ${camera.name}`}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border bg-slate-950 transition-all duration-200 hover:shadow-2xl hover:border-amber-400 cursor-pointer ${
                    selectedCameraId === camera.id
                      ? "border-amber-400/90 ring-2 ring-amber-400/40"
                      : "border-slate-800"
                  }`}
                >
                  {/* Card Header HUD */}
                  <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-900/95 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Camera className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="font-semibold text-slate-100 truncate">{camera.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                      {isCameraOffline ? (
                        <span className="text-rose-400 flex items-center gap-1 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> OFFLINE
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Video Viewport */}
                  <div className="relative aspect-video overflow-hidden bg-slate-900">
                    <img
                      alt={isCameraOffline ? "Camera feed offline" : `Live camera feed ${camera.name}`}
                      className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                        isCameraOffline ? "opacity-30 grayscale" : ""
                      }`}
                      src={industrialMonitoringScene}
                    />

                    {/* Viewfinder corner brackets */}
                    <div className="pointer-events-none absolute inset-2 border border-white/5 rounded-xs">
                      <div className="absolute -left-0.5 -top-0.5 h-2 w-2 border-l border-t border-amber-400/40" />
                      <div className="absolute -right-0.5 -top-0.5 h-2 w-2 border-r border-t border-amber-400/40" />
                      <div className="absolute -bottom-0.5 -left-0.5 h-2 w-2 border-b border-l border-amber-400/40" />
                      <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 border-b border-r border-amber-400/40" />
                    </div>

                    {/* Watermark */}
                    <span className="absolute right-2 top-2 rounded border border-amber-300/40 bg-slate-950/85 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-200 backdrop-blur-xs">
                      SIM
                    </span>

                    {/* Offline Screen */}
                    {isCameraOffline ? (
                      <div className="absolute inset-0 grid place-items-center text-center bg-slate-950/75 p-3">
                        <div>
                          <WifiOff className="h-6 w-6 text-rose-400 mx-auto mb-1 animate-pulse" />
                          <p className="font-mono text-xs font-bold text-rose-200 tracking-wider">
                            CAMERA OFFLINE
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatWib(camera.lastUpdatedAt)}
                          </p>
                        </div>
                      </div>
                    ) : isEpisodeActive ? (
                      <div
                        aria-label={`Detected Person · ${episodeLabels[simulation.episodeStatus]}`}
                        className={`absolute left-[23%] top-[25%] h-[43%] w-[18%] rounded-xs border-2 ${
                          simulation.episodeStatus === "confirmed"
                            ? "border-red-500 bg-red-500/20 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            : "border-dashed border-amber-400 bg-amber-400/15"
                        }`}
                      >
                        <span className="absolute -top-5 left-0 whitespace-nowrap rounded-t bg-amber-300 px-1.5 py-0.2 text-[9px] font-semibold text-slate-950 flex items-center gap-0.5">
                          {episodeLabels[simulation.episodeStatus]} · {Math.round(simulation.confidence * 100)}%
                        </span>
                      </div>
                    ) : !isEpisodeCleared ? (
                      <div
                        aria-label="Detected Person"
                        className="absolute left-[23%] top-[25%] h-[43%] w-[18%] rounded-xs border border-emerald-400 bg-emerald-500/10"
                      >
                        <span className="absolute -top-5 left-0 whitespace-nowrap rounded-t bg-emerald-500 px-1.5 py-0.2 text-[9px] font-semibold text-white">
                          PPE Compliance · 96%
                        </span>
                      </div>
                    ) : null}

                    {/* Focus Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-xl flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                        <Maximize2 className="h-3.5 w-3.5" />
                        Focus Camera
                      </span>
                    </div>

                    {/* Camera ID Chip */}
                    <div className="absolute bottom-2 left-2 font-mono text-[10px] text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-xs">
                      {camera.id}
                    </div>
                  </div>

                  {/* Card Footer Details */}
                  <div className="p-2.5 bg-slate-900/70 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400 truncate">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-500" />
                      {camera.location}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {cameraZones.length} Zones
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* VIEW MODE 2: Single Focus View */
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          {/* CCTV Monitoring Stage */}
          <section
            aria-label={`Live Monitoring stage ${selectedCamera.name}`}
            className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl"
          >
            {/* CCTV Header HUD */}
            <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-900/90 px-4 py-2.5 text-sm backdrop-blur-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-amber-400" />
                  <span className="font-semibold text-slate-100">{selectedCamera.name}</span>
                </div>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300 border border-slate-700">
                  {selectedCamera.id}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="hidden sm:inline text-slate-400">1080P · 30FPS</span>
                {offline ? (
                  <span className="flex items-center gap-1 text-rose-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> NO FEED
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    LIVE
                  </span>
                )}
              </div>
            </div>

            {/* Viewport */}
            <div className="relative aspect-video overflow-hidden bg-slate-900">
              <img
                alt={offline ? "Fictional industrial scene with a dimmed latest frame" : "Fictional industrial scene"}
                className={`h-full w-full object-cover transition-all duration-500 ${
                  offline ? "opacity-35 grayscale" : ""
                }`}
                src={industrialMonitoringScene}
              />

              {/* Viewfinder corner brackets */}
              <div className="pointer-events-none absolute inset-3 border border-white/5 rounded-sm">
                <div className="absolute -left-1 -top-1 h-3 w-3 border-l-2 border-t-2 border-amber-400/40" />
                <div className="absolute -right-1 -top-1 h-3 w-3 border-r-2 border-t-2 border-amber-400/40" />
                <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-amber-400/40" />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-amber-400/40" />
              </div>

              <span className="absolute right-4 top-4 rounded border border-amber-300/40 bg-slate-950/85 px-2.5 py-1 font-mono text-[10px] font-semibold text-amber-200 backdrop-blur-xs">
                SIMULATION
              </span>

              {/* Offline Message */}
              {offline ? (
                <div className="absolute inset-0 grid place-items-center text-center text-slate-100 bg-slate-950/75 backdrop-blur-xs">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/95 px-6 py-5 shadow-2xl">
                    <WifiOff className="h-8 w-8 text-rose-400 mx-auto mb-2.5 animate-pulse" />
                    <p className="font-mono text-base font-bold tracking-widest text-rose-100">
                      CAMERA OFFLINE
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Latest update: {formatWib(selectedCamera.lastUpdatedAt)}
                    </p>
                  </div>
                </div>
              ) : hasClearedEpisode ? null : activeEpisode && displayed ? (
                <div
                  aria-label={`Detected Person · ${episodeLabels[displayed.episodeStatus]}`}
                  className={`absolute left-[23%] top-[25%] h-[43%] w-[18%] rounded-sm border-2 transition-all duration-300 ${
                    displayed.episodeStatus === "confirmed"
                      ? "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse"
                      : "border-dashed border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  }`}
                >
                  <span className="absolute -top-7 left-0 whitespace-nowrap rounded-t bg-amber-300 px-2.5 py-0.5 text-xs font-semibold text-slate-950 shadow-xs flex items-center gap-1">
                    {displayed.episodeStatus === "confirmed" ? (
                      <ShieldAlert className="h-3.5 w-3.5 text-red-700 inline" />
                    ) : (
                      <Clock3 className="h-3.5 w-3.5 text-amber-800 inline" />
                    )}
                    {episodeLabels[displayed.episodeStatus]} · {displayed.identityLabel} ·{" "}
                    {Math.round(displayed.confidence * 100)}%
                  </span>
                </div>
              ) : (
                <div
                  aria-label="Detected Person"
                  className="absolute left-[23%] top-[25%] h-[43%] w-[18%] rounded-sm border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                >
                  <span className="absolute -top-7 left-0 whitespace-nowrap rounded-t bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 inline" />
                    PPE Compliance · Detected Person · 96%
                  </span>
                </div>
              )}

              {/* Bottom HUD bar */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded border border-slate-700/80 bg-slate-950/85 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-xs font-mono">
                <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                <span>Latest update: {formatWib(selectedCamera.lastUpdatedAt)}</span>
              </div>
              <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-2 rounded border border-slate-700/80 bg-slate-950/85 px-2.5 py-1.5 font-mono text-[11px] text-emerald-400 backdrop-blur-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>YOLOv8-Safety · 14ms</span>
              </div>
            </div>
          </section>

          {/* Sidebar / Aside: Health & Episode Tracking */}
          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-5">
            {/* Stream Status Header */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Stream Status
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-base">{selectedCamera.name}</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
                    offline
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : selectedCamera.status === "online"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      offline
                        ? "bg-rose-500"
                        : selectedCamera.status === "online"
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-amber-500"
                    }`}
                  />
                  {offline ? "Offline" : selectedCamera.status === "online" ? "Active" : "Degraded"}
                </span>
              </div>
            </div>

            {/* Camera Metadata List */}
            <dl className="space-y-3.5 text-sm border-t border-slate-100 pt-4">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <MapPin className="h-3.5 w-3.5" /> Location
                </dt>
                <dd className="mt-1 font-medium text-slate-800">{selectedCamera.location}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Layers className="h-3.5 w-3.5" /> Active Hazardous Zones
                </dt>
                <dd className="mt-1 text-slate-700">
                  {activeZoneIds.length ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {activeZoneIds.map((zoneId) => (
                        <span
                          key={zoneId}
                          className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 border border-slate-200/80"
                        >
                          {zoneId} · {zones.find((zone) => zone.id === zoneId)?.name ?? zoneId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "No active Hazardous Zones."
                  )}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Shield className="h-3.5 w-3.5" /> Area Supervisor scope
                </dt>
                <dd className="mt-1 font-medium text-slate-800">{selectedCamera.supervisorArea}</dd>
              </div>
            </dl>

            {offline && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p>Detection overlays stop when the camera is offline so stale frames are not treated as current.</p>
              </div>
            )}

            {/* Episode status Region */}
            {displayed?.state === "episode" && (
              <section aria-label="Episode status" className="mt-auto border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Incident Tracking
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                      hasClearedEpisode
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : displayed.episodeStatus === "confirmed"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {episodeLabels[displayed.episodeStatus]}
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                  <p className="font-semibold text-slate-900 text-sm">
                    {episodeLabels[displayed.episodeStatus]}
                  </p>
                  {hasClearedEpisode ? (
                    <p className="text-xs leading-relaxed text-slate-600">
                      The active overlay has stopped; the Violation Event remains recorded for audit history.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-slate-700">Identity: {displayed.identityLabel}</p>
                      {displayed.episodeStatus === "candidate" && (
                        <div className="rounded bg-amber-100/70 p-2 border border-amber-200 text-xs text-amber-950 font-medium">
                          <p>
                            Confirmation countdown:{" "}
                            {Math.max(
                              0,
                              settings.confirmThresholdSeconds - displayed.confirmationElapsedSeconds,
                            )}{" "}
                            seconds
                          </p>
                          <div className="mt-1.5 h-1.5 w-full bg-amber-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-600 transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (displayed.confirmationElapsedSeconds /
                                    settings.confirmThresholdSeconds) *
                                    100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {displayed.episodeStatus === "clearing" && (
                        <div className="rounded bg-sky-100/70 p-2 border border-sky-200 text-xs text-sky-950 font-medium">
                          <p>
                            Clearing countdown:{" "}
                            {Math.max(
                              0,
                              settings.clearThresholdSeconds - displayed.clearingElapsedSeconds,
                            )}{" "}
                            seconds
                          </p>
                          <div className="mt-1.5 h-1.5 w-full bg-sky-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-600 transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (displayed.clearingElapsedSeconds / settings.clearThresholdSeconds) * 100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {displayed.confidence < settings.minimumConfidence && (
                        <p className="text-xs text-slate-500 italic">
                          A frame below the minimum confidence does not change the Episode status.
                        </p>
                      )}
                    </>
                  )}

                  {displayed.eventId && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Event Reference:</span>
                      <p className="font-semibold text-xs font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Violation Event {displayed.eventId}
                      </p>
                    </div>
                  )}

                  {displayed.scoreChange && (
                    <div className="pt-1 flex items-center justify-between font-mono text-xs">
                      <span className="text-slate-500">Safety Score:</span>
                      <span className="font-medium text-slate-900">
                        {displayed.scoreChange.before} → {displayed.scoreChange.after}
                      </span>
                    </div>
                  )}

                  {displayed.scoreChange?.crossedEscalationThreshold && (
                    <div className="rounded border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <p>Escalation Threshold crossed: {settings.escalationThreshold}</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
