-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN "legal_entity" TEXT,
ADD COLUMN "product_type" TEXT,
ADD COLUMN "delivery_info" TEXT,
ADD COLUMN "supplier_status" TEXT;

-- AlterTable
ALTER TABLE "material_placements" ADD COLUMN "cell_label" TEXT NOT NULL DEFAULT '';

-- DropIndex
DROP INDEX IF EXISTS "material_placements_material_id_zone_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "material_placements_material_id_zone_id_cell_label_key" ON "material_placements"("material_id", "zone_id", "cell_label");

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('IN_PROGRESS', 'IN_TRANSIT', 'AT_TERMINAL', 'DELIVERED', 'ACCEPTED');

-- CreateTable
CREATE TABLE "delivery_shipments" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "supplier_name" TEXT NOT NULL,
    "order_date" TIMESTAMP(3),
    "invoice_received" BOOLEAN NOT NULL DEFAULT false,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "carrier" TEXT,
    "carrier_invoice_paid" BOOLEAN NOT NULL DEFAULT false,
    "amount" DECIMAL(12,2),
    "delivery_type" TEXT,
    "tracking_number" TEXT,
    "contents" TEXT,
    "carrier_request_date" TIMESTAMP(3),
    "carrier_accepted_date" TIMESTAMP(3),
    "terminal_arrived_date" TIMESTAMP(3),
    "delivered_date" TIMESTAMP(3),
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_shipments_status_idx" ON "delivery_shipments"("status");

-- CreateIndex
CREATE INDEX "delivery_shipments_order_date_idx" ON "delivery_shipments"("order_date");

-- AddForeignKey
ALTER TABLE "delivery_shipments" ADD CONSTRAINT "delivery_shipments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
