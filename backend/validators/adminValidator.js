const { z } = require('zod');

const normalizeOptionalNumber = (value) => {
  if (
    value === '' ||
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  return Number(value);
};

const normalizeOptionalCoupon = (value) => {
  if (
    value === '' ||
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  return String(value)
    .trim()
    .toUpperCase();
};

const productSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(
        3,
        'Title must be at least 3 characters long.'
      ),

    description: z
      .string()
      .trim()
      .min(
        10,
        'Description must be at least 10 characters long.'
      ),

    price: z.preprocess(
      (value) => Number(value),
      z
        .number()
        .finite()
        .positive(
          'Price must be greater than zero.'
        )
    ),

    category: z
      .string()
      .trim()
      .min(
        2,
        'Category is required.'
      ),

    isDigital: z.preprocess(
      (value) => {
        if (
          value === '' ||
          value === undefined ||
          value === null
        ) {
          return undefined;
        }

        if (typeof value === 'boolean') {
          return value;
        }

        return value === 'true';
      },
      z.boolean().optional()
    ),
  }),
});

const offerSchema = z
  .object({
    body: z.object({
      name: z
        .string()
        .trim()
        .min(
          3,
          'Offer name is required.'
        )
        .max(
          100,
          'Offer name is too long.'
        ),

      type: z.enum([
        'PERCENTAGE',
        'FIXED',
      ]),

      value: z.preprocess(
        (value) => Number(value),
        z
          .number()
          .finite()
          .positive(
            'Discount value must be greater than zero.'
          )
      ),

      applyTo: z.enum([
        'ALL',
        'SELECTED',
      ]),

      minOrderAmount: z.preprocess(
        normalizeOptionalNumber,
        z
          .number()
          .finite()
          .nonnegative()
          .optional()
      ),

      couponCode: z.preprocess(
        normalizeOptionalCoupon,
        z
          .string()
          .max(
            40,
            'Coupon code is too long.'
          )
          .regex(
            /^[A-Z0-9_-]*$/,
            'Coupon code may contain only letters, numbers, hyphens, and underscores.'
          )
          .optional()
      ),

      autoApply: z
        .boolean()
        .optional(),

      status: z.enum([
        'DRAFT',
        'ACTIVE',
        'PAUSED',
        'EXPIRED',
      ]).optional(),

      startAt: z
        .string()
        .datetime(),

      endAt: z
        .string()
        .datetime(),

      productIds: z
        .array(z.string().uuid())
        .optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.body.type !== 'PERCENTAGE') {
        return true;
      }

      return data.body.value <= 100;
    },
    {
      message:
        'Percentage discount cannot exceed 100%.',
      path: ['body', 'value'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(
        data.body.startAt
      );

      const end = new Date(
        data.body.endAt
      );

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        return false;
      }

      return end > start;
    },
    {
      message:
        'End date must be after the start date.',
      path: ['body', 'endAt'],
    }
  )
  .refine(
    (data) => {
      if (data.body.applyTo !== 'SELECTED') {
        return true;
      }

      return (
        Array.isArray(
          data.body.productIds
        ) &&
        data.body.productIds.length > 0
      );
    },
    {
      message:
        'Selected-product offers require at least one product.',
      path: ['body', 'productIds'],
    }
  )
  .refine(
    (data) => {
      if (
        data.body.type !== 'FIXED' ||
        data.body.minOrderAmount === undefined
      ) {
        return true;
      }

      return (
        data.body.value <=
        data.body.minOrderAmount
      );
    },
    {
      message:
        'Fixed discount cannot exceed the minimum order amount.',
      path: ['body', 'value'],
    }
  );

module.exports = {
  productSchema,
  offerSchema,
};