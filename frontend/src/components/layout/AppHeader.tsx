import React from 'react'
import { useLocation } from 'react-router-dom'
import { PanelLeft, PanelLeftClose, ChevronRight, Building2, ShieldCheck, Settings } from 'lucide-react'
import type { AuthUser } from '@/store/auth.store'
import { NotificationDropdown } from './NotificationDropdown'

export interface AppHeaderProps {
  isSidebarCollapsed?: boolean
  onToggleSidebar: () => void
  currentView?: string
  activeSubItem?: string
  user: AuthUser | null
  onOpenProfileModal?: (tab?: 'profile' | 'password') => void
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isSidebarCollapsed = false,
  onToggleSidebar,
  currentView,
  activeSubItem,
  user,
  onOpenProfileModal,
}) => {
  const location = useLocation()
  const pathname = location.pathname
  const search = new URLSearchParams(location.search)
  const tab = search.get('tab')

  // Format breadcrumb text from currentView or pathname
  let viewTitle = 'Dashboard'
  let subTitle = activeSubItem

  if (currentView) {
    viewTitle =
      currentView === 'dashboard'
        ? 'Dashboard'
        : currentView === 'user-management'
        ? 'User Management'
        : currentView === 'employees'
        ? 'Employee Master'
        : currentView.charAt(0).toUpperCase() + currentView.slice(1)
  } else {
    if (pathname.startsWith('/employees')) {
      viewTitle = 'Employee Master'
      if (tab === 'departments') subTitle = 'Departments'
      else if (tab === 'positions') subTitle = 'Job Positions'
      else subTitle = 'All Employees'
    } else if (pathname.startsWith('/contracts')) {
      viewTitle = 'Contracts'
      if (tab === 'structures') subTitle = 'Salary Structures'
      else if (tab === 'schedules') subTitle = 'Working Schedules'
      else subTitle = 'All Contracts'
    } else if (pathname.startsWith('/attendance')) {
      viewTitle = user?.role?.toLowerCase() === 'employee' ? 'My Attendance' : 'Attendance'
    } else if (pathname.startsWith('/time-off')) {
      viewTitle = user?.role?.toLowerCase() === 'employee' ? 'My Time Off' : 'Time Off'
      if (tab === 'allocations') subTitle = 'Leave Allocations'
      else subTitle = 'Time Off Requests'
    } else if (pathname.startsWith('/payroll')) {
      viewTitle = 'Payroll Operations'
    } else if (pathname.startsWith('/user-management')) {
      viewTitle = 'User Management'
    } else {
      viewTitle = 'Dashboard'
    }
  }

  return (
    <header className="h-14 bg-[var(--color-bg-base)] border-b border-[var(--color-border)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left side: Sidebar Toggle & Breadcrumb Navigation */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
          className="p-1.5 rounded-[6px] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] transition-colors cursor-pointer"
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-4 h-4 text-[var(--color-primary)]" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
          <span className="font-semibold text-[var(--color-text-heading)] hidden sm:inline">
            PeoplePay360
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] hidden sm:inline" />
          <span className="font-semibold text-[var(--color-primary)]">{viewTitle}</span>
          {subTitle && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-heading)] font-semibold">{subTitle}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side: Tenant Workspace Badge, Notifications, User Profile & Settings */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[rgba(113,72,103,0.08)] border border-[rgba(113,72,103,0.2)] text-xs font-semibold text-[var(--color-primary)]">
          <Building2 className="w-3.5 h-3.5" />
          <span>PeoplePay360 Tenant</span>
        </div>

        {user?.role && (
          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)] font-semibold uppercase">
            <ShieldCheck className="w-3 h-3 text-[var(--color-primary)]" />
            <span>{user.role}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenProfileModal?.('profile')}
          className="flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[var(--color-bg-muted)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-heading)] hover:border-[var(--color-primary)] transition-all cursor-pointer shadow-2xs"
          title="Edit My Profile & Password Settings"
        >
          <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="hidden sm:inline font-bold">{user?.name || user?.email?.split('@')[0] || 'My Profile'}</span>
          <Settings className="w-3.5 h-3.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]" />
        </button>

        <NotificationDropdown />
      </div>
    </header>
  )
}


