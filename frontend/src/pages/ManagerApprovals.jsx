import React, { useEffect, useState } from 'react'
import axios from 'axios'

function authHeaders(){
  const token = localStorage.getItem('token')
  if (!token) return {}
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
    <div className="container page-shell">
      <div className="page-header card">
        <div>
          <span className="eyebrow dark">Approvals</span>
          <h2>Pending requests</h2>
        </div>
        <div className="page-actions">
          <a href="/" className="nav-link">Dashboard</a>
          <a href="/apply" className="nav-link">Apply Leave</a>
        </div>
      </div>

      <div className="table-card card">
        <div className="section-header">
          <h3>Review team leave</h3>
        </div>
        {pending.length===0 ? (
          <div className="empty-panel">No pending requests</div>
        ) : (
          <table>
            <thead><tr><th>Employee</th><th>Type</th><th>Start</th><th>End</th><th>Actions</th></tr></thead>
            <tbody>
              {pending.map(p=> (
                <tr key={p.id}>
                  <td>{p.employeeId}</td>
                  <td>{p.type}</td>
                  <td>{new Date(p.startDate).toLocaleDateString()}</td>
                  <td>{new Date(p.endDate).toLocaleDateString()}</td>
                  <td className="action-cell">
                    <button className="approve-btn" onClick={()=>approve(p.id)}>Approve</button>
                    <button className="reject-btn" onClick={()=>reject(p.id)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
