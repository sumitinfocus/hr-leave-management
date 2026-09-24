import React, { useEffect, useRef, useState } from 'react'
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
  const [entitlement, setEntitlement] = useState(null)
  const [used, setUsed] = useState(0)
  const [leaveTypes, setLeaveTypes] = useState([])
  const formRef = useRef(null)
  const dragState = useRef({ startX: 0, dragging: false })
  const [dragX, setDragX] = useState(0)

  useEffect(() => { loadBalance(); loadLeaveTypes() }, [])

  async function loadLeaveTypes(){
    try {
      const res = await axios.get('http://localhost:4000/api/leave-type-policy?activeOnly=true')
      setLeaveTypes(res.data)
      if (res.data.length > 0 && !res.data.some(p => p.code === type)) {
        setType(res.data[0].code)
      }
    } catch (err) {
      // Fall back to hardcoded select options if the master data is unavailable.
    }
  }

  async function loadBalance(){
    try {
      const [entRes, myRes] = await Promise.all([
        axios.get('http://localhost:4000/api/entitlement/me', { headers: authHeaders() }),
        axios.get('http://localhost:4000/api/leave/my', { headers: authHeaders() })
      ])
      setEntitlement(entRes.data)
      const approvedDays = (myRes.data || []).filter(a => a.status === 'APPROVED').reduce((sum, a) => {
        const days = Math.round((new Date(a.endDate) - new Date(a.startDate)) / 86400000) + 1
        return sum + Math.max(1, days)
      }, 0)
      setUsed(approvedDays)
    } catch (err) {
      // Balance widget is best-effort; leave form still works without it.
    }
  }

  const totalEntitled = entitlement
    ? ['casual', 'privilege', 'sick', 'maternity', 'paternity', 'officialTour'].reduce((sum, key) => sum + (entitlement[key] || 0), 0)
    : 0
  const available = Math.max(0, totalEntitled - used)
  const availablePct = totalEntitled > 0 ? Math.round((available / totalEntitled) * 100) : 0

  function scrollToForm(){
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    formRef.current?.querySelector('select')?.focus()
  }

  function onPointerDown(e){
    dragState.current = { startX: e.clientX, dragging: true }
  }
  function onPointerMove(e){
    if (!dragState.current.dragging) return
    setDragX(Math.max(0, Math.min(140, e.clientX - dragState.current.startX)))
  }
  function onPointerUp(){
    if (dragX > 80) scrollToForm()
    dragState.current.dragging = false
    setDragX(0)
  }

  async function handleSubmit(e){
    e.preventDefault()
    try{
      await axios.post('http://localhost:4000/api/leave/apply', { type, startDate, endDate, reason }, { headers: authHeaders() })
      setMessage('Leave applied successfully')
      setReason('')
      loadBalance()
    }catch(err){
      setMessage('Error applying leave')
    }
  }

  return (
    <div className="container page-shell">
      <div className="page-header card">
        <div>
          <span className="eyebrow dark">OOO &amp; Chill</span>
          <h2>Time off, your way</h2>
        </div>
        <div className="page-actions">
          <a href="/" className="nav-link">Dashboard</a>
          <a href="/approvals" className="nav-link">Approvals</a>
        </div>
      </div>

      <div className="chill-hero">
        <div
          className="swipe-card"
          style={{ transform: `translateX(${dragX}px)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onClick={scrollToForm}
          role="button"
          tabIndex={0}
        >
          <span className="swipe-eyebrow">🌴 Request chill time</span>
          <h2>Take a break, you've earned it</h2>
          <p>Swipe or tap to jump straight to the leave form below.</p>
          <span className="swipe-hint">Swipe to apply <span className="arrow">→</span></span>
        </div>

        <div className="card holo-card battery-card">
          <h3>🔋 Available balance</h3>
          <div className="battery-meter">
            <div className="battery-shell">
              <div className="battery-fill" style={{ width: `${availablePct}%` }} />
            </div>
            <div className="battery-nub" />
          </div>
          <div className="battery-caption">
            <span>Used: {used} day(s)</span>
            <b>{available} Days left</b>
          </div>
        </div>
      </div>

      <div className="content-grid two-col">
        <form className="card form-panel" ref={formRef} onSubmit={handleSubmit}>
          <div className="field-grid">
            <div className="field-block">
              <label className="field-label">Leave type</label>
              <select value={type} onChange={e=>setType(e.target.value)}>
                {leaveTypes.length > 0 ? leaveTypes.map(lt => (
                  <option key={lt.code} value={lt.code}>{lt.label}</option>
                )) : (
                  <>
                    <option value="CASUAL">Casual Leave</option>
                    <option value="PRIVILEGE">Privilege Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="MATERNITY">Maternity Leave</option>
                    <option value="PATERNITY">Paternity Leave</option>
                    <option value="OFFICIAL_TOUR">Official Tour</option>
                  </>
                )}
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
