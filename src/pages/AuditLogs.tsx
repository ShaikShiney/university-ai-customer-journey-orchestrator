import { useState } from 'react';
import { Card, Button, Input, Select, Table, Tr, Td, Badge, SectionHeader } from '../components/ui';
import { MOCK_AUDIT_LOGS } from '../data';

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [selected, setSelected] = useState<typeof MOCK_AUDIT_LOGS[0] | null>(null);

  const filtered = MOCK_AUDIT_LOGS.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (outcomeFilter !== 'all' && log.outcome !== outcomeFilter) return false;
    if (search && !log.user.toLowerCase().includes(search.toLowerCase()) && !log.entity.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const outcomeStyle: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failure: 'bg-red-50 text-red-700 border-red-200',
    blocked: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const actionStyle: Record<string, string> = {
    'Login': 'bg-slate-100 text-slate-600',
    'Data Access': 'bg-sky-50 text-sky-700',
    'Create': 'bg-emerald-50 text-emerald-700',
    'Update': 'bg-indigo-50 text-indigo-700',
    'Delete': 'bg-red-50 text-red-700',
    'Export': 'bg-violet-50 text-violet-700',
    'AI execution': 'bg-pink-50 text-pink-700',
    'Approval': 'bg-emerald-50 text-emerald-700',
    'Override': 'bg-amber-50 text-amber-700',
    'Configuration Change': 'bg-orange-50 text-orange-700',
    'Rejection': 'bg-red-50 text-red-600',
  };

  return (
    <div className="p-6 space-y-5">
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Input placeholder="Search by user or entity…" value={search} onChange={setSearch} className="w-64"
            icon={<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>}
          />
          <Select value={actionFilter} onChange={setActionFilter} options={[
            { value: 'all', label: 'All actions' },
            { value: 'Login', label: 'Login' },
            { value: 'Data Access', label: 'Data Access' },
            { value: 'Update', label: 'Update' },
            { value: 'Approval', label: 'Approval' },
            { value: 'Override', label: 'Override' },
            { value: 'Export', label: 'Export' },
            { value: 'Configuration Change', label: 'Config Change' },
          ]} />
          <Select value={outcomeFilter} onChange={setOutcomeFilter} options={[
            { value: 'all', label: 'All outcomes' },
            { value: 'success', label: 'Success' },
            { value: 'failure', label: 'Failure' },
            { value: 'blocked', label: 'Blocked' },
          ]} />
          <Input type="date" className="w-44" />
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" size="sm">Export CSV</Button>
            <Button variant="secondary" size="sm">Export PDF</Button>
          </div>
        </div>
      </Card>

      <div className="flex gap-6 h-[calc(100vh-320px)] min-h-[400px]">
        {/* Log table */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1">
            <Table headers={['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Entity ID', 'Outcome', 'Organisation']}>
              {filtered.map(log => (
                <Tr key={log.id} onClick={() => setSelected(log)} className={selected?.id === log.id ? 'bg-indigo-50' : ''}>
                  <Td><span className="text-xs font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</span></Td>
                  <Td><span className="text-sm font-medium text-slate-800">{log.user}</span></Td>
                  <Td><span className="text-xs capitalize text-slate-500">{log.role}</span></Td>
                  <Td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionStyle[log.action] || 'bg-slate-100 text-slate-600'}`}>
                      {log.action}
                    </span>
                  </Td>
                  <Td><span className="text-sm text-slate-600">{log.entity}</span></Td>
                  <Td><span className="text-xs font-mono text-slate-400">{log.entityId}</span></Td>
                  <Td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${outcomeStyle[log.outcome]}`}>
                      {log.outcome}
                    </span>
                  </Td>
                  <Td><span className="text-xs text-slate-500">{log.organisation}</span></Td>
                </Tr>
              ))}
            </Table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">{filtered.length} records · Audit logs are immutable and read-only</p>
            <div className="flex gap-1">
              {[1, 2, 3].map(p => (
                <button key={p} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === 1 ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-200'}`}>{p}</button>
              ))}
            </div>
          </div>
        </Card>

        {/* Detail panel */}
        {selected && (
          <Card className="w-80 shrink-0 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Event Detail</p>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {[
                { label: 'Timestamp', value: selected.timestamp },
                { label: 'User', value: selected.user },
                { label: 'Role', value: selected.role },
                { label: 'Action', value: selected.action },
                { label: 'Entity', value: selected.entity },
                { label: 'Entity ID', value: selected.entityId },
                { label: 'Outcome', value: selected.outcome },
                { label: 'Organisation', value: selected.organisation },
              ].map(d => (
                <div key={d.label} className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400">{d.label}</span>
                  <span className="text-xs font-medium text-slate-700 text-right max-w-[60%]">{d.value}</span>
                </div>
              ))}
              <div className="py-2">
                <p className="text-xs text-slate-400 mb-1">Details</p>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2 rounded-lg">{selected.details}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700">🔒 This audit record is immutable. It cannot be edited or deleted.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
