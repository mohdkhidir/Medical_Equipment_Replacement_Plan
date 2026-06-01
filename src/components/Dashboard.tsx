import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { AlertTriangle, Clock, Eye, CheckCircle, DollarSign, Wrench, TrendingUp } from 'lucide-react';
import type { Equipment, ReplacementPriority } from '../types/equipment';
import { calculateScore, getPriorityBgClass } from '../utils/scoringEngine';
import { PRIORITY_LABELS, CATEGORY_LABELS } from '../types/equipment';

interface DashboardProps {
  equipment: Equipment[];
  onViewDetail: (id: string) => void;
}

const PRIORITY_COLORS: Record<ReplacementPriority, string> = {
  immediate: '#ef4444',
  plan: '#f97316',
  monitor: '#eab308',
  continue: '#22c55e',
};

export function Dashboard({ equipment, onViewDetail }: DashboardProps) {
  const scores = useMemo(() => equipment.map(e => ({ equipment: e, result: calculateScore(e) })), [equipment]);

  const priorityCounts = useMemo(() => {
    const counts: Record<ReplacementPriority, number> = { immediate: 0, plan: 0, monitor: 0, continue: 0 };
    scores.forEach(({ result }) => counts[result.priority]++);
    return counts;
  }, [scores]);

  const urgentItems = useMemo(() =>
    scores
      .filter(s => s.result.priority === 'immediate' || s.result.priority === 'plan')
      .sort((a, b) => b.result.totalScore - a.result.totalScore)
      .slice(0, 6),
    [scores],
  );

  const totalReplacementBudget = useMemo(() =>
    scores
      .filter(s => s.result.priority === 'immediate' || s.result.priority === 'plan')
      .reduce((sum, s) => sum + s.equipment.replacementCost, 0),
    [scores],
  );

  const avgScore = useMemo(() =>
    scores.length ? Math.round(scores.reduce((s, { result }) => s + result.totalScore, 0) / scores.length * 10) / 10 : 0,
    [scores],
  );

  const pieData = ([
    { name: 'Immediate', value: priorityCounts.immediate, color: '#ef4444', priority: 'immediate' as ReplacementPriority },
    { name: 'Plan', value: priorityCounts.plan, color: '#f97316', priority: 'plan' as ReplacementPriority },
    { name: 'Monitor', value: priorityCounts.monitor, color: '#eab308', priority: 'monitor' as ReplacementPriority },
    { name: 'Continue', value: priorityCounts.continue, color: '#22c55e', priority: 'continue' as ReplacementPriority },
  ] as { name: string; value: number; color: string; priority: ReplacementPriority }[]).filter(d => d.value > 0);

  const categoryData = useMemo(() => {
    const byCategory: Record<string, number[]> = {};
    scores.forEach(({ equipment: e, result }) => {
      const cat = CATEGORY_LABELS[e.category];
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(result.totalScore);
    });
    return Object.entries(byCategory).map(([name, vals]) => ({
      name: name.length > 12 ? name.slice(0, 12) + '…' : name,
      avgScore: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      count: vals.length,
    })).sort((a, b) => b.avgScore - a.avgScore);
  }, [scores]);

  const avgFactors = useMemo(() => {
    if (!scores.length) return [];
    const sum = scores.reduce((acc, { result }) => ({
      Age: acc.Age + result.ageScore,
      Maintenance: acc.Maintenance + result.maintenanceScore,
      Reliability: acc.Reliability + result.reliabilityScore,
      Technology: acc.Technology + result.techGapScore,
      Materials: acc.Materials + result.materialScore,
      Safety: acc.Safety + result.safetyScore,
    }), { Age: 0, Maintenance: 0, Reliability: 0, Technology: 0, Materials: 0, Safety: 0 });
    const n = scores.length;
    return Object.entries(sum).map(([key, val]) => ({ subject: key, value: Math.round(val / n) }));
  }, [scores]);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<AlertTriangle className="text-red-500" size={22} />}
          label="Immediate Replacement"
          value={priorityCounts.immediate}
          sub={`${equipment.length} total assets`}
          color="border-red-300"
        />
        <KpiCard
          icon={<Clock className="text-orange-500" size={22} />}
          label="Plan Replacement"
          value={priorityCounts.plan}
          sub="Within 12 months"
          color="border-orange-300"
        />
        <KpiCard
          icon={<Eye className="text-yellow-500" size={22} />}
          label="Monitor"
          value={priorityCounts.monitor}
          sub="Review in 6 months"
          color="border-yellow-300"
        />
        <KpiCard
          icon={<CheckCircle className="text-green-500" size={22} />}
          label="Continue Service"
          value={priorityCounts.continue}
          sub="No action required"
          color="border-green-300"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={<DollarSign className="text-blue-500" size={22} />}
          label="Est. Replacement Budget"
          value={`$${(totalReplacementBudget / 1e6).toFixed(2)}M`}
          sub="Immediate + Plan priority"
          color="border-blue-300"
        />
        <KpiCard
          icon={<TrendingUp className="text-purple-500" size={22} />}
          label="Fleet Avg. Risk Score"
          value={avgScore}
          sub={avgScore >= 60 ? 'High – action needed' : avgScore >= 40 ? 'Moderate – monitor' : 'Low – fleet in good shape'}
          color="border-purple-300"
        />
        <KpiCard
          icon={<Wrench className="text-slate-500" size={22} />}
          label="Total Assets Tracked"
          value={equipment.length}
          sub={`${Object.values(CATEGORY_LABELS).filter((_, i) => scores.some(s => s.equipment.category === Object.keys(CATEGORY_LABELS)[i])).length} categories`}
          color="border-slate-300"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Distribution Pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                {pieData.map((entry) => (
                  <Cell key={entry.priority} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [val, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map(d => (
              <span key={d.priority} className="flex items-center gap-1 text-xs text-slate-600">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: d.color }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* Avg Risk by Category */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="font-semibold text-slate-700 mb-4">Average Risk Score by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val) => [`${val}`, 'Avg Score']}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
                {categoryData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.avgScore >= 80 ? '#ef4444' : entry.avgScore >= 60 ? '#f97316' : entry.avgScore >= 40 ? '#eab308' : '#22c55e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factor Radar and Urgent List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Radar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-1">Fleet Average – Risk Factors</h3>
          <p className="text-xs text-slate-500 mb-3">Higher = more risk</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={avgFactors}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar name="Fleet Avg" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
              <Tooltip formatter={(val) => [`${val}`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Urgent Action List */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="font-semibold text-slate-700 mb-4">Urgent Action Items</h3>
          {urgentItems.length === 0 ? (
            <p className="text-slate-500 text-sm">No urgent items. Fleet in good condition.</p>
          ) : (
            <div className="space-y-3">
              {urgentItems.map(({ equipment: e, result }) => (
                <button
                  key={e.id}
                  onClick={() => onViewDetail(e.id)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: PRIORITY_COLORS[result.priority] }}
                  >
                    {Math.round(result.totalScore)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm truncate">{e.name}</div>
                    <div className="text-xs text-slate-500">{e.department} · {e.manufacturer} {e.model}</div>
                    <div className="text-xs text-slate-500">Driver: {result.primaryDriver}</div>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded border ${getPriorityBgClass(result.priority)}`}>
                    {PRIORITY_LABELS[result.priority]}
                  </span>
                  {result.safetyOverride && (
                    <span title={result.overrideReason}>
                      <AlertTriangle className="text-red-500 shrink-0" size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Benchmark Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
        <strong>Scoring methodology:</strong> Total Replacement Score (TRS) = weighted composite of Age/Utilization (25%), Maintenance Cost & Downtime (20%), Reliability/MTBF (20%), Technology Gap (15%), Materials Condition (10%), Safety & Compliance (10%). Thresholds per ASHE Equipment Lifecycle Guidelines, ECRI Institute PM Benchmarks, and FDA Device Safety requirements. Priority overrides apply for active recalls, FDA safety alerts, and JCAHO non-compliance.
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className={`bg-white rounded-xl border-2 ${color} p-4 shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}
