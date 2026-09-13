import { useEffect, useRef, useState } from "react";

import industrialMonitoringScene from "../../assets/industrial-monitoring.svg";
import { Button } from "../../components/ui/button";
import { AccessibleDialog } from "../../shared/AccessibleDialog";
import { useMediaQuery } from "../../shared/useMediaQuery";
import type { Camera, CameraSourceCapability, CanonicalPpeClassCapability, CanonicalPpeClassConfiguration, HazardousZone, HazardousZoneCapability, HazardousZoneInput, HazardousZoneWithViolationHistory, NormalizedZoneBounds } from "../../services/saw-service";

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

export function HazardousZones({ service }: { service: CameraSourceCapability & HazardousZoneCapability & CanonicalPpeClassCapability }) {
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
        if (active) setError(reason instanceof Error ? reason.message : "Hazardous Zones could not be loaded.");
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
      setNotice(`Hazardous Zone ${saved.name} saved.`);
      setCameras(await service.getCameras());
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Hazardous Zone could not be saved.");
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
        setNotice(`Hazardous Zone ${saved.name} deactivated.`);
      } else {
        await service.deleteHazardousZone(lifecycleAction.zone.id);
        setZones((current) => current?.filter((zone) => zone.id !== lifecycleAction.zone.id));
        setNotice(`Hazardous Zone ${lifecycleAction.zone.name} permanently deleted.`);
      }
      setDraft(undefined);
      setCameras(await service.getCameras());
      setLifecycleAction(undefined);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Hazardous Zone lifecycle could not be updated.");
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

      <label className="mt-8 block max-w-md text-sm font-medium text-slate-800">Select Camera Source<select aria-label="Select Camera Source" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setSelectedCameraId(event.target.value); setDraft(undefined); setError(undefined); }} value={selectedCamera.id}>{cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name} · {camera.location}</option>)}</select></label>
      <label className="mt-4 block max-w-md text-sm font-medium text-slate-800">Filter status<select aria-label="Filter Hazardous Zone status" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setZoneStatusFilter(event.target.value as "all" | "active" | "inactive")} value={zoneStatusFilter}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <section aria-label={`Frame Zone Editor ${selectedCamera.name}`} className="overflow-hidden border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3 text-sm text-slate-200"><span className="font-medium">{selectedCamera.name}</span><span className="font-mono text-xs text-slate-400">{selectedCamera.id}</span></div>
          <div aria-disabled={phoneZoneEditor} aria-label="Hazardous Zone canvas" className="relative aspect-video touch-none overflow-hidden bg-slate-900" onPointerDown={phoneZoneEditor ? undefined : beginDrawing} onPointerMove={phoneZoneEditor ? undefined : movePointer} onPointerUp={phoneZoneEditor ? undefined : () => setDrag(undefined)} ref={canvasRef}>
            <img alt="Illustration of a fictional industrial area for the Hazardous Zone editor" className="pointer-events-none h-full w-full object-cover" src={industrialMonitoringScene} />
            <span className="absolute right-4 top-4 border border-amber-300 bg-slate-950/90 px-2 py-1 font-mono text-[10px] font-medium tracking-[0.12em] text-amber-200">SIMULATION</span>
            {cameraZones.map((zone, index) => {
              const displayedZone = draft?.id === zone.id ? draft : zone;
              return <div className={`absolute border-2 ${zonePatterns[index % zonePatterns.length]} pointer-events-none md:pointer-events-auto`} key={zone.id} style={{ left: `${displayedZone.bounds.x * 100}%`, top: `${displayedZone.bounds.y * 100}%`, width: `${displayedZone.bounds.width * 100}%`, height: `${displayedZone.bounds.height * 100}%` }}><button aria-label={`Move ${zone.name}`} className="absolute inset-0 w-full cursor-move text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" disabled={phoneZoneEditor} onClick={() => openDraft(zone)} onPointerDown={(event) => { event.stopPropagation(); const point = pointInZone(event, canvasRef.current ?? event.currentTarget); setDraft(copyHazardousZone(zone)); setDrag({ kind: "move", pointer: point, bounds: zone.bounds }); event.currentTarget.setPointerCapture?.(event.pointerId); }} type="button"><span className="absolute -top-6 left-0 whitespace-nowrap bg-slate-950/90 px-2 py-1 text-xs font-medium text-white">{zone.name}</span><span className="sr-only">Move zone with pointer.</span></button><button aria-label={`Resize ${zone.name}`} className="absolute -bottom-1 -right-1 z-10 size-3 cursor-se-resize border border-white bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" disabled={phoneZoneEditor} onPointerDown={(event) => { event.stopPropagation(); setDraft(copyHazardousZone(zone)); setDrag({ kind: "resize", pointer: { x: 0, y: 0 }, bounds: zone.bounds }); event.currentTarget.setPointerCapture?.(event.pointerId); }} type="button"><span className="sr-only">Resize zone</span></button></div>;
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
