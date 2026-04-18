export interface BrandProfile {
  id: string;
  name: string;
  audience: string;
  tone: string;
  description: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDraft {
  name: string;
  audience: string;
  tone: string;
  description: string;
  notes?: string;
}

export interface BrandValidationErrors {
  name?: string;
  audience?: string;
  tone?: string;
  description?: string;
}

export interface NormalizedBrandContext {
  id: string;
  name: string;
  audience: string;
  tone: string;
  description: string;
  notes?: string;
  summary: string;
  contextLines: string[];
}
