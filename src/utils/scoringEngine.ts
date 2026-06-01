import type { Equipment, ScoringResult, ReplacementPriority, PartsAvailability } from '../types/equipment';
import { BENCHMARKS } from '../data/benchmarks';

function getAgeInYears(purchaseDate: string): number {
  const purchase = new Date(purchaseDate);
  const now = new Date();
  return (now.getTime() - purchase.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

// ─── Factor 1: Age & Utilization (Weight 25%) ───────────────────────────────
// ASHE: equipment age past expected lifespan is primary replacement trigger.
// High utilization accelerates wear; adjusts effective age accordingly.
function calcAgeScore(equipment: Equipment): { score: number; ageRatio: number; effectiveAge: number } {
  const currentAge = getAgeInYears(equipment.purchaseDate);
  const ageRatio = currentAge / equipment.expectedLifespan;
  const utilizationRatio = equipment.annualOperatingHours / Math.max(1, equipment.standardAnnualHours);
  // utilization > 1.0 accelerates aging
  const utilizationMultiplier = 1 + Math.max(0, utilizationRatio - 1.0) * 0.35;
  const effectiveAgeRatio = ageRatio * utilizationMultiplier;
  const score = Math.min(100, effectiveAgeRatio * 100);
  return { score, ageRatio, effectiveAge: currentAge * utilizationMultiplier };
}

// ─── Factor 2: Maintenance (Weight 20%) ─────────────────────────────────────
// ECRI: annual maintenance > 15% of OC = advisory; > 25% = critical.
// Downtime > 33% of operating hours = score 100.
function calcMaintenanceScore(equipment: Equipment): { score: number; costRatio: number; downtimeRatio: number } {
  const costRatio = equipment.annualMaintenanceCost / Math.max(1, equipment.originalCost);
  const costScore = Math.min(100, (costRatio / 0.25) * 100);

  const downtimeRatio = equipment.annualDowntimeHours / Math.max(1, equipment.annualOperatingHours);
  const downtimeScore = Math.min(100, downtimeRatio * 300);

  const score = 0.6 * costScore + 0.4 * downtimeScore;
  return { score, costRatio, downtimeRatio };
}

// ─── Factor 3: Reliability (Weight 20%) ──────────────────────────────────────
// ECRI MTBF benchmarks by category. MTBF ratio > 2.2x benchmark = score 100.
// Failure rate: 12 failures/year = score 100.
function calcReliabilityScore(equipment: Equipment): { score: number; mtbfRatio: number } {
  const benchmark = BENCHMARKS[equipment.category];
  const mtbfRatio = benchmark.benchmarkMTBF / Math.max(1, equipment.actualMTBF);
  const mtbfScore = Math.min(100, mtbfRatio * 45);

  const failureScore = Math.min(100, (equipment.failuresLastYear / 12) * 100);

  const score = 0.5 * mtbfScore + 0.5 * failureScore;
  return { score, mtbfRatio };
}

// ─── Factor 4: Technology Gap (Weight 15%) ───────────────────────────────────
// Generation gap: each generation behind = 25 points. 4+ gens = 100.
// Parts availability and software support compound obsolescence risk.
function calcTechGapScore(equipment: Equipment): { score: number; generationGap: number } {
  const generationGap = Math.max(0, equipment.currentMarketGeneration - equipment.equipmentGeneration);
  const genScore = Math.min(100, generationGap * 25);

  const partsScoreMap: Record<PartsAvailability, number> = {
    available: 0,
    limited: 33,
    scarce: 67,
    unavailable: 100,
  };
  const partsScore = partsScoreMap[equipment.partsAvailability];
  const softwareScore = equipment.softwareSupported ? 0 : 50;

  const score = 0.5 * genScore + 0.3 * partsScore + 0.2 * softwareScore;
  return { score, generationGap };
}

// ─── Factor 5: Materials Condition (Weight 10%) ──────────────────────────────
// Physical degradation scale per ASHE Physical Condition Index (PCI):
// 0=none (100% PCI), 1=minor (75%), 2=moderate (50%), 3=severe (25%), 4=critical (0%)
function calcMaterialScore(equipment: Equipment): number {
  return (equipment.degradationLevel / 4) * 100;
}

// ─── Factor 6: Safety & Compliance (Weight 10%) ──────────────────────────────
// FDA active recall = highest urgency. FDA safety alert and JCAHO non-compliance
// are additive risk signals.
function calcSafetyScore(equipment: Equipment): number {
  let score = 0;
  if (equipment.hasActiveRecall) score = Math.max(score, 90);
  if (equipment.hasFDASafetyAlert) score = Math.max(score, 70);
  if (!equipment.isJCAHOCompliant) score = Math.max(score, 60);
  return score;
}

// ─── Priority Classification ─────────────────────────────────────────────────
function classifyPriority(
  totalScore: number,
  equipment: Equipment,
): { priority: ReplacementPriority; safetyOverride: boolean; overrideReason: string } {
  if (equipment.hasActiveRecall) {
    return { priority: 'immediate', safetyOverride: true, overrideReason: 'Active FDA/manufacturer recall in effect' };
  }
  if (equipment.hasFDASafetyAlert && totalScore >= 50) {
    return { priority: 'immediate', safetyOverride: true, overrideReason: 'FDA safety alert with elevated risk score' };
  }
  if (!equipment.isJCAHOCompliant && totalScore >= 65) {
    return { priority: 'immediate', safetyOverride: true, overrideReason: 'JCAHO non-compliance with high risk score' };
  }
  if (totalScore >= 80) return { priority: 'immediate', safetyOverride: false, overrideReason: '' };
  if (totalScore >= 60) return { priority: 'plan', safetyOverride: false, overrideReason: '' };
  if (totalScore >= 40) return { priority: 'monitor', safetyOverride: false, overrideReason: '' };
  return { priority: 'continue', safetyOverride: false, overrideReason: '' };
}

// ─── Primary Driver ──────────────────────────────────────────────────────────
function getPrimaryDriver(scores: {
  ageScore: number;
  maintenanceScore: number;
  reliabilityScore: number;
  techGapScore: number;
  materialScore: number;
  safetyScore: number;
}): string {
  const weighted = [
    { label: 'Age & Utilization', value: scores.ageScore * 0.25 },
    { label: 'Maintenance Cost/Downtime', value: scores.maintenanceScore * 0.20 },
    { label: 'Reliability', value: scores.reliabilityScore * 0.20 },
    { label: 'Technology Gap', value: scores.techGapScore * 0.15 },
    { label: 'Materials Degradation', value: scores.materialScore * 0.10 },
    { label: 'Safety & Compliance', value: scores.safetyScore * 0.10 },
  ];
  return weighted.sort((a, b) => b.value - a.value)[0].label;
}

// ─── Recommendations Generator ───────────────────────────────────────────────
function generateRecommendations(
  equipment: Equipment,
  scores: ReturnType<typeof calcAgeScore> & { maintenanceScore: number; reliabilityScore: number; techGapScore: number; materialScore: number; safetyScore: number },
  priority: ReplacementPriority,
): string[] {
  const recs: string[] = [];
  const benchmark = BENCHMARKS[equipment.category];

  if (equipment.hasActiveRecall) {
    recs.push(`URGENT: Active recall – isolate or remove from service immediately. Contact ${equipment.manufacturer} for remediation.`);
  }
  if (equipment.hasFDASafetyAlert) {
    recs.push(`FDA safety alert is active. Review alert details and apply any required mitigations before next use.`);
  }
  if (!equipment.isJCAHOCompliant) {
    recs.push(`Non-compliant with JCAHO standards. Schedule immediate inspection and corrective action.`);
  }

  if (scores.ageRatio > 1.0) {
    recs.push(`Equipment has exceeded its ${equipment.expectedLifespan}-year expected lifespan (${Math.round(scores.ageRatio * 100)}% of lifespan used). Accelerated degradation risk.`);
  } else if (scores.ageRatio > 0.8) {
    recs.push(`Approaching end of ${equipment.expectedLifespan}-year lifespan (${Math.round(scores.ageRatio * 100)}% used). Begin capital planning now.`);
  }

  const costPct = Math.round(scores.maintenanceScore > 0 ? (equipment.annualMaintenanceCost / equipment.originalCost) * 100 : 0);
  if (equipment.annualMaintenanceCost / equipment.originalCost > benchmark.maintenanceCostCritical) {
    recs.push(`Annual maintenance cost (${costPct}% of original cost) exceeds ECRI critical threshold of ${Math.round(benchmark.maintenanceCostCritical * 100)}%. Replacement is more cost-effective.`);
  } else if (equipment.annualMaintenanceCost / equipment.originalCost > benchmark.maintenanceCostWarning) {
    recs.push(`Annual maintenance cost (${costPct}% of original cost) exceeds ECRI advisory threshold of ${Math.round(benchmark.maintenanceCostWarning * 100)}%. Monitor for upward trend.`);
  }

  if (equipment.failuresLastYear >= 6) {
    recs.push(`High failure rate (${equipment.failuresLastYear} failures/year). Consider corrective maintenance investigation and accelerated replacement timeline.`);
  }

  const generationGap = equipment.currentMarketGeneration - equipment.equipmentGeneration;
  if (generationGap >= 3) {
    recs.push(`${generationGap} technology generations behind current market (Gen ${equipment.currentMarketGeneration}). Significant clinical and operational capability gap.`);
  } else if (generationGap >= 2) {
    recs.push(`${generationGap} technology generations behind market. Evaluate upgrade path vs. full replacement.`);
  }

  if (equipment.partsAvailability === 'unavailable') {
    recs.push(`Replacement parts are no longer available. Equipment cannot be repaired if it fails. Immediate replacement required.`);
  } else if (equipment.partsAvailability === 'scarce') {
    recs.push(`Parts availability is scarce (approaching end-of-life). Secure critical spare parts and begin replacement planning.`);
  }

  if (!equipment.softwareSupported) {
    recs.push(`Software/firmware no longer supported by manufacturer. Cybersecurity and interoperability risks apply.`);
  }

  if (equipment.degradationLevel >= 3) {
    recs.push(`Physical condition is ${equipment.degradationLevel === 3 ? 'Severe' : 'Critical'} (ASHE PCI rating). Immediate structural assessment required.`);
  }

  if (priority === 'immediate') {
    recs.push(`Initiate emergency capital replacement request. Notify biomedical engineering and department leadership.`);
    recs.push(`Identify temporary rental or loaner equipment to maintain clinical operations during transition.`);
  } else if (priority === 'plan') {
    recs.push(`Include in next capital budget submission. Target procurement within 12 months.`);
    recs.push(`Begin market evaluation and vendor demonstrations. Engage value analysis committee.`);
  } else if (priority === 'monitor') {
    recs.push(`Increase preventive maintenance frequency per ECRI recommendations for aging equipment.`);
    recs.push(`Re-evaluate at next semi-annual review. Track maintenance cost trend carefully.`);
  } else {
    recs.push(`Continue current preventive maintenance schedule per manufacturer guidelines.`);
    recs.push(`No capital action required. Reassess at next annual equipment review.`);
  }

  return recs;
}

// ─── Estimated Remaining Life ────────────────────────────────────────────────
function estimateRemainingMonths(equipment: Equipment, totalScore: number): number {
  const currentAge = getAgeInYears(equipment.purchaseDate);
  const remainingYears = Math.max(0, equipment.expectedLifespan - currentAge);
  // High scores reduce remaining useful life estimate
  const scoreMultiplier = Math.max(0, 1 - (totalScore / 100) * 0.8);
  return Math.round(remainingYears * 12 * scoreMultiplier);
}

// ─── Main Scoring Function ───────────────────────────────────────────────────
export function calculateScore(equipment: Equipment): ScoringResult {
  const { score: ageScore, ageRatio, effectiveAge } = calcAgeScore(equipment);
  const { score: maintenanceScore, costRatio, downtimeRatio } = calcMaintenanceScore(equipment);
  const { score: reliabilityScore, mtbfRatio } = calcReliabilityScore(equipment);
  const { score: techGapScore, generationGap } = calcTechGapScore(equipment);
  const materialScore = calcMaterialScore(equipment);
  const safetyScore = calcSafetyScore(equipment);

  const totalScore =
    0.25 * ageScore +
    0.20 * maintenanceScore +
    0.20 * reliabilityScore +
    0.15 * techGapScore +
    0.10 * materialScore +
    0.10 * safetyScore;

  const { priority, safetyOverride, overrideReason } = classifyPriority(totalScore, equipment);

  const primaryDriver = getPrimaryDriver({ ageScore, maintenanceScore, reliabilityScore, techGapScore, materialScore, safetyScore });

  const recommendations = generateRecommendations(
    equipment,
    { score: ageScore, ageRatio, effectiveAge, maintenanceScore, reliabilityScore, techGapScore, materialScore, safetyScore },
    priority,
  );

  const benchmark = BENCHMARKS[equipment.category];

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    priority,
    ageScore: Math.round(ageScore),
    maintenanceScore: Math.round(maintenanceScore),
    reliabilityScore: Math.round(reliabilityScore),
    techGapScore: Math.round(techGapScore),
    materialScore: Math.round(materialScore),
    safetyScore: Math.round(safetyScore),
    currentAge: Math.round(getAgeInYears(equipment.purchaseDate) * 10) / 10,
    ageRatio: Math.round(ageRatio * 100) / 100,
    effectiveAge: Math.round(effectiveAge * 10) / 10,
    costRatio: Math.round(costRatio * 1000) / 1000,
    downtimeRatio: Math.round(downtimeRatio * 1000) / 1000,
    mtbfRatio: Math.round(mtbfRatio * 100) / 100,
    generationGap,
    primaryDriver,
    recommendations,
    estimatedRemainingMonths: estimateRemainingMonths(equipment, totalScore),
    benchmarkSource: benchmark.reference,
    safetyOverride,
    overrideReason,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#ef4444'; // red
  if (score >= 60) return '#f97316'; // orange
  if (score >= 40) return '#eab308'; // yellow
  return '#22c55e'; // green
}

export function getPriorityColor(priority: ReplacementPriority): string {
  switch (priority) {
    case 'immediate': return '#ef4444';
    case 'plan': return '#f97316';
    case 'monitor': return '#eab308';
    case 'continue': return '#22c55e';
  }
}

export function getPriorityBgClass(priority: ReplacementPriority): string {
  switch (priority) {
    case 'immediate': return 'bg-red-100 text-red-800 border-red-200';
    case 'plan': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'monitor': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'continue': return 'bg-green-100 text-green-800 border-green-200';
  }
}
