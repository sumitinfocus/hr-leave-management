const { parseTimesheetFile } = require('./timesheetParser')
const { importTimesheet, prisma } = require('./timesheetService')

async function processTimesheetMessage(message, config) {
  const hasWorkbook = (message.attachments || []).some(attachment => /\.xlsx?$/i.test(attachment.filename || ''))
  if (!hasWorkbook) return null

  try {
    const parsed = await parseTimesheetFile(message.source, `${message.id}.eml`)
    const manager = await prisma.employee.findUnique({ where: { email: config.managerEmail }, select: { id: true } })
    if (!manager) throw new Error(`Configured manager does not exist: ${config.managerEmail}`)
    const result = await importTimesheet({
      ...parsed,
      sourceType: 'outlook-imap',
      originalName: parsed.originalName || message.subject || `${message.id}.eml`,
      sourceMessageId: message.id,
      sourceSubject: message.subject || null
    }, manager.id)
    await message.mailClient.markRead(message.id)
    return {
      status: result.duplicate ? 'duplicate-timesheet' : 'processed-timesheet',
      messageId: message.id,
      timesheetId: result.timesheetId || result.id || null
    }
  } catch (error) {
    return { status: 'failed-timesheet', messageId: message.id, error: error.message }
  }
}

module.exports = { processTimesheetMessage }
