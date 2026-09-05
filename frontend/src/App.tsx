import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import './App.css'
import { Navbar } from './components/layout/Navbar'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { EmployeesPage } from './components/employees/EmployeesPage'
import { AuthPage } from './components/auth/AuthPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuthStore, useIsAuthed, useAuthUser } from './store/auth.store'

function App() {
  const isAuthed = useIsAuthed()
  const user = useAuthUser()
  const logout = useAuthStore((s) => s.logout)

  // Active module tab in the workspace — defaults to 'Dashboard' as requested
  const [activeNav, setActiveNav] = useState('Dashboard')

  // Listen to 401 unauthorized events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
      toast.error('Session expired. Please sign in again.')
    }
    window.addEventListener('pp:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('pp:unauthorized', handleUnauthorized)
  }, [logout])

  // 1. ROUTE PROTECTION: If user is not logged in -> Show Login Page
  if (!isAuthed || !user) {
    return (
      <>
        <AuthPage
          onAuthComplete={() => {
            setActiveNav('Dashboard')
            toast.success('Signed in successfully! Welcome to PeoplePay360.')
          }}
        />
        <Toaster position="top-right" richColors />
      </>
    )
  }

  // 2. Navigation Handler
  const handleNavigate = (item: string) => {
    const mainItem = item.split(' / ')[0]
    setActiveNav(mainItem)
    if (item === 'Sign Out') {
      logout()
      toast.info('Signed out successfully')
      return
    }
  }

  // 3. Render content view based on active tab and role permissions
  const renderCurrentView = () => {
    switch (activeNav) {
      case 'Dashboard':
        return (
          <ProtectedRoute onAccessDeniedReturn={() => setActiveNav('Dashboard')}>
            <DashboardPage
              onNavigateToEmployees={() => setActiveNav('Employees')}
            />
          </ProtectedRoute>
        )

      case 'Employees':
        // Protected route: Admin and HR Manager have access to employee directory
        return (
          <ProtectedRoute
            allowedRoles={['admin', 'super_admin', 'hr_manager', 'payroll_manager']}
            onAccessDeniedReturn={() => setActiveNav('Dashboard')}
          >
            <EmployeesPage />
          </ProtectedRoute>
        )

      case 'Contracts':
      case 'Attendance':
      case 'Time Off':
      case 'Payroll':
      default:
        // Placeholder for other ERP submodules, protected by role
        return (
          <ProtectedRoute onAccessDeniedReturn={() => setActiveNav('Dashboard')}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="pp-card text-center p-12 space-y-4">
                <h2 className="text-xl font-bold text-[var(--color-text-heading)]">
                  {activeNav} Module
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
                  This module is connected to PeoplePay360 backend APIs. You are currently authorized as a{' '}
                  <span className="font-semibold text-[var(--color-primary)] uppercase">{user.role}</span>.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveNav('Dashboard')}
                    className="pp-btn-primary text-xs py-2 px-4 rounded-[4px] cursor-pointer"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNav('Employees')}
                    className="pp-btn-secondary text-xs py-2 px-4 rounded-[4px] cursor-pointer"
                  >
                    View Employees
                  </button>
                </div>
              </div>
            </div>
          </ProtectedRoute>
        )
    }
  }

  // 4. Authenticated Workspace View: Navbar (without HR logo) + Protected Active View
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-base)]">
      {/* Navbar without HR logo as strictly requested */}
      <Navbar
        activeItem={activeNav}
        onNavigate={handleNavigate}
        user={user}
        onSignOut={() => {
          logout()
          toast.info('Signed out successfully')
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        {renderCurrentView()}
      </div>

      <Toaster position="top-right" richColors />
    </div>
  )
}

export default App


