// backend/controllers/paymentController.js
const { PrismaClient } = require('@prisma/client');
const { Cashfree } = require('../utils/cashfree');
const crypto = require('crypto');
const prisma = new PrismaClient();

// THE FIX (Item #5): Dynamically configure Cashfree SDK for Production vs Sandbox
if (process.env.NODE_ENV === 'production') {
    Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;
} else {
    Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;
}

// 1. Initialize the Transaction
const createOrder = async (req, res) => {
    let internalOrderId = null; 

    try {
        const { amount, productId, customerPhone } = req.body;
        
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: "Asset not found." });
        }

        let finalPrice = product.price;
        const now = new Date();
        
        const activeOffer = await prisma.offer.findFirst({
            where: {
                status: 'ACTIVE',
                autoApply: true,
                startAt: { lte: now },
                endAt: { gte: now }
            }
        });

        if (activeOffer) {
            let discountAmount = 0;
            if (activeOffer.type === 'PERCENTAGE') {
                discountAmount = Number(product.price) * (Number(activeOffer.value) / 100);
            } else if (activeOffer.type === 'FIXED') {
                discountAmount = Number(activeOffer.value);
            }
            finalPrice = Math.max(0, Number(product.price) - discountAmount);
        }

        finalPrice = Number(finalPrice.toFixed(2));
        const frontendAmount = Number(Number(amount).toFixed(2));

        if (finalPrice !== frontendAmount) {
            console.warn(`[SECURITY] Price mismatch. Expected ₹${finalPrice}, got ₹${frontendAmount}`);
            return res.status(400).json({ error: "Product price mismatch or invalid asset." });
        }

        internalOrderId = `isvn_${req.user.id}_${Date.now()}`;

        await prisma.order.create({
            data: {
                id: internalOrderId,
                userId: req.user.id,
                productId: productId,
                totalAmount: finalPrice, 
                status: 'PENDING',
                transactionId: 'AWAITING_PAYMENT'
            }
        });

        // THE FIX (Item #3): Dynamic Return URL for Payment Recovery
        // When deployed, this ensures Cashfree redirects mobile/external users back to your actual domain.
        const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const request = {
            order_id: internalOrderId,
            order_amount: finalPrice, 
            order_currency: "INR",
            customer_details: {
                customer_id: req.user.id,
                customer_phone: customerPhone || "9999999999",
                customer_email: req.user.email
            },
            order_meta: { 
                return_url: `${frontendBaseUrl}/payment-success?order_id=${internalOrderId}` 
            }
        };

        const response = await Cashfree.PGCreateOrder("2023-08-01", request);
        
        res.status(200).json({ 
            payment_session_id: response.data.payment_session_id,
            order_id: internalOrderId 
        });

    } catch (error) {
        console.error("Cashfree Order Rejection:", error.response?.data?.message || error.message);
        
        if (internalOrderId) {
            await prisma.order.deleteMany({ where: { id: internalOrderId, status: 'PENDING' } });
            console.log(`[iSevens Core] Rolled back pending order ${internalOrderId} due to gateway failure.`);
        }

        res.status(500).json({ error: "Failed to initialize secure transaction." });
    }
};

// 2. Active Server-Side Verification (Triggered by Frontend)
const verifyPayment = async (req, res) => {
    const { orderId } = req.body;
    
    try {
        const cfResponse = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
        const successfulPayment = cfResponse.data.find(payment => payment.payment_status === "SUCCESS");

        if (!successfulPayment) {
            return res.status(400).json({ error: "Payment has not been completed." });
        }

        const gatewayAmount = successfulPayment.payment_amount;
        const cfPaymentId = successfulPayment.cf_payment_id;

        const fulfillmentResult = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({ where: { id: orderId } });
            
            if (!order) throw new Error("ORDER_NOT_FOUND");
            if (order.status === 'SUCCESS') throw new Error("ALREADY_FULFILLED"); 

            if (Number(gatewayAmount) !== Number(order.totalAmount)) {
                console.error(`[SECURITY] Amount mismatch on ${orderId}. Expected ${order.totalAmount}, got ${gatewayAmount}.`);
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'FLAGGED_AMOUNT_MISMATCH' }
                });
                throw new Error("AMOUNT_MISMATCH");
            }

            return await tx.order.update({
                where: { id: orderId },
                data: { 
                    status: 'SUCCESS',
                    transactionId: String(cfPaymentId) 
                }
            });
        });
        
        res.status(200).json({ success: true, order: fulfillmentResult });
    } catch (error) {
        if (error.message === "ALREADY_FULFILLED") {
            return res.status(200).json({ success: true, message: "Asset already secured." });
        }
        if (error.message === "AMOUNT_MISMATCH") {
            return res.status(400).json({ error: "Payment verification failed due to monetary mismatch." });
        }
        if (error.message === "ORDER_NOT_FOUND") {
            return res.status(404).json({ error: "Order reference could not be located in ledger." });
        }
        
        console.error("Fulfillment Verification Error:", error.message);
        res.status(500).json({ error: "Failed to verify transaction with the gateway." });
    }
};

// 3. Passive Cryptographic Webhook (Triggered by Cashfree)
const webhookHandler = async (req, res) => {
    try {
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];
        const rawBody = req.rawBody;

        if (!signature || !timestamp || !rawBody) {
            return res.status(400).send('Missing webhook cryptography headers.');
        }

        const dataToHash = timestamp + rawBody;

        // THE FIX (Item #1): Foolproof Secret Key Extraction
        // This checks both common naming conventions so your webhook verifies regardless of what you named it in .env
        const secretKey = process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET_KEY;

        const expectedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(dataToHash)
            .digest('base64');

        if (expectedSignature !== signature) {
            console.warn("[SECURITY ALERT] Invalid webhook signature detected. Potential spoofing attempt.");
            return res.status(401).send('Signature mismatch');
        }

        const payload = req.body;
        
        if (payload.event === 'PAYMENT_SUCCESS_WEBHOOK') {
            const orderId = payload.data.order.order_id;
            const gatewayAmount = payload.data.payment.payment_amount;
            const cfPaymentId = payload.data.payment.cf_payment_id;
            
            await prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({ where: { id: orderId } });
                
                if (!order || order.status === 'SUCCESS') return; 
                
                if (Number(gatewayAmount) !== Number(order.totalAmount)) {
                    await tx.order.update({
                        where: { id: orderId },
                        data: { status: 'FLAGGED_AMOUNT_MISMATCH' }
                    });
                    return;
                }

                await tx.order.update({
                    where: { id: orderId },
                    data: { 
                        status: 'SUCCESS',
                        transactionId: String(cfPaymentId)
                    }
                });
                console.log(`[iSevens Network] Webhook securely confirmed payment for order: ${orderId}`);
            });
        }

        res.status(200).send('WEBHOOK_RECEIVED');
    } catch (error) {
        console.error("Webhook Processing Fault:", error);
        res.status(500).send('WEBHOOK_FAULT');
    }
};

module.exports = { createOrder, verifyPayment, webhookHandler };