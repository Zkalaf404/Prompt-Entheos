export const businessTypes = ["B2B", "B2C", "hybrid"] as const;

export type BusinessType = (typeof businessTypes)[number];

export interface CompetitorSeed {
  name: string;
  websiteUrl?: string;
  notes?: string;
}

export interface CompetitorSnapshot {
  name: string;
  websiteUrl?: string;
  notes?: string;
  positioningSummary: string;
  watchouts: string[];
  differentiationOpportunity: string;
}

export interface MessagingInsight {
  title: string;
  angle: string;
  audienceNeed: string;
  supportingPoints: string[];
  recommendedUseCases: string[];
}

export interface PromptContextPack {
  profileId?: string;
  companyName: string;
  tone: string;
  summary: string;
  contextLines: string[];
  brandDescriptors: string[];
  audienceDescriptors: string[];
  positioningNotes: string[];
  messagingAngles: string[];
  contentPillars: string[];
  goals: string[];
  instructions: string[];
}

export interface BrandIntelligenceSections {
  facts: string[];
  observations: string[];
  inferences: string[];
  recommendations: string[];
  brandSummary: string;
  audienceSummary: string;
  competitorSnapshots: CompetitorSnapshot[];
  positioningNotes: string[];
  messagingInsights: MessagingInsight[];
  contentPillars: string[];
}

export interface BusinessIntakeInput {
  companyName: string;
  websiteUrl?: string;
  businessType: BusinessType;
  geography: string;
  productsOrServices: string[];
  targetAudience: string;
  competitors: CompetitorSeed[];
  goals: string[];
  tone: string;
  differentiators: string[];
  notes?: string;
}

export interface BrandIntelligenceProfile extends BusinessIntakeInput {
  id: string;
  generatedIntelligence: BrandIntelligenceSections;
  promptContextPack: PromptContextPack;
  createdAt: string;
  updatedAt: string;
}

export interface BrandIntelligenceValidationErrors {
  companyName?: string;
  websiteUrl?: string;
  businessType?: string;
  geography?: string;
  productsOrServices?: string;
  targetAudience?: string;
  competitors?: string;
  goals?: string;
  tone?: string;
  differentiators?: string;
  notes?: string;
}
