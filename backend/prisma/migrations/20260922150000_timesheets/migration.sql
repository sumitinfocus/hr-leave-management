CREATE TYPE "TimesheetPeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "TimesheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TABLE "Timesheet" (
  "id" SERIAL NOT NULL,
  "employeeId" INTEGER NOT NULL,
  "periodType" "TimesheetPeriodType" NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "vendorName" TEXT,
  "staffName" TEXT,
  "projectCode" TEXT,
  "assignmentName" TEXT,
  "taskCode" TEXT,
  "daysWorked" INTEGER,
  "approverName" TEXT,
  "status" "TimesheetStatus" NOT NULL DEFAULT 'DRAFT',
  "rejectionReason" TEXT,
  "sourceFingerprint" TEXT,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "approvedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Timesheet_sourceFingerprint_key" ON "Timesheet"("sourceFingerprint");

CREATE TABLE "TimesheetEntry" (
  "id" SERIAL NOT NULL,
  "timesheetId" INTEGER NOT NULL,
  "workDate" TIMESTAMP(3) NOT NULL,
  "dayName" TEXT,
  "timeIn" TIMESTAMP(3),
  "timeOut" TIMESTAMP(3),
  "activities" TEXT,
  CONSTRAINT "TimesheetEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimesheetStatusHistory" (
  "id" SERIAL NOT NULL,
  "timesheetId" INTEGER NOT NULL,
  "status" "TimesheetStatus" NOT NULL,
  "comment" TEXT,
  "changedById" INTEGER,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TimesheetStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimesheetImport" (
  "id" SERIAL NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceFingerprint" TEXT NOT NULL,
  "originalName" TEXT,
  "status" TEXT NOT NULL,
  "errorMessage" TEXT,
  "timesheetId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TimesheetImport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TimesheetImport_sourceFingerprint_key" ON "TimesheetImport"("sourceFingerprint");
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimesheetStatusHistory" ADD CONSTRAINT "TimesheetStatusHistory_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimesheetImport" ADD CONSTRAINT "TimesheetImport_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
