const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const authMiddleware = require('../middleware/authMiddleware')

// Create holiday (HR_ADMIN only) and auto-apply as approved leave to affected employees
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'HR_ADMIN') return res.status(403).json({ error: 'Forbidden' })
  const { name, date, location, plant, year, isPaid } = req.body
  const holiday = await prisma.holiday.create({ data: { name, date: new Date(date), location, plant, year, isPaid } })

  // Auto-create approved leave applications for employees matching location/plant
  const employees = await prisma.employee.findMany({ where: { AND: [ { location: location || undefined }, { plant: plant || undefined } ] } })
  const applications = employees.map(e => ({ employeeId: e.id, type: 'OFFICIAL_TOUR', startDate: new Date(date), endDate: new Date(date), reason: `Holiday: ${name}`, status: 'APPROVED', approvedById: req.user.userId }))
  if (applications.length) await prisma.leaveApplication.createMany({ data: applications })

  res.json({ holiday, appliedCount: applications.length })
})

// List holidays with optional filters
router.get('/', authMiddleware, async (req, res) => {
  const { location, plant, year } = req.query
  const where = {}
  if (location) where.location = location
  if (plant) where.plant = plant
  if (year) where.year = parseInt(year)
  const list = await prisma.holiday.findMany({ where, orderBy: { date: 'asc' } })
  res.json(list)
})

module.exports = router