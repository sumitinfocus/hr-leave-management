import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:4000/api'

export default function Register(){
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [managerId, setManagerId] = useState('')
  const [departments, setDepartments] = useState([])
  const [managers, setManagers] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    axios.get(`${API}/employee/departments`).then(res => setDepartments(res.data)).catch(() => {})
    axios.get(`${API}/employee/managers`).then(res => setManagers(res.data)).catch(() => {})
  }, [])

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    try {
      await axios.post(`${API}/auth/register`, {
        firstName, lastName, email, password,
        departmentId: departmentId || undefined,
        managerId: managerId || undefined
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create your account')
    }
  }

  if (success) {
    return (
      <div className="container auth-container">
        <div className="auth-shell">
          <div className="auth-visual">
            <div className="brand-row">
              <span className="brand-mark">N</span>
              <span>Northstar Labs</span>
            </div>
            <div className="hero-copy">
              <span className="eyebrow">Welcome aboard</span>
              <h1>You're all set! 🎉</h1>
              <p>Your account has been created. Head to the login page to sign in and start your vibe check.</p>
            </div>
          </div>
          <div className="auth-form-area">
            <div className="card login-card">
              <div className="card-badge">Account created</div>
              <h2>Welcome to the team</h2>
              <p className="subtle-text">You can now log in with your new credentials.</p>
              <a href="/login" className="primary-btn" style={{ textAlign: 'center' }}>Go to login</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container auth-container">
      <div className="auth-shell">
        <div className="auth-visual">
          <div className="brand-row">
            <span className="brand-mark">N</span>
            <span>Northstar Labs</span>
          </div>

          <div className="hero-copy">
            <span className="eyebrow">Join the crew</span>
            <h1>Create your employee account.</h1>
            <p>Set up your profile in seconds and get instant access to leave, timesheets, and team updates.</p>
          </div>

          <div className="hero-image" aria-label="New team member onboarding" />

          <div className="feature-list">
            <div className="feature-item"><span>🚀</span> Instant onboarding</div>
            <div className="feature-item"><span>🔒</span> Secure by default</div>
            <div className="feature-item"><span>✨</span> Gen Z-approved UI</div>
          </div>
        </div>

        <div className="auth-form-area">
          <form className="card login-card" onSubmit={handleSubmit}>
            <div className="card-badge">Create account</div>
            <h2>Let's get you set up</h2>
            <p className="subtle-text">Fill in your details to request access.</p>

            <div className="field-grid two-up">
              <div className="field-block">
                <label className="field-label">First name</label>
                <input value={firstName} onChange={e=>setFirstName(e.target.value)} required />
              </div>
              <div className="field-block">
                <label className="field-label">Last name</label>
                <input value={lastName} onChange={e=>setLastName(e.target.value)} required />
              </div>
            </div>

            <label className="field-label">Work email</label>
            <input type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} required />

            <label className="field-label">Password</label>
            <input placeholder="At least 8 characters" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} />

            <label className="field-label">Department</label>
            <select value={departmentId} onChange={e=>setDepartmentId(e.target.value)} required>
              <option value="">Select a department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>

            <label className="field-label">Manager (optional)</label>
            <select value={managerId} onChange={e=>setManagerId(e.target.value)}>
              <option value="">No manager yet</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
            </select>

            <button type="submit" className="primary-btn">Create account</button>
            <a href="/login" className="secondary-btn" style={{ textAlign: 'center', display: 'block' }}>Back to login</a>
            {error && <div className="error">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  )
}
