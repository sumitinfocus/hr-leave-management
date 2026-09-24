import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:4000/api/performance'
function authHeaders(){
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const CATEGORIES = [
  { key: 'communication', label: 'Communication' },
  { key: 'ownership', label: 'Ownership' },
  { key: 'technical', label: 'Technical Skill' },
  { key: 'teamwork', label: 'Teamwork' },
  { key: 'delivery', label: 'Delivery' }
]

export default function PerformanceApprovals(){
  const [reviews, setReviews] = useState([])
  const [drafts, setDrafts] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load(){
    try {
      const res = await axios.get(`${API}/team`, { headers: authHeaders() })
      setReviews(res.data)
      const nextDrafts = {}
      res.data.forEach(r => { nextDrafts[r.id] = { managerComments: r.managerComments || '', managerScores: r.managerScores || r.scores } })
      setDrafts(nextDrafts)
    } catch (err) {
      setError('Unable to load team reviews')
    }
  }

  function updateScore(id, key, value){
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], managerScores: { ...prev[id].managerScores, [key]: Number(value) } } }))
  }

  function updateComment(id, value){
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], managerComments: value } }))
  }

  async function decide(id, decision){
    setMessage(''); setError('')
    try {
      await axios.put(`${API}/team/${id}`, { decision, ...drafts[id] }, { headers: authHeaders() })
      setMessage(decision === 'APPROVED' ? 'Review approved 🎉' : 'Review sent back for revision')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update review')
    }
  }

  const pending = reviews.filter(r => r.status === 'SUBMITTED')
  const decided = reviews.filter(r => r.status !== 'SUBMITTED')

  return (
    <div className="container page-shell">
      <div className="page-header card">
        <div><span className="eyebrow dark">Level Up</span><h2>Performance Approvals</h2></div>
        <div className="page-actions"><a href="/" className="nav-link">Dashboard</a><a href="/performance" className="nav-link">My reviews</a></div>
      </div>

      {message && <div className="message-box success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <div className="table-card card">
        <div className="section-header"><h3>Pending your review ({pending.length})</h3></div>
        {pending.length === 0 ? <p className="empty-state">Nothing waiting on you — nice.</p> : (
          <div className="kpi-grid">
            {pending.map(review => {
              const draft = drafts[review.id] || { managerScores: review.scores, managerComments: '' }
              return (
                <div className="card holo-card kpi-card" key={review.id}>
                  <span className="kpi-label">{review.employee.firstName} {review.employee.lastName} · {review.period}</span>
                  <p className="subtle-text">Self-assessed: {review.level}</p>
                  {review.employeeComments && <p className="subtle-text">"{review.employeeComments}"</p>}
                  {CATEGORIES.map(cat => (
                    <div className="field-block" key={cat.key}>
                      <label className="field-label">{cat.label}: {draft.managerScores[cat.key]}/5</label>
                      <input type="range" min="1" max="5" step="1" value={draft.managerScores[cat.key]} onChange={e => updateScore(review.id, cat.key, e.target.value)} />
                    </div>
                  ))}
                  <label className="field-label">Manager comments</label>
                  <textarea rows="3" value={draft.managerComments} onChange={e => updateComment(review.id, e.target.value)} placeholder="Feedback for this half..." />
                  <div className="button-row">
                    <button className="approve-btn" onClick={() => decide(review.id, 'APPROVED')}>Approve</button>
                    <button className="reject-btn" onClick={() => decide(review.id, 'REJECTED')}>Send back</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="table-card card">
        <div className="section-header"><h3>Reviewed</h3></div>
        <table>
          <thead><tr><th>Employee</th><th>Period</th><th>Level</th><th>Status</th></tr></thead>
          <tbody>
            {decided.length === 0 ? <tr><td colSpan="4" className="empty-state">No decisions yet.</td></tr> : decided.map(r => (
              <tr key={r.id}>
                <td>{r.employee.firstName} {r.employee.lastName}</td>
                <td>{r.period}</td>
                <td>{r.level}</td>
                <td><span className={`status-pill ${r.status === 'APPROVED' ? 'approved' : 'rejected'}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
