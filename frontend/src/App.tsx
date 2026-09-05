import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { Users, ShieldCheck } from 'lucide-react'
import './App.css'
import { Navbar } from './components/layout/Navbar'
import { EmployeesPage } from './components/employees/EmployeesPage'
import { UserManagementView } from './components/auth/UserManagementView'
import { AuthPage } from './components/auth/AuthPage'
import { useAuthStore } from './store/auth.store'

function App() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [activeNav, setActiveNav] = useState('Employees')
  const [currentView, setCurrentView] = useState<'employees' | 'user-management' | 'auth'>('employees')

  const handleNavigate = (item: string) => {
    const mainItem = item.split(' / ')[0]
    setActiveNav(mainItem)

    if (item === 'Sign Out') {
      logout()
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
    if (mainItem === 'Employees') {
      setCurrentView('employees')
      return
    }

    toast.info(`Navigated to ${item}`, {
      description: 'Module views are linked to PeoplePay360 ERP.',
      duration: 2500,
    })
  }

  // If in Auth & Company Setup View
  if (currentView === 'auth') {
    return (
      <div className="relative min-h-screen bg-[var(--color-bg-base)]">
        <div className="absolute top-4 right-4 z-50">
          <button
            type="button"
            onClick={() => setCurrentView('employees')}
            className="pp-btn-secondary text-xs px-3 py-1.5 shadow-xs cursor-pointer"
          >
            Go to Workspace &rarr;
          </button>
        </div>

        <AuthPage onAuthComplete={() => setCurrentView('user-management')} />
        <Toaster position="top-right" richColors />
      </div>
    )
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
          toast.info('Signed out successfully')
        }}
        onOpenAuth={() => setCurrentView('auth')}
      />

      {/* Module Switcher Bar (Employees vs User Management) */}
      <div className="bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
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
                setCurrentView('user-management')
                setActiveNav('User Management')
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                currentView === 'user-management'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-bg-base)] text-[var(--color-text-body)] border border-[var(--color-border)] hover:bg-[var(--color-bg-muted)]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>User Management (Admin Only)</span>
            </button>
          </div>

          <button
            onClick={() => setCurrentView('auth')}
            className="text-xs font-medium text-[var(--color-primary)] hover:underline cursor-pointer"
          >
            Auth & Company Setup &rarr;
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {currentView === 'user-management' ? (
          <UserManagementView />
        ) : (
          <EmployeesPage />
        )}
      </main>

      <Toaster position="top-right" richColors />
    </div>
  )
}

export default App
