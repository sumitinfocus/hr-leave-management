const { ImapFlow } = require('imapflow')
const nodemailer = require('nodemailer')
const { simpleParser } = require('mailparser')

async function getAccessToken(config, fetchImpl = fetch) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token',
    scope: 'https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send offline_access'
  })
  const response = await fetchImpl(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }
  )
  const text = await response.text()
  let result
  try {
    result = text ? JSON.parse(text) : null
  } catch {
    result = null
  }
  if (!response.ok || !result || !result.access_token) {
    const detail = result && result.error_description ? result.error_description : response.statusText
    throw new Error(`Outlook OAuth token refresh failed (${response.status}): ${detail}`)
  }
  return result
}

async function exchangeAuthorizationCode(config, code, fetchImpl = fetch) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    scope: 'offline_access https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send'
  })
  const response = await fetchImpl(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }
  )
  const text = await response.text()
  let result
  try {
    result = text ? JSON.parse(text) : null
  } catch {
    result = null
  }
  if (!response.ok || !result || !result.refresh_token) {
    const detail = result && result.error_description ? result.error_description : response.statusText
    throw new Error(`OAuth authorization code exchange failed (${response.status}): ${detail}`)
  }
  return result
}

function createImapClient(config, token) {
  const client = new ImapFlow({
    host: config.imapHost,
    port: config.imapPort,
    secure: true,
    auth: { user: config.mailbox, accessToken: token },
    logger: false
  })
  // ImapFlow emits 'error' for connection resets that occur outside an active
  // command (for example while a lock is being released). Without a listener,
  // Node treats this as an unhandled event and crashes the whole process.
  client.on('error', error => {
    console.error(`Outlook IMAP connection error (cid=${client.id || 'unknown'}): ${error.message}`)
  })
  return client
}

async function closeImapClient(client) {
  try {
    await client.logout()
  } catch (error) {
    try {
      client.close()
    } catch {
      // ignore secondary close failures; the connection is already unusable
    }
  }
}

function createOutlookMailClient(config, fetchImpl = fetch) {
  let tokenResult
  async function accessToken() {
    if (!tokenResult) tokenResult = await getAccessToken(config, fetchImpl)
    return tokenResult.access_token
  }

  return {
    async listLeaveMessages({ unreadOnly = true, since = null, subjectContains = null } = {}) {
      const token = await accessToken()
      const client = createImapClient(config, token)
      const messages = []
      await client.connect()
      const lock = await client.getMailboxLock('INBOX')
      try {
        const searchQuery = {}
        if (unreadOnly) searchQuery.seen = false
        if (since) searchQuery.since = since
        if (subjectContains) searchQuery.subject = subjectContains
        const hasFilter = Object.keys(searchQuery).length > 0
        const range = hasFilter ? await client.search(searchQuery, { uid: true }) : '1:*'
        if (hasFilter && (!range || range.length === 0)) return { value: [] }
        for await (const message of client.fetch(range, { uid: true, flags: true, internalDate: true, source: true }, { uid: hasFilter })) {
          const parsed = await simpleParser(message.source)
          messages.push({
            id: `${config.mailbox}:${message.uid}`,
            source: message.source,
            attachments: parsed.attachments.map(attachment => ({
              filename: attachment.filename || null,
              contentType: attachment.contentType || null,
              size: attachment.size || attachment.content?.length || 0
            })),
            subject: parsed.subject || '',
            body: { contentType: 'text', content: parsed.text || parsed.html || '' },
            from: parsed.from && parsed.from.value && parsed.from.value[0]
              ? { emailAddress: { address: parsed.from.value[0].address, name: parsed.from.value[0].name } }
              : null,
            receivedDateTime: message.internalDate ? message.internalDate.toISOString() : null,
            uid: message.uid
          })
        }
      } finally {
        lock.release()
        await closeImapClient(client)
      }
      return { value: messages }
    },
    async markRead(messageId) {
      const uid = Number(String(messageId).split(':').pop())
      const token = await accessToken()
      const client = createImapClient(config, token)
      await client.connect()
      const lock = await client.getMailboxLock('INBOX')
      try {
        await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true })
      } finally {
        lock.release()
        await closeImapClient(client)
      }
    },
    async sendMail(message) {
      const token = await accessToken()
      const transport = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: false,
        auth: { type: 'OAuth2', user: config.mailbox, accessToken: token }
      })
      await transport.sendMail({
        from: config.mailbox,
        to: message.toRecipients.map(recipient => recipient.emailAddress.address),
        subject: message.subject,
        text: message.body.content
      })
    }
  }
}

module.exports = { createOutlookMailClient, getAccessToken, exchangeAuthorizationCode }
