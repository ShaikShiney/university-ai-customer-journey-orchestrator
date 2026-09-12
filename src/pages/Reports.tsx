import { useState } from 'react';
import { Card, KpiCard, Button, Select, SectionHeader, Badge, ProgressBar } from '../components/ui';

export default function Reports() {
  const [dateRange, setDateRange] = useState('30d');

  const barData = [
    { label: 'Admission', value: 72 },
    { label: 'Registration', value: 85 },
    { label: 'Timetable', value: 91 },
    { label: 'Teaching', value: 88 },
    { label: 'Assessment', value: 79 },
    { label: 'Research', value: 65 },
    { label: 'Placement', value: 48 },
    { label: 'Graduation', value: 94 },
  ];

  const lineData = [42, 38, 51, 47, 62, 58, 71, 69, 78, 82, 76, 84];
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const maxLine = Math.max(...lineData);

  const donutSegments = [
    { label: 'B.Tech CS', pct: 35, color: '#6366f1' },
    { label: 'MBA', pct: 22, color: '#0ea5e9' },
    { label: 'M.Tech AI', pct: 18, color: '#10b981' },
    { label: 'B.Tech Electronics', pct: 25, color: '#f59e0b' },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {['7d', '30d', '90d', '1y'].map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dateRange === r ? 'bg-[#1e3a5f] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : r === '90d' ? 'Last 90 days' : 'Last year'}
              </button>
            ))}
          </div>
          <Select value="all" onChange={() => {}} options={[{ value: 'all', label: 'All programmes' }, { value: 'cs', label: 'B.Tech CS' }, { value: 'mba', label: 'MBA' }]} />
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" size="sm">Saved Reports</Button>
            <Button variant="secondary" size="sm">Export PDF</Button>
            <Button variant="secondary" size="sm">Export CSV</Button>
          </div>
        </div>
      </Card>

      {/* Customer Journey KPIs */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Customer Journey</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Active Students" value="847" change={3.2} changeLabel="vs last period" />
          <KpiCard label="Journey Completions" value="124" change={12.1} changeLabel="vs last period" />
          <KpiCard label="Avg Completion Rate" value="74%" change={2.8} changeLabel="vs last period" />
          <KpiCard label="At-Risk Interventions" value="38" change={-5.1} changeLabel="vs last period" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Journey completion by stage — bar chart */}
        <Card className="p-5">
          <SectionHeader title="Journey Completion by Stage" subtitle="% of students completing each stage" />
          <div className="space-y-2.5 mt-2">
            {barData.map(bar => (
              <div key={bar.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20">{bar.label}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all flex items-center pl-2"
                    style={{ width: `${bar.value}%`, background: bar.value > 80 ? '#059669' : bar.value > 60 ? '#6366f1' : '#d97706' }}
                  >
                    <span className="text-[10px] font-bold text-white">{bar.value}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Engagement trend — line chart */}
        <Card className="p-5">
          <SectionHeader title="Engagement Trend" subtitle="Avg engagement score, last 12 months" />
          <div className="relative h-40 flex items-end gap-1 mt-4">
            {lineData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm bg-indigo-500 transition-all hover:bg-indigo-600"
                  style={{ height: `${(v / maxLine) * 130}px`, minHeight: 4 }} />
                <span className="text-[9px] text-slate-400">{months[i]}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-emerald-600 font-semibold">↑ +42% vs 12 months ago</span>
            <span className="text-xs text-slate-400">Peak: Sep 84%</span>
          </div>
        </Card>
      </div>

      {/* Service KPIs */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Service Performance</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Open Tickets" value="42" change={-8.1} changeLabel="vs last period" />
          <KpiCard label="Avg Resolution Time" value="18.4h" change={-12.3} changeLabel="vs last period" />
          <KpiCard label="SLA Compliance" value="86%" change={-4.2} changeLabel="vs last period" />
          <KpiCard label="CSAT Score" value="4.2/5" change={0.3} changeLabel="vs last period" />
        </div>
      </div>

      {/* Campaign & AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionHeader title="Campaign Performance" subtitle="Last 30 days" />
          <div className="space-y-4">
            {[
              { label: 'Audience Reached', value: 2841, total: 3200, pct: 89 },
              { label: 'Email Delivery Rate', value: 2798, total: 2841, pct: 98 },
              { label: 'Open Rate', value: 1063, total: 2798, pct: 38 },
              { label: 'Click Rate', value: 403, total: 1063, pct: 38 },
              { label: 'Conversion Rate', value: 57, total: 403, pct: 14 },
            ].map(c => (
              <div key={c.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{c.label}</span>
                  <span className="font-mono text-slate-700">{c.value.toLocaleString()} ({c.pct}%)</span>
                </div>
                <ProgressBar value={c.pct} color="#6366f1" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="AI Performance Summary" subtitle="Model accuracy & adoption" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Intent Accuracy', value: '94%', color: 'text-emerald-600' },
              { label: 'Churn Accuracy', value: '91%', color: 'text-emerald-600' },
              { label: 'NBA Acceptance', value: '78%', color: 'text-indigo-600' },
              { label: 'False Positives', value: '6.1%', color: 'text-amber-600' },
            ].map(m => (
              <div key={m.label} className="bg-slate-50 rounded-xl p-3">
                <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-slate-500">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Donut chart legend */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Students by Programme</p>
            <div className="flex gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                  {(() => {
                    let offset = 0;
                    return donutSegments.map(seg => {
                      const dash = seg.pct;
                      const el = (
                        <circle key={seg.label} cx="18" cy="18" r="15.9155" fill="none"
                          stroke={seg.color} strokeWidth="4"
                          strokeDasharray={`${dash} ${100 - dash}`}
                          strokeDashoffset={-offset}
                        />
                      );
                      offset += dash;
                      return el;
                    });
                  })()}
                </svg>
              </div>
              <div className="flex-1 space-y-1.5">
                {donutSegments.map(seg => (
                  <div key={seg.label} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="text-slate-600 flex-1">{seg.label}</span>
                    <span className="font-mono text-slate-700">{seg.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Retention */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Retention</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Retention Rate" value="94%" change={1.2} changeLabel="vs last year" />
          <KpiCard label="At-Risk Population" value="86" sublabel="Churn propensity >40%" />
          <KpiCard label="Re-engagement Success" value="61%" change={8.4} changeLabel="vs last quarter" />
          <KpiCard label="Interventions Completed" value="124" change={18.7} changeLabel="vs last quarter" />
        </div>
      </div>
    </div>
  );
}
