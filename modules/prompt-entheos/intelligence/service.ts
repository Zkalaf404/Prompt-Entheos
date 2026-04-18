import { NotFoundError, ValidationError } from "@/modules/prompt-entheos/data/service-errors";
import {
  buildBrandIntelligenceProfile,
} from "@/modules/prompt-entheos/intelligence/analysis";
import {
  normalizeBusinessIntakeInput,
  validateBusinessIntakeInput,
} from "@/modules/prompt-entheos/intelligence/intake";
import {
  listStoredBrandIntelligenceProfiles,
  saveBrandIntelligenceProfiles,
} from "@/modules/prompt-entheos/intelligence/repository";
import type {
  BrandIntelligenceProfile,
  BusinessIntakeInput,
  NormalizedBrandContext,
} from "@/modules/prompt-entheos/types";

function sortProfiles(profiles: BrandIntelligenceProfile[]): BrandIntelligenceProfile[] {
  return [...profiles].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function ensureValidBusinessIntake(input: BusinessIntakeInput): BusinessIntakeInput {
  const normalized = normalizeBusinessIntakeInput(input);
  const errors = validateBusinessIntakeInput(normalized);

  if (Object.keys(errors).length > 0) {
    throw new ValidationError("Business intake is incomplete.", errors);
  }

  return normalized;
}

export async function listBrandIntelligenceProfiles(): Promise<BrandIntelligenceProfile[]> {
  return sortProfiles(await listStoredBrandIntelligenceProfiles());
}

export async function getBrandIntelligenceProfileById(
  profileId: string,
): Promise<BrandIntelligenceProfile> {
  const profiles = await listStoredBrandIntelligenceProfiles();
  const profile = profiles.find((candidate) => candidate.id === profileId);

  if (!profile) {
    throw new NotFoundError(`Brand Intelligence Profile "${profileId}" was not found.`);
  }

  return profile;
}

export async function createBrandIntelligenceProfile(
  input: BusinessIntakeInput,
): Promise<BrandIntelligenceProfile> {
  const normalized = ensureValidBusinessIntake(input);
  const profile = buildBrandIntelligenceProfile(normalized);
  const profiles = await listStoredBrandIntelligenceProfiles();

  profiles.unshift(profile);
  await saveBrandIntelligenceProfiles(sortProfiles(profiles));

  return profile;
}

export async function updateBrandIntelligenceProfile(
  profileId: string,
  input: BusinessIntakeInput,
): Promise<BrandIntelligenceProfile> {
  const normalized = ensureValidBusinessIntake(input);
  const profiles = await listStoredBrandIntelligenceProfiles();
  const existing = profiles.find((candidate) => candidate.id === profileId);

  if (!existing) {
    throw new NotFoundError(`Brand Intelligence Profile "${profileId}" was not found.`);
  }

  const nextProfile = buildBrandIntelligenceProfile(normalized, {
    id: existing.id,
    createdAt: existing.createdAt,
  });
  const nextProfiles = profiles.map((profile) =>
    profile.id === profileId ? nextProfile : profile,
  );

  await saveBrandIntelligenceProfiles(sortProfiles(nextProfiles));

  return nextProfile;
}

export async function deleteBrandIntelligenceProfile(profileId: string): Promise<void> {
  const profiles = await listStoredBrandIntelligenceProfiles();
  const nextProfiles = profiles.filter((candidate) => candidate.id !== profileId);

  if (profiles.length === nextProfiles.length) {
    throw new NotFoundError(`Brand Intelligence Profile "${profileId}" was not found.`);
  }

  await saveBrandIntelligenceProfiles(sortProfiles(nextProfiles));
}

export async function analyzeBrandIntelligenceInput(
  input: BusinessIntakeInput,
  options?: {
    persist?: boolean;
    profileId?: string;
  },
): Promise<BrandIntelligenceProfile> {
  const normalized = ensureValidBusinessIntake(input);

  if (options?.persist && options.profileId) {
    return updateBrandIntelligenceProfile(options.profileId, normalized);
  }

  if (options?.persist) {
    return createBrandIntelligenceProfile(normalized);
  }

  return buildBrandIntelligenceProfile(normalized);
}

export function toNormalizedBrandContextFromProfile(
  profile: BrandIntelligenceProfile,
): NormalizedBrandContext {
  return {
    id: profile.id,
    name: profile.companyName,
    audience: profile.targetAudience,
    tone: profile.tone,
    description: profile.generatedIntelligence.brandSummary,
    notes: profile.notes,
    summary: profile.promptContextPack.summary,
    contextLines: profile.promptContextPack.contextLines,
  };
}
