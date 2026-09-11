-- Pluten Admin 2.0: analytics, financial snapshots, refunds, and enum hardening.
-- Review against your production backup before applying.

-- New enums.
DO $$ BEGIN CREATE TYPE "OfferType" AS ENUM ('PERCENTAGE','FIXED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "OfferApplyTo" AS ENUM ('ALL','SELECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "OfferStatus" AS ENUM ('DRAFT','ACTIVE','PAUSED','EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "RefundStatus" AS ENUM ('PENDING','SUCCESS','FAILED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW','SESSION_HEARTBEAT','PRODUCT_VIEWED','PORTFOLIO_VIEWED','CHECKOUT_STARTED','PAYMENT_ATTEMPTED','PAYMENT_SUCCESS','PAYMENT_FAILED','PRODUCT_DOWNLOADED','SIGNUP','LOGIN','PORTFOLIO_CREATED','PORTFOLIO_PUBLISHED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DeviceType" AS ENUM ('MOBILE','DESKTOP','TABLET','UNKNOWN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Refuse to coerce unknown business states. This makes the migration fail safely
-- instead of silently converting unexpected legacy values.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Order" WHERE UPPER(COALESCE("status",'')) NOT IN ('PENDING','SUCCESS','FAILED','REFUNDED')) THEN
    RAISE EXCEPTION 'Unknown Order.status value found; migration aborted so no status is silently coerced.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Offer" WHERE UPPER(COALESCE("type",'')) NOT IN ('PERCENTAGE','FIXED')) THEN
    RAISE EXCEPTION 'Unknown Offer.type value found; migration aborted so no type is silently coerced.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Offer" WHERE UPPER(COALESCE("applyTo",'')) NOT IN ('ALL','SELECTED')) THEN
    RAISE EXCEPTION 'Unknown Offer.applyTo value found; migration aborted so no target is silently coerced.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Offer" WHERE UPPER(COALESCE("status",'')) NOT IN ('DRAFT','ACTIVE','PAUSED','EXPIRED')) THEN
    RAISE EXCEPTION 'Unknown Offer.status value found; migration aborted so no status is silently coerced.';
  END IF;
END $$;

-- Harden Order.status using the existing OrderStatus enum from the original schema.
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus" USING CASE UPPER("status") WHEN 'PENDING' THEN 'PENDING'::"OrderStatus" WHEN 'SUCCESS' THEN 'SUCCESS'::"OrderStatus" WHEN 'FAILED' THEN 'FAILED'::"OrderStatus" WHEN 'REFUNDED' THEN 'REFUNDED'::"OrderStatus" ELSE 'PENDING'::"OrderStatus" END;
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Harden Offer enums.
ALTER TABLE "Offer" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Offer" ALTER COLUMN "type" TYPE "OfferType" USING CASE UPPER("type") WHEN 'PERCENTAGE' THEN 'PERCENTAGE'::"OfferType" WHEN 'FIXED' THEN 'FIXED'::"OfferType" ELSE 'PERCENTAGE'::"OfferType" END;
ALTER TABLE "Offer" ALTER COLUMN "applyTo" TYPE "OfferApplyTo" USING CASE UPPER("applyTo") WHEN 'SELECTED' THEN 'SELECTED'::"OfferApplyTo" ELSE 'ALL'::"OfferApplyTo" END;
ALTER TABLE "Offer" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Offer" ALTER COLUMN "status" TYPE "OfferStatus" USING CASE UPPER("status") WHEN 'ACTIVE' THEN 'ACTIVE'::"OfferStatus" WHEN 'PAUSED' THEN 'PAUSED'::"OfferStatus" WHEN 'EXPIRED' THEN 'EXPIRED'::"OfferStatus" ELSE 'DRAFT'::"OfferStatus" END;
ALTER TABLE "Offer" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- Financial/payment fields.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "offerId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "originalAmount" DECIMAL(12,2);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "couponCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "gateway" TEXT NOT NULL DEFAULT 'CASHFREE';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "gatewayOrderId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "gatewayPaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentFailureReason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerSnapshot" JSONB;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Order_productId_status_idx" ON "Order"("productId","status");
CREATE INDEX IF NOT EXISTS "Order_gatewayOrderId_idx" ON "Order"("gatewayOrderId");
CREATE INDEX IF NOT EXISTS "Order_gatewayPaymentId_idx" ON "Order"("gatewayPaymentId");
CREATE INDEX IF NOT EXISTS "Order_paidAt_idx" ON "Order"("paidAt");
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId","createdAt");

UPDATE "Order" o SET "originalAmount" = p.price, "discountAmount" = GREATEST(0, p.price - o."totalAmount") FROM "Product" p WHERE p.id=o."productId" AND o."originalAmount" IS NULL;
UPDATE "Order" SET "gatewayOrderId" = id WHERE "gatewayOrderId" IS NULL AND "status" IN ('SUCCESS','REFUNDED');
UPDATE "Order" SET "gatewayPaymentId" = "transactionId" WHERE "gatewayPaymentId" IS NULL AND "status" IN ('SUCCESS','REFUNDED') AND "transactionId" IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Refunds.
CREATE TABLE IF NOT EXISTS "Refund" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "refundId" TEXT NOT NULL,
  "gatewayRefundId" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Refund_refundId_key" ON "Refund"("refundId");
CREATE INDEX IF NOT EXISTS "Refund_orderId_idx" ON "Refund"("orderId");
CREATE INDEX IF NOT EXISTS "Refund_userId_idx" ON "Refund"("userId");
CREATE INDEX IF NOT EXISTS "Refund_status_idx" ON "Refund"("status");
CREATE INDEX IF NOT EXISTS "Refund_createdAt_idx" ON "Refund"("createdAt");
DO $$ BEGIN
  ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Refund" ADD CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Analytics sessions.
CREATE TABLE IF NOT EXISTS "AnalyticsSession" (
  "id" TEXT NOT NULL,
  "sessionKey" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "userId" TEXT,
  "currentPath" TEXT,
  "deviceType" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
  "browser" TEXT,
  "os" TEXT,
  "country" TEXT,
  "referrer" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsSession_sessionKey_key" ON "AnalyticsSession"("sessionKey");
CREATE INDEX IF NOT EXISTS "AnalyticsSession_visitorId_idx" ON "AnalyticsSession"("visitorId");
CREATE INDEX IF NOT EXISTS "AnalyticsSession_userId_idx" ON "AnalyticsSession"("userId");
CREATE INDEX IF NOT EXISTS "AnalyticsSession_lastSeen_idx" ON "AnalyticsSession"("lastSeen");
CREATE INDEX IF NOT EXISTS "AnalyticsSession_deviceType_idx" ON "AnalyticsSession"("deviceType");
CREATE INDEX IF NOT EXISTS "AnalyticsSession_utmSource_idx" ON "AnalyticsSession"("utmSource");
DO $$ BEGIN
  ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Analytics events.
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "type" "AnalyticsEventType" NOT NULL,
  "visitorId" TEXT NOT NULL,
  "sessionId" TEXT,
  "userId" TEXT,
  "productId" TEXT,
  "portfolioId" TEXT,
  "path" TEXT,
  "deviceType" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
  "browser" TEXT,
  "os" TEXT,
  "country" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type","createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_visitorId_createdAt_idx" ON "AnalyticsEvent"("visitorId","createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId","createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_productId_type_createdAt_idx" ON "AnalyticsEvent"("productId","type","createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_portfolioId_type_createdAt_idx" ON "AnalyticsEvent"("portfolioId","type","createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_deviceType_createdAt_idx" ON "AnalyticsEvent"("deviceType","createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_country_createdAt_idx" ON "AnalyticsEvent"("country","createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
DO $$ BEGIN ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
