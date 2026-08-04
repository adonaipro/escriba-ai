CREATE TABLE "ShortLink" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "destinationUrl" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "socialAccountId" TEXT,
  "campaignId" TEXT,
  "trendId" TEXT,
  "productId" TEXT,
  "marketplace" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShortLinkClick" (
  "id" TEXT NOT NULL,
  "shortLinkId" TEXT NOT NULL,
  "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "referer" TEXT,
  "userAgent" TEXT,
  "ipHash" TEXT NOT NULL,
  "country" TEXT,
  "isUnique" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ShortLinkClick_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShortLink_code_key" ON "ShortLink"("code");
CREATE INDEX "ShortLink_campaignId_idx" ON "ShortLink"("campaignId");
CREATE INDEX "ShortLink_trendId_idx" ON "ShortLink"("trendId");
CREATE INDEX "ShortLink_productId_idx" ON "ShortLink"("productId");
CREATE INDEX "ShortLink_socialAccountId_idx" ON "ShortLink"("socialAccountId");
CREATE INDEX "ShortLink_workspaceId_createdAt_idx" ON "ShortLink"("workspaceId", "createdAt");
CREATE INDEX "ShortLinkClick_shortLinkId_clickedAt_idx" ON "ShortLinkClick"("shortLinkId", "clickedAt");
CREATE INDEX "ShortLinkClick_clickedAt_idx" ON "ShortLinkClick"("clickedAt");
CREATE INDEX "ShortLinkClick_shortLinkId_ipHash_clickedAt_idx" ON "ShortLinkClick"("shortLinkId", "ipHash", "clickedAt");

ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trend"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShortLinkClick" ADD CONSTRAINT "ShortLinkClick_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
