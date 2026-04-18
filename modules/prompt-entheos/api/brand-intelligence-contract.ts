import type {
  BrandIntelligenceProfile,
  BrandIntelligenceValidationErrors,
  BusinessIntakeInput,
} from "@/modules/prompt-entheos/types";

export type BrandIntelligenceMutationRequest = BusinessIntakeInput;

export interface BrandIntelligenceAnalyzeRequest {
  input: BusinessIntakeInput;
  persist?: boolean;
  profileId?: string;
}

export interface BrandIntelligenceListResponse {
  profiles: BrandIntelligenceProfile[];
}

export interface BrandIntelligenceSuccessResponse {
  ok: true;
  profile: BrandIntelligenceProfile;
  message: string;
  persisted: boolean;
}

export interface BrandIntelligenceDeleteResponse {
  ok: true;
  message: string;
}

export interface BrandIntelligenceErrorResponse {
  ok: false;
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "UNKNOWN_ERROR";
    message: string;
    fieldErrors?: BrandIntelligenceValidationErrors;
  };
}
