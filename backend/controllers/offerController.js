const prisma = require('../lib/prisma');
const recordAudit = require('../utils/auditLogger');
const revalidateFrontend = require('../utils/revalidateFrontend');

const ensureCouponAvailable = async (
  couponCode,
  ignoreId = null
) => {
  const code = String(
    couponCode || ''
  )
    .trim()
    .toUpperCase();

  if (!code) {
    return null;
  }

  const existing =
    await prisma.offer.findFirst({
      where: {
        couponCode: {
          equals: code,
          mode: 'insensitive',
        },

        ...(ignoreId
          ? {
              id: {
                not: ignoreId,
              },
            }
          : {}),
      },

      select: {
        id: true,
        name: true,
      },
    });

  return existing || null;
};

const parsePagination = (req) => {
  const page = Math.max(
    1,
    Number.parseInt(
      req.query.page,
      10
    ) || 1
  );

  const limit = Math.min(
    100,
    Math.max(
      1,
      Number.parseInt(
        req.query.limit,
        10
      ) || 25
    )
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const parseOfferInput = (
  body
) => {
  const normalizedCoupon =
    String(
      body.couponCode || ''
    )
      .trim()
      .toUpperCase();

  return {
    name: String(
      body.name || ''
    ).trim(),

    type: body.type,

    value: Number(
      body.value
    ),

    applyTo: body.applyTo,

    minOrderAmount:
      body.minOrderAmount ===
        undefined ||
      body.minOrderAmount ===
        null ||
      body.minOrderAmount === ''
        ? null
        : Number(
            body.minOrderAmount
          ),

    couponCode:
      normalizedCoupon || null,

    autoApply: Boolean(
      body.autoApply
    ),

    status:
      body.status || 'DRAFT',

    startAt: new Date(
      body.startAt
    ),

    endAt: new Date(
      body.endAt
    ),
  };
};

const validateOfferInput = ({
  offerData,
  productIds,
}) => {
  if (
    !offerData.name ||
    offerData.name.length < 3
  ) {
    return 'Offer name is required.';
  }

  if (
    !Number.isFinite(
      offerData.value
    ) ||
    offerData.value <= 0
  ) {
    return 'Discount value must be greater than zero.';
  }

  if (
    offerData.type ===
      'PERCENTAGE' &&
    offerData.value > 100
  ) {
    return 'Percentage discount cannot exceed 100%.';
  }

  if (
    ![
      'PERCENTAGE',
      'FIXED',
    ].includes(
      offerData.type
    )
  ) {
    return 'Invalid discount type.';
  }

  if (
    ![
      'ALL',
      'SELECTED',
    ].includes(
      offerData.applyTo
    )
  ) {
    return 'Invalid offer scope.';
  }

  if (
    offerData.minOrderAmount !==
      null &&
    (
      !Number.isFinite(
        offerData.minOrderAmount
      ) ||
      offerData.minOrderAmount < 0
    )
  ) {
    return 'Minimum order amount must be zero or greater.';
  }

  if (
    Number.isNaN(
      offerData.startAt.getTime()
    ) ||
    Number.isNaN(
      offerData.endAt.getTime()
    )
  ) {
    return 'Invalid offer dates.';
  }

  if (
    offerData.endAt <=
    offerData.startAt
  ) {
    return 'End date must be after the start date.';
  }

  if (
    offerData.couponCode &&
    !/^[A-Z0-9_-]+$/.test(
      offerData.couponCode
    )
  ) {
    return 'Coupon code may contain only letters, numbers, hyphens, and underscores.';
  }

  if (
    offerData.couponCode &&
    offerData.couponCode.length >
      40
  ) {
    return 'Coupon code is too long.';
  }

  if (
    offerData.applyTo ===
      'SELECTED' &&
    (
      !Array.isArray(
        productIds
      ) ||
      productIds.length === 0
    )
  ) {
    return 'Selected-product offers require at least one product.';
  }

  return null;
};

const normalizeProductIds = (
  productIds
) => {
  if (!Array.isArray(productIds)) {
    return [];
  }

  return [
    ...new Set(
      productIds
        .map((id) =>
          String(id || '').trim()
        )
        .filter(Boolean)
    ),
  ];
};

const buildCreateData = (
  offerData,
  productIds
) => ({
  ...offerData,

  ...(offerData.applyTo ===
  'SELECTED'
    ? {
        products: {
          connect: normalizeProductIds(
            productIds
          ).map((id) => ({
            id,
          })),
        },
      }
    : {}),
});

const buildUpdateData = (
  offerData,
  productIds
) => ({
  ...offerData,

  products:
    offerData.applyTo ===
    'SELECTED'
      ? {
          set: normalizeProductIds(
            productIds
          ).map((id) => ({
            id,
          })),
        }
      : {
          set: [],
        },
});

const offerInclude = {
  products: {
    select: {
      id: true,
      title: true,
    },
  },
};

const revalidateOfferPricing = async (
  requestId
) => {
  /*
   * Offer changes can affect:
   *
   * - auto-apply selection
   * - product-specific offers
   * - ALL-product offers
   * - coupon selection
   * - previously active auto-apply offers
   *
   * Therefore global product invalidation is the safest
   * correctness-first strategy.
   *
   * Failure to revalidate must NOT roll back the database
   * mutation. The offer remains valid and the next cache
   * refresh will eventually pick it up.
   */
  const result =
    await revalidateFrontend([]);

  if (!result?.ok && !result?.skipped) {
    console.error(
      '[OFFERS] Storefront revalidation failed:',
      {
        requestId,
        result,
      }
    );
  }

  return result;
};

const createOffer = async (
  req,
  res
) => {
  try {
    const offerData =
      parseOfferInput(
        req.body || {}
      );

    const productIds =
      normalizeProductIds(
        req.body?.productIds
      );

    const validationError =
      validateOfferInput({
        offerData,
        productIds,
      });

    if (validationError) {
      return res
        .status(400)
        .json({
          error:
            validationError,
        });
    }

    const duplicateCoupon =
      await ensureCouponAvailable(
        offerData.couponCode
      );

    if (duplicateCoupon) {
      return res
        .status(409)
        .json({
          error:
            'That coupon code is already in use.',
        });
    }

    const offer =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Only one ACTIVE auto-apply offer should win.
           */
          if (
            offerData.autoApply &&
            offerData.status ===
              'ACTIVE'
          ) {
            await tx.offer.updateMany({
              where: {
                autoApply: true,
                status: 'ACTIVE',
              },

              data: {
                autoApply:
                  false,
              },
            });
          }

          return tx.offer.create({
            data:
              buildCreateData(
                offerData,
                productIds
              ),

            include:
              offerInclude,
          });
        }
      );

    await recordAudit({
      userId: req.user.id,
      action: 'CREATE_OFFER',
      entity: 'OFFER',
      entityId: offer.id,

      details: {
        name: offer.name,
        type: offer.type,
        value: offer.value,
        status: offer.status,
        applyTo: offer.applyTo,
        productCount:
          Array.isArray(
            offer.products
          )
            ? offer.products.length
            : 0,
        hasCoupon:
          Boolean(
            offer.couponCode
          ),
        autoApply:
          Boolean(
            offer.autoApply
          ),
      },

      req,
    });

    /*
     * Revalidate only after the DB transaction + audit
     * have succeeded.
     */
    await revalidateOfferPricing(
      req.requestId
    );

    return res
      .status(201)
      .json(offer);
  } catch (error) {
    console.error(
      '[OFFERS] Create error:',
      {
        requestId:
          req.requestId,

        message:
          error.message,

        code:
          error.code,
      }
    );

    return res
      .status(500)
      .json({
        error:
          'Failed to create offer.',
      });
  }
};

const getAllOffers = async (
  req,
  res
) => {
  try {
    const {
      page,
      limit,
      skip,
    } = parsePagination(req);

    const search = String(
      req.query.search || ''
    ).trim();

    const status = String(
      req.query.status || ''
    ).trim();

    const validStatuses = [
      'DRAFT',
      'ACTIVE',
      'PAUSED',
      'EXPIRED',
    ];

    const where = {
      ...(validStatuses.includes(
        status
      )
        ? { status }
        : {}),

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains:
                    search,
                  mode: 'insensitive',
                },
              },

              {
                couponCode: {
                  contains:
                    search,
                  mode: 'insensitive',
                },
              },

              {
                products: {
                  some: {
                    title: {
                      contains:
                        search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [
      offers,
      total,
    ] = await Promise.all([
      prisma.offer.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          createdAt:
            'desc',
        },

        include:
          offerInclude,
      }),

      prisma.offer.count({
        where,
      }),
    ]);

    return res
      .status(200)
      .json({
        data: offers,

        pagination: {
          page,
          limit,
          total,
          totalPages:
            Math.max(
              1,
              Math.ceil(
                total / limit
              )
            ),
        },
      });
  } catch (error) {
    console.error(
      '[OFFERS] Fetch error:',
      {
        requestId:
          req.requestId,
        message:
          error.message,
      }
    );

    return res
      .status(500)
      .json({
        error:
          'Failed to fetch offers.',
      });
  }
};

const getActiveOffers = async (
  req,
  res
) => {
  try {
    const now =
      new Date();

    const offers =
      await prisma.offer.findMany({
        where: {
          status: 'ACTIVE',

          startAt: {
            lte: now,
          },

          endAt: {
            gte: now,
          },
        },

        orderBy: {
          createdAt:
            'desc',
        },

        take: 100,

        include: {
          products: {
            select: {
              id: true,
            },
          },
        },
      });

    return res
      .status(200)
      .json(offers);
  } catch (error) {
    console.error(
      '[OFFERS] Active fetch error:',
      {
        requestId:
          req.requestId,
        message:
          error.message,
      }
    );

    return res
      .status(500)
      .json({
        error:
          'Failed to fetch active offers.',
      });
  }
};

const updateOffer = async (
  req,
  res
) => {
  try {
    const id = String(
      req.params.id || ''
    ).trim();

    if (!id) {
      return res
        .status(400)
        .json({
          error:
            'Offer ID is required.',
        });
    }

    /*
     * Read the current offer before mutation.
     * This is important because changing an offer can
     * change which products are discounted.
     */
    const existingOffer =
      await prisma.offer.findUnique({
        where: { id },

        include: {
          products: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!existingOffer) {
      return res
        .status(404)
        .json({
          error:
            'Offer not found.',
        });
    }

    const offerData =
      parseOfferInput(
        req.body || {}
      );

    const productIds =
      normalizeProductIds(
        req.body?.productIds
      );

    const validationError =
      validateOfferInput({
        offerData,
        productIds,
      });

    if (validationError) {
      return res
        .status(400)
        .json({
          error:
            validationError,
        });
    }

    const duplicateCoupon =
      await ensureCouponAvailable(
        offerData.couponCode,
        id
      );

    if (duplicateCoupon) {
      return res
        .status(409)
        .json({
          error:
            'That coupon code is already in use.',
        });
    }

    const offer =
      await prisma.$transaction(
        async (tx) => {
          if (
            offerData.autoApply &&
            offerData.status ===
              'ACTIVE'
          ) {
            await tx.offer.updateMany({
              where: {
                id: {
                  not: id,
                },

                autoApply:
                  true,

                status:
                  'ACTIVE',
              },

              data: {
                autoApply:
                  false,
              },
            });
          }

          return tx.offer.update({
            where: { id },

            data:
              buildUpdateData(
                offerData,
                productIds
              ),

            include:
              offerInclude,
          });
        }
      );

    await recordAudit({
      userId: req.user.id,
      action: 'UPDATE_OFFER',
      entity: 'OFFER',
      entityId: id,

      details: {
        name: offer.name,
        type: offer.type,
        value: offer.value,
        status: offer.status,
        applyTo: offer.applyTo,
        previousApplyTo:
          existingOffer.applyTo,
        previousAutoApply:
          Boolean(
            existingOffer.autoApply
          ),
        autoApply:
          Boolean(
            offer.autoApply
          ),
        productCount:
          Array.isArray(
            offer.products
          )
            ? offer.products.length
            : 0,
      },

      req,
    });

    /*
     * Global invalidation is intentional here.
     *
     * Updating an auto-apply offer may disable another
     * auto-apply offer, so targeted product invalidation
     * is not reliably sufficient.
     */
    await revalidateOfferPricing(
      req.requestId
    );

    return res
      .status(200)
      .json(offer);
  } catch (error) {
    if (
      error?.code ===
      'P2025'
    ) {
      return res
        .status(404)
        .json({
          error:
            'Offer not found.',
        });
    }

    console.error(
      '[OFFERS] Update error:',
      {
        requestId:
          req.requestId,
        message:
          error.message,
        code:
          error.code,
      }
    );

    return res
      .status(500)
      .json({
        error:
          'Failed to update offer.',
      });
  }
};

const deleteOffer = async (
  req,
  res
) => {
  try {
    const id = String(
      req.params.id || ''
    ).trim();

    if (!id) {
      return res
        .status(400)
        .json({
          error:
            'Offer ID is required.',
        });
    }

    const offer =
      await prisma.offer.findUnique({
        where: { id },

        include: {
          products: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!offer) {
      return res
        .status(404)
        .json({
          error:
            'Offer not found.',
        });
    }

    await prisma.offer.delete({
      where: { id },
    });

    await recordAudit({
      userId: req.user.id,
      action: 'DELETE_OFFER',
      entity: 'OFFER',
      entityId: id,

      details: {
        name: offer.name,
        type: offer.type,
        value: offer.value,
        status: offer.status,
        applyTo:
          offer.applyTo,
        productCount:
          Array.isArray(
            offer.products
          )
            ? offer.products.length
            : 0,
      },

      req,
    });

    /*
     * Deleting an active offer can increase prices again,
     * so refresh the entire storefront pricing cache.
     */
    await revalidateOfferPricing(
      req.requestId
    );

    return res
      .status(200)
      .json({
        message:
          'Offer deleted successfully.',
      });
  } catch (error) {
    if (
      error?.code ===
      'P2025'
    ) {
      return res
        .status(404)
        .json({
          error:
            'Offer not found.',
        });
    }

    console.error(
      '[OFFERS] Delete error:',
      {
        requestId:
          req.requestId,
        message:
          error.message,
        code:
          error.code,
      }
    );

    return res
      .status(500)
      .json({
        error:
          'Failed to delete offer.',
      });
  }
};

module.exports = {
  createOffer,
  getAllOffers,
  getActiveOffers,
  updateOffer,
  deleteOffer,
};