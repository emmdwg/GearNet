-- Vehicle multi-photo gallery + chat delivered receipts
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "images" TEXT NOT NULL DEFAULT '[]';

ALTER TABLE "ConversationParticipant" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);

-- Backfill gallery from primary image when empty
UPDATE "Vehicle"
SET "images" = CASE
  WHEN "image" IS NOT NULL AND "image" <> '' THEN json_build_array("image")::text
  ELSE '[]'
END
WHERE "images" IS NULL OR "images" = '' OR "images" = '[]';
