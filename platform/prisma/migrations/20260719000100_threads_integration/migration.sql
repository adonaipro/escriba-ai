ALTER TABLE "SocialAccount" ADD COLUMN "tokenScopes" TEXT;
ALTER TABLE "TrendPost" ADD COLUMN "externalId" TEXT;
ALTER TABLE "TrendPost" ADD COLUMN "externalUrl" TEXT;
ALTER TABLE "Publication" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Publication" ADD COLUMN "externalUrl" TEXT;
ALTER TABLE "Publication" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Publication" ADD COLUMN "lastError" TEXT;
ALTER TABLE "Publication" ADD COLUMN "processingAt" TIMESTAMP(3);
