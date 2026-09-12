import { useEffect, useState } from "react";

import { cameraScopeFor, type Persona } from "../../application/personas";
import industrialMonitoringScene from "../../assets/industrial-monitoring.svg";
import { Button } from "../../components/ui/button";
import type { Camera, CameraSourceCapability, HazardousZone, HazardousZoneCapability, MonitoringCapability, MonitoringScenario, MonitoringSimulation, NotificationCapability, SafetySettings, SafetySettingsCapability } from "../../services/saw-service";
import { formatWib } from "../../shared/formatters";

const episodeLabels = { candidate: "Pending Confirmation", confirmed: "Violation", clearing: "Clearing", cleared: "Cleared" } as const;

export function LiveMonitoring({ persona, service }: { persona: Persona; service: CameraSourceCapability & HazardousZoneCapability & MonitoringCapability & NotificationCapability & SafetySettingsCapability }) {
  const [cameras, setCameras] = useState<Camera[]>();
  const [zones, setZones] = useState<HazardousZone[]>();
  const [simulation, setSimulation] = useState<MonitoringSimulation>();
  const [settings, setSettings] = useState<SafetySettings>();
  const [selectedCameraId, setSelectedCameraId] = useState<string>();
  const [notificationFeed, setNotificationFeed] = useState<string>();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([service.getCameras(cameraScopeFor(persona)), service.getHazardousZone(), service.getMonitoringSimulation(), service.getSafetySettings(), service.getNotificationSimulationLogs()]).then(([nextCameras, nextZones, nextSimulation, nextSettings, logs]) => {
      if (!active) return;
      setCameras(nextCameras); setZones(nextZones); setSimulation(nextSimulation); setSettings(nextSettings);
      setSelectedCameraId((current) => nextCameras.some((camera) => camera.id === current) ? current : nextCameras.some((camera) => camera.id === nextSimulation.cameraId) ? nextSimulation.cameraId : nextCameras[0]?.id);
      if (nextSimulation.eventId && nextSimulation.scoreChange?.crossedEscalationThreshold) setNotificationFeed(`Violation Event ${nextSimulation.eventId}: ${logs.filter((log) => log.violationId === nextSimulation.eventId).length} simulated recipients recorded.`);
    }).catch(() => { if (active) setHasError(true); });
    return () => { active = false; };
  }, [persona, service]);

  const selectScenario = async (scenario: MonitoringScenario) => {
    const next = await service.selectMonitoringScenario(scenario);
    setSimulation(next);
    if (cameras?.some((camera) => camera.id === next.cameraId)) setSelectedCameraId(next.cameraId);
  };
  const processFrame = async (isCompliant: boolean, confidence = 0.96) => {
    if (!settings || !simulation) return;
    const elapsedSeconds = simulation.episodeStatus === "candidate" ? settings.confirmThresholdSeconds : settings.clearThresholdSeconds;
    const next = await service.processMonitoringFrame({ confidence, isCompliant, elapsedSeconds });
    setSimulation(next);
    if (next.eventId && next.scoreChange?.crossedEscalationThreshold) setNotificationFeed(`Violation Event ${next.eventId}: ${(await service.getNotificationSimulationLogs()).filter((log) => log.violationId === next.eventId).length} simulated recipients recorded.`);
  };

  if (hasError) return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live Monitoring</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Live Monitoring could not be loaded.</p><p className="mt-1 text-sm text-red-800">Please try again.</p></div></section>;
  if (!cameras || !zones || !simulation || !settings) return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live Monitoring</h1><p className="mt-6 text-slate-600">Loading Live Monitoring…</p></section>;
  const selectedCamera = cameras.find((camera) => camera.id === selectedCameraId);
  if (!selectedCamera) return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live Monitoring</h1><div className="mt-6 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No Camera Sources in your scope</p><p className="mt-1 text-sm text-slate-600">Select an assigned area with a Camera Source to start monitoring.</p></div></section>;
  const displayed = simulation.cameraId === selectedCamera.id ? simulation : undefined;
  const offline = selectedCamera.status === "offline" || displayed?.state === "offline";
  const hasClearedEpisode = displayed?.state === "episode" && displayed.episodeStatus === "cleared";
  const activeEpisode = displayed?.state === "episode" && !hasClearedEpisode;
  const activeZoneIds = selectedCamera.zoneIds.filter((zoneId) => zones.some((zone) => zone.id === zoneId && zone.active));

  return <section>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational monitoring</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live Monitoring</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Simulated monitoring of Hazardous Zones and Detected Persons without a real camera or RTSP connection.</p></div><span className="border border-amber-300 bg-amber-50 px-3 py-2 font-mono text-xs font-medium tracking-[0.12em] text-amber-950">SIMULATION</span></div>
    <label className="mt-8 block max-w-md text-sm font-medium text-slate-800">Select Camera Source<select aria-label="Select Camera Source" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setSelectedCameraId(event.target.value)} value={selectedCamera.id}>{cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name} · {camera.location}</option>)}</select></label>
    <section aria-label="Violation Episode simulator" className="mt-5 border border-amber-200 bg-amber-50 p-4"><h2 className="font-semibold text-slate-950">Violation Episode simulator</h2><p className="mt-1 text-sm text-slate-700">These controls use deterministic demo data only; they do not send alarms or store snapshots.</p><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => void selectScenario("normal")} size="sm" variant="outline">Normal operation scenario</Button><Button onClick={() => void selectScenario("missing-ppe")} size="sm" variant="outline">Missing PPE scenario</Button><Button onClick={() => void selectScenario("unidentified")} size="sm" variant="outline">Unknown person scenario</Button><Button onClick={() => void selectScenario("camera-offline")} size="sm" variant="outline">Camera offline scenario</Button><Button onClick={() => void selectScenario("score-escalation")} size="sm" variant="outline">Score escalation scenario</Button></div>{simulation.state === "episode" && <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => void processFrame(false)} size="sm">Process non-compliant frame</Button><Button onClick={() => void processFrame(true)} size="sm" variant="outline">Process compliant frame</Button><Button onClick={() => void processFrame(false, 0.2)} size="sm" variant="outline">Low-confidence frame</Button></div>}</section>
    {notificationFeed && <section aria-label="Simulation notification feed" className="mt-5 border-l-2 border-amber-500 bg-amber-50 p-4" role="status"><p className="font-mono text-xs font-medium tracking-[0.12em] text-amber-950">SIMULATION</p><p className="mt-2 text-sm font-medium text-slate-950">{notificationFeed}</p><p className="mt-1 text-sm text-slate-700">No real Telegram messages or audible alarms are sent.</p></section>}
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]"><section aria-label={`Live Monitoring stage ${selectedCamera.name}`} className="overflow-hidden border border-slate-800 bg-slate-950"><div className="flex justify-between border-b border-slate-700 px-4 py-3 text-sm text-slate-200"><span>{selectedCamera.name}</span><span className="font-mono text-xs text-slate-400">{selectedCamera.id}</span></div><div className="relative aspect-video overflow-hidden bg-slate-900"><img alt={offline ? "Fictional industrial scene with a dimmed latest frame" : "Fictional industrial scene"} className={`h-full w-full object-cover ${offline ? "opacity-35 grayscale" : ""}`} src={industrialMonitoringScene} /><span className="absolute right-4 top-4 border border-amber-300 bg-slate-950/90 px-2 py-1 font-mono text-[10px] text-amber-200">SIMULATION</span>{offline ? <div className="absolute inset-0 grid place-items-center text-center text-slate-100"><div className="border border-slate-400 bg-slate-950/90 px-5 py-4"><p className="font-mono text-sm font-medium">CAMERA OFFLINE</p><p className="mt-2 text-sm text-slate-300">Latest update: {formatWib(selectedCamera.lastUpdatedAt)}</p></div></div> : hasClearedEpisode ? null : activeEpisode && displayed ? <div aria-label={`Detected Person · ${episodeLabels[displayed.episodeStatus]}`} className={`absolute left-[23%] top-[25%] h-[43%] w-[18%] border-2 ${displayed.episodeStatus === "confirmed" ? "border-red-500" : "border-dashed border-amber-400"}`}><span className="absolute -top-7 left-0 whitespace-nowrap bg-amber-300 px-2 py-1 text-xs">{episodeLabels[displayed.episodeStatus]} · {displayed.identityLabel} · {Math.round(displayed.confidence * 100)}%</span></div> : <div aria-label="Detected Person" className="absolute left-[23%] top-[25%] h-[43%] w-[18%] border-2 border-emerald-400"><span className="absolute -top-7 left-0 whitespace-nowrap bg-emerald-500 px-2 py-1 text-xs">PPE Compliance · Detected Person · 96%</span></div>}<div className="absolute bottom-4 left-4 border border-slate-500 bg-slate-950/90 px-3 py-2 text-xs text-slate-100">Latest update: {formatWib(selectedCamera.lastUpdatedAt)}</div></div></section><aside className="border border-slate-200 bg-white p-5"><p className="font-medium text-slate-950">{offline ? "Offline" : selectedCamera.status === "online" ? "Active" : "Degraded"}</p><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Location</dt><dd>{selectedCamera.location}</dd></div><div><dt className="text-slate-500">Active Hazardous Zones</dt><dd>{activeZoneIds.length ? activeZoneIds.map((zoneId) => `${zoneId} · ${zones.find((zone) => zone.id === zoneId)?.name ?? zoneId}`).join(", ") : "No active Hazardous Zones."}</dd></div><div><dt className="text-slate-500">Area Supervisor scope</dt><dd>{selectedCamera.supervisorArea}</dd></div></dl>{offline && <p className="mt-5 text-sm text-slate-600">Detection overlays stop when the camera is offline so stale frames are not treated as current.</p>}{displayed?.state === "episode" && <section aria-label="Episode status" className="mt-5 border-t pt-5"><p className="font-medium">{episodeLabels[displayed.episodeStatus]}</p>{hasClearedEpisode ? <p className="mt-1 text-sm">The active overlay has stopped; the Violation Event remains recorded for audit history.</p> : <><p className="mt-1 text-sm">Identity: {displayed.identityLabel}</p>{displayed.episodeStatus === "candidate" && <p className="mt-1 text-sm">Confirmation countdown: {Math.max(0, settings.confirmThresholdSeconds - displayed.confirmationElapsedSeconds)} seconds</p>}{displayed.episodeStatus === "clearing" && <p className="mt-1 text-sm">Clearing countdown: {Math.max(0, settings.clearThresholdSeconds - displayed.clearingElapsedSeconds)} seconds</p>}{displayed.confidence < settings.minimumConfidence && <p className="mt-2 text-sm">A frame below the minimum confidence does not change the Episode status.</p>}</>}{displayed.eventId && <p className="mt-3 font-medium">Violation Event {displayed.eventId}</p>}{displayed.scoreChange && <p className="mt-2 font-mono text-xs">Safety Score: {displayed.scoreChange.before} → {displayed.scoreChange.after}</p>}{displayed.scoreChange?.crossedEscalationThreshold && <p className="mt-2 text-sm">Escalation Threshold crossed: {settings.escalationThreshold}</p>}</section>}</aside></div>
  </section>;
}
