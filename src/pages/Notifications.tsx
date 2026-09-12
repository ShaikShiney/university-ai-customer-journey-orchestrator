import { useState } from 'react';
import { Card, Button, Badge, Select, SectionHeader } from '../components/ui';
import { MOCK_NOTIFICATIONS } from '../data';
import type { Notification } from '../data';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState('all');
  const [prefTab, setPrefTab] = useState(false);

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'urgent') return n.severity === 'critical';
    if (filter === 'ai') return n.type === 'ai';
    if (filter === 'system') return n.type === 'system';
    return true;
  });

  const markRead = (id: string) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));

  const typeIcon: Record<string, string> = {
    assignment: '📋', exception: '⚠️', approval: '✅', alert: '🔔', due_date: '📅', ai: '⚡', system: '⚙️',
  };

  const severityColor: Record<string, string> = {
    critical: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-indigo-400',
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[['all', 'All'], ['unread', 'Unread'], ['urgent', 'Urgent'], ['ai', 'AI'], ['system', 'System']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === k ? 'bg-[#1e3a5f] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {l}
              {k === 'unread' && <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {notifications.filter(n => !n.read).length}
              </span>}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>
          <Button variant="ghost" size="sm" onClick={() => setPrefTab(true)}>Notification Preferences</Button>
        </div>
      </div>

      {prefTab ? (
        <Card className="p-6">
          <SectionHeader title="Notification Preferences" subtitle="Configure what you receive and when"
            actions={<Button size="sm" variant="ghost" onClick={() => setPrefTab(false)}>← Back</Button>}
          />
          <div className="space-y-4 max-w-xl">
            {[
              { category: 'Assignments', desc: 'When tickets or tasks are assigned to you', options: ['Email', 'In-app'] },
              { category: 'Exceptions', desc: 'Anomalies and system exceptions', options: ['In-app', 'Email'] },
              { category: 'Approvals', desc: 'Approvals requiring your review', options: ['Email', 'In-app'] },
              { category: 'AI Alerts', desc: 'New AI recommendations and predictions', options: ['In-app'] },
              { category: 'SLA Alerts', desc: 'SLA breach warnings and breaches', options: ['Email', 'In-app'] },
              { category: 'System Events', desc: 'Model updates, maintenance notifications', options: ['In-app'] },
            ].map(pref => (
              <div key={pref.category} className="flex items-start justify-between p-4 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{pref.category}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{pref.desc}</p>
                  <div className="flex gap-2 mt-2">
                    {pref.options.map(o => <Badge key={o} variant="muted">{o}</Badge>)}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setPrefTab(false)}>Save Preferences</Button>
              <Button variant="secondary" onClick={() => setPrefTab(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-sm">No notifications in this category.</div>
          )}
          {filtered.map(n => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-4 bg-white border rounded-xl border-l-4 transition-all hover:shadow-sm ${severityColor[n.severity]} ${!n.read ? 'shadow-sm' : 'opacity-80'}`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-lg shrink-0">
                {typeIcon[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className={`text-sm font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                  <Badge variant={n.severity === 'critical' ? 'danger' : n.severity === 'warning' ? 'warning' : 'info'}>{n.severity}</Badge>
                  <Badge variant="muted">{n.type.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-slate-500">{n.description}</p>
                {n.relatedRecord && (
                  <p className="text-xs text-indigo-600 mt-1 font-medium">Related: {n.relatedRecord}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-xs text-slate-400">{n.timestamp}</span>
                <div className="flex gap-1">
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      Mark read
                    </button>
                  )}
                  {n.relatedRecord && (
                    <button className="text-xs text-slate-500 hover:text-slate-700 font-medium ml-2">
                      Open →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
