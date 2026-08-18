-- CreateTable
CREATE TABLE "contractors" (
    "id" TEXT NOT NULL,
    "services" TEXT,
    "name" TEXT NOT NULL,
    "legal_entity" TEXT,
    "contact_person" TEXT,
    "contact_info" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contractors_name_key" ON "contractors"("name");
