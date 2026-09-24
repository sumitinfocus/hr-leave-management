-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Timesheet" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "LeaveTypePolicy" (
    "id" SERIAL NOT NULL,
    "code" "LeaveType" NOT NULL,
    "label" TEXT NOT NULL,
    "defaultAnnualDays" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#7c3aed',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveTypePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveTypePolicy_code_key" ON "LeaveTypePolicy"("code");
