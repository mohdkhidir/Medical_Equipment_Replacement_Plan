import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { FileText, DollarSign, AlertTriangle, Calendar, Printer } from 'lucide-react';
import type { Equipment, ReplacementPriority } from '../types/equipment';
import { calculateScore, getPriorityBgClass } from '../utils/scoringEngine';
import { PRIORITY_LABELS, CATEGORY_LABELS } from '../types/equipment';

const PRIORITY_ORDER: ReplacementPriority[] = ['immediate', 'plan', 'monitor', 'continue'];
const PRIORITY_COLORS: Record<ReplacementPriority, string> = {
  immediate: '#ef4444',
  plan: '#f97316',
  monitor: '#eab308',
  continue: '#22c55e',
};

interface ReportViewProps {
  equipment: Equipment[];
  onViewDetail: (id: string) => void;
}

export function ReportView({ equipment, onViewDetail }: ReportViewProps) {
  const scored = useMemo(() =>
    equipment
      .map(e => ({ equipment: e, result: calculateScore(e) }))
      .sort((a, b) => {
        const po = PRIORITY_ORDER.indexOf(a.result.priority) - PRIORITY_ORDER.indexOf(b.result.priority);
        if (po !== 0) return po;
        return b.result.totalScore - a.result.totalScore;
      }),
    [equipment],
  );

  const immediate = scored.filter(s => s.result.priority === 'immediate');
  const plan = scored.filter(s => s.result.priority === 'plan');
  const monitor = scored.filter(s => s.result.priority === 'monitor');

  const immediateCost = immediate.reduce((s, x) => s + x.equipment.replacementCost, 0);
  const planCost = plan.reduce((s, x) => s + x.equipment.replacementCost, 0);
  const totalActionCost = immediateCost + planCost;

  const currentYear = new Date().getFullYear();

  const yearlyPlan = useMemo(() => {
    const years: { year: number; items: typeof scored; cost: number }[] = [
      { year: currentYear, items: immediate, cost: immediateCost },
      { year: currentYear + 1, items: plan, cost: planCost },
      { year: currentYear + 2, items: monitor.slice(0, Math.ceil(monitor.length / 2)), cost: monitor.slice(0, Math.ceil(monitor.length / 2)).reduce((s, x) => s + x.equipment.replacementCost, 0) },
      { year: currentYear + 3, items: monitor.slice(Math.ceil(monitor.length / 2)), cost: monitor.slice(Math.ceil(monitor.length / 2)).reduce((s, x) => s + x.equipment.replacementCost, 0) },
    ];
    return years;
  }, [scored, immediate, plan, monitor, immediateCost, planCost, currentYear]);

  const budgetChartData = yearlyPlan.map(y => ({
    year: y.year.toString(),
    cost: Math.round(y.cost / 1000),
    items: y.items.length,
  }));

  const priorityPieData = PRIORITY_ORDER
    .map(p => ({ name: PRIORITY_LABELS[p].replace('Replacement', '').trim(), value: scored.filter(s => s.result.priority === p).length, color: PRIORITY_COLORS[p] }))
    .filter(d => d.value > 0);

  const totalFleetValue = equipment.reduce((s, e) => s + e.replacementCost, 0);
  const avgAge = scored.length ? scored.reduce((s, x) => s + x.result.currentAge, 0) / scored.length : 0;

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" size={22} />
            Annual Equipment Replacement Report
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Fiscal Year {currentYear} – Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
          <Printer size={16} /> Print Report
        </button>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Executive Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Total Assets" value={equipment.length} sub="assets tracked" />
          <SummaryCard label="Require Action" value={immediate.length + plan.length} sub="immediate + plan" highlight />
          <SummaryCard label="Fleet Avg Age" value={`${avgAge.toFixed(1)} yr`} sub="years in service" />
          <SummaryCard label="Total Fleet Value" value={`$${(totalFleetValue / 1e6).toFixed(1)}M`} sub="replacement cost" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700 bg-slate-50 rounded-lg p-4">
          <div>
            <strong>Critical Findings ({currentYear}):</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
              {immediate.length > 0 && <li>{immediate.length} assets require immediate replacement (Total Replacement Score ≥80 or safety override)</li>}
              {equipment.filter(e => e.hasActiveRecall).length > 0 && <li>{equipment.filter(e => e.hasActiveRecall).length} assets subject to active manufacturer recall</li>}
              {equipment.filter(e => e.hasFDASafetyAlert).length > 0 && <li>{equipment.filter(e => e.hasFDASafetyAlert).length} assets with active FDA safety alerts</li>}
              {equipment.filter(e => !e.isJCAHOCompliant).length > 0 && <li>{equipment.filter(e => !e.isJCAHOCompliant).length} assets failing JCAHO compliance inspection</li>}
              {scored.filter(s => s.result.ageRatio > 1.0).length > 0 && <li>{scored.filter(s => s.result.ageRatio > 1.0).length} assets past expected lifespan</li>}
            </ul>
          </div>
          <div>
            <strong>Capital Requirements:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
              <li>Emergency / unplanned budget: <strong>${immediateCost.toLocaleString()}</strong></li>
              <li>Planned FY{currentYear + 1} budget: <strong>${planCost.toLocaleString()}</strong></li>
              <li>Total 2-year action budget: <strong>${totalActionCost.toLocaleString()}</strong></li>
              <li>4-year capital plan total: <strong>${yearlyPlan.reduce((s, y) => s + y.cost, 0).toLocaleString()}</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-blue-500" />
            4-Year Capital Budget Projection ($000s)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={budgetChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => [`$${(val as number)}K`, 'Budget']} />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]} fill="#3b82f6">
                {budgetChartData.map((entry, i) => (
                  <Cell key={i} fill={i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-slate-500 justify-center">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> {currentYear} Emergency</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> {currentYear + 1} Planned</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> {currentYear + 2}+ Monitor</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Fleet Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={priorityPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} fontSize={11}>
                {priorityPieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Replacement Plan Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <Calendar className="text-blue-500" size={18} />
          <h3 className="font-semibold text-slate-700">Equipment Replacement Plan – All Assets</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600">#</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Equipment</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">TRS</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Priority</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Primary Driver</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Replacement Cost</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Target Year</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Flags</th>
            </tr>
          </thead>
          <tbody>
            {scored.map(({ equipment: e, result }, i) => {
              const targetYear = result.priority === 'immediate' ? currentYear
                : result.priority === 'plan' ? currentYear + 1
                : result.priority === 'monitor' ? currentYear + 2
                : currentYear + 4;
              return (
                <tr
                  key={e.id}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onViewDetail(e.id)}
                >
                  <td className="px-4 py-3 text-slate-500 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{e.name}</div>
                    <div className="text-xs text-slate-500">{e.manufacturer} {e.model} · {e.department}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{CATEGORY_LABELS[e.category]}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-bold text-sm" style={{ color: PRIORITY_COLORS[result.priority] }}>
                      {Math.round(result.totalScore)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded border ${getPriorityBgClass(result.priority)}`}>
                      {PRIORITY_LABELS[result.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{result.primaryDriver}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">${e.replacementCost.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${result.priority === 'immediate' ? 'text-red-600' : result.priority === 'plan' ? 'text-orange-600' : 'text-slate-600'}`}>
                      FY{targetYear}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {e.hasActiveRecall && <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">Recall</span>}
                      {e.hasFDASafetyAlert && <span className="text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded">FDA</span>}
                      {!e.isJCAHOCompliant && <span className="text-xs bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded">JCAHO</span>}
                      {result.safetyOverride && <AlertTriangle className="text-red-500" size={13} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-100">
              <td colSpan={6} className="px-4 py-3 font-semibold text-slate-700">Total Capital Required (Immediate + Plan)</td>
              <td className="px-4 py-3 text-right font-bold font-mono text-slate-900">${totalActionCost.toLocaleString()}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Methodology */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-xs text-slate-600 space-y-2">
        <h3 className="font-semibold text-slate-800 text-sm">Scoring Methodology & References</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Total Replacement Score (TRS):</strong> Weighted composite of 6 factors.</p>
            <ul className="mt-1 space-y-0.5 list-disc list-inside">
              <li>Age & Utilization: 25% – ASHE Equipment Lifecycle Guidelines</li>
              <li>Maintenance Cost/Downtime: 20% – ECRI Institute PM Benchmarks (advisory &gt;15%, critical &gt;25%)</li>
              <li>Reliability/MTBF: 20% – ECRI MTBF benchmarks by device class</li>
              <li>Technology Gap: 15% – Generation gap vs. current market; obsolescence indicators</li>
              <li>Materials Condition: 10% – ASHE Physical Condition Index (PCI)</li>
              <li>Safety & Compliance: 10% – FDA recall/alert status; JCAHO accreditation standards</li>
            </ul>
          </div>
          <div>
            <p><strong>Priority Thresholds:</strong></p>
            <ul className="mt-1 space-y-0.5 list-disc list-inside">
              <li>Immediate (≥80): Emergency procurement; 0–3 months</li>
              <li>Plan (60–79): Capital budget next cycle; 3–12 months</li>
              <li>Monitor (40–59): Increase PM; reassess in 6 months; 12–24 months</li>
              <li>Continue (&lt;40): Maintain PM schedule; next annual review</li>
            </ul>
            <p className="mt-2"><strong>Safety Overrides:</strong> Active FDA/manufacturer recall, FDA safety alert (score ≥50), or JCAHO non-compliance (score ≥65) automatically elevate priority to Immediate regardless of TRS.</p>
            <p className="mt-2 text-slate-400">Reference standards: ASHE 2023, ECRI Institute, FDA CFR 820, JCAHO EC.02.04.01, AAMI ST79, CAP accreditation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, highlight }: { label: string; value: string | number; sub: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-4 ${highlight ? 'bg-red-50 border-2 border-red-200' : 'bg-slate-50 border border-slate-200'}`}>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${highlight ? 'text-red-600' : 'text-slate-800'}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
