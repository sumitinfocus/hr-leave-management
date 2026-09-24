import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:4000/api/timesheets'
function headers() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

export default function Timesheets() {
  const [items, setItems] = useState([])
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [year, setYear] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [clockState, setClockState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('clockInState')) || { activeSince: null, log: {}, streak: 0 } }
    catch { return { activeSince: null, log: {}, streak: 0 } }
  })
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!clockState.activeSince) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [clockState.activeSince])

  function todayKey(){ return new Date().toISOString().slice(0, 10) }

  function computeStreak(log){
    let streak = 0
    let cursor = new Date()
    // Count consecutive days (including today) that have logged hours.
    while (log[cursor.toISOString().slice(0, 10)] > 0) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }

  function toggleClock(){
    setClockState(prev => {
      let next
      if (prev.activeSince) {
        const hoursThisSession = (Date.now() - prev.activeSince) / 3600000
        const key = todayKey()
        const log = { ...prev.log, [key]: (prev.log[key] || 0) + hoursThisSession }
        next = { activeSince: null, log, streak: computeStreak(log) }
      } else {
        next = { ...prev, activeSince: Date.now() }
      }
      localStorage.setItem('clockInState', JSON.stringify(next))
      return next
    })
  }

  const hoursToday = useMemo(() => {
    const base = clockState.log[todayKey()] || 0
    const live = clockState.activeSince ? (now - clockState.activeSince) / 3600000 : 0
    return Math.max(0, base + live)
  }, [clockState, now])

  const hoursPct = Math.min(100, Math.round((hoursToday / 8) * 100))
  const streakPct = Math.min(100, Math.round((clockState.streak / 7) * 100))

  async function load() {
    const response = await axios.get(`${API}/my`, { headers: headers(), params: { year: year || undefined, page, pageSize: 25 } })
    setItems(response.data.items)
    setTotalPages(response.data.totalPages)
  }

  useEffect(() => { load().catch(err => setError(err.response?.data?.error || 'Unable to load timesheets')) }, [year, page])

  async function upload(event) {
    event.preventDefault()
    if (!file) return
    setMessage('')
    setError('')
    const form = new FormData()
    form.append('file', file)
    try {
      const response = await axios.post(`${API}/import`, form, { headers: headers() })
      setMessage(response.data.duplicate ? 'This timesheet was already imported.' : 'Timesheet imported and submitted for approval.')
      setFile(null)
      event.target.reset()
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Timesheet import failed')
    }
  }

  async function submit(id) {
    await axios.post(`${API}/${id}/submit`, {}, { headers: headers() })
    await load()
  }

  return (
    <div className="container page-shell">
      <div className="page-header card">
        <div><span className="eyebrow dark">Clock in / Clock out</span><h2>My timesheets</h2></div>
        <div className="page-actions"><a href="/" className="nav-link">Dashboard</a><a href="/timesheet-approvals" className="nav-link">Approvals</a></div>
      </div>
      <div className="card holo-card clock-widget">
        <div className="clock-ring-group">
          <div className="clock-ring hours" style={{ '--hours-pct': hoursPct }} />
          <div className="clock-ring streak" style={{ '--streak-pct': streakPct }} />
          <button type="button" className={`clock-in-btn ${clockState.activeSince ? 'active' : ''}`} onClick={toggleClock}>
            {clockState.activeSince ? 'Tap to Clock Out' : 'Tap to Clock In'}
          </button>
        </div>
        <div className="clock-stats">
          <div className="clock-stat-row">
            <span className="clock-stat-dot" style={{ background: 'var(--neon-blue, var(--accent))' }} />
            <div><strong>{hoursToday.toFixed(1)}h</strong><span>Hours logged today</span></div>
          </div>
          <div className="clock-stat-row">
            <span className="clock-stat-dot" style={{ background: 'var(--neon-green, var(--success))' }} />
            <div><strong>Streak: {clockState.streak} day{clockState.streak === 1 ? '' : 's'}</strong><span>In a row</span></div>
          </div>
        </div>
      </div>
      <div className="card form-card">
        <h3>Upload a timesheet</h3>
        <p className="subtle-text">Upload the downloaded email file (.eml) or its Excel attachment (.xlsx/.xls).</p>
        <form onSubmit={upload}>
          <input type="file" accept=".eml,.xlsx,.xls" onChange={event => setFile(event.target.files[0])} />
          <button className="primary-btn" type="submit">Import timesheet</button>
        </form>
        {message && <div className="message-box success">{message}</div>}
        {error && <div className="error">{error}</div>}
      </div>
      <div className="table-card card">
        <div className="section-header"><h3>Submission history</h3><input className="year-filter" placeholder="Filter year" value={year} onChange={event => { setPage(1); setYear(event.target.value) }} /></div>
        <table>
          <thead><tr><th>Period</th><th>Type</th><th>Days worked</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{items.length === 0 ? <tr><td colSpan="5" className="empty-state">No timesheets yet.</td></tr> : items.map(item => (
            <tr key={item.id}>
              <td>{new Date(item.periodStart).toLocaleDateString()} - {new Date(item.periodEnd).toLocaleDateString()}</td>
              <td>{item.periodType}</td><td>{item.daysWorked ?? '-'}</td>
              <td><span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>{item.rejectionReason && <div className="subtle-text">{item.rejectionReason}</div>}</td>
              <td><a className="secondary-btn inline-btn" href={`/timesheets/${item.id}/detail`}>Details</a>{['DRAFT', 'REJECTED'].includes(item.status) && <button className="approve-btn" onClick={() => submit(item.id)}>Submit</button>}</td>
            </tr>
          ))}</tbody>
        </table>
        <div className="pagination">
          <button className="secondary-btn inline-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="secondary-btn inline-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  )
}
