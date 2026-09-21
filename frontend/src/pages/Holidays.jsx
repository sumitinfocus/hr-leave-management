import React, { useEffect, useState } from 'react'
import axios from 'axios'

function authHeaders(){
  const token = localStorage.getItem('token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export default function Holidays(){
  const [holidays, setHolidays] = useState([])
  const [form, setForm] = useState({ name:'', date:'', location:'', plant:'', year:new Date().getFullYear(), isPaid:true })
  useEffect(()=>{ fetchList() }, [])
  async function fetchList(){
    const res = await axios.get('http://localhost:4000/api/holiday', { headers: authHeaders() })
    setHolidays(res.data)
  }

  async function handleCreate(e){
    e.preventDefault()
    try{
      await axios.post('http://localhost:4000/api/holiday', form, { headers: authHeaders() })
      fetchList()
      setForm({ ...form, name:'', date:'', location:'', plant:'' })
    }catch(err){
      alert('error creating holiday')
    }
  }

  return (
    <div className="container page-shell">
      <div className="page-header card">
        <div>
          <span className="eyebrow dark">Holiday calendar</span>
          <h2>Company holidays</h2>
        </div>
        <div className="page-actions">
          <a href="/" className="nav-link">Dashboard</a>
          <a href="/apply" className="nav-link">Apply Leave</a>
        </div>
      </div>

      <div className="content-grid two-col">
        <form className="card form-panel" onSubmit={handleCreate}>
          <div className="field-grid two-up">
            <div className="field-block">
              <label className="field-label">Holiday name</label>
              <input placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
            </div>
            <div className="field-block">
              <label className="field-label">Date</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required />
            </div>
          </div>

          <div className="field-grid two-up">
            <div className="field-block">
              <label className="field-label">Location</label>
              <input placeholder="Location" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
            </div>
            <div className="field-block">
              <label className="field-label">Plant</label>
              <input placeholder="Plant" value={form.plant} onChange={e=>setForm(f=>({...f,plant:e.target.value}))} />
            </div>
          </div>

          <button type="submit" className="primary-btn">Create Holiday</button>
        </form>

        <div className="card visual-panel">
          <div className="panel-badge">Overview</div>
          <h3>Upcoming team breaks</h3>
          <div className="mini-illustration holiday-illustration" aria-label="Office celebrations" />
        </div>
      </div>

      <div className="table-card card">
        <div className="section-header">
          <h3>Holiday list</h3>
        </div>
        <table>
          <thead><tr><th>Name</th><th>Date</th><th>Location</th><th>Plant</th></tr></thead>
          <tbody>
            {holidays.length === 0 ? (
              <tr><td colSpan="4" className="empty-state">No holidays scheduled.</td></tr>
            ) : holidays.map(h=> (
              <tr key={h.id}><td>{h.name}</td><td>{new Date(h.date).toLocaleDateString()}</td><td>{h.location}</td><td>{h.plant}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
