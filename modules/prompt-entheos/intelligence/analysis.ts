import { randomUUID } from "node:crypto";
import type {
  BrandIntelligenceProfile,
  BrandIntelligenceSections,
  BusinessIntakeInput,
  CompetitorSnapshot,
  MessagingInsight,
  PromptContextPack,
} from "@/modules/prompt-entheos/types";
import {
  normalizeBusinessIntakeInput,
  normalizeList,
} from "@/modules/prompt-entheos/intelligence/intake";

function inferAudiencePriorities(input: BusinessIntakeInput): string {
  if (input.businessType === "B2B") {
    return "clarity, trust, proof, and stakeholder confidence";
  }

  if (input.businessType === "B2C") {
    return "speed to value, relevance, emotional payoff, and ease";
  }

  return "both rational proof and emotionally resonant outcomes";
}

function buildFacts(input: BusinessIntakeInput): string[] {
  return [
    `Company name: ${input.companyName}`,
    input.websiteUrl ? `Website: ${input.websiteUrl}` : null,
    `Business type: ${input.businessType}`,
    `Geography: ${input.geography}`,
    `Products or services: ${input.productsOrServices.join(", ")}`,
    `Target audience: ${input.targetAudience}`,
    input.competitors.length > 0
      ? `Named competitors: ${input.competitors.map((competitor) => competitor.name).join(", ")}`
      : "Named competitors: none provided",
    `Goals: ${input.goals.join(", ")}`,
    `Preferred tone: ${input.tone}`,
    `Differentiators: ${input.differentiators.join(", ")}`,
    input.notes ? `Additional notes: ${input.notes}` : null,
  ].filter(Boolean) as string[];
}

function buildObservations(input: BusinessIntakeInput): string[] {
  const observations: string[] = [];

  if (input.businessType === "B2B") {
    observations.push(
      "The business likely needs proof-led messaging that helps multiple stakeholders align around one decision.",
    );
  } else if (input.businessType === "B2C") {
    observations.push(
      "The brand can usually move faster with messaging that highlights outcomes, emotion, and immediate relevance.",
    );
  } else {
    observations.push(
      "The business appears hybrid, so it may need messaging that balances buyer confidence with accessibility and speed.",
    );
  }

  if (input.productsOrServices.length > 1) {
    observations.push(
      "The offer spans multiple products or services, so prompts should keep category framing simple before adding detail.",
    );
  }

  if (input.competitors.length > 0) {
    observations.push(
      "The user already knows who the market alternatives are, which means positioning can be explicit rather than abstract.",
    );
  }

  if (input.goals.length > 1) {
    observations.push(
      "Multiple goals are in play, so the brand will benefit from message hierarchy instead of treating every goal equally.",
    );
  }

  if (/[,/]| and |global|mena|gcc|europe|usa|middle east/iu.test(input.geography)) {
    observations.push(
      "The geography suggests the business may serve more than one market, so prompts should avoid overly narrow local assumptions.",
    );
  }

  observations.push(
    `The stated tone points toward ${input.tone.toLowerCase()} communication rather than generic default copy.`,
  );

  return observations;
}

function buildInferences(input: BusinessIntakeInput): string[] {
  const differentiatorLead = input.differentiators.slice(0, 2).join(" and ");
  const primaryGoal = input.goals[0];
  const inferences = [
    `The strongest positioning will likely come from leading with ${differentiatorLead} before describing features.`,
    `The audience probably evaluates options based on ${inferAudiencePriorities(input)}.`,
    `Prompts should align outputs to the goal of ${primaryGoal} rather than treating the request as generic content generation.`,
  ];

  if (input.competitors.length > 0) {
    inferences.push(
      "Because competitors are already known, the brand should state its point of difference early instead of assuming the market sees it automatically.",
    );
  }

  return inferences;
}

function buildRecommendations(input: BusinessIntakeInput): string[] {
  const recommendations = [
    `Lead prompts with the business outcome and the differentiator "${input.differentiators[0]}".`,
    `Anchor outputs to the audience "${input.targetAudience}" so messaging stays specific.`,
    `Keep the requested tone consistently ${input.tone.toLowerCase()} across generated deliverables.`,
    "Treat user-provided facts as the source of truth and use inferences only as supporting direction.",
  ];

  if (input.competitors.length > 0) {
    recommendations.push(
      "Add competitive contrast language when useful, but do not invent claims about competitors beyond what the user supplied.",
    );
  }

  return recommendations;
}

function buildBrandSummary(input: BusinessIntakeInput): string {
  return `${input.companyName} is a ${input.businessType} business serving ${input.targetAudience} in ${input.geography}, offering ${input.productsOrServices.join(", ")}, and standing out through ${input.differentiators.join(", ")}.`;
}

function buildAudienceSummary(input: BusinessIntakeInput): string {
  return `The primary audience is ${input.targetAudience}. They are likely to respond best to messaging centered on ${inferAudiencePriorities(input)}.`;
}

function buildCompetitorSnapshots(input: BusinessIntakeInput): CompetitorSnapshot[] {
  return input.competitors.map((competitor) => ({
    name: competitor.name,
    websiteUrl: competitor.websiteUrl,
    notes: competitor.notes,
    positioningSummary:
      competitor.notes ||
      `${competitor.name} is a named market alternative competing for similar audience attention.`,
    watchouts: [
      `Avoid sounding interchangeable with ${competitor.name}.`,
      `Reinforce ${input.differentiators[0]} early when the comparison set includes ${competitor.name}.`,
    ],
    differentiationOpportunity: `Differentiate against ${competitor.name} by emphasizing ${input.differentiators.slice(0, 2).join(" and ")}.`,
  }));
}

function buildPositioningNotes(input: BusinessIntakeInput): string[] {
  const notes = [
    `Position ${input.companyName} around ${input.differentiators.join(", ")} rather than generic category language.`,
    `Connect the offer to ${input.targetAudience} in ${input.geography} with outcome-led framing.`,
  ];

  if (input.competitors.length > 0) {
    notes.push(
      `Keep contrast clear versus ${input.competitors.map((competitor) => competitor.name).join(", ")} without inventing unsupported claims.`,
    );
  }

  return notes;
}

function buildMessagingInsights(input: BusinessIntakeInput): MessagingInsight[] {
  const primaryGoal = input.goals[0];

  return input.differentiators.slice(0, 3).map((differentiator, index) => ({
    title: index === 0 ? "Primary value proposition" : `Messaging angle ${index + 1}`,
    angle: `Frame ${input.companyName} as the ${differentiator} choice for ${input.targetAudience}.`,
    audienceNeed: `The audience needs confidence that the solution supports ${primaryGoal} without unnecessary friction.`,
    supportingPoints: [
      `Offer focus: ${input.productsOrServices[0]}`,
      `Key differentiator: ${differentiator}`,
      `Tone to preserve: ${input.tone}`,
    ],
    recommendedUseCases: [
      "Landing page hero",
      "Ad creative brief",
      "Email opener",
    ],
  }));
}

function buildContentPillars(input: BusinessIntakeInput): string[] {
  const pillars = [
    `Audience pain points and desired outcomes for ${input.targetAudience}`,
    `Proof of ${input.differentiators[0]} in real business or customer scenarios`,
    `Educational content around ${input.productsOrServices[0]}`,
    input.competitors.length > 0
      ? "Category contrast and why this brand is the stronger fit"
      : "Trust, proof, and buying confidence",
  ];

  return normalizeList(pillars);
}

function buildPromptContextPack(
  input: BusinessIntakeInput,
  generated: BrandIntelligenceSections,
  profileId?: string,
): PromptContextPack {
  return {
    profileId,
    companyName: input.companyName,
    tone: input.tone,
    summary: `${generated.brandSummary} ${generated.audienceSummary}`,
    contextLines: [
      `Company: ${input.companyName}`,
      `Business type: ${input.businessType}`,
      `Geography: ${input.geography}`,
      `Products/services: ${input.productsOrServices.join(", ")}`,
      `Audience: ${input.targetAudience}`,
      `Goals: ${input.goals.join(", ")}`,
      `Tone: ${input.tone}`,
      `Differentiators: ${input.differentiators.join(", ")}`,
      `Positioning notes: ${generated.positioningNotes.join(" | ")}`,
      `Messaging angles: ${generated.messagingInsights.map((insight) => insight.angle).join(" | ")}`,
      `Content pillars: ${generated.contentPillars.join(" | ")}`,
    ],
    brandDescriptors: [
      input.companyName,
      `${input.tone} tone`,
      ...input.differentiators,
    ],
    audienceDescriptors: [
      input.targetAudience,
      generated.audienceSummary,
    ],
    positioningNotes: generated.positioningNotes,
    messagingAngles: generated.messagingInsights.map((insight) => insight.angle),
    contentPillars: generated.contentPillars,
    goals: input.goals,
    instructions: [
      "Treat the user-provided business facts as the source of truth.",
      `Keep outputs aligned to a ${input.tone.toLowerCase()} tone.`,
      `Reflect these differentiators clearly: ${input.differentiators.join(", ")}.`,
      "Use observations and inferences to sharpen outputs, but do not invent unsupported claims.",
    ],
  };
}

function buildGeneratedSections(input: BusinessIntakeInput): BrandIntelligenceSections {
  const brandSummary = buildBrandSummary(input);
  const audienceSummary = buildAudienceSummary(input);
  const competitorSnapshots = buildCompetitorSnapshots(input);
  const positioningNotes = buildPositioningNotes(input);
  const messagingInsights = buildMessagingInsights(input);
  const contentPillars = buildContentPillars(input);

  return {
    facts: buildFacts(input),
    observations: buildObservations(input),
    inferences: buildInferences(input),
    recommendations: buildRecommendations(input),
    brandSummary,
    audienceSummary,
    competitorSnapshots,
    positioningNotes,
    messagingInsights,
    contentPillars,
  };
}

export function buildBrandIntelligenceProfile(
  input: BusinessIntakeInput,
  existing?: Pick<BrandIntelligenceProfile, "id" | "createdAt">,
): BrandIntelligenceProfile {
  const normalized = normalizeBusinessIntakeInput(input);
  const generated = buildGeneratedSections(normalized);
  const now = new Date().toISOString();
  const id = existing?.id ?? randomUUID();
  const promptContextPack = buildPromptContextPack(normalized, generated, id);

  return {
    id,
    ...normalized,
    generatedIntelligence: generated,
    promptContextPack,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
