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
  const [industry, setIndustry] = useState('Information Technology')
  const [country, setCountry] = useState('India')
  const [currency, setCurrency] = useState('INR')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
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
        industry,
        country,
        currency,
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
        setError('Company registered successfully! Please sign in with your admin credentials.')
        setTimeout(() => onSwitchToLogin(), 1500)
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to register company. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pp-card w-full max-w-lg mx-auto shadow-md">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            Tenant Onboarding
          </span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-heading)]">Register Company</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Create your organization workspace and set up administrative owner access.
        </p>
      </div>

      {/* Error / Success Alert */}
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
        {/* Company Details Section */}
        <div className="space-y-3 pb-3 border-b border-[var(--color-border)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Organization Details
          </h3>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-heading)] mb-1">
              Company Name <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Software Solutions"
              className="pp-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-heading)] mb-1">
                Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Tech"
                className="pp-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-heading)] mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
                className="pp-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-heading)] mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="pp-input"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Administrator Details Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Admin Account Owner
          </h3>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-heading)] mb-1">
              Admin Email <span className="text-[var(--color-danger)]">*</span>
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
              Admin Password <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="••••••••••••"
              className="pp-input"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="pp-btn-primary w-full py-2.5 text-sm font-medium mt-3"
        >
          {loading ? 'Creating Company...' : 'Create Company & Setup Workspace'}
        </button>
      </form>

      {/* Switch back to Login */}
      <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)]">
        Already registered a company?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-[var(--color-primary)] hover:underline cursor-pointer ml-1"
        >
          Sign In Here
        </button>
      </div>
    </div>
  )
}
