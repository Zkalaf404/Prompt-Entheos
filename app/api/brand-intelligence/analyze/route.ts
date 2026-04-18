import { NextResponse } from "next/server";
import type {
  BrandIntelligenceAnalyzeRequest,
  BrandIntelligenceErrorResponse,
  BrandIntelligenceSuccessResponse,
} from "@/modules/prompt-entheos/api/brand-intelligence-contract";
import { analyzeBrandIntelligenceInput } from "@/modules/prompt-entheos/intelligence";
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
      message: "Something went wrong while analyzing the business intake.",
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<BrandIntelligenceAnalyzeRequest>;

    if (!body.input) {
      return NextResponse.json<BrandIntelligenceErrorResponse>(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Business intake input is required.",
          },
        },
        { status: 400 },
      );
    }

    const profile = await analyzeBrandIntelligenceInput(
      {
        companyName: body.input.companyName ?? "",
        websiteUrl: body.input.websiteUrl,
        businessType: body.input.businessType ?? "B2B",
        geography: body.input.geography ?? "",
        productsOrServices: body.input.productsOrServices ?? [],
        targetAudience: body.input.targetAudience ?? "",
        competitors: body.input.competitors ?? [],
        goals: body.input.goals ?? [],
        tone: body.input.tone ?? "",
        differentiators: body.input.differentiators ?? [],
        notes: body.input.notes,
      },
      {
        persist: Boolean(body.persist),
        profileId: body.profileId,
      },
    );

    const response: BrandIntelligenceSuccessResponse = {
      ok: true,
      profile,
      message: body.persist
        ? body.profileId
          ? "Brand Intelligence Profile updated and re-analyzed successfully."
          : "Brand Intelligence Profile analyzed and saved successfully."
        : "Business intake analyzed successfully.",
      persisted: Boolean(body.persist),
    };

    return NextResponse.json(response, {
      status: body.persist && !body.profileId ? 201 : 200,
    });
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
