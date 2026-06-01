import { useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';
import {
  ArrowLeft, AlertTriangle, CheckCircle, Clock, Activity,
  Wrench, Zap, Shield, Package, Cpu, Layers,
} from 'lucide-react';
import type { Equipment } from '../types/equipment';
import { calculateScore, getScoreColor, getPriorityBgClass } from '../utils/scoringEngine';
import { PRIORITY_LABELS, CATEGORY_LABELS, DEGRADATION_LABELS, PARTS_LABELS } from '../types/equipment';
import { BENCHMARKS } from '../data/benchmarks';

interface EquipmentDetailProps {
  equipment: Equipment;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export function EquipmentDetail({ equipment, onBack, onEdit }: EquipmentDetailProps) {
  const result = useMemo(() => calculateScore(equipment), [equipment]);
  const benchmark = BENCHMARKS[equipment.category];

  const factorData = [
    { name: 'Age & Utilization', score: result.ageScore, weight: '25%', icon: <Clock size={14} />, color: getScoreColor(result.ageScore) },
    { name: 'Maintenance', score: result.maintenanceScore, weight: '20%', icon: <Wrench size={14} />, color: getScoreColor(result.maintenanceScore) },
    { name: 'Reliability', score: result.reliabilityScore, weight: '20%', icon: <Activity size={14} />, color: getScoreColor(result.reliabilityScore) },
    { name: 'Technology Gap', score: result.techGapScore, weight: '15%', icon: <Cpu size={14} />, color: getScoreColor(result.techGapScore) },
    { name: 'Materials', score: result.materialScore, weight: '10%', icon: <Layers size={14} />, color: getScoreColor(result.materialScore) },
    { name: 'Safety', score: result.safetyScore, weight: '10%', icon: <Shield size={14} />, color: getScoreColor(result.safetyScore) },
  ];

  const radarData = factorData.map(f => ({ subject: f.name.split(' ')[0], value: f.score }));

  const scoreColor = getScoreColor(result.totalScore);
  const scoreCircumference = 251.2;
  const scoreDashOffset = scoreCircumference - (result.totalScore / 100) * scoreCircumference;

  const currentAge = result.currentAge;
  const maintenancePct = Math.round((equipment.annualMaintenanceCost / equipment.originalCost) * 100 * 10) / 10;

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm transition-colors">
          <ArrowLeft size={16} /> Back to Registry
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800">{equipment.name}</h1>
          <p className="text-sm text-slate-500">{equipment.manufacturer} {equipment.model} · {equipment.serialNumber} · {equipment.department}</p>
        </div>
        <button
          onClick={() => onEdit(equipment.id)}
          className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Edit Equipment
        </button>
      </div>

      {/* Safety Banners */}
      {equipment.hasActiveRecall && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-bold text-red-800">Active Recall In Effect</div>
            <div className="text-sm text-red-700 mt-1">{equipment.recallDetails}</div>
          </div>
        </div>
      )}
      {equipment.hasFDASafetyAlert && (
        <div className="bg-orange-50 border-2 border-orange-400 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-bold text-orange-800">FDA Safety Alert</div>
            <div className="text-sm text-orange-700 mt-1">{equipment.fdaAlertDetails}</div>
          </div>
        </div>
      )}
      {!equipment.isJCAHOCompliant && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="text-yellow-700 shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-bold text-yellow-800">JCAHO Non-Compliance</div>
            <div className="text-sm text-yellow-700 mt-1">Last inspection: {equipment.lastInspectionDate} – Result: <strong>{equipment.lastInspectionResult.toUpperCase()}</strong></div>
          </div>
        </div>
      )}

      {/* Score + Factor breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TRS Gauge */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center">
          <h3 className="font-semibold text-slate-700 mb-4">Total Replacement Score</h3>
          <div className="relative w-44 h-44">
            <svg width="176" height="176" viewBox="0 0 176 176">
              <circle cx="88" cy="88" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle
                cx="88" cy="88" r="40"
                fill="none"
                stroke={scoreColor}
                strokeWidth="10"
                strokeDasharray={scoreCircumference}
                strokeDashoffset={scoreDashOffset}
                strokeLinecap="round"
                transform="rotate(-90 88 88)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: scoreColor }}>{Math.round(result.totalScore)}</span>
              <span className="text-xs text-slate-500">out of 100</span>
            </div>
          </div>
          <div className={`mt-4 px-4 py-2 rounded-lg border text-sm font-semibold ${getPriorityBgClass(result.priority)}`}>
            {PRIORITY_LABELS[result.priority]}
          </div>
          {result.safetyOverride && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle size={12} /> Safety override: {result.overrideReason}
            </div>
          )}
          <div className="mt-4 text-center">
            <div className="text-xs text-slate-500">Primary Driver</div>
            <div className="text-sm font-medium text-slate-700">{result.primaryDriver}</div>
          </div>
          <div className="mt-3 text-center">
            <div className="text-xs text-slate-500">Est. Remaining Service Life</div>
            <div className="text-sm font-semibold text-slate-700">
              {result.estimatedRemainingMonths > 0 ? `~${result.estimatedRemainingMonths} months` : 'Past end-of-life'}
            </div>
          </div>
        </div>

        {/* Factor Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Factor Scores</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={factorData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(val) => [`${val}`, 'Score (0-100)']} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {factorData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-2">Risk Profile Radar</h3>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar name="Score" dataKey="value" stroke={scoreColor} fill={scoreColor} fillOpacity={0.25} />
              <Tooltip formatter={(val) => [`${val}`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factor Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Age Card */}
        <FactorCard
          icon={<Clock className="text-blue-500" size={18} />}
          title="Age & Utilization"
          score={result.ageScore}
          weight="25%"
        >
          <MetricRow label="Current Age" value={`${currentAge.toFixed(1)} years`} />
          <MetricRow label="Expected Lifespan" value={`${equipment.expectedLifespan} years (${benchmark.label})`} />
          <MetricRow label="Age Ratio" value={`${Math.round(result.ageRatio * 100)}%`} alert={result.ageRatio > 1.0} />
          <MetricRow label="Annual Operating Hours" value={`${equipment.annualOperatingHours.toLocaleString()} hrs`} />
          <MetricRow label="Category Standard" value={`${equipment.standardAnnualHours.toLocaleString()} hrs`} />
          <MetricRow label="Effective Age (utilization-adjusted)" value={`${result.effectiveAge.toFixed(1)} years`} />
        </FactorCard>

        {/* Maintenance Card */}
        <FactorCard
          icon={<Wrench className="text-orange-500" size={18} />}
          title="Maintenance Cost & Downtime"
          score={result.maintenanceScore}
          weight="20%"
        >
          <MetricRow label="Original Cost" value={`$${equipment.originalCost.toLocaleString()}`} />
          <MetricRow label="Annual Maintenance Cost" value={`$${equipment.annualMaintenanceCost.toLocaleString()}`} />
          <MetricRow
            label="Maintenance / OC Ratio"
            value={`${maintenancePct}%`}
            alert={equipment.annualMaintenanceCost / equipment.originalCost > benchmark.maintenanceCostWarning}
          />
          <MetricRow label="ECRI Advisory Threshold" value={`${Math.round(benchmark.maintenanceCostWarning * 100)}%`} />
          <MetricRow label="ECRI Critical Threshold" value={`${Math.round(benchmark.maintenanceCostCritical * 100)}%`} />
          <MetricRow
            label="Annual Downtime"
            value={`${equipment.annualDowntimeHours} hrs (${Math.round(result.downtimeRatio * 100)}%)`}
            alert={equipment.annualDowntimeHours > 500}
          />
        </FactorCard>

        {/* Reliability Card */}
        <FactorCard
          icon={<Activity className="text-green-500" size={18} />}
          title="Reliability"
          score={result.reliabilityScore}
          weight="20%"
        >
          <MetricRow label="Failures Last 12 Months" value={equipment.failuresLastYear.toString()} alert={equipment.failuresLastYear >= 6} />
          <MetricRow label="Actual MTBF" value={`${equipment.actualMTBF.toLocaleString()} hrs`} />
          <MetricRow label="ECRI Benchmark MTBF" value={`${benchmark.benchmarkMTBF.toLocaleString()} hrs`} />
          <MetricRow
            label="MTBF Ratio (benchmark/actual)"
            value={`${result.mtbfRatio.toFixed(2)}×`}
            alert={result.mtbfRatio > 1.5}
          />
          <MetricRow label="Last Maintenance" value={equipment.lastMaintenanceDate} />
          <MetricRow label="Last Inspection Result" value={equipment.lastInspectionResult.toUpperCase()} alert={equipment.lastInspectionResult === 'fail'} />
        </FactorCard>

        {/* Technology Gap Card */}
        <FactorCard
          icon={<Cpu className="text-purple-500" size={18} />}
          title="Technology Gap"
          score={result.techGapScore}
          weight="15%"
        >
          <MetricRow label="Equipment Generation" value={`Gen ${equipment.equipmentGeneration}`} />
          <MetricRow
            label="Current Market Generation"
            value={`Gen ${equipment.currentMarketGeneration}`}
            alert={result.generationGap >= 2}
          />
          <MetricRow label="Generation Gap" value={`${result.generationGap} generation${result.generationGap !== 1 ? 's' : ''} behind`} alert={result.generationGap >= 2} />
          <MetricRow label="Technology Refresh Cycle" value={`${benchmark.technologyCycleYears} years`} />
          <MetricRow label="Parts Availability" value={PARTS_LABELS[equipment.partsAvailability]} alert={equipment.partsAvailability === 'scarce' || equipment.partsAvailability === 'unavailable'} />
          <MetricRow label="Software/Firmware Support" value={equipment.softwareSupported ? 'Active' : 'Discontinued'} alert={!equipment.softwareSupported} />
        </FactorCard>

        {/* Materials Card */}
        <FactorCard
          icon={<Layers className="text-yellow-600" size={18} />}
          title="Materials Condition"
          score={result.materialScore}
          weight="10%"
        >
          <MetricRow
            label="Degradation Level"
            value={`${result.materialScore === 0 ? '0' : equipment.degradationLevel}/4 – ${DEGRADATION_LABELS[equipment.degradationLevel]}`}
            alert={equipment.degradationLevel >= 2}
          />
          <div className="mt-2">
            <div className="text-xs text-slate-500 font-medium mb-1">ASHE Physical Condition Scale</div>
            <div className="flex gap-1">
              {([0, 1, 2, 3, 4] as const).map(level => (
                <div
                  key={level}
                  className={`flex-1 h-2 rounded ${level <= equipment.degradationLevel ? 'opacity-100' : 'opacity-20'}`}
                  style={{ background: level === 0 ? '#22c55e' : level === 1 ? '#84cc16' : level === 2 ? '#eab308' : level === 3 ? '#f97316' : '#ef4444' }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>None</span><span>Critical</span>
            </div>
          </div>
          {equipment.degradationNotes && (
            <div className="mt-3 text-xs text-slate-600 bg-slate-50 rounded p-2 italic">
              "{equipment.degradationNotes}"
            </div>
          )}
        </FactorCard>

        {/* Safety Card */}
        <FactorCard
          icon={<Shield className="text-red-500" size={18} />}
          title="Safety & Compliance"
          score={result.safetyScore}
          weight="10%"
        >
          <StatusRow label="Active Recall" active={equipment.hasActiveRecall} />
          <StatusRow label="FDA Safety Alert" active={equipment.hasFDASafetyAlert} />
          <StatusRow label="JCAHO Compliant" active={equipment.isJCAHOCompliant} invertAlert />
          <MetricRow label="Last Inspection Date" value={equipment.lastInspectionDate} />
          <MetricRow
            label="Inspection Result"
            value={equipment.lastInspectionResult.toUpperCase()}
            alert={equipment.lastInspectionResult === 'fail' || equipment.lastInspectionResult === 'conditional'}
          />
          <div className="mt-2 text-xs text-slate-500">
            Ref: {result.benchmarkSource.split(';')[0]}
          </div>
        </FactorCard>
      </div>

      {/* Decision Tree */}
      <DecisionTreeView equipment={equipment} result={result} />

      {/* Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Zap className="text-yellow-500" size={18} />
          Recommendations
        </h3>
        <ul className="space-y-2">
          {result.recommendations.map((rec, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700">
              <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Maintenance History */}
      {equipment.maintenanceHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Package className="text-slate-500" size={18} />
            Maintenance History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Type</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Description</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">Cost</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">Down (hrs)</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Technician</th>
                </tr>
              </thead>
              <tbody>
                {equipment.maintenanceHistory.map(r => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{r.date}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        r.type === 'corrective' ? 'bg-red-50 text-red-700 border-red-200' :
                        r.type === 'preventive' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>{r.type}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{r.description}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700">${r.cost.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700">{r.hoursDown}</td>
                    <td className="px-3 py-2 text-slate-600">{r.technician}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={3} className="px-3 py-2 font-medium text-slate-600">Total</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">
                    ${equipment.maintenanceHistory.reduce((s, r) => s + r.cost, 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">
                    {equipment.maintenanceHistory.reduce((s, r) => s + r.hoursDown, 0)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FactorCard({ icon, title, score, weight, children }: {
  icon: React.ReactNode;
  title: string;
  score: number;
  weight: string;
  children: React.ReactNode;
}) {
  const color = getScoreColor(score);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-slate-700 text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">weight {weight}</span>
          <span className="text-lg font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color, transition: 'width 0.8s ease' }} />
      </div>
      <div className="space-y-1.5 text-xs">{children}</div>
    </div>
  );
}

function MetricRow({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`flex justify-between gap-2 ${alert ? 'text-red-700 font-medium' : 'text-slate-600'}`}>
      <span className="shrink-0">{label}</span>
      <span className={`text-right ${alert ? 'text-red-700' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}

function StatusRow({ label, active, invertAlert }: { label: string; active: boolean; invertAlert?: boolean }) {
  const isAlert = invertAlert ? !active : active;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-600">{label}</span>
      <span className={`flex items-center gap-1 font-medium ${isAlert ? 'text-red-600' : 'text-green-600'}`}>
        {isAlert ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
        {active ? 'Yes' : 'No'}
      </span>
    </div>
  );
}

import type { ScoringResult } from '../types/equipment';

function DecisionTreeView({ equipment, result }: { equipment: Equipment; result: ScoringResult }) {
  const nodes = [
    {
      id: 1,
      question: 'Active Recall or Class I Safety Issue?',
      answer: equipment.hasActiveRecall ? 'YES' : 'NO',
      triggered: equipment.hasActiveRecall,
      outcome: equipment.hasActiveRecall ? 'IMMEDIATE REPLACEMENT – Safety override' : null,
    },
    {
      id: 2,
      question: 'FDA Safety Alert with elevated risk (score ≥ 50)?',
      answer: equipment.hasFDASafetyAlert ? `YES (score: ${Math.round(result.totalScore)})` : 'NO',
      triggered: equipment.hasFDASafetyAlert && result.totalScore >= 50,
      outcome: (equipment.hasFDASafetyAlert && result.totalScore >= 50) ? 'IMMEDIATE REPLACEMENT – FDA safety override' : null,
    },
    {
      id: 3,
      question: 'JCAHO Non-compliant with risk score ≥ 65?',
      answer: !equipment.isJCAHOCompliant ? `YES (score: ${Math.round(result.totalScore)})` : 'NO',
      triggered: !equipment.isJCAHOCompliant && result.totalScore >= 65,
      outcome: (!equipment.isJCAHOCompliant && result.totalScore >= 65) ? 'IMMEDIATE REPLACEMENT – Compliance override' : null,
    },
    {
      id: 4,
      question: `Total Replacement Score ≥ 80?`,
      answer: `Score: ${Math.round(result.totalScore)} → ${result.totalScore >= 80 ? 'YES' : 'NO'}`,
      triggered: result.totalScore >= 80 && !result.safetyOverride,
      outcome: (result.totalScore >= 80 && !result.safetyOverride) ? 'IMMEDIATE REPLACEMENT – High composite risk' : null,
    },
    {
      id: 5,
      question: `Score ≥ 60? (Plan Replacement)`,
      answer: `Score: ${Math.round(result.totalScore)} → ${result.totalScore >= 60 ? 'YES' : 'NO'}`,
      triggered: result.priority === 'plan',
      outcome: result.priority === 'plan' ? 'PLAN REPLACEMENT within 12 months' : null,
    },
    {
      id: 6,
      question: `Score ≥ 40? (Monitor)`,
      answer: `Score: ${Math.round(result.totalScore)} → ${result.totalScore >= 40 ? 'YES' : 'NO'}`,
      triggered: result.priority === 'monitor',
      outcome: result.priority === 'monitor' ? 'MONITOR – Increase PM frequency; review in 6 months' : null,
    },
    {
      id: 7,
      question: 'Score < 40 – Continue Service',
      answer: `Score: ${Math.round(result.totalScore)}`,
      triggered: result.priority === 'continue',
      outcome: result.priority === 'continue' ? 'CONTINUE SERVICE – Maintain PM schedule' : null,
    },
  ];

  const activeNode = nodes.find(n => n.outcome !== null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-semibold text-slate-700 mb-4">Decision Tree – Replacement Logic</h3>
      <div className="space-y-2">
        {nodes.map((node, i) => {
          const isActive = node.triggered;
          const isPast = activeNode && node.id > (activeNode.id);
          return (
            <div key={node.id} className={`flex gap-3 items-start p-3 rounded-lg border transition-all ${
              isActive ? 'border-blue-400 bg-blue-50' : isPast ? 'border-slate-100 bg-slate-50 opacity-40' : 'border-slate-200'
            }`}>
              <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>{node.id}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700">{node.question}</div>
                <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-700 font-semibold' : 'text-slate-500'}`}>
                  → {node.answer}
                </div>
              </div>
              {node.outcome && (
                <div className={`shrink-0 text-xs px-2 py-1 rounded font-semibold ${getPriorityBgClass(result.priority)} border`}>
                  {node.outcome.split('–')[0].trim()}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <strong>Reference:</strong> {result.benchmarkSource}
      </div>
    </div>
  );
}
