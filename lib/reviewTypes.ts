export type ReviewSection = {
  title: string;
  items: string[];
};

export type ComplexityInfo = {
  time: string;
  space: string;
  notes: string;
};

export type ReviewResponse = {
  language: string;
  summary: string;
  suggestedFix: string;   // ✅ ADD THIS
  potentialIssues: ReviewSection;
  improvements: ReviewSection;
  complexity: ComplexityInfo;
};
