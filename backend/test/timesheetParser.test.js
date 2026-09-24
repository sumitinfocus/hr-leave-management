const test = require('node:test')
const assert = require('node:assert/strict')
const XLSX = require('xlsx')
const { parseWorkbook } = require('../src/services/timesheetParser')

test('parses Excel serial dates and time fractions without timezone shifts', () => {
  const rows = [
    ['Timesheet'],
    ['Vendor', 'Staff', 'Project', 'Assignment', 'Task', 'Period Start', 'Period End', 'Days', 'Approver'],
    ['Acme', 'Jane Doe', null, null, null, 46251, 46252, 1, 'Manager'],
    ['Date', 'Day', 'Time In', 'Time Out', 'Activities'],
    [46251, 'Monday', 0.5, 0.75, 'Build feature']
  ]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const buffer = XLSX.write({ SheetNames: ['Sheet1'], Sheets: { Sheet1: sheet } }, { type: 'buffer', bookType: 'xlsx' })
  const parsed = parseWorkbook(buffer)
  assert.equal(parsed.periodStart.toISOString(), '2026-08-17T00:00:00.000Z')
  assert.equal(parsed.entries.length, 1)
  assert.equal(parsed.entries[0].workDate.toISOString(), '2026-08-17T00:00:00.000Z')
  assert.equal(parsed.entries[0].timeIn.toISOString(), '1970-01-01T12:00:00.000Z')
  assert.equal(parsed.entries[0].timeOut.toISOString(), '1970-01-01T18:00:00.000Z')
})

test('ignores blank rows after daily entries', () => {
  const rows = [
    ['Timesheet'],
    ['Vendor', 'Staff', null, null, null, 'Period Start', 'Period End'],
    ['Acme', 'Jane Doe', null, null, null, 46251, 46251],
    ['Date', 'Day', 'Time In', 'Time Out', 'Activities'],
    [46251, 'Monday', null, null, 'Support'],
    [null, null, null, null, null]
  ]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const buffer = XLSX.write({ SheetNames: ['Sheet1'], Sheets: { Sheet1: sheet } }, { type: 'buffer', bookType: 'xlsx' })
  assert.equal(parseWorkbook(buffer).entries.length, 1)
})
