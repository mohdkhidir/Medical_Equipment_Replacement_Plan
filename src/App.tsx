import { useState, useEffect } from 'react';
import type { Equipment, Attachment } from './types/equipment';
import { SAMPLE_EQUIPMENT } from './data/sampleData';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { EquipmentList } from './components/EquipmentList';
import { EquipmentDetail } from './components/EquipmentDetail';
import { EquipmentForm } from './components/EquipmentForm';
import { TechGapAnalysis } from './components/TechGapAnalysis';
import { ReportView } from './components/ReportView';

type View = 'dashboard' | 'equipment' | 'add' | 'detail' | 'edit' | 'techgap' | 'report';

const STORAGE_KEY = 'advancetech-equipment-v2';

function loadEquipment(): Equipment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Equipment[];
      // Ensure all items have attachments array (migration from v1)
      return parsed.map(e => ({ ...e, attachments: e.attachments ?? [] }));
    }
  } catch {
    // ignore
  }
  return SAMPLE_EQUIPMENT;
}

function saveEquipment(equipment: Equipment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
  } catch {
    // ignore
  }
}

export default function App() {
  const [equipment, setEquipment] = useState<Equipment[]>(loadEquipment);
  const [view, setView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    saveEquipment(equipment);
  }, [equipment]);

  function navigate(v: View) {
    setView(v);
    setSelectedId(null);
  }

  function viewDetail(id: string) {
    setSelectedId(id);
    setView('detail');
  }

  function editEquipment(id: string) {
    setSelectedId(id);
    setView('edit');
  }

  function handleSave(updated: Equipment) {
    setEquipment(prev => {
      const exists = prev.some(e => e.id === updated.id);
      return exists ? prev.map(e => e.id === updated.id ? updated : e) : [...prev, updated];
    });
    if (view === 'edit' && selectedId) {
      setView('detail');
    } else {
      setView('equipment');
    }
  }

  function handleUpdateAttachments(equipmentId: string, attachments: Attachment[]) {
    setEquipment(prev => prev.map(e =>
      e.id === equipmentId ? { ...e, attachments } : e
    ));
  }

  const selectedEquipment = selectedId ? equipment.find(e => e.id === selectedId) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header currentView={view as 'dashboard' | 'equipment' | 'add' | 'techgap' | 'report'} onNavigate={navigate} />

      <main className="flex-1 overflow-auto">
        {view === 'dashboard' && (
          <Dashboard equipment={equipment} onViewDetail={viewDetail} />
        )}
        {view === 'equipment' && (
          <EquipmentList equipment={equipment} onViewDetail={viewDetail} onEdit={editEquipment} />
        )}
        {view === 'add' && (
          <EquipmentForm onSave={handleSave} onBack={() => navigate('equipment')} />
        )}
        {view === 'detail' && selectedEquipment && (
          <EquipmentDetail
            equipment={selectedEquipment}
            onBack={() => navigate('equipment')}
            onEdit={editEquipment}
            onUpdateAttachments={handleUpdateAttachments}
          />
        )}
        {view === 'edit' && selectedEquipment && (
          <EquipmentForm initial={selectedEquipment} onSave={handleSave} onBack={() => setView('detail')} />
        )}
        {view === 'techgap' && (
          <TechGapAnalysis equipment={equipment} onViewDetail={viewDetail} />
        )}
        {view === 'report' && (
          <ReportView equipment={equipment} onViewDetail={viewDetail} />
        )}
      </main>
    </div>
  );
}
