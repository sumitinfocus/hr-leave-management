const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const { getEmailIntegrationConfig } = require('../config/emailIntegration')
const { createOutlookMailClient } = require('../services/outlookMail')
const { processMailbox, processTimesheetMailbox } = require('../services/leaveEmailProcessor')

router.post('/sync', authMiddleware, async (req, res) => {
  if (!['MANAGER', 'HR_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const config = getEmailIntegrationConfig()
    const results = await processMailbox(createOutlookMailClient(config), config)
    res.json({ results })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/sync-timesheets', authMiddleware, async (req, res) => {
  if (!['MANAGER', 'HR_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const config = getEmailIntegrationConfig()
    const results = await processTimesheetMailbox(createOutlookMailClient(config), config)
    res.json({
      fromDate: `${new Date().getFullYear()}-01-01`,
      results,
      summary: {
        imported: results.filter(result => result.status === 'processed-timesheet').length,
        duplicates: results.filter(result => result.status === 'duplicate-timesheet').length,
        failed: results.filter(result => result.status === 'failed-timesheet').length
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
