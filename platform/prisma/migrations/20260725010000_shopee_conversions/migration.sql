-- CreateTable
CREATE TABLE IF NOT EXISTS "ShopeeConversion" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "conversionId" TEXT NOT NULL,
    "purchaseTime" TIMESTAMP(3) NOT NULL,
    "clickTime" TIMESTAMP(3),
    "totalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellerCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shopeeCommissionCapped" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buyerType" TEXT,
    "device" TEXT,
    "utmContent" TEXT,
    "orderId" TEXT NOT NULL DEFAULT '',
    "orderStatus" TEXT NOT NULL DEFAULT '',
    "itemId" TEXT NOT NULL DEFAULT '',
    "itemName" TEXT NOT NULL DEFAULT '',
    "shopName" TEXT NOT NULL DEFAULT '',
    "itemPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "itemTotalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attributionType" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShopeeConversion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShopeeConversion_profileId_conversionId_orderId_itemId_key"
  ON "ShopeeConversion"("profileId", "conversionId", "orderId", "itemId");
CREATE INDEX IF NOT EXISTS "ShopeeConversion_profileId_purchaseTime_idx"
  ON "ShopeeConversion"("profileId", "purchaseTime");
CREATE INDEX IF NOT EXISTS "ShopeeConversion_profileId_orderStatus_idx"
  ON "ShopeeConversion"("profileId", "orderStatus");
CREATE INDEX IF NOT EXISTS "ShopeeConversion_profileId_itemId_idx"
  ON "ShopeeConversion"("profileId", "itemId");

DO $$ BEGIN
  ALTER TABLE "ShopeeConversion"
    ADD CONSTRAINT "ShopeeConversion_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
