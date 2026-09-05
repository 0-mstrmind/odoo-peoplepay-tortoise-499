import React from 'react'
import { X, Mail, Phone, MapPin, Calendar, Building2, Briefcase, ShieldCheck } from 'lucide-react'
import type { EmployeeItem } from './types'

interface EmployeeDetailDrawerProps {
  employee: EmployeeItem | null
  onClose: () => void
}

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
  employee,
  onClose,
}) => {
  if (!employee) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md h-full bg-[var(--color-bg-base)] border-l border-[var(--color-border)] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Employee Details
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[4px] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Hero */}
          <div className="mt-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-[12px] bg-[rgba(113,72,103,0.12)] border border-[rgba(113,72,103,0.3)] flex items-center justify-center font-bold text-xl text-[var(--color-primary)]">
              {employee.avatarInitials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text-heading)] mb-0.5 leading-tight">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] font-medium">
                {employee.jobPosition}
              </p>
              <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[rgba(0,200,83,0.12)] text-[#00C853]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C853]" />
                {employee.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Detail List */}
          <div className="mt-8 space-y-4 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-[6px] bg-[var(--color-bg-surface)] border border-[var(--color-border)]/70">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Employee Code</p>
                <p className="font-semibold text-[var(--color-text-heading)]">{employee.employeeCode}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-[6px] bg-[var(--color-bg-surface)] border border-[var(--color-border)]/70">
              <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Department</p>
                <p className="font-semibold text-[var(--color-text-heading)]">{employee.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-[6px] bg-[var(--color-bg-surface)] border border-[var(--color-border)]/70">
              <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Role Title</p>
                <p className="font-semibold text-[var(--color-text-heading)]">{employee.jobPosition}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-[6px] bg-[var(--color-bg-surface)] border border-[var(--color-border)]/70">
              <Mail className="w-4 h-4 text-[var(--color-primary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Email</p>
                <p className="font-semibold text-[var(--color-text-heading)] break-all">{employee.email}</p>
              </div>
            </div>

            {employee.phone && (
              <div className="flex items-center gap-3 p-3 rounded-[6px] bg-[var(--color-bg-surface)] border border-[var(--color-border)]/70">
                <Phone className="w-4 h-4 text-[var(--color-primary)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Phone</p>
                  <p className="font-semibold text-[var(--color-text-heading)]">{employee.phone}</p>
                </div>
              </div>
            )}

            {employee.location && (
              <div className="flex items-center gap-3 p-3 rounded-[6px] bg-[var(--color-bg-surface)] border border-[var(--color-border)]/70">
                <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Location</p>
                  <p className="font-semibold text-[var(--color-text-heading)]">{employee.location}</p>
                </div>
              </div>
            )}

            {employee.joinedDate && (
              <div className="flex items-center gap-3 p-3 rounded-[6px] bg-[var(--color-bg-surface)] border border-[var(--color-border)]/70">
                <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Joining Date</p>
                  <p className="font-semibold text-[var(--color-text-heading)]">{employee.joinedDate}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--color-border)] mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full pp-btn-secondary text-sm py-2 rounded-[4px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}