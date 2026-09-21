const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

router.post('/login', async (req, res) =>{
  const { email, password } = req.body
  const user = await prisma.employee.findUnique({ where: { email } })
  if(!user) return res.status(401).json({ error: 'Invalid credentials' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if(!ok) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' })
  res.json({ token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } })
})

router.post('/register', async (req, res)=>{
  const { firstName, lastName, email, password, departmentId, role, managerId } = req.body
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.employee.create({ data: { firstName, lastName, email, passwordHash, departmentId, role, managerId } })
  res.json({ user: { id: user.id, email: user.email } })
})

module.exports = router