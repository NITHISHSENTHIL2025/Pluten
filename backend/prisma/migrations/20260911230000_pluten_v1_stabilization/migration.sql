-- Pluten v1 stabilization: forward-only production migration.
-- Existing users, products, orders and portfolios are preserved.

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'PORTFOLIO_UNPUBLISHED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'SUPPORT_TICKET_CREATED';

CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportTicketPriority" AS ENUM ('NORMAL', 'HIGH', 'URGENT');

ALTER TABLE "Order" ADD COLUMN "paymentSessionId" TEXT;
ALTER TABLE "Offer" ADD COLUMN "maxRedemptions" INTEGER;
ALTER TABLE "Offer" ADD COLUMN "perUserLimit" INTEGER;

CREATE TABLE "Entitlement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sourceOrderId" TEXT,
  "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "revokeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioSlugHistory" (
  "id" TEXT NOT NULL,
  "portfolioId" TEXT NOT NULL,
  "oldSlug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortfolioSlugHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "ticketNumber" TEXT NOT NULL,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "orderReference" TEXT,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Entitlement_userId_productId_key" ON "Entitlement"("userId", "productId");
CREATE INDEX "Entitlement_status_idx" ON "Entitlement"("status");
CREATE INDEX "Entitlement_sourceOrderId_idx" ON "Entitlement"("sourceOrderId");
CREATE UNIQUE INDEX "PortfolioSlugHistory_oldSlug_key" ON "PortfolioSlugHistory"("oldSlug");
CREATE INDEX "PortfolioSlugHistory_portfolioId_idx" ON "PortfolioSlugHistory"("portfolioId");
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");
CREATE INDEX "SupportTicket_email_idx" ON "SupportTicket"("email");

ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioSlugHistory" ADD CONSTRAINT "PortfolioSlugHistory_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed ownership from successful legacy purchases. One entitlement per user/product.
INSERT INTO "Entitlement" (
  "id", "userId", "productId", "sourceOrderId", "status", "grantedAt", "createdAt", "updatedAt"
)
SELECT
  ('ent_' || md5(purchased."userId" || ':' || purchased."productId")),
  purchased."userId",
  purchased."productId",
  purchased."id",
  'ACTIVE'::"EntitlementStatus",
  COALESCE(purchased."paidAt", purchased."createdAt"),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT ON ("userId", "productId")
    "id", "userId", "productId", "paidAt", "createdAt"
  FROM "Order"
  WHERE "status" = 'SUCCESS'
  ORDER BY "userId", "productId", COALESCE("paidAt", "createdAt") DESC
) AS purchased
ON CONFLICT ("userId", "productId") DO NOTHING;

-- Keep only the newest pending checkout for each user/product before enforcing one active checkout.
WITH duplicates AS (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "userId", "productId" ORDER BY "createdAt" DESC) AS rn
  FROM "Order"
  WHERE "status" = 'PENDING'
)
UPDATE "Order" AS o
SET "status" = 'FAILED',
    "paymentFailureReason" = COALESCE(o."paymentFailureReason", 'Superseded during Pluten v1 checkout stabilization'),
    "updatedAt" = CURRENT_TIMESTAMP
FROM duplicates d
WHERE o."id" = d."id" AND d.rn > 1;

CREATE UNIQUE INDEX "Order_one_pending_purchase_per_user_product"
ON "Order"("userId", "productId")
WHERE "status" = 'PENDING';
