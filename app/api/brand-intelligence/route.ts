import { NextResponse } from "next/server";
import type {
  BrandIntelligenceErrorResponse,
  BrandIntelligenceListResponse,
  BrandIntelligenceMutationRequest,
  BrandIntelligenceSuccessResponse,
} from "@/modules/prompt-entheos/api/brand-intelligence-contract";
import {
  createBrandIntelligenceProfile,
  listBrandIntelligenceProfiles,
} from "@/modules/prompt-entheos/intelligence";
import { NotFoundError, ValidationError } from "@/modules/prompt-entheos/data/service-errors";

function toBrandIntelligenceErrorResponse(error: unknown): BrandIntelligenceErrorResponse {
  if (error instanceof ValidationError) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error.message,
        fieldErrors: error.fieldErrors,
      },
    };
  }

  if (error instanceof NotFoundError) {
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: error.message,
      },
    };
  }

  return {
    ok: false,
    error: {
      code: "UNKNOWN_ERROR",
      message: "Something went wrong while processing Brand Intelligence profiles.",
    },
  };
}

export async function GET() {
  const response: BrandIntelligenceListResponse = {
    profiles: await listBrandIntelligenceProfiles(),
  };

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<BrandIntelligenceMutationRequest>;
    const profile = await createBrandIntelligenceProfile({
      companyName: body.companyName ?? "",
      websiteUrl: body.websiteUrl,
      businessType: body.businessType ?? "B2B",
      geography: body.geography ?? "",
      productsOrServices: body.productsOrServices ?? [],
      targetAudience: body.targetAudience ?? "",
      competitors: body.competitors ?? [],
      goals: body.goals ?? [],
      tone: body.tone ?? "",
      differentiators: body.differentiators ?? [],
      notes: body.notes,
    });
    const response: BrandIntelligenceSuccessResponse = {
      ok: true,
      profile,
      message: "Brand Intelligence Profile created successfully.",
      persisted: true,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response = toBrandIntelligenceErrorResponse(error);
    const status =
      response.error.code === "VALIDATION_ERROR"
        ? 400
        : response.error.code === "NOT_FOUND"
          ? 404
          : 500;

    return NextResponse.json(response, { status });
  }
}
