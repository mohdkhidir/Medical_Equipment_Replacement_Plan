import { useState } from 'react';
import { Activity, Menu, X, Plus } from 'lucide-react';

type View = 'dashboard' | 'equipment' | 'add' | 'detail' | 'techgap' | 'report';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: 'dashboard', label: 'Dashboard' },
  { view: 'equipment', label: 'Equipment Registry' },
  { view: 'techgap', label: 'Technology Gap' },
  { view: 'report', label: 'Annual Report' },
];

export function Header({ currentView, onNavigate }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function go(view: View) {
    onNavigate(view);
    setMenuOpen(false);
  }

  return (
    <header className="bg-slate-900 text-white shadow-lg relative z-40">
      {/* Top bar */}
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Activity className="text-blue-400" size={22} />
          <div>
            <div className="font-bold text-sm leading-tight">AdvanceTech</div>
            <div className="text-xs text-slate-400 leading-tight hidden sm:block">Equipment Replacement Planner</div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 ml-4">
          {NAV_ITEMS.map(({ view, label }) => (
            <button
              key={view}
              onClick={() => go(view)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                currentView === view
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Add button */}
        <button
          onClick={() => go('add')}
          className="ml-auto md:ml-0 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Add Equipment</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* Hamburger (mobile only) */}
        <button
          className="md:hidden p-2 rounded hover:bg-slate-700 transition-colors"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-700 bg-slate-900 px-4 py-2 flex flex-col gap-1">
          {NAV_ITEMS.map(({ view, label }) => (
            <button
              key={view}
              onClick={() => go(view)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === view
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
