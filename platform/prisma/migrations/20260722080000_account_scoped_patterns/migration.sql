ALTER TABLE "NarrativePattern" ADD COLUMN "socialAccountId" TEXT;

DROP INDEX IF EXISTS "NarrativePattern_profileId_type_value_key";
CREATE UNIQUE INDEX "NarrativePattern_profileId_socialAccountId_type_value_key"
  ON "NarrativePattern"("profileId", "socialAccountId", "type", "value");
CREATE INDEX "NarrativePattern_socialAccountId_idx" ON "NarrativePattern"("socialAccountId");

ALTER TABLE "NarrativePattern"
  ADD CONSTRAINT "NarrativePattern_socialAccountId_fkey"
  FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
