import React, { useState } from 'react'
import axios from 'axios'

function authHeaders(){
  const token = localStorage.getItem('token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export default function ApplyLeave(){
  const [type, setType] = useState('CASUAL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e){
    e.preventDefault()
    try{
      await axios.post('http://localhost:4000/api/leave/apply', { type, startDate, endDate, reason }, { headers: authHeaders() })
      setMessage('Leave applied successfully')
      setReason('')
    }catch(err){
      setMessage('Error applying leave')
    }
  }

  return (
    <div className="container page-shell">
      <div className="page-header card">
        <div>
          <span className="eyebrow dark">Leave request</span>
          <h2>Apply for time off</h2>
        </div>
        <div className="page-actions">
          <a href="/" className="nav-link">Dashboard</a>
          <a href="/approvals" className="nav-link">Approvals</a>
        </div>
      </div>

      <div className="content-grid two-col">
        <form className="card form-panel" onSubmit={handleSubmit}>
          <div className="field-grid">
            <div className="field-block">
              <label className="field-label">Leave type</label>
              <select value={type} onChange={e=>setType(e.target.value)}>
                <option value="CASUAL">Casual Leave</option>
                <option value="PRIVILEGE">Privilege Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="MATERNITY">Maternity Leave</option>
                <option value="PATERNITY">Paternity Leave</option>
                <option value="OFFICIAL_TOUR">Official Tour</option>
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Reason</label>
              <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Add a short reason for your leave" rows="4" />
            </div>
          </div>

          <div className="field-grid two-up">
            <div className="field-block">
              <label className="field-label">Start date</label>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} required />
            </div>
            <div className="field-block">
              <label className="field-label">End date</label>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="primary-btn">Apply</button>
          {message && <div className="message-box success">{message}</div>}
        </form>

        <div className="card visual-panel">
          <div className="panel-badge">Leave policy</div>
          <h3>Before you submit</h3>
          <ul className="info-list">
            <li>Check your remaining balance for the selected leave type.</li>
            <li>Submit requests at least 2 working days in advance where possible.</li>
            <li>Managers will review the request and send a decision.</li>
          </ul>
          <div className="mini-illustration" aria-label="Team planning leaves" />
        </div>
      </div>
    </div>
  )
}
