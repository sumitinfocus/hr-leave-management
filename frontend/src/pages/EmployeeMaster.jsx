import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:4000/api/employee'
function authHeaders(){
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const emptyForm = { firstName: '', lastName: '', email: '', password: '', departmentId: '', role: 'EMPLOYEE', managerId: '', plant: '', location: '' }

export default function EmployeeMaster(){
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [managers, setManagers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll(){
    try {
      const [empRes, deptRes, mgrRes] = await Promise.all([
        axios.get(API, { headers: authHeaders() }),
        axios.get(`${API}/departments`),
        axios.get(`${API}/managers`)
      ])
      setEmployees(empRes.data)
      setDepartments(deptRes.data)
      setManagers(mgrRes.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load employees')
    }
  }

  function startEdit(emp){
    setEditingId(emp.id)
    setForm({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email, password: '',
      departmentId: emp.departmentId, role: emp.role, managerId: emp.managerId || '',
      plant: emp.plant || '', location: emp.location || ''
    })
    setMessage(''); setError('')
  }

  function cancelEdit(){
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e){
    e.preventDefault()
    setMessage(''); setError('')
    try {
      if (editingId) {
        await axios.put(`${API}/${editingId}`, form, { headers: authHeaders() })
        setMessage('Employee updated')
      } else {
        await axios.post(API, form, { headers: authHeaders() })
        setMessage('Employee created')
      }
      cancelEdit()
      loadAll()
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save employee')
    }
  }

  async function toggleActive(emp){
    try {
      if (emp.active) {
        await axios.delete(`${API}/${emp.id}`, { headers: authHeaders() })
      } else {
        await axios.put(`${API}/${emp.id}`, { active: true }, { headers: authHeaders() })
      }
      loadAll()
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update employee status')
    }
  }

  return (
    <div className="container page-shell">
      <div className="page-header card">
        <div><span className="eyebrow dark">Admin</span><h2>Employee Master</h2></div>
        <div className="page-actions"><a href="/" className="nav-link">Dashboard</a><a href="/leave-types" className="nav-link">Leave Types</a></div>
      </div>

      <div className="content-grid two-col">
        <form className="card form-panel" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit employee' : 'Add employee'}</h3>
          <div className="field-grid two-up">
            <div className="field-block">
              <label className="field-label">First name</label>
              <input value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} required />
            </div>
            <div className="field-block">
              <label className="field-label">Last name</label>
              <input value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} required />
            </div>
          </div>

          <label className="field-label">Work email</label>
          <input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required disabled={!!editingId} />

          {!editingId && (
            <>
              <label className="field-label">Temporary password</label>
              <input type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required minLength={8} />
            </>
          )}

          <div className="field-grid two-up">
            <div className="field-block">
              <label className="field-label">Department</label>
              <select value={form.departmentId} onChange={e=>setForm({...form, departmentId: e.target.value})} required>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Role</label>
              <select value={form.role} onChange={e=>setForm({...form, role: e.target.value})}>
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="HR_ADMIN">HR Admin</option>
              </select>
            </div>
          </div>

          <label className="field-label">Manager (optional)</label>
          <select value={form.managerId} onChange={e=>setForm({...form, managerId: e.target.value})}>
            <option value="">No manager</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
          </select>

          <div className="field-grid two-up">
            <div className="field-block">
              <label className="field-label">Plant</label>
              <input value={form.plant} onChange={e=>setForm({...form, plant: e.target.value})} />
            </div>
            <div className="field-block">
              <label className="field-label">Location</label>
              <input value={form.location} onChange={e=>setForm({...form, location: e.target.value})} />
            </div>
          </div>

          <div className="button-row">
            <button type="submit" className="primary-btn">{editingId ? 'Save changes' : 'Create employee'}</button>
            {editingId && <button type="button" className="secondary-btn" onClick={cancelEdit}>Cancel</button>}
          </div>
          {message && <div className="message-box success">{message}</div>}
          {error && <div className="error">{error}</div>}
        </form>

        <div className="card visual-panel">
          <div className="panel-badge">HR toolkit</div>
          <h3>Managing your workforce</h3>
          <ul className="info-list">
            <li>New employees get a temporary password and must change it on first login.</li>
            <li>Deactivating an employee blocks login but keeps their leave/timesheet history intact.</li>
            <li>Assign a manager to route their approvals correctly.</li>
          </ul>
          <div className="mini-illustration" aria-label="HR managing employee records" />
        </div>
      </div>

      <div className="table-card card">
        <div className="section-header"><h3>All employees</h3></div>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Manager</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {employees.length === 0 ? <tr><td colSpan="7" className="empty-state">No employees yet.</td></tr> : employees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.firstName} {emp.lastName}</td>
                <td>{emp.email}</td>
                <td>{emp.department?.name || '-'}</td>
                <td>{emp.role}</td>
                <td>{emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '-'}</td>
                <td><span className={`status-pill ${emp.active ? 'approved' : 'rejected'}`}>{emp.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td>
                  <button className="secondary-btn inline-btn" onClick={() => startEdit(emp)}>Edit</button>
                  <button className={emp.active ? 'reject-btn' : 'approve-btn'} onClick={() => toggleActive(emp)}>{emp.active ? 'Deactivate' : 'Reactivate'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
