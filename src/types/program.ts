// Program recommendation types shared by backend API integration and result cards.
export type RecommendationStatus = "Recommended" | "Need More Info" | "Less Likely";

export interface ProgramRecommendation {
  id: string;
  title: string;
  category: string;
  eligibilityScore: number;
  status: RecommendationStatus;
  shortDescription: string;
  matchReasons: string[];
  missingInfo: string[];
  requiredDocuments: string[];
  nextSteps: string[];
  officialUrl: string;
}

export interface EligibilityResult {
  recommended: ProgramRecommendation[];
  needMoreInfo: ProgramRecommendation[];
  lessLikely: ProgramRecommendation[];
}
