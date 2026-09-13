import { useEffect, useState } from "react";

import { Button } from "../../components/ui/button";
import { useMediaQuery } from "../../shared/useMediaQuery";
import type { CanonicalPpeClassCapability, CanonicalPpeClassConfiguration, CanonicalPpeClassMapping } from "../../services/saw-service";
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
      if (active) setError(reason instanceof Error ? reason.message : "Canonical PPE Class configuration could not be loaded.");
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
      setError(reason instanceof Error ? reason.message : "Canonical PPE Class configuration could not be saved.");
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
      setError("YOLO index must be a whole number that is zero or greater.");
      return;
    }
    if (!draft.rawLabel.trim() || !draft.canonicalPpeClass.trim()) {
      setError("Raw label and Canonical PPE Class are required.");
      return;
    }
    if (configuration.mappings.some((mapping) => mapping.id !== draft.id && mapping.yoloIndex === yoloIndex)) {
      setError(`YOLO index ${yoloIndex} is already in use.`);
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

    const saved = await saveConfiguration(nextConfiguration, "Canonical PPE Class mapping saved.");
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
    await saveConfiguration(nextConfiguration, "ONNX model demo metadata saved.");
  };

  if (error && !configuration) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Canonical PPE Classes</h1><div className="mt-6 border border-red-200 bg-red-50 p-6" role="alert"><p className="font-medium text-red-900">Canonical PPE Class configuration could not be loaded.</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }
  if (!configuration) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Canonical PPE Class</h1><p className="mt-6 text-slate-600">Loading Canonical PPE Class configuration…</p></section>;
  }

  const preview = draft ?? createPpeMappingDraft();
  const modelFileMetadata = configuration.modelFileMetadata;
  const yoloIndexError = error?.startsWith("YOLO index") ? error : undefined;

  return (
    <section aria-labelledby="canonical-ppe-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Model interpretation configuration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950" id="canonical-ppe-title">Canonical PPE Classes</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Map raw model labels to Canonical PPE Classes that can be used consistently by Hazardous Zones.</p></div>
        <Button onClick={() => { setDraft(createPpeMappingDraft()); setError(undefined); setNotice(undefined); }}>Add mapping</Button>
      </div>

      {notice && <p aria-live="polite" className="mt-5 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
      {error && !yoloIndexError && <p aria-live="assertive" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}

      {!phoneLayout && <div className="mt-8 overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Canonical PPE Class mappings</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">YOLO index</th><th className="px-4 py-3">Raw label</th><th className="px-4 py-3">Canonical PPE Class</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{configuration.mappings.map((mapping) => <tr className="border-b border-slate-100 last:border-0" key={mapping.id}><td className="px-4 py-3 font-mono text-slate-950">{mapping.yoloIndex}</td><td className="px-4 py-3 font-mono text-slate-700">{mapping.rawLabel}</td><td className="px-4 py-3 font-medium text-slate-950">{mapping.canonicalPpeClass}</td><td className="px-4 py-3">{ppeComplianceCategoryLabel(mapping.complianceCategory)}</td><td className="px-4 py-3">{mapping.active ? "Active" : "Inactive"}</td><td className="px-4 py-3 text-right"><Button onClick={() => { setDraft(createPpeMappingDraft(mapping)); setError(undefined); setNotice(undefined); }} size="sm" variant="outline">Edit mapping {mapping.rawLabel}</Button></td></tr>)}</tbody>
        </table>
      </div>}
      {phoneLayout && <div aria-label="Canonical PPE Class mappings for mobile" className="mt-8 space-y-3" role="list">
        {configuration.mappings.map((mapping) => <article aria-label={mapping.rawLabel} className="border border-slate-200 bg-white p-4" key={mapping.id} role="listitem"><dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div><dt className="text-slate-500">YOLO index</dt><dd className="mt-1 font-mono text-slate-950">{mapping.yoloIndex}</dd></div><div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-medium text-slate-950">{mapping.active ? "Active" : "Inactive"}</dd></div><div><dt className="text-slate-500">Raw label</dt><dd className="mt-1 text-slate-950">{mapping.rawLabel}</dd></div><div><dt className="text-slate-500">Canonical PPE Class</dt><dd className="mt-1 font-medium text-slate-950">{mapping.canonicalPpeClass}</dd></div><div className="col-span-2"><dt className="text-slate-500">Category</dt><dd className="mt-1 text-slate-950">{ppeComplianceCategoryLabel(mapping.complianceCategory)}</dd></div></dl><Button className="mt-4" onClick={() => { setDraft(createPpeMappingDraft(mapping)); setError(undefined); setNotice(undefined); }} size="sm" variant="outline">Edit mapping {mapping.rawLabel}</Button></article>)}
      </div>}

      {draft && <form className="mt-6 border border-slate-200 bg-white p-5 sm:p-6" noValidate onSubmit={(event) => void submitMapping(event)}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-950">{draft.id ? "Edit mapping" : "Add mapping"}</h2><p className="mt-1 text-sm text-slate-600">Each YOLO index can be used only once.</p></div><Button onClick={() => setDraft(undefined)} type="button" variant="outline">Cancel</Button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-800">YOLO index<input aria-describedby={yoloIndexError ? "yolo-index-error" : undefined} aria-invalid={Boolean(yoloIndexError)} aria-label="YOLO index" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" min="0" onChange={(event) => updateDraft("yoloIndex", event.target.value)} step="1" type="number" value={draft.yoloIndex} />{yoloIndexError && <span className="mt-1 block text-xs font-normal text-red-700" id="yolo-index-error" role="alert">{yoloIndexError}</span>}</label>
          <label className="block text-sm font-medium text-slate-800">Raw label<input aria-label="Raw label" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("rawLabel", event.target.value)} value={draft.rawLabel} /></label>
          <label className="block text-sm font-medium text-slate-800">Canonical PPE Class<input aria-label="Canonical PPE Class" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("canonicalPpeClass", event.target.value)} value={draft.canonicalPpeClass} /></label>
          <label className="block text-sm font-medium text-slate-800">Interpretation category<select aria-label="Interpretation category" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("complianceCategory", event.target.value as CanonicalPpeClassMapping["complianceCategory"])} value={draft.complianceCategory}><option value="compliance">Compliant</option><option value="violation">Violation</option></select></label>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-800"><input checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} type="checkbox" />Mapping active</label>
        <aside aria-label="Mapping interpretation preview" className="mt-5 border-l-2 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-slate-700"><span className="font-medium">Interpretation preview: </span>{preview.rawLabel.trim() || "Raw label"} is interpreted as <span className="font-medium">{preview.canonicalPpeClass.trim() || "Canonical PPE Class"}</span> with the {ppeComplianceCategoryLabel(preview.complianceCategory).toLowerCase()}.</aside>
        <div className="mt-5 flex justify-end"><Button disabled={saving} type="submit">{saving ? "Saving…" : "Save mapping"}</Button></div>
      </form>}

      <section aria-labelledby="onnx-metadata-title" className="mt-6 border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950" id="onnx-metadata-title">ONNX model metadata</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">This file selector stores only demo file metadata. ONNX model validation and inference require a backend and do not run in the browser.</p>
        <label className="mt-5 block text-sm font-medium text-slate-800">Select ONNX demo file<input accept=".onnx,application/octet-stream" aria-label="Select ONNX demo file" className="mt-1 block w-full text-sm text-slate-700" onChange={(event) => void selectModelFile(event.target.files?.[0])} type="file" /></label>
        {modelFileMetadata && <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3"><div><dt className="text-slate-500">File name</dt><dd className="mt-1 font-mono text-slate-950">{modelFileMetadata.fileName}</dd></div><div><dt className="text-slate-500">File size</dt><dd className="mt-1 text-slate-950">{Math.round(modelFileMetadata.sizeBytes / 1024)} KB</dd></div><div><dt className="text-slate-500">Type</dt><dd className="mt-1 font-mono text-slate-950">{modelFileMetadata.mimeType}</dd></div></dl>}
      </section>
    </section>
  );
}
