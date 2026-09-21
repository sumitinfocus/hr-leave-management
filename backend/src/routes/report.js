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
    { id: 'employeeId', title: 'EmployeeId' }, { id: 'name', title: 'Name' }, { id: 'type', title: 'Type' }, { id: 'startDate', title: 'StartDate' }, { id: 'endDate', title: 'EndDate' }, { id: 'status', title: 'Status' }
  ]})
  const csvString = csv.stringifyRecords(records)
  res.setHeader('Content-disposition', `attachment; filename=department_${deptId}_report.csv`)
  res.set('Content-Type', 'text/csv')
  res.send(csvString)
})

module.exports = router