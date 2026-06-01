export type EquipmentCategory =
  | 'imaging'
  | 'monitoring'
  | 'life_support'
  | 'surgical'
  | 'laboratory'
  | 'infusion'
  | 'rehabilitation'
  | 'sterilization';

export type PartsAvailability = 'available' | 'limited' | 'scarce' | 'unavailable';

// 0=none, 1=minor, 2=moderate, 3=severe, 4=critical
export type DegradationLevel = 0 | 1 | 2 | 3 | 4;

export type ReplacementPriority = 'immediate' | 'plan' | 'monitor' | 'continue';

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'preventive' | 'corrective' | 'inspection';
  cost: number;
  description: string;
  hoursDown: number;
  technician: string;
}

export interface Equipment {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  category: EquipmentCategory;
  department: string;
  location: string;
  assetTag: string;

  // Age & Utilization
  purchaseDate: string;           // ISO date YYYY-MM-DD
  expectedLifespan: number;       // years
  annualOperatingHours: number;   // actual hours used per year
  standardAnnualHours: number;    // benchmark for category

  // Maintenance
  originalCost: number;            // USD
  replacementCost: number;         // current replacement cost USD
  annualMaintenanceCost: number;   // USD/year
  annualDowntimeHours: number;     // hours/year unscheduled downtime
  lastMaintenanceDate: string;
  maintenanceHistory: MaintenanceRecord[];

  // Reliability
  failuresLastYear: number;
  actualMTBF: number;              // Mean Time Between Failures (hours)

  // Technology
  equipmentGeneration: number;     // generation number this unit is
  currentMarketGeneration: number; // latest generation available on market
  partsAvailability: PartsAvailability;
  softwareSupported: boolean;      // still receiving software/firmware updates

  // Materials
  degradationLevel: DegradationLevel;
  degradationNotes: string;

  // Safety & Compliance
  hasActiveRecall: boolean;
  recallDetails: string;
  hasFDASafetyAlert: boolean;
  fdaAlertDetails: string;
  isJCAHOCompliant: boolean;
  lastInspectionDate: string;
  lastInspectionResult: 'pass' | 'conditional' | 'fail' | 'pending';

  // Notes
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreComponents {
  ageScore: number;
  maintenanceScore: number;
  reliabilityScore: number;
  techGapScore: number;
  materialScore: number;
  safetyScore: number;
}

export interface ScoringResult extends ScoreComponents {
  totalScore: number;
  priority: ReplacementPriority;

  // Sub-metrics
  currentAge: number;              // years
  ageRatio: number;                // currentAge / expectedLifespan
  effectiveAge: number;            // age adjusted for utilization
  costRatio: number;               // annualMaintenance / originalCost
  downtimeRatio: number;           // downtime / operating hours
  mtbfRatio: number;               // benchmarkMTBF / actualMTBF
  generationGap: number;

  // Narrative
  primaryDriver: string;
  recommendations: string[];
  estimatedRemainingMonths: number;
  benchmarkSource: string;

  // Override flags
  safetyOverride: boolean;
  overrideReason: string;
}

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  imaging: 'Imaging',
  monitoring: 'Monitoring',
  life_support: 'Life Support',
  surgical: 'Surgical',
  laboratory: 'Laboratory',
  infusion: 'Infusion',
  rehabilitation: 'Rehabilitation',
  sterilization: 'Sterilization',
};

export const PRIORITY_LABELS: Record<ReplacementPriority, string> = {
  immediate: 'Immediate Replacement',
  plan: 'Plan Replacement',
  monitor: 'Monitor',
  continue: 'Continue Service',
};

export const DEGRADATION_LABELS: Record<DegradationLevel, string> = {
  0: 'None',
  1: 'Minor',
  2: 'Moderate',
  3: 'Severe',
  4: 'Critical',
};

export const PARTS_LABELS: Record<PartsAvailability, string> = {
  available: 'Readily Available',
  limited: 'Limited Stock',
  scarce: 'Scarce / EOL',
  unavailable: 'Unavailable',
};
