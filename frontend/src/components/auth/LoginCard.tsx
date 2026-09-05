import React, { useState } from 'react'
import { Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react'
import { useAuthStore, type UserRole } from '@/store/auth.store'
import apiClient from '@/lib/axios'

interface LoginCardProps {
  onSwitchToCreateCompany: () => void
  onLoginSuccess?: () => void
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onSwitchToCreateCompany,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAuth = useAuthStore((s) => s.setAuth)
  const setCompanyId = useAuthStore((s) => s.setCompanyId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      })

      const data = response.data?.data || response.data
      const token = data.accessToken || data.token
      const user = data.user

      if (token && user) {
        setAuth(token, {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          role: (user.role as UserRole) || 'employee',
        })
        if (user.companyId) {
          setCompanyId(user.companyId)
        }
        onLoginSuccess?.()
      } else {
        setError('Unexpected response from authentication server.')
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (!err.response) {
        setError('Cannot connect to backend server. Ensure backend is running on http://localhost:4000')
      } else {
        setError('Invalid email or password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pp-card w-full max-w-md mx-auto shadow-md border border-[var(--color-border)] p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-[6px] bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shadow-2xs">
            P
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
            PeoplePay360 ERP
          </span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-heading)] leading-tight">
          Sign In
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Enter your corporate credentials to access your workspace.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-[4px] bg-[rgba(255,23,68,0.08)] border border-[rgba(255,23,68,0.25)] text-xs text-[#a00020] flex items-start gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF1744]" />
          <div className="flex-1">
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-bold text-sm leading-none text-[#a00020] hover:opacity-75 cursor-pointer ml-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-heading)] mb-1">
            Work Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="pp-input text-sm rounded-[4px] w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-heading)] mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pp-input text-sm rounded-[4px] w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] p-1 rounded cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="pp-btn-primary w-full py-2.5 text-sm font-semibold rounded-[4px] shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          <KeyRound className="w-4 h-4" />
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)]">
        Need a new company workspace?{' '}
        <button
          type="button"
          onClick={onSwitchToCreateCompany}
          className="font-semibold text-[var(--color-primary)] hover:underline cursor-pointer ml-1"
        >
          Register Company
        </button>
      </div>
    </div>
  )
}