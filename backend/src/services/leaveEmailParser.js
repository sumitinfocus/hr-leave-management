const leaveTypes = new Set(['CASUAL', 'PRIVILEGE', 'SICK', 'MATERNITY', 'PATERNITY', 'OFFICIAL_TOUR'])

function bodyText(body) {
  if (!body) return ''
  if (body.contentType === 'text') return body.content || ''
  return (body.content || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
}

function parseLabeledFields(content) {
  const fields = {}
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    const match = line.match(/^\s*(Employee Email|Leave Type|Start Date|End Date|Reason)\s*:\s*(.*?)\s*$/i)
    if (match) fields[match[1].toLowerCase()] = match[2]
  }
  return fields
}

function parseDate(value, label) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) throw new Error(`${label} must be a valid date`)
  return date
}

function parseLeaveEmail(message) {
  if (!message || typeof message.subject !== 'string' || !message.subject.toLowerCase().includes('leave')) return null
  const fields = parseLabeledFields(bodyText(message.body))
  const required = ['employee email', 'leave type', 'start date', 'end date', 'reason']
  const missing = required.filter(field => !fields[field])
  if (missing.length) throw new Error(`Missing required fields: ${missing.join(', ')}`)

  const employeeEmail = fields['employee email'].toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(employeeEmail)) throw new Error('Employee Email must be a valid email address')
  const type = fields['leave type'].toUpperCase().replace(/[\s-]+/g, '_')
  if (!leaveTypes.has(type)) throw new Error(`Unsupported Leave Type: ${fields['leave type']}`)

  return {
    employeeEmail,
    type,
    startDate: parseDate(fields['start date'], 'Start Date'),
    endDate: parseDate(fields['end date'], 'End Date'),
    reason: fields.reason,
    subject: message.subject,
    messageId: message.id,
    senderEmail: message.from && message.from.emailAddress ? message.from.emailAddress.address : null,
    receivedAt: message.receivedDateTime ? new Date(message.receivedDateTime) : null
  }
}

module.exports = { parseLeaveEmail, bodyText }
