const revalidateFrontend = async (
  productIds = []
) => {
  const url = String(
    process.env.FRONTEND_REVALIDATION_URL || ""
  ).trim();

  const secret = String(
    process.env.FRONTEND_REVALIDATION_SECRET || ""
  ).trim();

  if (!url || !secret) {
    console.warn(
      "[REVALIDATION] Frontend revalidation is not configured."
    );

    return {
      ok: false,
      skipped: true,
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Revalidate-Secret": secret,
      },
      body: JSON.stringify({
        productIds: Array.isArray(productIds)
          ? [...new Set(productIds.filter(Boolean))]
          : [],
      }),
    });

    if (!response.ok) {
      const body = await response.text();

      console.error(
        "[REVALIDATION] Frontend returned non-OK response:",
        {
          status: response.status,
          body,
        }
      );

      return {
        ok: false,
        status: response.status,
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    console.error(
      "[REVALIDATION] Failed:",
      error.message
    );

    return {
      ok: false,
      error: error.message,
    };
  }
};

module.exports = revalidateFrontend;