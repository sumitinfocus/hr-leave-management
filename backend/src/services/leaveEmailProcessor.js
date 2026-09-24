const crypto = require('crypto')
const bcrypt = require('bcrypt')
const { PrismaClient, EmailProcessingStatus, LeaveStatus } = require('@prisma/client')
const { getEmailIntegrationConfig } = require('../config/emailIntegration')
const { parseLeaveEmail } = require('./leaveEmailParser')
const { processTimesheetMessage } = require('./timesheetEmailProcessor')

const prisma = new PrismaClient()

function splitName(message, email) {
  const displayName = message.from && message.from.emailAddress && message.from.emailAddress.name
  const parts = (displayName || email.split('@')[0]).trim().split(/\s+/).filter(Boolean)
  return { firstName: parts[0] || 'Employee', lastName: parts.slice(1).join(' ') || 'User' }
}

function temporaryPassword() {
  return crypto.randomBytes(18).toString('base64url')
}

async function processMessage(message, mailClient, config = getEmailIntegrationConfig()) {
  const existing = await prisma.emailProcessing.findUnique({ where: { messageId: message.id } })
  if (existing) return { status: 'duplicate', messageId: message.id }

  let request
  try {
    request = parseLeaveEmail(message)
    if (!request) {
      await prisma.emailProcessing.create({
        data: { provider: config.provider, messageId: message.id, subject: message.subject || '', senderEmail: request && request.senderEmail, status: EmailProcessingStatus.IGNORED }
      })
      await mailClient.markRead(message.id)
      return { status: 'ignored', messageId: message.id }
    }

    const result = await prisma.$transaction(async tx => {
      let employee = await tx.employee.findUnique({ where: { email: request.employeeEmail } })
      let generatedPassword = null
      if (!employee) {
        const name = splitName(message, request.employeeEmail)
        generatedPassword = temporaryPassword()
        const passwordHash = await bcrypt.hash(generatedPassword, 10)
        const manager = await tx.employee.findUnique({ where: { email: config.managerEmail }, select: { id: true } })
        if (!manager) throw new Error(`Configured manager does not exist: ${config.managerEmail}`)
        employee = await tx.employee.create({
          data: {
            ...name,
            email: request.employeeEmail,
            passwordHash,
            mustChangePassword: true,
            role: 'EMPLOYEE',
            departmentId: config.defaultDepartmentId,
            managerId: manager.id
          }
        })
      }
      const application = await tx.leaveApplication.create({
        data: {
          employeeId: employee.id,
          type: request.type,
          startDate: request.startDate,
          endDate: request.endDate,
          reason: request.reason,
          status: LeaveStatus.PENDING,
          sourceMessageId: request.messageId,
          sourceEmailSubject: request.subject
        }
      })
      await tx.emailProcessing.create({
        data: {
          provider: config.provider,
          messageId: request.messageId,
          subject: request.subject,
          senderEmail: request.senderEmail,
          receivedAt: request.receivedAt,
          status: EmailProcessingStatus.PROCESSED,
          leaveApplicationId: application.id
        }
      })
      return { employee, application, generatedPassword }
    })
    await mailClient.markRead(message.id)
    if (result.generatedPassword) {
      await mailClient.sendMail({
        subject: 'HR Leave Management account created',
        body: {
          contentType: 'Text',
          content: `An HR Leave Management account was created for this email address.\n\nTemporary password: ${result.generatedPassword}\n\nSign in and change this password immediately.`
        },
        toRecipients: [{ emailAddress: { address: result.employee.email } }]
      })
    }
    await mailClient.sendMail({
      subject: `Leave approval required: ${result.employee.firstName} ${result.employee.lastName}`,
      body: { contentType: 'Text', content: `A leave request is pending for ${result.employee.firstName} ${result.employee.lastName}.\n\nType: ${request.type}\nStart: ${request.startDate.toISOString()}\nEnd: ${request.endDate.toISOString()}\nReason: ${request.reason}\n\nApprove or reject it in the HR Leave Management app.` },
      toRecipients: [{ emailAddress: { address: config.managerEmail } }]
    })
    return { status: 'processed', messageId: message.id, applicationId: result.application.id }
  } catch (error) {
    await prisma.emailProcessing.upsert({
      where: { messageId: message.id },
      update: { status: EmailProcessingStatus.FAILED, errorMessage: error.message, subject: message.subject || '' },
      create: { provider: config.provider, messageId: message.id, subject: message.subject || '', status: EmailProcessingStatus.FAILED, errorMessage: error.message }
    })
    return { status: 'failed', messageId: message.id, error: error.message }
  }
}

async function processMailbox(mailClient, config = getEmailIntegrationConfig()) {
  const page = await mailClient.listLeaveMessages()
  const messages = Array.isArray(page.value) ? page.value : []
  const results = []
  for (const message of messages) {
    message.mailClient = mailClient
    const timesheetResult = await processTimesheetMessage(message, config)
    if (timesheetResult) results.push(timesheetResult)
    else results.push(await processMessage(message, mailClient, config))
  }
  return results
}

async function processTimesheetMailbox(mailClient, config = getEmailIntegrationConfig(), fromDate = new Date(new Date().getFullYear(), 0, 1)) {
  const page = await mailClient.listLeaveMessages({ unreadOnly: false, since: fromDate, subjectContains: 'timesheet' })
  const messages = Array.isArray(page.value) ? page.value : []
  const results = []
  for (const message of messages) {
    const receivedAt = message.receivedDateTime ? new Date(message.receivedDateTime) : null
    if (!receivedAt || receivedAt < fromDate || !/timesheet/i.test(message.subject || '')) continue
    message.mailClient = mailClient
    const result = await processTimesheetMessage(message, config)
    if (result) results.push(result)
  }
  return results
}

module.exports = { processMailbox, processTimesheetMailbox, processMessage, prisma }
