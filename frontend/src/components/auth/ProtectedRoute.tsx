import React from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useIsAuthed, useAuthUser, hasRolePermission, type UserRole } from '@/store/auth.store'

export interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  fallback?: React.ReactNode
}

/**
 * Robust Protected Route component for React Router.
 * - Redirects unauthenticated visitors to /login preserving target location.
 * - Enforces Role-Based Access Control (RBAC) with friendly 403 Forbidden UI.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const isAuthed = useIsAuthed()
  const user = useAuthUser()
  const location = useLocation()
  const navigate = useNavigate()

  // 1. Unauthenticated -> Redirect to /login and preserve attempted URL
  if (!isAuthed || !user) {
    if (fallback) return <>{fallback}</>
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. Authenticated, but role does not match requirements -> 403 Forbidden
  if (allowedRoles && allowedRoles.length > 0 && !hasRolePermission(user.role, allowedRoles)) {
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
            You are logged in as <strong className="text-[var(--color-text-heading)]">{user.name || user.email}</strong> with role{' '}
            <span className="pp-badge pp-badge-neutral uppercase text-xs">{user.role}</span>.
          </p>

          <div className="bg-[var(--color-bg-muted)] p-3 rounded-[4px] text-xs text-[var(--color-text-muted)] mb-6">
            This section requires one of the following permissions:{' '}
            <strong className="text-[var(--color-text-heading)]">
              {allowedRoles.join(', ')}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="pp-btn-primary w-full text-sm py-2 rounded-[4px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Allowed Dashboard</span>
          </button>
        </div>
      </div>
    )
  }

  // 3. Authorized -> Render requested route view
  return <>{children}</>
}

/**
 * Public route guard:
 * If user is already authenticated, redirects away from /login to /dashboard.
 */
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthed = useIsAuthed()
  const location = useLocation()

  if (isAuthed) {
    const origin = (location.state as any)?.from?.pathname || '/dashboard'
    return <Navigate to={origin} replace />
  }

  return <>{children}</>
}