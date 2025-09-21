-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE', 'USER_SUSPEND', 'USER_UNSUSPEND');

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(36),
    "action" "public"."AuditAction" NOT NULL,
    "meta" JSONB,
    "ip" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "public"."AuditLog"("userId", "createdAt");
