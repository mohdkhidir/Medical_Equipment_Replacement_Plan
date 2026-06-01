import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import type { Equipment, EquipmentCategory, PartsAvailability, DegradationLevel, MaintenanceRecord } from '../types/equipment';
import { CATEGORY_LABELS } from '../types/equipment';
import { BENCHMARKS } from '../data/benchmarks';

interface EquipmentFormProps {
  initial?: Equipment;
  onSave: (equipment: Equipment) => void;
  onBack: () => void;
}

function blankEquipment(): Equipment {
  return {
    id: `eq-${Date.now()}`,
    name: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    category: 'monitoring',
    department: '',
    location: '',
    assetTag: '',
    purchaseDate: '',
    expectedLifespan: 10,
    annualOperatingHours: 8760,
    standardAnnualHours: 8760,
    originalCost: 0,
    replacementCost: 0,
    annualMaintenanceCost: 0,
    annualDowntimeHours: 0,
    lastMaintenanceDate: '',
    maintenanceHistory: [],
    failuresLastYear: 0,
    actualMTBF: 4380,
    equipmentGeneration: 1,
    currentMarketGeneration: 3,
    partsAvailability: 'available',
    softwareSupported: true,
    degradationLevel: 0,
    degradationNotes: '',
    hasActiveRecall: false,
    recallDetails: '',
    hasFDASafetyAlert: false,
    fdaAlertDetails: '',
    isJCAHOCompliant: true,
    lastInspectionDate: '',
    lastInspectionResult: 'pass',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function EquipmentForm({ initial, onSave, onBack }: EquipmentFormProps) {
  const [eq, setEq] = useState<Equipment>(() => initial ? { ...initial } : blankEquipment());
  const [errors, setErrors] = useState<Partial<Record<keyof Equipment, string>>>({});

  const isEdit = !!initial;

  function update<K extends keyof Equipment>(key: K, value: Equipment[K]) {
    setEq(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  function handleCategoryChange(cat: EquipmentCategory) {
    const bm = BENCHMARKS[cat];
    setEq(prev => ({
      ...prev,
      category: cat,
      expectedLifespan: bm.expectedLifespan,
      standardAnnualHours: bm.standardAnnualHours,
    }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!eq.name.trim()) e.name = 'Required';
    if (!eq.manufacturer.trim()) e.manufacturer = 'Required';
    if (!eq.model.trim()) e.model = 'Required';
    if (!eq.serialNumber.trim()) e.serialNumber = 'Required';
    if (!eq.department.trim()) e.department = 'Required';
    if (!eq.purchaseDate) e.purchaseDate = 'Required';
    if (eq.originalCost <= 0) e.originalCost = 'Must be > 0';
    if (eq.replacementCost <= 0) e.replacementCost = 'Must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...eq, updatedAt: new Date().toISOString() });
  }

  function addMaintenanceRecord() {
    const record: MaintenanceRecord = {
      id: `m-${Date.now()}`,
      date: '',
      type: 'preventive',
      cost: 0,
      description: '',
      hoursDown: 0,
      technician: '',
    };
    update('maintenanceHistory', [...eq.maintenanceHistory, record]);
  }

  function updateMaintenance(idx: number, key: keyof MaintenanceRecord, value: string | number) {
    const updated = eq.maintenanceHistory.map((r, i) =>
      i === idx ? { ...r, [key]: value } : r
    );
    update('maintenanceHistory', updated);
  }

  function removeMaintenance(idx: number) {
    update('maintenanceHistory', eq.maintenanceHistory.filter((_, i) => i !== idx));
  }

  const benchmark = BENCHMARKS[eq.category];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Equipment' : 'Add New Equipment'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Equipment Name *" error={errors.name}>
              <input className={inputCls(errors.name)} value={eq.name} onChange={e => update('name', e.target.value)} placeholder="e.g. MRI System – 3.0T" />
            </Field>
            <Field label="Category *" error={errors.category}>
              <select className={inputCls()} value={eq.category} onChange={e => handleCategoryChange(e.target.value as EquipmentCategory)}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Manufacturer *" error={errors.manufacturer}>
              <input className={inputCls(errors.manufacturer)} value={eq.manufacturer} onChange={e => update('manufacturer', e.target.value)} placeholder="e.g. GE HealthCare" />
            </Field>
            <Field label="Model *" error={errors.model}>
              <input className={inputCls(errors.model)} value={eq.model} onChange={e => update('model', e.target.value)} placeholder="e.g. SIGNA Premier" />
            </Field>
            <Field label="Serial Number *" error={errors.serialNumber}>
              <input className={inputCls(errors.serialNumber)} value={eq.serialNumber} onChange={e => update('serialNumber', e.target.value)} />
            </Field>
            <Field label="Asset Tag">
              <input className={inputCls()} value={eq.assetTag} onChange={e => update('assetTag', e.target.value)} />
            </Field>
            <Field label="Department *" error={errors.department}>
              <input className={inputCls(errors.department)} value={eq.department} onChange={e => update('department', e.target.value)} placeholder="e.g. Radiology" />
            </Field>
            <Field label="Location">
              <input className={inputCls()} value={eq.location} onChange={e => update('location', e.target.value)} placeholder="e.g. MRI Suite A" />
            </Field>
          </div>
        </Section>

        {/* Age & Utilization */}
        <Section title="Age & Utilization">
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700 mb-3">
            ASHE benchmark for <strong>{CATEGORY_LABELS[eq.category]}</strong>: expected lifespan <strong>{benchmark.expectedLifespan} years</strong>, standard hours <strong>{benchmark.standardAnnualHours.toLocaleString()} hrs/yr</strong>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Purchase Date *" error={errors.purchaseDate}>
              <input type="date" className={inputCls(errors.purchaseDate)} value={eq.purchaseDate} onChange={e => update('purchaseDate', e.target.value)} />
            </Field>
            <Field label={`Expected Lifespan (years) – ASHE: ${benchmark.expectedLifespan}yr`}>
              <input type="number" min={1} max={30} className={inputCls()} value={eq.expectedLifespan} onChange={e => update('expectedLifespan', +e.target.value)} />
            </Field>
            <Field label={`Annual Operating Hours – Standard: ${benchmark.standardAnnualHours.toLocaleString()}`}>
              <input type="number" min={0} max={8760} className={inputCls()} value={eq.annualOperatingHours} onChange={e => update('annualOperatingHours', +e.target.value)} />
            </Field>
            <Field label="Standard Annual Hours (Category Benchmark)">
              <input type="number" min={0} max={8760} className={inputCls()} value={eq.standardAnnualHours} onChange={e => update('standardAnnualHours', +e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Maintenance */}
        <Section title="Maintenance & Costs">
          <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700 mb-3">
            ECRI thresholds: Advisory ≥{Math.round(benchmark.maintenanceCostWarning * 100)}% of original cost | Critical ≥{Math.round(benchmark.maintenanceCostCritical * 100)}% of original cost
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Original Purchase Cost ($) *" error={errors.originalCost}>
              <input type="number" min={0} className={inputCls(errors.originalCost)} value={eq.originalCost || ''} onChange={e => update('originalCost', +e.target.value)} />
            </Field>
            <Field label="Current Replacement Cost ($) *" error={errors.replacementCost}>
              <input type="number" min={0} className={inputCls(errors.replacementCost)} value={eq.replacementCost || ''} onChange={e => update('replacementCost', +e.target.value)} />
            </Field>
            <Field label="Annual Maintenance Cost ($)">
              <input type="number" min={0} className={inputCls()} value={eq.annualMaintenanceCost || ''} onChange={e => update('annualMaintenanceCost', +e.target.value)} />
              {eq.originalCost > 0 && eq.annualMaintenanceCost > 0 && (
                <span className="text-xs text-slate-500 mt-1 block">
                  = {((eq.annualMaintenanceCost / eq.originalCost) * 100).toFixed(1)}% of original cost
                </span>
              )}
            </Field>
            <Field label="Annual Downtime (hours)">
              <input type="number" min={0} max={8760} className={inputCls()} value={eq.annualDowntimeHours || ''} onChange={e => update('annualDowntimeHours', +e.target.value)} />
            </Field>
            <Field label="Last Maintenance Date">
              <input type="date" className={inputCls()} value={eq.lastMaintenanceDate} onChange={e => update('lastMaintenanceDate', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Reliability */}
        <Section title="Reliability">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Failures Last 12 Months">
              <input type="number" min={0} className={inputCls()} value={eq.failuresLastYear || ''} onChange={e => update('failuresLastYear', +e.target.value)} />
            </Field>
            <Field label={`Actual MTBF (hours) – ECRI Benchmark: ${BENCHMARKS[eq.category].benchmarkMTBF.toLocaleString()} hrs`}>
              <input type="number" min={1} className={inputCls()} value={eq.actualMTBF || ''} onChange={e => update('actualMTBF', +e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Technology */}
        <Section title="Technology Generation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Equipment Generation (this unit's generation #)">
              <input type="number" min={0} max={20} className={inputCls()} value={eq.equipmentGeneration} onChange={e => update('equipmentGeneration', +e.target.value)} />
            </Field>
            <Field label="Current Market Generation (latest available)">
              <input type="number" min={1} max={20} className={inputCls()} value={eq.currentMarketGeneration} onChange={e => update('currentMarketGeneration', +e.target.value)} />
            </Field>
            <Field label="Parts Availability">
              <select className={inputCls()} value={eq.partsAvailability} onChange={e => update('partsAvailability', e.target.value as PartsAvailability)}>
                <option value="available">Readily Available</option>
                <option value="limited">Limited Stock</option>
                <option value="scarce">Scarce / End-of-Life</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </Field>
            <Field label="Software / Firmware Support">
              <select className={inputCls()} value={eq.softwareSupported ? 'yes' : 'no'} onChange={e => update('softwareSupported', e.target.value === 'yes')}>
                <option value="yes">Active – receiving updates</option>
                <option value="no">Discontinued</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Materials */}
        <Section title="Materials & Physical Condition">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Degradation Level (ASHE PCI)">
              <select className={inputCls()} value={eq.degradationLevel} onChange={e => update('degradationLevel', +e.target.value as DegradationLevel)}>
                <option value={0}>0 – None (Excellent condition)</option>
                <option value={1}>1 – Minor (Good, minor wear)</option>
                <option value={2}>2 – Moderate (Fair, visible wear)</option>
                <option value={3}>3 – Severe (Poor condition)</option>
                <option value={4}>4 – Critical (End-of-life condition)</option>
              </select>
            </Field>
            <Field label="Degradation Notes">
              <input className={inputCls()} value={eq.degradationNotes} onChange={e => update('degradationNotes', e.target.value)} placeholder="Describe physical condition issues" />
            </Field>
          </div>
        </Section>

        {/* Safety & Compliance */}
        <Section title="Safety & Compliance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <CheckField
                label="Active Manufacturer / FDA Recall"
                checked={eq.hasActiveRecall}
                onChange={v => update('hasActiveRecall', v)}
                alertColor="red"
              />
              {eq.hasActiveRecall && (
                <Field label="Recall Details">
                  <textarea className={inputCls()} rows={2} value={eq.recallDetails} onChange={e => update('recallDetails', e.target.value)} />
                </Field>
              )}
              <CheckField
                label="Active FDA Safety Alert"
                checked={eq.hasFDASafetyAlert}
                onChange={v => update('hasFDASafetyAlert', v)}
                alertColor="orange"
              />
              {eq.hasFDASafetyAlert && (
                <Field label="FDA Alert Details">
                  <textarea className={inputCls()} rows={2} value={eq.fdaAlertDetails} onChange={e => update('fdaAlertDetails', e.target.value)} />
                </Field>
              )}
              <CheckField
                label="JCAHO Compliant"
                checked={eq.isJCAHOCompliant}
                onChange={v => update('isJCAHOCompliant', v)}
                invertAlert
                alertColor="yellow"
              />
            </div>
            <div className="space-y-4">
              <Field label="Last Inspection Date">
                <input type="date" className={inputCls()} value={eq.lastInspectionDate} onChange={e => update('lastInspectionDate', e.target.value)} />
              </Field>
              <Field label="Inspection Result">
                <select className={inputCls()} value={eq.lastInspectionResult} onChange={e => update('lastInspectionResult', e.target.value as Equipment['lastInspectionResult'])}>
                  <option value="pass">Pass</option>
                  <option value="conditional">Conditional</option>
                  <option value="fail">Fail</option>
                  <option value="pending">Pending</option>
                </select>
              </Field>
            </div>
          </div>
        </Section>

        {/* Maintenance History */}
        <Section title="Maintenance History">
          <div className="space-y-3">
            {eq.maintenanceHistory.map((r, i) => (
              <div key={r.id} className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Field label="Date">
                  <input type="date" className={inputCls()} value={r.date} onChange={e => updateMaintenance(i, 'date', e.target.value)} />
                </Field>
                <Field label="Type">
                  <select className={inputCls()} value={r.type} onChange={e => updateMaintenance(i, 'type', e.target.value)}>
                    <option value="preventive">Preventive</option>
                    <option value="corrective">Corrective</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </Field>
                <Field label="Cost ($)">
                  <input type="number" min={0} className={inputCls()} value={r.cost || ''} onChange={e => updateMaintenance(i, 'cost', +e.target.value)} />
                </Field>
                <Field label="Hours Down">
                  <input type="number" min={0} className={inputCls()} value={r.hoursDown || ''} onChange={e => updateMaintenance(i, 'hoursDown', +e.target.value)} />
                </Field>
                <Field label="Technician">
                  <input className={inputCls()} value={r.technician} onChange={e => updateMaintenance(i, 'technician', e.target.value)} />
                </Field>
                <Field label="Description">
                  <input className={inputCls()} value={r.description} onChange={e => updateMaintenance(i, 'description', e.target.value)} />
                </Field>
                <div className="col-span-2 md:col-span-3 flex justify-end">
                  <button type="button" onClick={() => removeMaintenance(i)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addMaintenanceRecord} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
              <Plus size={16} /> Add Maintenance Record
            </button>
          </div>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <Field label="Additional Notes">
            <textarea className={inputCls()} rows={3} value={eq.notes} onChange={e => update('notes', e.target.value)} placeholder="Any additional context, issues, or observations…" />
          </Field>
        </Section>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Save size={16} /> {isEdit ? 'Save Changes' : 'Add Equipment'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
      {error && <span className="text-xs text-red-600 mt-0.5 block">{error}</span>}
    </div>
  );
}

function CheckField({ label, checked, onChange, alertColor, invertAlert }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  alertColor: 'red' | 'orange' | 'yellow';
  invertAlert?: boolean;
}) {
  const isAlert = invertAlert ? !checked : checked;
  const bgColors = { red: 'bg-red-50 border-red-200', orange: 'bg-orange-50 border-orange-200', yellow: 'bg-yellow-50 border-yellow-200' };
  return (
    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${isAlert ? bgColors[alertColor] : 'bg-slate-50 border-slate-200'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded"
      />
      <span className={`text-sm font-medium ${isAlert ? `text-${alertColor}-800` : 'text-slate-700'}`}>{label}</span>
    </label>
  );
}

function inputCls(error?: string) {
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? 'border-red-400 bg-red-50' : 'border-slate-200'
  }`;
}
