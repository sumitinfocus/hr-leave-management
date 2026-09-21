import React, { useEffect, useState } from 'react'
import axios from 'axios'

function authHeaders(){
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export default function Dashboard(){
  const [applications, setApplications] = useState([])
  useEffect(()=>{ fetchMy() }, [])
  async function fetchMy(){
    const res = await axios.get('http://localhost:4000/api/leave/my', { headers: authHeaders() })
    setApplications(res.data)
  }

  return (
    <div className="container">
      <h2>My Leave Applications</h2>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <a href="/apply"><button>Apply Leave</button></a>
        <a href="/approvals"><button>Approvals</button></a>
      </div>
      <table>
        <thead><tr><th>Type</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
        <tbody>
          {applications.map(a=> (
            <tr key={a.id}><td>{a.type}</td><td>{new Date(a.startDate).toLocaleDateString()}</td><td>{new Date(a.endDate).toLocaleDateString()}</td><td>{a.status}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}