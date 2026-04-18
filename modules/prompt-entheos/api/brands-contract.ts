import type { BrandDraft, BrandProfile, BrandValidationErrors } from "@/modules/prompt-entheos/types";

export type BrandMutationRequest = BrandDraft;

export interface BrandsListResponse {
  brands: BrandProfile[];
}

export interface BrandSuccessResponse {
  ok: true;
  brand: BrandProfile;
  message: string;
}

export interface BrandDeleteResponse {
  ok: true;
  message: string;
}

export interface BrandErrorResponse {
  ok: false;
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "UNKNOWN_ERROR";
    message: string;
    fieldErrors?: BrandValidationErrors;
  };
}
