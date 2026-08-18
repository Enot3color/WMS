-- CreateEnum
CREATE TYPE "CounterpartyType" AS ENUM ('SUPPLIER', 'CONTRACTOR', 'BOTH');

-- CreateEnum
CREATE TYPE "SupplierOrderStatus" AS ENUM ('DRAFT', 'SENT', 'IN_TRANSIT', 'DELIVERED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "RequestStatus_new" AS ENUM ('SUBMITTED', 'IN_PROGRESS', 'ISSUED', 'AWAITING_SUPPLY', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "counterparties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CounterpartyType" NOT NULL DEFAULT 'SUPPLIER',
    "legal_entity" TEXT,
    "contact_info" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counterparties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "counterparties_name_key" ON "counterparties"("name");

-- Migrate suppliers
INSERT INTO "counterparties" ("id", "name", "type", "legal_entity", "contact_info", "address", "notes", "created_at", "updated_at")
SELECT
    "id",
    "name",
    'SUPPLIER'::"CounterpartyType",
    "legal_entity",
    "contact_info",
    "delivery_info",
    COALESCE("product_type", "supplier_status"),
    "created_at",
    "updated_at"
FROM "suppliers"
ON CONFLICT ("name") DO NOTHING;

-- Migrate contractors
INSERT INTO "counterparties" ("id", "name", "type", "legal_entity", "contact_info", "address", "notes", "created_at", "updated_at")
SELECT
    "id",
    "name",
    'CONTRACTOR'::"CounterpartyType",
    "legal_entity",
    "contact_info",
    "address",
    "notes",
    "created_at",
    "updated_at"
FROM "contractors"
ON CONFLICT ("name") DO UPDATE SET
    "type" = 'BOTH'::"CounterpartyType",
    "legal_entity" = COALESCE("counterparties"."legal_entity", EXCLUDED."legal_entity"),
    "contact_info" = COALESCE("counterparties"."contact_info", EXCLUDED."contact_info"),
    "address" = COALESCE("counterparties"."address", EXCLUDED."address"),
    "notes" = COALESCE("counterparties"."notes", EXCLUDED."notes");

-- CreateTable
CREATE TABLE "counterparty_offers" (
    "id" TEXT NOT NULL,
    "counterparty_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "delivery_method" TEXT,
    "supply_status" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counterparty_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "counterparty_offers_counterparty_id_material_id_key" ON "counterparty_offers"("counterparty_id", "material_id");

-- CreateIndex
CREATE INDEX "counterparty_offers_material_id_is_primary_idx" ON "counterparty_offers"("material_id", "is_primary");

INSERT INTO "counterparty_offers" ("id", "counterparty_id", "material_id", "price", "delivery_method", "supply_status", "is_primary", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    m."primary_supplier_id",
    m."id",
    COALESCE(m."current_price", 0),
    s."delivery_info",
    s."supplier_status",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "materials" m
JOIN "suppliers" s ON s."id" = m."primary_supplier_id"
WHERE m."primary_supplier_id" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "counterparties" c WHERE c."id" = m."primary_supplier_id");

INSERT INTO "counterparty_offers" ("id", "counterparty_id", "material_id", "price", "is_primary", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    m."alt_supplier_id",
    m."id",
    0,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "materials" m
WHERE m."alt_supplier_id" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "counterparties" c WHERE c."id" = m."alt_supplier_id")
ON CONFLICT ("counterparty_id", "material_id") DO NOTHING;

-- AlterTable ManagerRequest
ALTER TABLE "manager_requests" ADD COLUMN IF NOT EXISTS "warehouse_seen_at" TIMESTAMP(3);

ALTER TABLE "manager_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "request_status_logs" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "manager_requests"
  ALTER COLUMN "status" TYPE "RequestStatus_new"
  USING (
    CASE "status"::text
      WHEN 'NEW' THEN 'SUBMITTED'
      WHEN 'ORDERED' THEN 'AWAITING_SUPPLY'
      WHEN 'ARRIVED' THEN 'ISSUED'
      WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'
      WHEN 'COMPLETED' THEN 'COMPLETED'
      WHEN 'CANCELLED' THEN 'CANCELLED'
      ELSE 'SUBMITTED'
    END
  )::"RequestStatus_new";

ALTER TABLE "request_status_logs"
  ALTER COLUMN "status" TYPE "RequestStatus_new"
  USING (
    CASE "status"::text
      WHEN 'NEW' THEN 'SUBMITTED'
      WHEN 'ORDERED' THEN 'AWAITING_SUPPLY'
      WHEN 'ARRIVED' THEN 'ISSUED'
      WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'
      WHEN 'COMPLETED' THEN 'COMPLETED'
      WHEN 'CANCELLED' THEN 'CANCELLED'
      ELSE 'SUBMITTED'
    END
  )::"RequestStatus_new";

DROP TYPE "RequestStatus";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";

ALTER TABLE "manager_requests" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::"RequestStatus";

-- Drop legacy request line flag
ALTER TABLE "manager_request_lines" DROP COLUMN IF EXISTS "from_stock";

-- Drop material supplier/price fields
ALTER TABLE "materials" DROP CONSTRAINT IF EXISTS "materials_primary_supplier_id_fkey";
ALTER TABLE "materials" DROP CONSTRAINT IF EXISTS "materials_alt_supplier_id_fkey";
ALTER TABLE "materials" DROP COLUMN IF EXISTS "primary_supplier_id";
ALTER TABLE "materials" DROP COLUMN IF EXISTS "alt_supplier_id";
ALTER TABLE "materials" DROP COLUMN IF EXISTS "current_price";
ALTER TABLE "materials" DROP COLUMN IF EXISTS "season_cutoff";

-- Drop legacy tables
DROP TABLE IF EXISTS "delivery_shipments";
DROP TABLE IF EXISTS "inventory_lines";
DROP TABLE IF EXISTS "inventory_sessions";
DROP TABLE IF EXISTS "material_placements";
DROP TABLE IF EXISTS "reservations";
DROP TABLE IF EXISTS "warehouse_zones";
DROP TABLE IF EXISTS "contractors";
DROP TABLE IF EXISTS "suppliers";

DROP TYPE IF EXISTS "DeliveryStatus";
DROP TYPE IF EXISTS "InventorySessionStatus";

-- AddForeignKey
ALTER TABLE "counterparty_offers" ADD CONSTRAINT "counterparty_offers_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "counterparties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "counterparty_offers" ADD CONSTRAINT "counterparty_offers_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "movement_documents" ADD CONSTRAINT "movement_documents_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "manager_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "manager_requests_status_created_at_idx" ON "manager_requests"("status", "created_at");

-- CreateTable
CREATE TABLE "supplier_orders" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "manager_request_id" TEXT,
    "counterparty_id" TEXT NOT NULL,
    "status" "SupplierOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "delivery_method" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "supplier_orders_number_key" ON "supplier_orders"("number");
CREATE INDEX "supplier_orders_status_idx" ON "supplier_orders"("status");

CREATE TABLE "supplier_order_lines" (
    "id" TEXT NOT NULL,
    "supplier_order_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "supplier_order_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_manager_request_id_fkey" FOREIGN KEY ("manager_request_id") REFERENCES "manager_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "counterparties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_order_lines" ADD CONSTRAINT "supplier_order_lines_supplier_order_id_fkey" FOREIGN KEY ("supplier_order_id") REFERENCES "supplier_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplier_order_lines" ADD CONSTRAINT "supplier_order_lines_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
