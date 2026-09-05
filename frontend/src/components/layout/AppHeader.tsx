import React from 'react'
import { PanelLeft, PanelLeftClose, ChevronRight, Building2, Bell, ShieldCheck } from 'lucide-react'
import type { AuthUser } from '@/store/auth.store'

export interface AppHeaderProps {
  isSidebarCollapsed?: boolean
  onToggleSidebar: () => void
  currentView: string
  activeSubItem?: string
  user: AuthUser | null
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isSidebarCollapsed = false,
  onToggleSidebar,
  currentView,
  activeSubItem,
  user,
}) => {
  // Format breadcrumb text
  const viewTitle =
    currentView === 'dashboard'
      ? 'Dashboard'
      : currentView === 'user-management'
      ? 'User Management'
      : currentView === 'employees'
      ? 'Employee Master'
      : currentView.charAt(0).toUpperCase() + currentView.slice(1)

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
          {activeSubItem && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-heading)] font-semibold">{activeSubItem}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side: Tenant Workspace Badge, Notifications, User Status */}
      <div className="flex items-center gap-3">
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
          className="p-1.5 rounded-[6px] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] transition-colors cursor-pointer relative"
          title="Notifications & System Logs"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00C853] ring-2 ring-[var(--color-bg-base)]" />
        </button>
      </div>
    </header>
  )
}
