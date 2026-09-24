const crypto = require('crypto')
const XLSX = require('xlsx')
const { simpleParser } = require('mailparser')

const periodTypes = new Set(['DAILY', 'WEEKLY', 'MONTHLY'])

function asDate(value) {
  if (value instanceof Date) return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
  if (typeof value === 'number') {
    const serial = Math.floor(value)
    return new Date(Date.UTC(1899, 11, 30) + serial * 86400000)
  }
  if (typeof value !== 'string') return null
  const text = value.trim()
  let match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (match) return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])))
  match = text.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?$/i)
  if (match) {
    const year = Number(match[3] || new Date().getUTCFullYear())
    const month = new Date(`${match[2]} 1, ${year}`).getMonth()
    if (!Number.isNaN(month)) return new Date(Date.UTC(year, month, Number(match[1])))
  }
  return null
}

function asTime(value) {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) {
    return new Date(Date.UTC(1970, 0, 1, value.getHours(), value.getMinutes(), value.getSeconds()))
  }
  if (typeof value === 'number') {
    const totalSeconds = Math.round((value % 1) * 86400)
    return new Date(Date.UTC(1970, 0, 1, 0, 0, totalSeconds))
  }
  const date = new Date(`1970-01-01T${value}`)
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizePeriodType(value) {
  const normalized = String(value || '').toUpperCase()
  if (periodTypes.has(normalized)) return normalized
  const days = Number(value)
  if (days === 1) return 'DAILY'
  if (days === 7) return 'WEEKLY'
  return 'MONTHLY'
}

function rowValue(row, index) {
  return row && row[index] !== undefined && row[index] !== null ? row[index] : null
}

function parseWorkbook(buffer, originalName = 'timesheet.xlsx') {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('Workbook has no sheets')
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })
  if (rows.length < 5) throw new Error('Timesheet workbook does not contain enough rows')

  const header = rows[1] || []
  const metadata = rows[2] || []
  const dailyHeaderIndex = rows.findIndex(row => String(rowValue(row, 0) || '').toLowerCase() === 'date')
  if (dailyHeaderIndex < 0) throw new Error('Timesheet workbook is missing the daily Date row')

  const entries = rows.slice(dailyHeaderIndex + 1)
    .filter(row => rowValue(row, 0) !== null && rowValue(row, 0) !== undefined && rowValue(row, 0) !== '')
    .map(row => ({
      workDate: asDate(rowValue(row, 0)),
      dayName: rowValue(row, 1),
      timeIn: asTime(rowValue(row, 2)),
      timeOut: asTime(rowValue(row, 3)),
      activities: rowValue(row, 4) ? String(rowValue(row, 4)) : null
    }))
    .filter(entry => entry.workDate)

  const periodStart = entries[0]?.workDate || asDate(rowValue(metadata, 5))
  const periodEnd = entries.at(-1)?.workDate || asDate(rowValue(metadata, 6))
  if (!periodStart || !periodEnd) throw new Error('Timesheet period dates are missing')
  const staffName = rowValue(metadata, 1) ? String(rowValue(metadata, 1)).trim() : null
  const approverName = rowValue(metadata, 8) ? String(rowValue(metadata, 8)).trim() : null

  return {
    originalName,
    fingerprint: crypto.createHash('sha256').update(buffer).digest('hex'),
    periodType: normalizePeriodType(periodEnd - periodStart > 0 ? 'MONTHLY' : 'DAILY'),
    periodStart,
    periodEnd,
    vendorName: rowValue(metadata, 0),
    staffName,
    projectCode: rowValue(metadata, 2),
    assignmentName: rowValue(metadata, 3),
    taskCode: rowValue(metadata, 4),
    daysWorked: rowValue(metadata, 7) === null ? null : Number(rowValue(metadata, 7)),
    approverName,
    entries
  }
}

async function parseTimesheetFile(buffer, originalName) {
  if (/\.eml$/i.test(originalName)) {
    const message = await simpleParser(buffer)
    const attachment = message.attachments.find(item => /\.xlsx?$/i.test(item.filename || '') || /spreadsheet/.test(item.contentType || ''))
    if (!attachment) throw new Error('Email does not contain an Excel timesheet attachment')
    const parsed = parseWorkbook(attachment.content, attachment.filename)
    return { ...parsed, sourceType: 'eml', sourceMessageId: message.messageId || null, sourceSubject: message.subject || null, senderEmail: message.from?.value?.[0]?.address || null }
  }
  if (!/\.xlsx?$/i.test(originalName)) throw new Error('Only .eml, .xlsx, and .xls files are supported')
  return { ...parseWorkbook(buffer, originalName), sourceType: 'xlsx' }
}

module.exports = { parseTimesheetFile, parseWorkbook }
