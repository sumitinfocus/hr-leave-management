-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LeaveApplication"
ADD COLUMN "sourceEmailSubject" TEXT,
ADD COLUMN "sourceMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LeaveApplication_sourceMessageId_key" ON "LeaveApplication"("sourceMessageId");

-- CreateEnum
CREATE TYPE "EmailProcessingStatus" AS ENUM ('PROCESSED', 'IGNORED', 'FAILED');

-- CreateTable
CREATE TABLE "EmailProcessing" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "senderEmail" TEXT,
    "receivedAt" TIMESTAMP(3),
    "status" "EmailProcessingStatus" NOT NULL,
    "leaveApplicationId" INTEGER,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailProcessing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailProcessing_messageId_key" ON "EmailProcessing"("messageId");
