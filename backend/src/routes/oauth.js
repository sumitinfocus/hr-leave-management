const crypto = require('crypto')
const express = require('express')
const { getOAuthConfig } = require('../config/emailIntegration')
const { exchangeAuthorizationCode } = require('../services/outlookMail')

const router = express.Router()
const pendingStates = new Map()
const scopes = 'offline_access https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send'

function localRequest(req) {
  const address = req.ip || req.socket.remoteAddress || ''
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function cleanupStates() {
  const now = Date.now()
  for (const [state, expiresAt] of pendingStates) {
    if (expiresAt <= now) pendingStates.delete(state)
  }
}

router.get('/authorize', (req, res) => {
  if (!localRequest(req)) return res.status(403).send('OAuth setup is available only from this computer.')

  try {
    cleanupStates()
    const config = getOAuthConfig()
    const state = crypto.randomBytes(32).toString('hex')
    pendingStates.set(state, Date.now() + 10 * 60 * 1000)
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      response_mode: 'query',
      scope: scopes,
      state
    })
    res.redirect(`https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/authorize?${params}`)
  } catch (error) {
    res.status(500).send(escapeHtml(error.message))
  }
})

router.get('/callback', async (req, res) => {
  if (!localRequest(req)) return res.status(403).send('OAuth setup is available only from this computer.')
  const { code, state, error, error_description: errorDescription } = req.query
  if (error) {
    return res.status(400).send(`Microsoft OAuth error: ${escapeHtml(errorDescription || error)}`)
  }
  if (!code || !state || !pendingStates.has(state)) {
    return res.status(400).send('The OAuth code or state is missing or expired. Start again at /oauth/authorize.')
  }
  pendingStates.delete(state)

  try {
    const config = getOAuthConfig()
    const result = await exchangeAuthorizationCode(config, code)
    res.set('Cache-Control', 'no-store')
    res.type('html').send(`<!doctype html>
      <html><head><meta charset="utf-8"><title>OAuth complete</title></head>
      <body>
        <h1>OAuth authorization complete</h1>
        <p>Copy this refresh token into <code>backend/.env</code> as <code>OAUTH_REFRESH_TOKEN</code>. Do not share it.</p>
        <textarea rows="8" cols="100" readonly>${escapeHtml(result.refresh_token || '')}</textarea>
        <p>After saving it, restart the backend and close this page.</p>
      </body></html>`)
  } catch (error) {
    res.status(502).send(`OAuth token exchange failed: ${escapeHtml(error.message)}`)
  }
})

module.exports = router
