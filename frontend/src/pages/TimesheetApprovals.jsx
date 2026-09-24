import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:4000/api/timesheets'
function headers() { return { Authorization: `Bearer ${localStorage.getItem('token')}` } }

export default function TimesheetApprovals() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ year: '', month: '', status: 'SUBMITTED', employee: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  async function load() {
    try {
      const params = { ...filters, page, pageSize: 25 }
      Object.keys(params).forEach(key => { if (!params[key]) delete params[key] })
      const response = await axios.get(`${API}/pending`, { headers: headers(), params })
      setItems(response.data.items)
      setTotalPages(response.data.totalPages)
    }
    catch (err) { setError(err.response?.data?.error || 'Unable to load pending timesheets') }
  }
  useEffect(() => { load() }, [filters, page])
  async function approve(id) { await axios.post(`${API}/${id}/approve`, {}, { headers: headers() }); await load() }
  async function reject(id) {
    const reason = window.prompt('Correction reason', 'Please correct the timesheet and resubmit.')
    if (reason === null) return
    await axios.post(`${API}/${id}/reject`, { reason }, { headers: headers() }); await load()
  }
  return (
    <div className="container page-shell">
      <div className="page-header card">
        <div><span className="eyebrow dark">Timesheet approvals</span><h2>Pending submissions</h2></div>
        <div className="page-actions"><a href="/" className="nav-link">Dashboard</a><a href="/timesheets" className="nav-link">My timesheets</a></div>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="card timesheet-filters">
        <input placeholder="Year (e.g. 2026)" value={filters.year} onChange={e => { setPage(1); setFilters({ ...filters, year: e.target.value }) }} />
        <select value={filters.month} onChange={e => { setPage(1); setFilters({ ...filters, month: e.target.value }) }}><option value="">All months</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2020, index, 1).toLocaleString(undefined, { month: 'long' })}</option>)}</select>
        <select value={filters.status} onChange={e => { setPage(1); setFilters({ ...filters, status: e.target.value }) }}><option value="SUBMITTED">Submitted</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="DRAFT">Draft</option><option value="ALL">All statuses</option></select>
        <input placeholder="Employee name or email" value={filters.employee} onChange={e => { setPage(1); setFilters({ ...filters, employee: e.target.value }) }} />
      </div>
      <div className="table-card card">
        <table>
          <thead><tr><th>Employee</th><th>Email</th><th>Period</th><th>Days</th><th>Entries</th><th>Actions</th></tr></thead>
          <tbody>{items.length === 0 ? <tr><td colSpan="6" className="empty-state">No timesheets match these filters.</td></tr> : items.map(item => (
            <tr key={item.id}>
              <td>{[item.employee?.firstName, item.employee?.lastName].filter(Boolean).join(' ')}</td>
              <td>{item.employee?.email}</td>
              <td>{new Date(item.periodStart).toLocaleDateString()} - {new Date(item.periodEnd).toLocaleDateString()}</td>
              <td>{item.daysWorked ?? '-'}</td><td>{item._count?.entries || 0}</td>
              <td className="action-cell"><a className="secondary-btn inline-btn" href={`/timesheets/${item.id}/detail`}>Details</a><button className="approve-btn" onClick={() => approve(item.id)}>Approve</button><button className="reject-btn" onClick={() => reject(item.id)}>Reject</button></td>
            </tr>
          ))}</tbody>
        </table>
        <div className="pagination">
          <button className="secondary-btn inline-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="secondary-btn inline-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  )
}
