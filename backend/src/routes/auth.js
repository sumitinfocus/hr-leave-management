const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/login', async (req, res) =>{
  const { email, password } = req.body
  const user = await prisma.employee.findUnique({ where: { email } })
  if(!user) return res.status(401).json({ error: 'Invalid credentials' })
  if(user.active === false) return res.status(403).json({ error: 'This account has been deactivated' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if(!ok) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' })
  res.json({ token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword } })
})

router.post('/register', async (req, res)=>{
  const { firstName, lastName, email, password, departmentId, managerId, plant, location } = req.body
  if (!firstName || !lastName || !email || !password || !departmentId) {
    return res.status(400).json({ error: 'firstName, lastName, email, password and departmentId are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }
  const existing = await prisma.employee.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' })

  // Self-service registration always creates a plain EMPLOYEE account; HR_ADMIN
  // and MANAGER roles can only be granted via the Employee Master screen.
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.employee.create({
    data: {
      firstName, lastName, email, passwordHash, role: 'EMPLOYEE',
      departmentId: parseInt(departmentId), managerId: managerId ? parseInt(managerId) : null,
      plant: plant || null, location: location || null
    }
  })
  res.status(201).json({ user: { id: user.id, email: user.email } })
})

router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Current password and a new password of at least 8 characters are required' })
  }
  const user = await prisma.employee.findUnique({ where: { id: req.user.userId } })
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid current password' })
  }
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.employee.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } })
  res.json({ success: true })
})

module.exports = router