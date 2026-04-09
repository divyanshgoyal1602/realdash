import React, { useState, useEffect } from 'react';
import { Download, BarChart3, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
} from 'recharts';
import api from '../services/api';
import { PageHeader, Spinner, ProgressBar, Select } from '../components/shared/UI';
import toast from 'react-hot-toast';

const FYS = ['2024-25', '2025-26', '2023-24'];

export default function ReportsPage() {
  const [fy, setFy] = useState('2024-25');
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/office-performance?financialYear=${fy}`);
      setReport(data.report || []);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [fy]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/reports/export-excel?financialYear=${fy}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RealDash_Report_${fy}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Prepare chart data from report
  const chartData = report.map((r) => {
    const categories = Object.entries(r.byCategory || {});
    const totalTarget = categories.reduce((s, [, c]) => s + c.target, 0);
    const totalAchieved = categories.reduce((s, [, c]) => s + c.achieved, 0);
    const completionPct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
    const totalBudget = categories.reduce((s, [, c]) => s + c.budget, 0);
    const totalSpent = categories.reduce((s, [, c]) => s + c.spent, 0);
    const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    return {
      name: r.office?.code?.replace('ITO-', '') || r.office?.name,
      fullName: r.office?.name,
      completion: completionPct,
      budget: budgetPct,
      activities: categories.reduce((s, [, c]) => s + (c.activities?.length || 0), 0),
    };
  });

  // Top 5 and bottom 5
  const sorted = [...chartData].sort((a, b) => b.completion - a.completion);
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Performance Reports"
        subtitle="Office-wise AAP achievement and budget utilisation"
        actions={
          <div className="flex items-center gap-3">
            <Select value={fy} onChange={setFy} options={FYS} className="w-28" />
            <button onClick={fetchReport} className="btn-ghost flex items-center gap-2 text-sm">
              <RefreshCw size={13} />
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Download size={14} />
              {exporting ? 'Exporting…' : 'Export Excel'}
            </button>
          </div>
        }
      />

      {loading ? <Spinner /> : (
        <>
          {/* Overview bar chart */}
          <div className="card p-5">
            <h2 className="section-title mb-4">AAP Completion – All Offices</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 40, left: -10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false}
                  axisLine={false} angle={-40} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n, p) => [`${v}%`, 'Completion']}
                  labelFormatter={(l) => chartData.find(d => d.name === l)?.fullName || l}
                />
                <Bar dataKey="completion" name="Completion %" radius={[3, 3, 0, 0]}
                  fill="#6366f1"
                  label={{
                    position: 'top', fontSize: 9, fill: '#94a3b8',
                    formatter: (v) => v > 0 ? `${v}%` : '',
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top / Bottom performers */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h2 className="section-title mb-4 text-emerald-400">Top 5 Performers</h2>
              <div className="space-y-3">
                {top5.map((o, i) => (
                  <div key={o.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300">{o.name}</span>
                        <span className="text-xs font-mono text-emerald-400">{o.completion}%</span>
                      </div>
                      <ProgressBar value={o.completion} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="section-title mb-4 text-red-400">Needs Attention</h2>
              <div className="space-y-3">
                {bottom5.map((o, i) => (
                  <div key={o.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300">{o.name}</span>
                        <span className="text-xs font-mono text-red-400">{o.completion}%</span>
                      </div>
                      <ProgressBar value={o.completion} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="section-title">Detailed Office Report – FY {fy}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['#', 'Office', 'City', 'Activities', 'Completion %', 'Budget Used', 'Completed', 'Delayed'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left label">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, idx) => (
                    <tr key={row.name} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-200">{row.name}</div>
                        <div className="text-xs text-slate-500">{report[idx]?.office?.city}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{report[idx]?.office?.city}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-300">{row.activities}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${row.completion}%` }} />
                          </div>
                          <span className={`text-xs font-mono ${row.completion >= 75 ? 'text-emerald-400' : row.completion >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                            {row.completion}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${row.budget}%` }} />
                          </div>
                          <span className="text-xs font-mono text-slate-400">{row.budget}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-emerald-400">
                        {Object.values(report[idx]?.byCategory || {}).reduce((s, c) => s + c.activities.filter(a => a.status === 'Completed').length, 0)}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-red-400">
                        {Object.values(report[idx]?.byCategory || {}).reduce((s, c) => s + c.activities.filter(a => a.status === 'Delayed').length, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
