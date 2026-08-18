-- Add new columns as nullable first
ALTER TABLE "users" ADD COLUMN "first_name" TEXT;
ALTER TABLE "users" ADD COLUMN "last_name" TEXT;
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "login" TEXT;

-- Migrate existing data
UPDATE "users"
SET
  "first_name" = COALESCE(NULLIF(split_part("name", ' ', 1), ''), "name"),
  "last_name" = CASE
    WHEN position(' ' in "name") > 0 THEN substring("name" from position(' ' in "name") + 1)
    ELSE '—'
  END,
  "login" = split_part("email", '@', 1),
  "phone" = '79000000000'
WHERE "first_name" IS NULL;

-- Enforce required fields and uniqueness
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "login" SET NOT NULL;

CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

ALTER TABLE "users" DROP COLUMN "name";
