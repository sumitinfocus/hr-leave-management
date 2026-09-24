import React, { useState } from 'react'
import axios from 'axios'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e){
    e.preventDefault()
    try{
      const res = await axios.post('http://localhost:4000/api/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      window.location.href = '/'
    }catch(err){
      setError('Invalid credentials')
    }
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
            <span className="eyebrow">People-first operations</span>
            <h1>Modern leave management for growing teams.</h1>
            <p>Keep your team organised, informed, and productive with clear approvals and real-time team visibility.</p>
          </div>

          <div className="hero-image" aria-label="Software company office team" />

          <div className="feature-list">
            <div className="feature-item"><span>⚡</span> Fast approvals</div>
            <div className="feature-item"><span>📊</span> Clear reporting</div>
            <div className="feature-item"><span>🤝</span> Team harmony</div>
          </div>
        </div>

        <div className="auth-form-area">
          <form className="card login-card" onSubmit={handleSubmit}>
            <div className="card-badge">Secure login</div>
            <h2>Welcome back</h2>
            <p className="subtle-text">Sign in to your employee portal.</p>
            <label className="field-label">Work email</label>
            <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <label className="field-label">Password</label>
            <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="submit" className="primary-btn">Login</button>
            <button type="button" className="secondary-btn" onClick={() => window.location.href = '/register'}>Request access</button>
            {error && <div className="error">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  )
}