import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Calendar,
  CreditCard,
  ShieldCheck,
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
  user: AuthUser | null
  onSignOut: () => void
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isCollapsed,
  user,
  onSignOut,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const search = location.search

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

  const isDashboard = pathname === '/dashboard' || pathname === '/'
  const isEmployees = pathname.startsWith('/employees')
  const isContracts = pathname.startsWith('/contracts')
  const isAttendance = pathname.startsWith('/attendance')
  const isTimeOff = pathname.startsWith('/time-off')
  const isPayouts = pathname.startsWith('/payouts') || pathname.startsWith('/payout-history')
  const isPayroll = pathname.startsWith('/payroll')
  const isUserMgmt = pathname.startsWith('/user-management')

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
              onClick={() => navigate('/dashboard')}
              title="HR & Payroll Operational Dashboard"
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                isDashboard
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
                      onClick={() => navigate('/employees')}
                      title="Employee Master Directory"
                      className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                        isEmployees && !search.includes('tab=')
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
                        onClick={() => navigate('/employees')}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-[4px] transition-colors cursor-pointer ${
                          isEmployees && !search.includes('tab=')
                            ? 'text-[var(--color-primary)] font-bold bg-[rgba(113,72,103,0.08)]'
                            : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                        }`}
                      >
                        All Employees
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/employees?tab=departments')}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-[4px] transition-colors cursor-pointer ${
                          search.includes('tab=departments')
                            ? 'text-[var(--color-primary)] font-bold bg-[rgba(113,72,103,0.08)]'
                            : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                        }`}
                      >
                        Departments
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/employees?tab=positions')}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-[4px] transition-colors cursor-pointer ${
                          search.includes('tab=positions')
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
                      onClick={() => navigate('/contracts')}
                      title="Contracts Administration"
                      className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                        isContracts && !search.includes('tab=')
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
                        onClick={() => navigate('/contracts')}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-[4px] transition-colors cursor-pointer ${
                          isContracts && !search.includes('tab=')
                            ? 'text-[var(--color-primary)] font-bold bg-[rgba(113,72,103,0.08)]'
                            : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                        }`}
                      >
                        All Contracts
                      </button>
                      {showPayroll && (
                        <button
                          type="button"
                          onClick={() => navigate('/contracts?tab=structures')}
                          className={`w-full text-left px-2 py-1.5 text-xs rounded-[4px] transition-colors cursor-pointer ${
                            search.includes('tab=structures')
                              ? 'text-[var(--color-primary)] font-bold bg-[rgba(113,72,103,0.08)]'
                              : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                          }`}
                        >
                          Salary Structures
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate('/contracts?tab=schedules')}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-[4px] transition-colors cursor-pointer ${
                          search.includes('tab=schedules')
                            ? 'text-[var(--color-primary)] font-bold bg-[rgba(113,72,103,0.08)]'
                            : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                        }`}
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
                  onClick={() => navigate('/attendance')}
                  title={role === 'employee' ? 'My Attendance & Check-In' : 'Attendance Log & Time Tracking'}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                    isAttendance
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
                      onClick={() => navigate('/time-off')}
                      title={role === 'employee' ? 'My Leave Requests' : 'Time Off & Leave Management'}
                      className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                        isTimeOff && !search.includes('tab=')
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
                        onClick={() => navigate('/time-off')}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-[4px] transition-colors cursor-pointer ${
                          isTimeOff && !search.includes('tab=')
                            ? 'text-[var(--color-primary)] font-bold bg-[rgba(113,72,103,0.08)]'
                            : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                        }`}
                      >
                        Time Off Requests
                      </button>
                      {role !== 'employee' && (
                        <button
                          type="button"
                          onClick={() => navigate('/time-off?tab=allocations')}
                          className={`w-full text-left px-2 py-1.5 text-xs rounded-[4px] transition-colors cursor-pointer ${
                            search.includes('tab=allocations')
                              ? 'text-[var(--color-primary)] font-bold bg-[rgba(113,72,103,0.08)]'
                              : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                          }`}
                        >
                          Leave Allocations
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Payout History */}
              <button
                type="button"
                onClick={() => navigate('/payouts')}
                title={role === 'employee' ? 'My Payout & Payslip History' : 'Payout History & Remuneration'}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                  isPayouts
                    ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                    : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{role === 'employee' ? 'My Payout History' : 'Payout History'}</span>}
              </button>

              {/* Payroll */}
              {showPayroll && (
                <button
                  type="button"
                  onClick={() => navigate('/payroll')}
                  title="Payroll Engine & Payslips"
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                    isPayroll
                      ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                      : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Payroll Engine</span>}
                </button>
              )}
            </nav>
          </div>
        )}

        {/* Section 3: Administration (Admin Only) */}
        {showUserMgmt && (
          <div>
            {!isCollapsed && (
              <h4 className="px-2.5 mb-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Administration
              </h4>
            )}
            <nav className="space-y-0.5">
              <button
                type="button"
                onClick={() => navigate('/user-management')}
                title="Admin User Access & Management Portal"
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                  isUserMgmt
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
            </nav>
          </div>
        )}
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
                  {user?.role?.replace(/_/g, ' ') || 'Employee'}
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
