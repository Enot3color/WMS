-- CreateTable
CREATE TABLE "status_references" (
    "id" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_screens" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "app_screens_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "role_screen_permissions" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "screen_code" TEXT NOT NULL,
    "can_read" BOOLEAN NOT NULL DEFAULT true,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_update" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "role_screen_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "status_references_group_code_key" ON "status_references"("group", "code");

-- CreateIndex
CREATE UNIQUE INDEX "role_screen_permissions_role_screen_code_key" ON "role_screen_permissions"("role", "screen_code");

-- AddForeignKey
ALTER TABLE "role_screen_permissions" ADD CONSTRAINT "role_screen_permissions_screen_code_fkey" FOREIGN KEY ("screen_code") REFERENCES "app_screens"("code") ON DELETE CASCADE ON UPDATE CASCADE;
