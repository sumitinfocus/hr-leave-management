import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const menuItems = [
  { label: 'Dashboard', path: '/', icon: '⌂' },
  { label: 'Apply Leave', path: '/apply', icon: '＋' },
  { label: 'Approvals', path: '/approvals', icon: '✓' },
  { label: 'Holidays', path: '/holidays', icon: '▣' },
  { label: 'Reports', path: '/reports', icon: '▥' },
  { label: 'Timesheets', path: '/timesheets', icon: '⏱' },
  { label: 'Timesheet Approvals', path: '/timesheet-approvals', icon: '☑' },
  { label: 'Performance', path: '/performance', icon: '★' },
  { label: 'Performance Approvals', path: '/performance-approvals', icon: '⚑' },
  { label: 'Employee Master', path: '/employees', icon: '☺' },
  { label: 'Leave Type Master', path: '/leave-types', icon: '☰' }
]

export default function AppLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <button
        type="button"
        className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`}
        aria-label="Close navigation"
        onClick={() => setIsOpen(false)}
      />
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">N</span>
          <div>
            <strong>Northstar Labs</strong>
            <small>People operations</small>
          </div>
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="avatar-pill">AL</span>
            <div>
              <strong>Alice Lewis</strong>
              <small>Employee</small>
            </div>
          </div>
          <button type="button" className="sidebar-logout" onClick={logout}>
            <span>↪</span> Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <button
          type="button"
          className="mobile-menu-btn"
          aria-label="Open navigation"
          onClick={() => setIsOpen(true)}
        >
          ☰
        </button>
        {children}
      </main>
    </div>
  )
}
