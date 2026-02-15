ALTER TABLE "Vote"
ADD COLUMN "anonymousKey" TEXT;

CREATE UNIQUE INDEX "Vote_pollId_anonymousKey_key" ON "Vote" ("pollId", "anonymousKey");