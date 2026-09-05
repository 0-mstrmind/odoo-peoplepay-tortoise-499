import React, { useState } from 'react'
import {
  Building2,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Briefcase,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
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
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [phone, setPhone] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAuth = useAuthStore((s) => s.setAuth)
  const setCompanyId = useAuthStore((s) => s.setCompanyId)

  // Live slug derived from company name
  const suggestedSlug = name
    ? name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    : 'your-company-slug'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter a valid company name.')
      return
    }
    if (!adminEmail.trim()) {
      setError('Please enter an admin email address.')
      return
    }
    if (!adminPassword || adminPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    try {
      const response = await apiClient.post('/companies', {
        name: name.trim(),
        slug: suggestedSlug,
        industry,
        country,
        currency,
        timezone,
        phone: phone.trim() || undefined,
        adminEmail: adminEmail.trim().toLowerCase(),
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
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (!err.response) {
        setError('Cannot connect to backend server. Ensure backend dev server is running on port 3000.')
      } else {
        setError('Failed to register company. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pp-card w-full max-w-lg mx-auto shadow-md border border-[var(--color-border)] p-6 sm:p-8 rounded-[8px]">
      {/* Header & Branding */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-[6px] bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-sm shadow-2xs">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-primary)] block leading-none">
              PeoplePay360 Multi-Tenant ERP
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
              Enterprise HR & Payroll Provisioning
            </span>
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-[var(--color-text-heading)] leading-tight mt-3">
          Register Company Workspace
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Configure your multi-tenant organization details and administrative credentials.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 p-3 rounded-[4px] bg-[rgba(255,23,68,0.08)] border border-[rgba(255,23,68,0.25)] text-xs text-[#a00020] flex items-start gap-2 font-medium">
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
        {/* Section 1: Company Profile */}
        <div className="space-y-3.5 pt-1">
          <div className="flex items-center gap-1.5 pb-1 border-b border-[var(--color-border)]">
            <Briefcase className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-heading)]">
              Company Identity
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Innovations Pvt Ltd"
              className="pp-input text-sm rounded-[4px] w-full"
            />
            {name && (
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
                <span>Workspace URL slug:</span>
                <code className="px-1.5 py-0.5 rounded bg-[var(--color-bg-muted)] text-[var(--color-primary)] font-mono text-[10px]">
                  {suggestedSlug}
                </code>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Industry Domain
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="pp-input text-sm rounded-[4px] w-full"
              >
                <option value="Information Technology">Information Technology</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                <option value="Education & EdTech">Education & EdTech</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="pp-input text-sm rounded-[4px] w-full"
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Singapore">Singapore</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Payroll Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="pp-input text-sm rounded-[4px] w-full"
              >
                <option value="INR">INR (₹ - Rupee)</option>
                <option value="USD">USD ($ - Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - Pound)</option>
                <option value="AED">AED (د.إ - Dirham)</option>
                <option value="SGD">SGD (S$ - SGD Dollar)</option>
                <option value="CAD">CAD (C$ - CAD Dollar)</option>
                <option value="AUD">AUD (A$ - AUD Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="pp-input text-sm rounded-[4px] w-full"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
              Work Contact Phone (Optional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="pp-input text-sm rounded-[4px] w-full"
            />
          </div>
        </div>

        {/* Section 2: Administrator Credentials */}
        <div className="space-y-3.5 pt-3">
          <div className="flex items-center gap-1.5 pb-1 border-b border-[var(--color-border)]">
            <KeyRound className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-heading)]">
              Super Admin Credentials
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
              Admin Work Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@company.com"
              className="pp-input text-sm rounded-[4px] w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
              Admin Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
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
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Minimum 6 characters. Grants full administrative privileges over the tenant.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={loading}
            className="pp-btn-primary w-full py-2.5 text-sm font-semibold rounded-[4px] shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Company Workspace...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Register & Launch Workspace</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer Switcher */}
      <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)]">
        Already registered your company?{' '}
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
