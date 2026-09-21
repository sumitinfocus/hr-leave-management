import React, { useState } from 'react'
import axios from 'axios'

function authHeaders(){
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export default function Reports(){
  const [deptId, setDeptId] = useState('')
  const [summary, setSummary] = useState(null)

  async function fetchSummary(){
    const res = await axios.get(`http://localhost:4000/api/report/department/${deptId}/summary`, { headers: authHeaders() })
    setSummary(res.data)
  }

  async function downloadCsv(){
    const res = await axios.get(`http://localhost:4000/api/report/department/${deptId}`, { headers: authHeaders(), responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `department_${deptId}_report.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className="container">
      <h2>Reports</h2>
      <div className="card">
        <input placeholder="Department ID" value={deptId} onChange={e=>setDeptId(e.target.value)} />
        <button onClick={fetchSummary} disabled={!deptId}>Get Summary</button>
        <button onClick={downloadCsv} disabled={!deptId}>Download CSV</button>
      </div>
      {summary && (
        <div className="card">
          <h3>Summary</h3>
          <pre>{JSON.stringify(summary, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
