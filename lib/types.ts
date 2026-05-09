export type Regulation = {
  id: string;
  title: { fr: string; en: string };
  category: string;
  jurisdiction: "Federal" | "Quebec" | "Montreal" | "Borough";
  authority: string;
  appliesWhen: string[];
  summary: { fr: string; en: string };
  estimatedTimelineDays: { min: number; max: number } | null;
  estimatedCost: { min: number; max: number; currency: "CAD" } | null;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  documentRefs: string[];
  officialUrl: string;
  lastUpdated: string;
};

export type Alert = {
  id: string;
  title: string;
  source: string;
  jurisdiction: string;
  category: string;
  urgency: "Low" | "Medium" | "High" | "Critical";
  affectsActivities: string[];
  affectsJurisdictions: string[];
  oldText: string;
  newText: string;
  publishedDate: string;
  documentRefs: string[];
};

export type ProjectProfile = {
  businessType: string;
  activities: string[];
  location: { city: string; borough: string | null };
  scale: { squareFeet: number | null; employees: number | null };
  considerations: string[];
};

export type DocumentSubClause = {
  id: string;
  title: string;
  type: "section" | "clause" | "subclause" | "paragraph" | "schedule" | "other";
  pageStart: number | null;
  pageEnd: number | null;
  text: string;
  keyObligations: string[];
  riskSignals: string[];
  parties: string[];
  tags: string[];
  children?: DocumentSubClause[];
};

export type AnalyzedProjectDocument = {
  filename: string;
  documentType: string;
  title: string;
  summary: string;
  clauses: DocumentSubClause[];
};

export type AnalyzedRegulation = Regulation & {
  personalizedSummary: string;
  whyItApplies: string;
  recentChanges: Alert[];
};

export type RegulatorySnapshot = {
  projectProfile: ProjectProfile;
  totalApplicableRules: number;
  riskOverview: "Low" | "Medium" | "High" | "Critical";
  rules: AnalyzedRegulation[];
  recentAlerts: Alert[];
  riskReport: {
    executiveSummary: string;
    topRisks: string[];
    recommendedActions: string[];
    disclaimer: string;
  };
  attachedFilesProcessed?: { filename: string }[];
  analyzedDocuments?: AnalyzedProjectDocument[];
};
