import React, { useState } from 'react'
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Zap,
  Building2,
  Check,
  X,
  FileText,
  AlertCircle,
  PlusCircle,
  CheckSquare,
} from 'lucide-react'
import { useAuthUser, useCompanyId, canAccessPayroll, canAccessUserManagement } from '@/store/auth.store'
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
  const [checkInState, setCheckInState] = useState<'checked_out' | 'checked_in'>('checked_out')

  const role = user?.role
  const isEmployee = role === 'employee'
  const isHRManager = role === 'hr_manager'
  const isPayrollAccess = canAccessPayroll(role)
  const isAdmin = canAccessUserManagement(role)

  const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length

  const handleApproveLeave = (id: string, name: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    )
    setActionFeedback(`Approved leave request for ${name}. Balance updated.`)
    setTimeout(() => setActionFeedback(null), 3500)
  }

  const handleRefuseLeave = (id: string, name: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'refused' } : r))
    )
    setActionFeedback(`Refused leave request for ${name}.`)
    setTimeout(() => setActionFeedback(null), 3500)
  }

  const handleToggleCheckIn = () => {
    if (checkInState === 'checked_out') {
      setCheckInState('checked_in')
      setActionFeedback('Clocked In successfully at ' + new Date().toLocaleTimeString())
    } else {
      setCheckInState('checked_out')
      setActionFeedback('Clocked Out successfully at ' + new Date().toLocaleTimeString())
    }
    setTimeout(() => setActionFeedback(null), 3500)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Welcome Header */}
      <div className="pp-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pp-badge pp-badge-neutral text-[10px] font-bold uppercase">
              {isEmployee
                ? 'Employee Portal'
                : isHRManager
                ? 'HR Operations'
                : isPayrollAccess
                ? 'HR & Payroll Operations'
                : 'Executive Management'}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              Tenant: <strong className="text-[var(--color-text-heading)]">{companyId || 'PeoplePay360'}</strong>
            </span>
          </div>
          <h1 className="text-xl font-black text-[var(--color-text-heading)] mb-1">
            Welcome back, {user?.name || user?.email || 'User'}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {isEmployee
              ? 'Track your daily attendance, view leave balances, and request time off.'
              : isHRManager
              ? 'Manage employee records, contracts, attendance logs, and time off approvals.'
              : isPayrollAccess
              ? 'Oversee HR operations, monthly payrun cycles, and salary rules.'
              : 'Full administrative control over multi-tenant platform configurations.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={onNavigateToUserManagement}
              className="pp-btn-primary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>User Access Management</span>
            </button>
          )}

          {!isEmployee && onNavigateToEmployees && (
            <button
              type="button"
              onClick={onNavigateToEmployees}
              className="pp-btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Employee Directory</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-[6px] text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{actionFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="p-1 text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Stat Cards (Role Specific) */}
      {isEmployee ? (
        /* Employee Personal Stat Cards */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="pp-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Days Worked (Sept)</span>
              <h3 className="text-xl font-extrabold text-[var(--color-text-heading)] mb-0">18 / 22</h3>
            </div>
          </div>

          <div className="pp-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Available Leave Balance</span>
              <h3 className="text-xl font-extrabold text-[var(--color-text-heading)] mb-0">14 Days</h3>
            </div>
          </div>

          <div className="pp-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Pending Time Off Requests</span>
              <h3 className="text-xl font-extrabold text-[var(--color-text-heading)] mb-0">1 Request</h3>
            </div>
          </div>
        </div>
      ) : (
        /* Manager / Admin Metric Stat Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="pp-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Active Employees</span>
              <h3 className="text-xl font-extrabold text-[var(--color-text-heading)] mb-0">
                {overviewData?.totalEmployees ?? 24}
              </h3>
            </div>
          </div>

          <div className="pp-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">On Leave Today</span>
              <h3 className="text-xl font-extrabold text-[var(--color-text-heading)] mb-0">3</h3>
            </div>
          </div>

          <div className="pp-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Pending Approvals</span>
              <h3 className="text-xl font-extrabold text-[var(--color-text-heading)] mb-0">
                {pendingCount}
              </h3>
            </div>
          </div>

          {isPayrollAccess ? (
            <div className="pp-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Est. Monthly Payroll</span>
                <h3 className="text-xl font-extrabold text-[var(--color-text-heading)] mb-0">
                  ${(overviewData?.payrollThisMonth ?? 48500).toLocaleString()}
                </h3>
              </div>
            </div>
          ) : (
            <div className="pp-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Departments Active</span>
                <h3 className="text-xl font-extrabold text-[var(--color-text-heading)] mb-0">4</h3>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid Content */}
      {isEmployee ? (
        /* Employee Attendance & Request Action Section */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Attendance Check-In Widget (8 cols) */}
          <div className="lg:col-span-8 pp-card space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                <h2 className="text-base font-bold text-[var(--color-text-heading)] mb-0">
                  Daily Attendance Check-In
                </h2>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">Today: September 5, 2026</span>
            </div>

            <div className="p-4 rounded-[6px] bg-[var(--color-bg-muted)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      checkInState === 'checked_in' ? 'bg-[#00C853] animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-sm font-bold text-[var(--color-text-heading)] capitalize">
                    Status: {checkInState === 'checked_in' ? 'Clocked In (Active)' : 'Clocked Out'}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Log your working hours to feed into monthly worked days calculation for payroll.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleCheckIn}
                className={`pp-btn text-xs py-2 px-5 font-bold rounded-[6px] inline-flex items-center gap-2 cursor-pointer ${
                  checkInState === 'checked_in'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-[#00C853] hover:bg-[#00a845] text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{checkInState === 'checked_in' ? 'Clock Out' : 'Clock In Now'}</span>
              </button>
            </div>

            <div className="pt-2 text-xs text-[var(--color-text-muted)]">
              <h4 className="font-semibold text-[var(--color-text-heading)] mb-2">Recent Attendance Logs</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded bg-[var(--color-bg-base)] border border-[var(--color-border)]">
                  <span>04 Sep 2026 (Yesterday)</span>
                  <span className="font-semibold text-[#00C853]">09:00 AM - 05:30 PM (8.5 hrs)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[var(--color-bg-base)] border border-[var(--color-border)]">
                  <span>03 Sep 2026</span>
                  <span className="font-semibold text-[#00C853]">08:55 AM - 05:15 PM (8.3 hrs)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Request Time Off Form (4 cols) */}
          <div className="lg:col-span-4 pp-card space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
              <PlusCircle className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="text-base font-bold text-[var(--color-text-heading)] mb-0">
                New Time Off Request
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                  Leave Type
                </label>
                <select className="pp-input text-xs w-full">
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Unpaid Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                  Start Date
                </label>
                <input type="date" className="pp-input text-xs w-full" defaultValue="2026-09-10" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                  End Date
                </label>
                <input type="date" className="pp-input text-xs w-full" defaultValue="2026-09-12" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setActionFeedback('Time Off Request submitted to HR Manager for approval.')
                  setTimeout(() => setActionFeedback(null), 3500)
                }}
                className="pp-btn-primary w-full text-xs py-2 font-bold flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Submit Request</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Manager / Admin Operational Dashboard Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Time Off Approvals Feed (8 cols) */}
          <div className="lg:col-span-8 pp-card space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                <h2 className="text-base font-bold text-[var(--color-text-heading)] mb-0">
                  Time Off Requests & Approvals
                </h2>
              </div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">
                {pendingCount} Pending Action
              </span>
            </div>

            <div className="space-y-3">
              {leaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-[6px] bg-[var(--color-bg-muted)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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

                  {/* Approve/Refuse Buttons for HR Manager & Admin */}
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
      )}

      {/* Payrun Cycle Status Banner (Visible for Payroll Users/Managers and Admin) */}
      {isPayrollAccess && (
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
              Salary formulas automatically deduct unpaid leave days from WORKED_DAYS context using RPN calculation rules.
            </p>
          </div>

          {!isEmployee && onNavigateToEmployees && (
            <button
              type="button"
              onClick={onNavigateToEmployees}
              className="pp-btn-secondary text-xs py-2 px-4 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <span>Open Employee Master</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}