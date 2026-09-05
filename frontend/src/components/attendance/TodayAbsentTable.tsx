import { Plus, CheckCircle2 } from 'lucide-react'
import type { TodayAttendanceAbsentItem } from '@/hooks/use-api'

interface TodayAbsentTableProps {
  items: TodayAttendanceAbsentItem[]
  isLoading?: boolean
  onLogAttendance?: (employeeId: string, employeeName: string) => void
}

export const TodayAbsentTable: React.FC<TodayAbsentTableProps> = ({
  items,
  isLoading = false,
  onLogAttendance,
}) => {
  if (isLoading) {
    return (
      <div className="pp-card p-12 text-center text-xs text-[var(--color-text-muted)] space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mx-auto" />
        <p>Checking attendance status...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="pp-card p-12 text-center space-y-3 bg-[rgba(0,200,83,0.03)] border border-[#00C853]/20">
        <div className="w-12 h-12 rounded-full bg-[rgba(0,200,83,0.12)] text-[#00C853] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
          100% Attendance! No Absent Employees
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
          Every active employee in this scope has successfully recorded their attendance today.
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
              <th className="py-2.5 px-4">Absent Employee</th>
              <th className="py-2.5 px-4">Department & Job</th>
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4">Attendance Status</th>
              <th className="py-2.5 px-4">Allotted Manager</th>
              <th className="py-2.5 px-4 text-right">HR Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
            {items.map((emp) => {
              const isOnLeave = emp.status === 'on_leave'

              return (
                <tr
                  key={emp.employeeId}
                  className="hover:bg-[var(--color-bg-muted)]/50 transition-colors"
                >
                  {/* Employee Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[rgba(255,23,68,0.12)] text-[#FF1744] text-xs font-bold flex items-center justify-center shadow-2xs shrink-0">
                        {emp.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[var(--color-text-heading)] truncate">
                          {emp.employeeName}
                        </span>
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

                  {/* Email */}
                  <td className="py-3 px-4 text-[var(--color-text-muted)] font-mono text-[11px]">
                    {emp.email}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    <span
                      className={`pp-badge uppercase text-[10px] font-bold ${
                        isOnLeave
                          ? 'pp-badge-warning'
                          : 'pp-badge-danger'
                      }`}
                    >
                      {isOnLeave ? 'On Approved Leave' : 'Not Checked In'}
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

                  {/* HR Action: Quick Log Attendance */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onLogAttendance?.(emp.employeeId, emp.employeeName)}
                      className="pp-btn-secondary text-[11px] py-1.5 px-2.5 rounded-[4px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      title={`Log manual attendance for ${emp.employeeName}`}
                    >
                      <Plus className="w-3 h-3 text-[var(--color-primary)]" />
                      <span>Log Attendance</span>
                    </button>
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
