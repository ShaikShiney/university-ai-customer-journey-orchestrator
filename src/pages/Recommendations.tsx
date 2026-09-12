import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Button,
  Badge,
  ConfidenceBadge,
  Modal,
  Select,
} from '../components/ui';

const RECS = [
  {
    id: 'rec1',
    student: 'Ananya Sharma',
    studentId: 'STU-2026-0142',
    suggestion: 'Send placement workshop invitation via email.',
    reason:
      'Student has high placement interest (3 company profiles viewed), engagement rising, but has not attended any placement workshop.',
    confidence: 89,
    eligible: true,
    consent: true,
    freqOk: true,
    evidence: [
      'Placement interest detected from portal activity',
      'Workshop attendance: 0 of 3 sessions attended',
      'Engagement score: 82% (high)',
    ],
    channel: 'Email',
    programme: 'B.Tech Computer Science',
    status: 'pending',
  },
  {
    id: 'rec2',
    student: 'Priya Nair',
    studentId: 'STU-2025-0076',
    suggestion:
      'Assign dedicated academic advisor for churn risk intervention.',
    reason:
      'Churn propensity has increased to 52%. Student has 3 open tickets and engagement dropped 24% in last 14 days.',
    confidence: 93,
    eligible: true,
    consent: true,
    freqOk: true,
    evidence: [
      'Churn propensity: 52% (up from 38%)',
      'Engagement drop: -24% (14 days)',
      '3 open service tickets',
      'Last advisor meeting: >45 days ago',
    ],
    channel: 'Call',
    programme: 'MBA',
    status: 'pending',
  },
  {
    id: 'rec3',
    student: 'Sneha Rao',
    studentId: 'STU-2025-0089',
    suggestion: 'Send placement workshop invitation via SMS.',
    reason:
      'Critical placement risk. No placement portal registration. Engagement critically low.',
    confidence: 84,
    eligible: true,
    consent: false,
    freqOk: true,
    evidence: [
      'Placement readiness: 22%',
      'No portal registration',
      'Engagement: 31% (critical)',
    ],
    channel: 'SMS',
    programme: 'B.Tech Computer Science',
    status: 'blocked',
  },
  {
    id: 'rec4',
    student: 'Arjun Kumar',
    studentId: 'STU-2026-0211',
    suggestion: 'Resolve timetable clash for AI Ethics vs ML Lab.',
    reason:
      'Open ticket TKT-2026-0829 unresolved for 5 days. Timetable conflict is preventing course attendance.',
    confidence: 97,
    eligible: true,
    consent: true,
    freqOk: true,
    evidence: [
      'TKT-2026-0829 open 5 days',
      'Two modules with overlapping timeslots',
      'ML Lab attendance: 0%',
    ],
    channel: 'In-app',
    programme: 'M.Tech AI & Data Science',
    status: 'approved',
  },
];

type Decision = {
  action: string;
  reason?: string;
  reviewer: string;
  ts: string;
};

type Student = {
  id: number;
  student_id: string;
  name: string;
  email: string;
};

type Consent = {
  email_consent: number;
  sms_consent: number;
  whatsapp_consent: number;
  call_consent: number;
  marketing_consent: number;
  weekly_frequency_cap: number;
};

const API_URL = 'http://localhost:5000';

export default function Recommendations() {
  const [decisions, setDecisions] = useState<
    Record<string, Decision>
  >({});

  const [overrideModal, setOverrideModal] = useState<string | null>(
    null
  );

  const [overrideReason, setOverrideReason] = useState('');

  const [filter, setFilter] = useState('all');

  const [editModal, setEditModal] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);

  const [consents, setConsents] = useState<
    Record<string, Consent>
  >({});

  const [loadingConsent, setLoadingConsent] = useState(true);

  const [consentError, setConsentError] = useState('');

  /* =========================================================
     LOAD STUDENTS + CONSENT FROM BACKEND
  ========================================================= */

  useEffect(() => {
    const loadConsentData = async () => {
      try {
        setLoadingConsent(true);
        setConsentError('');

        const token =
          localStorage.getItem('auth_token') ||
          localStorage.getItem('authToken');

        if (!token) {
          setConsentError('Authentication token not found.');
          return;
        }

        const studentResponse = await fetch(
          `${API_URL}/api/students`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const studentJson = await studentResponse.json();

        if (!studentResponse.ok || !studentJson.success) {
          throw new Error(
            studentJson.message || 'Unable to load students'
          );
        }

        const loadedStudents: Student[] = studentJson.data || [];

        setStudents(loadedStudents);

        const consentResults: Record<string, Consent> = {};

        /*
          Match recommendation students by name because the
          recommendation demo IDs and database student IDs are
          different formats.
        */

        for (const rec of RECS) {
          const matchedStudent = loadedStudents.find(
            (student) =>
              student.name.toLowerCase() ===
              rec.student.toLowerCase()
          );

          if (!matchedStudent) {
            continue;
          }

          try {
            const consentResponse = await fetch(
              `${API_URL}/api/consent/${encodeURIComponent(
                matchedStudent.student_id
              )}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const consentJson = await consentResponse.json();

            if (
              consentResponse.ok &&
              consentJson.success &&
              consentJson.data?.preferences
            ) {
              consentResults[rec.id] =
                consentJson.data.preferences;
            }
          } catch (error) {
            console.error(
              `Consent load failed for ${rec.student}:`,
              error
            );
          }
        }

        setConsents(consentResults);
      } catch (error) {
        console.error('Consent data error:', error);

        setConsentError(
          error instanceof Error
            ? error.message
            : 'Unable to load consent data'
        );
      } finally {
        setLoadingConsent(false);
      }
    };

    loadConsentData();
  }, []);

  /* =========================================================
     CHECK CHANNEL CONSENT
  ========================================================= */

  const getChannelConsent = (
    recId: string,
    channel: string,
    fallback: boolean
  ) => {
    const consent = consents[recId];

    if (!consent) {
      return fallback;
    }

    switch (channel.toLowerCase()) {
      case 'email':
        return Boolean(consent.email_consent);

      case 'sms':
        return Boolean(consent.sms_consent);

      case 'call':
        return Boolean(consent.call_consent);

      case 'whatsapp':
        return Boolean(consent.whatsapp_consent);

      case 'in-app':
        return true;

      default:
        return fallback;
    }
  };

  /* =========================================================
     CHECK FREQUENCY CAP
  ========================================================= */

  const getFrequencyStatus = (
    recId: string,
    fallback: boolean
  ) => {
    const consent = consents[recId];

    if (!consent) {
      return fallback;
    }

    return consent.weekly_frequency_cap > 0;
  };

  /* =========================================================
     DECISION
  ========================================================= */

  const decide = (
    id: string,
    action: string,
    reason?: string
  ) => {
    setDecisions((current) => ({
      ...current,
      [id]: {
        action,
        reason,
        reviewer: 'Current User',
        ts: new Date().toLocaleString(),
      },
    }));
  };

  /* =========================================================
     FILTER
  ========================================================= */

  const filtered = useMemo(() => {
    return RECS.filter((rec) => {
      const consent = getChannelConsent(
        rec.id,
        rec.channel,
        rec.consent
      );

      if (filter === 'pending') {
        return (
          !decisions[rec.id] &&
          rec.status !== 'blocked' &&
          consent
        );
      }

      if (filter === 'approved') {
        return decisions[rec.id]?.action === 'Approved';
      }

      if (filter === 'blocked') {
        return !consent;
      }

      return true;
    });
  }, [filter, decisions, consents]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const statusCount = {
    pending: RECS.filter((rec) => {
      const consent = getChannelConsent(
        rec.id,
        rec.channel,
        rec.consent
      );

      return (
        !decisions[rec.id] &&
        rec.status !== 'blocked' &&
        consent
      );
    }).length,

    approved: Object.values(decisions).filter(
      (decision) => decision.action === 'Approved'
    ).length,

    blocked: RECS.filter((rec) => {
      return !getChannelConsent(
        rec.id,
        rec.channel,
        rec.consent
      );
    }).length,
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="p-6 space-y-5">

      {/* Header stats */}

      <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">

        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">
            {RECS.length}
          </p>
          <p className="text-xs text-slate-500">
            Total
          </p>
        </Card>

        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-amber-600">
            {statusCount.pending}
          </p>
          <p className="text-xs text-slate-500">
            Pending Review
          </p>
        </Card>

        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-emerald-600">
            {statusCount.approved}
          </p>
          <p className="text-xs text-slate-500">
            Approved
          </p>
        </Card>

        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-red-600">
            {statusCount.blocked}
          </p>
          <p className="text-xs text-slate-500">
            Consent Blocked
          </p>
        </Card>

        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-indigo-600">
            87%
          </p>
          <p className="text-xs text-slate-500">
            Avg Confidence
          </p>
        </Card>

      </div>

      {/* Backend status */}

      {loadingConsent && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
          Loading live consent and frequency preferences...
        </div>
      )}

      {consentError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          Consent data could not be loaded:
          {' '}
          {consentError}
        </div>
      )}

      {!loadingConsent &&
        !consentError &&
        Object.keys(consents).length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
            ✓ Live consent preferences loaded from the backend.
          </div>
        )}

      {/* Filter */}

      <div className="flex gap-2 flex-wrap">

        {[
          ['all', 'All'],
          ['pending', 'Pending'],
          ['approved', 'Approved'],
          ['blocked', 'Consent Blocked'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-[#1e3a5f] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}

      </div>

      {/* Recommendations */}

      <div className="space-y-4">

        {filtered.map((rec) => {

          const decision = decisions[rec.id];

          const liveConsent = getChannelConsent(
            rec.id,
            rec.channel,
            rec.consent
          );

          const liveFrequency = getFrequencyStatus(
            rec.id,
            rec.freqOk
          );

          const recommendationBlocked =
            !liveConsent || !liveFrequency;

          return (
            <Card
              key={rec.id}
              className={`p-5 ${
                recommendationBlocked
                  ? 'border-red-200 bg-red-50/20'
                  : decision?.action === 'Approved'
                  ? 'border-emerald-200'
                  : decision?.action === 'Rejected'
                  ? 'border-slate-200 opacity-70'
                  : ''
              }`}
            >

              <div className="flex items-start gap-4">

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    recommendationBlocked
                      ? 'bg-red-100'
                      : decision?.action === 'Approved'
                      ? 'bg-emerald-100'
                      : 'bg-indigo-100'
                  }`}
                >
                  {recommendationBlocked
                    ? '⛔'
                    : decision?.action === 'Approved'
                    ? '✅'
                    : '⚡'}
                </div>

                <div className="flex-1">

                  <div className="flex items-start justify-between gap-2 mb-2">

                    <div>
                      <p className="text-xs text-slate-400">
                        {rec.student} · {rec.studentId} ·{' '}
                        {rec.programme}
                      </p>

                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        AI Suggestion: {rec.suggestion}
                      </p>
                    </div>

                    <ConfidenceBadge value={rec.confidence} />

                  </div>

                  {/* Eligibility / consent / frequency */}

                  <div className="flex gap-3 text-xs mb-3 flex-wrap">

                    <span
                      className={`flex items-center gap-1 ${
                        rec.eligible
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {rec.eligible ? '✓' : '✕'} Eligible
                    </span>

                    <span
                      className={`flex items-center gap-1 ${
                        liveConsent
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {liveConsent ? '✓' : '✕'}{' '}
                      {rec.channel} consent
                    </span>

                    <span
                      className={`flex items-center gap-1 ${
                        liveFrequency
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {liveFrequency ? '✓' : '⚠'}{' '}
                      Frequency cap OK
                    </span>

                    <Badge variant="muted">
                      Channel: {rec.channel}
                    </Badge>

                  </div>

                  <p className="text-sm text-slate-600 mb-3">
                    {rec.reason}
                  </p>

                  {/* Evidence */}

                  <div className="mb-4">

                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Evidence
                    </p>

                    <ul className="space-y-1">

                      {rec.evidence.map((evidence) => (
                        <li
                          key={evidence}
                          className="text-xs text-slate-600 flex items-center gap-1"
                        >
                          <span className="text-indigo-400">
                            •
                          </span>
                          {evidence}
                        </li>
                      ))}

                    </ul>

                  </div>

                  {/* Blocked */}

                  {recommendationBlocked ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">

                      <strong>
                        Recommendation blocked
                      </strong>

                      {' — '}

                      {!liveConsent
                        ? `${rec.channel.toLowerCase()} communication consent is unavailable for this student.`
                        : 'The weekly communication frequency cap does not allow this outreach.'}

                      {' '}
                      No outreach can be sent until the applicable consent/frequency requirement is satisfied.

                    </div>
                  ) : decision ? (

                    /* Decision */

                    <div
                      className={`rounded-xl p-4 border ${
                        decision.action === 'Approved'
                          ? 'bg-emerald-50 border-emerald-200'
                          : decision.action === 'Rejected'
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >

                      <div className="flex items-center gap-2 mb-1">

                        <Badge
                          variant={
                            decision.action === 'Approved'
                              ? 'success'
                              : decision.action === 'Rejected'
                              ? 'muted'
                              : 'warning'
                          }
                        >
                          {decision.action}
                        </Badge>

                        <span className="text-xs text-slate-500">
                          — {decision.reviewer} ·{' '}
                          {decision.ts}
                        </span>

                      </div>

                      {decision.reason && (
                        <p className="text-xs text-slate-600 mt-1">
                          Reason: {decision.reason}
                        </p>
                      )}

                      <p className="text-xs text-slate-400 mt-1">
                        Model: Placement NBA v2.4.1 · This decision is recorded in the audit log.
                      </p>

                    </div>

                  ) : (

                    /* Review buttons */

                    <div className="flex gap-2 flex-wrap">

                      <Button
                        size="sm"
                        variant="success"
                        onClick={() =>
                          decide(rec.id, 'Approved')
                        }
                      >
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          decide(rec.id, 'Rejected')
                        }
                      >
                        Reject
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setEditModal(rec.id)
                        }
                      >
                        Correct / Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setOverrideModal(rec.id)
                        }
                      >
                        Override
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          decide(rec.id, 'Deferred')
                        }
                      >
                        Defer
                      </Button>

                    </div>
                  )}

                </div>

              </div>

            </Card>
          );
        })}

      </div>

      {/* =====================================================
          OVERRIDE MODAL
      ===================================================== */}

      <Modal
        open={!!overrideModal}
        onClose={() => {
          setOverrideModal(null);
          setOverrideReason('');
        }}
        title="Override AI Recommendation"
      >

        <div className="space-y-4">

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            ⚠️ You are overriding an AI recommendation. This decision will be recorded with your name, timestamp, and reason in the audit log.
          </div>

          <div>

            <label className="text-sm font-medium text-slate-700 block mb-1">
              Reason for override{' '}
              <span className="text-red-500">*</span>
            </label>

            <textarea
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-400 transition-all resize-none"
              rows={3}
              value={overrideReason}
              onChange={(e) =>
                setOverrideReason(e.target.value)
              }
              placeholder="Explain why you are overriding this recommendation…"
            />

          </div>

          <div className="flex gap-2">

            <Button
              variant="danger"
              disabled={!overrideReason.trim()}
              onClick={() => {
                if (overrideModal) {
                  decide(
                    overrideModal,
                    'Overridden',
                    overrideReason
                  );
                }

                setOverrideModal(null);
                setOverrideReason('');
              }}
            >
              Confirm Override
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                setOverrideModal(null);
                setOverrideReason('');
              }}
            >
              Cancel
            </Button>

          </div>

        </div>

      </Modal>

      {/* =====================================================
          EDIT / CORRECT MODAL
      ===================================================== */}

      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title="Correct AI Recommendation"
      >

        <div className="space-y-4">

          <div>

            <label className="text-sm font-medium text-slate-700 block mb-1">
              Edit recommendation text
            </label>

            <textarea
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 transition-all resize-none"
              rows={3}
              defaultValue={
                RECS.find(
                  (rec) => rec.id === editModal
                )?.suggestion
              }
            />

          </div>

          <Select
            label="Corrected channel"
            value="email"
            onChange={() => {}}
            options={[
              {
                value: 'email',
                label: 'Email',
              },
              {
                value: 'sms',
                label: 'SMS',
              },
              {
                value: 'call',
                label: 'Call',
              },
            ]}
          />

          <div>

            <label className="text-sm font-medium text-slate-700 block mb-1">
              Correction reason
            </label>

            <textarea
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 transition-all resize-none"
              rows={2}
              placeholder="Describe what was corrected and why…"
            />

          </div>

          <div className="flex gap-2">

            <Button
              variant="primary"
              onClick={() => {
                if (editModal) {
                  decide(
                    editModal,
                    'Approved (Corrected)'
                  );
                }

                setEditModal(null);
              }}
            >
              Save & Approve
            </Button>

            <Button
              variant="secondary"
              onClick={() =>
                setEditModal(null)
              }
            >
              Cancel
            </Button>

          </div>

        </div>

      </Modal>

    </div>
  );
}