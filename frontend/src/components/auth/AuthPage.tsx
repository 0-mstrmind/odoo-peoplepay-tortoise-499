import React, { useState } from 'react'
import { LoginCard } from './LoginCard'
import { CompanyCreationCard } from './CompanyCreationCard'

interface AuthPageProps {
  onAuthComplete?: () => void
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<'login' | 'create-company'>('login')

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-body)] flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Top Brand Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4 border-b border-[var(--color-border)] mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-lg shadow-sm">
            P
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-heading)] leading-none">
              PeoplePay360
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Multi-Tenant SaaS HR & Payroll Engine
            </p>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex items-center gap-2 bg-[var(--color-bg-muted)] p-1 rounded-lg">
          <button
            onClick={() => setMode('login')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-[var(--color-bg-base)] text-[var(--color-primary)] shadow-xs font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('create-company')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'create-company'
                ? 'bg-[var(--color-bg-base)] text-[var(--color-primary)] shadow-xs font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            Register Company
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto w-full my-auto py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Platform Feature Bullets */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="pp-badge pp-badge-neutral mb-3">
                Odoo Design Token System
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-heading)] tracking-tight">
                Enterprise HR & Payroll Automation
              </h2>
              <p className="text-base text-[var(--color-text-muted)] mt-3 leading-relaxed">
                Streamline employee contracts, attendance tracking, atomic time-off deductions, and complex multi-tenant salary engine calculations.
              </p>
            </div>

            {/* Key Capabilities */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✓
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-heading)]">
                    Multi-Tenant Company Scoping
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Strict company data isolation backed by PostgreSQL company_id relations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✓
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-heading)]">
                    Role-Based Access Control (RBAC)
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Fine-grained roles for Admins, HR Managers, Payroll Specialists, and Employees.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✓
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-heading)]">
                    Automated Leave Balance & Payslips
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Atomic database deductions with automated Resend email dispatches.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Form Card (Login or Register Company) */}
          <div className="lg:col-span-6">
            {mode === 'login' ? (
              <LoginCard
                onSwitchToCreateCompany={() => setMode('create-company')}
                onLoginSuccess={onAuthComplete}
              />
            ) : (
              <CompanyCreationCard
                onSwitchToLogin={() => setMode('login')}
                onSuccess={onAuthComplete}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-8 border-t border-[var(--color-border)] mt-8 text-center text-xs text-[var(--color-text-muted)] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>PeoplePay360 — HR & Payroll Platform</span>
        <span>Built with React + Vite + Odoo Design Tokens</span>
      </footer>
    </div>
  )
}
