ALTER TABLE "Publication"
  ADD COLUMN "likes" INTEGER,
  ADD COLUMN "replies" INTEGER,
  ADD COLUMN "reposts" INTEGER,
  ADD COLUMN "quotes" INTEGER,
  ADD COLUMN "shares" INTEGER,
  ADD COLUMN "metricsSyncedAt" TIMESTAMP(3),
  ADD COLUMN "metricsLastError" TEXT;

ALTER TABLE "Trend"
  ADD COLUMN "metricsEvaluatedAt" TIMESTAMP(3);

ALTER TABLE "NarrativePattern"
  ADD COLUMN "evaluatedCount" INTEGER NOT NULL DEFAULT 0;
