const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const authMiddleware = require('../middleware/authMiddleware')

const DEFAULT_POLICIES = [
  { code: 'CASUAL', label: 'Casual Leave', defaultAnnualDays: 8, color: '#818cf8' },
  { code: 'PRIVILEGE', label: 'Privilege Leave', defaultAnnualDays: 15, color: '#22d3ee' },
  { code: 'SICK', label: 'Sick Leave', defaultAnnualDays: 10, color: '#39ff9d' },
  { code: 'MATERNITY', label: 'Maternity Leave', defaultAnnualDays: 90, color: '#f472b6' },
  { code: 'PATERNITY', label: 'Paternity Leave', defaultAnnualDays: 14, color: '#fbbf24' },
  { code: 'OFFICIAL_TOUR', label: 'Official Tour', defaultAnnualDays: 20, color: '#a78bfa' }
]

// Ensure every LeaveType enum value has a policy row, so the master screen
// and dependent dropdowns always have a complete, seeded list to work with.
async function ensureSeeded() {
  const existing = await prisma.leaveTypePolicy.findMany({ select: { code: true } })
  const existingCodes = new Set(existing.map(e => e.code))
  const missing = DEFAULT_POLICIES.filter(p => !existingCodes.has(p.code))
  if (missing.length) {
    await prisma.leaveTypePolicy.createMany({ data: missing, skipDuplicates: true })
  }
}

// List leave type policies. Unauthenticated read access is intentional so the
// Apply Leave dropdown (and Registration, in future) can source live labels.
router.get('/', async (req, res) => {
  await ensureSeeded()
  const activeOnly = req.query.activeOnly === 'true'
  const policies = await prisma.leaveTypePolicy.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { id: 'asc' }
  })
  res.json(policies)
})

// Update a policy's label/default days/color/active flag (HR_ADMIN only).
// The `code` itself is fixed to the underlying enum and cannot be changed.
router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'HR_ADMIN') return res.status(403).json({ error: 'Forbidden' })
  const id = parseInt(req.params.id)
  const { label, defaultAnnualDays, color, active } = req.body
  try {
    const policy = await prisma.leaveTypePolicy.update({
      where: { id },
      data: {
        label: label ?? undefined,
        defaultAnnualDays: defaultAnnualDays !== undefined ? parseInt(defaultAnnualDays) : undefined,
        color: color ?? undefined,
        active: typeof active === 'boolean' ? active : undefined
      }
    })
    res.json(policy)
  } catch (err) {
    res.status(404).json({ error: 'Leave type policy not found' })
  }
})

module.exports = router
