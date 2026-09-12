import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Button,
  Badge,
  Select,
  Input,
  Drawer,
} from '../components/ui';
import { JOURNEY_STAGES } from '../data';

const API_URL = 'https://university-ai-customer-journey.onrender.com';

interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  programme: string;
  department: string;
  year: number;
  journey_stage: string;
  risk_level: string;
  attendance: number;
  cgpa: number;
  engagement_score: number;
}

interface Interaction {
  id: number;
  student_id: number;
  student_code: string;
  student_name: string;
  channel: string;
  interaction_type: string;
  subject: string;
  description?: string;
  message?: string;
  status: string;
  occurred_at: string;
}

interface JourneyEvent {
  type: string;
  title: string;
  date: string;
  student: string;
  status: string;
  owner: string;
  stage: string;
  description?: string;
  channel?: string;
}

function getToken(): string | null {
  return (
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken')
  );
}

function getEventType(interaction: Interaction): string {
  const type = String(interaction.interaction_type || '').toUpperCase();
  const channel = String(interaction.channel || '').toUpperCase();

  if (type.includes('TICKET')) return 'ticket';
  if (type.includes('AI')) return 'ai';
  if (
    type.includes('ACADEMIC') ||
    type.includes('ASSESSMENT') ||
    type.includes('TEACHING')
  ) {
    return 'academic';
  }
  if (
    channel === 'EMAIL' ||
    channel === 'CHAT' ||
    channel === 'CALL' ||
    channel === 'WEB' ||
    channel === 'PORTAL'
  ) {
    return 'interaction';
  }

  return 'action';
}

function getStageFromInteraction(interaction: Interaction): string {
  const text = `${interaction.subject || ''} ${
    interaction.description || ''
  } ${interaction.interaction_type || ''}`.toLowerCase();

  if (text.includes('admission') || text.includes('offer')) {
    return 'Admission';
  }

  if (
    text.includes('registration') ||
    text.includes('course') ||
    text.includes('enrol')
  ) {
    return 'Course Registration';
  }

  if (text.includes('timetable') || text.includes('schedule')) {
    return 'Timetable Planning';
  }

  if (
    text.includes('teach') ||
    text.includes('class') ||
    text.includes('lecture')
  ) {
    return 'Teaching';
  }

  if (
    text.includes('assessment') ||
    text.includes('exam') ||
    text.includes('result') ||
    text.includes('grade')
  ) {
    return 'Assessment';
  }

  if (
    text.includes('research') ||
    text.includes('project') ||
    text.includes('fyp') ||
    text.includes('supervisor')
  ) {
    return 'Research Administration';
  }

  if (
    text.includes('placement') ||
    text.includes('internship') ||
    text.includes('job') ||
    text.includes('career')
  ) {
    return 'Placement';
  }

  if (text.includes('graduation') || text.includes('graduate')) {
    return 'Graduation';
  }

  return 'Placement';
}

function formatDate(value: string): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function mapStatus(status: string): string {
  const value = String(status || '').toUpperCase();

  if (value === 'COMPLETED') return 'Completed';
  if (value === 'OPEN') return 'Open';
  if (value === 'IN_PROGRESS') return 'In Progress';
  if (value === 'CANCELLED') return 'Cancelled';

  return status || 'Open';
}

export default function Journey() {
  const [students, setStudents] = useState<Student[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] =
    useState<JourneyEvent | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [studentFilter, setStudentFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadJourneyData = async () => {
      const token = getToken();

      if (!token) {
        setError('Authentication token not found. Please sign in again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [studentsResponse, interactionsResponse] = await Promise.all([
          fetch(`${API_URL}/api/students`, { headers }),
          fetch(`${API_URL}/api/interactions`, { headers }),
        ]);

        const studentsResult = await studentsResponse.json();
        const interactionsResult = await interactionsResponse.json();

        if (!studentsResponse.ok || !studentsResult.success) {
          throw new Error(
            studentsResult.message || 'Unable to load students.'
          );
        }

        if (!interactionsResponse.ok || !interactionsResult.success) {
          throw new Error(
            interactionsResult.message || 'Unable to load interactions.'
          );
        }

        setStudents(
          Array.isArray(studentsResult.data) ? studentsResult.data : []
        );

        setInteractions(
          Array.isArray(interactionsResult.data)
            ? interactionsResult.data
            : []
        );
      } catch (err) {
        console.error('Journey data error:', err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unable to load journey data.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadJourneyData();
  }, []);

  const selectedStudent = useMemo(() => {
    if (students.length === 0) return null;

    if (studentFilter === 'all') {
      return students[0];
    }

    return (
      students.find(
        (student) => String(student.id) === String(studentFilter)
      ) || students[0]
    );
  }, [students, studentFilter]);

  const journeyEvents = useMemo<JourneyEvent[]>(() => {
    if (!selectedStudent) return [];

    return interactions
      .filter(
        (interaction) =>
          Number(interaction.student_id) === Number(selectedStudent.id)
      )
      .map((interaction) => {
        const stage = getStageFromInteraction(interaction);

        return {
          type: getEventType(interaction),
          title: interaction.subject || 'Interaction',
          date: formatDate(interaction.occurred_at),
          student: interaction.student_name || selectedStudent.name,
          status: mapStatus(interaction.status),
          owner: interaction.channel || 'System',
          stage,
          description:
            interaction.description || interaction.message || '',
          channel: interaction.channel,
        };
      });
  }, [interactions, selectedStudent]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return journeyEvents.filter((event) => {
      if (
        selectedStage &&
        event.stage !== selectedStage
      ) {
        return false;
      }

      if (
        eventTypeFilter !== 'all' &&
        event.type !== eventTypeFilter
      ) {
        return false;
      }

      if (
        query &&
        !event.title.toLowerCase().includes(query) &&
        !event.student.toLowerCase().includes(query) &&
        !event.owner.toLowerCase().includes(query) &&
        !event.stage.toLowerCase().includes(query)
      ) {
        return false;
      }

      return true;
    });
  }, [
    journeyEvents,
    selectedStage,
    eventTypeFilter,
    search,
  ]);

  const eventsByStage = useMemo(() => {
    const grouped: Record<string, JourneyEvent[]> = {};

    JOURNEY_STAGES.forEach((stage) => {
      grouped[stage.name] = [];
    });

    filteredEvents.forEach((event) => {
      if (!grouped[event.stage]) {
        grouped[event.stage] = [];
      }

      grouped[event.stage].push(event);
    });

    return grouped;
  }, [filteredEvents]);

  const stageIndex = useMemo(() => {
    if (!selectedStudent) return 0;

    const index = JOURNEY_STAGES.findIndex(
      (stage) => stage.name === selectedStudent.journey_stage
    );

    return index >= 0 ? index : 0;
  }, [selectedStudent]);

  const eventColors: Record<string, string> = {
    document: 'bg-indigo-100 text-indigo-700',
    interaction: 'bg-sky-100 text-sky-700',
    action: 'bg-emerald-100 text-emerald-700',
    academic: 'bg-violet-100 text-violet-700',
    ticket: 'bg-amber-100 text-amber-700',
    ai: 'bg-pink-100 text-pink-700',
  };

  const eventIcons: Record<string, string> = {
    document: '📄',
    interaction: '💬',
    action: '✅',
    academic: '🎓',
    ticket: '🎫',
    ai: '⚡',
  };

  const handleExport = () => {
    if (filteredEvents.length === 0) return;

    const headers = [
      'Student',
      'Journey Stage',
      'Event',
      'Date',
      'Status',
      'Owner/Channel',
      'Type',
    ];

    const rows = filteredEvents.map((event) => [
      event.student,
      event.stage,
      event.title,
      event.date,
      event.status,
      event.owner,
      event.type,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'journey-timeline.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-10">
          <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading journey timeline...
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 border-red-200">
          <div className="text-sm font-semibold text-red-700 mb-1">
            Unable to load journey
          </div>

          <p className="text-sm text-slate-500">{error}</p>
        </Card>
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="p-6">
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500">
            No students available.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            value={studentFilter}
            onChange={setStudentFilter}
            options={[
              { value: 'all', label: 'All students' },
              ...students.map((student) => ({
                value: String(student.id),
                label: student.name,
              })),
            ]}
          />

          <Select
            value={eventTypeFilter}
            onChange={setEventTypeFilter}
            options={[
              { value: 'all', label: 'All event types' },
              { value: 'academic', label: 'Academic' },
              { value: 'ticket', label: 'Service Tickets' },
              { value: 'interaction', label: 'Interactions' },
              { value: 'ai', label: 'AI Events' },
              { value: 'action', label: 'Actions' },
            ]}
          />

          <Input
            value={search}
            onChange={setSearch}
            placeholder="Search events…"
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
            className="w-56"
          />

          <div className="flex gap-2 ml-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedStage(null);
                setEventTypeFilter('all');
                setSearch('');
              }}
            >
              Clear Filters
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
            >
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Viewing banner */}
      <div className="bg-[#0f1f3d] text-white rounded-xl p-4 flex items-center gap-4">
        <div>
          <p className="text-xs text-white/50 mb-0.5">
            Viewing journey for
          </p>

          <p className="text-sm font-bold">
            {selectedStudent.name} · {selectedStudent.student_id}
          </p>

          <p className="text-xs text-white/50">
            {selectedStudent.programme} · Year {selectedStudent.year} ·
            Currently in {selectedStudent.journey_stage}
          </p>
        </div>

        <div className="ml-auto">
          <Badge variant="ai">
            {selectedStudent.journey_stage}
          </Badge>
        </div>
      </div>

      {/* Horizontal stage navigator */}
      <div className="overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {JOURNEY_STAGES.map((stage, i) => {
            const done = i < stageIndex;
            const current = i === stageIndex;
            const active = selectedStage === stage.name;

            return (
              <button
                key={stage.key}
                onClick={() =>
                  setSelectedStage(
                    active ? null : stage.name
                  )
                }
                className={`relative flex flex-col items-center px-4 py-3 min-w-[140px] transition-all border-b-2 ${
                  active
                    ? 'bg-slate-100 border-indigo-500'
                    : 'hover:bg-slate-50 border-transparent'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 font-bold ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : current
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </div>

                <p
                  className={`text-xs font-medium text-center ${
                    current
                      ? 'text-indigo-700'
                      : done
                        ? 'text-slate-500'
                        : 'text-slate-400'
                  }`}
                >
                  {stage.name}
                </p>

                {current && (
                  <span className="text-[10px] text-indigo-400 mt-0.5">
                    Active
                  </span>
                )}

                {i < JOURNEY_STAGES.length - 1 && (
                  <div
                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-px ${
                      done
                        ? 'bg-emerald-400'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {JOURNEY_STAGES.map((stage, i) => {
          const done = i < stageIndex;
          const current = i === stageIndex;
          const stageEvents = eventsByStage[stage.name] || [];

          if (
            selectedStage &&
            selectedStage !== stage.name
          ) {
            return null;
          }

          return (
            <Card
              key={stage.key}
              className={`overflow-hidden ${
                current ? 'border-indigo-200' : ''
              }`}
            >
              <div
                className={`px-4 py-3 border-b border-slate-100 flex items-center gap-2 ${
                  current ? 'bg-indigo-50' : 'bg-slate-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : current
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </div>

                <h3
                  className={`text-sm font-semibold ${
                    current
                      ? 'text-indigo-800'
                      : 'text-slate-700'
                  }`}
                >
                  {stage.name}
                </h3>

                {current && (
                  <Badge variant="ai">
                    Active Stage
                  </Badge>
                )}

                {done && (
                  <Badge variant="success">
                    Completed
                  </Badge>
                )}

                {!done && !current && (
                  <Badge variant="muted">
                    Upcoming
                  </Badge>
                )}

                <span className="ml-auto text-xs text-slate-400">
                  {stageEvents.length} events
                </span>
              </div>

              <div className="p-4">
                {stageEvents.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-4">
                    No events yet for this stage.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stageEvents.map((event, j) => (
                      <div
                        key={`${event.title}-${j}`}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                        onClick={() => {
                          setSelectedEvent(event);
                          setDrawerOpen(true);
                        }}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                            eventColors[event.type] ||
                            'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {eventIcons[event.type] || '📋'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">
                            {event.title}
                          </p>

                          <p className="text-xs text-slate-500">
                            {event.date} · {event.owner}
                          </p>
                        </div>

                        <Badge
                          variant={
                            event.status === 'Completed'
                              ? 'success'
                              : event.status === 'Open'
                                ? 'warning'
                                : 'ai'
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Event detail drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Event Detail"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                eventColors[selectedEvent.type] ||
                'bg-slate-100'
              }`}
            >
              {eventIcons[selectedEvent.type] || '📋'}
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {selectedEvent.title}
              </h3>

              <p className="text-sm text-slate-500">
                {selectedEvent.date}
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: 'Student',
                  value: selectedEvent.student,
                },
                {
                  label: 'Owner / Channel',
                  value: selectedEvent.owner,
                },
                {
                  label: 'Status',
                  value: selectedEvent.status,
                },
                {
                  label: 'Event Type',
                  value: selectedEvent.type,
                },
                {
                  label: 'Journey Stage',
                  value: selectedEvent.stage,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between gap-4 py-2 border-b border-slate-100"
                >
                  <span className="text-sm text-slate-500">
                    {item.label}
                  </span>

                  <span className="text-sm font-medium text-slate-800 text-right">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {selectedEvent.channel && (
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">
                  Channel
                </p>

                <p className="text-sm font-medium text-slate-800">
                  {selectedEvent.channel}
                </p>
              </div>
            )}

            {selectedEvent.description && (
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">
                  Description
                </p>

                <p className="text-sm text-slate-700">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDrawerOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}