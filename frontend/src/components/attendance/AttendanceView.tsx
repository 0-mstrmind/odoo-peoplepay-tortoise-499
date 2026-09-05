import React, { useState, useEffect } from 'react'
import {
  Clock,
  CheckCircle2,
  LogIn,
  LogOut,
  UserCheck,
  AlertTriangle,
  History,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react'
import { useAuthUser } from '@/store/auth.store'
import {
  useTodayAttendance,
  useAttendanceList,
  useCheckIn,
  useCheckOut,
} from '@/hooks/use-attendance'

interface AttendanceRecord {
  id: string
  date: string
  employeeName: string
  checkIn: string
  checkOut: string | null
  workedHours: number
  status: 'present' | 'late' | 'half_day' | 'absent' | 'on_leave' | 'holiday'
}

export const AttendanceView: React.FC = () => {
  const user = useAuthUser()
  const isEmployee = user?.role?.toLowerCase() === 'employee'

  // Backend Attendance Hooks
  const { data: todayAttendance } = useTodayAttendance()
  const { data: attendanceData, isLoading: isListLoading } = useAttendanceList({ limit: 50 })
  const checkInMutation = useCheckIn()
  const checkOutMutation = useCheckOut()

  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [hasCompletedToday, setHasCompletedToday] = useState(false)
  const [checkInTime, setCheckInTime] = useState('—')
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  // Sync state with backend todayAttendance
  useEffect(() => {
    if (todayAttendance) {
      if (todayAttendance.checkOut) {
        setIsCheckedIn(false)
        setHasCompletedToday(true)
      } else if (todayAttendance.checkIn) {
        setIsCheckedIn(true)
        setHasCompletedToday(false)
        const checkInDate = new Date(todayAttendance.checkIn)
        setCheckInTime(checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      }
    }
  }, [todayAttendance])

  const handleTogglePunch = async () => {
    if (hasCompletedToday) return

    try {
      if (!isCheckedIn) {
        const result = await checkInMutation.mutateAsync()
        setIsCheckedIn(true)
        const checkInDate = result.checkIn ? new Date(result.checkIn) : new Date()
        setCheckInTime(checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        setActionFeedback('Punched In successfully at ' + checkInDate.toLocaleTimeString())
      } else {
        await checkOutMutation.mutateAsync({ attendanceId: todayAttendance?.id })
        setIsCheckedIn(false)
        setHasCompletedToday(true)
        setActionFeedback('Punched Out successfully at ' + new Date().toLocaleTimeString() + '. Today\'s shift is completed.')
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Attendance request failed'
      setActionFeedback(`Error: ${errMsg}`)
    }
    setTimeout(() => setActionFeedback(null), 4000)
  }

  // Format list items from backend if available
  const displayRecords: AttendanceRecord[] = attendanceData?.items
    ? attendanceData.items.map((item) => {
        const dateObj = new Date(item.attendanceDate)
        const dateStr = dateObj.toISOString().split('T')[0]
        const isToday = dateStr === new Date().toISOString().split('T')[0]
        return {
          id: item.id,
          date: isToday ? `${dateStr} (Today)` : dateStr,
          employeeName: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : (user?.name || 'Employee'),
          checkIn: item.checkIn ? new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          checkOut: item.checkOut ? new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
          workedHours: item.workedHours ? Number(item.workedHours) : 0,
          status: item.status,
        }
      })
    : []

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

        {/* Quick Action Punch Button (Employee Only) */}
        {isEmployee && (
          <div className="flex items-center gap-3">
            {hasCompletedToday ? (
              <button
                type="button"
                disabled
                className="px-4 py-2.5 rounded-[6px] text-xs font-bold flex items-center gap-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-80"
                title="Shift completed for today. Re-punching in on the same day is prohibited."
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Punched Out for Today</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTogglePunch}
                disabled={checkInMutation.isPending || checkOutMutation.isPending}
                className={`px-4 py-2.5 rounded-[6px] text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                  isCheckedIn
                    ? 'bg-[#FF1744] hover:bg-[#D50000] text-white'
                    : 'bg-[#00C853] hover:bg-[#00B248] text-white'
                } ${checkInMutation.isPending || checkOutMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {checkInMutation.isPending || checkOutMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCheckedIn ? (
                  <LogOut className="w-4 h-4" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>
                  {checkInMutation.isPending || checkOutMutation.isPending
                    ? 'Processing...'
                    : isCheckedIn
                    ? 'Punch Out (Check-Out)'
                    : 'Punch In (Check-In)'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Notification Alert */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-[6px] text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
            actionFeedback.startsWith('Error:')
              ? 'bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.startsWith('Error:') ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            <span>{actionFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pp-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Status Today</p>
            <p className="text-sm font-extrabold text-[var(--color-text-heading)] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-[#00C853]' : hasCompletedToday ? 'bg-gray-400' : 'bg-[#FF1744]'}`} />
              <span>{isCheckedIn ? `In since ${checkInTime}` : hasCompletedToday ? 'Shift Completed Today' : 'Checked Out'}</span>
            </p>
          </div>
        </div>

        <div className="pp-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(0,200,83,0.12)] text-[#00C853] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Days Present (Sep)</p>
            <p className="text-lg font-extrabold text-[var(--color-text-heading)]">
              {displayRecords.filter((r) => r.status === 'present' || r.status === 'late').length} Days
            </p>
          </div>
        </div>

        <div className="pp-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(0,180,216,0.12)] text-[#00B4D8] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Total Hours (Sep)</p>
            <p className="text-lg font-extrabold text-[var(--color-text-heading)]">
              {displayRecords.reduce((acc, r) => acc + (r.workedHours || 0), 0).toFixed(1)} hrs
            </p>
          </div>
        </div>

        <div className="pp-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(255,170,0,0.12)] text-[#FFAA00] flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Late Arrivals</p>
            <p className="text-lg font-extrabold text-[var(--color-text-heading)]">
              {displayRecords.filter((r) => r.status === 'late').length} Day
            </p>
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
              {isListLoading ? (
                <tr>
                  <td colSpan={isEmployee ? 5 : 6} className="py-8 text-center text-[var(--color-text-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--color-primary)]" />
                    <span>Loading attendance records from database...</span>
                  </td>
                </tr>
              ) : displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={isEmployee ? 5 : 6} className="py-8 text-center text-[var(--color-text-muted)] italic">
                    No attendance logs found in database.
                  </td>
                </tr>
              ) : (
                displayRecords.map((r) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
