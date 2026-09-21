const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const authMiddleware = require('../middleware/authMiddleware')
const createCsvWriter = require('csv-writer').createObjectCsvStringifier

router.get('/department/:id', authMiddleware, async (req, res)=>{
  if(req.user.role !== 'HR_ADMIN') return res.status(403).json({ error: 'Forbidden' })
  const deptId = parseInt(req.params.id)
  const employees = await prisma.employee.findMany({ where: { departmentId: deptId }, include: { leaveApplications: true } })
  const records = []
  employees.forEach(e => {
    const summary = { employeeId: e.id, name: `${e.firstName} ${e.lastName}` }
    e.leaveApplications.forEach(app => {
      records.push({ ...summary, type: app.type, startDate: app.startDate.toISOString(), endDate: app.endDate.toISOString(), status: app.status })
    })
  })
  const csv = createCsvWriter({ header: [
    { id: 'employeeId', title: 'EmployeeId' },
    { id: 'name', title: 'Name' },
    { id: 'type', title: 'Type' },
    { id: 'startDate', title: 'StartDate' },
    { id: 'endDate', title: 'EndDate' },
    { id: 'status', title: 'Status' }
  ]})
  // build CSV with header row
  const headerString = csv.getHeaderString()
  const recordsString = csv.stringifyRecords(records)
  const csvString = headerString + recordsString
  res.setHeader('Content-disposition', `attachment; filename=department_${deptId}_report.csv`)
  res.set('Content-Type', 'text/csv')
  res.send(csvString)
})

// Department summary (counts by status and type) for quick overview
router.get('/department/:id/summary', authMiddleware, async (req, res) => {
  if(req.user.role !== 'HR_ADMIN') return res.status(403).json({ error: 'Forbidden' })
  const deptId = parseInt(req.params.id)
  const apps = await prisma.leaveApplication.findMany({ where: { employee: { departmentId: deptId } } })
  const summary = { total: apps.length, byStatus: {}, byType: {} }
  apps.forEach(a => {
    summary.byStatus[a.status] = (summary.byStatus[a.status] || 0) + 1
    summary.byType[a.type] = (summary.byType[a.type] || 0) + 1
  })
  res.json(summary)
})

module.exports = router