import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ApplyLeave from './pages/ApplyLeave'
import ManagerApprovals from './pages/ManagerApprovals'
import Holidays from './pages/Holidays'
import Reports from './pages/Reports'
import Timesheets from './pages/Timesheets'
import TimesheetApprovals from './pages/TimesheetApprovals'
import TimesheetDetail from './pages/TimesheetDetail'
import EmployeeMaster from './pages/EmployeeMaster'
import LeaveTypeMaster from './pages/LeaveTypeMaster'
import Performance from './pages/Performance'
import PerformanceApprovals from './pages/PerformanceApprovals'
import './styles.css'

function App(){
  const token = localStorage.getItem('token')
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/apply" element={token ? <ApplyLeave/> : <Navigate to="/login" />} />
        <Route path="/approvals" element={token ? <ManagerApprovals/> : <Navigate to="/login" />} />
        <Route path="/holidays" element={token ? <Holidays/> : <Navigate to="/login" />} />
        <Route path="/reports" element={token ? <Reports/> : <Navigate to="/login" />} />
        <Route path="/timesheets" element={token ? <Timesheets/> : <Navigate to="/login" />} />
        <Route path="/timesheet-approvals" element={token ? <TimesheetApprovals/> : <Navigate to="/login" />} />
        <Route path="/timesheets/:id/detail" element={token ? <TimesheetDetail/> : <Navigate to="/login" />} />
        <Route path="/employees" element={token ? <EmployeeMaster/> : <Navigate to="/login" />} />
        <Route path="/leave-types" element={token ? <LeaveTypeMaster/> : <Navigate to="/login" />} />
        <Route path="/performance" element={token ? <Performance/> : <Navigate to="/login" />} />
        <Route path="/performance-approvals" element={token ? <PerformanceApprovals/> : <Navigate to="/login" />} />
        <Route path="/" element={token ? <Dashboard/> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)