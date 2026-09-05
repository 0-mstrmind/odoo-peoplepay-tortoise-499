import { UserCheck, Clock } from 'lucide-react'
import type { TodayAttendancePresentItem } from '@/hooks/use-api'

interface TodayPresentTableProps {
  items: TodayAttendancePresentItem[]
  isLoading?: boolean
  onSelectEmployee?: (employeeId: string, name: string) => void
}

export const TodayPresentTable: React.FC<TodayPresentTableProps> = ({
  items,
  isLoading = false,
  onSelectEmployee,
}) => {
  const formatTime = (isoString: string | null) => {
    if (!isoString) return null
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoString
    }
  }

  if (isLoading) {
    return (
      <div className="pp-card p-12 text-center text-xs text-[var(--color-text-muted)] space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mx-auto" />
        <p>Loading present employees...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="pp-card p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[rgba(113,72,103,0.1)] text-[var(--color-primary)] flex items-center justify-center mx-auto">
          <UserCheck className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
          No Employees Checked In Yet Today
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
          No attendance check-ins have been recorded for the selected scope or department today.
        </p>
      </div>
    )
  }

  return (
    <div className="pp-card border border-[var(--color-border)] shadow-xs rounded-[6px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              <th className="py-2.5 px-4">Employee</th>
              <th className="py-2.5 px-4">Department & Job</th>
              <th className="py-2.5 px-4">Check-In</th>
              <th className="py-2.5 px-4">Check-Out</th>
              <th className="py-2.5 px-4">Hours Worked</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Allotted Manager</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
            {items.map((emp) => {
              const checkInFormatted = formatTime(emp.checkIn)
              const checkOutFormatted = formatTime(emp.checkOut)

              return (
                <tr
                  key={emp.attendanceId || emp.employeeId}
                  className="hover:bg-[var(--color-bg-muted)]/50 transition-colors"
                >
                  {/* Employee Name & Code */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center shadow-2xs shrink-0">
                        {emp.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <button
                          type="button"
                          onClick={() => onSelectEmployee?.(emp.employeeId, emp.employeeName)}
                          className="font-bold text-[var(--color-text-heading)] hover:text-[var(--color-primary)] text-left truncate transition-colors cursor-pointer"
                        >
                          {emp.employeeName}
                        </button>
                        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                          {emp.employeeCode}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Department & Job Position */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-[var(--color-text-heading)]">
                        {emp.department}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {emp.jobPosition}
                      </span>
                    </div>
                  </td>

                  {/* Check-In */}
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-[var(--color-text-heading)] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#00C853]" />
                      <span>{checkInFormatted || '--:--'}</span>
                    </span>
                  </td>

                  {/* Check-Out */}
                  <td className="py-3 px-4">
                    {checkOutFormatted ? (
                      <span className="font-mono font-semibold text-[var(--color-text-heading)] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#FF1744]" />
                        <span>{checkOutFormatted}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(0,200,83,0.1)] text-[#00C853]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] animate-pulse" />
                        <span>Active Now</span>
                      </span>
                    )}
                  </td>

                  {/* Hours Worked & Overtime */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-[var(--color-text-heading)]">
                        {emp.workedHours} hrs
                      </span>
                      {emp.overtimeHours > 0 && (
                        <span className="text-[10px] font-semibold text-[#FFAA00]">
                          +{emp.overtimeHours} OT
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    <span
                      className={`pp-badge uppercase text-[10px] font-bold ${
                        emp.status === 'present'
                          ? 'pp-badge-success'
                          : emp.status === 'late'
                          ? 'pp-badge-warning'
                          : 'pp-badge-neutral'
                      }`}
                    >
                      {emp.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Allotted Manager */}
                  <td className="py-3 px-4 text-[var(--color-text-muted)]">
                    {emp.managerName || (
                      <span className="italic text-[10px] text-[var(--color-text-muted)]/70">
                        Direct HR Allotment
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
