import {
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

type TrendPoint = {
  compliant: number;
  date: string;
  rate: number;
  total: number;
};

type ApdBreakdown = {
  canonicalApdClass: string;
  compliant: number;
  violation: number;
};

type SafetyDistribution = {
  color: string;
  count: number;
  status: string;
};

export function ReportCharts({
  apdBreakdown,
  filteredObservationCount,
  period,
  safetyDistribution,
  trend,
}: {
  apdBreakdown: ApdBreakdown[];
  filteredObservationCount: number;
  period: string;
  safetyDistribution: SafetyDistribution[];
  trend: TrendPoint[];
}) {
  return (
    <div className="mt-8 grid gap-5 xl:grid-cols-2">
      <section aria-label="Tren Kepatuhan APD" className="border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Tren Kepatuhan APD</h2>
        <p className="mt-1 text-sm text-slate-600">Garis menunjukkan persentase patuh; batang menunjukkan jumlah observasi per hari.</p>
        <div aria-hidden="true" className="mt-5 h-64"><ResponsiveContainer height="100%" width="100%"><ComposedChart data={trend}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 100]} unit="%" /><Tooltip /><Legend /><Bar dataKey="total" fill="#cbd5e1" isAnimationActive={false} name="Observasi" /><Line dataKey="rate" isAnimationActive={false} name="Kepatuhan" stroke="#047857" strokeWidth={2} type="monotone" /></ComposedChart></ResponsiveContainer></div>
        <p className="mt-4 font-mono text-xs text-slate-600">Periode: {period} · {filteredObservationCount} observasi Kepatuhan APD</p>
      </section>
      <section aria-label="Breakdown Kelas APD Kanonis" className="border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Breakdown Kelas APD Kanonis</h2>
        <p className="mt-1 text-sm text-slate-600">Bandingkan observasi patuh dan tidak patuh untuk setiap Kelas APD Kanonis.</p>
        <div aria-hidden="true" className="mt-5 h-64"><ResponsiveContainer height="100%" width="100%"><BarChart data={apdBreakdown}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" /><XAxis dataKey="canonicalApdClass" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="compliant" fill="#047857" isAnimationActive={false} name="Patuh" /><Bar dataKey="violation" fill="#b91c1c" isAnimationActive={false} name="Tidak patuh" /></BarChart></ResponsiveContainer></div>
        <p className="mt-4 text-sm text-slate-600">{apdBreakdown.map((item) => `${item.canonicalApdClass}: ${item.compliant} patuh, ${item.violation} tidak patuh`).join(" · ")}</p>
      </section>
      <section aria-label="Distribusi status keselamatan" className="border border-slate-200 bg-white p-5 xl:col-span-2">
        <h2 className="text-lg font-semibold text-slate-950">Distribusi status keselamatan</h2>
        <p className="mt-1 text-sm text-slate-600">Status Aman, Waspada, dan Kritis diturunkan dari Skor Keselamatan Karyawan pada observasi yang dipilih.</p>
        <div aria-hidden="true" className="mt-5 h-56"><ResponsiveContainer height="100%" width="100%"><BarChart data={safetyDistribution} layout="vertical"><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" /><XAxis allowDecimals={false} type="number" /><YAxis dataKey="status" type="category" width={80} /><Tooltip /><Bar dataKey="count" isAnimationActive={false} name="Karyawan" radius={[0, 3, 3, 0]}>{safetyDistribution.map((item) => <Cell fill={item.color} key={item.status} />)}</Bar></BarChart></ResponsiveContainer></div>
        <p className="mt-4 text-sm text-slate-600">{safetyDistribution.map((item) => `${item.status}: ${item.count}`).join(" · ")}</p>
      </section>
    </div>
  );
}
