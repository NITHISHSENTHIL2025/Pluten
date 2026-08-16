const { PrismaClient } = require('@prisma/client');
const { Cashfree } = require('../utils/cashfree');
const crypto = require('crypto');

const prisma = new PrismaClient();

const API_VERSION = process.env.CASHFREE_API_VERSION || '2025-01-01';

function toMoney(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Number(n.toFixed(2));
}

async function calculateServerPrice(product) {
    const now = new Date();

    const offers = await prisma.offer.findMany({
        where: {
            status: 'ACTIVE',
            autoApply: true,
            startAt: { lte: now },
            endAt: { gte: now },
        },
        include: {
            products: {
                select: { id: true },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    let bestPrice = Number(product.price);

    for (const offer of offers) {
        const appliesToProduct =
            offer.applyTo === 'ALL' ||
            (offer.applyTo === 'SELECTED' &&
                offer.products.some((item) => item.id === product.id));

        if (!appliesToProduct) continue;

        // minOrderAmount is kept compatible with the current one-product checkout.
        if (
            offer.minOrderAmount !== null &&
            Number(product.price) < Number(offer.minOrderAmount)
        ) {
            continue;
        }

        let discount = 0;

        if (offer.type === 'PERCENTAGE') {
            discount =
                Number(product.price) * (Number(offer.value) / 100);
        } else if (offer.type === 'FIXED') {
            discount = Number(offer.value);
        }

        const candidate = Math.max(
            0,
            Number(product.price) - discount
        );

        if (candidate < bestPrice) {
            bestPrice = candidate;
        }
    }

    return toMoney(bestPrice);
}

// 1. Initialize a transaction
const createOrder = async (req, res) => {
    let internalOrderId = null;

    try {
        const { productId, customerPhone, clientRequestId } = req.body;

        if (!productId) {
            return res.status(400).json({
                error: 'Product ID is required.',
            });
        }

        if (!customerPhone || !/^\d{10}$/.test(String(customerPhone))) {
            return res.status(400).json({
                error: 'A valid 10-digit customer phone number is required.',
            });
        }

        if (!clientRequestId || typeof clientRequestId !== 'string') {
            return res.status(400).json({
                error: 'Checkout request ID is required.',
            });
        }

        // Idempotency: same authenticated user + same request id returns the
        // existing order instead of creating a second payment order.
        const existingOrder = await prisma.order.findFirst({
            where: {
                userId: req.user.id,
                clientRequestId,
            },
            select: {
                id: true,
                status: true,
            },
        });

        if (existingOrder) {
            if (existingOrder.status === 'SUCCESS') {
                return res.status(200).json({
                    success: true,
                    alreadyPurchased: true,
                    order_id: existingOrder.id,
                });
            }

            // The frontend can safely resume an existing pending attempt.
            // Fetching a fresh session is delegated to Cashfree by creating
            // only when the existing attempt has no active session in your DB.
            return res.status(409).json({
                error: 'A checkout attempt already exists for this request.',
                order_id: existingOrder.id,
            });
        }

        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                isArchived: false,
                isDigital: true,
            },
        });

        if (!product) {
            return res.status(404).json({
                error: 'Digital product not found or unavailable.',
            });
        }

        if (!product.assetUrl) {
            return res.status(409).json({
                error: 'This digital product is not ready for delivery yet.',
            });
        }

        const finalPrice = await calculateServerPrice(product);

        if (finalPrice === null) {
            return res.status(500).json({
                error: 'Unable to calculate the secure product price.',
            });
        }

        internalOrderId = `pluten_${req.user.id}_${crypto.randomUUID()}`;

        await prisma.order.create({
            data: {
                id: internalOrderId,
                userId: req.user.id,
                productId: product.id,
                totalAmount: finalPrice,
                status: 'PENDING',
                transactionId: 'AWAITING_PAYMENT',
                clientRequestId,
            },
        });

        const frontendBaseUrl = process.env.FRONTEND_URL;

        if (!frontendBaseUrl) {
            throw new Error('FRONTEND_URL is not configured.');
        }

        const webhookUrl = process.env.CASHFREE_WEBHOOK_URL;

        const request = {
            order_id: internalOrderId,
            order_amount: finalPrice,
            order_currency: 'INR',
            customer_details: {
                customer_id: String(req.user.id),
                customer_phone: String(customerPhone),
                customer_email: req.user.email,
            },
            order_meta: {
                return_url: `${frontendBaseUrl}/payment-success?order_id={order_id}`,
                ...(webhookUrl
                    ? { notify_url: webhookUrl }
                    : {}),
            },
        };

        const response = await Cashfree.PGCreateOrder(
            API_VERSION,
            request
        );

        return res.status(200).json({
            success: true,
            payment_session_id: response.data.payment_session_id,
            order_id: internalOrderId,
            amount: finalPrice,
        });
    } catch (error) {
        console.error(
            'Cashfree Order Error:',
            error?.response?.data || error.message
        );

        // IMPORTANT:
        // Do NOT delete the order after a gateway/network error.
        // It is retained for reconciliation.
        if (internalOrderId) {
            try {
                await prisma.order.updateMany({
                    where: {
                        id: internalOrderId,
                        status: 'PENDING',
                    },
                    data: {
                        transactionId: 'GATEWAY_CREATE_FAILED',
                    },
                });
            } catch (updateError) {
                console.error(
                    'Failed to mark gateway-create failure:',
                    updateError.message
                );
            }
        }

        return res.status(500).json({
            error: 'Failed to initialize secure transaction.',
        });
    }
};

// 2. Server-side verification
const verifyPayment = async (req, res) => {
    const { orderId } = req.body;

    if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({
            error: 'Order ID is required.',
        });
    }

    try {
        // CRITICAL OWNERSHIP CHECK.
        // A customer may only verify their own order.
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: req.user.id,
            },
        });

        if (!order) {
            return res.status(404).json({
                error: 'Order not found for the authenticated account.',
            });
        }

        if (order.status === 'SUCCESS') {
            return res.status(200).json({
                success: true,
                message: 'Asset already secured.',
                order,
            });
        }

        const cfResponse =
            await Cashfree.PGOrderFetchPayments(
                API_VERSION,
                orderId
            );

        const successfulPayment =
            cfResponse.data.find(
                (payment) =>
                    payment.payment_status === 'SUCCESS'
            );

        if (!successfulPayment) {
            return res.status(409).json({
                error: 'Payment has not been confirmed yet.',
                status: 'PENDING',
            });
        }

        const gatewayAmount = toMoney(
            successfulPayment.payment_amount
        );

        const expectedAmount = toMoney(
            order.totalAmount
        );

        if (
            gatewayAmount === null ||
            expectedAmount === null ||
            gatewayAmount !== expectedAmount
        ) {
            console.error(
                `[SECURITY] Amount mismatch on ${orderId}. Expected ${expectedAmount}, got ${gatewayAmount}.`
            );

            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'FLAGGED_AMOUNT_MISMATCH',
                },
            });

            return res.status(400).json({
                error:
                    'Payment verification failed due to a monetary mismatch.',
            });
        }

        const fulfilled = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'SUCCESS',
                transactionId: String(
                    successfulPayment.cf_payment_id
                ),
            },
        });

        return res.status(200).json({
            success: true,
            order: fulfilled,
        });
    } catch (error) {
        console.error(
            'Fulfillment Verification Error:',
            error.message
        );

        return res.status(500).json({
            error:
                'Failed to verify transaction with the gateway.',
        });
    }
};

// 3. Cryptographic webhook
const webhookHandler = async (req, res) => {
    try {
        const signature =
            req.headers['x-webhook-signature'];

        const timestamp =
            req.headers['x-webhook-timestamp'];

        const rawBody = req.rawBody;

        if (!signature || !timestamp || !rawBody) {
            return res
                .status(400)
                .send('Missing webhook cryptography headers.');
        }

        const timestampMs = Number(timestamp);

        if (!Number.isFinite(timestampMs)) {
            return res
                .status(401)
                .send('Invalid webhook timestamp.');
        }

        // Replay protection.
        // Keep a small tolerance window around the signed timestamp.
        const age = Math.abs(Date.now() - timestampMs);

        if (age > 5 * 60 * 1000) {
            return res
                .status(401)
                .send('Expired webhook.');
        }

        const secretKey =
            process.env.CASHFREE_CLIENT_SECRET ||
            process.env.CASHFREE_SECRET_KEY;

        if (!secretKey) {
            throw new Error(
                'Cashfree webhook secret is not configured.'
            );
        }

        const expectedSignature =
            crypto
                .createHmac('sha256', secretKey)
                .update(
                    `${timestamp}${rawBody}`
                )
                .digest('base64');

        const signaturesMatch =
            expectedSignature.length ===
                signature.length &&
            crypto.timingSafeEqual(
                Buffer.from(expectedSignature),
                Buffer.from(signature)
            );

        if (!signaturesMatch) {
            console.warn(
                '[SECURITY ALERT] Invalid Cashfree webhook signature.'
            );

            return res
                .status(401)
                .send('Signature mismatch');
        }

        const payload =
            typeof req.body === 'string'
                ? JSON.parse(req.body)
                : req.body;

        if (
            payload?.event !==
            'PAYMENT_SUCCESS_WEBHOOK'
        ) {
            return res
                .status(200)
                .send('WEBHOOK_RECEIVED');
        }

        const orderId =
            payload?.data?.order?.order_id;

        const gatewayAmount =
            toMoney(
                payload?.data?.payment?.payment_amount
            );

        const cfPaymentId =
            payload?.data?.payment?.cf_payment_id;

        if (!orderId || gatewayAmount === null || !cfPaymentId) {
            return res
                .status(400)
                .send('Malformed payment webhook.');
        }

        await prisma.$transaction(async (tx) => {
            const order =
                await tx.order.findUnique({
                    where: { id: orderId },
                });

            // Unknown order: acknowledge safely so Cashfree does not
            // endlessly retry an event that does not belong to Pluten.
            if (!order) return;

            // Idempotent webhook handling.
            if (order.status === 'SUCCESS') return;

            const expectedAmount =
                toMoney(order.totalAmount);

            if (
                expectedAmount === null ||
                gatewayAmount !== expectedAmount
            ) {
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status:
                            'FLAGGED_AMOUNT_MISMATCH',
                    },
                });

                return;
            }

            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'SUCCESS',
                    transactionId:
                        String(cfPaymentId),
                },
            });
        });

        return res
            .status(200)
            .send('WEBHOOK_RECEIVED');
    } catch (error) {
        console.error(
            'Webhook Processing Fault:',
            error.message
        );

        return res
            .status(500)
            .send('WEBHOOK_FAULT');
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    webhookHandler,
};