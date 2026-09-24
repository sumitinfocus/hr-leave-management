const express = require('express')
const router = express.Router()
const { PrismaClient, LeaveStatus } = require('@prisma/client')
const prisma = new PrismaClient()
const authMiddleware = require('../middleware/authMiddleware')

router.post('/apply', authMiddleware, async (req, res) =>{
  const { type, startDate, endDate, reason } = req.body
  const employeeId = req.user.userId
  const application = await prisma.leaveApplication.create({ data: { employeeId, type, startDate: new Date(startDate), endDate: new Date(endDate), reason } })
  res.json(application)
})

router.get('/my', authMiddleware, async (req, res)=>{
  const employeeId = req.user.userId
  const apps = await prisma.leaveApplication.findMany({ where: { employeeId }, orderBy: { appliedAt: 'desc' } })
  res.json(apps)
})

// Get pending applications for manager (show subordinate requests) or HR
router.get('/pending', authMiddleware, async (req, res) =>{
  const user = req.user
  const includeEmployee = { employee: { select: { email: true, firstName: true, lastName: true } } }
  if(user.role === 'HR_ADMIN'){
    const apps = await prisma.leaveApplication.findMany({ where: { status: 'PENDING' }, include: includeEmployee, orderBy: { appliedAt: 'desc' } })
    return res.json(apps)
  }
  // manager: fetch subordinates
  const subordinates = await prisma.employee.findMany({ where: { managerId: user.userId } })
  const subIds = subordinates.map(s => s.id)
  const apps = await prisma.leaveApplication.findMany({ where: { employeeId: { in: subIds }, status: 'PENDING' }, include: includeEmployee, orderBy: { appliedAt: 'desc' } })
  res.json(apps)
})

router.post('/:id/approve', authMiddleware, async (req, res)=>{
  const user = req.user
  const id = parseInt(req.params.id)
  if(!['MANAGER','HR_ADMIN'].includes(user.role)) return res.status(403).json({ error: 'Forbidden' })
  const updated = await prisma.leaveApplication.update({ where: { id }, data: { status: LeaveStatus.APPROVED, approvedById: user.userId } })
  res.json(updated)
})

router.post('/:id/reject', authMiddleware, async (req, res)=>{
  const user = req.user
  const id = parseInt(req.params.id)
  if(!['MANAGER','HR_ADMIN'].includes(user.role)) return res.status(403).json({ error: 'Forbidden' })
  const updated = await prisma.leaveApplication.update({ where: { id }, data: { status: LeaveStatus.REJECTED, approvedById: user.userId } })
  res.json(updated)
})

module.exports = router