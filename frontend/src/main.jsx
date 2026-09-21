import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ApplyLeave from './pages/ApplyLeave'
import ManagerApprovals from './pages/ManagerApprovals'
import Holidays from './pages/Holidays'
import Reports from './pages/Reports'
import './styles.css'

function App(){
  const token = localStorage.getItem('token')
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/apply" element={token ? <ApplyLeave/> : <Navigate to="/login" />} />
        <Route path="/approvals" element={token ? <ManagerApprovals/> : <Navigate to="/login" />} />
        <Route path="/holidays" element={token ? <Holidays/> : <Navigate to="/login" />} />
        <Route path="/reports" element={token ? <Reports/> : <Navigate to="/login" />} />
        <Route path="/" element={token ? <Dashboard/> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)