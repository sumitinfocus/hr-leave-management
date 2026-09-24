const test = require('node:test')
const assert = require('node:assert/strict')
const { parseLeaveEmail } = require('../src/services/leaveEmailParser')

test('parses a labeled leave email', () => {
  const result = parseLeaveEmail({
    id: 'message-1',
    subject: 'Leave request',
    body: {
      contentType: 'text',
      content: [
        'Employee Email: carol@example.com',
        'Leave Type: Casual',
        'Start Date: 2026-10-01',
        'End Date: 2026-10-03',
        'Reason: Personal leave'
      ].join('\n')
    },
    from: { emailAddress: { address: 'carol@example.com', name: 'Carol Dev' } }
  })
  assert.equal(result.employeeEmail, 'carol@example.com')
  assert.equal(result.type, 'CASUAL')
  assert.equal(result.reason, 'Personal leave')
  assert.equal(result.startDate.toISOString(), '2026-10-01T00:00:00.000Z')
})

test('ignores subjects without Leave', () => {
  assert.equal(parseLeaveEmail({ id: 'message-2', subject: 'Holiday question', body: { contentType: 'text', content: '' } }), null)
})

test('rejects incomplete leave emails', () => {
  assert.throws(
    () => parseLeaveEmail({ id: 'message-3', subject: 'Leave', body: { contentType: 'text', content: 'Employee Email: carol@example.com' } }),
    /Missing required fields/
  )
})
