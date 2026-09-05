import { useState } from 'react'
import { AuthPage } from './components/auth/AuthPage'
import { useAuthStore } from './store/auth.store'

function App() {
  const user = useAuthStore((s) => s.user)
  const companyId = useAuthStore((s) => s.companyId)
  const logout = useAuthStore((s) => s.logout)
  const [activeTab, setActiveTab] = useState<'auth' | 'workspace'>('auth')

  // If user is authenticated and clicks workspace or logs in
  if (user && activeTab === 'workspace') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-body)] p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Authenticated Workspace Header */}
          <div className="pp-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xl shadow-xs">
                P
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text-heading)]">
                  PeoplePay360 Workspace
                </h1>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Logged in as <strong className="text-[var(--color-text-heading)]">{user.email}</strong> ({user.role})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('auth')}
                className="pp-btn-ghost text-xs"
              >
                View Auth & Company Setup Page
              </button>
              <button
                onClick={logout}
                className="pp-btn-secondary text-xs"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Active Session Info */}
          <div className="pp-card-flat space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-text-heading)]">Active Session Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)] font-semibold block mb-1">User ID</span>
                <span className="font-mono text-[var(--color-text-heading)]">{user.id}</span>
              </div>
              <div className="p-3 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)] font-semibold block mb-1">Tenant Company ID</span>
                <span className="font-mono text-[var(--color-text-heading)]">{companyId || 'Default Tenant'}</span>
              </div>
              <div className="p-3 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)] font-semibold block mb-1">Assigned Role</span>
                <span className="pp-badge pp-badge-success">{user.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthPage
      onAuthComplete={() => setActiveTab('workspace')}
    />
  )
}

export default App
