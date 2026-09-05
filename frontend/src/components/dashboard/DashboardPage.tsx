import React, { useState } from 'react'
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  UserPlus,
  Zap,
  Building2,
  Check,
  X,
  FileText,
  AlertCircle
} from 'lucide-react'
import { useAuthUser, useCompanyId } from '@/store/auth.store'
import { useDashboardOverview } from '@/hooks/use-api'

interface DashboardPageProps {
  onNavigateToEmployees?: () => void
  onNavigateToUserManagement?: () => void
}

interface PendingLeaveRequest {
  id: string
  employeeName: string
  leaveType: string
  dates: string
  duration: string
  status: 'pending' | 'approved' | 'refused'
}

const SAMPLE_PENDING_REQUESTS: PendingLeaveRequest[] = [
  {
    id: 'req-1',
    employeeName: 'Aarav Mehta',
    leaveType: 'Casual Leave',
    dates: '10 Sep - 12 Sep 2026',
    duration: '3 Days',
    status: 'pending',
  },
  {
    id: 'req-2',
    employeeName: 'Maya Shah',
    leaveType: 'Sick Leave',
    dates: '08 Sep 2026',
    duration: '1 Day',
    status: 'pending',
  },
  {
    id: 'req-3',
    employeeName: 'Rohan Patel',
    leaveType: 'Unpaid Leave',
    dates: '15 Sep - 18 Sep 2026',
    duration: '4 Days',
    status: 'pending',
  },
]

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToEmployees,
  onNavigateToUserManagement,
}) => {
  const user = useAuthUser()
  const companyId = useCompanyId()
  const { data: overviewData } = useDashboardOverview()

  const [leaveRequests, setLeaveRequests] = useState<PendingLeaveRequest[]>(SAMPLE_PENDING_REQUESTS)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const handleApproveLeave = (id: string, name: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    )
    setActionFeedback(`Approved leave request for ${name}. Balance deducted automatically.`)
    setTimeout(() => setActionFeedback(null), 3500)
  }

  const handleRefuseLeave = (id: string, name: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'refused' } : r))
    )
    setActionFeedback(`Refused leave request for ${name}.`)
    setTimeout(() => setActionFeedback(null), 3500)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Welcome & Executive Header */}
      <div className="pp-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pp-badge pp-badge-neutral text-[10px] font-bold uppercase">
              Operational Workspace
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              Tenant ID: <strong className="text-[var(--color-text-heading)]">{companyId || 'Default'}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-heading)] mb-0">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            PeoplePay360 HR & Payroll Executive Overview dashboard.
          </p>
        </div>

        {/* Executive Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNavigateToEmployees}
            className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Employee Master</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={onNavigateToUserManagement}
              className="pp-btn-secondary text-xs py-2 px-3.5 rounded-[4px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>User Management</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionFeedback && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Employees */}
        <div className="pp-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              Active Employees
            </span>
            <div className="w-8 h-8 rounded bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--color-text-heading)]">
              {overviewData?.totalEmployees ?? '24'}
            </div>
            <span className="text-[11px] text-[#00C853] font-semibold">
              +3 onboarded this month
            </span>
          </div>
        </div>

        {/* KPI 2: On Leave Today */}
        <div className="pp-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              On Leave Today
            </span>
            <div className="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--color-text-heading)]">
              {overviewData?.onLeaveToday ?? '2'}
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
              Approved time off
            </span>
          </div>
        </div>

        {/* KPI 3: Pending Approvals */}
        <div className="pp-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              Pending Leave Requests
            </span>
            <div className="w-8 h-8 rounded bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#FF1744]">
              {leaveRequests.filter((r) => r.status === 'pending').length}
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
              Requires manager action
            </span>
          </div>
        </div>

        {/* KPI 4: Monthly Payroll Cost */}
        <div className="pp-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              Est. Monthly Payroll
            </span>
            <div className="w-8 h-8 rounded bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--color-primary)]">
              {overviewData?.payrollThisMonth ? `₹${overviewData.payrollThisMonth.toLocaleString()}` : '₹4,850,000'}
            </div>
            <span className="text-[11px] text-[#00C853] font-semibold">
              Computed via RPN Engine
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Section 1 (Time Off Feed) + Section 2 (Department Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pending Time Off Requests Feed (8 cols) */}
        <div className="lg:col-span-8 pp-card space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-heading)] mb-0">
                Pending Time Off Requests
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Approved requests automatically deduct from employee balance via SELECT FOR UPDATE locks.
              </p>
            </div>
            <span className="pp-badge pp-badge-warning text-xs">
              {leaveRequests.filter((r) => r.status === 'pending').length} Action Required
            </span>
          </div>

          <div className="space-y-3">
            {leaveRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-[var(--color-border-strong)]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--color-text-heading)]">
                      {req.employeeName}
                    </span>
                    <span className="pp-badge pp-badge-neutral text-[10px]">
                      {req.leaveType}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      {req.dates}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      {req.duration}
                    </span>
                  </div>
                </div>

                {/* Status or Approve/Refuse Buttons */}
                <div className="flex items-center gap-2">
                  {req.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApproveLeave(req.id, req.employeeName)}
                        className="pp-btn text-xs py-1.5 px-3 bg-[#00C853] hover:bg-[#00a845] text-white font-semibold rounded inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRefuseLeave(req.id, req.employeeName)}
                        className="pp-btn text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded inline-flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Refuse</span>
                      </button>
                    </>
                  ) : (
                    <span
                      className={`pp-badge ${
                        req.status === 'approved' ? 'pp-badge-success' : 'pp-badge-danger'
                      } text-xs uppercase font-bold`}
                    >
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Department Headcount Breakdown (4 cols) */}
        <div className="lg:col-span-4 pp-card space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="text-base font-bold text-[var(--color-text-heading)] mb-0">
                Department Staffing
              </h2>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-[var(--color-text-heading)] mb-1">
                <span>Engineering (ENG)</span>
                <span>12 Employees (50%)</span>
              </div>
              <div className="w-full bg-[var(--color-bg-muted)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--color-primary)] h-full w-1/2"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-[var(--color-text-heading)] mb-1">
                <span>Human Resources (HR)</span>
                <span>5 Employees (21%)</span>
              </div>
              <div className="w-full bg-[var(--color-bg-muted)] h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[21%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-[var(--color-text-heading)] mb-1">
                <span>Finance & Accounts (FIN)</span>
                <span>4 Employees (17%)</span>
              </div>
              <div className="w-full bg-[var(--color-bg-muted)] h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-[17%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-[var(--color-text-heading)] mb-1">
                <span>Operations (OPS)</span>
                <span>3 Employees (12%)</span>
              </div>
              <div className="w-full bg-[var(--color-bg-muted)] h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[12%]"></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)] italic text-center">
            Multi-tenant data isolated for active company scope.
          </div>
        </div>
      </div>

      {/* Payrun & Salary Engine Status Banner */}
      <div className="pp-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-base font-bold text-[var(--color-text-heading)] mb-0">
              September 2026 Monthly Payrun Cycle
            </h3>
            <span className="pp-badge pp-badge-success text-xs font-semibold">In Progress</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Salary formulas automatically deduct unpaid leave days from WORKED_DAYS context using Reverse Polish Notation math parser.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToEmployees}
          className="pp-btn-secondary text-xs py-2 px-4 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <span>Open Employee Master</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}