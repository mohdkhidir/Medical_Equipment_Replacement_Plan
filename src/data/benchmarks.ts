import type { EquipmentCategory } from '../types/equipment';

export interface CategoryBenchmark {
  label: string;
  expectedLifespan: number;         // years (ASHE/ECRI guideline)
  standardAnnualHours: number;      // benchmark utilization hours/year
  benchmarkMTBF: number;            // Mean Time Between Failures, hours (ECRI)
  maintenanceCostWarning: number;   // % of OC = advisory threshold (ECRI: 15%)
  maintenanceCostCritical: number;  // % of OC = critical threshold (ECRI: 25%)
  reference: string;                // guideline source
  technologyCycleYears: number;     // typical technology refresh cycle
  description: string;
}

export const BENCHMARKS: Record<EquipmentCategory, CategoryBenchmark> = {
  imaging: {
    label: 'Imaging (MRI/CT/X-Ray)',
    expectedLifespan: 12,
    standardAnnualHours: 4380,
    benchmarkMTBF: 2190,
    maintenanceCostWarning: 0.10,
    maintenanceCostCritical: 0.18,
    reference: 'ECRI Institute PM Benchmark; ASHE 2023 Healthcare Equipment Lifecycle',
    technologyCycleYears: 5,
    description: 'Major diagnostic imaging: MRI, CT, PET, X-Ray, Fluoroscopy',
  },
  monitoring: {
    label: 'Patient Monitoring',
    expectedLifespan: 9,
    standardAnnualHours: 8760,
    benchmarkMTBF: 4380,
    maintenanceCostWarning: 0.12,
    maintenanceCostCritical: 0.20,
    reference: 'ECRI Institute; FDA Device Class II Monitoring',
    technologyCycleYears: 4,
    description: 'Bedside monitors, telemetry, pulse oximetry, EEG/ECG systems',
  },
  life_support: {
    label: 'Life Support',
    expectedLifespan: 10,
    standardAnnualHours: 8760,
    benchmarkMTBF: 8760,
    maintenanceCostWarning: 0.15,
    maintenanceCostCritical: 0.22,
    reference: 'ECRI Institute; FDA Class III; ASHE Critical Equipment Policy',
    technologyCycleYears: 6,
    description: 'Ventilators, defibrillators, ECMO, anesthesia machines',
  },
  surgical: {
    label: 'Surgical Equipment',
    expectedLifespan: 12,
    standardAnnualHours: 3285,
    benchmarkMTBF: 4380,
    maintenanceCostWarning: 0.10,
    maintenanceCostCritical: 0.18,
    reference: 'ASHE Operating Suite Equipment Lifecycle; AORN Standards',
    technologyCycleYears: 6,
    description: 'OR tables, laparoscopic systems, electrosurgical units, microscopes',
  },
  laboratory: {
    label: 'Laboratory Analyzers',
    expectedLifespan: 10,
    standardAnnualHours: 2920,
    benchmarkMTBF: 2190,
    maintenanceCostWarning: 0.12,
    maintenanceCostCritical: 0.20,
    reference: 'CAP Laboratory Accreditation; ECRI Lab Equipment Benchmarks',
    technologyCycleYears: 5,
    description: 'Chemistry, hematology, microbiology, pathology analyzers',
  },
  infusion: {
    label: 'Infusion & IV Therapy',
    expectedLifespan: 8,
    standardAnnualHours: 8760,
    benchmarkMTBF: 8760,
    maintenanceCostWarning: 0.15,
    maintenanceCostCritical: 0.25,
    reference: 'FDA Infusion Pump Safety Initiative; ECRI Class Action Alerts',
    technologyCycleYears: 4,
    description: 'IV pumps, syringe drivers, PCA pumps, enteral feeding systems',
  },
  rehabilitation: {
    label: 'Rehabilitation Equipment',
    expectedLifespan: 12,
    standardAnnualHours: 2920,
    benchmarkMTBF: 4380,
    maintenanceCostWarning: 0.08,
    maintenanceCostCritical: 0.15,
    reference: 'ASHE Rehab Equipment Guidelines; CARF Standards',
    technologyCycleYears: 7,
    description: 'Physical therapy, occupational therapy, exercise equipment',
  },
  sterilization: {
    label: 'Sterilization Equipment',
    expectedLifespan: 12,
    standardAnnualHours: 4380,
    benchmarkMTBF: 4380,
    maintenanceCostWarning: 0.12,
    maintenanceCostCritical: 0.20,
    reference: 'AAMI ST79; ASHE CSSD Equipment Lifecycle; FDA 510(k)',
    technologyCycleYears: 6,
    description: 'Steam autoclaves, ETO sterilizers, low-temperature plasma systems',
  },
};

export interface ASHELifecycleMatrix {
  functionScore: number;     // 1-5: equipment function priority
  description: string;
  examples: string[];
}

export const ASHE_FUNCTION_MATRIX: ASHELifecycleMatrix[] = [
  { functionScore: 5, description: 'Life Critical – Direct patient life support', examples: ['Ventilators', 'Defibrillators', 'ECMO', 'Pacemakers'] },
  { functionScore: 4, description: 'High Clinical – Significant patient care impact', examples: ['MRI', 'CT', 'OR tables', 'Anesthesia machines'] },
  { functionScore: 3, description: 'Moderate Clinical – Clinical support', examples: ['Patient monitors', 'Lab analyzers', 'Infusion pumps'] },
  { functionScore: 2, description: 'Low Clinical – Indirect patient care', examples: ['Sterilizers', 'Rehab equipment', 'X-Ray'] },
  { functionScore: 1, description: 'Administrative – Non-clinical support', examples: ['Administrative devices', 'Supply management'] },
];

export interface ECRIReplacement {
  category: string;
  score: number;
  action: string;
  timeline: string;
}

export const ECRI_REPLACEMENT_GUIDE: ECRIReplacement[] = [
  { category: 'Critical – Replace Now', score: 80, action: 'Initiate emergency procurement', timeline: 'Immediate / < 3 months' },
  { category: 'High – Plan Replacement', score: 60, action: 'Include in capital budget next cycle', timeline: '3–12 months' },
  { category: 'Moderate – Monitor', score: 40, action: 'Increase PM frequency; reassess in 6 months', timeline: '12–24 months' },
  { category: 'Low – Continue Service', score: 0, action: 'Maintain current PM schedule', timeline: 'Next annual review' },
];

export interface FDACompliance {
  class: string;
  description: string;
  requirements: string[];
}

export const FDA_DEVICE_CLASSES: FDACompliance[] = [
  {
    class: 'Class III',
    description: 'Highest risk – life-sustaining/supporting devices',
    requirements: ['Pre-market Approval (PMA)', 'Post-market surveillance', 'MDR reporting within 30 days', 'Annual safety reporting'],
  },
  {
    class: 'Class II',
    description: 'Moderate risk – most medical devices',
    requirements: ['510(k) clearance', 'Special controls', 'MDR reporting within 30 days', 'Quality System Regulation (21 CFR 820)'],
  },
  {
    class: 'Class I',
    description: 'Low risk – minimal regulatory controls',
    requirements: ['General controls', 'Registration and listing', 'MDR reporting if applicable'],
  },
];
