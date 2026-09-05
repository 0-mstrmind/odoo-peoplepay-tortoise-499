import React, { useState } from 'react'
import {
  Clock,
  CheckCircle2,
  LogIn,
  LogOut,
  UserCheck,
  AlertTriangle,
  History,
} from 'lucide-react'
import { useAuthUser } from '@/store/auth.store'

interface AttendanceRecord {
  id: string
  date: string
  employeeName: string
  checkIn: string
  checkOut: string | null
  workedHours: number
  status: 'present' | 'late' | 'half_day' | 'absent'
}

const SAMPLE_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    date: '2026-09-05 (Today)',
    employeeName: 'Aarav Mehta',
    checkIn: '09:02 AM',
    checkOut: null,
    workedHours: 4.5,
    status: 'present',
  },
  {
    id: 'att-2',
    date: '2026-09-04',
    employeeName: 'Aarav Mehta',
    checkIn: '08:58 AM',
    checkOut: '06:05 PM',
    workedHours: 8.1,
    status: 'present',
  },
  {
    id: 'att-3',
    date: '2026-09-03',
    employeeName: 'Aarav Mehta',
    checkIn: '09:25 AM',
    checkOut: '06:10 PM',
    workedHours: 7.75,
    status: 'late',
  },
  {
    id: 'att-4',
    date: '2026-09-02',
    employeeName: 'Aarav Mehta',
    checkIn: '09:00 AM',
    checkOut: '01:30 PM',
    workedHours: 4.5,
    status: 'half_day',
  },
  {
    id: 'att-5',
    date: '2026-09-01',
    employeeName: 'Aarav Mehta',
    checkIn: '08:55 AM',
    checkOut: '06:02 PM',
    workedHours: 8.1,
    status: 'present',
  },
]

export const AttendanceView: React.FC = () => {
  const user = useAuthUser()
  const isEmployee = user?.role === 'employee'

  const [isCheckedIn, setIsCheckedIn] = useState(true)
  const [checkInTime, setCheckInTime] = useState('09:02 AM')
  const [records, setRecords] = useState<AttendanceRecord[]>(SAMPLE_ATTENDANCE)

  const handleTogglePunch = () => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (isCheckedIn) {
      setIsCheckedIn(false)
      setRecords((prev) =>
        prev.map((r, i) => (i === 0 ? { ...r, checkOut: timeStr, workedHours: 5.2 } : r))
      )
    } else {
      setIsCheckedIn(true)
      setCheckInTime(timeStr)
      const newRec: AttendanceRecord = {
        id: `att-${Date.now()}`,
        date: '2026-09-05 (Today)',
        employeeName: user?.name || 'System User',
        checkIn: timeStr,
        checkOut: null,
        workedHours: 0.1,
        status: 'present',
      }
      setRecords((prev) => [newRec, ...prev])
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-heading)] flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-[var(--color-primary)]" />
            <span>{isEmployee ? 'My Attendance & Punch Log' : 'Attendance & Time Tracking'}</span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Real-time check-in and check-out tracking for monthly payroll calculations.
          </p>
        </div>

        {/* Quick Action Punch Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePunch}
            className={`px-4 py-2.5 rounded-[6px] text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
              isCheckedIn
                ? 'bg-[#FF1744] hover:bg-[#D50000] text-white'
                : 'bg-[#00C853] hover:bg-[#00B248] text-white'
            }`}
          >
            {isCheckedIn ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{isCheckedIn ? 'Punch Out (Check-Out)' : 'Punch In (Check-In)'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pp-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Status Today</p>
            <p className="text-sm font-extrabold text-[var(--color-text-heading)] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-[#00C853]' : 'bg-[#FF1744]'}`} />
              <span>{isCheckedIn ? `In since ${checkInTime}` : 'Checked Out'}</span>
            </p>
          </div>
        </div>

        <div className="pp-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(0,200,83,0.12)] text-[#00C853] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Days Present (Sep)</p>
            <p className="text-lg font-extrabold text-[var(--color-text-heading)]">5 / 5</p>
          </div>
        </div>

        <div className="pp-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(0,180,216,0.12)] text-[#00B4D8] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Total Hours (Sep)</p>
            <p className="text-lg font-extrabold text-[var(--color-text-heading)]">36.5 hrs</p>
          </div>
        </div>

        <div className="pp-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(255,170,0,0.12)] text-[#FFAA00] flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Late Arrivals</p>
            <p className="text-lg font-extrabold text-[var(--color-text-heading)]">1 Day</p>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="pp-card border border-[var(--color-border)] shadow-xs rounded-[6px] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
              Attendance History & Time Logs
            </h3>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">Current Pay Period: September 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                <th className="py-2.5 px-4">Date</th>
                {!isEmployee && <th className="py-2.5 px-4">Employee</th>}
                <th className="py-2.5 px-4">Check-In</th>
                <th className="py-2.5 px-4">Check-Out</th>
                <th className="py-2.5 px-4">Worked Hours</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[var(--color-text-heading)]">{r.date}</td>
                  {!isEmployee && <td className="py-3 px-4 font-bold">{r.employeeName}</td>}
                  <td className="py-3 px-4 font-mono">{r.checkIn}</td>
                  <td className="py-3 px-4 font-mono text-[var(--color-text-muted)]">
                    {r.checkOut || <span className="text-[#00C853] font-bold">Active</span>}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold">{r.workedHours} hrs</td>
                  <td className="py-3 px-4">
                    <span
                      className={`pp-badge uppercase text-[10px] font-bold ${
                        r.status === 'present'
                          ? 'pp-badge-success'
                          : r.status === 'late'
                          ? 'pp-badge-warning'
                          : 'pp-badge-neutral'
                      }`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
