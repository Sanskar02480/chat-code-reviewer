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
  quality: {
    score: number;
    grade: string;
    label: string;
  };
  potentialIssues: { items: string[] };
  improvements: { items: string[] };
  complexity: {
    time: string;
    space: string;
    notes: string;
  };
  suggestedFix: string;
};

