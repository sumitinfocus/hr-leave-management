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
        <Route path="/register" element={<Register/>} />
        <Route path="/apply" element={<Protected><ApplyLeave/></Protected>} />
        <Route path="/approvals" element={<Protected><ManagerApprovals/></Protected>} />
        <Route path="/holidays" element={<Protected><Holidays/></Protected>} />
        <Route path="/reports" element={<Protected><Reports/></Protected>} />
        <Route path="/timesheets" element={<Protected><Timesheets/></Protected>} />
        <Route path="/timesheet-approvals" element={<Protected><TimesheetApprovals/></Protected>} />
        <Route path="/timesheets/:id/detail" element={<Protected><TimesheetDetail/></Protected>} />
        <Route path="/employees" element={<Protected><EmployeeMaster/></Protected>} />
        <Route path="/leave-types" element={<Protected><LeaveTypeMaster/></Protected>} />
        <Route path="/performance" element={<Protected><Performance/></Protected>} />
        <Route path="/performance-approvals" element={<Protected><PerformanceApprovals/></Protected>} />
        <Route path="/" element={<Protected><Dashboard/></Protected>} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)