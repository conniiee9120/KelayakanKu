// Program recommendation types shared by backend API integration and result cards.
export type RecommendationStatus = "Recommended" | "Need More Info";

export interface RuleBreakdownItem {
  rule: string;
  points: number;
  matched: boolean;
  reason: string;
}

export interface ProgramRecommendation {
  id: string;
  title: string;
  titleBm?: string;
  category: string;
  eligibilityScore: number;
  status: RecommendationStatus;
  shortDescription: string;
  shortDescriptionBm?: string;
  targetGroup?: string[];
  targetGroupBm?: string[];
  benefitSummary?: string;
  benefitSummaryBm?: string;
  eligibilitySummary?: string[];
  eligibilitySummaryBm?: string[];
  applicationMethod?: string;
  applicationMethodBm?: string;
  importantNotes?: string[];
  importantNotesBm?: string[];
  matchReasons: string[];
  missingInfo: string[];
  needsMoreInfoReasons?: string[];
  disqualificationReasons?: string[];
  ruleBreakdown?: RuleBreakdownItem[];
  requiredDocuments: string[];
  requiredDocumentsBm?: string[];
  nextSteps: string[];
  nextStepsBm?: string[];
  officialUrl?: string;
  sourceUrl?: string;
}

export interface EligibilityResult {
  recommended: ProgramRecommendation[];
  needMoreInfo: ProgramRecommendation[];
}
