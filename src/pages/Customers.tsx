import { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Table,
  Tr,
  Td,
  Avatar,
  RiskBadge,
  Badge,
  ProgressBar,
} from '../components/ui';

interface Props {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  programme: string;
  department: string;
  year: number;
  attendance: number;
  cgpa: number;
  journey_stage: string;
  risk_level: string;
  engagement_score: number;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://university-ai-customer-journey.onrender.com';

function getAuthToken(): string | null {
  return (
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')
  );
}

export default function Customers({ onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getAuthToken();

        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_URL}/api/students`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          if (response.status === 401) {
            throw new Error(
              'Authentication expired. Please sign in again.'
            );
          }

          throw new Error(
            result.message || 'Failed to fetch students'
          );
        }

        setStudents(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        console.error('Students fetch error:', err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unable to load students from the database.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filtered = students.filter((student) => {
    const risk = student.risk_level?.toLowerCase() || '';

    if (riskFilter !== 'all' && risk !== riskFilter) {
      return false;
    }

    if (
      stageFilter !== 'all' &&
      student.journey_stage !== stageFilter
    ) {
      return false;
    }

    const searchValue = search.toLowerCase().trim();

    if (
      searchValue &&
      !student.name.toLowerCase().includes(searchValue) &&
      !student.student_id.toLowerCase().includes(searchValue)
    ) {
      return false;
    }

    return true;
  });

  const totalStudents = students.length;

  const highRiskStudents = students.filter((student) => {
    const risk = student.risk_level?.toLowerCase();

    return risk === 'high' || risk === 'critical';
  }).length;

  const lowRiskStudents = students.filter(
    (student) => student.risk_level?.toLowerCase() === 'low'
  ).length;

  const averageEngagement =
    students.length > 0
      ? Math.round(
          students.reduce(
            (total, student) =>
              total + Number(student.engagement_score || 0),
            0
          ) / students.length
        )
      : 0;

  const handleViewStudent = (studentId: string) => {
    onNavigate('customerProfile', {
      studentId,
    });
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      return;
    }

    const headers = [
      'Student ID',
      'Name',
      'Email',
      'Programme',
      'Department',
      'Year',
      'Journey Stage',
      'Attendance',
      'GPA',
      'Engagement',
      'Risk',
    ];

    const rows = filtered.map((student) => [
      student.student_id,
      student.name,
      student.email,
      student.programme,
      student.department,
      student.year,
      student.journey_stage,
      student.attendance,
      student.cgpa,
      student.engagement_score,
      student.risk_level,
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
    link.download = 'students.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {totalStudents}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Total Active
          </p>
        </Card>

        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {highRiskStudents}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            High / Critical Risk
          </p>
        </Card>

        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {lowRiskStudents}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Low Risk
          </p>
        </Card>

        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {averageEngagement}%
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Avg Engagement
          </p>
        </Card>
      </div>

      <Card>
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Search by name or ID…"
            value={search}
            onChange={setSearch}
            className="w-64"
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

          <Select
            value={riskFilter}
            onChange={setRiskFilter}
            options={[
              {
                value: 'all',
                label: 'All risk levels',
              },
              {
                value: 'low',
                label: 'Low',
              },
              {
                value: 'medium',
                label: 'Medium',
              },
              {
                value: 'high',
                label: 'High',
              },
              {
                value: 'critical',
                label: 'Critical',
              },
            ]}
          />

          <Select
            value={stageFilter}
            onChange={setStageFilter}
            options={[
              {
                value: 'all',
                label: 'All journey stages',
              },
              {
                value: 'Admission',
                label: 'Admission',
              },
              {
                value: 'Course Registration',
                label: 'Course Registration',
              },
              {
                value: 'Timetable Planning',
                label: 'Timetable Planning',
              },
              {
                value: 'Teaching',
                label: 'Teaching',
              },
              {
                value: 'Assessment',
                label: 'Assessment',
              },
              {
                value: 'Research Admin',
                label: 'Research Admin',
              },
              {
                value: 'Placement',
                label: 'Placement',
              },
              {
                value: 'Graduation',
                label: 'Graduation',
              },
            ]}
          />

          <Button
            variant="secondary"
            size="sm"
            className="ml-auto"
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading students from database...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-10 text-center">
            <p className="text-sm text-red-600">
              {error}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Make sure you are signed in and the Node.js backend is
              running on port 5000.
            </p>
          </div>
        )}

        {/* Student table */}
        {!loading && !error && (
          <>
            {filtered.length > 0 && (
              <Table
                headers={[
                  'Student',
                  'Programme',
                  'Year',
                  'Journey Stage',
                  'Attendance',
                  'GPA',
                  'Engagement',
                  'Risk',
                  'Churn %',
                  'Tickets',
                  '',
                ]}
              >
                {filtered.map((student) => (
                  <Tr
                    key={student.id}
                    onClick={() =>
                      handleViewStudent(student.student_id)
                    }
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={student.name
                            .split(' ')
                            .map((word) => word[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                          size="sm"
                        />

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {student.name}
                          </p>

                          <p className="text-xs text-slate-400 font-mono">
                            {student.student_id}
                          </p>
                        </div>
                      </div>
                    </Td>

                    <Td>
                      <span className="text-xs text-slate-600">
                        {student.programme}
                      </span>
                    </Td>

                    <Td>
                      <span className="text-xs text-slate-600">
                        Year {student.year}
                      </span>
                    </Td>

                    <Td>
                      <Badge
                        variant={
                          student.journey_stage === 'Placement'
                            ? 'ai'
                            : 'muted'
                        }
                      >
                        {student.journey_stage}
                      </Badge>
                    </Td>

                    <Td>
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={Number(student.attendance)}
                          color={
                            Number(student.attendance) >= 75
                              ? '#059669'
                              : '#dc2626'
                          }
                          className="w-16"
                        />

                        <span className="text-xs text-slate-600">
                          {student.attendance}%
                        </span>
                      </div>
                    </Td>

                    <Td>
                      <span className="text-sm font-medium text-slate-700">
                        {Number(student.cgpa).toFixed(1)}
                      </span>
                    </Td>

                    <Td>
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={Number(
                            student.engagement_score
                          )}
                          color="#6366f1"
                          className="w-16"
                        />

                        <span className="text-xs text-slate-600">
                          {student.engagement_score}%
                        </span>
                      </div>
                    </Td>

                    <Td>
                      <RiskBadge
                        level={student.risk_level}
                      />
                    </Td>

                    <Td>
                      <span className="text-sm text-slate-400">
                        —
                      </span>
                    </Td>

                    <Td>
                      <span className="text-sm text-slate-400">
                        —
                      </span>
                    </Td>

                    <Td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleViewStudent(
                            student.student_id
                          )
                        }
                      >
                        View →
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-slate-600">
                  No students found
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Try changing your search or filters.
                </p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Showing {filtered.length} of {totalStudents}{' '}
                students
              </p>

              <div className="flex gap-1">
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg text-xs font-medium bg-[#1e3a5f] text-white"
                >
                  1
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}