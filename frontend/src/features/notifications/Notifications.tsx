import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import type { Persona } from "../../application/personas";
import { Button } from "../../components/ui/button";
import { Pagination } from "../../components/ui/pagination";
import {
  useDeleteNotificationRecipientMutation,
  useNotificationsQuery,
  useSaveNotificationRecipientMutation,
  useSimulateNotificationMutation,
  type NotificationsService,
} from "../../hooks/queries/useNotificationsQuery";
import { cn } from "../../lib/utils";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
import type {
  HazardousZone,
  NotificationRecipient,
  NotificationRecipientRole,
  NotificationRecipientScope,
} from "../../services/saw-service";
import { formatWib } from "../../shared/formatters";
import {
  useNotificationsStore,
  type RecipientRoleFilter,
} from "../../stores/useNotificationsStore";

export type { NotificationsService };

function scopeLabel(recipient: NotificationRecipient, zones: HazardousZone[]) {
  const scope = recipient.scope;
  if (scope.type === "global") return "Global";
  if (scope.type === "zone") {
    const zoneName =
      zones.find((zone) => zone.id === scope.zoneId)?.name ?? scope.zoneId;
    return `Hazardous Zone: ${zoneName}`;
  }
  return `Department: ${scope.departmentId}`;
}

export function Notifications({
  persona,
  service,
}: {
  persona: Persona;
  service?: NotificationsService;
}) {
  return (
    <EnsureQueryClient>
      <NotificationsContent persona={persona} service={service} />
    </EnsureQueryClient>
  );
}

function NotificationsContent({
  persona,
  service,
}: {
  persona: Persona;
  service?: NotificationsService;
}) {
  const {
    recipients,
    logs,
    zones,
    departments,
    isLoading,
    isError,
    error: queryError,
  } = useNotificationsQuery({ service });

  const saveMutation = useSaveNotificationRecipientMutation({ service });
  const simulateMutation = useSimulateNotificationMutation({ service });
  const deleteMutation = useDeleteNotificationRecipientMutation({ service });

  // Form State
  const adding = useNotificationsStore((state) => state.adding);
  const setAdding = useNotificationsStore((state) => state.setAdding);
  const name = useNotificationsStore((state) => state.name);
  const setName = useNotificationsStore((state) => state.setName);
  const chatId = useNotificationsStore((state) => state.chatId);
  const setChatId = useNotificationsStore((state) => state.setChatId);
  const role = useNotificationsStore((state) => state.role);
  const setRole = useNotificationsStore((state) => state.setRole);
  const scopeType = useNotificationsStore((state) => state.scopeType);
  const setScopeType = useNotificationsStore((state) => state.setScopeType);
  const scopeTarget = useNotificationsStore((state) => state.scopeTarget);
  const setScopeTarget = useNotificationsStore((state) => state.setScopeTarget);
  const notice = useNotificationsStore((state) => state.notice);
  const setNotice = useNotificationsStore((state) => state.setNotice);
  const error = useNotificationsStore((state) => state.error);
  const setError = useNotificationsStore((state) => state.setError);
  const resetForm = useNotificationsStore((state) => state.resetForm);

  // Filter and Pagination State
  const recipientSearch = useNotificationsStore(
    (state) => state.recipientSearch,
  );
  const setRecipientSearch = useNotificationsStore(
    (state) => state.setRecipientSearch,
  );
  const recipientRoleFilter = useNotificationsStore(
    (state) => state.recipientRoleFilter,
  );
  const setRecipientRoleFilter = useNotificationsStore(
    (state) => state.setRecipientRoleFilter,
  );
  const recipientPage = useNotificationsStore((state) => state.recipientPage);
  const setRecipientPage = useNotificationsStore(
    (state) => state.setRecipientPage,
  );
  const recipientPageSize = useNotificationsStore(
    (state) => state.recipientPageSize,
  );
  const logStatusFilter = useNotificationsStore(
    (state) => state.logStatusFilter,
  );
  const setLogStatusFilter = useNotificationsStore(
    (state) => state.setLogStatusFilter,
  );
  const logSearch = useNotificationsStore((state) => state.logSearch);
  const setLogSearch = useNotificationsStore((state) => state.setLogSearch);
  const resetRecipientFilters = useNotificationsStore(
    (state) => state.resetRecipientFilters,
  );
  const resetLogFilters = useNotificationsStore(
    (state) => state.resetLogFilters,
  );

  const buildNotificationRecipientScope = (): NotificationRecipientScope =>
    scopeType === "global"
      ? { type: "global" }
      : scopeType === "zone"
        ? { type: "zone", zoneId: scopeTarget }
        : { type: "department", departmentId: scopeTarget };

  const save = async () => {
    setError(undefined);
    try {
      await saveMutation.mutateAsync({
        name,
        chatId,
        role,
        scope: buildNotificationRecipientScope(),
      });
      resetForm();
      setNotice("Notification recipient saved. Chat ID is masked.");
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Notification recipient could not be saved.",
      );
    }
  };

  const simulate = async (
    recipient: NotificationRecipient,
    status: "sent" | "failed",
  ) => {
    setError(undefined);
    try {
      await simulateMutation.mutateAsync({
        recipientId: recipient.id,
        deliveryStatus: status,
      });
      setNotice(`Simulation ${status} recorded for ${recipient.name}.`);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Notification simulation could not run.",
      );
    }
  };

  const removeRecipient = async (recipient: NotificationRecipient) => {
    setError(undefined);
    setNotice(undefined);
    try {
      await deleteMutation.mutateAsync(recipient.id);
      setNotice(`Notification recipient deleted: ${recipient.name}.`);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Notification recipient could not be deleted.",
      );
    }
  };

  if (isLoading || isError || !recipients || !logs) {
    return (
      <section aria-busy="true" className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.16em] text-amber-800 font-semibold">
            <Sparkles className="size-3.5 text-amber-600" />
            Safe simulation
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Notifications
        </h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <p className="text-sm font-medium text-slate-600">
            {queryError?.message ?? error ?? "Loading notification simulation…"}
          </p>
        </div>
      </section>
    );
  }

  const isAdmin = persona.role === "admin";

  // Filter and Paginate Recipients
  const filteredRecipients = recipients.filter((r) => {
    const matchesSearch =
      !recipientSearch.trim() ||
      r.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      r.maskedChatId.toLowerCase().includes(recipientSearch.toLowerCase());
    const matchesRole =
      recipientRoleFilter === "all" || r.role === recipientRoleFilter;
    return matchesSearch && matchesRole;
  });

  const totalRecipientPages = Math.max(
    1,
    Math.ceil(filteredRecipients.length / recipientPageSize),
  );
  const safeRecipientPage = Math.min(recipientPage, totalRecipientPages);
  const paginatedRecipients = filteredRecipients.slice(
    (safeRecipientPage - 1) * recipientPageSize,
    safeRecipientPage * recipientPageSize,
  );

  // Filter Simulation Logs
  const filteredLogs = logs.filter((log) => {
    const matchesStatus =
      logStatusFilter === "all" || log.deliveryStatus === logStatusFilter;
    const matchesSearch =
      !logSearch.trim() ||
      log.recipientName.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.violationId.toLowerCase().includes(logSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const displayedLogs = [...filteredLogs].reverse();
  const sentCount = logs.filter((l) => l.deliveryStatus === "sent").length;
  const failedCount = logs.filter((l) => l.deliveryStatus === "failed").length;

  return (
    <section className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.16em] text-amber-800 font-semibold">
            <Sparkles className="size-3.5 text-amber-600" />
            Safe simulation
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Notifications
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-slate-600 leading-relaxed">
          Manage recipient mappings and inspect simulated delivery results. Raw
          Chat IDs, bot tokens, and real messages are not stored or displayed.
        </p>
      </div>

      {/* Notice & Error Feedback Banners */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-2xs animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium">{notice}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotice(undefined)}
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/90 p-4 text-red-900 shadow-2xs animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-5 text-red-600 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(undefined)}
            className="rounded-lg p-1 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Simulation Recipients (Admin Only) */}
      {isAdmin && (
        <section className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="size-5 text-slate-700" />
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Simulation recipients
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {filteredRecipients.length} of {recipients.length}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Human Resources (HR) uses global scope. An Area Supervisor must
                be assigned to a Hazardous Zone or department.
              </p>
            </div>
            {!adding && (
              <Button
                onClick={() => setAdding(true)}
                className="gap-2 shadow-xs shrink-0 self-start sm:self-auto"
              >
                <Plus className="size-4" />
                Add recipient
              </Button>
            )}
          </div>

          {/* Add Recipient Form Card */}
          {adding && (
            <div className="rounded-2xl border border-amber-200/90 bg-amber-50/40 p-5 sm:p-6 shadow-2xs animate-in fade-in zoom-in-98 duration-200">
              <div className="flex items-center justify-between border-b border-amber-100/90 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-amber-700" />
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                    New Recipient Form
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-amber-100/50 transition-colors cursor-pointer"
                  aria-label="Close form"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Recipient name
                  </label>
                  <input
                    aria-label="Recipient name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    placeholder="e.g. Operations Human Resources"
                    onChange={(event) => setName(event.target.value)}
                    value={name}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Chat ID
                  </label>
                  <input
                    aria-label="Chat ID"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 shadow-2xs transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    placeholder="e.g. 1234567890"
                    onChange={(event) => setChatId(event.target.value)}
                    value={chatId}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Recipient role
                  </label>
                  <select
                    aria-label="Recipient role"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    onChange={(event) => {
                      const value = event.target
                        .value as NotificationRecipientRole;
                      setRole(value);
                    }}
                    value={role}
                  >
                    <option value="Human Resources (HR)">
                      Human Resources (HR)
                    </option>
                    <option value="Area Supervisor">Area Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Recipient scope
                  </label>
                  <select
                    aria-label="Recipient scope"
                    disabled={role === "Human Resources (HR)"}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    onChange={(event) => {
                      setScopeType(
                        event.target.value as NotificationRecipientScope["type"],
                      );
                    }}
                    value={scopeType}
                  >
                    <option value="global">Global</option>
                    <option value="zone">Hazardous Zone</option>
                    <option value="department">Department</option>
                  </select>
                </div>

                {scopeType === "zone" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Target Hazardous Zone
                    </label>
                    <select
                      aria-label="Target Hazardous Zone"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                      onChange={(event) => setScopeTarget(event.target.value)}
                      value={scopeTarget}
                    >
                      <option value="">Select Hazardous Zone</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {scopeType === "department" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Target department
                    </label>
                    <select
                      aria-label="Target department"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                      onChange={(event) => setScopeTarget(event.target.value)}
                      value={scopeTarget}
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department}>{department}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 border-t border-amber-100/90 pt-4">
                <Button onClick={() => setAdding(false)} variant="outline">
                  Cancel
                </Button>
                <Button
                  disabled={
                    !name.trim() ||
                    !chatId.trim() ||
                    (scopeType !== "global" && !scopeTarget)
                  }
                  onClick={() => void save()}
                >
                  Save recipient
                </Button>
              </div>
            </div>
          )}

          {/* Search and Filters Toolbar for Recipients */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/70 p-3 rounded-xl border border-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                aria-label="Search recipients"
                type="search"
                placeholder="Search recipient by name or Chat ID..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-colors"
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by role"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-2xs focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
                value={recipientRoleFilter}
                onChange={(e) =>
                  setRecipientRoleFilter(e.target.value as RecipientRoleFilter)
                }
              >
                <option value="all">All roles ({recipients.length})</option>
                <option value="Human Resources (HR)">
                  Human Resources (HR)
                </option>
                <option value="Area Supervisor">Area Supervisor</option>
              </select>
              {(recipientSearch.trim() || recipientRoleFilter !== "all") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={resetRecipientFilters}
                  className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Recipients Cards Grid or Empty State */}
          {filteredRecipients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
              <Users className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500 font-medium">
                No recipients match the filter criteria.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={resetRecipientFilters}
                className="mt-3 text-xs gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div
                role="list"
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                {paginatedRecipients.map((recipient) => (
                  <article
                    aria-label={recipient.name}
                    key={recipient.id}
                    role="listitem"
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-slate-950 tracking-tight">
                          {recipient.name}
                        </h3>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 whitespace-nowrap",
                            recipient.role === "Human Resources (HR)"
                              ? "border-violet-200 bg-violet-50 text-violet-700"
                              : "border-sky-200 bg-sky-50 text-sky-700",
                          )}
                        >
                          {recipient.role}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {scopeLabel(recipient, zones)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-mono text-slate-600">
                        <Lock className="size-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700 shrink-0">
                          Chat ID:
                        </span>
                        <span className="truncate">
                          {recipient.maskedChatId}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => void simulate(recipient, "sent")}
                        className="w-full justify-center text-xs font-semibold gap-2 bg-emerald-600 text-white hover:bg-emerald-500 shadow-2xs whitespace-nowrap py-2 h-auto min-h-8"
                      >
                        <Send className="size-3.5 shrink-0 text-emerald-100" />
                        <span>Simulate sent</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void simulate(recipient, "failed")}
                        className="w-full justify-center text-xs font-semibold gap-2 bg-rose-600 text-white hover:bg-rose-500 shadow-2xs whitespace-nowrap py-2 h-auto min-h-8"
                      >
                        <AlertTriangle className="size-3.5 shrink-0 text-rose-100" />
                        <span>Simulate failed</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void removeRecipient(recipient)}
                        variant="outline"
                        className="w-full justify-center text-xs font-medium text-slate-600 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 gap-1.5 py-2 h-auto min-h-8"
                      >
                        <Trash2 className="size-3.5 shrink-0" />
                        <span>Delete recipient</span>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Recipients Pagination */}
              <Pagination
                currentPage={safeRecipientPage}
                totalPages={totalRecipientPages}
                onPageChange={setRecipientPage}
                ariaLabel="Recipients pagination"
              />
            </>
          )}
        </section>
      )}

      {/* Notification Simulation Logs Section */}
      <section className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Notification simulation log
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {displayedLogs.length} of {logs.length}
            </span>
          </div>

          {/* Status Pills Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setLogStatusFilter("all")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                logStatusFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              All ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setLogStatusFilter("sent")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                logStatusFilter === "sent"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60",
              )}
            >
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Sent ({sentCount})
            </button>
            <button
              type="button"
              onClick={() => setLogStatusFilter("failed")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                logStatusFilter === "failed"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60",
              )}
            >
              <span className="size-1.5 rounded-full bg-rose-400" />
              Failed ({failedCount})
            </button>
          </div>
        </div>

        {/* Search Input for Simulation Logs */}
        {logs.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                aria-label="Search simulation logs"
                type="search"
                placeholder="Filter logs by recipient name or violation ID..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 shadow-2xs transition-colors"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
              />
            </div>
            {(logStatusFilter !== "all" || logSearch.trim()) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={resetLogFilters}
                className="text-xs gap-1 text-slate-500 hover:text-slate-900 h-7 px-2"
              >
                <RotateCcw className="size-3" />
                Reset
              </Button>
            )}
          </div>
        )}

        {/* Scrollable Simulation Logs Feed or Empty State */}
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <Bell className="mx-auto size-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500 font-medium">
              No notification simulation log.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Simulated delivery logs will appear here once triggered.
            </p>
          </div>
        ) : displayedLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center bg-slate-50/40">
            <p className="text-xs text-slate-500">
              No simulation logs match the active filter.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={resetLogFilters}
              className="mt-2 text-xs gap-1"
            >
              <RotateCcw className="size-3" />
              Reset log filters
            </Button>
          </div>
        ) : (
          <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200/90 shadow-2xs">
            {displayedLogs.map((log) => {
              const isSent = log.deliveryStatus === "sent";
              return (
                <article
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 hover:bg-slate-50/80 transition-colors gap-3"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={cn(
                        "rounded-full p-2 mt-0.5 shrink-0",
                        isSent
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {isSent ? (
                        <Check className="size-4" />
                      ) : (
                        <AlertTriangle className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-950 text-sm truncate">
                          {log.recipientName}
                        </p>
                        <span className="text-xs text-slate-300 shrink-0">•</span>
                        <p className="text-xs font-medium text-slate-600">
                          {log.recipientRole} · Violation Event {log.violationId}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                        <Clock className="size-3 text-slate-400 shrink-0" />
                        <p>{formatWib(log.occurredAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide shrink-0 whitespace-nowrap",
                        isSent
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
                          isSent ? "bg-emerald-500" : "bg-rose-500",
                        )}
                      />
                      <span>
                        {log.deliveryStatus === "sent" ? "Sent" : "Failed"} · SIMULATION
                      </span>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
