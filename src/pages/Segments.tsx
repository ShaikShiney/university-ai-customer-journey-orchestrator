import { useState } from 'react';
import { Card, Button, Badge, Input, Select, AiBanner, ConfidenceBadge, SectionHeader, Modal } from '../components/ui';

const SEGMENTS = [
  { id: 'seg1', name: 'Final-year placement risk', desc: 'Final-year students with placement readiness below 70% and no placement interaction in last 30 days.', audience: 312, eligible: 280, consented: 248, suppressed: 32, status: 'active' },
  { id: 'seg2', name: 'High churn risk — MBA', desc: 'MBA students with churn propensity above 40% and attendance below 65%.', audience: 86, eligible: 78, consented: 64, suppressed: 14, status: 'active' },
  { id: 'seg3', name: 'High engagement — placement ready', desc: 'Students with engagement score above 80% and placement readiness above 85%.', audience: 208, eligible: 208, consented: 198, suppressed: 10, status: 'active' },
  { id: 'seg4', name: 'Low attendance warning', desc: 'All years, attendance below 70% in last 30 days.', audience: 186, eligible: 170, consented: 142, suppressed: 28, status: 'draft' },
];

const NBA_CARDS = [
  { id: 'nba1', title: 'Schedule placement advisor follow-up', student: 'Ananya Sharma', priority: 'High', confidence: 91, reason: 'Student has high placement interest and no recent advisor interaction.', status: 'pending', consent: true },
  { id: 'nba2', title: 'Send low-attendance early warning email', student: 'Priya Nair', priority: 'Critical', confidence: 88, reason: 'Attendance dropped below 60% — risk of academic disqualification.', status: 'pending', consent: true },
  { id: 'nba3', title: 'Invite to placement workshop', student: 'Sneha Rao', priority: 'High', confidence: 84, reason: 'No workshop attendance recorded. Student at critical placement risk.', status: 'warning', consent: false },
  { id: 'nba4', title: 'Send re-engagement message — course materials', student: 'Rahul Reddy', priority: 'Low', confidence: 76, reason: 'No LMS activity in last 14 days. Academic performance stable.', status: 'approved', consent: true },
];

export default function Segments() {
  const [activeTab, setActiveTab] = useState<'segments' | 'outreach' | 'nba'>('segments');
  const [selectedSeg, setSelectedSeg] = useState(SEGMENTS[0]);
  const [nbaDecs, setNbaDecs] = useState<Record<string, string>>({});
  const [overrideModal, setOverrideModal] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const priorityColor = (p: string) => p === 'Critical' ? 'text-red-600' : p === 'High' ? 'text-amber-600' : 'text-slate-500';

  return (
    <div className="p-6 space-y-5">
      <div className="flex gap-2 border-b border-slate-200 pb-0 mb-0">
        {[['segments', 'Segments'], ['outreach', 'Outreach Configuration'], ['nba', 'Next-Best Actions']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${activeTab === key ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Segments tab */}
      {activeTab === 'segments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Segment list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Saved Segments</h3>
              <Button size="sm" variant="primary">+ New Segment</Button>
            </div>
            {SEGMENTS.map(seg => (
              <div
                key={seg.id}
                onClick={() => setSelectedSeg(seg)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedSeg.id === seg.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-800">{seg.name}</p>
                  <Badge variant={seg.status === 'active' ? 'success' : 'muted'}>{seg.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{seg.desc}</p>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-slate-500">Total: <strong>{seg.audience}</strong></span>
                  <span className="text-emerald-600">Consented: <strong>{seg.consented}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Segment detail + builder */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5">
              <SectionHeader
                title={selectedSeg.name}
                actions={<><Button size="sm" variant="secondary">Edit Conditions</Button><Button size="sm" variant="primary">Run Outreach</Button></>}
              />
              <p className="text-sm text-slate-600 mb-5">{selectedSeg.desc}</p>

              {/* Audience counts */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Total Audience', value: selectedSeg.audience, color: 'text-slate-800' },
                  { label: 'Eligible', value: selectedSeg.eligible, color: 'text-indigo-700' },
                  { label: 'Consent Approved', value: selectedSeg.consented, color: 'text-emerald-700' },
                  { label: 'Suppressed', value: selectedSeg.suppressed, color: 'text-red-600' },
                ].map(c => (
                  <div key={c.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Condition builder */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Segment Conditions</p>
                <div className="space-y-2">
                  {[
                    { field: 'Programme', operator: 'is not', value: 'Ph.D' },
                    { field: 'Year', operator: 'is', value: 'Final Year (Year 4)' },
                    { field: 'Placement Readiness', operator: 'is below', value: '70%' },
                    { field: 'Placement Interaction (last 30d)', operator: 'is', value: 'None' },
                    { field: 'Email Consent', operator: 'is', value: 'Granted' },
                  ].map((cond, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                      <span className="text-xs text-slate-400 w-6 text-center">{i === 0 ? 'IF' : 'AND'}</span>
                      <span className="font-medium text-slate-700 min-w-[180px]">{cond.field}</span>
                      <span className="text-slate-400">{cond.operator}</span>
                      <span className="font-medium text-indigo-700">{cond.value}</span>
                      <button className="ml-auto text-slate-300 hover:text-red-400 transition-colors">✕</button>
                    </div>
                  ))}
                  <button className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-2">+ Add condition</button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Outreach tab */}
      {activeTab === 'outreach' && (
        <div className="max-w-2xl space-y-5">
          <Card className="p-6">
            <SectionHeader title="Outreach Configuration" subtitle="Configure a new outreach campaign" />
            <div className="space-y-4">
              <Input label="Campaign Name" placeholder="e.g. Placement Workshop — Final Year Q3" />
              <Select label="Objective" value="placement" onChange={() => {}} options={[
                { value: 'placement', label: 'Placement engagement' },
                { value: 'retention', label: 'Retention / churn prevention' },
                { value: 'academic', label: 'Academic support' },
                { value: 'event', label: 'Event invitation' },
              ]} />
              <Select label="Target Segment" value="seg1" onChange={() => {}} options={SEGMENTS.map(s => ({ value: s.id, label: s.name }))} />
              <Select label="Channel" value="email" onChange={() => {}} options={[
                { value: 'email', label: 'Email' },
                { value: 'sms', label: 'SMS' },
                { value: 'messaging', label: 'In-app messaging' },
                { value: 'call', label: 'Call centre assignment' },
              ]} />
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Message</label>
                <textarea className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 transition-all resize-none" rows={4}
                  placeholder="Dear {student.name}, we noticed you haven't yet registered on the placement portal…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Scheduled Date" type="date" />
                <Select label="Frequency Cap" value="1" onChange={() => {}} options={[
                  { value: '1', label: '1 per week' },
                  { value: '2', label: '2 per week' },
                  { value: 'unlimited', label: 'No cap' },
                ]} />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ Consent check: 248 of 312 segment members have email consent. 64 members will be suppressed.
              </div>
              <div className="flex gap-2">
                <Button variant="primary">Schedule Campaign</Button>
                <Button variant="secondary">Save Draft</Button>
                <Button variant="ghost">Preview Email</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Next-best actions tab */}
      {activeTab === 'nba' && (
        <div className="space-y-4">
          <AiBanner className="mb-4">
            <p className="text-sm text-indigo-900 font-medium">AI has generated 4 next-best-action recommendations requiring human review. Recommendations are ranked by confidence and urgency.</p>
            <p className="text-xs text-indigo-500 mt-1">Model: NBA Engine v2.4.1 · Generated: 2026-09-07 08:00 · Human approval required before execution</p>
          </AiBanner>

          {NBA_CARDS.map(card => {
            const dec = nbaDecs[card.id];
            return (
              <Card key={card.id} className={`p-5 ${card.status === 'warning' ? 'border-amber-200' : card.status === 'approved' ? 'border-emerald-200' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.priority === 'Critical' ? 'bg-red-100' : card.priority === 'High' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={card.priority === 'Critical' ? '#dc2626' : card.priority === 'High' ? '#d97706' : '#94a3b8'} strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                      <span className={`text-xs font-bold ${priorityColor(card.priority)}`}>{card.priority}</span>
                      <ConfidenceBadge value={card.confidence} />
                    </div>
                    <p className="text-xs text-slate-500 mb-1">Student: <strong className="text-slate-700">{card.student}</strong></p>
                    <p className="text-sm text-slate-600">{card.reason}</p>

                    {!card.consent && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
                        ⛔ Recommendation blocked — communication consent unavailable for this channel.
                      </div>
                    )}

                    {dec ? (
                      <div className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${dec === 'Approved' ? 'bg-emerald-50 text-emerald-700' : dec === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
                        {dec} — recorded by you · {new Date().toLocaleTimeString()}
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {card.consent && <Button size="sm" variant="success" onClick={() => setNbaDecs(d => ({ ...d, [card.id]: 'Approved' }))}>Approve</Button>}
                        <Button size="sm" variant="secondary" onClick={() => setNbaDecs(d => ({ ...d, [card.id]: 'Rejected' }))}>Reject</Button>
                        <Button size="sm" variant="ghost">Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => setOverrideModal(card.id)}>Override</Button>
                        <Button size="sm" variant="ghost" onClick={() => setNbaDecs(d => ({ ...d, [card.id]: 'Deferred' }))}>Defer</Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Override modal */}
      <Modal open={!!overrideModal} onClose={() => setOverrideModal(null)} title="Override AI Recommendation" size="sm">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            ⚠️ Overriding an AI recommendation bypasses the standard AI review process. Your reason will be recorded in the audit log.
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Reason for override <span className="text-red-500">*</span></label>
            <textarea className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-400 transition-all resize-none" rows={3}
              value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
              placeholder="Describe why you are overriding this recommendation…" />
          </div>
          <div className="flex gap-2">
            <Button variant="danger" disabled={!overrideReason} onClick={() => { if (overrideModal) setNbaDecs(d => ({ ...d, [overrideModal]: 'Overridden' })); setOverrideModal(null); }}>Confirm Override</Button>
            <Button variant="secondary" onClick={() => setOverrideModal(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
