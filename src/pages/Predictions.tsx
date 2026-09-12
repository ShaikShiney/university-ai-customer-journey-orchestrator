import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  KpiCard,
  AiBanner,
  ConfidenceBadge,
  Badge,
  Button,
  Select,
  SectionHeader,
  ProgressBar,
  Skeleton,
} from '../components/ui';

const API_URL = 'https://university-ai-customer-journey.onrender.com';

type Student = {
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
};

type Interaction = {
  id: number;
  student_id: number;
  channel?: string;
  interaction_type?: string;
  type?: string;
  subject?: string;
  message?: string;
  content?: string;
  sentiment?: string;
  intent?: string;
  created_at?: string;
  occurred_at?: string;
};

type Prediction = {
  intent: string;
  sentiment: string;
  churn: number;
  conversion: number;
  confidence: number;
  recommendationConfidence: number;
  action: string;
  explanation?: string;
  modelVersion?: string;
  aiRunId?: string;
  evidence: {
    label: string;
    value: string;
    weight: number;
    impact: 'positive' | 'negative';
  }[];
};

function getToken(): string | null {
  return (
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')
  );
}

function authHeaders(): HeadersInit {
  const token = getToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/*
 * IMPORTANT:
 * Backend response is:
 *
 * {
 *   success: true,
 *   data: {
 *     student: {...},
 *     prediction: {
 *       churn_risk: ...,
 *       conversion_propensity: ...,
 *       ...
 *     }
 *   }
 * }
 *
 * So we must read raw.data.prediction first.
 */
function normalisePrediction(raw: any): Prediction {
  const data =
    raw?.data?.prediction ||
    raw?.prediction ||
    raw?.data ||
    raw ||
    {};

  const evidence = Array.isArray(data.evidence)
    ? data.evidence.map((item: any, index: number) => {
        if (typeof item === 'string') {
          return {
            label: `Observable input ${index + 1}`,
            value: item,
            weight: 50,
            impact: 'positive' as const,
          };
        }

        return {
          label: String(
            item.label ||
              item.name ||
              item.factor ||
              'Observable input'
          ),
          value: String(
            item.value ??
              item.description ??
              'Available'
          ),
          weight: Number(
            item.weight ??
              item.score ??
              item.importance ??
              50
          ),
          impact:
            String(item.impact || '').toLowerCase() ===
            'negative'
              ? ('negative' as const)
              : ('positive' as const),
        };
      })
    : [];

  return {
    intent: String(
      data.intent ||
        data.detected_intent ||
        data.detectedIntent ||
        'Student Support'
    ),

    sentiment: String(
      data.sentiment ||
        data.detected_sentiment ||
        data.detectedSentiment ||
        'Neutral'
    ),

    /*
     * BACKEND USES churn_risk
     */
    churn: Number(
      data.churn ??
        data.churn_risk ??
        data.churnRisk ??
        data.churn_probability ??
        data.churnProbability ??
        data.churn_score ??
        0
    ),

    /*
     * BACKEND USES conversion_propensity
     */
    conversion: Number(
      data.conversion ??
        data.conversion_propensity ??
        data.conversionPropensity ??
        data.conversion_probability ??
        data.conversionProbability ??
        0
    ),

    confidence: Number(
      data.confidence ??
        data.intent_confidence ??
        data.intentConfidence ??
        0
    ),

    recommendationConfidence: Number(
      data.recommendationConfidence ??
        data.recommendation_confidence ??
        data.nba_confidence ??
        data.nbaConfidence ??
        data.confidence ??
        0
    ),

    action: String(
      data.action ||
        data.next_best_action ||
        data.nextBestAction ||
        'Review student support needs'
    ),

    explanation: data.explanation
      ? String(data.explanation)
      : undefined,

    modelVersion:
      data.modelVersion
        ? String(data.modelVersion)
        : data.model_version
        ? String(data.model_version)
        : undefined,

    aiRunId: raw?.data?.ai_run_id
      ? String(raw.data.ai_run_id)
      : raw?.ai_run_id
      ? String(raw.ai_run_id)
      : undefined,

    evidence,
  };
}

export default function Predictions() {
  const [students, setStudents] = useState<Student[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [selectedId, setSelectedId] = useState('');

  const [loading, setLoading] = useState(true);
  const [predictionLoading, setPredictionLoading] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [predictionError, setPredictionError] = useState('');

  const [prediction, setPrediction] =
    useState<Prediction | null>(null);
  const [decisionStatus, setDecisionStatus] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);

  const loadStudents = async () => {
    const token = getToken();

    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setError('');

      const [
        studentsResponse,
        interactionsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/students`, {
          headers: authHeaders(),
        }),

        fetch(`${API_URL}/api/interactions`, {
          headers: authHeaders(),
        }),
      ]);

      if (studentsResponse.status === 401) {
        throw new Error('Authentication required');
      }

      if (!studentsResponse.ok) {
        throw new Error('Unable to load student data');
      }

      const studentsJson =
        await studentsResponse.json();

      const interactionsJson =
        interactionsResponse.ok
          ? await interactionsResponse.json()
          : { data: [] };

      const studentRows: Student[] =
        Array.isArray(studentsJson?.data)
          ? studentsJson.data
          : [];

      const interactionRows: Interaction[] =
        Array.isArray(interactionsJson?.data)
          ? interactionsJson.data
          : [];

      setStudents(studentRows);
      setInteractions(interactionRows);

      if (studentRows.length > 0) {
        setSelectedId((current) => {
          if (current) return current;

          return String(studentRows[0].id);
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load prediction data'
      );
    } finally {
      setLoading(false);
    }
  };

  const generatePrediction = async (
    studentId: string
  ) => {
    if (!studentId) {
      setPrediction(null);
      return;
    }

    const token = getToken();

    if (!token) {
      setPredictionError('Authentication required');
      return;
    }

    try {
      setPredictionLoading(true);
      setPredictionError('');

      const response = await fetch(
        `${API_URL}/api/ai/predict/${studentId}`,
        {
          method: 'GET',
          headers: authHeaders(),
        }
      );

      const json = await response.json();

      if (
        !response.ok ||
        json?.success === false
      ) {
        throw new Error(
          json?.error ||
            json?.message ||
            'Failed to generate AI prediction'
        );
      }

      setPrediction(
        normalisePrediction(json)
      );
      setDecisionStatus('');
    } catch (err) {
      setPrediction(null);

      setPredictionError(
        err instanceof Error
          ? err.message
          : 'Failed to generate AI prediction'
      );
    } finally {
      setPredictionLoading(false);
    }
  };

  const recordDecision = async (decision: 'APPROVED' | 'REJECTED' | 'OVERRIDDEN') => {
    if (!prediction?.aiRunId) {
      setDecisionStatus('This prediction has no AI run ID, so the decision cannot be saved.');
      return;
    }

    const reason =
      decision === 'APPROVED'
        ? ''
        : window.prompt(
            decision === 'OVERRIDDEN'
              ? 'Enter the mandatory override reason:'
              : 'Enter the mandatory rejection reason:'
          )?.trim() || '';

    if (decision !== 'APPROVED' && !reason) {
      setDecisionStatus('A reason is required for this decision.');
      return;
    }

    try {
      setDecisionLoading(true);
      setDecisionStatus('');

      const response = await fetch(`${API_URL}/api/ai/approvals`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ai_run_id: prediction.aiRunId,
          decision,
          reason: reason || null,
        }),
      });

      const json = await response.json();

      if (!response.ok || json?.success === false) {
        throw new Error(
          json?.message ||
            json?.error ||
            'Failed to save AI decision'
        );
      }

      setDecisionStatus(
        decision === 'APPROVED'
          ? 'Recommendation approved and recorded for audit.'
          : decision === 'OVERRIDDEN'
          ? `Recommendation overridden and recorded. Reason: ${reason}`
          : `Recommendation rejected and recorded. Reason: ${reason}`
      );
    } catch (err) {
      setDecisionStatus(
        err instanceof Error
          ? err.message
          : 'Failed to save AI decision'
      );
    } finally {
      setDecisionLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedId) {
      generatePrediction(selectedId);
    }
  }, [selectedId]);

  const refresh = async () => {
    setRefreshing(true);

    await loadStudents();

    if (selectedId) {
      await generatePrediction(selectedId);
    }

    setRefreshing(false);
  };

  const selected = useMemo(
    () =>
      students.find(
        (student) =>
          String(student.id) ===
          String(selectedId)
      ) || null,
    [students, selectedId]
  );

  const selectedInteractions = useMemo(() => {
    if (!selected) return [];

    return interactions
      .filter(
        (item) =>
          Number(item.student_id) ===
          Number(selected.id)
      )
      .slice(0, 5);
  }, [selected, interactions]);

  const updatedAt =
    new Date().toLocaleString();

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          AI Predictions
        </h1>

        <p className="text-sm text-slate-400 mt-1">
          Intent, sentiment, churn and conversion propensity
        </p>
      </div>

      {/* AI decision support */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
        <p className="text-sm text-indigo-700">
          <span className="font-bold">
            ⚡ AI decision support:
          </span>{' '}
          Predictions are generated by the backend AI service
          using observable student data. Authorized users retain
          control over every decision.
        </p>
      </div>

      {/* Student selector */}
      <Card className="p-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">

            <Select
              value={selectedId}
              onChange={(value) => {
                setSelectedId(value);
                setPrediction(null);
                setPredictionError('');
              }}
              options={students.map((student) => ({
                value: String(student.id),
                label: `${student.name} — ${student.student_id}`,
              }))}
              className="w-80"
            />

            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={
                refreshing ||
                predictionLoading
              }
            >
              {refreshing
                ? '↻ Refreshing...'
                : '↻ Refresh Predictions'}
            </Button>

            <span className="text-xs text-slate-400">
              Model: Gemini AI · Backend decision support
            </span>

          </div>
        )}
      </Card>

      {/* General error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600">
            {error}
          </p>

          <p className="text-xs text-red-400 mt-1">
            Please sign in again if your session has expired.
          </p>
        </div>
      )}

      {/* AI error */}
      {predictionError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-amber-700">
            AI prediction unavailable
          </p>

          <p className="text-xs text-amber-600 mt-1">
            {predictionError}
          </p>

          <p className="text-xs text-amber-500 mt-1">
            The student data is available, but the AI service
            could not generate a prediction right now.
          </p>
        </div>
      )}

      {/* No students */}
      {!loading &&
        !error &&
        students.length === 0 && (
          <Card className="p-10 text-center">
            <p className="font-semibold text-slate-700">
              No student prediction data available.
            </p>

            <p className="text-sm text-slate-400 mt-1">
              Add student records to generate predictions.
            </p>
          </Card>
        )}

      {/* Loading prediction */}
      {predictionLoading && selected && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

          {[1, 2, 3, 4, 5].map((item) => (
            <Card
              key={item}
              className="p-5"
            >
              <Skeleton className="h-8 mb-2" />
              <Skeleton className="h-4" />
            </Card>
          ))}

        </div>
      )}

      {/* Prediction content */}
      {selected &&
        prediction &&
        !predictionLoading && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

              <KpiCard
                label="Intent Confidence"
                value={`${prediction.confidence}%`}
              />

              <KpiCard
                label="Sentiment"
                value={prediction.sentiment}
                sublabel="Detected by AI"
              />

              <KpiCard
                label="Churn Propensity"
                value={`${prediction.churn}%`}
              />

              <KpiCard
                label="Conversion Propensity"
                value={`${prediction.conversion}%`}
              />

              <KpiCard
                label="Rec. Confidence"
                value={`${prediction.recommendationConfidence}%`}
                sublabel="Next-best action"
              />

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Main prediction */}
              <Card className="p-5 lg:col-span-2">

                <SectionHeader
                  title="Prediction Detail"
                  subtitle={`${selected.name} · ${selected.student_id}`}
                  actions={
                    <Badge variant="ai">
                      Live AI Prediction
                    </Badge>
                  }
                />

                <div className="space-y-5">

                  {/* Student context */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                      <div>
                        <p className="text-xs text-slate-400">
                          Programme
                        </p>

                        <p className="text-sm font-semibold text-slate-700">
                          {selected.programme}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Journey Stage
                        </p>

                        <p className="text-sm font-semibold text-slate-700">
                          {selected.journey_stage}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Risk Level
                        </p>

                        <p className="text-sm font-semibold text-slate-700">
                          {selected.risk_level}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Data Sources
                        </p>

                        <p className="text-sm font-semibold text-slate-700">
                          Profile + interactions
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Intent */}
                  <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">

                    <div className="flex-1">

                      <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-1">
                        Detected Intent
                      </p>

                      <p className="text-xl font-bold text-indigo-900">
                        {prediction.intent}
                      </p>

                    </div>

                    <ConfidenceBadge
                      value={prediction.confidence}
                    />

                  </div>

                  {/* Propensity */}
                  <div className="grid grid-cols-2 gap-4">

                    {/* Churn */}
                    <div className="p-4 border border-slate-200 rounded-xl">

                      <p className="text-xs text-slate-500 mb-2">
                        Churn Probability
                      </p>

                      <p
                        className={`text-3xl font-bold mb-2 ${
                          prediction.churn > 50
                            ? 'text-red-600'
                            : prediction.churn > 25
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {prediction.churn}%
                      </p>

                      <ProgressBar
                        value={prediction.churn}
                        color={
                          prediction.churn > 50
                            ? '#dc2626'
                            : prediction.churn > 25
                            ? '#d97706'
                            : '#059669'
                        }
                      />

                      <p className="text-xs text-slate-400 mt-2">
                        {prediction.churn > 50
                          ? 'High risk — immediate intervention needed'
                          : prediction.churn > 25
                          ? 'Moderate risk — monitor closely'
                          : 'Low risk — stable'}
                      </p>

                    </div>

                    {/* Conversion */}
                    <div className="p-4 border border-slate-200 rounded-xl">

                      <p className="text-xs text-slate-500 mb-2">
                        Conversion Probability
                      </p>

                      <p
                        className={`text-3xl font-bold mb-2 ${
                          prediction.conversion > 70
                            ? 'text-emerald-600'
                            : prediction.conversion > 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {prediction.conversion}%
                      </p>

                      <ProgressBar
                        value={prediction.conversion}
                        color={
                          prediction.conversion > 70
                            ? '#059669'
                            : prediction.conversion > 50
                            ? '#d97706'
                            : '#dc2626'
                        }
                      />

                      <p className="text-xs text-slate-400 mt-2">
                        {prediction.conversion > 70
                          ? 'Good conversion likelihood'
                          : 'Needs engagement intervention'}
                      </p>

                    </div>

                  </div>

                  {/* Evidence */}
                  <div>

                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Contributing Observable Inputs
                    </p>

                    {prediction.evidence.length > 0 ? (
                      <div className="space-y-2">

                        {prediction.evidence.map(
                          (input, index) => (
                            <div
                              key={`${input.label}-${index}`}
                              className="flex items-center gap-3"
                            >

                              <div
                                className={`w-1.5 h-8 rounded-full shrink-0 ${
                                  input.impact ===
                                  'positive'
                                    ? 'bg-emerald-400'
                                    : 'bg-red-400'
                                }`}
                              />

                              <div className="flex-1">

                                <div className="flex items-center justify-between text-xs mb-0.5">

                                  <span className="text-slate-700 font-medium">
                                    {input.label}
                                  </span>

                                  <span className="text-slate-500">
                                    {input.value}
                                  </span>

                                </div>

                                <ProgressBar
                                  value={Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      input.weight
                                    )
                                  )}
                                  color={
                                    input.impact ===
                                    'positive'
                                      ? '#059669'
                                      : '#dc2626'
                                  }
                                />

                              </div>

                              <span className="text-xs font-mono text-slate-400 w-8 text-right">
                                {input.weight}
                              </span>

                            </div>
                          )
                        )}

                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500">
                          Evidence details were not returned by the AI service.
                        </p>
                      </div>
                    )}

                  </div>

                  {/* Recent interactions */}
                  <div>

                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Recent Interaction Evidence
                    </p>

                    {selectedInteractions.length > 0 ? (
                      <div className="space-y-2">

                        {selectedInteractions.map(
                          (interaction) => (
                            <div
                              key={interaction.id}
                              className="p-3 bg-slate-50 border border-slate-100 rounded-xl"
                            >

                              <div className="flex items-center justify-between gap-3">

                                <p className="text-xs font-semibold text-slate-700">
                                  {interaction.subject ||
                                    interaction.interaction_type ||
                                    interaction.type ||
                                    'Student interaction'}
                                </p>

                                <span className="text-[10px] text-slate-400">
                                  {interaction.created_at ||
                                  interaction.occurred_at
                                    ? new Date(
                                        interaction.created_at ||
                                          interaction.occurred_at ||
                                          ''
                                      ).toLocaleString()
                                    : 'Timestamp unavailable'}
                                </span>

                              </div>

                              <p className="text-xs text-slate-500 mt-1">
                                {interaction.message ||
                                  interaction.content ||
                                  'Interaction recorded in student history.'}
                              </p>

                            </div>
                          )
                        )}

                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500">
                          No recent interaction records are available.
                        </p>
                      </div>
                    )}

                  </div>

                  {/* Explanation */}
                  {prediction.explanation && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">

                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        AI Explanation
                      </p>

                      <p className="text-sm text-slate-600">
                        {prediction.explanation}
                      </p>

                    </div>
                  )}

                  {/* Next best action */}
                  <AiBanner>

                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                      Recommended Next-Best Action
                    </p>

                    <p className="text-sm font-bold text-indigo-900">
                      "{prediction.action}."
                    </p>

                    <div className="mt-2">
                      <ConfidenceBadge
                        value={
                          prediction.recommendationConfidence
                        }
                      />
                    </div>

                    <div className="flex gap-2 mt-3">

                      <Button
                        size="sm"
                        variant="success"
                        disabled={decisionLoading}
                        onClick={() => recordDecision('APPROVED')}
                      >
                        {decisionLoading ? 'Saving...' : 'Approve'}
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={decisionLoading}
                        onClick={() => recordDecision('OVERRIDDEN')}
                      >
                        Override
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={decisionLoading}
                        onClick={() => recordDecision('REJECTED')}
                      >
                        Reject
                      </Button>

                    </div>

                    {decisionStatus && (
                      <p className="text-xs text-indigo-700 mt-3 font-medium">
                        {decisionStatus}
                      </p>
                    )}

                    <p className="text-[10px] text-indigo-400 mt-3">
                      Decision support only · Authorized users retain control · AI decision is stored for audit
                    </p>

                  </AiBanner>

                </div>
              </Card>

              {/* History / metadata */}
              <Card className="p-5">

                <SectionHeader
                  title="Prediction History"
                  subtitle="Current AI data snapshot"
                />

                <div className="space-y-3">

                  <div className="p-4 border border-slate-100 rounded-xl">

                    <div className="flex items-center justify-between mb-2">

                      <span className="text-xs font-mono text-slate-400">
                        Current AI run
                      </span>

                      <ConfidenceBadge
                        value={prediction.confidence}
                      />

                    </div>

                    <p className="text-sm font-semibold text-slate-700">
                      {prediction.intent}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Churn: {prediction.churn}%
                    </p>

                    <p className="text-xs text-slate-500">
                      Conversion: {prediction.conversion}%
                    </p>

                    <p className="text-xs text-slate-500">
                      Sentiment: {prediction.sentiment}
                    </p>

                  </div>

                  <div className="p-4 border border-slate-100 rounded-xl">

                    <p className="text-xs text-slate-400">
                      Student
                    </p>

                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {selected.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {selected.student_id}
                    </p>

                  </div>

                  <div className="p-4 border border-slate-100 rounded-xl">

                    <p className="text-xs text-slate-400">
                      Interaction records
                    </p>

                    <p className="text-2xl font-bold text-slate-800 mt-1">
                      {selectedInteractions.length}
                    </p>

                    <p className="text-xs text-slate-500">
                      available for this prediction
                    </p>

                  </div>

                </div>

                {/* Confidence note */}
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">

                  <p className="text-xs font-semibold text-amber-700 mb-1">
                    Confidence note
                  </p>

                  <p className="text-xs text-amber-600">
                    Predictions below 70% confidence should be treated
                    as indicative only. Human review is required before
                    action.
                  </p>

                </div>

                {/* Model metadata */}
                <div className="mt-4 text-xs text-slate-400 border-t border-slate-100 pt-3 space-y-1">

                  <p>
                    Model:{' '}
                    {prediction.modelVersion ||
                      'Gemini AI backend'}
                  </p>

                  <p>
                    Updated: {updatedAt}
                  </p>

                  <p>
                    Data source: MySQL student profile + interactions
                  </p>

                  <p>
                    AI source: Backend Gemini service
                  </p>

                  <p>
                    Decision support only — authorized users retain
                    control
                  </p>

                </div>

              </Card>

            </div>
          </>
        )}

      {/* No prediction yet */}
      {selected &&
        !prediction &&
        !predictionLoading &&
        !predictionError && (
          <Card className="p-10 text-center">
            <p className="text-sm text-slate-400">
              Select a student to generate an AI prediction.
            </p>
          </Card>
        )}

    </div>
  );
}
    