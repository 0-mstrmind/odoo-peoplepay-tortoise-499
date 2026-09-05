import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LoginCard } from './LoginCard'
import { CompanyCreationCard } from './CompanyCreationCard'

interface AuthPageProps {
  onAuthComplete?: () => void
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<'login' | 'create-company'>('login')
  const navigate = useNavigate()
  const location = useLocation()

  const handleSuccess = () => {
    if (onAuthComplete) {
      onAuthComplete()
    } else {
      const origin = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(origin, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-body)] flex flex-col justify-between p-4 font-sans">
      {/* Top Header */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-base shadow-xs group-hover:scale-105 transition-transform">
            P
          </div>
          <span className="text-lg font-bold text-[var(--color-text-heading)] group-hover:text-[var(--color-primary)] transition-colors">
            PeoplePay360
          </span>
        </Link>

        <div className="flex items-center gap-1 bg-[var(--color-bg-muted)] p-1 rounded-lg">
          <button
            onClick={() => setMode('login')}
            className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
              mode === 'login'
                ? 'bg-[var(--color-bg-base)] text-[var(--color-primary)] font-bold shadow-xs'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('create-company')}
            className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
              mode === 'create-company'
                ? 'bg-[var(--color-bg-base)] text-[var(--color-primary)] font-bold shadow-xs'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            Register
          </button>
        </div>
      </header>

      {/* Centered Form */}
      <main className="my-auto py-6">
        {mode === 'login' ? (
          <LoginCard
            onSwitchToCreateCompany={() => setMode('create-company')}
            onLoginSuccess={handleSuccess}
          />
        ) : (
          <CompanyCreationCard
            onSwitchToLogin={() => setMode('login')}
            onSuccess={handleSuccess}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-[var(--color-text-muted)]">
        PeoplePay360 ERP Platform
      </footer>
    </div>
  )
}