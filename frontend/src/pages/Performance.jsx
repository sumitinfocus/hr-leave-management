import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:4000/api/performance'
function authHeaders(){
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const CATEGORIES = [
  { key: 'communication', label: 'Communication', icon: '💬' },
  { key: 'ownership', label: 'Ownership', icon: '🚀' },
  { key: 'technical', label: 'Technical Skill', icon: '🛠️' },
  { key: 'teamwork', label: 'Teamwork', icon: '🤝' },
  { key: 'delivery', label: 'Delivery', icon: '📦' }
]

function currentPeriod(){
  const now = new Date()
  return `${now.getFullYear()}-H${now.getMonth() < 6 ? 1 : 2}`
}

const emptyScores = { communication: 3, ownership: 3, technical: 3, teamwork: 3, delivery: 3 }

export default function Performance(){
  const [reviews, setReviews] = useState([])
  const [period, setPeriod] = useState(currentPeriod())
  const [scores, setScores] = useState(emptyScores)
  const [comments, setComments] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load(){
    try {
      const res = await axios.get(`${API}/my`, { headers: authHeaders() })
      setReviews(res.data)
      const current = res.data.find(r => r.period === period)
      if (current) {
        setScores(current.scores)
        setComments(current.employeeComments || '')
      }
    } catch (err) {
      setError('Unable to load your performance reviews')
    }
  }

  const currentReview = reviews.find(r => r.period === period)
  const locked = currentReview && !['DRAFT', 'REJECTED'].includes(currentReview.status)
  const overallScore = Object.values(scores).reduce((a, b) => a + Number(b), 0) / CATEGORIES.length
  const xpPct = Math.round((overallScore / 5) * 100)

  async function save(submit){
    setMessage(''); setError('')
    try {
      const res = await axios.post(`${API}/my`, { period, scores, employeeComments: comments, submit }, { headers: authHeaders() })
      setMessage(submit ? 'Self-assessment submitted for manager review 🎉' : 'Draft saved')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save review')
    }
  }

  return (
    <div className="container page-shell">
      <div className="page-header card">
        <div><span className="eyebrow dark">Level Up</span><h2>Performance &amp; Growth</h2></div>
        <div className="page-actions">
          <a href="/" className="nav-link">Dashboard</a>
          <a href="/performance-approvals" className="nav-link">Manager view</a>
        </div>
      </div>

      <div className="card holo-card" style={{ marginBottom: '1.4rem', textAlign: 'center' }}>
        <span className="panel-badge">Current build</span>
        <h1 style={{ fontSize: '2.4rem', margin: '0.4rem 0' }}>{currentReview?.level || '🌱 Rookie'}</h1>
        <div className="battery-meter" style={{ maxWidth: '360px', margin: '0.8rem auto' }}>
          <div className="battery-shell">
            <div className="battery-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
        <p className="subtle-text">Overall score: {overallScore.toFixed(1)} / 5 for {period}</p>
      </div>

      {message && <div className="message-box success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <div className="content-grid two-col">
        <div className="card form-panel">
          <h3>Self-assessment · {period}</h3>
          <div className="field-block">
            <label className="field-label">Review period</label>
            <select value={period} onChange={e => setPeriod(e.target.value)}>
              <option value={`${new Date().getFullYear()}-H1`}>{new Date().getFullYear()}-H1</option>
              <option value={`${new Date().getFullYear()}-H2`}>{new Date().getFullYear()}-H2</option>
            </select>
          </div>

          {CATEGORIES.map(cat => (
            <div className="field-block" key={cat.key}>
              <label className="field-label">{cat.icon} {cat.label}: {scores[cat.key]}/5</label>
              <input
                type="range" min="1" max="5" step="1"
                value={scores[cat.key]}
                disabled={locked}
                onChange={e => setScores({ ...scores, [cat.key]: Number(e.target.value) })}
              />
            </div>
          ))}

          <label className="field-label">Comments</label>
          <textarea rows="4" value={comments} disabled={locked} onChange={e => setComments(e.target.value)} placeholder="What did you ship? What are you proud of?" />

          <div className="button-row">
            <button className="secondary-btn" disabled={locked} onClick={() => save(false)}>Save draft</button>
            <button className="primary-btn" disabled={locked} onClick={() => save(true)}>Submit for review</button>
          </div>
          {locked && <p className="subtle-text">This review is {currentReview.status.toLowerCase()} and can no longer be edited.</p>}
        </div>

        <div className="card visual-panel">
          <div className="panel-badge">Review history</div>
          <h3>Past periods</h3>
          {reviews.length === 0 ? <p className="subtle-text">No reviews yet — start your first self-assessment.</p> : (
            <ul className="info-list">
              {reviews.map(r => (
                <li key={r.id}>
                  <b>{r.period}</b> — {r.level || 'Not scored yet'} · <span className={`status-pill ${r.status === 'APPROVED' ? 'approved' : r.status === 'REJECTED' ? 'rejected' : 'pending'}`}>{r.status}</span>
                  {r.managerComments && <div className="subtle-text">Manager: {r.managerComments}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
