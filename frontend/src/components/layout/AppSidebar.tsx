import React, { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Calendar,
  CreditCard,
  ShieldCheck,
  KeyRound,
  ChevronDown,
  Building2,
  LogOut,
} from 'lucide-react'
import type { AuthUser } from '@/store/auth.store'
import {
  canAccessEmployees,
  canAccessContracts,
  canAccessAttendance,
  canAccessTimeOff,
  canAccessPayroll,
  canAccessUserManagement,
} from '@/store/auth.store'

export interface AppSidebarProps {
  isCollapsed: boolean
  onToggleCollapse?: () => void
  currentView: string
  activeSubItem?: string
  onNavigate: (view: string, subItem?: string) => void
  user: AuthUser | null
  onSignOut: () => void
  onOpenAuth: () => void
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isCollapsed,
  currentView,
  activeSubItem,
  onNavigate,
  user,
  onSignOut,
  onOpenAuth,
}) => {
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    employees: true,
    contracts: false,
    timeoff: false,
  })

  const toggleSubMenu = (menuKey: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }))
  }

  const role = user?.role
  const showEmployees = canAccessEmployees(role)
  const showContracts = canAccessContracts(role)
  const showAttendance = canAccessAttendance(role)
  const showTimeOff = canAccessTimeOff(role)
  const showPayroll = canAccessPayroll(role)
  const showUserMgmt = canAccessUserManagement(role)

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[var(--color-bg-base)] border-r border-[var(--color-border)] flex flex-col transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-3.5 border-b border-[var(--color-border)] flex items-center shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-extrabold text-sm text-[var(--color-text-heading)] leading-tight tracking-tight">
                PeoplePay360
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] font-medium truncate">
                HR & Payroll Engine
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold shadow-xs mx-auto">
            <Building2 className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 custom-scrollbar">
        {/* Section 1: Overview */}
        <div>
          {!isCollapsed && (
            <h4 className="px-2.5 mb-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Overview
            </h4>
          )}
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              title="HR & Payroll Executive Operational Dashboard"
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                currentView === 'dashboard'
                  ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                  : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </button>
          </nav>
        </div>

        {/* Section 2: People & HR */}
        {(showEmployees || showContracts || showAttendance || showTimeOff || showPayroll) && (
          <div>
            {!isCollapsed && (
              <h4 className="px-2.5 mb-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                People & HR
              </h4>
            )}
            <nav className="space-y-0.5">
              {/* Employees Dropdown */}
              {showEmployees && (
                <div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => onNavigate('employees')}
                      title="Employee Master Directory"
                      className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                        currentView === 'employees' && !activeSubItem
                          ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                          : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                      }`}
                    >
                      <Users className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span>Employees</span>}
                    </button>

                    {!isCollapsed && (
                      <button
                        type="button"
                        onClick={() => toggleSubMenu('employees')}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${
                            openSubMenus.employees ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {!isCollapsed && openSubMenus.employees && (
                    <div className="ml-6 pl-2.5 border-l border-[var(--color-border)] my-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => onNavigate('employees', 'All Employees')}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-[4px] transition-colors cursor-pointer ${
                          activeSubItem === 'All Employees'
                            ? 'text-[var(--color-primary)] font-bold bg-[rgba(113,72,103,0.08)]'
                            : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                        }`}
                      >
                        All Employees
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('employees', 'Departments')}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-[4px] transition-colors cursor-pointer ${
                          activeSubItem === 'Departments'
                            ? 'text-[var(--color-primary)] font-bold bg-[rgba(113,72,103,0.08)]'
                            : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                        }`}
                      >
                        Departments
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('employees', 'Job Positions')}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-[4px] transition-colors cursor-pointer ${
                          activeSubItem === 'Job Positions'
                            ? 'text-[var(--color-primary)] font-bold bg-[rgba(113,72,103,0.08)]'
                            : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                        }`}
                      >
                        Job Positions
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Contracts */}
              {showContracts && (
                <div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => onNavigate('contracts')}
                      title="Contracts Administration"
                      className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                        currentView === 'contracts'
                          ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                          : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span>Contracts</span>}
                    </button>
                    {!isCollapsed && (
                      <button
                        type="button"
                        onClick={() => toggleSubMenu('contracts')}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${
                            openSubMenus.contracts ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {!isCollapsed && openSubMenus.contracts && (
                    <div className="ml-6 pl-2.5 border-l border-[var(--color-border)] my-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => onNavigate('contracts', 'All Contracts')}
                        className="w-full text-left px-2 py-1.5 text-xs rounded-[4px] text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] cursor-pointer"
                      >
                        All Contracts
                      </button>
                      {showPayroll && (
                        <button
                          type="button"
                          onClick={() => onNavigate('contracts', 'Salary Structures')}
                          className="w-full text-left px-2 py-1.5 text-xs rounded-[4px] text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] cursor-pointer"
                        >
                          Salary Structures
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onNavigate('contracts', 'Working Schedules')}
                        className="w-full text-left px-2 py-1.5 text-xs rounded-[4px] text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] cursor-pointer"
                      >
                        Working Schedules
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Attendance */}
              {showAttendance && (
                <button
                  type="button"
                  onClick={() => onNavigate('attendance')}
                  title={role === 'employee' ? 'My Attendance & Check-In' : 'Attendance Log & Time Tracking'}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                    currentView === 'attendance'
                      ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                      : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>{role === 'employee' ? 'My Attendance' : 'Attendance'}</span>}
                </button>
              )}

              {/* Time Off */}
              {showTimeOff && (
                <div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => onNavigate('timeoff')}
                      title={role === 'employee' ? 'My Leave Requests' : 'Time Off & Leave Management'}
                      className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                        currentView === 'timeoff'
                          ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                          : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                      }`}
                    >
                      <Calendar className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span>{role === 'employee' ? 'My Time Off' : 'Time Off'}</span>}
                    </button>
                    {!isCollapsed && (
                      <button
                        type="button"
                        onClick={() => toggleSubMenu('timeoff')}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${
                            openSubMenus.timeoff ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {!isCollapsed && openSubMenus.timeoff && (
                    <div className="ml-6 pl-2.5 border-l border-[var(--color-border)] my-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => onNavigate('timeoff', 'Time Off Requests')}
                        className="w-full text-left px-2 py-1.5 text-xs rounded-[4px] text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] cursor-pointer"
                      >
                        Time Off Requests
                      </button>
                      {role !== 'employee' && (
                        <button
                          type="button"
                          onClick={() => onNavigate('timeoff', 'Leave Allocations')}
                          className="w-full text-left px-2 py-1.5 text-xs rounded-[4px] text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] cursor-pointer"
                        >
                          Leave Allocations
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Payroll */}
              {showPayroll && (
                <button
                  type="button"
                  onClick={() => onNavigate('payroll')}
                  title="Payroll Engine & Payslips"
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                    currentView === 'payroll'
                      ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                      : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Payroll</span>}
                </button>
              )}
            </nav>
          </div>
        )}

        {/* Section 3: Administration */}
        <div>
          {!isCollapsed && (
            <h4 className="px-2.5 mb-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Administration
            </h4>
          )}
          <nav className="space-y-0.5">
            {/* User Management (Admin Only) */}
            {showUserMgmt && (
              <button
                type="button"
                onClick={() => onNavigate('user-management')}
                title="Admin User Access & Management Portal"
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                  currentView === 'user-management'
                    ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                    : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-[var(--color-primary)]" />
                  {!isCollapsed && <span className="truncate">User Management</span>}
                </div>
                {!isCollapsed && (
                  <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] rounded">
                    Admin
                  </span>
                )}
              </button>
            )}

            {/* Auth & Setup */}
            <button
              type="button"
              onClick={onOpenAuth}
              title="Auth & Tenant Registration Portal"
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] rounded-[6px] transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Auth & Setup</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* User Footer Card */}
      <div className="p-2 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] shrink-0">
        {!isCollapsed ? (
          <div className="p-2 rounded-[6px] bg-[var(--color-bg-base)] border border-[var(--color-border)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-[6px] bg-[#FF7043] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[var(--color-text-heading)] truncate">
                  {user?.name || user?.email || 'System User'}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] truncate capitalize font-medium">
                  {user?.role?.replace('_', ' ') || 'Employee'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              title="Sign Out"
              className="p-1 text-[#FF1744] hover:bg-[#FF1744]/10 rounded transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignOut}
            title={`Signed in as ${user?.email || 'User'}. Click to Sign Out`}
            className="w-full h-9 rounded-[6px] bg-[var(--color-bg-base)] border border-[var(--color-border)] flex items-center justify-center text-[#FF1744] hover:bg-[#FF1744]/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  )
}
