const crypto = require('crypto')
const bcrypt = require('bcrypt')
const { PrismaClient, TimesheetStatus } = require('@prisma/client')
const { getEmployeeCreationConfig } = require('../config/emailIntegration')

const prisma = new PrismaClient()

function validateTimesheet(input) {
  if (!['DAILY', 'WEEKLY', 'MONTHLY'].includes(input.periodType)) throw new Error('Invalid timesheet period type')
  const start = new Date(input.periodStart)
  const end = new Date(input.periodEnd)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) throw new Error('Invalid timesheet period dates')
  if (!Array.isArray(input.entries)) throw new Error('Timesheet entries must be an array')
  for (const entry of input.entries) {
    const workDate = new Date(entry.workDate)
    if (Number.isNaN(workDate.getTime())) throw new Error('Each timesheet entry requires a valid work date')
  }
}

function employeeNameFromStaff(staffName, email) {
  const parts = String(staffName || email.split('@')[0]).trim().split(/\s+/)
  return { firstName: parts[0] || 'Employee', lastName: parts.slice(1).join(' ') || 'User' }
}

async function ensureEmployee(tx, input) {
  if (input.employeeId) return tx.employee.findUnique({ where: { id: input.employeeId } })
  const email = String(input.employeeEmail || '').trim().toLowerCase()
  if (!email) throw new Error('Employee email is required')
  const existing = await tx.employee.findUnique({ where: { email } })
  if (existing) return existing
  const config = getEmployeeCreationConfig()
  const manager = await tx.employee.findUnique({ where: { email: config.managerEmail } })
  if (!manager) throw new Error(`Configured manager does not exist: ${config.managerEmail}`)
  const department = await tx.department.findFirst({ orderBy: { id: 'asc' } })
  if (!department) throw new Error('No department exists for new employee creation')
  const passwordHash = await bcrypt.hash(crypto.randomBytes(18).toString('base64url'), 10)
  return tx.employee.create({
    data: { ...employeeNameFromStaff(input.staffName, email), email, passwordHash, mustChangePassword: true, role: 'EMPLOYEE', departmentId: department.id, managerId: manager.id }
  })
}

async function createTimesheet(input, actorId, status = TimesheetStatus.DRAFT, source = null) {
  validateTimesheet(input)
  return prisma.$transaction(async tx => {
    const employee = await ensureEmployee(tx, input)
    const data = {
      employeeId: employee.id,
      periodType: input.periodType,
      periodStart: new Date(input.periodStart),
      periodEnd: new Date(input.periodEnd),
      vendorName: input.vendorName || null,
      staffName: input.staffName || `${employee.firstName} ${employee.lastName}`,
      projectCode: input.projectCode || null,
      assignmentName: input.assignmentName || null,
      taskCode: input.taskCode || null,
      daysWorked: input.daysWorked ?? null,
      approverName: input.approverName || null,
      status,
      submittedAt: status === TimesheetStatus.SUBMITTED ? new Date() : null,
      sourceFingerprint: source?.fingerprint || null
    }
    const timesheet = await tx.timesheet.create({ data: { ...data, entries: { create: input.entries.map(entry => ({ workDate: new Date(entry.workDate), dayName: entry.dayName || null, timeIn: entry.timeIn ? new Date(entry.timeIn) : null, timeOut: entry.timeOut ? new Date(entry.timeOut) : null, activities: entry.activities || null })) } } })
    await tx.timesheetStatusHistory.create({ data: { timesheetId: timesheet.id, status, changedById: actorId } })
    if (source) await tx.timesheetImport.create({ data: { sourceType: source.sourceType, sourceFingerprint: source.fingerprint, originalName: source.originalName, status: 'IMPORTED', timesheetId: timesheet.id } })
    return tx.timesheet.findUnique({ where: { id: timesheet.id }, include: { employee: true, entries: true } })
  })
}

async function importTimesheet(input, actorId) {
  const existing = await prisma.timesheetImport.findUnique({ where: { sourceFingerprint: input.fingerprint } })
  if (existing) return { duplicate: true, timesheetId: existing.timesheetId }
  const employeeEmail = input.senderEmail || input.employeeEmail
  return createTimesheet({ ...input, employeeEmail }, actorId, TimesheetStatus.SUBMITTED, input)
}

module.exports = { prisma, validateTimesheet, createTimesheet, importTimesheet }
