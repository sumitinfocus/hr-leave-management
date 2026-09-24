import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:4000/api/leave-type-policy'
function authHeaders(){
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function LeaveTypeMaster(){
  const [policies, setPolicies] = useState([])
  const [drafts, setDrafts] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load(){
    try {
      const res = await axios.get(API)
      setPolicies(res.data)
      const nextDrafts = {}
      res.data.forEach(p => { nextDrafts[p.id] = { label: p.label, defaultAnnualDays: p.defaultAnnualDays, color: p.color, active: p.active } })
      setDrafts(nextDrafts)
    } catch (err) {
      setError('Unable to load leave type policies')
    }
  }

  function updateDraft(id, field, value){
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  async function save(id){
    setMessage(''); setError('')
    try {
      await axios.put(`${API}/${id}`, drafts[id], { headers: authHeaders() })
      setMessage('Leave type updated')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update leave type')
    }
  }

  return (
    <div className="container page-shell">
      <div className="page-header card">
        <div><span className="eyebrow dark">Admin</span><h2>Leave Type Master</h2></div>
        <div className="page-actions"><a href="/" className="nav-link">Dashboard</a><a href="/employees" className="nav-link">Employee Master</a></div>
      </div>

      <div className="card visual-panel" style={{ marginBottom: '1.4rem' }}>
        <div className="panel-badge">Configurable policy</div>
        <h3>Customize how leave types show up everywhere</h3>
        <p className="subtle-text">Labels, default annual entitlement days, colors, and active status here drive the Apply Leave dropdown and reporting across the app. The underlying leave category code is fixed for data integrity.</p>
      </div>

      {message && <div className="message-box success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <div className="kpi-grid">
        {policies.map(policy => {
          const draft = drafts[policy.id] || {}
          return (
            <div className="card holo-card kpi-card" key={policy.id}>
              <span className="vibe-dot" style={{ background: draft.color, display: 'inline-block', marginBottom: '0.5rem' }} />
              <span className="kpi-label">{policy.code}</span>
              <div className="field-block">
                <label className="field-label">Display label</label>
                <input value={draft.label || ''} onChange={e => updateDraft(policy.id, 'label', e.target.value)} />
              </div>
              <div className="field-block">
                <label className="field-label">Default annual days</label>
                <input type="number" min="0" value={draft.defaultAnnualDays ?? 0} onChange={e => updateDraft(policy.id, 'defaultAnnualDays', e.target.value)} />
              </div>
              <div className="field-block">
                <label className="field-label">Accent color</label>
                <input type="color" value={draft.color || '#7c3aed'} onChange={e => updateDraft(policy.id, 'color', e.target.value)} />
              </div>
              <div className="field-block">
                <label className="field-label">
                  <input type="checkbox" style={{ width: 'auto', marginRight: '0.4rem' }} checked={!!draft.active} onChange={e => updateDraft(policy.id, 'active', e.target.checked)} />
                  Active (shown in Apply Leave)
                </label>
              </div>
              <button className="primary-btn" onClick={() => save(policy.id)}>Save</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
