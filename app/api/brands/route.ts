import { NextResponse } from "next/server";
import type {
  BrandErrorResponse,
  BrandMutationRequest,
  BrandSuccessResponse,
  BrandsListResponse,
} from "@/modules/prompt-entheos/api/brands-contract";
import { createBrand, listBrands } from "@/modules/prompt-entheos/brands";
import { NotFoundError, ValidationError } from "@/modules/prompt-entheos/data/service-errors";

function toBrandErrorResponse(error: unknown): BrandErrorResponse {
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
      message: "Something went wrong while saving the brand.",
    },
  };
}

export async function GET() {
  const response: BrandsListResponse = {
    brands: await listBrands(),
  };

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<BrandMutationRequest>;
    const brand = await createBrand({
      name: body.name ?? "",
      audience: body.audience ?? "",
      tone: body.tone ?? "",
      description: body.description ?? "",
      notes: body.notes,
    });
    const response: BrandSuccessResponse = {
      ok: true,
      brand,
      message: "Brand saved successfully.",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response = toBrandErrorResponse(error);
    const status = response.error.code === "VALIDATION_ERROR" ? 400 : 500;

    return NextResponse.json(response, { status });
  }
}
