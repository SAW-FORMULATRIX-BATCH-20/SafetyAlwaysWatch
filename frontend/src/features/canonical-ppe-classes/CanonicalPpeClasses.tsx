import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileCode,
  Filter,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Upload,
  X,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import {
  useCanonicalPpeClassesQuery,
  useUpdateCanonicalPpeClassConfigurationMutation,
} from "../../hooks/queries/useCanonicalPpeClassesQuery";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
import type {
  CanonicalPpeClassCapability,
  CanonicalPpeClassConfiguration,
  CanonicalPpeClassMapping,
} from "../../services/saw-service";
import { AccessibleDialog } from "../../shared/AccessibleDialog";
import { useMediaQuery } from "../../shared/useMediaQuery";
import {
  useCanonicalPpeClassStore,
  type MappingCategoryFilter,
  type MappingStatusFilter,
  type PpeMappingDraft,
} from "../../stores/useCanonicalPpeClassStore";

function copyCanonicalPpeClassConfiguration(
  configuration: CanonicalPpeClassConfiguration,
): CanonicalPpeClassConfiguration {
  return JSON.parse(JSON.stringify(configuration)) as CanonicalPpeClassConfiguration;
}

function createPpeMappingDraft(mapping?: CanonicalPpeClassMapping): PpeMappingDraft {
  return mapping
    ? { ...mapping, yoloIndex: String(mapping.yoloIndex) }
    : {
        yoloIndex: "",
        rawLabel: "",
        canonicalPpeClass: "",
        complianceCategory: "compliance",
        active: true,
      };
}

function ppeComplianceCategoryLabel(
  category: CanonicalPpeClassMapping["complianceCategory"],
) {
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

export type CanonicalPpeClassesProps = {
  service?: CanonicalPpeClassCapability;
};

function CanonicalPpeClassesContent({ service }: CanonicalPpeClassesProps) {
  const {
    configuration,
    isLoading,
    error: queryError,
  } = useCanonicalPpeClassesQuery({ service });
  const updateMutation = useUpdateCanonicalPpeClassConfigurationMutation({ service });

  const draft = useCanonicalPpeClassStore((state) => state.draft);
  const setDraft = useCanonicalPpeClassStore((state) => state.setDraft);
  const updateDraftField = useCanonicalPpeClassStore((state) => state.updateDraft);
  const notice = useCanonicalPpeClassStore((state) => state.notice);
  const setNotice = useCanonicalPpeClassStore((state) => state.setNotice);
  const searchQuery = useCanonicalPpeClassStore((state) => state.searchQuery);
  const setSearchQuery = useCanonicalPpeClassStore((state) => state.setSearchQuery);
  const categoryFilter = useCanonicalPpeClassStore((state) => state.categoryFilter);
  const setCategoryFilter = useCanonicalPpeClassStore(
    (state) => state.setCategoryFilter,
  );
  const statusFilter = useCanonicalPpeClassStore((state) => state.statusFilter);
  const setStatusFilter = useCanonicalPpeClassStore((state) => state.setStatusFilter);
  const clearFilters = useCanonicalPpeClassStore((state) => state.clearFilters);

  const [localError, setLocalError] = useState<string>();
  const phoneLayout = useMediaQuery("(max-width: 767px)");

  const updateDraft = <Field extends keyof PpeMappingDraft>(
    field: Field,
    value: PpeMappingDraft[Field],
  ) => {
    updateDraftField(field, value);
    setLocalError(undefined);
  };

  const handleStartAdd = () => {
    setDraft(createPpeMappingDraft());
    setLocalError(undefined);
    setNotice(undefined);
  };

  const handleStartEdit = (mapping: CanonicalPpeClassMapping) => {
    setDraft(createPpeMappingDraft(mapping));
    setLocalError(undefined);
    setNotice(undefined);
  };

  const saveConfiguration = async (
    nextConfiguration: CanonicalPpeClassConfiguration,
    successMessage: string,
  ) => {
    setLocalError(undefined);
    try {
      const saved = await updateMutation.mutateAsync(nextConfiguration);
      setNotice(successMessage);
      return saved;
    } catch (reason: unknown) {
      setLocalError(
        reason instanceof Error
          ? reason.message
          : "Canonical PPE Class configuration could not be saved.",
      );
      return undefined;
    }
  };

  const submitMapping = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configuration || !draft) return;

    const yoloIndex = Number(draft.yoloIndex);
    if (!Number.isInteger(yoloIndex) || yoloIndex < 0) {
      setLocalError("YOLO index must be a whole number that is zero or greater.");
      return;
    }
    if (!draft.rawLabel.trim() || !draft.canonicalPpeClass.trim()) {
      setLocalError("Raw label and Canonical PPE Class are required.");
      return;
    }
    if (
      configuration.mappings.some(
        (mapping) => mapping.id !== draft.id && mapping.yoloIndex === yoloIndex,
      )
    ) {
      setLocalError(`YOLO index ${yoloIndex} is already in use.`);
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
    const existingIndex = nextConfiguration.mappings.findIndex(
      (mapping) => mapping.id === nextMapping.id,
    );
    if (existingIndex === -1) nextConfiguration.mappings.push(nextMapping);
    else nextConfiguration.mappings[existingIndex] = nextMapping;

    const saved = await saveConfiguration(
      nextConfiguration,
      "Canonical PPE Class mapping saved.",
    );
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

  if (queryError && !configuration) {
    return (
      <section aria-live="polite">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Canonical PPE Classes
        </h1>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 shadow-xs" role="alert">
          <AlertTriangle className="size-5 shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">
              Canonical PPE Class configuration could not be loaded.
            </p>
            <p className="mt-1 text-sm text-red-800">{queryError.message}</p>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading || !configuration) {
    return (
      <section aria-busy="true" aria-live="polite">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Canonical PPE Class
        </h1>
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="size-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading Canonical PPE Class configuration…</p>
        </div>
      </section>
    );
  }

  const allMappings = configuration.mappings;
  const totalCount = allMappings.length;
  const activeCount = allMappings.filter((m) => m.active).length;
  const compliantCount = allMappings.filter((m) => m.complianceCategory === "compliance").length;
  const violationCount = allMappings.filter((m) => m.complianceCategory === "violation").length;

  const filteredMappings = allMappings.filter((mapping) => {
    if (statusFilter === "active" && !mapping.active) return false;
    if (statusFilter === "inactive" && mapping.active) return false;
    if (categoryFilter !== "all" && mapping.complianceCategory !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchIndex = String(mapping.yoloIndex).includes(q);
      const matchRaw = mapping.rawLabel.toLowerCase().includes(q);
      const matchCanonical = mapping.canonicalPpeClass.toLowerCase().includes(q);
      if (!matchIndex && !matchRaw && !matchCanonical) return false;
    }
    return true;
  });

  const preview = draft ?? createPpeMappingDraft();
  const modelFileMetadata = configuration.modelFileMetadata;
  const error = localError || updateMutation.error?.message;
  const yoloIndexError = error?.startsWith("YOLO index") ? error : undefined;
  const isFilterActive = searchQuery !== "" || categoryFilter !== "all" || statusFilter !== "all";

  return (
    <section aria-labelledby="canonical-ppe-title" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold tracking-wide text-amber-800 border border-amber-200/80">
            <Cpu className="size-3.5 text-amber-600" />
            <span>MODEL INTERPRETATION CONFIGURATION</span>
          </div>
          <h1
            className="mt-2 text-3xl font-bold tracking-tight text-slate-950"
            id="canonical-ppe-title"
          >
            Canonical PPE Classes
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
            Standardize raw YOLO detection labels into unified Canonical PPE Classes used for compliance evaluation and Hazardous Zones detection.
          </p>
        </div>
        <Button
          className="flex items-center gap-2 bg-amber-500 font-semibold text-slate-950 hover:bg-amber-400 shadow-sm transition-all"
          onClick={handleStartAdd}
        >
          <Plus className="size-4" />
          <span>Add mapping</span>
        </Button>
      </div>

      {/* KPI Stats & Quick Filter Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
            statusFilter === "all" && categoryFilter === "all"
              ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs"
          }`}
          onClick={() => {
            setStatusFilter("all");
            setCategoryFilter("all");
          }}
          type="button"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Mappings</span>
            <Layers className="size-4 text-slate-400" />
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{totalCount}</span>
          <span className="mt-1 text-xs text-slate-500">Configured classes</span>
        </button>

        <button
          className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
            statusFilter === "active"
              ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs"
          }`}
          onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
          type="button"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Active Mappings</span>
            <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{activeCount}</span>
          <span className="mt-1 text-xs text-slate-500">Live in detection pipeline</span>
        </button>

        <button
          className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
            categoryFilter === "compliance"
              ? "border-sky-500 bg-sky-50/40 ring-1 ring-sky-500 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs"
          }`}
          onClick={() => setCategoryFilter(categoryFilter === "compliance" ? "all" : "compliance")}
          type="button"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">Compliant</span>
            <ShieldCheck className="size-4 text-sky-600" />
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{compliantCount}</span>
          <span className="mt-1 text-xs text-slate-500">Safety equipment classes</span>
        </button>

        <button
          className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
            categoryFilter === "violation"
              ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs"
          }`}
          onClick={() => setCategoryFilter(categoryFilter === "violation" ? "all" : "violation")}
          type="button"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Violations</span>
            <ShieldAlert className="size-4 text-rose-600" />
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{violationCount}</span>
          <span className="mt-1 text-xs text-slate-500">Risk triggers</span>
        </button>
      </div>

      {/* Notice Message */}
      {notice && (
        <div
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900 shadow-2xs"
          role="status"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{notice}</span>
          </div>
          <button
            aria-label="Dismiss notice"
            className="rounded p-1 text-emerald-700 hover:bg-emerald-100 transition-colors"
            onClick={() => setNotice(undefined)}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Global Error Message (not related to YOLO input in modal) */}
      {error && !draft && !yoloIndexError && (
        <div
          aria-live="assertive"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900 shadow-2xs"
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 text-red-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            aria-label="Dismiss error"
            className="rounded p-1 text-red-700 hover:bg-red-100 transition-colors"
            onClick={() => setLocalError(undefined)}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-1 items-center gap-3 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search mappings"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by YOLO index, raw label, or canonical class…"
              type="text"
              value={searchQuery}
            />
            {searchQuery && (
              <button
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setSearchQuery("")}
                type="button"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="size-3.5" />
            <span>Filters:</span>
          </div>
          <select
            aria-label="Filter by category"
            className="h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs font-medium text-slate-700 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            onChange={(e) => setCategoryFilter(e.target.value as MappingCategoryFilter)}
            value={categoryFilter}
          >
            <option value="all">All categories</option>
            <option value="compliance">Compliant only</option>
            <option value="violation">Violation only</option>
          </select>

          <select
            aria-label="Filter by status"
            className="h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs font-medium text-slate-700 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            onChange={(e) => setStatusFilter(e.target.value as MappingStatusFilter)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          {isFilterActive && (
            <Button
              className="h-9 gap-1 text-xs text-slate-600 hover:text-slate-900"
              onClick={clearFilters}
              size="sm"
              variant="outline"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      {!phoneLayout && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <caption className="sr-only">Canonical PPE Class mappings</caption>
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">YOLO index</th>
                <th className="px-5 py-3.5">Raw label</th>
                <th className="px-5 py-3.5">Canonical PPE Class</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMappings.length === 0 ? (
                <tr>
                  <td className="px-5 py-12 text-center text-slate-500" colSpan={6}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="size-6 text-slate-400" />
                      <p className="font-medium text-slate-800">No mappings match your criteria</p>
                      <p className="text-xs text-slate-500">Try adjusting your search query or reset active filters.</p>
                      {isFilterActive && (
                        <Button className="mt-2" onClick={clearFilters} size="sm" variant="outline">
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMappings.map((mapping) => (
                  <tr
                    className="hover:bg-slate-50/70 transition-colors"
                    key={mapping.id}
                  >
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 border border-slate-200/80">
                        {mapping.yoloIndex}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                      {mapping.rawLabel}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-950">
                        {mapping.canonicalPpeClass}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          mapping.complianceCategory === "compliance"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {mapping.complianceCategory === "compliance" ? (
                          <ShieldCheck className="size-3" />
                        ) : (
                          <ShieldAlert className="size-3" />
                        )}
                        {ppeComplianceCategoryLabel(mapping.complianceCategory)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                        <span
                          className={`size-2 rounded-full ${
                            mapping.active
                              ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                              : "bg-slate-300"
                          }`}
                        />
                        {mapping.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        aria-label={`Edit mapping ${mapping.rawLabel}`}
                        className="gap-1.5 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300"
                        onClick={() => handleStartEdit(mapping)}
                        size="sm"
                        variant="outline"
                      >
                        <Pencil className="size-3.5 text-slate-400" />
                        <span>Edit mapping</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card List */}
      {phoneLayout && (
        <div
          aria-label="Canonical PPE Class mappings for mobile"
          className="space-y-3"
          role="list"
        >
          {filteredMappings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              <Search className="mx-auto size-6 text-slate-400" />
              <p className="mt-2 font-medium text-slate-800">No mappings found</p>
              {isFilterActive && (
                <Button className="mt-3" onClick={clearFilters} size="sm" variant="outline">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            filteredMappings.map((mapping) => (
              <article
                aria-label={mapping.rawLabel}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all"
                key={mapping.id}
                role="listitem"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 border border-slate-200">
                        Index {mapping.yoloIndex}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                          mapping.complianceCategory === "compliance"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {ppeComplianceCategoryLabel(mapping.complianceCategory)}
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold text-slate-950">
                      {mapping.canonicalPpeClass}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                    <span
                      className={`size-2 rounded-full ${
                        mapping.active ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    {mapping.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-500">Raw label</dt>
                    <dd className="mt-0.5 font-mono font-medium text-slate-800">{mapping.rawLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Category</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {ppeComplianceCategoryLabel(mapping.complianceCategory)}
                    </dd>
                  </div>
                </dl>

                <Button
                  aria-label={`Edit mapping ${mapping.rawLabel}`}
                  className="mt-4 w-full justify-center gap-1.5"
                  onClick={() => handleStartEdit(mapping)}
                  size="sm"
                  variant="outline"
                >
                  <Pencil className="size-3.5" />
                  <span>Edit mapping</span>
                </Button>
              </article>
            ))
          )}
        </div>
      )}

      {/* Pop-up Modal Form for Add & Edit Mapping */}
      {draft && (
        <AccessibleDialog
          label={draft.id ? "Edit mapping" : "Add mapping"}
          onDismiss={() => {
            setDraft(undefined);
            setLocalError(undefined);
          }}
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {draft.id ? "EDIT MODE" : "NEW MAPPING"}
                  </span>
                </div>
                <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-950">
                  {draft.id ? "Edit mapping" : "Add mapping"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Each YOLO index can be used only once across the active model configuration.
                </p>
              </div>
              <button
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                onClick={() => {
                  setDraft(undefined);
                  setLocalError(undefined);
                }}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              className="mt-5 space-y-4"
              noValidate
              onSubmit={(event) => void submitMapping(event)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    YOLO index
                  </label>
                  <input
                    aria-describedby={yoloIndexError ? "yolo-index-error" : undefined}
                    aria-invalid={Boolean(yoloIndexError)}
                    aria-label="YOLO index"
                    className={`mt-1.5 block h-10 w-full rounded-lg border bg-white px-3.5 font-mono text-sm shadow-2xs transition-all focus:outline-none focus:ring-2 ${
                      yoloIndexError
                        ? "border-red-400 text-red-900 focus:border-red-500 focus:ring-red-200"
                        : "border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-amber-200"
                    }`}
                    min="0"
                    onChange={(event) => updateDraft("yoloIndex", event.target.value)}
                    placeholder="e.g. 0"
                    step="1"
                    type="number"
                    value={draft.yoloIndex}
                  />
                  {yoloIndexError && (
                    <span
                      className="mt-1.5 flex items-center gap-1 text-xs font-normal text-red-700"
                      id="yolo-index-error"
                      role="alert"
                    >
                      <AlertTriangle className="size-3.5 shrink-0" />
                      <span>{yoloIndexError}</span>
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Raw label
                  </label>
                  <input
                    aria-label="Raw label"
                    className="mt-1.5 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 font-mono text-sm text-slate-900 shadow-2xs transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    onChange={(event) => updateDraft("rawLabel", event.target.value)}
                    placeholder="e.g. helmet"
                    value={draft.rawLabel}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Canonical PPE Class
                  </label>
                  <input
                    aria-label="Canonical PPE Class"
                    className="mt-1.5 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-2xs transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    onChange={(event) => updateDraft("canonicalPpeClass", event.target.value)}
                    placeholder="e.g. Safety Helmet"
                    value={draft.canonicalPpeClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Interpretation category
                  </label>
                  <select
                    aria-label="Interpretation category"
                    className="mt-1.5 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-2xs transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    onChange={(event) =>
                      updateDraft(
                        "complianceCategory",
                        event.target.value as CanonicalPpeClassMapping["complianceCategory"],
                      )
                    }
                    value={draft.complianceCategory}
                  >
                    <option value="compliance">Compliant</option>
                    <option value="violation">Violation</option>
                  </select>
                </div>
              </div>

              {/* Mapping active switch */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-800 cursor-pointer select-none">
                  <input
                    checked={draft.active}
                    className="size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    onChange={(event) => updateDraft("active", event.target.checked)}
                    type="checkbox"
                  />
                  <span>Mapping active in pipeline</span>
                </label>
                <p className="mt-0.5 text-xs text-slate-500 pl-6.5">
                  Inactive mappings are ignored during Hazardous Zones compliance checks.
                </p>
              </div>

              {/* Visual Interactive Preview */}
              <aside
                aria-label="Mapping interpretation preview"
                className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-900">
                    <Tag className="size-3.5 text-amber-700" />
                    <span>Interpretation preview:</span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                      preview.complianceCategory === "compliance"
                        ? "bg-emerald-100/90 text-emerald-800 border-emerald-300"
                        : "bg-rose-100/90 text-rose-800 border-rose-300"
                    }`}
                  >
                    {ppeComplianceCategoryLabel(preview.complianceCategory)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded bg-white px-2.5 py-1 font-mono text-xs font-semibold text-slate-900 border border-amber-200 shadow-2xs">
                    {preview.rawLabel.trim() || "Raw label"}
                  </span>
                  <ArrowRight className="size-4 text-amber-600 shrink-0" />
                  <span className="rounded bg-white px-2.5 py-1 text-xs font-bold text-slate-950 border border-amber-200 shadow-2xs">
                    {preview.canonicalPpeClass.trim() || "Canonical PPE Class"}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-700">
                  <span className="font-medium">Interpretation preview: </span>
                  {preview.rawLabel.trim() || "Raw label"} is interpreted as{" "}
                  <span className="font-medium">
                    {preview.canonicalPpeClass.trim() || "Canonical PPE Class"}
                  </span>{" "}
                  with the {ppeComplianceCategoryLabel(preview.complianceCategory).toLowerCase()}.
                </p>
              </aside>

              {/* Modal Footer Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <Button
                  onClick={() => {
                    setDraft(undefined);
                    setLocalError(undefined);
                  }}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-amber-500 font-semibold text-slate-950 hover:bg-amber-400 shadow-xs ring-2 ring-amber-400/30"
                  disabled={updateMutation.isPending}
                  type="submit"
                >
                  {updateMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Saving…</span>
                    </span>
                  ) : (
                    "Save mapping"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </AccessibleDialog>
      )}

      {/* ONNX Model Metadata Section */}
      <section
        aria-labelledby="onnx-metadata-title"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCode className="size-4 text-amber-600" />
              <h2
                className="text-lg font-bold tracking-tight text-slate-950"
                id="onnx-metadata-title"
              >
                ONNX model metadata
              </h2>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
              This file selector stores only demo file metadata for validation. ONNX model execution and inference pipeline run within the computer vision inference engine.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <span>YOLOv8 / ONNX format</span>
          </span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <div className="flex items-center justify-center size-10 rounded-lg bg-amber-100/80 text-amber-700 shrink-0">
            <Upload className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Select ONNX demo file
            </label>
            <input
              accept=".onnx,application/octet-stream"
              aria-label="Select ONNX demo file"
              className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
              onChange={(event) => void selectModelFile(event.target.files?.[0])}
              type="file"
            />
          </div>
        </div>

        {modelFileMetadata && (
          <dl className="mt-4 grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs sm:grid-cols-3">
            <div>
              <dt className="font-medium text-slate-500">File name</dt>
              <dd className="mt-1 font-mono font-semibold text-slate-950 truncate">
                {modelFileMetadata.fileName}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">File size</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {Math.round(modelFileMetadata.sizeBytes / 1024)} KB
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Type</dt>
              <dd className="mt-1 font-mono text-slate-950">
                {modelFileMetadata.mimeType}
              </dd>
            </div>
          </dl>
        )}
      </section>
    </section>
  );
}

export function CanonicalPpeClasses(props: CanonicalPpeClassesProps) {
  return (
    <EnsureQueryClient>
      <CanonicalPpeClassesContent {...props} />
    </EnsureQueryClient>
  );
}
