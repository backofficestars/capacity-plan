import type { TeamMember, TeamMemberSkill, SkillKey } from "@/lib/db/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClientRequirements {
  industry: string | null;
  accountingSoftware: "qbo" | "xero" | "other";
  isDemanding: boolean;
  complexityLevel: "low" | "medium" | "high";
  payrollEmployees: number;
  estimatedMonthlyHours: number;
  serviceTypes: string[];
  hasCatchUp: boolean;
  catchUpHours?: number;
  catchUpWeeks?: number;
}

export interface ScoringWeights {
  sector_experience: number;
  availability: number;
  daytime: number;
  demanding: number;
  complexity: number;
  personality: number;
  tech: number;
  software: number;
}

export interface CapacitySnapshot {
  totalCapacityHrs: number;
  committedHrs: number;
  internalHrs: number;
  availableHrs: number;
  utilizationPct: number;
}

export interface ScoringResult {
  teamMemberId: string;
  teamMemberName: string;
  totalScore: number;
  breakdown: Record<string, number>;
  flags: string[];
  capacityBefore: CapacitySnapshot;
  capacityAfter: CapacitySnapshot;
  suggestedRole: "lead" | "supporting";
  disqualified: boolean;
  disqualifyReason?: string;
}

export interface CatchUpFeasibility {
  feasible: boolean;
  weeklyHoursNeeded: number;
  availableWeeklyHours: number;
  riskLevel: "low" | "medium" | "high";
  suggestedSplit?: { memberId: string; memberName: string; hours: number }[];
}

export interface NewClientResult {
  recommendations: ScoringResult[];
  catchUpFeasibility?: CatchUpFeasibility;
}

interface BookkeeperData {
  member: TeamMember;
  skills: Record<SkillKey, number>;
  capacity: CapacitySnapshot;
}

// ─── Default Weights ─────────────────────────────────────────────────────────

export const DEFAULT_WEIGHTS: ScoringWeights = {
  sector_experience: 30,
  availability: 25,
  daytime: 10,
  demanding: 10,
  complexity: 10,
  personality: 5,
  tech: 5,
  software: 5,
};

// ─── Industry to Skill Key Mapping ───────────────────────────────────────────

const INDUSTRY_SKILL_MAP: Record<string, SkillKey> = {
  construction: "construction",
  "non-profit": "non_profit",
  "non profit": "non_profit",
  nonprofit: "non_profit",
  ecommerce: "ecommerce",
  "e-commerce": "ecommerce",
};

const CRITICAL_INDUSTRIES = ["construction", "non-profit", "non profit", "nonprofit", "ecommerce", "e-commerce"];

function mapIndustryToSkill(industry: string | null): SkillKey | null {
  if (!industry) return null;
  return INDUSTRY_SKILL_MAP[industry.toLowerCase()] ?? null;
}

// ─── Scoring Functions ───────────────────────────────────────────────────────

function scoreSectorExperience(
  skills: Record<SkillKey, number>,
  requirements: ClientRequirements
): { score: number; flags: string[] } {
  const flags: string[] = [];
  const sectorSkill = mapIndustryToSkill(requirements.industry);

  if (!sectorSkill) {
    return { score: 80, flags };
  }

  const skillValue = skills[sectorSkill] ?? 0;
  const score = (skillValue / 5) * 100;

  const isCritical = requirements.industry
    ? CRITICAL_INDUSTRIES.includes(requirements.industry.toLowerCase())
    : false;

  if (isCritical && skillValue < 2) {
    flags.push(
      `Low ${requirements.industry} experience (${skillValue}/5) - critical sector`
    );
  }

  return { score, flags };
}

function scoreAvailability(
  capacity: CapacitySnapshot,
  neededMonthlyHrs: number,
  totalCapacity: number
): { score: number; flags: string[] } {
  const flags: string[] = [];
  const remaining = capacity.availableHrs;
  const neededWeekly = neededMonthlyHrs / 4.33;

  if (neededWeekly > remaining) {
    const overloadPct = ((neededWeekly - remaining) / neededWeekly) * 100;
    flags.push(
      `Would exceed capacity by ${overloadPct.toFixed(0)}% (needs ${neededWeekly.toFixed(1)}h/wk, has ${remaining.toFixed(1)}h available)`
    );
    return { score: Math.max(0, (1 - (neededWeekly - remaining) / neededWeekly) * 50), flags };
  }

  const headroom = (remaining - neededWeekly) / (totalCapacity / 4.33);
  return { score: Math.min(100, 60 + headroom * 200), flags };
}

function scoreDaytime(isDaytimeAvailable: boolean): number {
  return isDaytimeAvailable ? 100 : 30;
}

function scoreDemanding(
  skills: Record<SkillKey, number>,
  isDemanding: boolean
): { score: number; flags: string[] } {
  const flags: string[] = [];
  if (!isDemanding) return { score: 80, flags };

  const skillValue = skills.demanding_clients ?? 0;
  const score = (skillValue / 5) * 100;
  if (skillValue < 3) {
    flags.push(`Low demanding client tolerance (${skillValue}/5)`);
  }
  return { score, flags };
}

function scoreComplexity(
  skills: Record<SkillKey, number>,
  complexityLevel: "low" | "medium" | "high"
): { score: number; flags: string[] } {
  const flags: string[] = [];
  const thresholdMap = { low: 1, medium: 3, high: 4 };
  const threshold = thresholdMap[complexityLevel];
  const skill = skills.complex_bookkeeping ?? 0;

  if (skill >= threshold) {
    return { score: Math.min(100, (skill / 5) * 100 + 20), flags };
  }

  flags.push(
    `Complexity skill (${skill}/5) below ${complexityLevel} threshold (${threshold})`
  );
  return { score: Math.max(0, (skill / threshold) * 60), flags };
}

function scoreSoftware(
  skills: Record<SkillKey, number>,
  software: "qbo" | "xero" | "other"
): { score: number; flags: string[] } {
  const flags: string[] = [];
  if (software === "other") return { score: 70, flags };

  const skillKey: SkillKey = software === "qbo" ? "qbo" : "xero";
  const skillValue = skills[skillKey] ?? 0;
  const score = (skillValue / 5) * 100;

  if (skillValue < 3) {
    flags.push(
      `Limited ${software.toUpperCase()} experience (${skillValue}/5)`
    );
  }
  return { score, flags };
}

// ─── Main Scoring Engine ─────────────────────────────────────────────────────

export function scoreBookkeeper(
  data: BookkeeperData,
  requirements: ClientRequirements,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoringResult {
  const { member, skills, capacity } = data;
  const flags: string[] = [];

  // Hard constraints
  if (!member.assignable) {
    return createDisqualifiedResult(data, requirements, "Not assignable to new work");
  }
  if (!member.isActive) {
    return createDisqualifiedResult(data, requirements, "Not currently active");
  }

  const isOnProbation =
    member.probationUntil && new Date(member.probationUntil) > new Date();

  if (isOnProbation && requirements.isDemanding) {
    return createDisqualifiedResult(
      data,
      requirements,
      "On probation - cannot be assigned to demanding clients"
    );
  }

  // Score each factor
  const sector = scoreSectorExperience(skills, requirements);
  const availability = scoreAvailability(
    capacity,
    requirements.estimatedMonthlyHours,
    Number(member.weeklyCapacityHrs) * 4.33
  );
  const daytime = scoreDaytime(member.daytimeAvailable ?? true);
  const demanding = scoreDemanding(skills, requirements.isDemanding);
  const complexity = scoreComplexity(skills, requirements.complexityLevel);
  const tech = { score: ((skills.tech_ability ?? 0) / 5) * 100, flags: [] as string[] };
  const software = scoreSoftware(skills, requirements.accountingSoftware);
  const personality = { score: 70 }; // Default, manually adjustable

  // Collect all flags
  flags.push(
    ...sector.flags,
    ...availability.flags,
    ...demanding.flags,
    ...complexity.flags,
    ...tech.flags,
    ...software.flags
  );

  const breakdown: Record<string, number> = {
    sector_experience: Math.round(sector.score),
    availability: Math.round(availability.score),
    daytime: Math.round(daytime),
    demanding: Math.round(demanding.score),
    complexity: Math.round(complexity.score),
    personality: Math.round(personality.score),
    tech: Math.round(tech.score),
    software: Math.round(software.score),
  };

  // Weighted total
  const totalWeights = Object.values(weights).reduce((a, b) => a + b, 0);
  let totalScore =
    (sector.score * weights.sector_experience +
      availability.score * weights.availability +
      daytime * weights.daytime +
      demanding.score * weights.demanding +
      complexity.score * weights.complexity +
      personality.score * weights.personality +
      tech.score * weights.tech +
      software.score * weights.software) /
    totalWeights;

  // Probation modifier
  let suggestedRole: "lead" | "supporting" = "lead";
  if (isOnProbation) {
    totalScore = Math.min(totalScore, 75);
    flags.push("On probation - must pair with experienced lead bookkeeper");
    suggestedRole = "supporting";
  }

  // Compute capacity after
  const weeklyNeeded = requirements.estimatedMonthlyHours / 4.33;
  const capacityAfter: CapacitySnapshot = {
    totalCapacityHrs: capacity.totalCapacityHrs,
    committedHrs: capacity.committedHrs + weeklyNeeded,
    internalHrs: capacity.internalHrs,
    availableHrs: capacity.availableHrs - weeklyNeeded,
    utilizationPct:
      ((capacity.committedHrs + weeklyNeeded + capacity.internalHrs) /
        capacity.totalCapacityHrs) *
      100,
  };

  if (capacityAfter.utilizationPct > 90) {
    flags.push(
      `Would push utilization to ${capacityAfter.utilizationPct.toFixed(0)}% (overloaded)`
    );
  }

  return {
    teamMemberId: member.id,
    teamMemberName: member.fullName,
    totalScore: Math.round(totalScore),
    breakdown,
    flags,
    capacityBefore: capacity,
    capacityAfter,
    suggestedRole,
    disqualified: false,
  };
}

function createDisqualifiedResult(
  data: BookkeeperData,
  requirements: ClientRequirements,
  reason: string
): ScoringResult {
  const weeklyNeeded = requirements.estimatedMonthlyHours / 4.33;
  return {
    teamMemberId: data.member.id,
    teamMemberName: data.member.fullName,
    totalScore: 0,
    breakdown: {},
    flags: [reason],
    capacityBefore: data.capacity,
    capacityAfter: {
      ...data.capacity,
      committedHrs: data.capacity.committedHrs + weeklyNeeded,
      availableHrs: data.capacity.availableHrs - weeklyNeeded,
      utilizationPct:
        ((data.capacity.committedHrs + weeklyNeeded + data.capacity.internalHrs) /
          data.capacity.totalCapacityHrs) *
        100,
    },
    suggestedRole: "supporting",
    disqualified: true,
    disqualifyReason: reason,
  };
}

// ─── Catch-Up Feasibility ────────────────────────────────────────────────────

export function assessCatchUpFeasibility(
  topCandidates: ScoringResult[],
  catchUpHours: number,
  catchUpWeeks: number
): CatchUpFeasibility {
  const weeklyNeeded = catchUpHours / catchUpWeeks;
  const topCandidate = topCandidates[0];

  if (!topCandidate) {
    return {
      feasible: false,
      weeklyHoursNeeded: weeklyNeeded,
      availableWeeklyHours: 0,
      riskLevel: "high",
    };
  }

  const available = topCandidate.capacityBefore.availableHrs;

  if (weeklyNeeded <= available * 0.7) {
    return {
      feasible: true,
      weeklyHoursNeeded: weeklyNeeded,
      availableWeeklyHours: available,
      riskLevel: "low",
    };
  }

  if (weeklyNeeded <= available) {
    return {
      feasible: true,
      weeklyHoursNeeded: weeklyNeeded,
      availableWeeklyHours: available,
      riskLevel: "medium",
    };
  }

  // Needs to be split
  const suggestedSplit: CatchUpFeasibility["suggestedSplit"] = [];
  let remaining = weeklyNeeded;

  for (const candidate of topCandidates) {
    if (remaining <= 0) break;
    const canTake = Math.min(
      remaining,
      candidate.capacityBefore.availableHrs * 0.8
    );
    if (canTake > 0) {
      suggestedSplit.push({
        memberId: candidate.teamMemberId,
        memberName: candidate.teamMemberName,
        hours: Math.round(canTake * 10) / 10,
      });
      remaining -= canTake;
    }
  }

  return {
    feasible: remaining <= 0,
    weeklyHoursNeeded: weeklyNeeded,
    availableWeeklyHours: available,
    riskLevel: remaining > 0 ? "high" : "medium",
    suggestedSplit,
  };
}

// ─── Run Full New Client Scenario ────────────────────────────────────────────

export function runNewClientScenario(
  bookkeepers: BookkeeperData[],
  requirements: ClientRequirements,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): NewClientResult {
  const results = bookkeepers.map((bk) =>
    scoreBookkeeper(bk, requirements, weights)
  );

  // Sort: non-disqualified first by score descending
  const recommendations = results.sort((a, b) => {
    if (a.disqualified && !b.disqualified) return 1;
    if (!a.disqualified && b.disqualified) return -1;
    return b.totalScore - a.totalScore;
  });

  let catchUpFeasibility: CatchUpFeasibility | undefined;
  if (requirements.hasCatchUp && requirements.catchUpHours && requirements.catchUpWeeks) {
    const qualified = recommendations.filter((r) => !r.disqualified);
    catchUpFeasibility = assessCatchUpFeasibility(
      qualified,
      requirements.catchUpHours,
      requirements.catchUpWeeks
    );
  }

  return { recommendations, catchUpFeasibility };
}
