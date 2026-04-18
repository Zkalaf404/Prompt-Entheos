import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "@/modules/prompt-entheos/data/service-errors";
import { listBrandProfiles, saveBrandProfiles } from "@/modules/prompt-entheos/brands/repository";
import type {
  BrandDraft,
  BrandProfile,
  BrandValidationErrors,
  NormalizedBrandContext,
} from "@/modules/prompt-entheos/types";

function normalizeField(value: string | undefined): string {
  return (value ?? "").trim();
}

function normalizeBrandDraft(draft: BrandDraft): BrandDraft {
  const notes = normalizeField(draft.notes);

  return {
    name: normalizeField(draft.name),
    audience: normalizeField(draft.audience),
    tone: normalizeField(draft.tone),
    description: normalizeField(draft.description),
    notes: notes || undefined,
  };
}

function validateBrandDraft(draft: BrandDraft): BrandValidationErrors {
  const errors: BrandValidationErrors = {};

  if (!draft.name) {
    errors.name = "Brand name is required.";
  }

  if (!draft.audience) {
    errors.audience = "Audience is required.";
  }

  if (!draft.tone) {
    errors.tone = "Tone is required.";
  }

  if (!draft.description) {
    errors.description = "Description is required.";
  }

  return errors;
}

function ensureValidBrandDraft(draft: BrandDraft): BrandDraft {
  const normalizedDraft = normalizeBrandDraft(draft);
  const errors = validateBrandDraft(normalizedDraft);

  if (Object.keys(errors).length > 0) {
    throw new ValidationError("Brand profile is incomplete.", errors);
  }

  return normalizedDraft;
}

function sortBrands(brands: BrandProfile[]): BrandProfile[] {
  return [...brands].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function listBrands(): Promise<BrandProfile[]> {
  return sortBrands(await listBrandProfiles());
}

export async function getBrandById(brandId: string): Promise<BrandProfile> {
  const brands = await listBrandProfiles();
  const brand = brands.find((candidate) => candidate.id === brandId);

  if (!brand) {
    throw new NotFoundError(`Brand "${brandId}" was not found.`);
  }

  return brand;
}

export async function createBrand(draft: BrandDraft): Promise<BrandProfile> {
  const normalizedDraft = ensureValidBrandDraft(draft);
  const now = new Date().toISOString();
  const brand: BrandProfile = {
    id: randomUUID(),
    ...normalizedDraft,
    createdAt: now,
    updatedAt: now,
  };
  const brands = await listBrandProfiles();

  brands.unshift(brand);
  await saveBrandProfiles(sortBrands(brands));

  return brand;
}

export async function updateBrand(brandId: string, draft: BrandDraft): Promise<BrandProfile> {
  const normalizedDraft = ensureValidBrandDraft(draft);
  const brands = await listBrandProfiles();
  const index = brands.findIndex((candidate) => candidate.id === brandId);

  if (index === -1) {
    throw new NotFoundError(`Brand "${brandId}" was not found.`);
  }

  const nextBrand: BrandProfile = {
    ...brands[index],
    ...normalizedDraft,
    updatedAt: new Date().toISOString(),
  };

  brands[index] = nextBrand;
  await saveBrandProfiles(sortBrands(brands));

  return nextBrand;
}

export async function deleteBrand(brandId: string): Promise<void> {
  const brands = await listBrandProfiles();
  const nextBrands = brands.filter((candidate) => candidate.id !== brandId);

  if (nextBrands.length === brands.length) {
    throw new NotFoundError(`Brand "${brandId}" was not found.`);
  }

  await saveBrandProfiles(sortBrands(nextBrands));
}

export function normalizeBrandContext(brand: BrandProfile): NormalizedBrandContext {
  const contextLines = [
    `Brand name: ${brand.name}`,
    `Audience: ${brand.audience}`,
    `Tone: ${brand.tone}`,
    `Description: ${brand.description}`,
    brand.notes ? `Notes: ${brand.notes}` : null,
  ].filter(Boolean) as string[];

  return {
    id: brand.id,
    name: brand.name,
    audience: brand.audience,
    tone: brand.tone,
    description: brand.description,
    notes: brand.notes,
    summary: `${brand.name} targets ${brand.audience} with a ${brand.tone} tone.`,
    contextLines,
  };
}
