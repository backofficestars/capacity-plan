"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SKILL_LABELS, type SkillKey } from "@/lib/db/schema";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientData } from "@/lib/client-data-context";

// Skill ratings per team member (will be stored in DB later)
const skillData: Record<string, Record<SkillKey, number>> = {
  kayla: { demanding_clients: 5, complex_bookkeeping: 5, tech_ability: 5, payroll: 4, construction: 5, non_profit: 5, ecommerce: 4, a2x_dext: 0, xero: 4, qbo: 5 },
  ellen: { demanding_clients: 4, complex_bookkeeping: 2, tech_ability: 3, payroll: 2, construction: 1, non_profit: 2, ecommerce: 0, a2x_dext: 0, xero: 3, qbo: 3 },
  shannon: { demanding_clients: 5, complex_bookkeeping: 5, tech_ability: 5, payroll: 0, construction: 1, non_profit: 3, ecommerce: 1, a2x_dext: 5, xero: 5, qbo: 5 },
  dawn: { demanding_clients: 4, complex_bookkeeping: 4, tech_ability: 5, payroll: 3, construction: 4, non_profit: 0, ecommerce: 0, a2x_dext: 0, xero: 0, qbo: 5 },
  terri: { demanding_clients: 3, complex_bookkeeping: 3, tech_ability: 4, payroll: 5, construction: 0, non_profit: 0, ecommerce: 4, a2x_dext: 0, xero: 1, qbo: 4 },
  lynne: { demanding_clients: 2, complex_bookkeeping: 2, tech_ability: 2, payroll: 1, construction: 0, non_profit: 3, ecommerce: 0, a2x_dext: 0, xero: 0, qbo: 3 },
  gurpreet: { demanding_clients: 2, complex_bookkeeping: 2, tech_ability: 3, payroll: 0, construction: 0, non_profit: 0, ecommerce: 0, a2x_dext: 0, xero: 0, qbo: 3 },
};

// ─── Survey profile data (from March 2026 Bookkeeper Skills survey) ─────────

type SurveyProfile = {
  experience: string;
  certifications: string;
  industries: string;
  ecommerceDetail: string;
  nonprofitLevel: string;
  nonprofitDetail: string;
  enjoysmost: string;
  wantsToLearn: string;
  wantsMoreOf: string;
  wantsLessOf: string;
  otherNotes: string;
  payrollTasks: string;
  largestPayroll: string;
  payrollSoftware: string;
  payrollExperience: string;
};

const surveyProfiles: Record<string, SurveyProfile> = {
  terri: {
    experience: "10+ years",
    certifications: "QuickBooks ProAdvisor, Payroll Certification",
    industries: "Non-profit, Retail, Construction, Professional services, Real estate, Daycare",
    ecommerceDetail: "At Whitewater Brewery we used Shopify to record all of our retail sales. I also have experience with a jewelery company that used Shopify as their retail sales application.",
    nonprofitLevel: "Some",
    nonprofitDetail: "I worked with a Day Care centre that was a non profit. I did the monthly bookkeeping, payroll, board reports. I also did the reporting for CWELL and other government assistance programs.",
    enjoysmost: "Cleanup/catch-up bookkeeping, New company setup, Ongoing monthly bookkeeping, Payroll, Sales tax filings, Process improvement/automation",
    wantsToLearn: "Financial analysis and reporting to clients",
    wantsMoreOf: "Payroll and setting up new accounting files",
    wantsLessOf: "",
    otherNotes: "",
    payrollTasks: "Setting up payroll, Processing regular payroll, Calculating deductions, Managing benefits, Commissions/bonuses, Payroll remittances, T4 prep & year-end filings, ROEs, Troubleshooting, Adjustments/corrections",
    largestPayroll: "51\u2013100 employees",
    payrollSoftware: "QBO Payroll, QB Desktop Payroll, Ceridian/Dayforce, Payworks, Knit",
    payrollExperience: "Multiple pay schedules, Hourly and salaried, Overtime, Benefits deductions, Commissions/bonuses, Payroll corrections, Year-end filings (T4s, RL-1)",
  },
  shannon: {
    experience: "5\u201310 years",
    certifications: "CPB, QuickBooks ProAdvisor, Xero Advisor Certificate, QBO ProAdvisor Advanced",
    industries: "Retail, Construction, Professional services, E-commerce, Real estate, Daycare, Schools, Engineering firms, Medical services",
    ecommerceDetail: "Set-up & used A2X in multiple files, but also created process for recording e-comm without it.",
    nonprofitLevel: "Minimal",
    nonprofitDetail: "I worked for a small non-profit social enterprise. I have also completed the bookkeeping for 5\u20136 other NPOs \u2014 a small community centre, an advertising club, a food basket society.",
    enjoysmost: "Cleanup/catch-up bookkeeping, New company setup, Troubleshooting accounting issues, Sales tax filings",
    wantsToLearn: "Payroll (interested but not a must)",
    wantsMoreOf: "Nothing in particular",
    wantsLessOf: "Nothing in particular",
    otherNotes: "While I have not really processed payroll, I have a decent understanding of payroll processing, compliance requirements, etc.",
    payrollTasks: "",
    largestPayroll: "",
    payrollSoftware: "",
    payrollExperience: "",
  },
  ellen: {
    experience: "10+ years",
    certifications: "QuickBooks ProAdvisor, Xero Advisor Certificate, College 2-year Accounting Diploma",
    industries: "Non-profit, Retail, Professional services, Real estate",
    ecommerceDetail: "Predominately experience in businesses run by individuals with singular or limited products focused on North American customer base.",
    nonprofitLevel: "Some",
    nonprofitDetail: "Board reporting, payroll and grant tracking are pieces I've worked in, but I've had minimal exposure to true donor management.",
    enjoysmost: "Cleanup/catch-up bookkeeping, New company setup, Ongoing monthly bookkeeping, Sales tax filings, Process improvement/automation",
    wantsToLearn: "Financial analysis, Troubleshooting \u2014 would enjoy working through financials with clients if more confident in this area",
    wantsMoreOf: "Smaller business and smaller non-profit clients",
    wantsLessOf: "Large payroll projects (clarified payroll is not my area of expertise)",
    otherNotes: "Keen to hone financial analysis skills \u2014 feels this is an area of weakness that if improved would make regular workload more efficient.",
    payrollTasks: "Setting up payroll, Processing regular payroll, Calculating deductions, Managing benefits, Commissions/bonuses, Payroll remittances, T4 prep & year-end filings, ROEs, Troubleshooting, Adjustments/corrections",
    largestPayroll: "6\u201315 employees",
    payrollSoftware: "QBO Payroll, Wagepoint",
    payrollExperience: "Hourly and salaried, Overtime, Benefits deductions, Commissions/bonuses, Payroll corrections, Multiple provinces, Year-end filings",
  },
  dawn: {
    experience: "10+ years",
    certifications: "QuickBooks ProAdvisor, Xero Advisor Certificate, CPB in progress",
    industries: "Retail, Construction, Professional services, E-commerce, Real estate",
    ecommerceDetail: "A client used Shopify for product orders, it was connected to QBO.",
    nonprofitLevel: "None",
    nonprofitDetail: "",
    enjoysmost: "Cleanup/catch-up bookkeeping, New company setup, Ongoing monthly bookkeeping, Process improvement/automation",
    wantsToLearn: "Legal and Trust, Inventory and E-Commerce, Forensic Bookkeeping, Automation and AI Integrations",
    wantsMoreOf: "Clean-up/catch-ups, PRECs and Investment books, Scaling up",
    wantsLessOf: "Client chasing, High-volume payroll (heavy turnover)",
    otherNotes: "",
    payrollTasks: "Setting up payroll, Processing regular payroll, Calculating deductions, Payroll remittances, T4 prep & year-end filings, ROEs, Troubleshooting, Adjustments/corrections",
    largestPayroll: "1\u20135 employees",
    payrollSoftware: "QBO Payroll, QB Desktop Payroll, ADP",
    payrollExperience: "Multiple pay schedules, Hourly and salaried, Overtime, Benefits deductions, Commissions/bonuses, Payroll corrections, Year-end filings",
  },
  kayla: {
    experience: "10+ years",
    certifications: "QuickBooks ProAdvisor, Xero Advisor Certificate, Accounting Diploma",
    industries: "Non-profit, Retail, Construction, Professional services, E-commerce, Startups, Hospitality & Food, Healthcare, Transportation, Agriculture, Personal Services",
    ecommerceDetail: "Managed a few ecommerce clients using 1\u20132 platforms like Shopify and Stripe. Had a client who sold board games online \u2014 mix of retail/ecommerce bookkeeping.",
    nonprofitLevel: "Expert",
    nonprofitDetail: "FFTP, Genwell, and several other large complex non-profits with grant reporting, donor management, board reporting, and payroll.",
    enjoysmost: "Cleanup/catch-up, New company setup, Ongoing monthly, Financial reporting & analysis, Troubleshooting, Payroll, Sales tax filings, Process improvement/automation, Client advisory",
    wantsToLearn: "Payroll, Financial analysis, Client advisory, Non-profit (always more to learn), E-commerce",
    wantsMoreOf: "Payroll, Nonprofit, Catch up, Teaching/training",
    wantsLessOf: "Manual data entry from spreadsheets that can be automated or done through a platform like Syft",
    otherNotes: "Enjoys non-profit work, difficult clients (if willing to work with us), mix of large and small clients, catch-up projects for a change of pace. Keen to learn from Sunny on nonprofit reporting and financial analysis.",
    payrollTasks: "Setting up payroll, Processing regular payroll, Calculating deductions, Managing benefits, Commissions/bonuses, Payroll remittances, T4 prep & year-end filings, ROEs, Troubleshooting, Adjustments/corrections",
    largestPayroll: "51\u2013100 employees",
    payrollSoftware: "QBO Payroll, QB Desktop Payroll, ADP, Wagepoint, Payworks, Sage, Manual payroll",
    payrollExperience: "Multiple pay schedules, Hourly and salaried, Overtime, Benefits deductions, Commissions/bonuses, Payroll corrections, Multiple provinces, Year-end filings",
  },
};

// ─── Components ─────────────────────────────────────────────────────────────

function SkillDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < value ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

/** A labelled text row inside the survey profile box */
function ProfileField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

export default function TeamPage() {
  const { teamMembers } = useClientData();

  const teamData = teamMembers
    .filter((m) => skillData[m.id])
    .map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      assignable: m.assignable,
      weeklyCapacity: m.weeklyCapacity,
      monthlyCapacity: m.monthlyCapacity,
      skills: skillData[m.id],
      survey: surveyProfiles[m.id] ?? null,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage bookkeeper profiles and skill ratings
          </p>
        </div>
        <Link href="/team/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teamData.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{member.name}</CardTitle>
                <div className="flex gap-1.5">
                  {member.assignable && (
                    <Badge variant="secondary" className="text-emerald-600 bg-emerald-50">
                      Assignable
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{member.role}</span>
                <span>{member.weeklyCapacity}h/wk</span>
                <span>{member.monthlyCapacity}h/mo</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Skill ratings */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {(Object.keys(SKILL_LABELS) as SkillKey[]).map((key) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground truncate">
                      {SKILL_LABELS[key]}
                    </span>
                    <SkillDots value={member.skills[key]} />
                  </div>
                ))}
              </div>

              {/* Survey profile section */}
              {member.survey && (
                <>
                  <Separator />
                  <dl className="space-y-2.5 text-xs">
                    {/* Background */}
                    <ProfileField label="Experience" value={member.survey.experience} />
                    <ProfileField label="Certifications" value={member.survey.certifications} />
                    <ProfileField label="Industries" value={member.survey.industries} />

                    {/* E-commerce & Non-profit detail */}
                    <ProfileField label="E-commerce Detail" value={member.survey.ecommerceDetail} />
                    <ProfileField label="Non-profit Level" value={member.survey.nonprofitLevel} />
                    <ProfileField label="Non-profit Detail" value={member.survey.nonprofitDetail} />

                    {/* Preferences */}
                    <ProfileField label="Enjoys Most" value={member.survey.enjoysmost} />
                    <ProfileField label="Wants to Learn" value={member.survey.wantsToLearn} />
                    <ProfileField label="Wants More Of" value={member.survey.wantsMoreOf} />
                    <ProfileField label="Wants Less Of" value={member.survey.wantsLessOf} />
                    <ProfileField label="Other Notes" value={member.survey.otherNotes} />

                    {/* Payroll */}
                    {member.survey.payrollTasks && (
                      <>
                        <Separator className="!my-1.5" />
                        <ProfileField label="Payroll Tasks" value={member.survey.payrollTasks} />
                        <ProfileField label="Largest Payroll" value={member.survey.largestPayroll} />
                        <ProfileField label="Payroll Software" value={member.survey.payrollSoftware} />
                        <ProfileField label="Payroll Experience" value={member.survey.payrollExperience} />
                      </>
                    )}
                  </dl>
                </>
              )}

              <div className="pt-2">
                <Link href={`/team/${member.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
                  View Profile
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
