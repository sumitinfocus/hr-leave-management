import React, { useEffect, useState } from 'react'
import axios from 'axios'

function authHeaders(){
  const token = localStorage.getItem('token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function ThemeToggle(){
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  )
}

function getGreeting(){
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good morning', vibe: '☀️ Rise & grind' }
  if (hour < 17) return { text: 'Good afternoon', vibe: '⚡ Keep the momentum' }
  return { text: 'Good evening', vibe: '🌙 Wind-down mode' }
}

export default function Dashboard(){
  const [applications, setApplications] = useState([])
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(()=>{ fetchMy() }, [])

  async function fetchMy(){
    const res = await axios.get('http://localhost:4000/api/leave/my', { headers: authHeaders() })
    setApplications(res.data)
  }

  const stats = [
    { label: 'Pending', value: applications.filter(a => a.status === 'PENDING').length, icon: 'P', color: 'var(--neon-purple, var(--primary))' },
    { label: 'Approved', value: applications.filter(a => a.status === 'APPROVED').length, icon: 'A', color: 'var(--neon-green, var(--success))' },
    { label: 'Rejected', value: applications.filter(a => a.status === 'REJECTED').length, icon: 'R', color: 'var(--neon-pink, var(--danger))' },
    { label: 'Total', value: applications.length, icon: 'T', color: 'var(--neon-blue, var(--accent))' }
  ]

  const trend = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
    const count = applications.filter(item => new Date(item.startDate).getMonth() === index).length
    return { month, count }
  })
  const maxTrend = Math.max(1, ...trend.map(item => item.count))

  const greeting = getGreeting()
  const initials = `${user.firstName || 'U'} ${user.lastName || ''}`.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
  const vibeTotal = Math.max(1, applications.length)
  const vibeSlices = [
    { label: 'Approved', count: applications.filter(a => a.status === 'APPROVED').length, color: 'var(--neon-green, var(--success))' },
    { label: 'Pending', count: applications.filter(a => a.status === 'PENDING').length, color: 'var(--neon-blue, var(--accent))' },
    { label: 'Rejected', count: applications.filter(a => a.status === 'REJECTED').length, color: 'var(--neon-pink, var(--accent-2))' }
  ]
  let acc = 0
  const wheelStyle = {}
  vibeSlices.forEach((slice, i) => {
    acc += (slice.count / vibeTotal) * 100
    wheelStyle[`--p${i + 1}`] = `${acc}%`
  })
  const vibeScore = Math.round((vibeSlices[0].count / vibeTotal) * 100) || (applications.length === 0 ? 100 : 0)

  return (
    <div className="container dashboard-page">
      <div className="topbar">
        <div className="brand-row">
          <span className="brand-mark">N</span>
          <span>Northstar Labs</span>
        </div>

        <div className="topbar-actions">
          <a href="/holidays" className="nav-link">Holidays</a>
          <a href="/approvals" className="nav-link">Approvals</a>
          <a href="/reports" className="nav-link">Reports</a>
          <a href="/timesheets" className="nav-link">Timesheets</a>
          <a href="/timesheet-approvals" className="nav-link">Timesheet Approvals</a>
          <a href="/apply" className="nav-link">Apply Leave</a>
          <a href="/performance" className="nav-link">Performance</a>
          {(user.role === 'MANAGER' || user.role === 'HR_ADMIN') && <a href="/performance-approvals" className="nav-link">Performance Approvals</a>}
          {user.role === 'HR_ADMIN' && <a href="/employees" className="nav-link">Employee Master</a>}
          {user.role === 'HR_ADMIN' && <a href="/leave-types" className="nav-link">Leave Types</a>}

          <div className="user-menu">
            <div className="notification-dot">{applications.filter(a => a.status === 'PENDING').length}</div>
            <div className="avatar-pill">{`${user.firstName || 'User'} ${user.lastName || ''}`.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</div>
            <ThemeToggle />
            <button type="button" className="secondary-btn inline-btn" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login' }}>Logout</button>
          </div>
        </div>
      </div>

      <div className="greeting-bar">
        <div className="greeting-copy">
          <span className="greeting-eyebrow">{greeting.vibe}</span>
          <h1>{greeting.text}, {user.firstName || 'there'} 👋</h1>
          <p>Here's your daily vibe check and what's on your plate today.</p>
        </div>
        <div className="greeting-avatar">{initials || 'U'}</div>
      </div>

      <div className="dashboard-hero card">
        <div className="hero-copy">
          <span className="eyebrow">Employee portal</span>
          <h2>Welcome back, {user.firstName || 'there'}.</h2>
          <p>Manage your leave requests, timesheets, approvals, and team schedule.</p>
        </div>
        <div className="hero-visual">
          <div className="mini-people" aria-label="Team working together illustration" />
        </div>
      </div>

      <div className="card holo-card vibe-wheel-card">
        <div className="vibe-wheel" style={wheelStyle}>
          <div className="vibe-wheel-center">
            <strong>{vibeScore}%</strong>
            <span>Approved vibe</span>
          </div>
        </div>
        <div className="vibe-legend">
          <h3 style={{ margin: '0 0 0.2rem' }}>Daily work vibe</h3>
          {vibeSlices.map(slice => (
            <div className="vibe-legend-item" key={slice.label}>
              <span className="vibe-dot" style={{ background: slice.color }} />
              {slice.label} <b>{slice.count}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        {stats.map(stat => (
          <div className="stat-card card holo-card" key={stat.label}>
            <div className="stat-icon" style={{ background: stat.color }}>{stat.icon}</div>
            <div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <div className="card chart-panel">
          <div className="section-header">
            <h3>Team workload</h3>
            <span className="chip success">+12.4%</span>
          </div>
          <div className="chart-bars">
            {trend.map(item => (
              <div key={item.month} className="bar-column">
                <span className="bar" style={{ height: `${Math.max(8, (item.count / maxTrend) * 100)}%` }} title={`${item.count} request(s)`} />
                <small>{item.month}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card quick-panel">
          <div className="section-header">
            <h3>Quick actions</h3>
          </div>
          <div className="quick-list">
            <a href="/apply" className="quick-item"><span>LV</span> Request leave</a>
            <a href="/holidays" className="quick-item"><span>HD</span> View holidays</a>
            <a href="/reports" className="quick-item"><span>RP</span> Team reports</a>
            <a href="/timesheets" className="quick-item"><span>TS</span> Timesheets</a>
          </div>
        </div>
      </div>

      <div className="table-card card">
        <div className="section-header">
          <h3>My Leave Applications</h3>
          <a href="/apply" className="primary-btn inline-btn">Apply Leave</a>
        </div>

        <table>
          <thead><tr><th>Type</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
          <tbody>
            {applications.length === 0 ? (
              <tr><td colSpan="4" className="empty-state">No leave requests yet.</td></tr>
            ) : applications.map(a=> (
              <tr key={a.id}><td>{a.type}</td><td>{new Date(a.startDate).toLocaleDateString()}</td><td>{new Date(a.endDate).toLocaleDateString()}</td><td><span className={`status-pill ${a.status.toLowerCase()}`}>{a.status}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
