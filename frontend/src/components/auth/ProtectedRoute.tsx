import React from 'react'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useIsAuthed, useAuthUser, hasRolePermission, type UserRole } from '@/store/auth.store'
import { AuthPage } from './AuthPage'

export interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  fallback?: React.ReactNode
  onAccessDeniedReturn?: () => void
  onAuthComplete?: () => void
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
  onAccessDeniedReturn,
  onAuthComplete,
}) => {
  const isAuthed = useIsAuthed()
  const user = useAuthUser()

  // 1. Unauthenticated -> Show Auth Page
  if (!isAuthed) {
    if (fallback) return <>{fallback}</>
    return <AuthPage onAuthComplete={onAuthComplete} />
  }

  // 2. Authenticated, but role does not match requirements -> 403 Forbidden
  if (allowedRoles && allowedRoles.length > 0 && !hasRolePermission(user?.role, allowedRoles)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full pp-card border border-[var(--color-border)] shadow-md text-center p-8">
          <div className="w-14 h-14 rounded-full bg-[rgba(255,23,68,0.12)] text-[#FF1744] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-[var(--color-text-heading)] mb-2">
            Access Restricted
          </h2>

          <p className="text-sm text-[var(--color-text-body)] mb-4">
            You are logged in as <strong className="text-[var(--color-text-heading)]">{user?.name || user?.email}</strong> with role{' '}
            <span className="pp-badge pp-badge-neutral uppercase text-xs">{user?.role}</span>.
          </p>

          <div className="bg-[var(--color-bg-muted)] p-3 rounded-[4px] text-xs text-[var(--color-text-muted)] mb-6">
            This section requires one of the following permissions:{' '}
            <strong className="text-[var(--color-text-heading)]">
              {allowedRoles.join(', ')}
            </strong>
          </div>

          <button
            type="button"
            onClick={onAccessDeniedReturn}
            className="pp-btn-primary w-full text-sm py-2 rounded-[4px] flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Allowed Dashboard</span>
          </button>
        </div>
      </div>
    )
  }

  // 3. Authorized -> Render requested view
  return <>{children}</>
}