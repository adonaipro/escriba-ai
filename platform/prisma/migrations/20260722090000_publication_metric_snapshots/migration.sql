CREATE TABLE "PublicationMetricSnapshot" (
  "id" TEXT NOT NULL,
  "publicationId" TEXT NOT NULL,
  "capturedDate" TIMESTAMP(3) NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "replies" INTEGER NOT NULL DEFAULT 0,
  "reposts" INTEGER NOT NULL DEFAULT 0,
  "quotes" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PublicationMetricSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PublicationMetricSnapshot_publicationId_capturedDate_key"
  ON "PublicationMetricSnapshot"("publicationId", "capturedDate");
CREATE INDEX "PublicationMetricSnapshot_capturedDate_idx"
  ON "PublicationMetricSnapshot"("capturedDate");
CREATE INDEX "PublicationMetricSnapshot_publicationId_capturedAt_idx"
  ON "PublicationMetricSnapshot"("publicationId", "capturedAt");
ALTER TABLE "PublicationMetricSnapshot"
  ADD CONSTRAINT "PublicationMetricSnapshot_publicationId_fkey"
  FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
