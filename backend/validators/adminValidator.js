const { z } = require('zod');

const productSchema =
    z.object({
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
                (val) => Number(val),
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
                (val) =>
                    val === 'true',
                z.boolean().optional()
            ),
        }),
    });

const offerSchema =
    z.object({
        body: z.object({
            name: z
                .string()
                .trim()
                .min(
                    3,
                    'Offer name is required.'
                ),

            type: z.enum([
                'PERCENTAGE',
                'FIXED',
            ]),

            value: z.preprocess(
                (val) => Number(val),
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

            minOrderAmount: z
                .preprocess(
                    (val) =>
                        val === '' ||
                        val === undefined
                            ? undefined
                            : Number(val),
                    z
                        .number()
                        .finite()
                        .nonnegative()
                        .optional()
                ),

            couponCode: z
                .string()
                .trim()
                .optional(),

            autoApply: z
                .boolean()
                .optional(),

            status: z
                .enum([
                    'DRAFT',
                    'ACTIVE',
                    'PAUSED',
                    'EXPIRED',
                ])
                .optional(),

            startAt: z
                .string()
                .datetime(),

            endAt: z
                .string()
                .datetime(),

            productIds: z
                .array(z.string())
                .optional(),
        }),
    })
    .refine(
        (data) =>
            !(
                data.body.type ===
                    'PERCENTAGE' &&
                data.body.value > 100
            ),
        {
            message:
                'Percentage discount cannot exceed 100%.',
            path: [
                'body',
                'value',
            ],
        }
    )
    .refine(
        (data) =>
            new Date(
                data.body.endAt
            ) >
            new Date(
                data.body.startAt
            ),
        {
            message:
                'End date must be after the start date.',
            path: [
                'body',
                'endAt',
            ],
        }
    )
    .refine(
        (data) =>
            data.body.applyTo !==
                'SELECTED' ||
            (Array.isArray(
                data.body.productIds
            ) &&
                data.body.productIds
                    .length > 0),
        {
            message:
                'Selected-product offers require at least one product.',
            path: [
                'body',
                'productIds',
            ],
        }
    );

module.exports = {
    productSchema,
    offerSchema,
};