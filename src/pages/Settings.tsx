import { useState } from 'react';
import { Card, Button, Input, Select, Badge, SectionHeader } from '../components/ui';

const sections = ['Master Data', 'AI Settings', 'Notification Rules', 'Security', 'Integrations', 'Retention'];

export default function Settings() {
  const [section, setSection] = useState('AI Settings');
  const [confidenceThreshold, setConfidenceThreshold] = useState('85');
  const [approvalThreshold, setApprovalThreshold] = useState('90');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [modelVersion, setModelVersion] = useState('v2.4.1');
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Settings</p>
        <nav className="space-y-0.5">
          {sections.map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${section === s ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {s}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {saved && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
            ✓ Settings saved successfully
          </div>
        )}

        {section === 'AI Settings' && (
          <div className="max-w-2xl space-y-6">
            <SectionHeader title="AI Configuration" subtitle="Control how AI recommendations are generated and applied" />

            <Card className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">AI Recommendations</p>
                  <p className="text-xs text-slate-500">Enable or disable AI-powered recommendations globally</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={aiEnabled} onChange={e => setAiEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Confidence Threshold</label>
                  <p className="text-xs text-slate-500 mb-2">Recommendations below this confidence will not be surfaced to agents.</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="50" max="99" value={confidenceThreshold}
                      onChange={e => setConfidenceThreshold(e.target.value)}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="text-sm font-bold text-indigo-700 w-12 text-right">{confidenceThreshold}%</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Approval Threshold</label>
                  <p className="text-xs text-slate-500 mb-2">Recommendations above this threshold still require human approval before execution.</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="50" max="99" value={approvalThreshold}
                      onChange={e => setApprovalThreshold(e.target.value)}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="text-sm font-bold text-indigo-700 w-12 text-right">{approvalThreshold}%</span>
                  </div>
                </div>

                <Select label="Active Model Version" value={modelVersion} onChange={setModelVersion} options={[
                  { value: 'v2.4.1', label: 'v2.4.1 (Current — recommended)' },
                  { value: 'v2.3.2', label: 'v2.3.2 (Previous)' },
                  { value: 'v2.2.0', label: 'v2.2.0 (Deprecated)' },
                ]} />

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Max Recommendations per Student / Day" value="3" onChange={() => {}} />
                  <Input label="Prediction Refresh Interval (hours)" value="6" onChange={() => {}} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">AI Availability Schedule</p>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm text-slate-700">Maintenance Window</p>
                    <p className="text-xs text-slate-400">AI predictions paused during maintenance</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">02:00–04:00 UTC</span>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              <p className="font-semibold mb-1">⚠️ Important: AI is decision support only</p>
              <p className="text-xs">All AI recommendations require human review and approval. No automated actions are taken without explicit human authorisation. These settings are logged in the audit trail.</p>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" onClick={save}>Save AI Settings</Button>
              <Button variant="secondary">Reset to Defaults</Button>
            </div>
          </div>
        )}

        {section === 'Master Data' && (
          <div className="max-w-2xl space-y-6">
            <SectionHeader title="Master Data" subtitle="Configure reference data and lookup values" />
            <Card className="p-5 space-y-4">
              {['Programmes', 'Departments', 'Journey Stages', 'Ticket Categories', 'Risk Thresholds'].map(item => (
                <div key={item} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item}</p>
                    <p className="text-xs text-slate-500">Manage reference values for {item.toLowerCase()}</p>
                  </div>
                  <Button size="sm" variant="secondary">Manage</Button>
                </div>
              ))}
            </Card>
          </div>
        )}

        {section === 'Security' && (
          <div className="max-w-2xl space-y-6">
            <SectionHeader title="Security Settings" subtitle="Authentication, session, and access controls" />
            <Card className="p-5 space-y-4">
              {[
                { label: 'Multi-factor Authentication', desc: 'Require MFA for all users', enabled: true },
                { label: 'Session Timeout', desc: 'Auto-logout after inactivity', enabled: true },
                { label: 'IP Allowlist', desc: 'Restrict access to specified IP ranges', enabled: false },
                { label: 'Password Complexity', desc: 'Enforce strong password policy', enabled: true },
                { label: 'Audit Log Retention', desc: 'Retain logs for 7 years (compliance)', enabled: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              ))}
            </Card>
            <div className="flex gap-2"><Button variant="primary" onClick={save}>Save Security Settings</Button></div>
          </div>
        )}

        {section === 'Integrations' && (
          <div className="max-w-2xl space-y-6">
            <SectionHeader title="Integrations" subtitle="Connected systems and API configuration" />
            <Card className="p-5 space-y-3">
              {[
                { name: 'Student Information System (SIS)', status: 'connected', last: '2026-09-07 08:00' },
                { name: 'Learning Management System (LMS)', status: 'connected', last: '2026-09-07 07:55' },
                { name: 'Email Gateway (SMTP)', status: 'connected', last: '2026-09-07 09:00' },
                { name: 'SMS Provider (Twilio)', status: 'connected', last: '2026-09-06 22:00' },
                { name: 'AI Inference Engine', status: 'connected', last: '2026-09-07 08:00' },
                { name: 'Data Warehouse', status: 'error', last: '2026-09-07 07:30' },
              ].map(item => (
                <div key={item.name} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">Last sync: {item.last}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={item.status === 'connected' ? 'success' : 'danger'}>{item.status}</Badge>
                    <Button size="sm" variant="ghost">Configure</Button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {section === 'Retention' && (
          <div className="max-w-2xl space-y-6">
            <SectionHeader title="Data Retention" subtitle="Configure how long data is retained for compliance" />
            <Card className="p-5 space-y-4">
              {[
                { label: 'Student Profile Data', value: '7 years' },
                { label: 'Interaction History', value: '5 years' },
                { label: 'Audit Logs', value: '7 years' },
                { label: 'AI Prediction History', value: '3 years' },
                { label: 'Campaign Data', value: '2 years' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100">
                  <p className="text-sm text-slate-700">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-indigo-600">{item.value}</span>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </div>
                </div>
              ))}
            </Card>
            <div className="flex gap-2"><Button variant="primary" onClick={save}>Save Retention Policy</Button></div>
          </div>
        )}

        {section === 'Notification Rules' && (
          <div className="max-w-2xl space-y-6">
            <SectionHeader title="Notification Rules" subtitle="Configure automated notification triggers" />
            <Card className="p-5 space-y-3">
              {[
                { rule: 'Churn risk spike > 15% (7 days)', severity: 'Critical', action: 'Alert team + create task' },
                { rule: 'SLA breach imminent (< 2h)', severity: 'Warning', action: 'Notify ticket owner' },
                { rule: 'AI confidence < threshold', severity: 'Info', action: 'Flag for human review' },
                { rule: 'Attendance below 65%', severity: 'Warning', action: 'Alert academic advisor' },
                { rule: 'New AI prediction batch ready', severity: 'Info', action: 'Notify dashboard' },
              ].map(rule => (
                <div key={rule.rule} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{rule.rule}</p>
                    <p className="text-xs text-slate-500">Action: {rule.action}</p>
                  </div>
                  <Badge variant={rule.severity === 'Critical' ? 'danger' : rule.severity === 'Warning' ? 'warning' : 'info'}>{rule.severity}</Badge>
                </div>
              ))}
              <Button size="sm" variant="secondary">+ Add Rule</Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
