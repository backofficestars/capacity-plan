// Placeholder data simulating what would come from the Financial Cents API.
// In production, this would be replaced by an actual API call to FC.
//
// This list intentionally includes:
//   - Most clients from the Google Sheet (matched)
//   - A few clients NOT in the Sheet (to simulate "new in FC, missing from Sheet")
//   - Some Sheet clients are missing here (to simulate "in Sheet only")

export type FcClient = {
  name: string;
  status: "Active" | "Inactive" | "Archived";
};

export const fcClients: FcClient[] = [
  // ── Matches with the Google Sheet ──────────────────────────────────
  { name: "351 East Orvis", status: "Active" },
  { name: "Aftermetoo", status: "Active" },
  { name: "AlphaPlus", status: "Active" },
  { name: "Anthem Events Inc.", status: "Active" },
  { name: "Brain Generative AI", status: "Active" },
  { name: "Brainstorm - Graham Donald", status: "Active" },
  { name: "Canadian Friends of Bal-Illan", status: "Inactive" },
  { name: "Captured in Paint (Joanne Hastie)", status: "Active" },
  { name: "Caravel Business Advisors Inc.", status: "Active" },
  { name: "Carbon One - Joseph Ianni", status: "Active" },
  { name: "Carroll's Animal Sanctuary", status: "Active" },
  { name: "CrossTown Psychology", status: "Active" },
  { name: "Daily Health Nutrition", status: "Active" },
  { name: "Dynasty Sportwear Inc", status: "Active" },
  { name: "Elite Soccer Clinics", status: "Inactive" },
  { name: "Fireweed Entertainment", status: "Active" },
  { name: "Food For The Poor (NFP)", status: "Active" },
  { name: "Fuse Insights - Nick Drew", status: "Active" },
  { name: "Genwell Foundation", status: "Active" },
  { name: "Hendrika Spoelstra - Jordan Spoelstra", status: "Active" },
  { name: "HKM Studio", status: "Active" },
  { name: "Humanist Canada", status: "Active" },
  { name: "Hybrid Ideas - Simon Cooper", status: "Active" },
  { name: "Junction Collective", status: "Active" },
  { name: "Kaven Construction & Renovations", status: "Active" },
  { name: "Kerstens Bau", status: "Inactive" },
  { name: "Kingsway Kennels", status: "Active" },
  { name: "Lateral Kindness", status: "Inactive" },
  { name: "Mara Pollock Professional Corp.", status: "Inactive" },
  { name: "Massage At Work", status: "Active" },
  { name: "MedTach", status: "Active" },
  { name: "Nada Toothbrush (GrinBrush)", status: "Active" },
  { name: "Ogilvie Barsness Financial Services", status: "Active" },
  { name: "Orangetheory Fitness", status: "Active" },
  { name: "PMI Group", status: "Inactive" },
  { name: "Powered By Search", status: "Active" },
  { name: "PSBX (Tova & Baron Manett)", status: "Active" },
  { name: "Reimer Associates", status: "Active" },
  { name: "Rose Orchestra", status: "Inactive" },
  { name: "Saddle Fit 4 Life", status: "Active" },
  { name: "Scott Carpentier - Investagain", status: "Active" },
  { name: "Scott Harris - Harris Private Legacy", status: "Active" },
  { name: "Scott Harris - Majama Holdings", status: "Active" },
  { name: "Scott Harris - Scott D. Harris", status: "Active" },
  { name: "Scott Harris - Stonehaven Financial", status: "Active" },
  { name: "SHIFT Collaborative", status: "Active" },
  { name: "Southcote Construction & Consulting", status: "Active" },
  { name: "Swing Golf Lounge", status: "Active" },
  { name: "TruTech Pest & Wildlife Control", status: "Active" },
  { name: "Unbound Media", status: "Active" },
  { name: "Urban Bounty", status: "Active" },
  { name: "Urgent Action Fund Latin America", status: "Active" },
  { name: "Venture Creative", status: "Active" },
  { name: "Vina Roofing", status: "Active" },
  { name: "Wachter Content", status: "Active" },
  { name: "Yukon Public Legal Education Assoc.", status: "Active" },
  { name: "LiveActive Sport Medicine", status: "Active" },
  { name: "Assante Wealth Mgmt", status: "Active" },
  { name: "Psycura", status: "Active" },
  { name: "OrthoMD", status: "Active" },
  { name: "Mobilizz", status: "Active" },
  { name: "Premier Siding", status: "Active" },
  { name: "Modern Home Exteriors", status: "Active" },
  { name: "Done Right Roofing", status: "Active" },
  { name: "Prison Fellowship", status: "Active" },
  { name: "Camp Culture Holdings", status: "Active" },
  { name: "Cedar Grove Wellness", status: "Active" },
  { name: "Your Local Farmers Market Society", status: "Active" },
  { name: "Alberta Aviation Society", status: "Active" },

  // ── In FC but NOT in the Google Sheet (simulated new clients) ──────
  { name: "Maple Ridge Consulting", status: "Active" },
  { name: "Northern Light Studios", status: "Active" },
  { name: "Peak Performance Athletics", status: "Active" },
];
