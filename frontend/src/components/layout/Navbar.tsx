import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Bell, Building2 } from 'lucide-react'

export interface NavbarProps {
  activeItem?: string
  onNavigate?: (item: string) => void
}

export const Navbar: React.FC<NavbarProps> = ({
  activeItem = 'Employees',
  onNavigate,
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
    <header className="sticky top-0 z-40 w-full bg-[var(--color-bg-base)] border-b border-[var(--color-border)] shadow-2xs">
      <div
        ref={navRef}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between"
      >
        {/* Left Nav Menu Items — NO HR logo as strictly requested */}
        <nav className="flex items-center gap-1 sm:gap-2 md:gap-4 overflow-x-auto no-scrollbar py-1">
          {/* 1. Employees ▼ (Active in wireframe) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => handleToggle('Employees')}
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
              <div className="absolute left-0 mt-1.5 w-48 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[6px] shadow-md py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => handleItemClick('Employees', 'All Employees')}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[var(--color-primary)] bg-[rgba(113,72,103,0.06)] hover:bg-[rgba(113,72,103,0.1)]"
                >
                  All Employees
                </button>
                <button
                  type="button"
                  onClick={() => handleItemClick('Employees', 'Departments')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)]"
                >
                  Departments
                </button>
                <button
                  type="button"
                  onClick={() => handleItemClick('Employees', 'Job Positions')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)]"
                >
                  Job Positions
                </button>
              </div>
            )}
          </div>

          {/* 2. Contracts ▼ */}
          <div className="relative">
            <button
              type="button"
              onClick={() => handleToggle('Contracts')}
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
              <div className="absolute left-0 mt-1.5 w-48 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[6px] shadow-md py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => handleItemClick('Contracts', 'All Contracts')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium"
                >
                  All Contracts
                </button>
                <button
                  type="button"
                  onClick={() => handleItemClick('Contracts', 'Salary Structures')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium"
                >
                  Salary Structures
                </button>
                <button
                  type="button"
                  onClick={() => handleItemClick('Contracts', 'Working Schedules')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium"
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
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-semibold rounded-[4px] transition-colors cursor-pointer select-none ${
              activeItem === 'Attendance'
                ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.08)]'
                : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
            }`}
          >
            Attendance
          </button>

          {/* 4. Time Off ▼ */}
          <div className="relative">
            <button
              type="button"
              onClick={() => handleToggle('Time Off')}
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
              <div className="absolute left-0 mt-1.5 w-48 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[6px] shadow-md py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => handleItemClick('Time Off', 'Time Off Requests')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium"
                >
                  Time Off Requests
                </button>
                <button
                  type="button"
                  onClick={() => handleItemClick('Time Off', 'Leave Allocations')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium"
                >
                  Leave Allocations
                </button>
                <button
                  type="button"
                  onClick={() => handleItemClick('Time Off', 'Leave Types')}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-body)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-heading)] font-medium"
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
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-semibold rounded-[4px] transition-colors cursor-pointer select-none ${
              activeItem === 'Payroll'
                ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.08)]'
                : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
            }`}
          >
            Payroll
          </button>
        </nav>

        {/* Right side items: Notification / Status Badge (matching wireframe coral square) */}
        <div className="flex items-center gap-2.5">
          {/* Tenant badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] text-xs font-medium border border-[var(--color-border)]">
            <Building2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span className="truncate max-w-[120px]">PeoplePay360</span>
          </div>

          {/* Notifications button */}
          <button
            type="button"
            className="p-1.5 rounded-[4px] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Wireframe Coral / Salmon Accent Badge indicator */}
          <div className="relative" title="System Status: Connected">
            <div className="w-6 h-6 rounded-[6px] bg-[#FF7043] flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90 transition-opacity">
              <span className="w-2 h-2 rounded-full bg-white/90" />
            </div>
            {/* Pulsing indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00C853] ring-2 ring-white" />
          </div>
        </div>
      </div>
    </header>
  )
}