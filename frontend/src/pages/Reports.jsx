import React, { useState } from 'react'
import axios from 'axios'

function authHeaders(){
  const token = localStorage.getItem('token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export default function Reports(){
  const [deptId, setDeptId] = useState('')
  const [summary, setSummary] = useState(null)

  async function fetchSummary(){
    const res = await axios.get(`http://localhost:4000/api/report/department/${deptId}/summary`, { headers: authHeaders() })
    setSummary(res.data)
  }

  async function downloadCsv(){
    const res = await axios.get(`http://localhost:4000/api/report/department/${deptId}`, { headers: authHeaders(), responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `department_${deptId}_report.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className="container page-shell">
      <div className="page-header card">
        <div>
          <span className="eyebrow dark">Reports</span>
          <h2>Department analytics</h2>
        </div>
        <div className="page-actions">
          <a href="/" className="nav-link">Dashboard</a>
          <a href="/approvals" className="nav-link">Approvals</a>
          <button type="button" className="theme-toggle" onClick={() => {
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
            document.documentElement.setAttribute('data-theme', next)
            localStorage.setItem('theme', next)
          }} aria-label="Toggle theme">Theme</button>
        </div>
      </div>

      <div className="content-grid two-col">
        <div className="card form-panel">
          <div className="field-block">
            <label className="field-label">Department ID</label>
            <input placeholder="Department ID" value={deptId} onChange={e=>setDeptId(e.target.value)} />
          </div>
          <div className="button-row">
            <button className="primary-btn" onClick={fetchSummary} disabled={!deptId}>Get Summary</button>
            <button className="secondary-btn" onClick={downloadCsv} disabled={!deptId}>Download CSV</button>
          </div>
        </div>

        <div className="card visual-panel">
          <div className="panel-badge">Insights</div>
          <h3>Quick overview</h3>
          <p className="muted-copy">Track leave volume across departments and identify patterns in approval flow.</p>
          <div className="mini-illustration reports-illustration" aria-label="Analytics dashboard illustration" />
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card"><span className="kpi-label">Total requests</span><strong>{summary?.total ?? '-'}</strong><small>Selected department</small></div>
        <div className="card kpi-card"><span className="kpi-label">Open requests</span><strong>{summary?.byStatus?.PENDING ?? '-'}</strong><small>Pending approval</small></div>
        <div className="card kpi-card"><span className="kpi-label">Approved requests</span><strong>{summary?.byStatus?.APPROVED ?? '-'}</strong><small>Selected department</small></div>
      </div>

      <div className="card chart-panel large-panel">
        <div className="section-header">
          <h3>Leave trend</h3>
          <span className="chip neutral">Q3 snapshot</span>
        </div>
        <div className="chart-bars">
          {['PENDING', 'APPROVED', 'REJECTED'].map(status => {
            const value = summary?.byStatus?.[status] || 0
            const max = Math.max(1, ...Object.values(summary?.byStatus || {}).map(Number))
            return (
            <div key={status} className="bar-column">
              <span className="bar" style={{ height: `${Math.max(8, (value / max) * 100)}%` }} title={`${value} ${status.toLowerCase()} request(s)`} />
              <small>{status}</small>
            </div>
            )
          })}
        </div>
      </div>

      {summary && (
        <div className="card summary-panel">
          <h3>Summary</h3>
          <pre>{JSON.stringify(summary, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
