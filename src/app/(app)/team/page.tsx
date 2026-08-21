"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SKILL_LABELS, type SkillKey } from "@/lib/db/schema";
import Link from "next/link";
import { Loader2, Plus, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientData } from "@/lib/client-data-context";
import { deactivateTeamMemberAction } from "@/lib/actions/team-actions";
import { toast } from "sonner";

const EMPTY_SKILLS: Record<SkillKey, number> = {
  demanding_clients: 0,
  complex_bookkeeping: 0,
  tech_ability: 0,
  payroll: 0,
  construction: 0,
  non_profit: 0,
  ecommerce: 0,
  a2x_dext: 0,
  xero: 0,
  qbo: 0,
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
  const { teamMembers, clients, refreshData } = useClientData();
  const [pendingDeactivate, setPendingDeactivate] = useState<{ id: string; name: string } | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  // Calculate each member's client hours (same logic as Dashboard)
  function getMemberClientHours(memberId: string): number {
    return clients.filter((c) => c.status !== "P").reduce((sum, c) => {
      let hrs = 0;
      if (c.leadBookkeeper === memberId) hrs += c.primaryHrs;
      if (c.secondBookkeeper === memberId) hrs += c.secondHrs;
      if (c.oversight === memberId) hrs += c.oversightHrs;
      if (c.payrollBookkeeper === memberId) hrs += c.payrollHrs;
      return sum + hrs;
    }, 0);
  }

  const teamData = teamMembers
    .map((m) => {
      const clientHrs = getMemberClientHours(m.id);
      const totalUsed = clientHrs + m.meetingHrs + m.internalHrs + (m.catchupMonthlyHrs ?? 0);
      const available = Math.round((m.monthlyCapacity - totalUsed) * 10) / 10;
      return {
        id: m.id,
        name: m.name,
        role: m.role,
        assignable: m.assignable,
        weeklyCapacity: m.weeklyCapacity,
        monthlyCapacity: m.monthlyCapacity,
        available,
        skills: m.skills ?? EMPTY_SKILLS,
        survey: surveyProfiles[m.id] ?? null,
      };
    })
    // Sort: assignable first, then by most available capacity
    .sort((a, b) => {
      if (a.assignable !== b.assignable) return a.assignable ? -1 : 1;
      return b.available - a.available;
    });

  async function handleConfirmDeactivate() {
    if (!pendingDeactivate) return;
    setDeactivating(true);
    const result = await deactivateTeamMemberAction(pendingDeactivate.id);
    setDeactivating(false);
    if (result.success) {
      toast.success(`${pendingDeactivate.name} removed from the team`);
      setPendingDeactivate(null);
      refreshData();
    } else {
      toast.error(result.error ?? "Failed to remove team member");
    }
  }

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

      <Dialog
        open={pendingDeactivate !== null}
        onOpenChange={(open) => { if (!open) setPendingDeactivate(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {pendingDeactivate?.name}?</DialogTitle>
            <DialogDescription>
              This hides them from the team roster and capacity calculations. Their
              historical client assignments are kept, not deleted — you can reactivate
              them later from the database if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeactivate(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deactivating} onClick={handleConfirmDeactivate}>
              {deactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

              <div className="flex gap-2 pt-2">
                <Link href={`/team/${member.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}>
                  View Profile
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setPendingDeactivate({ id: member.id, name: member.name })}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
