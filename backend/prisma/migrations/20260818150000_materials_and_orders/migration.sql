-- AlterTable
ALTER TABLE "materials" ADD COLUMN "series" TEXT,
ADD COLUMN "color" TEXT,
ADD COLUMN "density_gsm" INTEGER,
ADD COLUMN "thickness_micron" INTEGER,
ADD COLUMN "texture" TEXT,
ADD COLUMN "coating" TEXT,
ADD COLUMN "dimensions" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "current_price" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "manager_requests" ADD COLUMN "client_info" TEXT;
