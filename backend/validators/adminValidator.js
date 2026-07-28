// backend/validators/adminValidator.js
const { z } = require('zod');

// 1. Product Validation (Issue #19)
const productSchema = z.object({
    body: z.object({
        title: z.string().min(3, "Title must be at least 3 characters long."),
        description: z.string().min(10, "Description must be at least 10 characters long."),
        // Because form-data sends strings, we preprocess it into a number to validate it mathematically
        price: z.preprocess((val) => Number(val), z.number().positive("Price must be a positive amount greater than zero.")),
        category: z.string().min(2, "Category is required."),
        isDigital: z.preprocess((val) => val === 'true', z.boolean().optional())
    })
});

// 2. Offer Validation (Issue #18)
const offerSchema = z.object({
    body: z.object({
        name: z.string().min(3, "Offer name is required."),
        type: z.enum(["PERCENTAGE", "FIXED"], { errorMap: () => ({ message: "Type must be PERCENTAGE or FIXED." }) }),
        value: z.number().positive("Discount value must be greater than zero."),
        applyTo: z.enum(["ALL", "SELECTED"]),
        minOrderAmount: z.number().nonnegative().optional(),
        couponCode: z.string().optional(),
        autoApply: z.boolean().optional(),
        status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "EXPIRED"]).optional(),
        startAt: z.string().datetime("Invalid start date format."),
        endAt: z.string().datetime("Invalid end date format.")
    })
}).refine(data => {
    // SECURITY: Prevent >100% discounts
    if (data.body.type === 'PERCENTAGE' && data.body.value > 100) return false;
    return true;
}, { message: "Percentage discount cannot exceed 100%.", path: ["body", "value"] })
  .refine(data => {
    // SECURITY: Prevent time-traveling offers
    return new Date(data.body.endAt) > new Date(data.body.startAt);
}, { message: "End date must strictly be after the start date.", path: ["body", "endAt"] });

module.exports = { productSchema, offerSchema };