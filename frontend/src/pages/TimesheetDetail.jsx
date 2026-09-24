import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:4000/api/timesheets'
function headers() { return { Authorization: `Bearer ${localStorage.getItem('token')}` } }
function dateKey(value) {
  const date = new Date(value)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}
function formatDate(value) { return new Date(value).toLocaleDateString() }
function isWeekend(value) {
  const day = new Date(value).getUTCDay()
  return day === 0 || day === 6
}
function hoursFor(entry) {
  if (!entry?.timeIn || !entry?.timeOut) return 0
  const value = (new Date(entry.timeOut).getTime() - new Date(entry.timeIn).getTime()) / 3600000
  return value > 0 ? value : 0
}
function timeLabel(value) {
  return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'
}
function daysBetween(start, end) {
  const days = []
  const cursor = new Date(start)
  const last = new Date(end)
  cursor.setUTCHours(0, 0, 0, 0)
  last.setUTCHours(0, 0, 0, 0)
  while (cursor <= last) {
    days.push(new Date(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

export default function TimesheetDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selectedKey, setSelectedKey] = useState(null)
  const timesheet = data?.timesheet

  useEffect(() => {
    axios.get(`${API}/${id}/detail`, { headers: headers() })
      .then(response => setData(response.data))
      .catch(err => setError(err.response?.data?.error || 'Unable to load timesheet detail'))
  }, [id])

  const rows = useMemo(() => {
    if (!data) return []
    const entryMap = new Map(data.timesheet.entries.map(entry => [dateKey(entry.workDate), entry]))
    const holidayMap = new Map(data.holidays.map(holiday => [dateKey(holiday.date), holiday]))
    const entryDates = data.timesheet.entries.map(entry => new Date(entry.workDate).getTime()).filter(Number.isFinite)
    const rangeStart = entryDates.length ? new Date(Math.min(new Date(data.timesheet.periodStart).getTime(), ...entryDates)) : new Date(data.timesheet.periodStart)
    const rangeEnd = entryDates.length ? new Date(Math.max(new Date(data.timesheet.periodEnd).getTime(), ...entryDates)) : new Date(data.timesheet.periodEnd)
    return daysBetween(rangeStart, rangeEnd).map(date => {
      const key = dateKey(date)
      const entry = entryMap.get(key)
      const leave = data.leaveApplications.find(item => date >= new Date(item.startDate) && date <= new Date(item.endDate))
      const holiday = holidayMap.get(key)
      let kind = 'work'
      if (holiday) kind = 'holiday'
      else if (leave) kind = 'leave'
      else if (entry?.activities && /work\s*from\s*home|\bwfh\b/i.test(entry.activities)) kind = 'wfh'
      else if (isWeekend(date)) kind = 'weekend'
      return { date, entry, leave, holiday, kind }
    })
  }, [data])

  useEffect(() => {
    if (!selectedKey && rows[0]) setSelectedKey(dateKey(rows[0].date))
  }, [rows, selectedKey])

  const selected = rows.find(row => dateKey(row.date) === selectedKey) || rows[0]
  const totalHours = rows.reduce((sum, row) => sum + hoursFor(row.entry), 0)
  const activityDays = rows.filter(row => row.entry?.activities).length
  const leaveDays = rows.filter(row => row.kind === 'leave').length
  const calendarCells = useMemo(() => {
    if (!rows.length) return []
    const firstDay = rows[0].date.getUTCDay()
    return [...Array(firstDay).fill(null), ...rows]
  }, [rows])
  const displayStart = rows[0]?.date || (timesheet ? new Date(timesheet.periodStart) : new Date())
  const displayEnd = rows[rows.length - 1]?.date || (timesheet ? new Date(timesheet.periodEnd) : new Date())

  if (error) return <div className="container page-shell"><div className="error">{error}</div></div>
  if (!data) return <div className="container page-shell"><div className="card empty-panel">Loading timesheet detail...</div></div>

  return (
    <div className="container page-shell">
      <div className="page-header card">
        <div>
          <span className="eyebrow dark">Timesheet detail</span>
          <h2>{formatDate(displayStart)} - {formatDate(displayEnd)}</h2>
          <p className="subtle-text">{timesheet.staffName || `${timesheet.employee.firstName} ${timesheet.employee.lastName}`} · {timesheet.status}</p>
        </div>
        <div className="page-actions"><a href="/timesheets" className="nav-link">My timesheets</a><a href="/timesheet-approvals" className="nav-link">Approvals</a></div>
      </div>

      <div className="card detail-legend">
        <strong>Day legend</strong>
        <span className="legend-item work">Work / activity</span>
        <span className="legend-item wfh">Work from home</span>
        <span className="legend-item leave">On leave</span>
        <span className="legend-item weekend">Weekend</span>
        <span className="legend-item holiday">Holiday / public holiday</span>
      </div>

      <div className="timesheet-kpis">
        <div className="card timesheet-kpi"><span>Total logged</span><strong>{totalHours.toFixed(1)}h</strong><small>Recorded time</small></div>
        <div className="card timesheet-kpi"><span>Activity days</span><strong>{activityDays}</strong><small>Days with worklog</small></div>
        <div className="card timesheet-kpi"><span>Leave days</span><strong>{leaveDays}</strong><small>Approved leave</small></div>
        <div className="card timesheet-kpi"><span>Period days</span><strong>{rows.length}</strong><small>{timesheet.periodType} period</small></div>
      </div>

      <div className="timesheet-dashboard-grid">
        <div className="card worklog-heatmap">
          <div className="section-header">
            <div><span className="panel-badge">Worklog overview</span><h3>{displayStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3></div>
            <span className="subtle-text">Select a day</span>
          </div>
          <div className="calendar-weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {calendarCells.map((row, index) => row ? (
              <button type="button" className={`calendar-cell ${row.kind} ${dateKey(row.date) === dateKey(selected?.date) ? 'selected' : ''}`} key={dateKey(row.date)} onClick={() => setSelectedKey(dateKey(row.date))}>
                <strong>{row.date.getUTCDate()}</strong>
                <small>{row.kind === 'wfh' ? 'WFH' : hoursFor(row.entry) > 0 ? `${hoursFor(row.entry).toFixed(1)}h` : row.kind === 'leave' ? 'Leave' : row.kind === 'holiday' ? 'Holiday' : row.kind === 'weekend' ? 'Weekend' : row.entry?.activities ? 'Activity' : 'No log'}</small>
                <span className="calendar-clock">In {timeLabel(row.entry?.timeIn)} / Out {timeLabel(row.entry?.timeOut)}</span>
                <span className="calendar-activity">{row.entry?.activities || row.leave?.reason || row.holiday?.name || ''}</span>
              </button>
            ) : <span className="calendar-cell empty" key={`empty-${index}`} />)}
          </div>
          <div className="heat-scale"><span>Less</span><i className="heat-0" /><i className="heat-1" /><i className="heat-2" /><i className="heat-3" /><span>More activity</span></div>
        </div>

        <div className="card selected-worklog">
          <div className="section-header"><div><span className="panel-badge">Selected day</span><h3>{selected ? selected.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'No day selected'}</h3></div></div>
          {selected && <div className={`selected-status ${selected.kind}`}><strong>{selected.holiday?.name || selected.leave?.type?.replaceAll('_', ' ') || (selected.kind === 'wfh' ? 'Work from home' : selected.kind === 'weekend' ? 'Weekend' : 'Work')}</strong><span>{selected.entry?.activities || selected.leave?.reason || selected.holiday?.name || (selected.kind === 'weekend' ? 'Non-working day' : 'No activity recorded')}</span></div>}
          <div className="worklog-meta"><span>Time logged</span><strong>{selected && hoursFor(selected.entry) ? `${hoursFor(selected.entry).toFixed(1)} hours` : 'Not recorded'}</strong></div>
          <div className="worklog-meta"><span>Timesheet status</span><strong>{timesheet.status}</strong></div>
        </div>
      </div>

    </div>
  )
}
