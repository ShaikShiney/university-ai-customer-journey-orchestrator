import { useState } from 'react';
import {
  Avatar, Badge, Button, Card, KpiCard, Tabs,
  RiskBadge, AiBanner, ConfidenceBadge, ProgressBar,
  SectionHeader, TicketStatusBadge, PriorityBadge,
  Modal, Drawer, Skeleton,
} from '../components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelineEvent {
  id: string;
  type: 'email' | 'sms' | 'phone' | 'advisor' | 'registration' | 'ticket' | 'placement' | 'assessment' | 'web';
  title: string;
  description: string;
  date: string;
  time: string;
  owner: string;
  status: 'completed' | 'open' | 'pending' | 'failed';
  outcome?: string;
  sentiment?: 'positive' | 'neutral' | 'frustrated' | 'concerned';
  relatedId?: string;
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const STUDENT = {
  id: 's1',
  name: 'Ananya Sharma',
  studentId: 'STU-2026-0142',
  avatar: 'AS',
  programme: 'B.Tech Computer Science',
  department: 'Computer Science',
  year: 3,
  yearLabel: '3rd Year',
  journeyStage: 'Placement',
  riskLevel: 'medium' as const,
  engagementLevel: 'high',
  engagementScore: 78,
  email: 'a.sharma@student.university.edu',
  phone: '+91 98765 43210',
  attendance: 82,
  cgpa: 8.4,
  openTickets: 2,
  churnPropensity: 18,
  placementReadiness: 76,
  consentEmail: true,
  consentSMS: true,
  consentMessaging: true,
  consentMarketing: false,
  commFrequency: 3,
  commFrequencyLimit: 5,
  enrolledDate: '2023-08-01',
  advisor: 'Dr. Rekha Iyer',
};

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 't1',
    type: 'placement',
    title: 'Viewed TCS placement drive details',
    description: 'Student accessed the TCS 2026 campus recruitment page and downloaded role specifications.',
    date: 'Sep 7, 2026',
    time: '09:42 AM',
    owner: 'Portal System',
    status: 'completed',
    outcome: 'Engaged — 12 min session',
    sentiment: 'positive',
  },
  {
    id: 't2',
    type: 'ticket',
    title: 'Service ticket raised — Placement portal error',
    description: 'Student reported an error while completing company registration on the placement portal.',
    date: 'Sep 5, 2026',
    time: '02:32 PM',
    owner: 'James Carter',
    status: 'open',
    outcome: 'Pending resolution',
    sentiment: 'frustrated',
    relatedId: 'TKT-2026-0841',
  },
  {
    id: 't3',
    type: 'email',
    title: 'Placement drive reminder sent',
    description: 'Automated reminder: Placement portal registration deadline in 7 days.',
    date: 'Sep 4, 2026',
    time: '10:00 AM',
    owner: 'System',
    status: 'completed',
    outcome: 'Opened · No click',
    sentiment: 'neutral',
  },
  {
    id: 't4',
    type: 'advisor',
    title: 'Advisor meeting — Placement preparation',
    description: 'Session with Dr. Rekha Iyer covering resume structure, company shortlisting and mock interview scheduling.',
    date: 'Sep 3, 2026',
    time: '11:00 AM',
    owner: 'Dr. Rekha Iyer',
    status: 'completed',
    outcome: 'Resume reviewed · Follow-up booked',
    sentiment: 'positive',
  },
  {
    id: 't5',
    type: 'web',
    title: 'LMS activity — ML Fundamentals module',
    description: 'Completed Unit 4 exercises and submitted assignment CS401-A4.',
    date: 'Sep 2, 2026',
    time: '07:15 PM',
    owner: 'LMS System',
    status: 'completed',
    outcome: 'Assignment submitted',
    sentiment: 'positive',
  },
  {
    id: 't6',
    type: 'sms',
    title: 'SMS — Placement orientation reminder',
    description: 'Reminder sent: Placement orientation session tomorrow at 10:00 AM in Hall B.',
    date: 'Sep 1, 2026',
    time: '09:00 AM',
    owner: 'System',
    status: 'completed',
    outcome: 'Delivered',
    sentiment: 'neutral',
  },
  {
    id: 't7',
    type: 'assessment',
    title: 'Mid-semester assessment — Database Management',
    description: 'CS303 mid-semester test completed. Score: 88/100.',
    date: 'Aug 28, 2026',
    time: '02:00 PM',
    owner: 'Faculty — Prof. A. Nair',
    status: 'completed',
    outcome: 'Score: 88/100 — Grade A',
    sentiment: 'positive',
  },
  {
    id: 't8',
    type: 'phone',
    title: 'Inbound call — Fee payment query',
    description: 'Student called the student services helpline regarding semester fee payment deadline.',
    date: 'Aug 25, 2026',
    time: '03:48 PM',
    owner: 'Rohan Gupta',
    status: 'completed',
    outcome: 'Resolved — Payment link resent',
    sentiment: 'neutral',
  },
  {
    id: 't9',
    type: 'registration',
    title: 'Semester 6 course registration completed',
    description: 'Student registered for CS501, CS502, CS503, CS504 and elective CS505 (AI Ethics).',
    date: 'Aug 10, 2026',
    time: '11:22 AM',
    owner: 'Student',
    status: 'completed',
    outcome: '5 courses registered',
    sentiment: 'positive',
  },
];

const TICKETS = [
  { id: 'TKT-2026-0841', issue: 'Placement portal registration error', priority: 'high' as const, status: 'open' as const, owner: 'James Carter', created: 'Sep 5' },
  { id: 'TKT-2026-0814', issue: 'Fee receipt not received for Semester 6', priority: 'medium' as const, status: 'pending' as const, owner: 'Rohan Gupta', created: 'Aug 26' },
];

const ACADEMIC_MODULES = [
  { code: 'CS501', name: 'Advanced Algorithms', credits: 4, ca: 88, exam: 82, total: 84, grade: 'A' },
  { code: 'CS502', name: 'Computer Networks', credits: 4, ca: 79, exam: 74, total: 76, grade: 'B+' },
  { code: 'CS503', name: 'Database Management', credits: 3, ca: 91, exam: 88, total: 89, grade: 'A+' },
  { code: 'CS504', name: 'Operating Systems', credits: 4, ca: 73, exam: 70, total: 71, grade: 'B' },
  { code: 'CS505', name: 'AI Ethics (Elective)', credits: 3, ca: 85, exam: null, total: null, grade: '—' },
];

const CGPA_HISTORY = [
  { sem: 'Sem 1', cgpa: 7.8 },
  { sem: 'Sem 2', cgpa: 8.0 },
  { sem: 'Sem 3', cgpa: 8.1 },
  { sem: 'Sem 4', cgpa: 8.2 },
  { sem: 'Sem 5', cgpa: 8.4 },
  { sem: 'Sem 6', cgpa: 8.4 },
];

const ATTENDANCE_TREND = [
  { month: 'Mar', pct: 88 },
  { month: 'Apr', pct: 85 },
  { month: 'May', pct: 90 },
  { month: 'Jun', pct: 84 },
  { month: 'Jul', pct: 79 },
  { month: 'Aug', pct: 82 },
];

const JOURNEY_STAGES = [
  { name: 'Admission', key: 'admission', done: true },
  { name: 'Course Registration', key: 'registration', done: true },
  { name: 'Timetable', key: 'timetable', done: true },
  { name: 'Teaching', key: 'teaching', done: true },
  { name: 'Assessment', key: 'assessment', done: true },
  { name: 'Research', key: 'research', done: false, partial: true },
  { name: 'Placement', key: 'placement', current: true },
  { name: 'Graduation', key: 'graduation', upcoming: true },
];

const RECENT_ACTIVITY = [
  { icon: '🌐', text: 'Viewed TCS 2026 placement drive', time: 'Today, 9:42 AM', type: 'engagement' },
  { icon: '📄', text: 'Resume uploaded (v3)', time: 'Sep 6, 2026', type: 'document' },
  { icon: '✉️', text: 'Placement reminder email opened', time: 'Sep 4, 2026', type: 'communication' },
  { icon: '📅', text: 'Advisor meeting attended', time: 'Sep 3, 2026', type: 'meeting' },
  { icon: '📝', text: 'CS401 assignment submitted', time: 'Sep 2, 2026', type: 'academic' },
  { icon: '🎫', text: 'Raised ticket TKT-2026-0841', time: 'Sep 5, 2026', type: 'ticket' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeConfig(type: TimelineEvent['type']) {
  const map: Record<TimelineEvent['type'], { icon: string; bg: string; label: string }> = {
    email:        { icon: '✉️',  bg: 'bg-sky-100',     label: 'Email' },
    sms:          { icon: '💬',  bg: 'bg-emerald-100', label: 'SMS' },
    phone:        { icon: '📞',  bg: 'bg-violet-100',  label: 'Phone' },
    advisor:      { icon: '👤',  bg: 'bg-indigo-100',  label: 'Advisor' },
    registration: { icon: '📋',  bg: 'bg-amber-100',   label: 'Registration' },
    ticket:       { icon: '🎫',  bg: 'bg-red-100',     label: 'Ticket' },
    placement:    { icon: '🏢',  bg: 'bg-blue-100',    label: 'Placement' },
    assessment:   { icon: '📝',  bg: 'bg-purple-100',  label: 'Assessment' },
    web:          { icon: '🌐',  bg: 'bg-teal-100',    label: 'Portal' },
  };
  return map[type];
}

function sentimentPill(s?: TimelineEvent['sentiment']) {
  if (!s) return null;
  const map = {
    positive:  'text-emerald-700 bg-emerald-50 border border-emerald-200',
    neutral:   'text-slate-600 bg-slate-100',
    frustrated:'text-red-700 bg-red-50 border border-red-200',
    concerned: 'text-amber-700 bg-amber-50 border border-amber-200',
  };
  const label = { positive: 'Positive', neutral: 'Neutral', frustrated: 'Frustrated', concerned: 'Concerned' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[s]}`}>
      {label[s]}
    </span>
  );
}

function statusDot(status: TimelineEvent['status']) {
  const map = { completed: 'bg-emerald-400', open: 'bg-amber-400', pending: 'bg-sky-400', failed: 'bg-red-400' };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${map[status]}`} />;
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function TimelineSection({ onSelect }: { onSelect: (e: TimelineEvent) => void }) {
  const [filter, setFilter] = useState<string>('all');
  const filters = ['all', 'email', 'sms', 'phone', 'advisor', 'ticket', 'placement', 'assessment'];

  const visible = filter === 'all' ? TIMELINE_EVENTS : TIMELINE_EVENTS.filter(e => e.type === filter);

  return (
    <div>
      {/* Filter chips */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-[#1e3a5f] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'All events' : typeConfig(f as TimelineEvent['type']).label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {visible.map((event, i) => {
          const cfg = typeConfig(event.type);
          return (
            <div key={event.id} className="flex gap-4 group">
              {/* Spine */}
              <div className="flex flex-col items-center shrink-0" style={{ width: 40 }}>
                <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center text-base z-10 shadow-sm border border-white`}>
                  {cfg.icon}
                </div>
                {i < visible.length - 1 && (
                  <div className="w-px flex-1 bg-slate-200 mt-1 mb-1" />
                )}
              </div>

              {/* Card */}
              <div
                className="flex-1 pb-5 cursor-pointer"
                onClick={() => onSelect(event)}
              >
                <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{cfg.label}</span>
                      {statusDot(event.status)}
                      <span className="text-[10px] text-slate-400">{event.status}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sentimentPill(event.sentiment)}
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 mb-1">{event.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">{event.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {event.date} · {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {event.owner}
                    </span>
                    {event.outcome && (
                      <span className="text-slate-500 font-medium">{event.outcome}</span>
                    )}
                    {event.relatedId && (
                      <span className="text-indigo-500 font-medium">{event.relatedId}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AiInsightsSection({ onApprove, onReject, onOverride }: {
  onApprove: () => void;
  onReject: () => void;
  onOverride: () => void;
}) {
  const [decision, setDecision] = useState<string | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const handleApprove = () => { setDecision('approved'); onApprove(); };
  const handleReject = () => { setDecision('rejected'); onReject(); };

  const insights = [
    {
      id: 'ai1',
      priority: 'high',
      title: 'Student shows high placement interest but has not interacted with a placement advisor recently.',
      confidence: 87,
      summary: 'Engagement with placement resources is high. However, the last advisor meeting was 21 days ago and an unresolved service ticket is blocking portal registration.',
      evidence: [
        'Placement portal engagement: +42% this week',
        'Last advisor meeting: Sep 3, 2026 (21 days ago)',
        'Open ticket TKT-2026-0841 — portal registration blocked',
        'Placement readiness score: 76% (below 80% target)',
        '0 of 3 companies shortlisted have been applied to',
      ],
      action: 'Schedule an urgent placement advisor meeting and resolve the portal access issue.',
      model: 'JourneyAI v1.4',
      generated: 'September 7, 2026 — 08:00 AM',
    },
    {
      id: 'ai2',
      priority: 'medium',
      title: 'Academic performance is stable. No immediate intervention required.',
      confidence: 91,
      summary: 'CGPA trend is consistently improving across semesters. Attendance is at 82%, above the 75% academic threshold.',
      evidence: [
        'CGPA trend: 7.8 → 8.0 → 8.1 → 8.2 → 8.4 (steady improvement)',
        'Attendance: 82% (above 75% minimum)',
        'No failed modules in current semester',
        'Mid-semester assessment scores above cohort median',
      ],
      action: 'No intervention required. Monitor attendance monthly.',
      model: 'JourneyAI v1.4',
      generated: 'September 7, 2026 — 08:00 AM',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Human-control notice */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">AI recommends — humans decide.</span>
          {' '}All recommendations require explicit approval before any action is taken. Your decisions are recorded in the audit log.
        </p>
      </div>

      {insights.map((insight, idx) => {
        const isFirst = idx === 0;
        const dec = isFirst ? decision : null;
        return (
          <div
            key={insight.id}
            className={`border rounded-xl overflow-hidden transition-all ${
              dec === 'approved' ? 'border-emerald-300 bg-emerald-50/30' :
              dec === 'rejected' ? 'border-slate-200 opacity-60' :
              'border-indigo-200 bg-white'
            }`}
          >
            {/* AI label bar */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-b ${dec === 'approved' ? 'border-emerald-200 bg-emerald-50' : dec === 'rejected' ? 'border-slate-200 bg-slate-50' : 'border-indigo-100 bg-indigo-50'}`}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">AI Recommendation</span>
                <span className="text-xs text-indigo-400">—</span>
                <span className="text-xs font-semibold text-indigo-600">Human Review Required</span>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceBadge value={insight.confidence} />
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  insight.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {insight.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                </span>
              </div>
            </div>

            <div className="p-5">
              <p className="text-sm font-semibold text-slate-900 mb-1 leading-snug">{insight.title}</p>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{insight.summary}</p>

              {/* Evidence */}
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Evidence</p>
                <div className="space-y-1.5">
                  {insight.evidence.map(e => (
                    <div key={e} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                        <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span className="text-xs text-slate-700">{e}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended action */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2.5 mb-4">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Recommended action: </span>
                <span className="text-xs text-indigo-800 font-medium">{insight.action}</span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400 mb-4 flex-wrap">
                <span>Model: <strong className="text-slate-600">{insight.model}</strong></span>
                <span>·</span>
                <span>Generated: <strong className="text-slate-600">{insight.generated}</strong></span>
                <button className="text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2" onClick={() => setEvidenceOpen(true)}>
                  View source data
                </button>
              </div>

              {/* Separator */}
              <div className="border-t border-slate-100 mb-4" />

              {/* Decision row */}
              {isFirst ? (
                dec ? (
                  <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${dec === 'approved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${dec === 'approved' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${dec === 'approved' ? 'text-emerald-800' : 'text-slate-700'}`}>
                        {dec === 'approved' ? 'Approved' : 'Rejected'}
                      </p>
                      <p className="text-xs text-slate-500">James Carter · {new Date().toLocaleString()} · Recorded in audit log</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="success" onClick={handleApprove}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Approve
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleReject}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onOverride}>Override</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEvidenceOpen(true)}>View evidence</Button>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="success">No action needed</Badge>
                  <span className="text-xs text-slate-400">Model confidence high — monitoring only</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Evidence modal */}
      <Modal open={evidenceOpen} onClose={() => setEvidenceOpen(false)} title="AI Insight — Source Data Snapshot" size="lg">
        <div className="space-y-5">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Insight</p>
            <p className="text-sm text-indigo-900">Student shows high placement interest but has not interacted with a placement advisor recently.</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Source Data Points</p>
            <div className="space-y-2">
              {[
                { source: 'Portal event log', event: 'Placement page viewed 7 times in 7 days', ts: '2026-09-07 09:42' },
                { source: 'CRM — interaction history', event: 'Last advisor meeting: 2026-09-03 — 21 days ago', ts: '2026-09-03 11:00' },
                { source: 'Ticket system', event: 'TKT-2026-0841 — portal registration blocked — unresolved 48h', ts: '2026-09-05 14:32' },
                { source: 'Placement engine', event: 'Placement readiness score: 76% (target: 80%)', ts: '2026-09-07 08:00' },
                { source: 'Company tracker', event: '0 of 3 shortlisted companies — no application submitted', ts: '2026-09-07 08:00' },
              ].map((d, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 mt-0.5">{i + 1}</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-700">{d.event}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Source: {d.source} · {d.ts}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            Model: JourneyAI v1.4 · Snapshot time: 2026-09-07 08:00:00 UTC · Confidence: 87% · This is an AI-generated summary. Human review is required before any action.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ConsentSection() {
  const consents = [
    { channel: 'Email', allowed: true, icon: '✉️', lastUpdated: '2023-08-01', note: 'Marketing and transactional' },
    { channel: 'SMS', allowed: true, icon: '💬', lastUpdated: '2023-08-01', note: 'Transactional only' },
    { channel: 'In-app Messaging', allowed: true, icon: '🔔', lastUpdated: '2023-08-01', note: 'All categories' },
    { channel: 'Marketing Communications', allowed: false, icon: '📢', lastUpdated: '2024-03-15', note: 'Restricted by student' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Communication Consent</p>
        <div className="space-y-2">
          {consents.map(c => (
            <div key={c.channel} className={`flex items-start gap-3 p-3 rounded-xl border ${c.allowed ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40'}`}>
              <span className="text-base mt-0.5">{c.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{c.channel}</p>
                  <Badge variant={c.allowed ? 'success' : 'danger'}>{c.allowed ? 'Allowed' : 'Restricted'}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{c.note} · Updated {c.lastUpdated}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Communication Frequency</p>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-slate-900">3</span>
            <span className="text-slate-500 text-sm pb-1">/ 5 this week</span>
          </div>
          <ProgressBar value={3} max={5} color="#6366f1" className="mb-3" />
          <p className="text-xs text-slate-500">2 communications remaining within frequency cap</p>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className={`flex-1 h-6 rounded-lg ${n <= 3 ? 'bg-indigo-500' : 'bg-slate-100'}`} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Sent</span>
            <span>Cap limit: 5</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          ⚠️ Marketing consent has been restricted by the student. Any campaign targeting this student must use approved channels only (Email, SMS, In-app).
        </div>
      </div>
    </div>
  );
}

function TicketsSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open & Pending Tickets</p>
        <Button size="sm" variant="secondary">+ New Ticket</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Ticket ID', 'Issue', 'Priority', 'Status', 'Owner', 'Created'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TICKETS.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                <td className="px-3 py-3 font-mono text-xs text-indigo-600 font-semibold">{t.id}</td>
                <td className="px-3 py-3 text-slate-700 max-w-xs">
                  <span className="line-clamp-1">{t.issue}</span>
                </td>
                <td className="px-3 py-3"><PriorityBadge priority={t.priority} /></td>
                <td className="px-3 py-3"><TicketStatusBadge status={t.status} /></td>
                <td className="px-3 py-3 text-slate-600 text-xs">{t.owner}</td>
                <td className="px-3 py-3 text-slate-400 text-xs">{t.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AcademicSection() {
  const maxCgpa = 10;

  return (
    <div className="space-y-6">
      {/* CGPA Trend */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">CGPA Trend</p>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-end gap-2 mb-4">
            <div className="flex items-end gap-1 flex-1">
              {CGPA_HISTORY.map((s, i) => {
                const h = (s.cgpa / maxCgpa) * 120;
                const isLast = i === CGPA_HISTORY.length - 1;
                return (
                  <div key={s.sem} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono text-slate-500">{s.cgpa.toFixed(1)}</span>
                    <div
                      className={`w-full rounded-t-lg transition-all ${isLast ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                      style={{ height: `${h}px` }}
                    />
                    <span className="text-[10px] text-slate-400">{s.sem}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">↑ 0.2 vs Sem 5</Badge>
            <span className="text-xs text-slate-500">Steady improvement across all semesters</span>
          </div>
        </div>
      </div>

      {/* Attendance Trend */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Monthly Attendance</p>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-end gap-3 h-28">
            {ATTENDANCE_TREND.map((m, i) => {
              const isLow = m.pct < 80;
              const isLast = i === ATTENDANCE_TREND.length - 1;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-mono text-slate-500">{m.pct}%</span>
                  <div
                    className={`w-full rounded-t-lg ${isLow ? 'bg-amber-400' : isLast ? 'bg-emerald-500' : 'bg-emerald-200'}`}
                    style={{ height: `${(m.pct / 100) * 90}px` }}
                  />
                  <span className="text-[10px] text-slate-400">{m.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-2.5 rounded-sm bg-amber-400" /> Below threshold
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-2.5 rounded-sm bg-emerald-500" /> Current month
            </div>
            <span className="text-xs text-slate-400">Threshold: 75%</span>
          </div>
        </div>
      </div>

      {/* Current semester modules */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Semester 6 — Module Performance</p>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Code', 'Module', 'Credits', 'Continuous Assessment', 'Exam Score', 'Total', 'Grade'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ACADEMIC_MODULES.map(m => (
                <tr key={m.code} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-center">{m.credits}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={m.ca} color={m.ca >= 85 ? '#059669' : m.ca >= 70 ? '#6366f1' : '#d97706'} className="w-14" />
                      <span className="text-xs font-mono text-slate-700">{m.ca}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs font-mono">{m.exam ?? <span className="text-slate-300">Pending</span>}</td>
                  <td className="px-4 py-3 text-slate-700 text-xs font-mono font-semibold">{m.total ?? '—'}</td>
                  <td className="px-4 py-3">
                    {m.grade !== '—' ? (
                      <Badge variant={m.grade === 'A+' ? 'success' : m.grade.startsWith('A') ? 'success' : m.grade.startsWith('B') ? 'info' : 'warning'}>
                        {m.grade}
                      </Badge>
                    ) : (
                      <Badge variant="muted">Pending</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function JourneyProgressSection() {
  return (
    <div className="space-y-4">
      {/* Horizontal timeline */}
      <div className="overflow-x-auto">
        <div className="flex items-start min-w-max gap-0 px-2 py-4">
          {JOURNEY_STAGES.map((stage, i) => (
            <div key={stage.key} className="flex items-start">
              {/* Stage node */}
              <div className="flex flex-col items-center w-28">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-sm ${
                  stage.current
                    ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100'
                    : stage.done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : stage.partial
                    ? 'bg-amber-400 border-amber-400 text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}>
                  {stage.done ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : stage.current ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="3" fill="white"/></svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-[11px] font-semibold leading-tight ${
                    stage.current ? 'text-indigo-700' : stage.done ? 'text-slate-500' : 'text-slate-400'
                  }`}>{stage.name}</p>
                  {stage.current && <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider mt-0.5">Active</p>}
                  {stage.done && <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">Done</p>}
                  {stage.partial && <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">Partial</p>}
                  {stage.upcoming && <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Upcoming</p>}
                </div>
              </div>
              {/* Connector */}
              {i < JOURNEY_STAGES.length - 1 && (
                <div className="flex items-center mt-5">
                  <div className={`h-0.5 w-8 ${stage.done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  <svg width="8" height="8" viewBox="0 0 8 8" className={stage.done ? 'text-emerald-400' : 'text-slate-300'} fill="currentColor">
                    <path d="M0 4 L6 0 L6 8 Z"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current stage detail */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="3" fill="white"/></svg>
            </div>
            <p className="text-sm font-bold text-indigo-800">Placement — Current Stage</p>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Placement readiness', value: '76%', ok: false },
              { label: 'Companies shortlisted', value: '3 companies' },
              { label: 'Companies applied', value: '0 of 3', ok: false },
              { label: 'Portal registration', value: 'Blocked — TKT-0841', ok: false },
              { label: 'Last advisor meeting', value: 'Sep 3, 2026' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-indigo-600">{item.label}</span>
                <span className={`font-semibold ${item.ok === false ? 'text-red-600' : 'text-indigo-800'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Research partial */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs font-bold">!</div>
            <p className="text-sm font-bold text-amber-800">Research Administration — In Progress</p>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { label: 'FYP topic', value: 'Approved' },
              { label: 'Supervisor assigned', value: 'Dr. Vijay Kumar' },
              { label: 'Progress report', value: 'Due Oct 15, 2026' },
              { label: 'Literature review', value: '40% complete' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-amber-600">{item.label}</span>
                <span className="font-semibold text-amber-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentActivitySection() {
  return (
    <div className="space-y-1">
      {RECENT_ACTIVITY.map((a, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <span className="text-lg w-8 text-center shrink-0">{a.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700">{a.text}</p>
          </div>
          <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">{a.time}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────

interface Props {
  studentId?: string;
  onNavigate?: (page: string, params?: Record<string, string>) => void;
}

export default function CustomerProfile({ onNavigate }: Props) {
  const [tab, setTab] = useState('Overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSaved, setOverrideSaved] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOverride = () => {
    setOverrideSaved(true);
    setOverrideModal(false);
    setOverrideReason('');
    showToast('Override recorded in audit log.');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── PROFILE HEADER ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 pt-6 pb-0">
        <div className="flex items-start gap-5 pb-4">
          {/* Avatar */}
          <div className="shrink-0 relative">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
              AS
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <h1 className="text-xl font-bold text-slate-900">{STUDENT.name}</h1>
                  <RiskBadge level={STUDENT.riskLevel} />
                  <Badge variant="success">High Engagement</Badge>
                  <Badge variant="ai">Placement Stage</Badge>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap mb-2">
                  <span className="font-mono font-semibold text-slate-600">{STUDENT.studentId}</span>
                  <span className="text-slate-300">·</span>
                  <span>{STUDENT.programme}</span>
                  <span className="text-slate-300">·</span>
                  <span>{STUDENT.yearLabel}</span>
                  <span className="text-slate-300">·</span>
                  <span>Dept. {STUDENT.department}</span>
                  <span className="text-slate-300">·</span>
                  <span>Advisor: {STUDENT.advisor}</span>
                </div>

                {/* Contact */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <a href={`mailto:${STUDENT.email}`} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    {STUDENT.email}
                  </a>
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {STUDENT.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Enrolled: {STUDENT.enrolledDate}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit Profile
                </Button>
                <Button variant="ghost" size="sm">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  More
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI STRIP ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 py-4 border-t border-slate-100">
          {[
            { label: 'Attendance', value: `${STUDENT.attendance}%`, color: STUDENT.attendance >= 80 ? 'text-emerald-600' : 'text-amber-600', sub: STUDENT.attendance >= 75 ? 'Above threshold' : 'Below threshold' },
            { label: 'CGPA', value: STUDENT.cgpa.toFixed(1), color: 'text-slate-900', sub: '/ 10.00' },
            { label: 'Open Tickets', value: String(STUDENT.openTickets), color: STUDENT.openTickets > 0 ? 'text-amber-600' : 'text-emerald-600', sub: 'Active issues' },
            { label: 'Engagement', value: `${STUDENT.engagementScore}%`, color: 'text-indigo-600', sub: 'High' },
            { label: 'Churn Risk', value: `${STUDENT.churnPropensity}%`, color: STUDENT.churnPropensity > 40 ? 'text-red-600' : STUDENT.churnPropensity > 20 ? 'text-amber-600' : 'text-emerald-600', sub: STUDENT.churnPropensity <= 20 ? 'Low risk' : 'Medium risk' },
            { label: 'Placement Ready', value: `${STUDENT.placementReadiness}%`, color: STUDENT.placementReadiness >= 80 ? 'text-emerald-600' : 'text-amber-600', sub: 'Target: 80%' },
          ].map(kpi => (
            <div key={kpi.label} className="text-center px-2">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[11px] font-semibold text-slate-600 mt-0.5">{kpi.label}</p>
              <p className="text-[10px] text-slate-400">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── TABS ────────────────────────────────────────────────────── */}
        <Tabs
          tabs={['Overview', 'Journey', 'Interactions', 'Tickets', 'Academic', 'Consent', 'AI Insights', 'Documents']}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}
      <div className="flex-1 p-6">

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
        {tab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column — Timeline + AI */}
            <div className="lg:col-span-2 space-y-6">

              {/* Interaction Timeline */}
              <Card className="p-5">
                <SectionHeader
                  title="Interaction Timeline"
                  subtitle="All channels — most recent first"
                  actions={
                    <Button variant="ghost" size="sm" onClick={() => setTab('Interactions')}>
                      View all →
                    </Button>
                  }
                />
                <TimelineSection onSelect={e => { setSelectedEvent(e); setDrawerOpen(true); }} />
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* AI Insights */}
              <Card className="p-5">
                <SectionHeader
                  title="AI Insights"
                  subtitle="Powered by JourneyAI v1.4"
                  actions={<Button variant="ghost" size="sm" onClick={() => setTab('AI Insights')}>See all →</Button>}
                />
                {/* Mini AI card */}
                <div className="border border-indigo-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-indigo-100">
                    <div className="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center shrink-0">
                      <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">AI Recommendation</span>
                    <ConfidenceBadge value={87} />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-slate-800 font-medium leading-snug mb-2">
                      "Student shows high placement interest but has not interacted with a placement advisor recently."
                    </p>
                    <p className="text-[10px] text-slate-400 mb-3">JourneyAI v1.4 · Sep 7, 2026</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <Button size="sm" variant="success" onClick={() => showToast('Recommendation approved.')}>Approve</Button>
                      <Button size="sm" variant="secondary" onClick={() => showToast('Recommendation rejected.')}>Reject</Button>
                      <Button size="sm" variant="ghost" onClick={() => setOverrideModal(true)}>Override</Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Consent summary */}
              <Card className="p-5">
                <SectionHeader title="Consent Status" subtitle="Current permissions" />
                <div className="space-y-2 mb-3">
                  {[
                    { label: 'Email', allowed: STUDENT.consentEmail },
                    { label: 'SMS', allowed: STUDENT.consentSMS },
                    { label: 'Messaging', allowed: STUDENT.consentMessaging },
                    { label: 'Marketing', allowed: STUDENT.consentMarketing },
                  ].map(c => (
                    <div key={c.label} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs text-slate-600">{c.label}</span>
                      <Badge variant={c.allowed ? 'success' : 'danger'}>{c.allowed ? 'Allowed' : 'Restricted'}</Badge>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">Frequency this week</span>
                    <span className="font-bold text-slate-800">{STUDENT.commFrequency} / {STUDENT.commFrequencyLimit}</span>
                  </div>
                  <ProgressBar value={STUDENT.commFrequency} max={STUDENT.commFrequencyLimit} color="#6366f1" />
                </div>
              </Card>

              {/* Tickets */}
              <Card className="p-5">
                <SectionHeader
                  title="Open Tickets"
                  actions={<Button variant="ghost" size="sm" onClick={() => setTab('Tickets')}>View all →</Button>}
                />
                <div className="space-y-2">
                  {TICKETS.map(t => (
                    <div key={t.id} className="flex items-start gap-2 p-3 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-mono text-indigo-500">{t.id}</span>
                          <PriorityBadge priority={t.priority} />
                        </div>
                        <p className="text-xs font-medium text-slate-800 line-clamp-2">{t.issue}</p>
                      </div>
                      <TicketStatusBadge status={t.status} />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Journey Progress */}
              <Card className="p-5">
                <SectionHeader title="Journey Progress" actions={<Button size="sm" variant="ghost" onClick={() => setTab('Journey')}>Details →</Button>} />
                <div className="space-y-1.5">
                  {JOURNEY_STAGES.map(stage => (
                    <div key={stage.key} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${stage.current ? 'bg-indigo-50' : ''}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        stage.done ? 'bg-emerald-500' : stage.current ? 'bg-indigo-600' : stage.partial ? 'bg-amber-400' : 'bg-slate-200'
                      }`}>
                        {stage.done ? (
                          <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <div className={`w-2 h-2 rounded-full ${stage.current ? 'bg-white' : stage.partial ? 'bg-white' : 'bg-slate-400'}`} />
                        )}
                      </div>
                      <span className={`text-xs flex-1 ${stage.current ? 'font-bold text-indigo-700' : stage.done ? 'text-slate-500' : 'text-slate-400'}`}>
                        {stage.name}
                      </span>
                      {stage.current && <Badge variant="ai">Active</Badge>}
                      {stage.done && <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent activity */}
              <Card className="p-5">
                <SectionHeader title="Recent Activity" />
                <RecentActivitySection />
              </Card>
            </div>
          </div>
        )}

        {/* ── JOURNEY TAB ──────────────────────────────────────────────── */}
        {tab === 'Journey' && (
          <Card className="p-6">
            <SectionHeader title="Journey Timeline" subtitle={`${STUDENT.name} · ${STUDENT.studentId}`} />
            <JourneyProgressSection />
          </Card>
        )}

        {/* ── INTERACTIONS TAB ─────────────────────────────────────────── */}
        {tab === 'Interactions' && (
          <Card className="p-6">
            <SectionHeader
              title="Interaction History"
              subtitle="All channels · Chronological order"
              actions={
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">Export</Button>
                  <Button variant="primary" size="sm">+ Log Interaction</Button>
                </div>
              }
            />
            <TimelineSection onSelect={e => { setSelectedEvent(e); setDrawerOpen(true); }} />
          </Card>
        )}

        {/* ── TICKETS TAB ──────────────────────────────────────────────── */}
        {tab === 'Tickets' && (
          <Card className="p-6">
            <SectionHeader
              title="Service Tickets"
              subtitle="All tickets for this student"
              actions={<Button variant="primary" size="sm">+ New Ticket</Button>}
            />
            <TicketsSection />
          </Card>
        )}

        {/* ── ACADEMIC TAB ─────────────────────────────────────────────── */}
        {tab === 'Academic' && (
          <Card className="p-6">
            <SectionHeader title="Academic Performance" subtitle={`${STUDENT.programme} · Semester 6`} />
            <AcademicSection />
          </Card>
        )}

        {/* ── CONSENT TAB ──────────────────────────────────────────────── */}
        {tab === 'Consent' && (
          <Card className="p-6">
            <SectionHeader
              title="Consent & Communication Preferences"
              subtitle="GDPR-compliant consent records · Managed by student"
              actions={<Button variant="secondary" size="sm">View Consent Log</Button>}
            />
            <ConsentSection />
          </Card>
        )}

        {/* ── AI INSIGHTS TAB ──────────────────────────────────────────── */}
        {tab === 'AI Insights' && (
          <div className="space-y-5">
            <AiInsightsSection
              onApprove={() => showToast('AI recommendation approved — recorded in audit log.')}
              onReject={() => showToast('AI recommendation rejected — recorded in audit log.')}
              onOverride={() => setOverrideModal(true)}
            />
          </div>
        )}

        {/* ── DOCUMENTS TAB ────────────────────────────────────────────── */}
        {tab === 'Documents' && (
          <Card className="p-6">
            <SectionHeader
              title="Documents"
              subtitle="Student records and uploaded files"
              actions={<Button variant="primary" size="sm">+ Upload Document</Button>}
            />
            <div className="space-y-3">
              {[
                { name: 'Offer Letter — B.Tech CS.pdf', type: 'Admission', size: '482 KB', date: '2023-08-01', icon: '📄' },
                { name: 'Semester 5 Marksheet.pdf', type: 'Academic', size: '1.2 MB', date: '2026-01-15', icon: '📊' },
                { name: 'Ananya_Sharma_Resume_v3.pdf', type: 'Placement', size: '318 KB', date: '2026-09-06', icon: '📋' },
                { name: 'FYP_Topic_Approval.pdf', type: 'Research', size: '210 KB', date: '2026-01-10', icon: '🔬' },
                { name: 'Consent_Form_Signed.pdf', type: 'Consent', size: '202 KB', date: '2023-08-01', icon: '✅' },
                { name: 'Semester_6_Fee_Receipt.pdf', type: 'Finance', size: '190 KB', date: '2026-07-30', icon: '🧾' },
              ].map(doc => (
                <div key={doc.name} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">{doc.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <Badge variant="muted">{doc.type}</Badge>
                      <span className="ml-2">{doc.size} · {doc.date}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm">Preview</Button>
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ── EVENT DRAWER ─────────────────────────────────────────────────── */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Interaction Detail">
        {selectedEvent && (() => {
          const cfg = typeConfig(selectedEvent.type);
          return (
            <div className="space-y-5">
              <div className={`w-12 h-12 rounded-2xl ${cfg.bg} flex items-center justify-center text-2xl`}>{cfg.icon}</div>
              <div>
                <p className="text-base font-bold text-slate-900 mb-1">{selectedEvent.title}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{selectedEvent.description}</p>
              </div>
              <div className="space-y-1">
                {[
                  { label: 'Channel', value: cfg.label },
                  { label: 'Date & Time', value: `${selectedEvent.date} · ${selectedEvent.time}` },
                  { label: 'Owner', value: selectedEvent.owner },
                  { label: 'Status', value: selectedEvent.status },
                  { label: 'Outcome', value: selectedEvent.outcome || '—' },
                  { label: 'Sentiment', value: selectedEvent.sentiment || '—' },
                  { label: 'Related Record', value: selectedEvent.relatedId || '—' },
                ].map(d => (
                  <div key={d.label} className="flex justify-between py-2.5 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">{d.label}</span>
                    <span className="text-xs font-semibold text-slate-700 text-right max-w-[55%]">{d.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" size="sm">Add Note</Button>
                <Button variant="ghost" size="sm">Link Record</Button>
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* ── OVERRIDE MODAL ───────────────────────────────────────────────── */}
      <Modal open={overrideModal} onClose={() => setOverrideModal(false)} title="Override AI Recommendation" size="sm">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <p className="font-semibold mb-1">⚠️ This override will be recorded</p>
            <p>Overriding an AI recommendation bypasses the standard review process. Your name, timestamp, and reason will be logged in the audit trail.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Reason for override <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-800 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              rows={4}
              placeholder="Describe why you are overriding this recommendation…"
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="danger" disabled={!overrideReason.trim()} onClick={handleOverride}>Confirm Override</Button>
            <Button variant="secondary" onClick={() => { setOverrideModal(false); setOverrideReason(''); }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT PROFILE DRAWER ──────────────────────────────────────────── */}
      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="Edit Student Profile">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Changes are audited. Only authorised fields can be edited.</p>
          {[
            { label: 'Full Name', value: STUDENT.name },
            { label: 'Email Address', value: STUDENT.email },
            { label: 'Phone Number', value: STUDENT.phone },
            { label: 'Advisor', value: STUDENT.advisor },
          ].map(f => (
            <div key={f.label} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">{f.label}</label>
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition-all"
                defaultValue={f.value}
              />
            </div>
          ))}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500">
            Fields like Student ID, Programme and Department are managed by the Registrar's office and cannot be edited here.
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" onClick={() => { setEditOpen(false); showToast('Profile updated — change recorded in audit log.'); }}>Save Changes</Button>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Drawer>

      {/* ── TOAST ────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-sm font-medium">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          {toast}
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}
    </div>
  );
}
