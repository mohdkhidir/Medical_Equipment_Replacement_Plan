import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Eye, Edit, AlertTriangle, Filter } from 'lucide-react';
import type { Equipment, EquipmentCategory, ReplacementPriority } from '../types/equipment';
import { calculateScore, getPriorityBgClass } from '../utils/scoringEngine';
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../types/equipment';

type SortKey = 'name' | 'score' | 'age' | 'category' | 'department' | 'priority';

interface EquipmentListProps {
  equipment: Equipment[];
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
}

export function EquipmentList({ equipment, onViewDetail, onEdit }: EquipmentListProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ReplacementPriority | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const rows = useMemo(() =>
    equipment.map(e => ({ equipment: e, result: calculateScore(e) })),
    [equipment],
  );

  const filtered = useMemo(() => {
    return rows
      .filter(({ equipment: e, result }) => {
        const q = search.toLowerCase();
        const matchSearch = !q || [e.name, e.manufacturer, e.model, e.department, e.serialNumber, e.assetTag]
          .some(f => f.toLowerCase().includes(q));
        const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
        const matchPriority = priorityFilter === 'all' || result.priority === priorityFilter;
        return matchSearch && matchCategory && matchPriority;
      })
      .sort((a, b) => {
        let av: number | string = 0;
        let bv: number | string = 0;
        switch (sortKey) {
          case 'score': av = a.result.totalScore; bv = b.result.totalScore; break;
          case 'age': av = a.result.currentAge; bv = b.result.currentAge; break;
          case 'name': av = a.equipment.name; bv = b.equipment.name; break;
          case 'category': av = a.equipment.category; bv = b.equipment.category; break;
          case 'department': av = a.equipment.department; bv = b.equipment.department; break;
          case 'priority': {
            const order: Record<ReplacementPriority, number> = { immediate: 0, plan: 1, monitor: 2, continue: 3 };
            av = order[a.result.priority]; bv = order[b.result.priority]; break;
          }
        }
        if (typeof av === 'string' && typeof bv === 'string') {
          return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
      });
  }, [rows, search, categoryFilter, priorityFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="text-slate-300" size={14} />;
    return sortDir === 'asc' ? <ChevronUp className="text-blue-500" size={14} /> : <ChevronDown className="text-blue-500" size={14} />;
  }

  const categories = useMemo(() =>
    [...new Set(equipment.map(e => e.category))] as EquipmentCategory[],
    [equipment],
  );

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, model, serial, department…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as EquipmentCategory | 'all')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as ReplacementPriority | 'all')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="immediate">Immediate</option>
              <option value="plan">Plan</option>
              <option value="monitor">Monitor</option>
              <option value="continue">Continue</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 ml-auto">{filtered.length} of {equipment.length} assets</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {([
                ['name', 'Equipment'],
                ['category', 'Category'],
                ['department', 'Department'],
                ['age', 'Age (yrs)'],
                ['score', 'Risk Score'],
                ['priority', 'Priority'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="px-4 py-3 text-left font-medium text-slate-600 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    {label} <SortIcon col={key} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left font-medium text-slate-600">Flags</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ equipment: e, result }) => (
              <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{e.name}</div>
                  <div className="text-xs text-slate-500">{e.manufacturer} {e.model} · {e.assetTag}</div>
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{CATEGORY_LABELS[e.category]}</td>
                <td className="px-4 py-3 text-slate-600">{e.department}</td>
                <td className="px-4 py-3 text-slate-700 font-mono">
                  {result.currentAge.toFixed(1)}
                  <span className="text-slate-400 text-xs"> / {e.expectedLifespan}yr</span>
                </td>
                <td className="px-4 py-3">
                  <ScoreBar score={result.totalScore} />
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded border ${getPriorityBgClass(result.priority)}`}>
                    {PRIORITY_LABELS[result.priority]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {result.safetyOverride && (
                      <span title={result.overrideReason} className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                        <AlertTriangle size={10} /> Safety
                      </span>
                    )}
                    {e.hasActiveRecall && (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Recall</span>
                    )}
                    {e.hasFDASafetyAlert && (
                      <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">FDA Alert</span>
                    )}
                    {!e.isJCAHOCompliant && (
                      <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Non-Compliant</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => onViewDetail(e.id)}
                      className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                      title="View Detail"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(e.id)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No equipment matches your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#eab308' : '#22c55e';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-20">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="font-mono text-xs font-semibold w-8 text-right" style={{ color }}>{Math.round(score)}</span>
    </div>
  );
}
