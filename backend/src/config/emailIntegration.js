function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function getOAuthConfig() {
  return {
    tenantId: required('OAUTH_TENANT_ID'),
    clientId: required('OAUTH_CLIENT_ID'),
    clientSecret: required('OAUTH_CLIENT_SECRET'),
    redirectUri: process.env.OAUTH_REDIRECT_URI || `http://localhost:${process.env.PORT || 4000}/oauth/callback`
  }
}

function getEmailIntegrationConfig() {
  const defaultDepartmentId = Number(required('LEAVE_DEFAULT_DEPARTMENT_ID'))
  if (!Number.isInteger(defaultDepartmentId) || defaultDepartmentId < 1) {
    throw new Error('LEAVE_DEFAULT_DEPARTMENT_ID must be a positive integer')
  }
  const oauth = getOAuthConfig()
  return {
    provider: process.env.MAIL_PROVIDER || 'outlook-imap',
    ...oauth,
    refreshToken: required('OAUTH_REFRESH_TOKEN'),
    mailbox: required('LEAVE_MANAGER_EMAIL'),
    managerEmail: required('LEAVE_MANAGER_EMAIL'),
    imapHost: process.env.IMAP_HOST || 'outlook.office365.com',
    imapPort: Number(process.env.IMAP_PORT || 993),
    smtpHost: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
    smtpPort: Number(process.env.SMTP_PORT || 587),
    defaultDepartmentId,
    pollingIntervalMs: Number(process.env.LEAVE_POLL_INTERVAL_MS || 300000),
    enabled: process.env.LEAVE_EMAIL_POLLING_ENABLED === 'true' || process.env.TIMESHEET_EMAIL_POLLING_ENABLED === 'true',
    leavePollingEnabled: process.env.LEAVE_EMAIL_POLLING_ENABLED === 'true',
    timesheetPollingEnabled: process.env.TIMESHEET_EMAIL_POLLING_ENABLED === 'true'
  }
}

function getEmployeeCreationConfig() {
  const defaultDepartmentId = Number(process.env.LEAVE_DEFAULT_DEPARTMENT_ID || 1)
  if (!Number.isInteger(defaultDepartmentId) || defaultDepartmentId < 1) {
    throw new Error('LEAVE_DEFAULT_DEPARTMENT_ID must be a positive integer')
  }
  return {
    defaultDepartmentId,
    managerEmail: process.env.LEAVE_MANAGER_EMAIL || 'sumit@infocusin.com'
  }
}

module.exports = { getEmailIntegrationConfig, getEmployeeCreationConfig, getOAuthConfig }
