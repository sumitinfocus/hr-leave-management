require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')
const authRouter = require('./routes/auth')
const leaveRouter = require('./routes/leave')
const reportRouter = require('./routes/report')
const holidayRouter = require('./routes/holiday')
const entitlementRouter = require('./routes/entitlement')
const emailSyncRouter = require('./routes/emailSync')
const timesheetRouter = require('./routes/timesheet')
const oauthRouter = require('./routes/oauth')
const employeeRouter = require('./routes/employee')
const leaveTypePolicyRouter = require('./routes/leaveTypePolicy')
const performanceRouter = require('./routes/performance')
const { getEmailIntegrationConfig } = require('./config/emailIntegration')
const { createOutlookMailClient } = require('./services/outlookMail')
const { processMailbox } = require('./services/leaveEmailProcessor')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/leave', leaveRouter)
app.use('/api/report', reportRouter)
app.use('/api/holiday', holidayRouter)
app.use('/api/entitlement', entitlementRouter)
app.use('/api/email-sync', emailSyncRouter)
app.use('/api/timesheets', timesheetRouter)
app.use('/api/employee', employeeRouter)
app.use('/api/leave-type-policy', leaveTypePolicyRouter)
app.use('/api/performance', performanceRouter)
app.use('/oauth', oauthRouter)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
  if (process.env.LEAVE_EMAIL_POLLING_ENABLED === 'true' || process.env.TIMESHEET_EMAIL_POLLING_ENABLED === 'true') {
    const config = getEmailIntegrationConfig()
    const run = async () => {
      try {
        const results = await processMailbox(createOutlookMailClient(config), config)
        console.log(`Email sync completed: ${results.length} message(s)`)
      } catch (error) {
        console.error(`Leave email sync failed: ${error.message}`)
      }
    }
    run()
    setInterval(run, config.pollingIntervalMs)
  }
})

// Mailbox polling relies on long-lived IMAP/SMTP sockets that can be reset by
// the mail server between requests. A stray unhandled rejection or error
// event from those connections must not take down the whole API process.
process.on('unhandledRejection', error => {
  console.error(`Unhandled promise rejection: ${error && error.message ? error.message : error}`)
})
process.on('uncaughtException', error => {
  console.error(`Uncaught exception: ${error.message}`)
})
