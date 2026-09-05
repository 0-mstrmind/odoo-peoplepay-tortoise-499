import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { Users, ShieldCheck, LogOut, Lock, LayoutDashboard } from 'lucide-react'
import './App.css'
import { Navbar } from './components/layout/Navbar'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { EmployeesPage } from './components/employees/EmployeesPage'
import { UserManagementView } from './components/auth/UserManagementView'
import { AuthPage } from './components/auth/AuthPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuthStore, useIsAuthed, useAuthUser } from './store/auth.store'

function App() {
  const isAuthed = useIsAuthed()
  const user = useAuthUser()
  const logout = useAuthStore((s) => s.logout)

  const [activeNav, setActiveNav] = useState('Dashboard')
  const [currentView, setCurrentView] = useState<'dashboard' | 'employees' | 'user-management' | 'auth'>('dashboard')

  // Auto-redirect admin to User Management upon login or session start
  useEffect(() => {
    if (user) {
      const isAdmin = user.role === 'admin' || user.role === 'super_admin'
      if (isAdmin && currentView === 'auth') {
        setCurrentView('user-management')
        setActiveNav('User Management')
        toast.success(`Welcome back, ${user.name || user.email}!`, {
          description: 'Navigated to Admin User Management Portal.',
        })
      } else if (!isAdmin && currentView === 'auth') {
        setCurrentView('dashboard')
        setActiveNav('Dashboard')
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

  // 1. ROUTE PROTECTION: If user is not logged in -> Show Login Page
  if (!isAuthed || !user || currentView === 'auth') {
    return (
      <div className="relative min-h-screen bg-[var(--color-bg-base)]">
        {user && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentView(user.role === 'admin' || user.role === 'super_admin' ? 'user-management' : 'dashboard')}
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
              setActiveNav('User Management')
              toast.success('Admin login successful! Accessing User Management.')
            } else {
              setCurrentView('dashboard')
              setActiveNav('Dashboard')
              toast.success('Signed in successfully!')
            }
          }}
        />
        <Toaster position="top-right" richColors />
      </div>
    )
  }

  // 2. Navigation Handler
  const handleNavigate = (item: string) => {
    const mainItem = item.split(' / ')[0]
    setActiveNav(mainItem)

    if (item === 'Sign Out') {
      logout()
      setCurrentView('auth')
      toast.info('Signed out successfully')
      return
    }
    if (item === 'Auth / Setup' || item === 'Sign In / Register') {
      setCurrentView('auth')
      return
    }
    if (item === 'User Management' || mainItem === 'User Management') {
      setCurrentView('user-management')
      return
    }
    if (mainItem === 'Dashboard') {
      setCurrentView('dashboard')
      return
    }
    if (mainItem === 'Employees') {
      setCurrentView('employees')
      return
    }

    toast.info(`Navigated to ${item}`, {
      description: 'Module views are linked to PeoplePay360 ERP.',
      duration: 2500,
    })
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  // Render view based on selection
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <ProtectedRoute onAccessDeniedReturn={() => setCurrentView('dashboard')}>
            <DashboardPage onNavigateToEmployees={() => { setCurrentView('employees'); setActiveNav('Employees'); }} />
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
            <h2 className="text-lg font-bold text-[var(--color-text-heading)]">Admin Access Restricted</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              The User Management Portal requires Administrator role permissions.
            </p>
            <button onClick={() => setCurrentView('employees')} className="pp-btn-primary text-xs py-2 px-4">
              Return to Employee Master
            </button>
          </div>
        )
      case 'employees':
      default:
        return (
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'hr_manager', 'payroll_manager']} onAccessDeniedReturn={() => setCurrentView('dashboard')}>
            <EmployeesPage />
          </ProtectedRoute>
        )
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-base)]">
      {/* Top Navbar */}
      <Navbar
        activeItem={activeNav}
        onNavigate={handleNavigate}
        user={user}
        onSignOut={() => {
          logout()
          setCurrentView('auth')
          toast.info('Signed out successfully')
        }}
        onOpenAuth={() => setCurrentView('auth')}
      />

      {/* Module Switcher Bar */}
      <div className="bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentView('dashboard')
                setActiveNav('Dashboard')
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-bg-base)] text-[var(--color-text-body)] border border-[var(--color-border)] hover:bg-[var(--color-bg-muted)]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setCurrentView('employees')
                setActiveNav('Employees')
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                currentView === 'employees'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-bg-base)] text-[var(--color-text-body)] border border-[var(--color-border)] hover:bg-[var(--color-bg-muted)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Employee Master</span>
            </button>

            <button
              onClick={() => {
                if (isAdmin) {
                  setCurrentView('user-management')
                  setActiveNav('User Management')
                } else {
                  toast.error('Access Restricted', {
                    description: 'User Management portal is restricted to Administrators only.',
                  })
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                currentView === 'user-management'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-bg-base)] text-[var(--color-text-body)] border border-[var(--color-border)] hover:bg-[var(--color-bg-muted)]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>User Management {isAdmin ? '(Admin)' : '🔒'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">
              Tenant: <strong className="text-[var(--color-text-heading)]">{user.email}</strong>
            </span>
            <button
              onClick={() => {
                logout()
                setCurrentView('auth')
              }}
              className="text-xs font-medium text-[var(--color-danger)] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {renderCurrentView()}
      </main>

      <Toaster position="top-right" richColors />
    </div>
  )
}

export default App
