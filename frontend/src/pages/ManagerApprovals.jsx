import React, { useEffect, useState } from 'react'
import axios from 'axios'

function authHeaders(){
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export default function ManagerApprovals(){
  const [pending, setPending] = useState([])
  useEffect(()=>{ fetchPending() }, [])
  async function fetchPending(){
    const res = await axios.get('http://localhost:4000/api/leave/pending', { headers: authHeaders() })
    setPending(res.data)
  }

  async function approve(id){
    await axios.post(`http://localhost:4000/api/leave/${id}/approve`, {}, { headers: authHeaders() })
    fetchPending()
  }

  async function reject(id){
    await axios.post(`http://localhost:4000/api/leave/${id}/reject`, {}, { headers: authHeaders() })
    fetchPending()
  }

  return (
    <div className="container">
      <h2>Pending Approvals</h2>
      {pending.length===0 && <div>No pending requests</div>}
      <table>
        <thead><tr><th>Employee</th><th>Type</th><th>Start</th><th>End</th><th>Actions</th></tr></thead>
        <tbody>
          {pending.map(p=> (
            <tr key={p.id}><td>{p.employeeId}</td><td>{p.type}</td><td>{new Date(p.startDate).toLocaleDateString()}</td><td>{new Date(p.endDate).toLocaleDateString()}</td><td><button onClick={()=>approve(p.id)}>Approve</button><button onClick={()=>reject(p.id)}>Reject</button></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}