import { NextResponse } from "next/server";
import type {
  BrandIntelligenceDeleteResponse,
  BrandIntelligenceErrorResponse,
  BrandIntelligenceMutationRequest,
  BrandIntelligenceSuccessResponse,
} from "@/modules/prompt-entheos/api/brand-intelligence-contract";
import {
  deleteBrandIntelligenceProfile,
  getBrandIntelligenceProfileById,
  updateBrandIntelligenceProfile,
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
      message: "Something went wrong while processing the Brand Intelligence Profile.",
    },
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await context.params;
    const profile = await getBrandIntelligenceProfileById(profileId);

    return NextResponse.json({ profile });
  } catch (error) {
    const response = toBrandIntelligenceErrorResponse(error);
    const status = response.error.code === "NOT_FOUND" ? 404 : 500;

    return NextResponse.json(response, { status });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await context.params;
    const body = (await request.json()) as Partial<BrandIntelligenceMutationRequest>;
    const profile = await updateBrandIntelligenceProfile(profileId, {
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
      message: "Brand Intelligence Profile updated successfully.",
      persisted: true,
    };

    return NextResponse.json(response);
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await context.params;
    await deleteBrandIntelligenceProfile(profileId);
    const response: BrandIntelligenceDeleteResponse = {
      ok: true,
      message: "Brand Intelligence Profile deleted successfully.",
    };

    return NextResponse.json(response);
  } catch (error) {
    const response = toBrandIntelligenceErrorResponse(error);
    const status = response.error.code === "NOT_FOUND" ? 404 : 500;

    return NextResponse.json(response, { status });
  }
}
