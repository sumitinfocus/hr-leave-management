const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const authMiddleware = require('../middleware/authMiddleware')

router.use(authMiddleware)

const CATEGORIES = ['communication', 'ownership', 'technical', 'teamwork', 'delivery']

const LEVELS = [
  { min: 4.5, name: 'Legend', badge: '👑' },
  { min: 3.5, name: 'Project Slayer', badge: '⚔️' },
  { min: 2.5, name: 'Consistency King', badge: '🛡️' },
  { min: 1.5, name: 'Rising Star', badge: '🌟' },
  { min: 0, name: 'Rookie', badge: '🌱' }
]

function computeOverall(scores) {
  const values = CATEGORIES.map(c => Number(scores?.[c]) || 0).filter(v => v > 0)
  if (values.length === 0) return 0
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10
}

function levelFor(overallScore) {
  const level = LEVELS.find(l => overallScore >= l.min) || LEVELS[LEVELS.length - 1]
  return `${level.badge} ${level.name}`
}

function validateScores(scores) {
  if (!scores || typeof scores !== 'object') return 'scores object is required'
  for (const cat of CATEGORIES) {
    const value = scores[cat]
    if (typeof value !== 'number' || value < 1 || value > 5) {
      return `scores.${cat} must be a number between 1 and 5`
    }
  }
  return null
}

// Employee: list my own reviews (self-assessments across periods)
router.get('/my', async (req, res) => {
  const reviews = await prisma.performanceReview.findMany({
    where: { employeeId: req.user.userId },
    orderBy: { period: 'desc' }
  })
  res.json(reviews)
})

// Employee: create or update my DRAFT/REJECTED review for a period, then optionally submit.
router.post('/my', async (req, res) => {
  const { period, scores, employeeComments, submit } = req.body
  if (!period) return res.status(400).json({ error: 'period is required, e.g. "2026-H1"' })
  const scoreError = validateScores(scores)
  if (scoreError) return res.status(400).json({ error: scoreError })

  const overallScore = computeOverall(scores)
  const existing = await prisma.performanceReview.findUnique({
    where: { employeeId_period: { employeeId: req.user.userId, period } }
  })
  if (existing && !['DRAFT', 'REJECTED'].includes(existing.status)) {
    return res.status(400).json({ error: 'This review has already been submitted and cannot be edited' })
  }

  const me = await prisma.employee.findUnique({ where: { id: req.user.userId } })

  const data = {
    scores, employeeComments: employeeComments || null,
    overallScore, level: levelFor(overallScore),
    managerId: me?.managerId || null,
    status: submit ? 'SUBMITTED' : 'DRAFT',
    submittedAt: submit ? new Date() : null
  }

  const review = await prisma.performanceReview.upsert({
    where: { employeeId_period: { employeeId: req.user.userId, period } },
    update: data,
    create: { employeeId: req.user.userId, period, ...data }
  })
  res.json(review)
})

// Manager: list direct reports' reviews awaiting or having received a decision
router.get('/team', async (req, res) => {
  if (!['MANAGER', 'HR_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
  const where = req.user.role === 'HR_ADMIN' ? {} : { managerId: req.user.userId }
  const reviews = await prisma.performanceReview.findMany({
    where,
    include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } },
    orderBy: [{ status: 'asc' }, { period: 'desc' }]
  })
  res.json(reviews)
})

// Manager: approve or send back a submitted review, optionally adjusting scores.
router.put('/team/:id', async (req, res) => {
  if (!['MANAGER', 'HR_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
  const id = parseInt(req.params.id)
  const { decision, managerScores, managerComments } = req.body
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be APPROVED or REJECTED' })
  }
  const review = await prisma.performanceReview.findUnique({ where: { id } })
  if (!review) return res.status(404).json({ error: 'Review not found' })
  if (req.user.role !== 'HR_ADMIN' && review.managerId !== req.user.userId) {
    return res.status(403).json({ error: 'You are not the manager for this review' })
  }
  if (review.status !== 'SUBMITTED') return res.status(400).json({ error: 'Only submitted reviews can be reviewed' })

  let overallScore = review.overallScore
  let level = review.level
  if (managerScores) {
    const scoreError = validateScores(managerScores)
    if (scoreError) return res.status(400).json({ error: scoreError })
    overallScore = computeOverall(managerScores)
    level = levelFor(overallScore)
  }

  const updated = await prisma.performanceReview.update({
    where: { id },
    data: {
      status: decision,
      managerScores: managerScores || undefined,
      managerComments: managerComments || null,
      overallScore, level,
      reviewedAt: new Date()
    }
  })
  res.json(updated)
})

module.exports = router
