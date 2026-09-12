import { useState } from 'react';
import { Card, KpiCard, Badge, AiBanner, ConfidenceBadge, Button, RiskBadge, TicketStatusBadge, Avatar, ProgressBar, SectionHeader } from '../components/ui';
import { MOCK_STUDENTS, MOCK_TICKETS, MOCK_NOTIFICATIONS, JOURNEY_STAGES } from '../data';
import type { Role } from '../data';

interface DashboardProps {
  role: Role;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function Dashboard({ role, onNavigate }: DashboardProps) {
  const [aiDismissed, setAiDismissed] = useState(false);

  if (role === 'customer') return <CustomerDashboard onNavigate={onNavigate} />;
  if (role === 'agent') return <AgentDashboard onNavigate={onNavigate} />;
  if (role === 'marketing') return <MarketingDashboard onNavigate={onNavigate} />;
  if (role === 'sales') return <SalesDashboard onNavigate={onNavigate} />;

  // Admin dashboard
  return (
    <div className="p-6 space-y-6">
      {/* AI alert */}
      {!aiDismissed && (
        <AiBanner>
          <p className="text-sm text-indigo-900 font-medium">3 students at critical churn risk this week — immediate intervention recommended.</p>
          <div className="flex items-center gap-3 mt-3">
            <ConfidenceBadge value={91} />
            <span className="text-xs text-indigo-500">Model v2.4.1 · Updated 2 hrs ago</span>
            <button onClick={() => onNavigate('predictions')} className="ml-auto text-xs text-indigo-700 font-medium hover:underline">View predictions →</button>
            <button onClick={() => setAiDismissed(true)} className="text-xs text-indigo-400 hover:text-indigo-600">Dismiss</button>
          </div>
        </AiBanner>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Students" value="847" change={3.2} changeLabel="vs last month"
          icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
        <KpiCard label="Open Tickets" value="42" change={-8.1} changeLabel="vs last week"
          icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 1 2-2z"/></svg>} />
        <KpiCard label="AI Recommendations" value="128" sublabel="41 pending review"
          icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>} />
        <KpiCard label="Avg Engagement" value="71%" change={5.4} changeLabel="vs last month"
          icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journey stage distribution */}
        <Card className="p-5 col-span-1">
          <SectionHeader title="Journey Stage Distribution" subtitle="All active students" />
          <div className="space-y-3">
            {JOURNEY_STAGES.map(stage => {
              const count = Math.floor(Math.random() * 150 + 30);
              const pct = Math.round((count / 847) * 100);
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">{stage.name}</span>
                    <span className="text-slate-400 font-mono">{count}</span>
                  </div>
                  <ProgressBar value={pct} color={stage.color} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* At-risk students */}
        <Card className="p-5 col-span-2">
          <SectionHeader
            title="At-Risk Students"
            subtitle="Requiring immediate attention"
            actions={<Button variant="ghost" size="sm" onClick={() => onNavigate('customers')}>View all →</Button>}
          />
          <div className="space-y-3">
            {MOCK_STUDENTS.filter(s => ['high', 'critical'].includes(s.riskLevel)).map(student => (
              <div key={student.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-slate-100" onClick={() => onNavigate('customerProfile')}>
                <Avatar initials={student.avatar} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                    <RiskBadge level={student.riskLevel} />
                  </div>
                  <p className="text-xs text-slate-500">{student.programme} · {student.journeyStage}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">Churn risk</p>
                  <p className="text-sm font-bold text-red-600">{student.churnPropensity}%</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">Engagement</p>
                  <p className={`text-sm font-bold ${student.engagementScore > 60 ? 'text-emerald-600' : 'text-amber-600'}`}>{student.engagementScore}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent tickets */}
        <Card className="p-5">
          <SectionHeader
            title="Recent Tickets"
            subtitle="Open & escalated"
            actions={<Button variant="ghost" size="sm" onClick={() => onNavigate('tickets')}>View all →</Button>}
          />
          <div className="space-y-2">
            {MOCK_TICKETS.slice(0, 4).map(ticket => (
              <div key={ticket.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onNavigate('tickets')}>
                <div className="shrink-0">
                  <TicketStatusBadge status={ticket.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{ticket.subject}</p>
                  <p className="text-xs text-slate-500">{ticket.studentName} · {ticket.category}</p>
                </div>
                {ticket.slaBreached && <Badge variant="danger" className="shrink-0">SLA Breached</Badge>}
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-5">
          <SectionHeader
            title="Recent Alerts"
            subtitle="Unread notifications"
            actions={<Button variant="ghost" size="sm" onClick={() => onNavigate('notifications')}>View all →</Button>}
          />
          <div className="space-y-2">
            {MOCK_NOTIFICATIONS.filter(n => !n.read).map(notif => (
              <div key={notif.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.severity === 'critical' ? 'bg-red-500' : notif.severity === 'warning' ? 'bg-amber-500' : 'bg-indigo-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{notif.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{notif.description}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{notif.timestamp}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Role-specific dashboards ───────────────────────────────────────────────

function AgentDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="My Open Tickets" value="7" />
        <KpiCard label="Escalated" value="2" />
        <KpiCard label="SLA at Risk" value="3" />
        <KpiCard label="Resolved Today" value="5" change={25} changeLabel="vs yesterday" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionHeader title="My Ticket Queue" actions={<Button size="sm" variant="ghost" onClick={() => onNavigate('tickets')}>Open queue →</Button>} />
          <div className="space-y-2">
            {MOCK_TICKETS.filter(t => !['resolved','closed'].includes(t.status)).slice(0,5).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-slate-100" onClick={() => onNavigate('tickets')}>
                <TicketStatusBadge status={t.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{t.subject}</p>
                  <p className="text-xs text-slate-500">{t.studentName}</p>
                </div>
                {t.slaBreached && <Badge variant="danger">SLA</Badge>}
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <SectionHeader title="AI Suggestions" subtitle="Pending your review" />
          <AiBanner className="mb-4">
            <p className="text-sm text-indigo-900 font-medium">"Schedule placement advisor follow-up for Sneha Rao"</p>
            <ConfidenceBadge value={91} />
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="success">Approve</Button>
              <Button size="sm" variant="secondary">Defer</Button>
              <Button size="sm" variant="ghost">Reject</Button>
            </div>
          </AiBanner>
        </Card>
      </div>
    </div>
  );
}

function MarketingDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Campaigns" value="6" />
        <KpiCard label="Emails Sent" value="2,841" change={12.4} changeLabel="vs last week" />
        <KpiCard label="Open Rate" value="38%" change={4.1} changeLabel="vs last campaign" />
        <KpiCard label="Conversion Rate" value="14.2%" change={-2.1} changeLabel="vs last campaign" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionHeader title="Segment Overview" actions={<Button size="sm" variant="ghost" onClick={() => onNavigate('segments')}>Manage segments →</Button>} />
          <div className="space-y-3">
            {[
              { name: 'Placement Risk — Final Year', audience: 312, eligible: 280, consented: 248 },
              { name: 'Low Attendance — Warning Zone', audience: 186, eligible: 170, consented: 142 },
              { name: 'High Engagement — Placement Ready', audience: 208, eligible: 208, consented: 198 },
            ].map(seg => (
              <div key={seg.name} className="p-3 border border-slate-200 rounded-xl">
                <p className="text-sm font-medium text-slate-800 mb-2">{seg.name}</p>
                <div className="flex gap-4 text-xs">
                  <span className="text-slate-500">Total: <strong className="text-slate-700">{seg.audience}</strong></span>
                  <span className="text-indigo-600">Eligible: <strong>{seg.eligible}</strong></span>
                  <span className="text-emerald-600">Consented: <strong>{seg.consented}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <SectionHeader title="Consent Status" subtitle="Communication consent coverage" />
          <div className="space-y-3">
            {[
              { label: 'Email consent granted', pct: 82 },
              { label: 'SMS consent granted', pct: 61 },
              { label: 'Push notifications', pct: 44 },
            ].map(c => (
              <div key={c.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{c.label}</span>
                  <span className="font-medium text-slate-700">{c.pct}%</span>
                </div>
                <ProgressBar value={c.pct} color="#6366f1" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SalesDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Prospects Tracked" value="124" change={8.2} changeLabel="vs last month" />
        <KpiCard label="High Conversion" value="37" sublabel="≥75% propensity" />
        <KpiCard label="Follow-ups Due" value="12" />
        <KpiCard label="Conversions This Month" value="28" change={14.3} changeLabel="vs last month" />
      </div>
      <Card className="p-5">
        <SectionHeader title="Top Conversion Prospects" subtitle="Ranked by propensity score" actions={<Button size="sm" variant="ghost" onClick={() => onNavigate('predictions')}>View predictions →</Button>} />
        <div className="space-y-3">
          {MOCK_STUDENTS.slice(0, 3).map(s => (
            <div key={s.id} className="flex items-center gap-4 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer" onClick={() => onNavigate('customerProfile')}>
              <Avatar initials={s.avatar} size="md" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-slate-500">{s.programme}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Conversion</p>
                <p className="text-sm font-bold text-indigo-600">{100 - s.churnPropensity}%</p>
              </div>
              <Button size="sm" variant="secondary">Follow up</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CustomerDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const student = MOCK_STUDENTS[0];
  return (
    <div className="p-6 space-y-6">
      <div className="bg-[#0f1f3d] rounded-2xl p-6 text-white">
        <p className="text-white/60 text-sm mb-1">Welcome back</p>
        <h2 className="text-2xl font-bold mb-1">{student.name}</h2>
        <p className="text-white/60 text-sm">{student.programme} · Year {student.year} · {student.journeyStage} stage</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Attendance" value={`${student.attendance}%`} />
        <KpiCard label="GPA" value={student.gpa.toFixed(1)} />
        <KpiCard label="Open Tickets" value={student.openTickets} />
        <KpiCard label="Placement Readiness" value={`${student.placementReadiness}%`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionHeader title="My Journey Progress" />
          <div className="space-y-3">
            {JOURNEY_STAGES.map((stage, i) => {
              const stageDone = i < 6;
              const stageCurrent = stage.name === student.journeyStage;
              return (
                <div key={stage.key} className={`flex items-center gap-3 p-2 rounded-lg ${stageCurrent ? 'bg-indigo-50 border border-indigo-200' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${stageDone ? 'bg-emerald-500 text-white' : stageCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {stageDone ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm ${stageCurrent ? 'font-semibold text-indigo-700' : stageDone ? 'text-slate-500 line-through' : 'text-slate-400'}`}>{stage.name}</span>
                  {stageCurrent && <Badge variant="ai">Current</Badge>}
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-5">
          <SectionHeader title="My Open Tickets" actions={<Button size="sm" variant="ghost" onClick={() => onNavigate('tickets')}>View all →</Button>} />
          <div className="space-y-2">
            {MOCK_TICKETS.filter(t => t.studentId === 's1').map(t => (
              <div key={t.id} className="p-3 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <TicketStatusBadge status={t.status} />
                  <span className="text-xs text-slate-400 font-mono">{t.id}</span>
                </div>
                <p className="text-sm text-slate-700">{t.subject}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
