import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import './App.css'
import { Navbar } from './components/layout/Navbar'
import { EmployeesPage } from './components/employees/EmployeesPage'
import { AuthPage } from './components/auth/AuthPage'
import { useAuthStore } from './store/auth.store'

function App() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [activeNav, setActiveNav] = useState('Employees')
  const [currentView, setCurrentView] = useState<'workspace' | 'auth'>('workspace')

  const handleNavigate = (item: string) => {
    const mainItem = item.split(' / ')[0]
    setActiveNav(mainItem)
    if (item === 'Sign Out') {
      logout()
      toast.info('Signed out successfully')
      return
    }
    if (item === 'Auth / Setup') {
      setCurrentView('auth')
      return
    }
    if (mainItem !== 'Employees') {
      toast.info(`Navigated to ${item}`, {
        description: 'Module views are linked to PeoplePay360 ERP.',
        duration: 2500,
      })
    }
  }

  // If in Auth & Company Setup View
  if (currentView === 'auth') {
    return (
      <div className="relative min-h-screen bg-[var(--color-bg-base)]">
        {/* Switch back to Workspace button */}
        <div className="absolute top-4 right-4 z-50">
          <button
            type="button"
            onClick={() => setCurrentView('workspace')}
            className="pp-btn-secondary text-xs px-3 py-1.5 shadow-xs cursor-pointer"
          >
            Go to Workspace &rarr;
          </button>
        </div>

        <AuthPage onAuthComplete={() => setCurrentView('workspace')} />
        <Toaster position="top-right" richColors />
      </div>
    )
  }

  // Workspace View: Navbar (without HR logo as strictly requested) + EmployeesPage
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
        onOpenAuth={() => setCurrentView('auth')}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        <EmployeesPage />
      </div>

      <Toaster position="top-right" richColors />
    </div>
  )
}

export default App

