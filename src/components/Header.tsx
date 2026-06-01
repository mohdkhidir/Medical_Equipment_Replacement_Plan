import { Activity, Menu } from 'lucide-react';

type View = 'dashboard' | 'equipment' | 'add' | 'detail' | 'techgap' | 'report';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  const navItems: { view: View; label: string }[] = [
    { view: 'dashboard', label: 'Dashboard' },
    { view: 'equipment', label: 'Equipment Registry' },
    { view: 'techgap', label: 'Technology Gap' },
    { view: 'report', label: 'Annual Report' },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 mr-6">
          <Activity className="text-blue-400" size={24} />
          <div>
            <div className="font-bold text-sm leading-tight">AdvanceTech</div>
            <div className="text-xs text-slate-400 leading-tight">Equipment Replacement Planner</div>
          </div>
        </div>

        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ view, label }) => (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                currentView === view
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => onNavigate('add')}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          + Add Equipment
        </button>

        <Menu className="text-slate-400 ml-2 cursor-pointer hover:text-white lg:hidden" size={20} />
      </div>
    </header>
  );
}
