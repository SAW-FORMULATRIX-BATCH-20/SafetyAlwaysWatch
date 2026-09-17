import {
  Activity,
  Shield,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = { compliant: number; date: string; rate: number; total: number };
type PpeBreakdown = { canonicalPpeClass: string; compliant: number; nonCompliant: number };
type SafetyDistribution = { color: string; count: number; status: string };

const statusGradients: Record<string, { start: string; end: string }> = {
  Safe: { start: "#10b981", end: "#059669" },
  Warning: { start: "#f59e0b", end: "#d97706" },
  Critical: { start: "#f43f5e", end: "#dc2626" },
};

export function ReportCharts({
  ppeBreakdown,
  filteredObservationCount,
  period,
  safetyDistribution,
  trend,
}: {
  ppeBreakdown: PpeBreakdown[];
  filteredObservationCount: number;
  period: string;
  safetyDistribution: SafetyDistribution[];
  trend: TrendPoint[];
}) {
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      {/* PPE Compliance Trend */}
      <section
        aria-label="PPE Compliance trend"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">PPE Compliance trend</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              The line shows the compliance percentage; bars show observations per day.
            </p>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <TrendingUp aria-hidden="true" className="size-4" />
          </div>
        </div>

        <div aria-hidden="true" className="mt-5 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <ComposedChart data={trend}>
              <defs>
                <linearGradient id="trendObservationsGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.25} />
                </linearGradient>
                <linearGradient id="trendComplianceArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.94)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "0.75rem",
                  borderColor: "#334155",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
                  color: "#f8fafc",
                  fontSize: "12px",
                  padding: "10px 14px",
                }}
                itemStyle={{ color: "#f8fafc", padding: "2px 0" }}
                labelStyle={{ color: "#94a3b8", fontWeight: 600, marginBottom: "4px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar
                dataKey="total"
                fill="url(#trendObservationsGradient)"
                isAnimationActive={false}
                name="Observations"
                radius={[6, 6, 0, 0]}
              />
              <Area
                dataKey="rate"
                fill="url(#trendComplianceArea)"
                isAnimationActive={false}
                stroke="transparent"
                type="monotone"
              />
              <Line
                activeDot={{ r: 6, fill: "#059669", stroke: "#ffffff", strokeWidth: 2 }}
                dataKey="rate"
                dot={{ r: 4, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive={false}
                name="Compliance"
                stroke="#10b981"
                strokeWidth={3}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-4 font-mono text-xs text-slate-500">
          Period: {period} · {filteredObservationCount} PPE Compliance observations
        </p>
      </section>

      {/* Canonical PPE Classes Breakdown */}
      <section
        aria-label="Canonical PPE Classes breakdown"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Canonical PPE Classes breakdown</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Compare compliant and non-compliant observations for each Canonical PPE Class.
            </p>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-200/60">
            <Shield aria-hidden="true" className="size-4" />
          </div>
        </div>

        <div aria-hidden="true" className="mt-5 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={ppeBreakdown}>
              <defs>
                <linearGradient id="ppeCompliantGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="ppeNonCompliantGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis dataKey="canonicalPpeClass" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.94)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "0.75rem",
                  borderColor: "#334155",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
                  color: "#f8fafc",
                  fontSize: "12px",
                  padding: "10px 14px",
                }}
                itemStyle={{ color: "#f8fafc", padding: "2px 0" }}
                labelStyle={{ color: "#94a3b8", fontWeight: 600, marginBottom: "4px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar
                dataKey="compliant"
                fill="url(#ppeCompliantGradient)"
                isAnimationActive={false}
                name="Compliant"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="nonCompliant"
                fill="url(#ppeNonCompliantGradient)"
                isAnimationActive={false}
                name="Non-compliant"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          {ppeBreakdown
            .map((item) => `${item.canonicalPpeClass}: ${item.compliant} compliant, ${item.nonCompliant} non-compliant`)
            .join(" · ")}
        </p>
      </section>

      {/* Safety Status Distribution */}
      <section
        aria-label="Safety status distribution"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md xl:col-span-2"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Safety status distribution</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Safe, Warning, and Critical are derived from the Employees' Safety Scores in the selected observations.
            </p>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-200/60">
            <Activity aria-hidden="true" className="size-4" />
          </div>
        </div>

        <div aria-hidden="true" className="mt-5 h-56">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={safetyDistribution} layout="vertical">
              <defs>
                {Object.entries(statusGradients).map(([status, grad]) => (
                  <linearGradient id={`statusGrad-${status}`} key={status} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor={grad.start} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={grad.end} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} type="number" />
              <YAxis dataKey="status" tick={{ fontSize: 11, fill: "#64748b" }} type="category" width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.94)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "0.75rem",
                  borderColor: "#334155",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
                  color: "#f8fafc",
                  fontSize: "12px",
                  padding: "10px 14px",
                }}
                itemStyle={{ color: "#f8fafc", padding: "2px 0" }}
                labelStyle={{ color: "#94a3b8", fontWeight: 600, marginBottom: "4px" }}
              />
              <Bar dataKey="count" isAnimationActive={false} name="Employee" radius={[0, 6, 6, 0]}>
                {safetyDistribution.map((item) => (
                  <Cell
                    fill={statusGradients[item.status] ? `url(#statusGrad-${item.status})` : item.color}
                    key={item.status}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          {safetyDistribution.map((item) => `${item.status}: ${item.count}`).join(" · ")}
        </p>
      </section>
    </div>
  );
}
