const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const authMiddleware = require('../middleware/authMiddleware')

// Assign entitlements for a year to employees based on role/hierarchy (HR only)
router.post('/assign', authMiddleware, async (req, res) => {
  if (req.user.role !== 'HR_ADMIN') return res.status(403).json({ error: 'Forbidden' })
  const { year, defaultPolicy } = req.body
  // defaultPolicy: { casual, privilege, sick, maternity, paternity, officialTour }
  const employees = await prisma.employee.findMany()
  const data = employees.map(e => ({ year, employeeId: e.id, ...defaultPolicy }))
  await prisma.leaveEntitlement.createMany({ data, skipDuplicates: true })
  res.json({ assigned: employees.length })
})

// Get entitlements for employee
router.get('/me', authMiddleware, async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear()
  const ent = await prisma.leaveEntitlement.findFirst({ where: { employeeId: req.user.userId, year } })
  res.json(ent)
})

module.exports = router