import { NextResponse } from "next/server";
import type {
  BrandDeleteResponse,
  BrandErrorResponse,
  BrandMutationRequest,
  BrandSuccessResponse,
} from "@/modules/prompt-entheos/api/brands-contract";
import { deleteBrand, getBrandById, updateBrand } from "@/modules/prompt-entheos/brands";
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
      message: "Something went wrong while processing the brand.",
    },
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ brandId: string }> },
) {
  try {
    const { brandId } = await context.params;
    const brand = await getBrandById(brandId);

    return NextResponse.json({ brand });
  } catch (error) {
    const response = toBrandErrorResponse(error);
    const status = response.error.code === "NOT_FOUND" ? 404 : 500;

    return NextResponse.json(response, { status });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ brandId: string }> },
) {
  try {
    const { brandId } = await context.params;
    const body = (await request.json()) as Partial<BrandMutationRequest>;
    const brand = await updateBrand(brandId, {
      name: body.name ?? "",
      audience: body.audience ?? "",
      tone: body.tone ?? "",
      description: body.description ?? "",
      notes: body.notes,
    });
    const response: BrandSuccessResponse = {
      ok: true,
      brand,
      message: "Brand updated successfully.",
    };

    return NextResponse.json(response);
  } catch (error) {
    const response = toBrandErrorResponse(error);
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
  context: { params: Promise<{ brandId: string }> },
) {
  try {
    const { brandId } = await context.params;
    await deleteBrand(brandId);
    const response: BrandDeleteResponse = {
      ok: true,
      message: "Brand deleted successfully.",
    };

    return NextResponse.json(response);
  } catch (error) {
    const response = toBrandErrorResponse(error);
    const status = response.error.code === "NOT_FOUND" ? 404 : 500;

    return NextResponse.json(response, { status });
  }
}
