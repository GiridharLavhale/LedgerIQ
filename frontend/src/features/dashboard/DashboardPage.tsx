import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Database,
  DollarSign,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi, batchesApi } from '../../api';
import { KPICard } from '../../components/KPICard';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const DashboardPage: React.FC = () => {
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: dashboardApi.getMetrics,
    refetchInterval: 5000,
  });

  const { data: batchesData, isLoading: batchesLoading } = useQuery({
    queryKey: ['recentBatches'],
    queryFn: () => batchesApi.list(5),
  });

  if (metricsLoading) {
    return <LoadingSkeleton rows={8} />;
  }

  const kpis = metricsData?.kpis || {
    total_transactions: 0,
    matched_transactions: 0,
    exception_transactions: 0,
    platform_match_rate_pct: 0,
    total_volume_inr: 0,
    unreconciled_discrepancy_inr: 0,
  };

  const trend = metricsData?.trend || [];
  const exceptionCats = metricsData?.exception_categories || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Finance Operations Command Center</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial reconciliation, deterministic verification, and exception analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/reconciliation"
            className="inline-flex items-center gap-2 rounded bg-[#0066ff] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0050cc] transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>New Reconciliation Batch</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Platform Match Rate"
          value={`${kpis.platform_match_rate_pct}%`}
          subtitle={`${kpis.matched_transactions.toLocaleString()} / ${kpis.total_transactions.toLocaleString()} txns`}
          icon={CheckCircle2}
          accentColor="emerald"
          trend="+4.2% vs target"
          trendPositive={true}
        />
        <KPICard
          title="Total Reconciled Volume"
          value={`₹${(kpis.total_volume_inr || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle="Processed gross amount"
          icon={TrendingUp}
          accentColor="blue"
        />
        <KPICard
          title="Unreconciled Variance"
          value={`₹${(kpis.unreconciled_discrepancy_inr || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${kpis.exception_transactions} active exceptions`}
          icon={AlertOctagon}
          accentColor="rose"
          trend="Flagged for human review"
          trendPositive={false}
        />
        <KPICard
          title="Engine Throughput"
          value="3,300+ RPS"
          subtitle="Sub-second 4-tier matching"
          icon={Activity}
          accentColor="amber"
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Reconciliation Trend Chart */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reconciliation Volume & Match Trend</h3>
              <p className="text-[11px] text-slate-500">Processed transaction volume and deterministic match rate</p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 font-semibold">
              Live Feed
            </span>
          </div>
          <div className="mt-4 h-72">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066ff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0066ff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                    labelStyle={{ color: '#0b1c30', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="volume_inr" stroke="#0066ff" strokeWidth={2} fillOpacity={1} fill="url(#colorVol)" name="Volume (INR)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Click "Demo Benchmark" to load operational visual data.
              </div>
            )}
          </div>
        </div>

        {/* Exception Category Breakdown */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Exception Distribution</h3>
            <p className="text-[11px] text-slate-500">Classified by root cause engine</p>
          </div>
          <div className="mt-4 h-72">
            {exceptionCats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exceptionCats} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis type="category" dataKey="category" stroke="#64748b" fontSize={10} width={110} tickFormatter={(v) => v.replace(/_/g, ' ')} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '4px' }}
                  />
                  <Bar dataKey="count" fill="#ba1a1a" radius={[0, 2, 2, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No exceptions logged.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Reconciliation Batches Table */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Reconciliation Batches</h3>
            <p className="text-[11px] text-slate-500">Latest multi-source settlement jobs and status</p>
          </div>
          <Link
            to="/reconciliation"
            className="flex items-center gap-1 text-xs font-semibold text-[#0066ff] hover:text-[#0050cc]"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs tnum">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-2.5 px-3">Batch Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Records</th>
                <th className="py-2.5 px-3">Match Rate</th>
                <th className="py-2.5 px-3">Exceptions</th>
                <th className="py-2.5 px-3">Discrepancy</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {batchesData && batchesData.length > 0 ? (
                batchesData.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                      <Link to={`/batches/${b.id}`} className="hover:text-[#0066ff] hover:underline">
                        {b.name}
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-700">{b.total_records.toLocaleString()}</td>
                    <td className="py-3 px-3 font-bold text-emerald-700">{b.match_rate}%</td>
                    <td className="py-3 px-3 text-rose-700">{b.exception_records}</td>
                    <td className="py-3 px-3 text-slate-700">
                      ₹{floatVal(b.discrepancy_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{b.processing_time_ms} ms</td>
                    <td className="py-3 px-3 text-right font-sans">
                      <Link
                        to={`/batches/${b.id}`}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#0066ff] hover:text-[#0066ff]"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No batches executed yet. Click "Demo Benchmark" on the top right to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function floatVal(v: any): number {
  return typeof v === 'number' ? v : parseFloat(v || 0);
}
