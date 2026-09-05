import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { Lock } from 'lucide-react'
import './App.css'
import { AppSidebar } from './components/layout/AppSidebar'
import { AppHeader } from './components/layout/AppHeader'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { EmployeesPage } from './components/employees/EmployeesPage'
import { UserManagementView } from './components/auth/UserManagementView'
import { AuthPage } from './components/auth/AuthPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import {
  useAuthStore,
  useIsAuthed,
  useAuthUser,
  canAccessEmployees,
  canAccessUserManagement,
} from './store/auth.store'

function App() {
  const isAuthed = useIsAuthed()
  const user = useAuthUser()
  const logout = useAuthStore((s) => s.logout)

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentView, setCurrentView] = useState<string>('dashboard')
  const [activeSubItem, setActiveSubItem] = useState<string | undefined>(undefined)

  // Auto-redirect admin to User Management upon login or session start
  useEffect(() => {
    if (user) {
      const isAdmin = user.role === 'admin' || user.role === 'super_admin'
      if (isAdmin && currentView === 'auth') {
        setCurrentView('user-management')
        toast.success(`Welcome back, ${user.name || user.email}!`, {
          description: 'Navigated to Admin User Management Portal.',
        })
      } else if (!isAdmin && currentView === 'auth') {
        setCurrentView('dashboard')
      }
    } else {
      setCurrentView('auth')
    }
  }, [user])

  // Listen to 401 unauthorized events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
      setCurrentView('auth')
      toast.error('Session expired. Please sign in again.')
    }
    window.addEventListener('pp:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('pp:unauthorized', handleUnauthorized)
  }, [logout])

  // Keyboard shortcut (Ctrl+B / Cmd+B) to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setIsSidebarCollapsed((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 1. ROUTE PROTECTION: If user is not logged in -> Show Login Page
  if (!isAuthed || !user || currentView === 'auth') {
    return (
      <div className="relative min-h-screen bg-[var(--color-bg-base)]">
        {user && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentView(
                  user.role === 'admin' || user.role === 'super_admin'
                    ? 'user-management'
                    : 'dashboard'
                )
              }
              className="pp-btn-secondary text-xs px-3 py-1.5 shadow-xs cursor-pointer"
            >
              Go to Workspace &rarr;
            </button>
          </div>
        )}

        <AuthPage
          onAuthComplete={() => {
            const currentUser = useAuthStore.getState().user
            if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
              setCurrentView('user-management')
              toast.success('Admin login successful! Accessing User Management.')
            } else {
              setCurrentView('dashboard')
              toast.success('Signed in successfully!')
            }
          }}
        />
        <Toaster position="top-right" richColors />
      </div>
    )
  }

  // 2. Navigation Handler with RBAC Guard
  const handleNavigate = (view: string, subItem?: string) => {
    const role = user.role
    if (view === 'user-management' && !canAccessUserManagement(role)) {
      toast.error('Access Restricted', {
        description: 'User Management portal is restricted to Administrators only.',
      })
      return
    }

    if (view === 'employees' && !canAccessEmployees(role)) {
      toast.error('Access Restricted', {
        description: 'Employee Directory access requires HR or Manager role.',
      })
      return
    }

    setCurrentView(view)
    setActiveSubItem(subItem)

    if (subItem) {
      toast.info(`Navigated to ${view} / ${subItem}`, {
        description: 'PeoplePay360 Multi-Tenant HR & Payroll Module.',
        duration: 2000,
      })
    }
  }

  const isAdmin = canAccessUserManagement(user.role)

  // Render view based on selection
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <ProtectedRoute onAccessDeniedReturn={() => setCurrentView('dashboard')}>
            <DashboardPage
              onNavigateToEmployees={
                canAccessEmployees(user.role)
                  ? () => {
                      setCurrentView('employees')
                      setActiveSubItem('All Employees')
                    }
                  : undefined
              }
              onNavigateToUserManagement={
                isAdmin
                  ? () => {
                      setCurrentView('user-management')
                    }
                  : undefined
              }
            />
          </ProtectedRoute>
        )
      case 'user-management':
        return isAdmin ? (
          <UserManagementView />
        ) : (
          <div className="pp-card max-w-md mx-auto my-8 text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-heading)]">
              Admin Access Restricted
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              The User Management Portal requires Administrator role permissions.
            </p>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="pp-btn-primary text-xs py-2 px-4"
            >
              Return to Dashboard
            </button>
          </div>
        )
      case 'employees':
      default:
        return (
          <ProtectedRoute
            allowedRoles={[
              'admin',
              'super_admin',
              'hr_manager',
              'hr_payroll_user',
              'payroll_user',
              'hr_payroll_manager',
              'payroll_manager',
            ]}
            onAccessDeniedReturn={() => setCurrentView('dashboard')}
          >
            <EmployeesPage />
          </ProtectedRoute>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col">
      {/* Shadcn UI Sidebar Navigation */}
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        currentView={currentView}
        activeSubItem={activeSubItem}
        onNavigate={handleNavigate}
        user={user}
        onSignOut={() => {
          logout()
          setCurrentView('auth')
          toast.info('Signed out successfully')
        }}
        onOpenAuth={() => setCurrentView('auth')}
      />

      {/* Main Content Area offset by Sidebar width */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        {/* Top Header Bar */}
        <AppHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          currentView={currentView}
          activeSubItem={activeSubItem}
          user={user}
        />

        {/* View Workspace Container */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          {renderCurrentView()}
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  )
}

export default App
