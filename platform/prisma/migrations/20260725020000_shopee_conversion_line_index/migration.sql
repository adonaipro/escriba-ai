-- Add lineIndex so repeated itemIds inside the same order are not collapsed.
ALTER TABLE "ShopeeConversion" ADD COLUMN IF NOT EXISTS "lineIndex" INTEGER NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS "ShopeeConversion_profileId_conversionId_orderId_itemId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "ShopeeConversion_profileId_conversionId_orderId_itemId_lineIndex_key"
  ON "ShopeeConversion"("profileId", "conversionId", "orderId", "itemId", "lineIndex");
