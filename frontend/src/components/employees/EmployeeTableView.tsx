import React from 'react'
import type { EmployeeItem } from './types'

interface EmployeeTableViewProps {
  employees: EmployeeItem[]
  onSelectEmployee?: (employee: EmployeeItem) => void
}

export const EmployeeTableView: React.FC<EmployeeTableViewProps> = ({
  employees,
  onSelectEmployee,
}) => {
  const getBadgeClass = (status: EmployeeItem['status']) => {
    switch (status) {
      case 'active':
        return 'pp-badge-success'
      case 'on_leave':
        return 'pp-badge-warning'
      case 'inactive':
      default:
        return 'pp-badge-danger'
    }
  }

  const getStatusLabel = (status: EmployeeItem['status']) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'on_leave':
        return 'On Leave'
      case 'inactive':
      default:
        return 'Inactive'
    }
  }

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[8px] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="pp-table">
          <thead>
            <tr>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Job Position</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-[var(--color-text-muted)]">
                  No employees found matching the criteria.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => onSelectEmployee?.(emp)}
                  className="cursor-pointer hover:bg-[var(--color-bg-muted)]/70 transition-colors"
                >
                  {/* Name + Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[6px] bg-[rgba(113,72,103,0.1)] border border-[rgba(113,72,103,0.2)] flex items-center justify-center font-bold text-xs text-[var(--color-primary)]">
                        {emp.avatarInitials}
                      </div>
                      <span className="font-semibold text-[var(--color-text-heading)]">
                        {emp.firstName} {emp.lastName}
                      </span>
                    </div>
                  </td>

                  {/* Code */}
                  <td className="py-3 px-4 font-mono text-xs text-[var(--color-text-muted)]">
                    {emp.employeeCode}
                  </td>

                  {/* Job Position */}
                  <td className="py-3 px-4 text-[var(--color-text-body)] font-medium">
                    {emp.jobPosition}
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4 text-[var(--color-text-body)]">
                    {emp.department}
                  </td>

                  {/* Email */}
                  <td className="py-3 px-4 text-[var(--color-text-muted)]">
                    {emp.email}
                  </td>

                  {/* Status pill badge */}
                  <td className="py-3 px-4 text-center">
                    <span className={`pp-badge ${getBadgeClass(emp.status)}`}>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          emp.status === 'active'
                            ? 'bg-[#00C853]'
                            : emp.status === 'on_leave'
                            ? 'bg-[#FFB300]'
                            : 'bg-[#FF1744]'
                        }`}
                      />
                      {getStatusLabel(emp.status)}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectEmployee?.(emp)
                      }}
                      className="text-xs font-medium text-[var(--color-primary)] hover:underline px-2 py-1 rounded-[4px] hover:bg-[rgba(113,72,103,0.08)]"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}