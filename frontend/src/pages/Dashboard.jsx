import React, { useEffect, useState } from 'react'
import axios from 'axios'

function authHeaders(){
  const token = localStorage.getItem('token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function ThemeToggle(){
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

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
      {theme === 'light' ? '?' : '?'}
    </button>
  )
}

export default function Dashboard(){
  const [applications, setApplications] = useState([])

  useEffect(()=>{ fetchMy() }, [])

  async function fetchMy(){
    const res = await axios.get('http://localhost:4000/api/leave/my', { headers: authHeaders() })
    setApplications(res.data)
  }

  const stats = [
    { label: 'Pending', value: applications.filter(a => a.status === 'PENDING').length, icon: '?' },
    { label: 'Approved', value: applications.filter(a => a.status === 'APPROVED').length, icon: '?' },
    { label: 'Rejected', value: applications.filter(a => a.status === 'REJECTED').length, icon: '??' },
    { label: 'Total', value: applications.length, icon: '??' }
  ]

  const trend = [58, 72, 64, 88, 80, 96, 74]

  return (
    <div className="container dashboard-page">
      <div className="mobile-page-toolbar">
        <div>
          <span className="eyebrow dark">Employee portal</span>
          <strong>My workspace</strong>
        </div>
        <div className="user-menu">
          <div className="notification-dot">3</div>
          <div className="avatar-pill">AL</div>
          <ThemeToggle />
        </div>
      </div>

      <div className="dashboard-hero card">
        <div className="hero-copy">
          <span className="eyebrow">Employee portal</span>
          <h2>Welcome back, Alice.</h2>
          <p>Manage your leave balance, request time off, and stay aligned with your team schedule.</p>
        </div>
        <div className="hero-visual">
          <div className="mini-people" aria-label="Team working together illustration" />
        </div>
      </div>

      <div className="stats-grid">
        {stats.map(stat => (
          <div className="stat-card card" key={stat.label}>
            <div className="stat-icon">{stat.icon}</div>
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
            {trend.map((value, index) => (
              <div key={index} className="bar-column">
                <span className="bar" style={{ height: `${value}%` }} />
                <small>{['M','T','W','T','F','S','S'][index]}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card quick-panel">
          <div className="section-header">
            <h3>Quick actions</h3>
          </div>
          <div className="quick-list">
            <a href="/apply" className="quick-item"><span>??</span> Request leave</a>
            <a href="/holidays" className="quick-item"><span>??</span> View holidays</a>
            <a href="/reports" className="quick-item"><span>??</span> Team reports</a>
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
