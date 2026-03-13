// Real data from BOS Client Assignment & Priorities spreadsheet
// This will be replaced with DB queries once the database is connected

export type SkillRatings = {
  demanding_clients: number;
  complex_bookkeeping: number;
  tech_ability: number;
  payroll: number;
  construction: number;
  non_profit: number;
  ecommerce: number;
  a2x_dext: number;
  xero: number;
  qbo: number;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  weeklyCapacity: number;
  monthlyCapacity: number;
  monthlyOngoingHrs: number;
  internalHrs: number;
  meetingHrs: number; // Client collaboration meeting hours (from spreadsheet col S)
  catchupMonthlyHrs: number; // Monthly catchup/setup hours (from spreadsheet summary)
  assignable: boolean;
  skills?: SkillRatings;
};

/** Skill data from BOS Bookkeeper skill profiles.xlsx */
export const teamSkillProfiles: Record<string, SkillRatings> = {
  ellen:    { demanding_clients: 4, complex_bookkeeping: 2, tech_ability: 3, payroll: 2, construction: 1, non_profit: 2, ecommerce: 0, a2x_dext: 0, xero: 3, qbo: 3 },
  kayla:    { demanding_clients: 5, complex_bookkeeping: 5, tech_ability: 5, payroll: 4, construction: 5, non_profit: 5, ecommerce: 4, a2x_dext: 0, xero: 4, qbo: 5 },
  dawn:     { demanding_clients: 4, complex_bookkeeping: 4, tech_ability: 5, payroll: 3, construction: 4, non_profit: 0, ecommerce: 0, a2x_dext: 0, xero: 0, qbo: 5 },
  shannon:  { demanding_clients: 5, complex_bookkeeping: 5, tech_ability: 5, payroll: 0, construction: 1, non_profit: 3, ecommerce: 1, a2x_dext: 5, xero: 5, qbo: 5 },
  terri:    { demanding_clients: 3, complex_bookkeeping: 3, tech_ability: 4, payroll: 5, construction: 0, non_profit: 0, ecommerce: 4, a2x_dext: 0, xero: 1, qbo: 4 },
  lynne:    { demanding_clients: 2, complex_bookkeeping: 4, tech_ability: 3, payroll: 3, construction: 0, non_profit: 0, ecommerce: 4, a2x_dext: 1, xero: 0, qbo: 5 },
  gurpreet: { demanding_clients: 3, complex_bookkeeping: 4, tech_ability: 3, payroll: 3, construction: 0, non_profit: 0, ecommerce: 0, a2x_dext: 0, xero: 0, qbo: 4 },
};

export type Client = {
  id: string;
  name: string;
  priority: string; // A, B, C
  status: string; // A = Active, N = Not active, P = Prospect/Onboarding
  leadBookkeeper: string | null;
  secondBookkeeper: string | null;
  oversight: string | null;
  totalMonthlyHrs: number;
  primaryHrs: number;
  secondHrs: number;
  oversightHrs: number;
  complexity: string | null;
  software: string | null;
  dextHubdoc: string | null;
  payrollSoftware: string | null;
  payrollBookkeeper: string | null;
  payrollHrs: number;
  yearEnd: string | null;
  catchUpHrs: number;
  notes: string | null;
  assignments: ClientAssignment[];
};

/** Build assignments array from flat client fields */
export function buildAssignmentsFromFlat(c: Omit<Client, "assignments">): ClientAssignment[] {
  const a: ClientAssignment[] = [];
  if (c.leadBookkeeper && c.primaryHrs > 0) a.push({ roleId: "lead", memberId: c.leadBookkeeper, hours: c.primaryHrs });
  if (c.secondBookkeeper && c.secondHrs > 0) a.push({ roleId: "supporting", memberId: c.secondBookkeeper, hours: c.secondHrs });
  if (c.oversight && c.oversightHrs > 0) a.push({ roleId: "oversight", memberId: c.oversight, hours: c.oversightHrs });
  if (c.payrollBookkeeper && c.payrollHrs > 0) a.push({ roleId: "payroll", memberId: c.payrollBookkeeper, hours: c.payrollHrs });
  return a;
}

/** Sync flat fields from assignments array — keeps backward compat with other pages */
export function syncFlatFieldsFromAssignments(client: Client): void {
  const lead = client.assignments.find((a) => a.roleId === "lead");
  const supporting = client.assignments.find((a) => a.roleId === "supporting");
  const oversight = client.assignments.find((a) => a.roleId === "oversight");
  const payroll = client.assignments.find((a) => a.roleId === "payroll");

  client.leadBookkeeper = lead?.memberId ?? null;
  client.primaryHrs = lead?.hours ?? 0;
  client.secondBookkeeper = supporting?.memberId ?? null;
  client.secondHrs = supporting?.hours ?? 0;
  client.oversight = oversight?.memberId ?? null;
  client.oversightHrs = oversight?.hours ?? 0;
  client.payrollBookkeeper = payroll?.memberId ?? null;
  client.payrollHrs = payroll?.hours ?? 0;
  client.totalMonthlyHrs = client.assignments.reduce((sum, a) => sum + a.hours, 0);
}

export type Assignment = {
  teamMemberId: string;
  clientId: string;
  role: string;
  hours: number;
};

export type ClientAssignment = {
  roleId: string;
  memberId: string;
  hours: number;
};

// ─── Assignment Roles ─────────────────────────────────────────────────────────

export type AssignmentRole = {
  id: string;
  name: string;
  color: string;
  isBuiltIn: boolean;
};

export const defaultAssignmentRoles: AssignmentRole[] = [
  { id: "lead", name: "Lead", color: "bg-blue-100 text-blue-800 border-blue-200", isBuiltIn: true },
  { id: "supporting", name: "Supporting", color: "bg-zinc-100 text-zinc-600 border-zinc-200", isBuiltIn: true },
  { id: "oversight", name: "Oversight", color: "bg-violet-100 text-violet-700 border-violet-200", isBuiltIn: true },
  { id: "payroll", name: "Payroll", color: "bg-amber-100 text-amber-700 border-amber-200", isBuiltIn: true },
];

export function getRoleColor(roleId: string, roles: AssignmentRole[] = defaultAssignmentRoles): string {
  const role = roles.find((r) => r.id === roleId);
  return role?.color ?? "bg-zinc-100 text-zinc-600 border-zinc-200";
}

export function getRoleName(roleId: string, roles: AssignmentRole[] = defaultAssignmentRoles): string {
  const role = roles.find((r) => r.id === roleId);
  return role?.name ?? roleId;
}

// ─── Internal Hours Categories & Breakdown ────────────────────────────────────

export const INTERNAL_CATEGORIES = [
  { id: "meetings", label: "Client Collaboration Meetings" },
  { id: "planning", label: "Planning Your Work" },
  { id: "pd", label: "Professional Development" },
  { id: "learning", label: "Learning Internal Systems" },
  { id: "correspondence", label: "Internal Collaboration/Correspondence" },
  { id: "marketing", label: "Marketing" },
] as const;

export type InternalCategoryId = (typeof INTERNAL_CATEGORIES)[number]["id"];

// Monthly internal hours per team member per category (from XLSX Internal Hours tab)
export const internalHoursBreakdown: Record<string, Record<InternalCategoryId, number>> = {
  kayla:    { meetings: 4, planning: 4, pd: 2.5, learning: 0, correspondence: 16, marketing: 0 },
  ellen:    { meetings: 2, planning: 4, pd: 2, learning: 0, correspondence: 4, marketing: 0 },
  shannon:  { meetings: 2, planning: 2, pd: 1, learning: 0, correspondence: 2, marketing: 0 },
  dawn:     { meetings: 2, planning: 2, pd: 1, learning: 4, correspondence: 2, marketing: 0 },
  terri:    { meetings: 2, planning: 2, pd: 1, learning: 4, correspondence: 2, marketing: 0 },
  lynne:    { meetings: 0.5, planning: 2, pd: 1, learning: 0, correspondence: 2, marketing: 0 },
  gurpreet: { meetings: 1, planning: 2.5, pd: 1.25, learning: 0, correspondence: 1, marketing: 0 },
  aldora:   { meetings: 1, planning: 2, pd: 1, learning: 4, correspondence: 2, marketing: 4 },
  kim:      { meetings: 0.5, planning: 0.5, pd: 0.5, learning: 0, correspondence: 1, marketing: 0 },
  farrell:  { meetings: 0, planning: 2, pd: 1, learning: 0, correspondence: 2, marketing: 0 },
  sunny:    { meetings: 0, planning: 0, pd: 0, learning: 0, correspondence: 0, marketing: 0 },
  pat:      { meetings: 0, planning: 0, pd: 0, learning: 0, correspondence: 0, marketing: 0 },
};

// ─── PTO / Capacity Overrides ─────────────────────────────────────────────────

export type PtoOverride = {
  id: string;
  memberId: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  availableHrs: number;
  reason: string;
};

export const defaultPtoOverrides: PtoOverride[] = [
  { id: "pto1", memberId: "kayla", weekStart: "2026-03-23", availableHrs: 0, reason: "Vacation - Mexico" },
  { id: "pto2", memberId: "ellen", weekStart: "2026-03-30", availableHrs: 17.5, reason: "Half week - personal" },
];

export const teamMembers: TeamMember[] = [
  { id: "kayla", name: "Kayla Puhov", role: "Bookkeeper", weeklyCapacity: 50, monthlyCapacity: 200, monthlyOngoingHrs: 141.35, internalHrs: 26.5, meetingHrs: 3.9, catchupMonthlyHrs: 40.0, assignable: true, skills: teamSkillProfiles.kayla },
  { id: "ellen", name: "Ellen Kuipers", role: "Bookkeeper", weeklyCapacity: 35, monthlyCapacity: 140, monthlyOngoingHrs: 121.86, internalHrs: 12, meetingHrs: 3.8, catchupMonthlyHrs: 20.0, assignable: true, skills: teamSkillProfiles.ellen },
  { id: "shannon", name: "Shannon Shier", role: "Bookkeeper", weeklyCapacity: 60, monthlyCapacity: 240, monthlyOngoingHrs: 91.95, internalHrs: 7, meetingHrs: 1.0, catchupMonthlyHrs: 60.0, assignable: true, skills: teamSkillProfiles.shannon },
  { id: "dawn", name: "Dawn Thompson", role: "Bookkeeper", weeklyCapacity: 25, monthlyCapacity: 100, monthlyOngoingHrs: 80.78, internalHrs: 11, meetingHrs: 0, catchupMonthlyHrs: 74.0, assignable: true, skills: teamSkillProfiles.dawn },
  { id: "terri", name: "Terri McNamara", role: "Bookkeeper", weeklyCapacity: 20, monthlyCapacity: 80, monthlyOngoingHrs: 63.17, internalHrs: 11, meetingHrs: 0.4, catchupMonthlyHrs: 0, assignable: true, skills: teamSkillProfiles.terri },
  { id: "lynne", name: "Lynne Brocklehurst", role: "Bookkeeper", weeklyCapacity: 15, monthlyCapacity: 60, monthlyOngoingHrs: 19.65, internalHrs: 5.5, meetingHrs: 0.3, catchupMonthlyHrs: 28.0, assignable: false, skills: teamSkillProfiles.lynne },
  { id: "gurpreet", name: "Gurpreet Kaur", role: "Bookkeeper", weeklyCapacity: 10, monthlyCapacity: 40, monthlyOngoingHrs: 15.08, internalHrs: 5.75, meetingHrs: 0.2, catchupMonthlyHrs: 0, assignable: false, skills: teamSkillProfiles.gurpreet },
  { id: "aldora", name: "Aldora", role: "Bookkeeper", weeklyCapacity: 10, monthlyCapacity: 40, monthlyOngoingHrs: 17, internalHrs: 14, meetingHrs: 0, catchupMonthlyHrs: 0, assignable: false },
  { id: "kim", name: "Kim", role: "Bookkeeper", weeklyCapacity: 5, monthlyCapacity: 20, monthlyOngoingHrs: 11.15, internalHrs: 2.5, meetingHrs: 0.2, catchupMonthlyHrs: 0, assignable: false },
  { id: "farrell", name: "Farrell", role: "Bookkeeper", weeklyCapacity: 10, monthlyCapacity: 40, monthlyOngoingHrs: 5.43, internalHrs: 5, meetingHrs: 0, catchupMonthlyHrs: 0, assignable: false },
  { id: "sunny", name: "Sunny", role: "Oversight", weeklyCapacity: 10, monthlyCapacity: 40, monthlyOngoingHrs: 30.4, internalHrs: 0, meetingHrs: 0, catchupMonthlyHrs: 0, assignable: false },
  { id: "pat", name: "Pat", role: "Admin", weeklyCapacity: 15, monthlyCapacity: 60, monthlyOngoingHrs: 2.8, internalHrs: 0, meetingHrs: 0.1, catchupMonthlyHrs: 0, assignable: false },
];

// The 5 assignable bookkeepers (for scenarios and capacity planning)
export const assignableMembers = teamMembers.filter((m) => m.assignable);

// Raw data without assignments — assignments populated below
const rawClients: Omit<Client, "assignments">[] = [
  { id: "c1", name: "351 East Orvis", priority: "B", status: "A", leadBookkeeper: "kim", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 1.7, primaryHrs: 1.3, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "Wagepoint", payrollBookkeeper: "kayla", payrollHrs: 0.15, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c2", name: "Aftermetoo", priority: "A", status: "A", leadBookkeeper: "kayla", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 9.7, primaryHrs: 9.05, secondHrs: 0, oversightHrs: 0.5, complexity: "Medium", software: "QBO", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "March 31", catchUpHrs: 0, notes: null },
  { id: "c3", name: "AlphaPlus", priority: "A", status: "A", leadBookkeeper: "kayla", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 10, primaryHrs: 5.35, secondHrs: 2, oversightHrs: 0.5, complexity: "Medium", software: "Xero", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 2, yearEnd: "March 31", catchUpHrs: 0, notes: null },
  { id: "c4", name: "Anthem Events Inc.", priority: "B", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 4.1, primaryHrs: 3.75, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "Xero", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "October 31", catchUpHrs: 0, notes: null },
  { id: "c5", name: "Brain Generative AI", priority: "B", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "sunny", oversight: "aldora", totalMonthlyHrs: 4.9, primaryHrs: 4.25, secondHrs: 0, oversightHrs: 0.5, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "June 30", catchUpHrs: 0, notes: "Transition to Ellen March" },
  { id: "c6", name: "Brainstorm - Graham Donald", priority: "B", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 6.2, primaryHrs: 5.05, secondHrs: 0.5, oversightHrs: 0.5, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "September 30", catchUpHrs: 0, notes: null },
  { id: "c7", name: "Canadian Friends of Bal-Illan", priority: "B", status: "N", leadBookkeeper: "lynne", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 5.2, primaryHrs: 4.54, secondHrs: 0, oversightHrs: 0.5, complexity: "Medium", software: "QBO", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "September 30", catchUpHrs: 0, notes: null },
  { id: "c8", name: "Captured in Paint (Joanne Hastie)", priority: "A", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 5.7, primaryHrs: 5.05, secondHrs: 0, oversightHrs: 0.5, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c9", name: "Caravel Business Advisors Inc.", priority: "C", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 1.7, primaryHrs: 1.45, secondHrs: 0, oversightHrs: 0.1, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c10", name: "Carbon One - Joseph Ianni", priority: "C", status: "A", leadBookkeeper: "farrell", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 0.42, primaryHrs: 0.37, secondHrs: 0, oversightHrs: 0, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c11", name: "Carroll's Animal Sanctuary", priority: "B", status: "A", leadBookkeeper: "kim", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 2.3, primaryHrs: 2.15, secondHrs: 0, oversightHrs: 0.1, complexity: "Low", software: "Xero", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "September 30", catchUpHrs: 0, notes: null },
  { id: "c12", name: "CrossTown Psychology", priority: "B", status: "A", leadBookkeeper: "gurpreet", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 3.2, primaryHrs: 2.85, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "QBO", dextHubdoc: null, payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 0, notes: null },
  { id: "c13", name: "Daily Health Nutrition", priority: "B", status: "A", leadBookkeeper: "lynne", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 3.7, primaryHrs: 3.3, secondHrs: 0, oversightHrs: 0.25, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: "e-commerce, A2X" },
  { id: "c14", name: "Dynasty Sportwear Inc", priority: "A", status: "N", leadBookkeeper: "terri", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 9.5, primaryHrs: 7.89, secondHrs: 0, oversightHrs: 0.83, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "Wagepoint", payrollBookkeeper: "terri", payrollHrs: 0.36, yearEnd: "June 30", catchUpHrs: 31, notes: null },
  { id: "c15", name: "Elite Soccer Clinics", priority: "C", status: "N", leadBookkeeper: "ellen", secondBookkeeper: "farrell", oversight: "sunny", totalMonthlyHrs: 3.4, primaryHrs: 2.75, secondHrs: 0, oversightHrs: 0.5, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: "Transition to Ellen March" },
  { id: "c16", name: "Fireweed Entertainment", priority: "C", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 1.66, primaryHrs: 1.51, secondHrs: 0, oversightHrs: 0.1, complexity: "Low", software: "QBO", dextHubdoc: null, payrollSoftware: "Wagepoint", payrollBookkeeper: null, payrollHrs: 0, yearEnd: "January 31", catchUpHrs: 0, notes: null },
  { id: "c17", name: "Food For The Poor (NFP)", priority: "A", status: "A", leadBookkeeper: "kayla", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 9.3, primaryHrs: 8.3, secondHrs: 0, oversightHrs: 0.5, complexity: "High", software: "QBO", dextHubdoc: "Hubdoc", payrollSoftware: "Wagepoint", payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c18", name: "Fuse Insights - Nick Drew", priority: "C", status: "A", leadBookkeeper: "gurpreet", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 2.23, primaryHrs: 1.98, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c19", name: "Genwell Foundation", priority: "A", status: "A", leadBookkeeper: "kayla", secondBookkeeper: null, oversight: "sunny", totalMonthlyHrs: 8.5, primaryHrs: 7.5, secondHrs: 0, oversightHrs: 0.5, complexity: "High", software: "Xero", dextHubdoc: "Hubdoc", payrollSoftware: "Wagepoint", payrollBookkeeper: "kayla", payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c20", name: "Hendrika Spoelstra - Jordan Spoelstra", priority: "B", status: "A", leadBookkeeper: "pat", secondBookkeeper: null, oversight: null, totalMonthlyHrs: 2.8, primaryHrs: 2.75, secondHrs: 0, oversightHrs: 0, complexity: "Low", software: "Excel", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "N/A", catchUpHrs: 0, notes: null },
  { id: "c21", name: "HKM Studio", priority: "B", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 4.88, primaryHrs: 4.53, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "Xero", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c22", name: "Humanist Canada", priority: "B", status: "A", leadBookkeeper: "kim", secondBookkeeper: null, oversight: null, totalMonthlyHrs: 5.3, primaryHrs: 5.05, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "QBO", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c23", name: "Hybrid Ideas - Simon Cooper", priority: "C", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 4.4, primaryHrs: 4.25, secondHrs: 0, oversightHrs: 0.1, complexity: "Low", software: "Xero", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c24", name: "Junction Collective", priority: "B", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 2.8, primaryHrs: 2.05, secondHrs: 0, oversightHrs: 0.25, complexity: "Low", software: "Xero", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "April 30", catchUpHrs: 0, notes: null },
  { id: "c25", name: "Kaven Construction & Renovations", priority: "A", status: "A", leadBookkeeper: "kayla", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 9.4, primaryHrs: 5.4, secondHrs: 0, oversightHrs: 0.5, complexity: "High", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "Wagepoint", payrollBookkeeper: "kayla", payrollHrs: 2, yearEnd: "October 31", catchUpHrs: 0, notes: null },
  { id: "c26", name: "Kerstens Bau", priority: "B", status: "N", leadBookkeeper: "ellen", secondBookkeeper: "lynne", oversight: "sunny", totalMonthlyHrs: 3.25, primaryHrs: 3.05, secondHrs: 0, oversightHrs: 0.2, complexity: "Medium", software: "Xero", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "September 30", catchUpHrs: 0, notes: null },
  { id: "c27", name: "Kingsway Kennels", priority: "B", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 3.3, primaryHrs: 3.1, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "Xero", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "January 31", catchUpHrs: 0, notes: null },
  { id: "c28", name: "Lateral Kindness", priority: "C", status: "N", leadBookkeeper: "ellen", secondBookkeeper: "lynne", oversight: "sunny", totalMonthlyHrs: 4.5, primaryHrs: 3.6, secondHrs: 0, oversightHrs: 0.4, complexity: "Low", software: "QBO", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "January 31", catchUpHrs: 0, notes: null },
  { id: "c29", name: "Mara Pollock Professional Corp.", priority: "C", status: "N", leadBookkeeper: "lynne", secondBookkeeper: null, oversight: "sunny", totalMonthlyHrs: 2.7, primaryHrs: 2.5, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "QBO", dextHubdoc: null, payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 0, notes: null },
  { id: "c30", name: "Massage At Work", priority: "B", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 3, primaryHrs: 2.8, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c31", name: "MedTach", priority: "B", status: "A", leadBookkeeper: "shannon", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 3.4, primaryHrs: 3.2, secondHrs: 0, oversightHrs: 0.2, complexity: "Medium", software: "Xero", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c32", name: "Nada Toothbrush (GrinBrush)", priority: "C", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 4.4, primaryHrs: 4.2, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "Xero", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c33", name: "Ogilvie Barsness Financial Services", priority: "A", status: "A", leadBookkeeper: "kayla", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 7.7, primaryHrs: 5.7, secondHrs: 0, oversightHrs: 0.5, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "kayla", payrollBookkeeper: null, payrollHrs: 1, yearEnd: "May 31", catchUpHrs: 0, notes: null },
  { id: "c34", name: "Orangetheory Fitness", priority: "A", status: "A", leadBookkeeper: "kayla", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 19.5, primaryHrs: 17.5, secondHrs: 0, oversightHrs: 2, complexity: "High", software: "Xero", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "August 31", catchUpHrs: 0, notes: "3 companies combined" },
  { id: "c35", name: "PMI Group", priority: "A", status: "N", leadBookkeeper: "kayla", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 13.3, primaryHrs: 6.8, secondHrs: 6.5, oversightHrs: 0, complexity: "High", software: null, dextHubdoc: null, payrollSoftware: "Wagepoint", payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 0, notes: "Payroll Only" },
  { id: "c36", name: "Powered By Search", priority: "B", status: "A", leadBookkeeper: "eryn", secondBookkeeper: null, oversight: null, totalMonthlyHrs: 7, primaryHrs: 7, secondHrs: 0, oversightHrs: 0, complexity: "Low", software: "QBO", dextHubdoc: null, payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 0, notes: null },
  { id: "c37", name: "PSBX (Tova & Baron Manett)", priority: "B", status: "A", leadBookkeeper: "kayla", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 5.5, primaryHrs: 5.3, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "Wagepoint", payrollBookkeeper: null, payrollHrs: 0, yearEnd: "April 30", catchUpHrs: 0, notes: null },
  { id: "c38", name: "Reimer Associates", priority: "B", status: "N", leadBookkeeper: "kayla", secondBookkeeper: "dawn", oversight: "sunny", totalMonthlyHrs: 4, primaryHrs: 3.75, secondHrs: 0, oversightHrs: 0.25, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c39", name: "Rose Orchestra", priority: "A", status: "N", leadBookkeeper: "ellen", secondBookkeeper: "lynne", oversight: "sunny", totalMonthlyHrs: 13.5, primaryHrs: 13, secondHrs: 0, oversightHrs: 0.5, complexity: "High", software: null, dextHubdoc: null, payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "June 30", catchUpHrs: 0, notes: "Seasonal client" },
  { id: "c40", name: "Saddle Fit 4 Life", priority: "B", status: "A", leadBookkeeper: "kayla", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 4.7, primaryHrs: 4.4, secondHrs: 0, oversightHrs: 0.3, complexity: "Low", software: "Xero", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "July 30", catchUpHrs: 0, notes: null },
  { id: "c41", name: "Scott Carpentier - Investagain", priority: "B", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 3.5, primaryHrs: 3.3, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "Xero", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "November 30", catchUpHrs: 0, notes: null },
  { id: "c42", name: "Scott Harris - Harris Private Legacy", priority: "A", status: "A", leadBookkeeper: "shannon", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 1.8, primaryHrs: 1.7, secondHrs: 0, oversightHrs: 0.1, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "June 30", catchUpHrs: 0, notes: null },
  { id: "c43", name: "Scott Harris - Majama Holdings", priority: "A", status: "A", leadBookkeeper: "shannon", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 1.5, primaryHrs: 1.4, secondHrs: 0, oversightHrs: 0.1, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "June 30", catchUpHrs: 0, notes: null },
  { id: "c44", name: "Scott Harris - Scott D. Harris", priority: "A", status: "A", leadBookkeeper: "shannon", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 0.8, primaryHrs: 0.7, secondHrs: 0, oversightHrs: 0.1, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c45", name: "Scott Harris - Stonehaven Financial", priority: "A", status: "A", leadBookkeeper: "shannon", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 12, primaryHrs: 8.5, secondHrs: 3, oversightHrs: 0.5, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "June 30", catchUpHrs: 0, notes: null },
  { id: "c46", name: "SHIFT Collaborative", priority: "C", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 1.83, primaryHrs: 1.63, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "QBO", dextHubdoc: null, payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "November 30", catchUpHrs: 0, notes: null },
  { id: "c47", name: "Southcote Construction & Consulting", priority: "C", status: "A", leadBookkeeper: "dawn", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 10.1, primaryHrs: 9.1, secondHrs: 0, oversightHrs: 0.5, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c48", name: "Swing Golf Lounge", priority: "B", status: "A", leadBookkeeper: "gurpreet", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 4.5, primaryHrs: 4.3, secondHrs: 0, oversightHrs: 0.2, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "July 30", catchUpHrs: 0, notes: null },
  { id: "c49", name: "TruTech Pest & Wildlife Control", priority: "A", status: "N", leadBookkeeper: "shannon", secondBookkeeper: "farrell", oversight: "sunny", totalMonthlyHrs: 12.8, primaryHrs: 7.11, secondHrs: 0, oversightHrs: 1, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "Bi-weekly", payrollBookkeeper: null, payrollHrs: 4.19, yearEnd: "October 31", catchUpHrs: 15, notes: null },
  { id: "c50", name: "Unbound Media", priority: "A", status: "N", leadBookkeeper: "ellen", secondBookkeeper: "farrell", oversight: "sunny", totalMonthlyHrs: 8, primaryHrs: 6.84, secondHrs: 0, oversightHrs: 0.5, complexity: "Medium", software: "Xero", dextHubdoc: "Hubdoc", payrollSoftware: "Bi-weekly", payrollBookkeeper: "ellen", payrollHrs: 0.5, yearEnd: "September 30", catchUpHrs: 0, notes: null },
  { id: "c51", name: "Urban Bounty", priority: "B", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 7.5, primaryHrs: 6.85, secondHrs: 0, oversightHrs: 0.15, complexity: "Low", software: "QBO", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "March 31", catchUpHrs: 0, notes: null },
  { id: "c52", name: "Urgent Action Fund Latin America", priority: "A", status: "A", leadBookkeeper: "ellen", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 5.4, primaryHrs: 4.4, secondHrs: 0, oversightHrs: 0.5, complexity: "Medium", software: "QBO", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c53", name: "Venture Creative", priority: "A", status: "A", leadBookkeeper: "kayla", secondBookkeeper: "ellen", oversight: "sunny", totalMonthlyHrs: 10.35, primaryHrs: 8.73, secondHrs: 0, oversightHrs: 0.5, complexity: "Medium", software: "Xero", dextHubdoc: "Dext", payrollSoftware: "Wagepoint", payrollBookkeeper: "kayla", payrollHrs: 1.12, yearEnd: "December 31", catchUpHrs: 0, notes: null },
  { id: "c54", name: "Vina Roofing", priority: "A", status: "N", leadBookkeeper: "dawn", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 6, primaryHrs: 5.33, secondHrs: 0, oversightHrs: 0.67, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 0, notes: "Seasonal Hours (11hrs/month in summer)" },
  { id: "c55", name: "Wachter Content", priority: "A", status: "N", leadBookkeeper: "shannon", secondBookkeeper: "dawn", oversight: "sunny", totalMonthlyHrs: 8.5, primaryHrs: 7.3, secondHrs: 0, oversightHrs: 0.7, complexity: "Medium", software: "Xero", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: "December 31", catchUpHrs: 81, notes: null },
  { id: "c56", name: "Yukon Public Legal Education Assoc.", priority: "B", status: "N", leadBookkeeper: "ellen", secondBookkeeper: "farrell", oversight: "sunny", totalMonthlyHrs: 3.3, primaryHrs: 1.63, secondHrs: 0, oversightHrs: 0.3, complexity: "Low", software: "QBO", dextHubdoc: "Hubdoc", payrollSoftware: "Wagepoint", payrollBookkeeper: "ellen", payrollHrs: 0.87, yearEnd: "March 31", catchUpHrs: 0, notes: null },
  { id: "c57", name: "LiveActive Sport Medicine", priority: "A", status: "N", leadBookkeeper: "shannon", secondBookkeeper: "aldora", oversight: "sunny", totalMonthlyHrs: 11.1, primaryHrs: 8.6, secondHrs: 2, oversightHrs: 0.5, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 0, notes: "3 Locations" },
  { id: "c58", name: "Assante Wealth Mgmt", priority: "A", status: "N", leadBookkeeper: "dawn", secondBookkeeper: "terri", oversight: "sunny", totalMonthlyHrs: 6.03, primaryHrs: 5.11, secondHrs: 0, oversightHrs: 0.25, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "Knit", payrollBookkeeper: null, payrollHrs: 0.67, yearEnd: null, catchUpHrs: 67, notes: null },
  { id: "c59", name: "Psycura", priority: "A", status: "N", leadBookkeeper: "ellen", secondBookkeeper: "dawn", oversight: "aldora", totalMonthlyHrs: 2.04, primaryHrs: 1.79, secondHrs: 0, oversightHrs: 0.25, complexity: "Low", software: "Xero", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 0, notes: null },
  { id: "c60", name: "OrthoMD", priority: "A", status: "N", leadBookkeeper: "shannon", secondBookkeeper: "dawn", oversight: "sunny", totalMonthlyHrs: 9.7, primaryHrs: 8.87, secondHrs: 0, oversightHrs: 0.83, complexity: "Medium", software: "Xero", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 23, notes: null },
  // Prospect / Onboarding clients
  { id: "c61", name: "Mobilizz", priority: "A", status: "P", leadBookkeeper: "dawn", secondBookkeeper: "shannon", oversight: "sunny", totalMonthlyHrs: 18.5, primaryHrs: 16.07, secondHrs: 0, oversightHrs: 0.83, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "QBO Payroll", payrollBookkeeper: "terri", payrollHrs: 1.6, yearEnd: null, catchUpHrs: 32, notes: null },
  { id: "c62", name: "Premier Siding", priority: "A", status: "P", leadBookkeeper: "dawn", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 20, primaryHrs: 19, secondHrs: 0, oversightHrs: 1, complexity: "High", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "Wagepoint", payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 67, notes: "Owned by the same owner" },
  { id: "c63", name: "Modern Home Exteriors", priority: "A", status: "P", leadBookkeeper: "dawn", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 6, primaryHrs: 5.17, secondHrs: 0, oversightHrs: 0.83, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 33, notes: "Owned by the same owner" },
  { id: "c64", name: "Tibbits Hill Farms", priority: "B", status: "P", leadBookkeeper: "lynne", secondBookkeeper: null, oversight: "sunny", totalMonthlyHrs: 1.7, primaryHrs: 1.6, secondHrs: 0, oversightHrs: 0.1, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 7, notes: "Owned by the same owner" },
  { id: "c65", name: "Charke Investments", priority: "B", status: "P", leadBookkeeper: "lynne", secondBookkeeper: null, oversight: "sunny", totalMonthlyHrs: 2, primaryHrs: 1.9, secondHrs: 0, oversightHrs: 0.1, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 7, notes: "Owned by the same owner" },
  { id: "c66", name: "Done Right Roofing", priority: "A", status: "P", leadBookkeeper: "dawn", secondBookkeeper: null, oversight: "sunny", totalMonthlyHrs: 19, primaryHrs: 9.5, secondHrs: 0, oversightHrs: 0.5, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "Wagepoint", payrollBookkeeper: "terri", payrollHrs: 9, yearEnd: null, catchUpHrs: 120, notes: "Onboarding in April. 10 weeks to complete catchup work" },
  { id: "c67", name: "Prison Fellowship", priority: "A", status: "P", leadBookkeeper: "terri", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 42, primaryHrs: 28.7, secondHrs: 10, oversightHrs: 3.3, complexity: "High", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 115, notes: null },
  { id: "c68", name: "Camp Culture Holdings", priority: "A", status: "P", leadBookkeeper: "shannon", secondBookkeeper: null, oversight: "sunny", totalMonthlyHrs: 9.1, primaryHrs: 8.27, secondHrs: 0, oversightHrs: 0.83, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 183, notes: null },
  { id: "c69", name: "Cedar Grove Wellness", priority: "B", status: "P", leadBookkeeper: "ellen", secondBookkeeper: null, oversight: "aldora", totalMonthlyHrs: 3.2, primaryHrs: 3.05, secondHrs: 0, oversightHrs: 0.83, complexity: "Low", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 15, notes: null },
  { id: "c70", name: "Statistical Society Of Canada", priority: "A", status: "P", leadBookkeeper: "shannon", secondBookkeeper: "kayla", oversight: "sunny", totalMonthlyHrs: 13, primaryHrs: 12.33, secondHrs: 0, oversightHrs: 0.67, complexity: "Medium", software: "QBO", dextHubdoc: "Hubdoc", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 19, notes: null },
  { id: "c71", name: "Your Local Farmers Market Society", priority: "A", status: "P", leadBookkeeper: null, secondBookkeeper: "dawn", oversight: "sunny", totalMonthlyHrs: 40, primaryHrs: 28.33, secondHrs: 0, oversightHrs: 0.83, complexity: "High", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "Payworks", payrollBookkeeper: null, payrollHrs: 10.84, yearEnd: null, catchUpHrs: 36, notes: null },
  { id: "c72", name: "Independance Electric", priority: "C", status: "P", leadBookkeeper: "ellen", secondBookkeeper: null, oversight: "aldora", totalMonthlyHrs: 2.4, primaryHrs: 2.3, secondHrs: 0, oversightHrs: 0.1, complexity: "Low", software: null, dextHubdoc: null, payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 28, notes: null },
  { id: "c73", name: "DataWorks", priority: "A", status: "P", leadBookkeeper: "shannon", secondBookkeeper: "dawn", oversight: "sunny", totalMonthlyHrs: 9.4, primaryHrs: 4.37, secondHrs: 0, oversightHrs: 0.83, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: "Wagepoint", payrollBookkeeper: "terri", payrollHrs: 4.2, yearEnd: null, catchUpHrs: 30, notes: null },
  { id: "c74", name: "Alberta Aviation Society", priority: "A", status: "P", leadBookkeeper: "kayla", secondBookkeeper: null, oversight: "sunny", totalMonthlyHrs: 6, primaryHrs: 6, secondHrs: 0, oversightHrs: 0, complexity: "Medium", software: null, dextHubdoc: null, payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 0, notes: "19 hrs HIGH (Apr.May) / 6 Low" },
  { id: "c75", name: "Canada Gaming Computer", priority: "A", status: "P", leadBookkeeper: "shannon", secondBookkeeper: null, oversight: "sunny", totalMonthlyHrs: 11.6, primaryHrs: 11.6, secondHrs: 0, oversightHrs: 0, complexity: "Medium", software: "QBO", dextHubdoc: "Dext", payrollSoftware: null, payrollBookkeeper: null, payrollHrs: 0, yearEnd: null, catchUpHrs: 0, notes: null },
];

// Populate assignments from flat fields
export const clients: Client[] = rawClients.map((c) => ({
  ...c,
  assignments: buildAssignmentsFromFlat(c),
}));

// Helper: get all active clients (Active or Not-active, excluding Prospects)
export const activeClients = clients.filter((c) => c.status === "A" || c.status === "N");
export const prospectClients = clients.filter((c) => c.status === "P");

// Helper: compute hours per team member from client data
export function getTeamMemberClientHours(memberId: string): number {
  return clients
    .filter((c) => c.status !== "P") // exclude prospects
    .reduce((sum, c) => {
      let hrs = 0;
      if (c.leadBookkeeper === memberId) hrs += c.primaryHrs;
      if (c.secondBookkeeper === memberId) hrs += c.secondHrs;
      if (c.oversight === memberId) hrs += c.oversightHrs;
      if (c.payrollBookkeeper === memberId) hrs += c.payrollHrs;
      return sum + hrs;
    }, 0);
}

// Helper: get number of clients per team member
export function getTeamMemberClientCount(memberId: string): number {
  return clients
    .filter((c) => c.status !== "P")
    .filter((c) => c.leadBookkeeper === memberId || c.secondBookkeeper === memberId)
    .length;
}

// Status labels
export const statusLabels: Record<string, string> = {
  A: "Active",
  N: "New",
  P: "Onboarding",
};

export const priorityLabels: Record<string, string> = {
  A: "A Tier",
  B: "B Tier",
  C: "C Tier",
  cc: "CC",
};
