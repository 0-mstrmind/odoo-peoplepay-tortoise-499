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
  Building2,
  ChevronDown,
  LogOut,
  Settings,
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
  onOpenProfileModal?: (tab?: 'profile' | 'password') => void
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isCollapsed,
  user,
  onSignOut,
  onOpenProfileModal,
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
              {/* Employees */}
              {showEmployees && (
                <button
                  type="button"
                  onClick={() => navigate('/employees')}
                  title="Employee Master Directory"
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                    isEmployees
                      ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                      : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0 text-[var(--color-primary)]" />
                  {!isCollapsed && <span className="truncate">Employees</span>}
                </button>
              )}

              {/* Contracts */}
              {showContracts && (
                <div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => navigate('/contracts')}
                      title="Employee Contracts & Compensation"
                      className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                        isContracts && !search.includes('tab=')
                          ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                          : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">Contracts</span>}
                    </button>
                    {!isCollapsed && (
                      <button
                        type="button"
                        onClick={() => toggleSubMenu('contracts')}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] rounded cursor-pointer"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            openSubMenus.contracts ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {!isCollapsed && openSubMenus.contracts && (
                    <div className="ml-6 pl-2 border-l border-[var(--color-border)] mt-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => navigate('/contracts')}
                        className={`w-full text-left px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                          isContracts && !search.includes('tab=')
                            ? 'text-[var(--color-primary)] font-bold'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
                        }`}
                      >
                        All Contracts
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/contracts?tab=structures')}
                        className={`w-full text-left px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                          search.includes('tab=structures')
                            ? 'text-[var(--color-primary)] font-bold'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
                        }`}
                      >
                        Salary Structures
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/contracts?tab=schedules')}
                        className={`w-full text-left px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                          search.includes('tab=schedules')
                            ? 'text-[var(--color-primary)] font-bold'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
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
                  title="Daily Attendance Tracking"
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                    isAttendance
                      ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                      : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  {!isCollapsed && (
                    <span>{role?.toLowerCase() === 'employee' ? 'My Attendance' : 'Attendance'}</span>
                  )}
                </button>
              )}

              {/* Time Off */}
              {showTimeOff && (
                <div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => navigate('/time-off')}
                      title="Time Off & Leave Management"
                      className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                        isTimeOff
                          ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                          : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                      }`}
                    >
                      <Calendar className="w-4 h-4 shrink-0" />
                      {!isCollapsed && (
                        <span>{role?.toLowerCase() === 'employee' ? 'My Time Off' : 'Time Off'}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}


              {/* Payout History */}
              <button
                type="button"
                onClick={() => navigate('/payouts')}
                title="Employee Payslips & Payout Receipts"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                  isPayouts
                    ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                    : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Payout History & Payslips</span>}
              </button>

              {/* Payroll */}
              {showPayroll && (
                <button
                  type="button"
                  onClick={() => navigate('/payroll')}
                  title="Multi-Tenant Payroll Processing Hub"
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                    isPayroll
                      ? 'text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)]'
                      : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0 text-[var(--color-primary)]" />
                  {!isCollapsed && <span className="font-bold">Payroll Hub</span>}
                </button>
              )}
            </nav>
          </div>
        )}

        {/* Section 3: Administration & User Access */}
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
                title="User Access & Portal Administration"
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
            <button
              type="button"
              onClick={() => onOpenProfileModal?.('profile')}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer hover:opacity-80 transition-opacity"
              title="Click to edit profile & change password"
            >
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
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onOpenProfileModal?.('profile')}
                title="Edit Profile & Security"
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-muted)] rounded transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onSignOut}
                title="Sign Out"
                className="p-1 text-[#FF1744] hover:bg-[#FF1744]/10 rounded transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 items-center">
            <button
              type="button"
              onClick={() => onOpenProfileModal?.('profile')}
              title={`Edit profile for ${user?.email || 'User'}`}
              className="w-full h-8 rounded-[6px] bg-[var(--color-bg-base)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-heading)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onSignOut}
              title={`Signed in as ${user?.email || 'User'}. Click to Sign Out`}
              className="w-full h-8 rounded-[6px] bg-[var(--color-bg-base)] border border-[var(--color-border)] flex items-center justify-center text-[#FF1744] hover:bg-[#FF1744]/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
