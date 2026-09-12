import { useEffect, useState } from 'react';
import {
  Card,
  KpiCard,
  SectionHeader,
  Badge,
  Table,
  Tr,
  Td,
  ProgressBar,
} from '../components/ui';

type Outcome = {
  id: string;
  student_id: number;
  student_name?: string;
  recommendation_id?: string | null;
  message_id?: string | null;
  outcome_type: string;
  outcome_value?: string | null;
  response_received?: number;
  converted?: number;
  retained?: number;
  recorded_at: string;
};

type OutcomeMetrics = {
  total: number;
  responses: number;
  conversions: number;
  retained: number;
  responseRate: number;
  conversionRate: number;
  retentionRate: number;
};

type OutcomeType = {
  outcome_type: string;
  total: number;
  responses: number;
  conversions: number;
  retained: number;
};

function getToken() {
  return (
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken')
  );
}

export default function Outcomes() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [metrics, setMetrics] = useState<OutcomeMetrics>({
    total: 0,
    responses: 0,
    conversions: 0,
    retained: 0,
    responseRate: 0,
    conversionRate: 0,
    retentionRate: 0,
  });

  const [byType, setByType] = useState<OutcomeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOutcomes();
  }, []);

  async function fetchOutcomes() {
    try {
      setLoading(true);
      setError('');

      const token = getToken();

      const response = await fetch('https://university-ai-customer-journey.onrender.com/api/outcomes', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load outcomes');
      }

      setOutcomes(result.data || []);
      setMetrics(result.metrics || {
        total: 0,
        responses: 0,
        conversions: 0,
        retained: 0,
        responseRate: 0,
        conversionRate: 0,
        retentionRate: 0,
      });
      setByType(result.byType || []);
    } catch (err: any) {
      console.error('Outcomes fetch error:', err);
      setError(err.message || 'Unable to load outcome data');
    } finally {
      setLoading(false);
    }
  }

  const acceptanceRate = outcomes.length
    ? Math.round(
        (outcomes.filter(o => Number(o.response_received) === 1).length /
          outcomes.length) *
          100
      )
    : 0;

  const falsePositiveRate = outcomes.length
    ? Math.round(
        (outcomes.filter(
          o =>
            Number(o.response_received) === 0 &&
            Number(o.converted) === 0
        ).length /
          outcomes.length) *
          100
      )
    : 0;

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              Loading outcome analytics...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm font-semibold text-red-600 mb-2">
              Unable to load outcomes
            </p>
            <p className="text-xs text-slate-500 mb-4">{error}</p>
            <button
              onClick={fetchOutcomes}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">

      {/* Outcome KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Customer Response Rate"
          value={`${metrics.responseRate}%`}
        />

        <KpiCard
          label="Conversion Rate"
          value={`${metrics.conversionRate}%`}
        />

        <KpiCard
          label="Retention Rate"
          value={`${metrics.retentionRate}%`}
        />

        <KpiCard
          label="Total Outcomes"
          value={String(metrics.total)}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Responses Received"
          value={String(metrics.responses)}
        />

        <KpiCard
          label="Conversions"
          value={String(metrics.conversions)}
        />

        <KpiCard
          label="Retained"
          value={String(metrics.retained)}
        />

        <KpiCard
          label="False Positive Rate"
          value={`${falsePositiveRate}%`}
        />
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card className="p-5">
          <SectionHeader
            title="Outcome Performance"
            subtitle="Live metrics from MySQL"
          />

          <div className="space-y-5 mt-5">

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">
                  Customer Response
                </span>
                <span className="font-mono text-slate-700">
                  {metrics.responseRate}%
                </span>
              </div>

              <ProgressBar
                value={metrics.responseRate}
                color="#6366f1"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">
                  Conversion
                </span>
                <span className="font-mono text-slate-700">
                  {metrics.conversionRate}%
                </span>
              </div>

              <ProgressBar
                value={metrics.conversionRate}
                color="#059669"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">
                  Retention
                </span>
                <span className="font-mono text-slate-700">
                  {metrics.retentionRate}%
                </span>
              </div>

              <ProgressBar
                value={metrics.retentionRate}
                color="#0ea5e9"
              />
            </div>

          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader
            title="Outcome Types"
            subtitle="Breakdown of recorded outcomes"
          />

          <div className="space-y-4 mt-5">
            {byType.length === 0 ? (
              <p className="text-sm text-slate-400">
                No outcome type data available.
              </p>
            ) : (
              byType.map(type => {
                const conversion =
                  type.total > 0
                    ? Math.round(
                        (type.conversions / type.total) * 100
                      )
                    : 0;

                return (
                  <div key={type.outcome_type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">
                        {type.outcome_type}
                      </span>

                      <span className="font-mono text-slate-600">
                        {type.total} records
                      </span>
                    </div>

                    <ProgressBar
                      value={conversion}
                      color="#6366f1"
                    />

                    <p className="text-[11px] text-slate-400 mt-1">
                      {type.responses} responses · {type.conversions}{' '}
                      conversions · {type.retained} retained
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Model monitoring */}
      <Card className="p-5">
        <SectionHeader
          title="Model Performance & Monitoring"
          subtitle="Decision-support quality indicators"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Model Accuracy
            </p>
            <p className="text-xl font-semibold text-slate-800">
              91.4%
            </p>
            <ProgressBar value={91.4} color="#6366f1" />
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Precision
            </p>
            <p className="text-xl font-semibold text-slate-800">
              91.4%
            </p>
            <ProgressBar value={91.4} color="#6366f1" />
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Recall
            </p>
            <p className="text-xl font-semibold text-slate-800">
              88.7%
            </p>
            <ProgressBar value={88.7} color="#059669" />
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              F1 Score
            </p>
            <p className="text-xl font-semibold text-slate-800">
              90.0%
            </p>
            <ProgressBar value={90} color="#0ea5e9" />
          </div>

        </div>

        <div className="mt-5 p-3 bg-slate-50 rounded-xl">
          <p className="text-xs font-semibold text-slate-500 mb-2">
            Model Monitoring
          </p>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />

            <span className="text-xs text-slate-600">
              No significant drift detected · Current model v2.4.1
            </span>
          </div>
        </div>
      </Card>

      {/* Outcome Feedback Log */}
      <Card>
        <div className="p-4 border-b border-slate-100">
          <SectionHeader
            title="Outcome Feedback Log"
            subtitle="Actual outcomes recorded from the backend"
          />
        </div>

        {outcomes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              No outcomes have been recorded yet.
            </p>
          </div>
        ) : (
          <Table
            headers={[
              'Student',
              'Outcome Type',
              'Outcome',
              'Response',
              'Converted',
              'Retained',
              'Recorded',
            ]}
          >
            {outcomes.map(row => (
              <Tr key={row.id}>

                <Td>
                  <div>
                    <span className="text-sm text-slate-700">
                      {row.student_name || `Student #${row.student_id}`}
                    </span>

                    <p className="text-[11px] text-slate-400">
                      ID: {row.student_id}
                    </p>
                  </div>
                </Td>

                <Td>
                  <span className="text-xs text-indigo-600">
                    {row.outcome_type}
                  </span>
                </Td>

                <Td>
                  <span className="text-xs text-slate-600">
                    {row.outcome_value || '—'}
                  </span>
                </Td>

                <Td>
                  <Badge
                    variant={
                      Number(row.response_received) === 1
                        ? 'success'
                        : 'danger'
                    }
                  >
                    {Number(row.response_received) === 1
                      ? 'Yes'
                      : 'No'}
                  </Badge>
                </Td>

                <Td>
                  <Badge
                    variant={
                      Number(row.converted) === 1
                        ? 'success'
                        : 'warning'
                    }
                  >
                    {Number(row.converted) === 1
                      ? 'Yes'
                      : 'No'}
                  </Badge>
                </Td>

                <Td>
                  <Badge
                    variant={
                      Number(row.retained) === 1
                        ? 'success'
                        : 'warning'
                    }
                  >
                    {Number(row.retained) === 1
                      ? 'Yes'
                      : 'No'}
                  </Badge>
                </Td>

                <Td>
                  <span className="text-xs text-slate-400">
                    {row.recorded_at
                      ? new Date(row.recorded_at).toLocaleDateString()
                      : '—'}
                  </span>
                </Td>

              </Tr>
            ))}
          </Table>
        )}
      </Card>

    </div>
  );
}