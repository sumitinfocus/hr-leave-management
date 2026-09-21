import React, { useEffect, useState } from 'react'
import axios from 'axios'

function authHeaders(){
  const token = localStorage.getItem('token')
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
    }catch(err){
      alert('error creating holiday')
    }
  }

  return (
    <div className="container">
      <h2>Holiday Calendar</h2>
      <form className="card" onSubmit={handleCreate}>
        <input placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
        <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required />
        <input placeholder="Location" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
        <input placeholder="Plant" value={form.plant} onChange={e=>setForm(f=>({...f,plant:e.target.value}))} />
        <button type="submit">Create Holiday</button>
      </form>

      <table>
        <thead><tr><th>Name</th><th>Date</th><th>Location</th><th>Plant</th></tr></thead>
        <tbody>
          {holidays.map(h=> (
            <tr key={h.id}><td>{h.name}</td><td>{new Date(h.date).toLocaleDateString()}</td><td>{h.location}</td><td>{h.plant}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}