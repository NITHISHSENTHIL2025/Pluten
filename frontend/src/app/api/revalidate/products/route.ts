import { NextRequest, NextResponse } from "next/server";
import {
  revalidatePath,
  revalidateTag,
} from "next/cache";

export async function POST(
  request: NextRequest
) {
  try {
    const expectedSecret =
      process.env.REVALIDATION_SECRET;

    if (!expectedSecret) {
      console.error(
        "[REVALIDATE] REVALIDATION_SECRET is not configured."
      );

      return NextResponse.json(
        {
          error:
            "Revalidation is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const providedSecret =
      request.headers.get(
        "x-revalidate-secret"
      );

    if (
      !providedSecret ||
      providedSecret !== expectedSecret
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const body: unknown =
      await request
        .json()
        .catch(() => ({}));

    const rawBody =
      typeof body === "object" &&
      body !== null
        ? (body as {
            productIds?: unknown;
          })
        : {};

    const rawProductIds: unknown[] =
      Array.isArray(
        rawBody.productIds
      )
        ? rawBody.productIds
        : [];

    const productIds: string[] = [
      ...new Set(
        rawProductIds
          .filter(
            (
              id: unknown
            ): id is string =>
              typeof id === "string" &&
              id.trim().length > 0
          )
          .map((id: string) =>
            id.trim()
          )
      ),
    ];

    revalidateTag(
      "products",
      "max"
    );

    revalidatePath("/");

    for (const productId of productIds) {
      revalidateTag(
        `product:${productId}`,
        "max"
      );

      revalidatePath(
        `/product/${productId}`
      );
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      productIds,
    });
  } catch (error) {
    console.error(
      "[REVALIDATE] Unexpected error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to revalidate storefront.",
      },
      {
        status: 500,
      }
    );
  }
}