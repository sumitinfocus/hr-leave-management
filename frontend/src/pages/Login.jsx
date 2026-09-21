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
      window.location.href = '/'
    }catch(err){
      setError('Invalid credentials')
    }
  }

  return (
    <div className="container">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Login</button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  )
}