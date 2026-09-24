const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcrypt')
const authMiddleware = require('../middleware/authMiddleware')

const employeeSelect = {
  id: true, firstName: true, lastName: true, email: true, role: true, active: true,
  plant: true, location: true, hireDate: true, departmentId: true, managerId: true,
  department: { select: { id: true, name: true } },
  manager: { select: { id: true, firstName: true, lastName: true } }
}

function requireHrAdmin(req, res, next) {
  if (req.user.role !== 'HR_ADMIN') return res.status(403).json({ error: 'Forbidden' })
  next()
}

// Department list - used by Registration and Employee Master dropdowns.
// Kept unauthenticated so the pre-login Registration screen can populate it.
router.get('/departments', async (req, res) => {
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } })
  res.json(departments)
})

// Lightweight list of active managers/HR admins - used for the manager picker
// on Registration (pre-login) and Employee Master.
router.get('/managers', async (req, res) => {
  const managers = await prisma.employee.findMany({
    where: { active: true, role: { in: ['MANAGER', 'HR_ADMIN'] } },
    select: { id: true, firstName: true, lastName: true, role: true },
    orderBy: { firstName: 'asc' }
  })
  res.json(managers)
})

// Employee Master: list all employees (HR_ADMIN only)
router.get('/', authMiddleware, requireHrAdmin, async (req, res) => {
  const employees = await prisma.employee.findMany({ select: employeeSelect, orderBy: { firstName: 'asc' } })
  res.json(employees)
})

// Employee Master: create employee (HR_ADMIN only)
router.post('/', authMiddleware, requireHrAdmin, async (req, res) => {
  const { firstName, lastName, email, password, departmentId, role, managerId, plant, location } = req.body
  if (!firstName || !lastName || !email || !password || !departmentId || !role) {
    return res.status(400).json({ error: 'firstName, lastName, email, password, departmentId and role are required' })
  }
  const existing = await prisma.employee.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'An employee with this email already exists' })

  const passwordHash = await bcrypt.hash(password, 10)
  const employee = await prisma.employee.create({
    data: {
      firstName, lastName, email, passwordHash, role,
      departmentId: parseInt(departmentId), managerId: managerId ? parseInt(managerId) : null,
      plant: plant || null, location: location || null, mustChangePassword: true
    },
    select: employeeSelect
  })
  res.status(201).json(employee)
})

// Employee Master: update employee (HR_ADMIN only)
router.put('/:id', authMiddleware, requireHrAdmin, async (req, res) => {
  const id = parseInt(req.params.id)
  const { firstName, lastName, departmentId, role, managerId, plant, location, active } = req.body
  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        firstName, lastName, role,
        departmentId: departmentId ? parseInt(departmentId) : undefined,
        managerId: managerId === '' || managerId === null ? null : (managerId ? parseInt(managerId) : undefined),
        plant: plant ?? undefined, location: location ?? undefined,
        active: typeof active === 'boolean' ? active : undefined
      },
      select: employeeSelect
    })
    res.json(employee)
  } catch (err) {
    res.status(404).json({ error: 'Employee not found' })
  }
})

// Employee Master: deactivate employee (HR_ADMIN only). Employees are never
// hard-deleted because leave/timesheet/approval history references them.
router.delete('/:id', authMiddleware, requireHrAdmin, async (req, res) => {
  const id = parseInt(req.params.id)
  if (id === req.user.userId) return res.status(400).json({ error: 'You cannot deactivate your own account' })
  try {
    await prisma.employee.update({ where: { id }, data: { active: false } })
    res.json({ success: true })
  } catch (err) {
    res.status(404).json({ error: 'Employee not found' })
  }
})

module.exports = router
