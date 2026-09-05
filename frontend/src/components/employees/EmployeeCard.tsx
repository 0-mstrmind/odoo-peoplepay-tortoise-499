import React from 'react'
import type { EmployeeItem } from './types'

interface EmployeeCardProps {
  employee: EmployeeItem
  onClick?: (employee: EmployeeItem) => void
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onClick }) => {
  const getStatusBadge = () => {
    switch (employee.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00C853]">
            <span className="w-2 h-2 rounded-full bg-[#00C853] inline-block animate-pulse" />
            Active
          </span>
        )
      case 'on_leave':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFB300]">
            <span className="w-2 h-2 rounded-full bg-[#FFB300] inline-block" />
            On Leave
          </span>
        )
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF1744]">
            <span className="w-2 h-2 rounded-full bg-[#FF1744] inline-block" />
            Inactive
          </span>
        )
    }
  }

  return (
    <div
      onClick={() => onClick?.(employee)}
      className="group relative bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-base)] border border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-[8px] p-5 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
    >
      {/* Top section: Avatar + Name + Job Title */}
      <div className="flex items-start gap-4">
        {/* Wireframe styled squircle avatar box */}
        <div className="w-13 h-13 min-w-[52px] rounded-[10px] bg-[rgba(113,72,103,0.08)] group-hover:bg-[rgba(113,72,103,0.14)] border border-[rgba(113,72,103,0.25)] flex items-center justify-center transition-colors">
          <span className="font-bold text-[15px] tracking-wide text-[var(--color-primary)]">
            {employee.avatarInitials}
          </span>
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] font-bold text-[var(--color-text-heading)] leading-snug truncate group-hover:text-[var(--color-primary)] transition-colors mb-0.5">
            {employee.firstName} {employee.lastName}
          </h3>
          <p className="text-[13.5px] text-[var(--color-text-muted)] truncate font-normal">
            {employee.jobPosition || 'Employee'}
          </p>
        </div>
      </div>

      {/* Bottom section: Department & Status (Wireframe exact match: Department stacked above • Active) */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)]/60 flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13.5px] font-medium text-[var(--color-text-body)]">
            {employee.department || 'General'}
          </span>
          <div className="mt-0.5">{getStatusBadge()}</div>
        </div>

        {/* Subtle quick view link on hover */}
        <span className="text-xs font-semibold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
          View details &rarr;
        </span>
      </div>
    </div>
  )
}