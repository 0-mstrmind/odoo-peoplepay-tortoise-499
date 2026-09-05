import React, { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import apiClient from '@/lib/axios'

interface LoginViewProps {
  onSuccess?: () => void
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAuth = useAuthStore((s) => s.setAuth)
  const setCompanyId = useAuthStore((s) => s.setCompanyId)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Call backend login endpoint
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
        if (onSuccess) onSuccess()
      } else {
        setError('Invalid response from auth server.')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Quick preset helper for demo/testing
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('password')
  }

  return (
    <div className="w-full max-w-md mx-auto bg-[#181b24] border border-[#2a2e3d] rounded-2xl p-7 text-white shadow-2xl">
      {/* Header Badge & Title */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#232734] border border-[#33384a] text-xs font-semibold text-gray-300 mb-3">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          HR Portal
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
        <p className="text-sm text-gray-400 mt-1">Sign in to continue to your workspace.</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Work Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full bg-[#101218] border border-[#2e3344] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-gray-300">
              Password
            </label>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault()
                alert('Contact your system administrator to reset your password.')
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
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
            className="w-full bg-[#101218] border border-[#2e3344] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-150 shadow-md shadow-blue-900/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Signing In...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Demo Credentials Helper */}
      <div className="mt-5 pt-4 border-t border-[#262a38]">
        <div className="text-[11px] text-gray-400 font-medium mb-2">Quick Demo Role Switcher:</div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickLogin('dchandrap973@gmail.com')}
            className="text-[11px] px-2 py-1 rounded bg-[#202432] hover:bg-[#2a2f42] text-blue-300 border border-[#30364c] cursor-pointer"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('payroll.user@peoplepay360.com')}
            className="text-[11px] px-2 py-1 rounded bg-[rgba(113,72,103,0.2)] hover:bg-[rgba(113,72,103,0.3)] text-[var(--color-primary)] font-semibold border border-[rgba(113,72,103,0.4)] cursor-pointer"
          >
            HR Payroll User
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('payroll.manager@peoplepay360.com')}
            className="text-[11px] px-2 py-1 rounded bg-[#202432] hover:bg-[#2a2f42] text-purple-300 border border-[#30364c] cursor-pointer"
          >
            HR Payroll Manager
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('hr.manager@peoplepay360.com')}
            className="text-[11px] px-2 py-1 rounded bg-[#202432] hover:bg-[#2a2f42] text-emerald-300 border border-[#30364c] cursor-pointer"
          >
            HR Manager
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('rahul.employee@peoplepay360.com')}
            className="text-[11px] px-2 py-1 rounded bg-[#202432] hover:bg-[#2a2f42] text-gray-400 border border-[#30364c] cursor-pointer"
          >
            Employee
          </button>
        </div>
      </div>

      {/* Captions */}
      <div className="mt-6 pt-4 border-t border-[#262a38] text-center space-y-2">
        <p className="text-xs text-gray-400">Accounts are created by an administrator.</p>
        <p className="text-[11px] text-gray-500 italic bg-[#12141c] p-2 rounded border border-[#232734]">
          After sign-in, show only the modules and actions allowed by the user's assigned role.
        </p>
      </div>
    </div>
  )
}
