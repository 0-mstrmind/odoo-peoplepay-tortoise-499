import React, { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAuth = useAuthStore((s) => s.setAuth)
  const setCompanyId = useAuthStore((s) => s.setCompanyId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await apiClient.post('/v1/auth/login', {
        email: email.trim(),
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
          role: user.role || 'employee',
        })
        if (user.companyId) {
          setCompanyId(user.companyId)
        }
        if (onLoginSuccess) onLoginSuccess()
      } else {
        setError('Invalid response received from authentication server.')
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please verify your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pp-card w-full max-w-md mx-auto shadow-md">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            HR Portal Access
          </span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-heading)]">Sign In</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Enter your work email and password to access your HR & Payroll workspace.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded bg-[var(--color-danger-bg)] border border-[var(--color-danger)] text-xs text-[#a00020] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold ml-2 text-sm">
            ×
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-heading)] mb-1">
            Work Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="pp-input"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-[var(--color-text-heading)]">
              Password
            </label>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault()
                alert('Please contact your administrator to reset your password.')
              }}
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="pp-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="pp-btn-primary w-full py-2.5 text-sm font-medium mt-2"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      {/* Switch to Company Creation */}
      <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)]">
        Don't have an active company workspace?{' '}
        <button
          type="button"
          onClick={onSwitchToCreateCompany}
          className="font-semibold text-[var(--color-primary)] hover:underline cursor-pointer ml-1"
        >
          Register New Company
        </button>
      </div>
    </div>
  )
}
