import React, { useState } from 'react'
import axios from 'axios'

function authHeaders(){
  const token = localStorage.getItem('token')
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
    <div className="container">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Apply Leave</h2>
        <label>Type</label>
        <select value={type} onChange={e=>setType(e.target.value)}>
          <option value="CASUAL">Casual Leave</option>
          <option value="PRIVILEGE">Privilege Leave</option>
          <option value="SICK">Sick Leave</option>
          <option value="MATERNITY">Maternity Leave</option>
          <option value="PATERNITY">Paternity Leave</option>
          <option value="OFFICIAL_TOUR">Official Tour</option>
        </select>
        <label>Start Date</label>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} required />
        <label>End Date</label>
        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} required />
        <label>Reason</label>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} />
        <button type="submit">Apply</button>
        {message && <div className="error">{message}</div>}
      </form>
    </div>
  )
}