import React, { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import apiClient from '@/lib/axios'

interface CompanyCreationCardProps {
  onSwitchToLogin: () => void
  onSuccess?: () => void
}

export const CompanyCreationCard: React.FC<CompanyCreationCardProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const [name, setName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
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
      const response = await apiClient.post('/v1/companies', {
        name: name.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword,
      })

      const data = response.data?.data || response.data
      const { accessToken, company, adminUser } = data

      if (accessToken && company && adminUser) {
        setAuth(accessToken, {
          id: adminUser.id,
          email: adminUser.email,
          name: adminEmail.split('@')[0],
          role: 'admin',
        })
        setCompanyId(company.id)
        if (onSuccess) onSuccess()
      } else {
        onSwitchToLogin()
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to API server. Ensure backend dev server is running on port 3000.')
      } else {
        setError(err.response?.data?.message || 'Failed to register company')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pp-card w-full max-w-sm mx-auto shadow-sm">
      <h2 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Register Company</h2>

      {error && (
        <div className="mb-4 p-2.5 rounded bg-[var(--color-danger-bg)] text-xs text-[#a00020] flex items-center justify-between font-medium">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold text-sm">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-heading)] mb-1">
            Company Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            className="pp-input"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-heading)] mb-1">
            Admin Email
          </label>
          <input
            type="email"
            required
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@company.com"
            className="pp-input"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-heading)] mb-1">
            Admin Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="••••••••"
              className="pp-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] p-1 rounded focus:outline-none"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                // Eye Off Icon
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.88 9.88a3 3 0 104.24 4.24M10.73 5.08A10.43 10.43 0 0112 5c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 01-4.24-4.24M3 3l18 18" />
                </svg>
              ) : (
                // Eye Icon
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="pp-btn-primary w-full py-2 text-sm font-medium mt-1"
        >
          {loading ? 'Creating...' : 'Create Company'}
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)]">
        Already registered?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-[var(--color-primary)] hover:underline cursor-pointer ml-1"
        >
          Sign In
        </button>
      </div>
    </div>
  )
}
