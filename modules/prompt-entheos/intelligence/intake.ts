import type {
  BrandIntelligenceValidationErrors,
  BusinessIntakeInput,
  CompetitorSeed,
} from "@/modules/prompt-entheos/types";

function normalizeField(value: string | undefined): string {
  return (value ?? "").trim();
}

export function normalizeList(values: string[]): string[] {
  return [...new Set(values.map((value) => normalizeField(value)).filter(Boolean))];
}

function normalizeWebsiteUrl(value?: string): string | undefined {
  const normalized = normalizeField(value);
  return normalized || undefined;
}

function normalizeCompetitors(competitors: CompetitorSeed[]): CompetitorSeed[] {
  const seen = new Set<string>();

  return competitors
    .map((competitor) => ({
      name: normalizeField(competitor.name),
      websiteUrl: normalizeWebsiteUrl(competitor.websiteUrl),
      notes: normalizeField(competitor.notes) || undefined,
    }))
    .filter((competitor) => {
      if (!competitor.name) {
        return false;
      }

      const key = competitor.name.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function createEmptyBusinessIntakeInput(): BusinessIntakeInput {
  return {
    companyName: "",
    websiteUrl: "",
    businessType: "B2B",
    geography: "",
    productsOrServices: [""],
    targetAudience: "",
    competitors: [],
    goals: [""],
    tone: "",
    differentiators: [""],
    notes: "",
  };
}

export function normalizeBusinessIntakeInput(input: BusinessIntakeInput): BusinessIntakeInput {
  return {
    companyName: normalizeField(input.companyName),
    websiteUrl: normalizeWebsiteUrl(input.websiteUrl),
    businessType: input.businessType,
    geography: normalizeField(input.geography),
    productsOrServices: normalizeList(input.productsOrServices),
    targetAudience: normalizeField(input.targetAudience),
    competitors: normalizeCompetitors(input.competitors),
    goals: normalizeList(input.goals),
    tone: normalizeField(input.tone),
    differentiators: normalizeList(input.differentiators),
    notes: normalizeField(input.notes) || undefined,
  };
}

export function validateBusinessIntakeInput(
  input: BusinessIntakeInput,
): BrandIntelligenceValidationErrors {
  const errors: BrandIntelligenceValidationErrors = {};

  if (!input.companyName) {
    errors.companyName = "Company name is required.";
  }

  if (!input.businessType) {
    errors.businessType = "Business type is required.";
  }

  if (!input.geography) {
    errors.geography = "Geography is required.";
  }

  if (input.productsOrServices.length === 0) {
    errors.productsOrServices = "Add at least one product or service.";
  }

  if (!input.targetAudience) {
    errors.targetAudience = "Target audience is required.";
  }

  if (input.goals.length === 0) {
    errors.goals = "Add at least one business or marketing goal.";
  }

  if (!input.tone) {
    errors.tone = "Tone is required.";
  }

  if (input.differentiators.length === 0) {
    errors.differentiators = "Add at least one differentiator.";
  }

  return errors;
}
