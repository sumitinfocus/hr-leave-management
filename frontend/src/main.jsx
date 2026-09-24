import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ApplyLeave from './pages/ApplyLeave'
import ManagerApprovals from './pages/ManagerApprovals'
import Holidays from './pages/Holidays'
import Reports from './pages/Reports'
import AppLayout from './components/AppLayout'
import './styles.css'

function Protected({ children }) {
  const token = localStorage.getItem('token')
  return token ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" />
}

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/apply" element={<Protected><ApplyLeave/></Protected>} />
        <Route path="/approvals" element={<Protected><ManagerApprovals/></Protected>} />
        <Route path="/holidays" element={<Protected><Holidays/></Protected>} />
        <Route path="/reports" element={<Protected><Reports/></Protected>} />
        <Route path="/" element={<Protected><Dashboard/></Protected>} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)