import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Bell, Building2, User } from 'lucide-react'
import type { AuthUser } from '@/store/auth.store'

export interface NavbarProps {
  activeItem?: string
  onNavigate?: (item: string) => void
  user?: AuthUser | null
  onSignOut?: () => void
  onOpenAuth?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  activeItem = 'Employees',
  onNavigate,
  user,
  onSignOut,
  onOpenAuth,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name))
  }

  const handleItemClick = (parentName: string, subItem?: string) => {
    setOpenDropdown(null)
    onNavigate?.(subItem ? `${parentName} / ${subItem}` : parentName)
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--color-bg-base)] border-b border-[var(--color-border)] shadow-2xs overflow-visible">
      <div
        ref={navRef}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-14 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 overflow-visible"
      >
        {/* Left Nav Menu Items — Fixed non-scrollable layout */}
        <nav className="flex items-center flex-wrap gap-1 sm:gap-2 md:gap-3 py-1 overflow-visible">
          {/* 1. Employees ▼ */}
          <div className="relative overflow-visible">
            <button
              type="button"
              onClick={() => handleToggle('Employees')}
              title="Employee Master — Departments, Job Positions & Profiles"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-semibold rounded-[4px] transition-colors cursor-pointer select-none ${
                activeItem === 'Employees'
                  ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.08)]'
                  : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
              }`}
            >
              <span>Employees</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  openDropdown === 'Employees' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'Employees' && (
              <div className="absolute left-0 mt-1.5 w-48 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[6px] shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  title="View all employee records"
                  onClick={() => handleItemClick('Employees', 'All Employees')}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[var(--color-primary)] bg-[rgba(113,72,103,0.06)] hover:bg-[rgba(113,72,103,0.1)] cursor-pointer"
                >
                  All Employees
                </button>
                <button
                  type="button"
                  title="Manage company departments"
                  onClick={() => handleItemClick('Employees', 'Departments')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
                >
                  Departments
                </button>
                <button
                  type="button"
                  title="Manage employee job positions"
                  onClick={() => handleItemClick('Employees', 'Job Positions')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
                >
                  Job Positions
                </button>
              </div>
            )}
          </div>

          {/* 2. Contracts ▼ */}
          <div className="relative overflow-visible">
            <button
              type="button"
              onClick={() => handleToggle('Contracts')}
              title="Contracts Administration — Wages, Schedules & Salary Structures"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-semibold rounded-[4px] transition-colors cursor-pointer select-none ${
                activeItem === 'Contracts'
                  ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.08)]'
                  : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
              }`}
            >
              <span>Contracts</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  openDropdown === 'Contracts' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'Contracts' && (
              <div className="absolute left-0 mt-1.5 w-48 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[6px] shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  title="View employment contracts"
                  onClick={() => handleItemClick('Contracts', 'All Contracts')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium cursor-pointer"
                >
                  All Contracts
                </button>
                <button
                  type="button"
                  title="Manage salary structure rules"
                  onClick={() => handleItemClick('Contracts', 'Salary Structures')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium cursor-pointer"
                >
                  Salary Structures
                </button>
                <button
                  type="button"
                  title="Configure weekly working schedules"
                  onClick={() => handleItemClick('Contracts', 'Working Schedules')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium cursor-pointer"
                >
                  Working Schedules
                </button>
              </div>
            )}
          </div>

          {/* 3. Attendance */}
          <button
            type="button"
            onClick={() => handleItemClick('Attendance')}
            title="Attendance Tracking — Check-in & Check-out logs"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-semibold rounded-[4px] transition-colors cursor-pointer select-none ${
              activeItem === 'Attendance'
                ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.08)]'
                : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
            }`}
          >
            Attendance
          </button>

          {/* 4. Time Off ▼ */}
          <div className="relative overflow-visible">
            <button
              type="button"
              onClick={() => handleToggle('Time Off')}
              title="Time Off Management — Leave Allocations & Requests"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-semibold rounded-[4px] transition-colors cursor-pointer select-none ${
                activeItem === 'Time Off'
                  ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.08)]'
                  : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
              }`}
            >
              <span>Time Off</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  openDropdown === 'Time Off' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'Time Off' && (
              <div className="absolute left-0 mt-1.5 w-48 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[6px] shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  title="View employee leave requests"
                  onClick={() => handleItemClick('Time Off', 'Time Off Requests')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium cursor-pointer"
                >
                  Time Off Requests
                </button>
                <button
                  type="button"
                  title="Grant leave allocations to employees"
                  onClick={() => handleItemClick('Time Off', 'Leave Allocations')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium cursor-pointer"
                >
                  Leave Allocations
                </button>
                <button
                  type="button"
                  title="Configure leave types and rules"
                  onClick={() => handleItemClick('Time Off', 'Leave Types')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium cursor-pointer"
                >
                  Leave Types
                </button>
              </div>
            )}
          </div>

          {/* 5. Payroll */}
          <button
            type="button"
            onClick={() => handleItemClick('Payroll')}
            title="Payroll Engine — Payrun Calculations & Payslips"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-semibold rounded-[4px] transition-colors cursor-pointer select-none ${
              activeItem === 'Payroll'
                ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.08)]'
                : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
            }`}
          >
            Payroll
          </button>
        </nav>

        {/* Right side items: Tenant / Notifications / User menu */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Tenant badge */}
          <div
            title="Active tenant organization workspace"
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] text-xs font-medium border border-[var(--color-border)]"
          >
            <Building2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span className="truncate max-w-[120px]">PeoplePay360</span>
          </div>

          {/* Notifications button */}
          <button
            type="button"
            className="p-1.5 rounded-[4px] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] transition-colors cursor-pointer"
            title="System Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* User menu */}
          <div className="relative overflow-visible">
            <button
              type="button"
              onClick={() => handleToggle('UserMenu')}
              className="relative focus:outline-none cursor-pointer flex items-center gap-1.5"
              title={user ? `${user.name} (${user.role})` : 'System User Profile & Authentication'}
            >
              <div className="w-6 h-6 rounded-[6px] bg-[#FF7043] flex items-center justify-center shadow-xs hover:opacity-90 transition-opacity">
                {user?.name ? (
                  <span className="text-white text-[10px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-white/90" />
                )}
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00C853] ring-2 ring-white" />
            </button>

            {openDropdown === 'UserMenu' && (
              <div className="absolute right-0 mt-2 w-56 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[6px] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                {user ? (
                  <div className="px-3 py-2 border-b border-[var(--color-border)]">
                    <p className="text-xs font-bold text-[var(--color-text-heading)] truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] truncate">{user.email}</p>
                    <span className="mt-1 inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-[rgba(113,72,103,0.1)] text-[var(--color-primary)] rounded">
                      {user.role}
                    </span>
                  </div>
                ) : (
                  <div className="px-3 py-2 border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>Workspace: Active</span>
                  </div>
                )}

                <button
                  type="button"
                  title="Open Authentication & Tenant Registration Page"
                  onClick={() => {
                    setOpenDropdown(null)
                    onOpenAuth?.()
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium cursor-pointer"
                >
                  {user ? 'Auth & Company Setup' : 'Sign In / Register'}
                </button>

                {user && (
                  <button
                    type="button"
                    title="Sign out of your active workspace session"
                    onClick={() => {
                      setOpenDropdown(null)
                      onSignOut?.()
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#FF1744] hover:bg-[#FF1744]/10 font-medium cursor-pointer"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}