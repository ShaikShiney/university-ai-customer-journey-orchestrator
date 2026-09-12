import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TicketStatusBadge,
  PriorityBadge,
  ConfidenceBadge,
  Avatar,
  SectionHeader,
  Modal,
  Drawer,
} from '../components/ui';

const API_URL = 'http://localhost:5000';

type Student = {
  id: number;
  student_id: string;
  name: string;
  email?: string;
  programme: string;
  department?: string;
  year: number;
  attendance: number;
  cgpa: number;
  journey_stage: string;
  risk_level: string;
  engagement_score: number;
};

type ApiTicket = {
  id: number;
  student_id: number;
  student_code?: string;
  student_name?: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assigned_to?: number | null;
  assigned_name?: string | null;
  ai_summary?: string | null;
  detected_intent?: string | null;
  sentiment?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Ticket = {
  id: string;
  dbId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  title: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  owner: string;
  assignedTo: number | null;
  aiSummary: string;
  detectedIntent: string;
  sentiment: string;
  created: string;
  slaBreached: boolean;
};

type Message = {
  from: string;
  msg: string;
  time: string;
  avatar: string;
  agent?: boolean;
};

function getToken() {
  return (
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    ''
  );
}

function formatDate(value?: string) {
  if (!value) return '—';

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((x) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST'
  );
}

function normalizeStatus(status: string) {
  return String(status || '').toLowerCase();
}

function displayStatus(status: string) {
  const s = normalizeStatus(status);

  if (s === 'in_progress') return 'In_progress';

  return s.charAt(0).toUpperCase() + s.slice(1);
}

function categoryFromTicket(ticket: ApiTicket) {
  const text = `${ticket.title} ${ticket.description} ${
    ticket.detected_intent || ''
  }`.toLowerCase();

  if (text.includes('placement')) return 'Placement';
  if (text.includes('timetable')) return 'Timetable Planning';
  if (text.includes('registration')) return 'Course Registration';
  if (text.includes('fee') || text.includes('receipt')) return 'Administrative';
  if (text.includes('assessment')) return 'Assessment';

  return 'Service Request';
}

function mapTicket(ticket: ApiTicket): Ticket {
  const status = normalizeStatus(ticket.status);

  return {
    id: `TKT-${String(ticket.id).padStart(6, '0')}`,
    dbId: ticket.id,
    studentId: Number(ticket.student_id),
    studentCode: ticket.student_code || '',
    studentName: ticket.student_name || 'Student',
    title: ticket.title,
    subject: ticket.title,
    description: ticket.description || '',
    category: categoryFromTicket(ticket),
    priority: normalizeStatus(ticket.priority),
    status,
    owner: ticket.assigned_name || 'Unassigned',
    assignedTo:
      ticket.assigned_to === null || ticket.assigned_to === undefined
        ? null
        : Number(ticket.assigned_to),
    aiSummary:
      ticket.ai_summary ||
      'AI summary will be generated from the ticket conversation.',
    detectedIntent:
      ticket.detected_intent || categoryFromTicket(ticket),
    sentiment: ticket.sentiment || 'NEUTRAL',
    created: formatDate(ticket.created_at),
    slaBreached: false,
  };
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reply, setReply] = useState('');
  const [messages, setMessages] = useState<Record<number, Message[]>>({});

  const [aiResponse, setAiResponse] = useState('');
  const [responseUsed, setResponseUsed] = useState(false);

  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);

  const [newStudent, setNewStudent] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('placement');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDescription, setNewDescription] = useState('');

  const [escalateTeam, setEscalateTeam] = useState('placement');
  const [escalateReason, setEscalateReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  });

  /* =========================================================
     LOAD STUDENTS + TICKETS
  ========================================================= */

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const [ticketResponse, studentResponse] = await Promise.all([
        fetch(`${API_URL}/api/tickets`, {
          headers: authHeaders(),
        }),
        fetch(`${API_URL}/api/students`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const ticketJson = await ticketResponse.json().catch(() => ({}));
      const studentJson = await studentResponse.json().catch(() => ({}));

      if (!ticketResponse.ok) {
        throw new Error(
          ticketJson.message || 'Unable to load tickets from database.'
        );
      }

      if (!studentResponse.ok) {
        throw new Error(
          studentJson.message || 'Unable to load students from database.'
        );
      }

      const mappedTickets: Ticket[] = (ticketJson.data || []).map(mapTicket);

      setTickets(mappedTickets);
      setStudents(studentJson.data || []);

      setSelected((current) => {
        if (current) {
          const fresh = mappedTickets.find(
            (ticket) => ticket.dbId === current.dbId
          );

          if (fresh) return fresh;
        }

        return mappedTickets[0] || null;
      });
    } catch (err) {
      console.error('Ticket load error:', err);
      setError(
        err instanceof Error ? err.message : 'Unable to load ticket data.'
      );
      setTickets([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     FILTERS
  ========================================================= */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const status = normalizeStatus(ticket.status);

      if (statusFilter !== 'all') {
        if (
          statusFilter === 'pending' &&
          !['pending', 'in_progress'].includes(status)
        ) {
          return false;
        }

        if (
          statusFilter !== 'pending' &&
          status !== statusFilter
        ) {
          return false;
        }
      }

      if (!q) return true;

      return (
        ticket.subject.toLowerCase().includes(q) ||
        ticket.studentName.toLowerCase().includes(q) ||
        ticket.studentCode.toLowerCase().includes(q) ||
        ticket.category.toLowerCase().includes(q)
      );
    });
  }, [tickets, statusFilter, search]);

  const openCount = tickets.filter((t) =>
    ['open', 'new', 'escalated'].includes(normalizeStatus(t.status))
  ).length;

  const pendingCount = tickets.filter((t) =>
    ['pending', 'in_progress'].includes(normalizeStatus(t.status))
  ).length;

  const resolvedCount = tickets.filter(
    (t) => normalizeStatus(t.status) === 'resolved'
  ).length;

  const selectedStudent = selected
    ? students.find((s) => Number(s.id) === Number(selected.studentId))
    : null;

  /* =========================================================
     AI RESPONSE
  ========================================================= */

  useEffect(() => {
    if (!selected) {
      setAiResponse('');
      return;
    }

    setResponseUsed(false);

    const response = `Thank you for reaching out regarding "${selected.subject}". We have reviewed your request and our team is working on it. We will keep you updated and assist you with the next steps.`;

    setAiResponse(response);
  }, [selected?.dbId]);

  /* =========================================================
     UPDATE TICKET
  ========================================================= */

  const updateTicket = async (
    ticketId: number,
    updates: {
      status?: string;
      assigned_to?: number | null;
    }
  ) => {
    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.message || 'Unable to update ticket.');
      }

      await loadData();
    } catch (err) {
      console.error('Update ticket error:', err);

      setError(
        err instanceof Error ? err.message : 'Unable to update ticket.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     RESOLVE
  ========================================================= */

  const handleResolve = async () => {
    if (!selected) return;

    await updateTicket(selected.dbId, {
      status: 'RESOLVED',
    });
  };

  /* =========================================================
     ESCALATE
  ========================================================= */

  const handleEscalate = async () => {
    if (!selected) return;

    await updateTicket(selected.dbId, {
      status: 'ESCALATED',
    });

    setShowEscalateModal(false);
    setEscalateReason('');
  };

  /* =========================================================
     ASSIGN
  ========================================================= */

  const handleAssign = async () => {
    if (!selected) return;

    const token = getToken();

    try {
      setActionLoading(true);
      setError('');

      const meResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const meJson = await meResponse.json().catch(() => ({}));

      const userId =
        meJson?.data?.id ||
        meJson?.user?.id ||
        meJson?.user?.userId ||
        meJson?.data?.userId;

      if (!userId) {
        throw new Error(
          'Could not determine the current user for assignment.'
        );
      }

      await updateTicket(selected.dbId, {
        assigned_to: Number(userId),
        status:
          normalizeStatus(selected.status) === 'resolved'
            ? 'RESOLVED'
            : 'IN_PROGRESS',
      });
    } catch (err) {
      console.error('Assign error:', err);

      setError(
        err instanceof Error ? err.message : 'Unable to assign ticket.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     SEND REPLY
  ========================================================= */

  const handleSendReply = async () => {
    if (!selected || !reply.trim()) return;

    const text = reply.trim();

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/interactions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          student_id: selected.studentId,
          channel: 'CHAT',
          interaction_type: 'TICKET_REPLY',
          subject: selected.subject,
          description: text,
          message: text,
          status: 'IN_PROGRESS',
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.message || 'Unable to send reply.');
      }

      const newMessage: Message = {
        from: 'System Admin',
        msg: text,
        time: new Date().toLocaleString('en-IN'),
        avatar: 'SA',
        agent: true,
      };

      setMessages((previous) => ({
        ...previous,
        [selected.dbId]: [
          ...(previous[selected.dbId] || []),
          newMessage,
        ],
      }));

      setReply('');

      if (normalizeStatus(selected.status) !== 'resolved') {
        await updateTicket(selected.dbId, {
          status: 'IN_PROGRESS',
        });
      }
    } catch (err) {
      console.error('Reply error:', err);

      setError(
        err instanceof Error ? err.message : 'Unable to send reply.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     CREATE TICKET
  ========================================================= */

  const handleCreateTicket = async () => {
    if (!newStudent || !newSubject.trim() || !newDescription.trim()) {
      setError('Student, subject and description are required.');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          student_id: Number(newStudent),
          title: newSubject.trim(),
          description: newDescription.trim(),
          priority: newPriority.toUpperCase(),
          status: 'OPEN',
          assigned_to: null,
          ai_summary: `Student requested assistance regarding ${newSubject.trim()}.`,
          detected_intent: newSubject.trim(),
          sentiment: 'NEUTRAL',
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.message || 'Unable to create ticket.');
      }

      setNewStudent('');
      setNewSubject('');
      setNewCategory('placement');
      setNewPriority('medium');
      setNewDescription('');
      setShowNewTicket(false);

      await loadData();
    } catch (err) {
      console.error('Create ticket error:', err);

      setError(
        err instanceof Error ? err.message : 'Unable to create ticket.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">
            Loading tickets from database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      {/* =====================================================
          LEFT QUEUE
      ====================================================== */}

      <div className="w-[360px] lg:w-[420px] shrink-0 border-r border-slate-200 flex flex-col bg-white">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Ticket Queue
              </h2>

              <p className="text-xs text-slate-400 mt-0.5">
                {tickets.length} tickets · {openCount} open
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowNewTicket(true)}
            >
              + New Ticket
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Search tickets…"
              value={search}
              onChange={setSearch}
              icon={
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              }
            />

            <div className="flex gap-1 overflow-x-auto pb-1">
              {[
                ['all', `All (${tickets.length})`],
                ['open', `Open (${openCount})`],
                ['pending', `Pending (${pendingCount})`],
                ['resolved', `Resolved (${resolvedCount})`],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === value
                      ? 'bg-[#1e3a5f] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="m-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-400">
                No tickets found.
              </p>
            </div>
          ) : (
            filtered.map((ticket) => (
              <div
                key={ticket.dbId}
                onClick={() => setSelected(ticket)}
                className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                  selected?.dbId === ticket.dbId
                    ? 'bg-indigo-50 border-l-2 border-indigo-500'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono text-slate-400">
                    {ticket.id}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <TicketStatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-800 mb-1 line-clamp-2">
                  {ticket.subject}
                </p>

                <p className="text-xs text-slate-500">
                  {ticket.studentName} · {ticket.studentCode}
                </p>

                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-400">
                    {ticket.category}
                  </p>

                  {ticket.slaBreached && (
                    <Badge variant="danger">SLA</Badge>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  {ticket.created}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =====================================================
          RIGHT DETAIL
      ====================================================== */}

      {selected ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 lg:p-6 space-y-5">
            {/* Header */}

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-slate-400">
                    {selected.id}
                  </span>

                  <TicketStatusBadge status={selected.status} />

                  <PriorityBadge priority={selected.priority} />
                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  {selected.subject}
                </h2>

                <p className="text-sm text-slate-500 mt-0.5">
                  Category: {selected.category} · Owner:{' '}
                  {selected.owner} · Created: {selected.created}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowEscalateModal(true)}
                  disabled={actionLoading}
                >
                  Escalate
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAssign}
                  disabled={actionLoading}
                >
                  Assign
                </Button>

                <Button
                  size="sm"
                  variant="success"
                  onClick={handleResolve}
                  disabled={
                    actionLoading ||
                    normalizeStatus(selected.status) === 'resolved'
                  }
                >
                  Resolve
                </Button>
              </div>
            </div>

            {/* Student summary */}

            {selectedStudent && (
              <Card className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Customer Profile Summary
                </p>

                <div className="flex items-start gap-4">
                  <Avatar
                    initials={initials(selectedStudent.name)}
                    size="md"
                  />

                  <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400">Name</p>
                      <p className="font-semibold text-slate-800">
                        {selectedStudent.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Student ID</p>
                      <p className="font-semibold text-slate-800 font-mono">
                        {selectedStudent.student_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Programme</p>
                      <p className="font-semibold text-slate-800">
                        {selectedStudent.programme}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Journey Stage</p>
                      <p className="font-semibold text-slate-800">
                        {selectedStudent.journey_stage}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Risk Level</p>
                      <p
                        className={`font-bold ${
                          selectedStudent.risk_level === 'critical'
                            ? 'text-red-600'
                            : selectedStudent.risk_level === 'high'
                            ? 'text-red-500'
                            : selectedStudent.risk_level === 'medium'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {String(
                          selectedStudent.risk_level || 'low'
                        ).toUpperCase()}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">GPA</p>
                      <p className="font-semibold">
                        {Number(selectedStudent.cgpa || 0).toFixed(1)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Attendance</p>
                      <p className="font-semibold">
                        {Number(selectedStudent.attendance || 0).toFixed(0)}%
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Engagement</p>
                      <p className="font-semibold">
                        {Number(
                          selectedStudent.engagement_score || 0
                        ).toFixed(0)}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Conversation */}

            <Card className="p-5">
              <SectionHeader title="Conversation" />

              <div className="space-y-4">
                <div className="flex gap-3">
                  <Avatar
                    initials={initials(selected.studentName)}
                    size="sm"
                  />

                  <div className="max-w-[75%] flex flex-col items-start">
                    <p className="text-xs text-slate-400 mb-1">
                      {selected.studentName} · {selected.created}
                    </p>

                    <div className="rounded-2xl px-4 py-3 text-sm bg-slate-100 text-slate-800 rounded-tl-sm">
                      {selected.description}
                    </div>
                  </div>
                </div>

                {(messages[selected.dbId] || []).map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      msg.agent ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar
                      initials={msg.avatar}
                      size="sm"
                      color={msg.agent ? 'bg-indigo-600' : undefined}
                    />

                    <div
                      className={`max-w-[75%] ${
                        msg.agent
                          ? 'items-end'
                          : 'items-start'
                      } flex flex-col`}
                    >
                      <p
                        className={`text-xs text-slate-400 mb-1 ${
                          msg.agent ? 'text-right' : ''
                        }`}
                      >
                        {msg.from} · {msg.time}
                      </p>

                      <div
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          msg.agent
                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                            : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                        }`}
                      >
                        {msg.msg}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply */}

              <div className="mt-5 border-t border-slate-100 pt-4">
                <textarea
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  rows={3}
                  placeholder="Type a reply…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />

                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSendReply}
                    disabled={actionLoading || !reply.trim()}
                  >
                    {actionLoading ? 'Sending...' : 'Send Reply'}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setReply('')}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </Card>

            {/* AI Agent Assist */}

            <Card className="p-5 border-indigo-200 bg-indigo-50/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="white"
                    strokeWidth="2.5"
                  >
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>

                <span className="text-sm font-semibold text-indigo-700">
                  AI Agent Assist
                </span>

                <span className="ml-auto text-xs text-indigo-400">
                  Model v2.4.1
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <Card className="p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    Detected Intent
                  </p>

                  <p className="text-sm font-semibold text-slate-800">
                    {selected.detectedIntent}
                  </p>
                </Card>

                <Card className="p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    Sentiment
                  </p>

                  <p className="text-sm font-semibold text-amber-600">
                    {selected.sentiment}
                  </p>
                </Card>

                <Card className="p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    Suggested Action
                  </p>

                  <p className="text-sm font-semibold text-slate-800">
                    {normalizeStatus(selected.status) === 'resolved'
                      ? 'Monitor outcome'
                      : 'Review and assist'}
                  </p>
                </Card>
              </div>

              {/* Summary */}

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                    AI Conversation Summary
                  </p>
                </div>

                <p className="text-sm text-slate-700 bg-white rounded-xl p-3 border border-indigo-100">
                  {selected.aiSummary}
                </p>

                <p className="text-xs text-indigo-400 mt-1">
                  Confidence: 93% · Model v2.4.1 · Source: ticket data
                </p>
              </div>

              {/* Suggested response */}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                    Suggested Response
                  </p>

                  <div className="flex gap-1">
                    <Badge variant="ai">AI Generated</Badge>
                    <ConfidenceBadge value={88} />
                  </div>
                </div>

                {responseUsed ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
                    ✓ Response copied to reply box. Edit as needed before
                    sending.
                  </div>
                ) : (
                  <>
                    <textarea
                      className="w-full border border-indigo-200 rounded-xl p-3 text-sm text-slate-800 resize-none focus:outline-none focus:border-indigo-400 transition-all bg-white"
                      rows={5}
                      value={aiResponse}
                      onChange={(e) => setAiResponse(e.target.value)}
                    />

                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="ai"
                        onClick={() => {
                          setReply(aiResponse);
                          setResponseUsed(true);
                        }}
                      >
                        Use Response
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setReply(aiResponse)}
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAiResponse(
                            `Thank you for contacting the university support team regarding "${selected.subject}". We have reviewed your request and will assist you with the appropriate next steps.`
                          );
                        }}
                      >
                        Regenerate
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAiResponse('')}
                      >
                        Reject
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          {error ? error : 'Select a ticket to view details'}
        </div>
      )}

      {/* =====================================================
          ESCALATE MODAL
      ====================================================== */}

      <Modal
        open={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        title="Escalate Ticket"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Escalate to"
            value={escalateTeam}
            onChange={setEscalateTeam}
            options={[
              { value: 'placement', label: 'Placement Team' },
              { value: 'academic', label: 'Academic Affairs' },
              { value: 'it', label: 'IT Support' },
              { value: 'senior', label: 'Senior Agent' },
            ]}
          />

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Reason for escalation
            </label>

            <textarea
              className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 transition-all resize-none"
              rows={3}
              placeholder="Describe the reason…"
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={handleEscalate}
              disabled={actionLoading}
            >
              {actionLoading ? 'Escalating...' : 'Escalate'}
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowEscalateModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* =====================================================
          NEW TICKET DRAWER
      ====================================================== */}

      <Drawer
        open={showNewTicket}
        onClose={() => setShowNewTicket(false)}
        title="Create New Ticket"
      >
        <div className="space-y-4">
          <Select
            label="Student"
            value={newStudent}
            onChange={setNewStudent}
            options={[
              { value: '', label: 'Select student…' },
              ...students.map((student) => ({
                value: String(student.id),
                label: `${student.name} — ${student.student_id}`,
              })),
            ]}
          />

          <Input
            label="Subject"
            placeholder="Brief description of the issue"
            value={newSubject}
            onChange={setNewSubject}
          />

          <Select
            label="Category"
            value={newCategory}
            onChange={setNewCategory}
            options={[
              { value: 'placement', label: 'Placement' },
              { value: 'academic', label: 'Academic' },
              { value: 'timetable', label: 'Timetable Planning' },
              { value: 'registration', label: 'Course Registration' },
              { value: 'administrative', label: 'Administrative' },
            ]}
          />

          <Select
            label="Priority"
            value={newPriority}
            onChange={setNewPriority}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
          />

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Description
            </label>

            <textarea
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 transition-all resize-none"
              rows={5}
              placeholder="Full description of the issue…"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <Button
            variant="primary"
            className="w-full justify-center"
            onClick={handleCreateTicket}
            disabled={actionLoading}
          >
            {actionLoading ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}