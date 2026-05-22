// Fallback mock eligibility result kept only for development reference.
import type { EligibilityResult } from "../types/program";

export const mockPrograms: EligibilityResult = {
  recommended: [
    {
      id: "cash-aid-support",
      title: "Cash Aid Support",
      category: "Cash Aid",
      eligibilityScore: 86,
      status: "Recommended",
      shortDescription: "Your household income range, dependents, and household situation may match this B40 support category.",
      matchReasons: [
        "Your household income range may fall within common B40 support thresholds.",
        "Your dependents and household burden may be relevant for living cost support."
      ],
      missingInfo: ["Final agency criteria", "Application period"],
      requiredDocuments: ["IC", "Bank account details", "Household income information"],
      nextSteps: ["Read the official eligibility criteria", "Prepare the required documents", "Apply through the official channel"],
      officialUrl: ""
    },
    {
      id: "self-employed-contribution-support",
      title: "Self-Employed Contribution Support",
      category: "Contribution Support",
      eligibilityScore: 82,
      status: "Recommended",
      shortDescription: "Your household has gig, informal, or self-employed income, which may match contribution support for B40 informal workers.",
      matchReasons: [
        "Your work situation matches gig worker or self-employed categories.",
        "You may need to confirm your EPF/KWSP or SOCSO/PERKESO status."
      ],
      missingInfo: ["Official contribution status", "Latest agency criteria"],
      requiredDocuments: ["IC", "EPF/KWSP or SOCSO/PERKESO information", "Income declaration"],
      nextSteps: ["Confirm your contribution status", "Prepare income or work records", "Apply through the official channel"],
      officialUrl: ""
    }
  ],
  needMoreInfo: [
    {
      id: "additional-household-support",
      title: "Additional Household Support",
      category: "Household Support",
      eligibilityScore: 60,
      status: "Need More Info",
      shortDescription: "This program may depend on household records, official income assessment, or agency-specific criteria.",
      matchReasons: ["Your household situation may be relevant for additional support."],
      missingInfo: ["Household registration details", "Official income records", "Application period"],
      requiredDocuments: ["IC", "Household records", "Proof of income"],
      nextSteps: ["Verify household records", "Check application period", "Prepare supporting documents"],
      officialUrl: ""
    }
  ],
  lessLikely: []
};
