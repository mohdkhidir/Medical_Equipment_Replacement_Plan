import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Cpu, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import type { Equipment, EquipmentCategory } from '../types/equipment';
import { calculateScore } from '../utils/scoringEngine';
import { CATEGORY_LABELS, PARTS_LABELS } from '../types/equipment';
import { BENCHMARKS } from '../data/benchmarks';

interface TechGapAnalysisProps {
  equipment: Equipment[];
  onViewDetail: (id: string) => void;
}

export function TechGapAnalysis({ equipment, onViewDetail }: TechGapAnalysisProps) {
  const scored = useMemo(() => equipment.map(e => ({ equipment: e, result: calculateScore(e) })), [equipment]);

  const techData = useMemo(() =>
    scored.map(({ equipment: e, result }) => ({
      id: e.id,
      name: e.name.length > 24 ? e.name.slice(0, 24) + '…' : e.name,
      fullName: e.name,
      category: CATEGORY_LABELS[e.category],
      department: e.department,
      equipmentGen: e.equipmentGeneration,
      marketGen: e.currentMarketGeneration,
      gap: result.generationGap,
      techScore: result.techGapScore,
      partsAvailability: e.partsAvailability,
      softwareSupported: e.softwareSupported,
      refreshCycle: BENCHMARKS[e.category].technologyCycleYears,
    }))
    .sort((a, b) => b.gap - a.gap || b.techScore - a.techScore),
    [scored],
  );

  const categoryGapData = useMemo(() => {
    const byCategory: Record<string, number[]> = {};
    techData.forEach(d => {
      if (!byCategory[d.category]) byCategory[d.category] = [];
      byCategory[d.category].push(d.gap);
    });
    return Object.entries(byCategory).map(([name, gaps]) => ({
      name: name.length > 14 ? name.slice(0, 14) + '…' : name,
      avgGap: Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length * 10) / 10,
      maxGap: Math.max(...gaps),
      count: gaps.length,
    })).sort((a, b) => b.avgGap - a.avgGap);
  }, [techData]);

  const partsBreakdown = useMemo(() => {
    const counts = { available: 0, limited: 0, scarce: 0, unavailable: 0 };
    equipment.forEach(e => counts[e.partsAvailability]++);
    return [
      { label: 'Available', count: counts.available, color: '#22c55e' },
      { label: 'Limited', count: counts.limited, color: '#eab308' },
      { label: 'Scarce', count: counts.scarce, color: '#f97316' },
      { label: 'Unavailable', count: counts.unavailable, color: '#ef4444' },
    ];
  }, [equipment]);

  const softwareStats = useMemo(() => ({
    supported: equipment.filter(e => e.softwareSupported).length,
    unsupported: equipment.filter(e => !e.softwareSupported).length,
  }), [equipment]);

  const gapColors: Record<number, string> = { 0: '#22c55e', 1: '#eab308', 2: '#f97316', 3: '#ef4444', 4: '#b91c1c' };
  const getGapColor = (gap: number) => gapColors[Math.min(gap, 4)] || '#b91c1c';

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Cpu className="text-purple-500" size={22} />
          Technology Gap Analysis
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Compares each asset's technology generation against current market generation per ECRI and ASHE lifecycle benchmarks.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(gap => {
          const count = techData.filter(d => d.gap === gap).length;
          const moreCount = gap === 3 ? techData.filter(d => d.gap >= 3).length : count;
          return (
            <div key={gap} className="bg-white rounded-xl border-2 p-4 shadow-sm" style={{ borderColor: getGapColor(gap) }}>
              <div className="text-2xl font-bold" style={{ color: getGapColor(gap) }}>
                {gap === 3 ? `${moreCount}` : count}
              </div>
              <div className="text-sm font-medium text-slate-700 mt-1">
                {gap === 0 ? 'Current Gen' : gap === 3 ? '3+ Gens Behind' : `${gap} Gen${gap > 1 ? 's' : ''} Behind`}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {gap === 0 ? 'No technology gap' : gap === 1 ? 'Minor gap – upgrade path' : gap === 2 ? 'Significant gap' : 'Critical obsolescence'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Gap Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Average Technology Gap by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryGapData} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} label={{ value: 'Avg Gen Gap', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
              <Tooltip formatter={(val) => [`${val} generations`, 'Avg Gap']} />
              <Bar dataKey="avgGap" radius={[4, 4, 0, 0]}>
                {categoryGapData.map((entry) => (
                  <Cell key={entry.name} fill={getGapColor(Math.round(entry.avgGap))} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Parts Availability + Software Support */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div>
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Package size={16} className="text-slate-500" />
              Parts Availability
            </h3>
            <div className="space-y-2">
              {partsBreakdown.map(p => (
                <div key={p.label} className="flex items-center gap-3">
                  <span className="text-xs w-20 text-slate-600 shrink-0">{p.label}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all flex items-center pl-2"
                      style={{ width: equipment.length ? `${(p.count / equipment.length) * 100}%` : '0%', background: p.color }}
                    >
                      {p.count > 0 && <span className="text-white text-xs font-bold">{p.count}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{equipment.length ? Math.round((p.count / equipment.length) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
              <Cpu size={14} className="text-slate-500" />
              Software / Firmware Support
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                <span className="text-sm text-slate-700"><strong>{softwareStats.supported}</strong> Active</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={18} />
                <span className="text-sm text-slate-700"><strong>{softwareStats.unsupported}</strong> Discontinued</span>
              </div>
            </div>
            {softwareStats.unsupported > 0 && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 rounded p-2">
                {softwareStats.unsupported} assets running discontinued software. This creates cybersecurity risks and integration compatibility issues.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Technology Timeline Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-700">Technology Generation Matrix</h3>
          <p className="text-xs text-slate-500 mt-0.5">Each row shows the equipment's generation vs. current market. Color indicates gap severity.</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600">Equipment</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Equipment Gen</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Market Gen</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Gap</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Generation Timeline</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Parts</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Software</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Tech Score</th>
            </tr>
          </thead>
          <tbody>
            {techData.map(d => (
              <tr
                key={d.id}
                className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onViewDetail(d.id)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 text-sm">{d.fullName}</div>
                  <div className="text-xs text-slate-500">{d.department}</div>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{d.category}</td>
                <td className="px-4 py-3 text-center">
                  <span className="font-mono font-semibold text-slate-700">Gen {d.equipmentGen}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-mono font-semibold text-slate-700">Gen {d.marketGen}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${getGapColor(d.gap)}22`, color: getGapColor(d.gap) }}>
                    {d.gap === 0 ? '✓ Current' : `−${d.gap} gen`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <GenTimeline equipmentGen={d.equipmentGen} marketGen={d.marketGen} />
                </td>
                <td className="px-4 py-3 text-center">
                  <PartsChip availability={d.partsAvailability} />
                </td>
                <td className="px-4 py-3 text-center">
                  {d.softwareSupported
                    ? <CheckCircle className="text-green-500 mx-auto" size={16} />
                    : <span title="Software discontinued"><AlertTriangle className="text-red-500 mx-auto" size={16} /></span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono font-bold text-sm" style={{ color: getGapColor(d.gap) }}>
                    {Math.round(d.techScore)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
        <div><strong>Technology Gap Scoring:</strong> Each generation behind current market = 25 points (max 100). Parts availability and software support contribute additional risk.</div>
        <div><strong>Benchmark Refresh Cycles:</strong> Based on ECRI Institute and ASHE equipment lifecycle recommendations by category.</div>
        <div><strong>Action:</strong> Equipment ≥2 generations behind should be evaluated for upgrade or replacement in the capital planning cycle.</div>
      </div>
    </div>
  );
}

function GenTimeline({ equipmentGen, marketGen }: { equipmentGen: number; marketGen: number }) {
  const maxGen = Math.max(marketGen, 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxGen }, (_, i) => {
        const gen = i + 1;
        const isCurrent = gen <= equipmentGen;
        const isMarket = gen === marketGen;
        const isGap = gen > equipmentGen && gen <= marketGen;
        return (
          <div
            key={gen}
            title={`Gen ${gen}${isMarket ? ' (current market)' : ''}${isCurrent ? ' (equipment)' : ''}`}
            className={`h-4 rounded-sm transition-all ${
              isCurrent ? 'opacity-100' : isGap ? 'opacity-40' : 'opacity-10'
            }`}
            style={{
              width: 18,
              background: isCurrent ? '#3b82f6' : isGap ? '#f97316' : '#94a3b8',
              border: isMarket ? '2px solid #1d4ed8' : '1px solid transparent',
            }}
          />
        );
      })}
    </div>
  );
}

function PartsChip({ availability }: { availability: Equipment['partsAvailability'] }) {
  const cfg = {
    available: { label: 'Available', cls: 'bg-green-100 text-green-700' },
    limited: { label: 'Limited', cls: 'bg-yellow-100 text-yellow-700' },
    scarce: { label: 'Scarce', cls: 'bg-orange-100 text-orange-700' },
    unavailable: { label: 'N/A', cls: 'bg-red-100 text-red-700' },
  }[availability];
  return <span className={`text-xs px-1.5 py-0.5 rounded ${cfg.cls} font-medium`}>{cfg.label}</span>;
}
