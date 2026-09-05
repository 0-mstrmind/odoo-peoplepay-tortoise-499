import React from 'react'
import { Users, Shield, CheckCircle2, ArrowRight, Activity } from 'lucide-react'
import { useAuthUser, useCompanyId } from '@/store/auth.store'
import { useDashboardOverview } from '@/hooks/use-api'

interface DashboardPageProps {
  onNavigateToEmployees?: () => void
}

const ROLE_DEFINITIONS: Record<
  string,
  { title: string; badge: string; description: string; features: string[] }
> = {
  admin: {
    title: 'Admin Dashboard',
    badge: 'Full Platform Access',
    description: 'Complete administration and governance across all modules and tenants.',
    features: [
      'Full access to all modules and models across the platform',
      'User management, role assignment, permission updates, and complete system administration',
      'Tenant company configuration and compliance settings',
      'Database health, caching status, and audit governance',
    ],
  },
  super_admin: {
    title: 'Admin Dashboard',
    badge: 'Full Platform Access',
    description: 'Complete administration and governance across all modules and tenants.',
    features: [
      'Full access to all modules and models across the platform',
      'User management, role assignment, permission updates, and complete system administration',
      'Tenant company configuration and compliance settings',
      'Database health, caching status, and audit governance',
    ],
  },
  hr_manager: {
    title: 'HR Manager Dashboard',
    badge: 'Human Resources Administration',
    description: 'Operational management of employee records, attendance, contracts, and leave.',
    features: [
      'Full CRUD access to Employees, Attendance, Contracts, Working Schedules, and Time Off modules',
      'Approve or refuse Time Off Requests, with no access to payroll features',
      'Employee onboarding, lifecycle events, and contract renewals',
      'Department staffing and working schedule administration',
    ],
  },
  hr_payroll_manager: {
    title: 'HR Payroll Manager Dashboard',
    badge: 'Full HR & Payroll Control',
    description: 'End-to-end administration of human resources, salary computation, and payruns.',
    features: [
      'All HR Payroll User permissions with full CRUD access to Payruns, Payslips, Salary Structures, and Salary Rules',
      'Full control over HR and payroll-related records and configurations',
      'Salary rule formulation and batch payrun computation/validation',
      'Disbursement verification and payroll warning resolutions',
    ],
  },
  payroll_manager: {
    title: 'HR Payroll Manager Dashboard',
    badge: 'Full HR & Payroll Control',
    description: 'End-to-end administration of human resources, salary computation, and payruns.',
    features: [
      'All HR Payroll User permissions with full CRUD access to Payruns, Payslips, Salary Structures, and Salary Rules',
      'Full control over HR and payroll-related records and configurations',
      'Salary rule formulation and batch payrun computation/validation',
      'Disbursement verification and payroll warning resolutions',
    ],
  },
  hr_payroll_user: {
    title: 'HR Payroll User Dashboard',
    badge: 'HR & Payroll Operations',
    description: 'Operational payrun calculation with read-only salary structure access.',
    features: [
      'All HR Manager permissions plus Create, Read, and Update access to Payruns and Payslips',
      'Read-only access to Salary Structures and Salary Rules',
      'Time off approval and attendance tracking access',
      'Payslip generation and verification',
    ],
  },
  employee: {
    title: 'Employee Dashboard',
    badge: 'Employee Self-Service',
    description: 'Self-service portal for personal employment, time off, and attendance.',
    features: [
      'View own employee details, attendance records, and leave balances',
      'Create attendance entries and Time Off Requests, with no payroll or HR administration access',
      'View and download approved personal payslips',
      'Self-service personal information updates',
    ],
  },
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToEmployees }) => {
  const user = useAuthUser()
  const companyId = useCompanyId()

  // Live backend overview query (matches Redis caching on backend)
  const { data: overviewData } = useDashboardOverview()

  const roleKey = user?.role ? user.role.toLowerCase() : 'employee'
  const config = ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS.employee

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6">
      {/* Title & Role Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="pp-badge pp-badge-neutral text-[11px] font-bold uppercase tracking-wider">
              {config.badge}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              Logged in as <strong className="text-[var(--color-text-heading)]">{user?.email}</strong>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-heading)] mt-1 mb-0 leading-tight">
            {config.title}
          </h1>

          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {config.description}
          </p>
        </div>

        {/* Action button to already-made Employees page */}
        {roleKey !== 'employee' && (
          <div className="self-start sm:self-auto">
            <button
              type="button"
              onClick={onNavigateToEmployees}
              className="pp-btn-primary text-xs py-2 px-4 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Go to Employee Directory &rarr;</span>
            </button>
          </div>
        )}
      </div>

      {/* Backend Live Metrics (if available from /dashboard/overview) */}
      {overviewData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="pp-card p-4">
            <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">Total Employees</span>
            <p className="text-2xl font-bold text-[var(--color-text-heading)] mt-1">
              {overviewData.totalEmployees ?? '--'}
            </p>
          </div>
          <div className="pp-card p-4">
            <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">On Leave Today</span>
            <p className="text-2xl font-bold text-[var(--color-text-heading)] mt-1">
              {overviewData.onLeaveToday ?? '--'}
            </p>
          </div>
          <div className="pp-card p-4">
            <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">Pending Approvals</span>
            <p className="text-2xl font-bold text-[#FFB300] mt-1">
              {overviewData.pendingApprovals ?? '--'}
            </p>
          </div>
          <div className="pp-card p-4">
            <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">Monthly Payroll</span>
            <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">
              {overviewData.payrollThisMonth ? `₹${overviewData.payrollThisMonth.toLocaleString()}` : 'Computed'}
            </p>
          </div>
        </div>
      )}

      {/* Active Session & Role Governance Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Role Permissions & Feature Scope Card */}
        <div className="md:col-span-2 pp-card space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="text-base font-bold text-[var(--color-text-heading)] mb-0">
                Authorized Role Permissions
              </h2>
            </div>
            <span className="pp-badge pp-badge-success text-xs font-semibold">Active Session</span>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            Features available for your account based on PeoplePay360 Role-Based Access Control (RBAC):
          </p>

          <ul className="space-y-2.5 pt-1">
            {config.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-[var(--color-text-body)]">
                <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Session Metadata Card */}
        <div className="pp-card space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
            <Activity className="w-4 h-4 text-[var(--color-primary)]" />
            <h2 className="text-base font-bold text-[var(--color-text-heading)] mb-0">
              Account Metadata
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded-[4px] bg-[var(--color-bg-muted)]">
              <span className="text-[var(--color-text-muted)] block mb-0.5 font-medium">Assigned Role</span>
              <span className="font-bold text-[var(--color-text-heading)] uppercase">{user?.role}</span>
            </div>

            <div className="p-2.5 rounded-[4px] bg-[var(--color-bg-muted)]">
              <span className="text-[var(--color-text-muted)] block mb-0.5 font-medium">User Identifier</span>
              <span className="font-mono text-[var(--color-text-heading)] break-all text-[11px]">{user?.id}</span>
            </div>

            <div className="p-2.5 rounded-[4px] bg-[var(--color-bg-muted)]">
              <span className="text-[var(--color-text-muted)] block mb-0.5 font-medium">Tenant Company ID</span>
              <span className="font-mono text-[var(--color-text-heading)] break-all text-[11px]">
                {companyId || 'Default Company'}
              </span>
            </div>

            <div className="p-2.5 rounded-[4px] bg-[var(--color-bg-muted)]">
              <span className="text-[var(--color-text-muted)] block mb-0.5 font-medium">Backend REST Status</span>
              <span className="text-[#00C853] font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00C853]" />
                Connected (http://localhost:4000/api/v1)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Module Navigation to made pages */}
      <div className="pp-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-heading)] mb-1">
            Explore Employee Directory
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            View employee master records in wireframe Kanban grid and tabular data list.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToEmployees}
          className="pp-btn-secondary text-xs py-2 px-4 rounded-[4px] font-semibold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span>Open Employee Master</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}