const express = require('express')
const multer = require('multer')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const { prisma, createTimesheet, importTimesheet } = require('../services/timesheetService')
const { parseTimesheetFile } = require('../services/timesheetParser')

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 }, storage: multer.memoryStorage() })

router.get('/my', authMiddleware, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25))
  const where = { employeeId: req.user.userId }
  if (req.query.year) {
    const year = Number(req.query.year)
    where.periodStart = { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) }
  }
  const [timesheets, total] = await prisma.$transaction([
    prisma.timesheet.findMany({ where, include: { entries: true, history: true }, orderBy: { periodStart: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.timesheet.count({ where })
  ])
  res.json({ items: timesheets, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const timesheet = await createTimesheet({ ...req.body, employeeId: req.user.userId }, req.user.userId)
    res.status(201).json(timesheet)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/:id/submit', authMiddleware, async (req, res) => {
  const timesheet = await prisma.timesheet.findUnique({ where: { id: Number(req.params.id) } })
  if (!timesheet || timesheet.employeeId !== req.user.userId) return res.status(404).json({ error: 'Timesheet not found' })
  if (!['DRAFT', 'REJECTED'].includes(timesheet.status)) return res.status(400).json({ error: 'Only drafts and rejected timesheets can be submitted' })
  const updated = await prisma.$transaction(async tx => {
    const result = await tx.timesheet.update({ where: { id: timesheet.id }, data: { status: 'SUBMITTED', rejectionReason: null, submittedAt: new Date() } })
    await tx.timesheetStatusHistory.create({ data: { timesheetId: timesheet.id, status: 'SUBMITTED', changedById: req.user.userId } })
    return result
  })
  res.json(updated)
})

router.post('/import', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A .eml, .xlsx, or .xls file is required' })
  try {
    const parsed = await parseTimesheetFile(req.file.buffer, req.file.originalname)
    const result = await importTimesheet(parsed, req.user.userId)
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/pending', authMiddleware, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25))
  const where = {}
  if (req.query.status !== 'ALL') where.status = req.query.status || 'SUBMITTED'
  if (req.query.year) {
    const year = Number(req.query.year)
    where.periodStart = { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) }
  }
  if (req.query.month) {
    const month = Number(req.query.month) - 1
    const year = Number(req.query.year) || new Date().getUTCFullYear()
    where.periodStart = { gte: new Date(Date.UTC(year, month, 1)), lt: new Date(Date.UTC(year, month + 1, 1)) }
  }
  if (req.user.role !== 'HR_ADMIN') where.employee = { managerId: req.user.userId }
  if (req.query.employee) {
    const search = String(req.query.employee).trim()
    where.employee = {
      ...(where.employee || {}),
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
  }
  const [timesheets, total] = await prisma.$transaction([
    prisma.timesheet.findMany({ where, include: { employee: true, _count: { select: { entries: true } } }, orderBy: [{ periodStart: 'desc' }, { employee: { lastName: 'asc' } }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.timesheet.count({ where })
  ])
  res.json({ items: timesheets, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
})

router.get('/:id/detail', authMiddleware, async (req, res) => {
  const id = Number(req.params.id)
  const timesheet = await prisma.timesheet.findUnique({
    where: { id },
    include: { employee: true, entries: { orderBy: { workDate: 'asc' } } }
  })
  if (!timesheet) return res.status(404).json({ error: 'Timesheet not found' })
  const canView = req.user.role === 'HR_ADMIN' ||
    timesheet.employeeId === req.user.userId ||
    (req.user.role === 'MANAGER' && timesheet.employee.managerId === req.user.userId)
  if (!canView) return res.status(403).json({ error: 'Forbidden' })

  const start = new Date(timesheet.periodStart)
  const end = new Date(timesheet.periodEnd)
  const [leaveApplications, holidays] = await Promise.all([
    prisma.leaveApplication.findMany({
      where: {
        employeeId: timesheet.employeeId,
        status: 'APPROVED',
        startDate: { lte: end },
        endDate: { gte: start }
      },
      orderBy: { startDate: 'asc' }
    }),
    prisma.holiday.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: 'asc' }
    })
  ])
  res.json({ timesheet, leaveApplications, holidays })
})

router.post('/:id/approve', authMiddleware, async (req, res) => {
  const timesheet = await prisma.timesheet.findUnique({ where: { id: Number(req.params.id) }, include: { employee: true } })
  if (!timesheet || timesheet.status !== 'SUBMITTED') return res.status(404).json({ error: 'Submitted timesheet not found' })
  if (req.user.role !== 'HR_ADMIN' && timesheet.employee.managerId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' })
  const updated = await prisma.$transaction(async tx => {
    const result = await tx.timesheet.update({ where: { id: timesheet.id }, data: { status: 'APPROVED', approvedById: req.user.userId, approvedAt: new Date() } })
    await tx.timesheetStatusHistory.create({ data: { timesheetId: timesheet.id, status: 'APPROVED', changedById: req.user.userId } })
    return result
  })
  res.json(updated)
})

router.post('/:id/reject', authMiddleware, async (req, res) => {
  const timesheet = await prisma.timesheet.findUnique({ where: { id: Number(req.params.id) }, include: { employee: true } })
  if (!timesheet || timesheet.status !== 'SUBMITTED') return res.status(404).json({ error: 'Submitted timesheet not found' })
  if (req.user.role !== 'HR_ADMIN' && timesheet.employee.managerId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' })
  const updated = await prisma.$transaction(async tx => {
    const result = await tx.timesheet.update({ where: { id: timesheet.id }, data: { status: 'REJECTED', rejectionReason: req.body.reason || 'Timesheet requires correction' } })
    await tx.timesheetStatusHistory.create({ data: { timesheetId: timesheet.id, status: 'REJECTED', comment: result.rejectionReason, changedById: req.user.userId } })
    return result
  })
  res.json(updated)
})

module.exports = router
