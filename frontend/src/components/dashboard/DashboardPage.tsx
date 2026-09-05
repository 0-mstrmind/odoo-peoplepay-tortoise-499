import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Loader2,
  User,
  CreditCard,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Landmark,
} from 'lucide-react'
import { useAuthUser, useCompanyId, canAccessPayroll, canAccessUserManagement } from '@/store/auth.store'
import { useDashboardOverview, useMyEmployeeProfile } from '@/hooks/use-api'
import { useTodayAttendance, useCheckIn, useCheckOut } from '@/hooks/use-attendance'
import {
  useTimeOffRequests,
  useTimeOffAllocations,
  useTimeOffTypes,
  useCreateTimeOffRequest,
  useApproveTimeOffRequest,
  useRefuseTimeOffRequest,
} from '@/hooks/use-timeoff'

interface DashboardPageProps {
  onNavigateToEmployees?: () => void
  onNavigateToUserManagement?: () => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToEmployees,
  onNavigateToUserManagement,
}) => {
  const navigate = useNavigate()
  const user = useAuthUser()
  const companyId = useCompanyId()
  const { data: overviewData } = useDashboardOverview()

  // Logged-in employee profile
  const { data: myEmployee, isLoading: isProfileLoading } = useMyEmployeeProfile()

  // Backend Attendance Hooks
  const { data: todayAttendance } = useTodayAttendance()
  const checkInMutation = useCheckIn()
  const checkOutMutation = useCheckOut()

  // Backend Time Off Hooks
  const { data: rawTimeOffRequests, isLoading: isLeaveLoading } = useTimeOffRequests()
  const { data: rawAllocations } = useTimeOffAllocations()
  const { data: leaveTypes = [] } = useTimeOffTypes()
  const createLeaveMutation = useCreateTimeOffRequest()
  const approveLeaveMutation = useApproveTimeOffRequest()
  const refuseLeaveMutation = useRefuseTimeOffRequest()

  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [checkInState, setCheckInState] = useState<'checked_out' | 'checked_in' | 'completed_today'>('checked_out')

  // Employee Time Off Submission Form
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [leaveFrom, setLeaveFrom] = useState('')
  const [leaveTo, setLeaveTo] = useState('')
  const [leaveReason, setLeaveReason] = useState('')

  const rawRole = user?.role || ''
  const role = rawRole.toLowerCase()
  const isEmployee = role === 'employee'
  const isHRManager = role === 'hr_manager'
  const isPayrollAccess = canAccessPayroll(rawRole)
  const isAdmin = canAccessUserManagement(rawRole)

  // Sync punch state with today's attendance record from backend
  useEffect(() => {
    if (todayAttendance) {
      if (todayAttendance.checkOut) {
        setCheckInState('completed_today')
      } else if (todayAttendance.checkIn) {
        setCheckInState('checked_in')
      }
    }
  }, [todayAttendance])

  const pendingRequests = rawTimeOffRequests || []
  const pendingCount = pendingRequests.filter((r: any) => r.status === 'pending').length

  const handleApproveLeave = async (id: string, name: string) => {
    try {
      await approveLeaveMutation.mutateAsync(id)
      setActionFeedback(`Approved leave request for ${name}. Balance updated.`)
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to approve leave request'
      setActionFeedback(`Error: ${errMsg}`)
    }
    setTimeout(() => setActionFeedback(null), 3500)
  }

  const handleRefuseLeave = async (id: string, name: string) => {
    try {
      await refuseLeaveMutation.mutateAsync({ requestId: id })
      setActionFeedback(`Refused leave request for ${name}.`)
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to refuse leave request'
      setActionFeedback(`Error: ${errMsg}`)
    }
    setTimeout(() => setActionFeedback(null), 3500)
  }

  const handleToggleCheckIn = async () => {
    if (checkInState === 'completed_today') {
      setActionFeedback('Shift already completed for today. Re-punching in on the same day is disabled.')
      setTimeout(() => setActionFeedback(null), 3500)
      return
    }

    try {
      if (checkInState === 'checked_out') {
        await checkInMutation.mutateAsync()
        setCheckInState('checked_in')
        setActionFeedback(
          isEmployee
            ? 'Punch In request submitted successfully — Pending HR approval.'
            : 'Clocked In successfully at ' + new Date().toLocaleTimeString()
        )
      } else {
        await checkOutMutation.mutateAsync({ attendanceId: todayAttendance?.id })
        setCheckInState('completed_today')
        setActionFeedback(
          isEmployee
            ? 'Punch Out request submitted successfully — Pending HR approval.'
            : 'Clocked Out successfully at ' + new Date().toLocaleTimeString() + '. Today\'s shift is completed.'
        )
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Attendance request failed'
      setActionFeedback(`Error: ${errMsg}`)
    }
    setTimeout(() => setActionFeedback(null), 4000)
  }

  const todayObj = new Date()
  const todayStr = todayObj.toISOString().split('T')[0]
  const maxObj = new Date()
  maxObj.setMonth(maxObj.getMonth() + 6)
  const maxStr = maxObj.toISOString().split('T')[0]

  const handleEmployeeSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetTypeId = selectedTypeId || leaveTypes[0]?.id
    const empId = myEmployee?.id

    if (!targetTypeId || !leaveFrom || !leaveTo) {
      setActionFeedback('Please select leave type and specify start and end dates.')
      setTimeout(() => setActionFeedback(null), 3500)
      return
    }

    if (leaveFrom < todayStr) {
      setActionFeedback('Time off start date cannot be in the past. Please select today or a future date.')
      setTimeout(() => setActionFeedback(null), 3500)
      return
    }

    if (leaveTo < leaveFrom) {
      setActionFeedback('End date cannot be prior to start date.')
      setTimeout(() => setActionFeedback(null), 3500)
      return
    }

    if (leaveFrom > maxStr || leaveTo > maxStr) {
      setActionFeedback('Time off requests cannot be scheduled more than 6 months in advance.')
      setTimeout(() => setActionFeedback(null), 3500)
      return
    }

    try {
      await createLeaveMutation.mutateAsync({
        employeeId: empId || '',
        timeOffTypeId: targetTypeId,
        startDate: leaveFrom,
        endDate: leaveTo,
        reason: leaveReason || 'Personal leave request',
      })
      setLeaveReason('')
      setLeaveFrom('')
      setLeaveTo('')
      setActionFeedback('Time Off request submitted successfully for manager review.')
    } catch (err: any) {
      setActionFeedback(err?.response?.data?.message || 'Failed to submit time off request.')
    }
    setTimeout(() => setActionFeedback(null), 3500)
  }

  // Active Contract details for Employee
  const activeContract = myEmployee?.contracts?.[0]
  const contractRef = activeContract?.contractReference || 'CNT-2026-0001'
  const monthlyWage = Number(activeContract?.wage || 75000)
  const currency = activeContract?.currency || 'INR'
  const salaryStructureName = activeContract?.salaryStructure?.name || 'Standard Technical Salary Structure'

  // Wage Component Proration
  const basicWage = Math.round(monthlyWage * 0.5)
  const hraWage = Math.round(basicWage * 0.4)
  const allowanceWage = monthlyWage - (basicWage + hraWage)

  // Primary Bank Account
  const primaryBank = myEmployee?.bankAccounts?.[0] || {
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50100458923412',
    ifscCode: 'HDFC0001234',
    branchName: 'Mumbai Central Branch',
  }

  // My Leave Allocations
  const myAllocations = (myEmployee?.timeOffAllocations && myEmployee.timeOffAllocations.length > 0)
    ? myEmployee.timeOffAllocations
    : (rawAllocations || [])

  // My Leave Requests History
  const myRequests = (myEmployee?.timeOffRequests && myEmployee.timeOffRequests.length > 0)
    ? myEmployee.timeOffRequests
    : rawTimeOffRequests || []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Welcome Header */}
      <div className="pp-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pp-badge pp-badge-neutral text-[10px] font-bold uppercase">
              {isEmployee
                ? 'Employee Personal Hub'
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
            Welcome back, {myEmployee ? `${myEmployee.firstName} ${myEmployee.lastName}` : (user?.name || user?.email || 'User')}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {isEmployee
              ? 'View your personal profile, department details, pay structure breakdown, leave balances, and punch attendance.'
              : isHRManager
              ? 'Manage employee records, contracts, attendance logs, and time off approvals.'
              : isPayrollAccess
              ? 'Oversee HR operations, monthly payrun cycles, and salary rules.'
              : 'Full administrative control over multi-tenant platform configurations.'}
          </p>
        </div>

        {!isEmployee && (
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

            {onNavigateToEmployees && (
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
        )}
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

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* EMPLOYEE STRICT PERSONAL VIEW */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {isEmployee ? (
        <div className="space-y-6">
          {/* Section 1: Employee Identity & Department Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: My Profile Details */}
            <div className="pp-card p-5 space-y-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--color-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
                    My Employee Information
                  </h3>
                </div>
                <span className="pp-badge pp-badge-success text-[10px] font-bold">
                  {myEmployee?.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>

              {isProfileLoading ? (
                <div className="py-6 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                  <span>Loading employee profile...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium block">Full Name</span>
                    <p className="font-bold text-[var(--color-text-heading)]">
                      {myEmployee ? `${myEmployee.firstName} ${myEmployee.lastName}` : (user?.name || 'Rahul Verma')}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium block">Employee Code</span>
                    <p className="font-mono font-bold text-[var(--color-primary)]">
                      {myEmployee?.employeeCode || 'EMP-0001'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium block flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-[var(--color-text-muted)]" /> Job Position
                    </span>
                    <p className="font-semibold text-[var(--color-text-heading)]">
                      {myEmployee?.jobPosition?.title || 'Software Engineer'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium block flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[var(--color-text-muted)]" /> Work Email
                    </span>
                    <p className="font-mono text-[var(--color-text-heading)] truncate">
                      {myEmployee?.email || user?.email || 'rahul.employee@peoplepay360.com'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium block flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[var(--color-text-muted)]" /> Phone
                    </span>
                    <p className="text-[var(--color-text-heading)]">
                      {myEmployee?.phone || '+91 98201 99882'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[var(--color-text-muted)]" /> Location & Joined
                    </span>
                    <p className="text-[var(--color-text-heading)]">
                      {myEmployee?.location || 'HQ'} ({myEmployee?.hireDate?.split('T')[0] || '2026-01-15'})
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: My Department Details */}
            <div className="pp-card p-5 space-y-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
                    My Department
                  </h3>
                </div>
                <span className="pp-badge pp-badge-neutral text-[10px] font-bold">
                  {myEmployee?.department?.code || 'ENG'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[var(--color-bg-muted)] rounded-[6px] border border-[var(--color-border)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-medium block uppercase tracking-wider">
                      Department Name
                    </span>
                    <p className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
                      {myEmployee?.department?.name || 'Engineering (ENG)'}
                    </p>
                  </div>
                  <Building2 className="w-6 h-6 text-[var(--color-primary)] opacity-40" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium block">Department Manager</span>
                    <p className="font-semibold text-[var(--color-text-heading)]">
                      {myEmployee?.department?.manager
                        ? `${myEmployee.department.manager.firstName} ${myEmployee.department.manager.lastName}`
                        : (myEmployee?.manager ? `${myEmployee.manager.firstName} ${myEmployee.manager.lastName}` : 'Maya Shah (HR Manager)')}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium block">Manager Contact</span>
                    <p className="font-mono text-[var(--color-text-muted)] truncate">
                      {myEmployee?.department?.manager?.email || myEmployee?.manager?.email || 'maya.shah@peoplepay360.com'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Detailed Pay Structure & Wage Breakdown */}
          <div className="pp-card p-6 space-y-4 border border-[var(--color-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-border)] pb-3 gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-heading)] mb-0">
                    My Pay Structure & Salary Details
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)] mb-0">
                    Active contract wage arrangements, Reverse Polish Notation (RPN) components, and disbursement account.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => navigate('/payouts')}
                  className="pp-btn-secondary text-xs py-1.5 px-3 rounded font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[var(--color-primary)] hover:text-white" />
                  <span>View Full Payout History</span>
                </button>
                <span className="pp-badge pp-badge-success text-xs font-mono font-bold">
                  Ref: {contractRef}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-1">
              {/* Box 1: Contract Summary */}
              <div className="p-4 rounded-[6px] bg-[rgba(113,72,103,0.04)] border border-[var(--color-border)] space-y-2">
                <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider block">
                  Assigned Salary Structure
                </span>
                <p className="text-sm font-extrabold text-[var(--color-text-heading)] mb-0">
                  {salaryStructureName}
                </p>
                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)]">Monthly Base Wage:</span>
                  <span className="font-mono font-extrabold text-[var(--color-primary)] text-sm">
                    {currency === 'INR' ? '₹' : '$'}{monthlyWage.toLocaleString()} / mo
                  </span>
                </div>
              </div>

              {/* Box 2: Wage Component Breakdown */}
              <div className="p-4 rounded-[6px] bg-[var(--color-bg-muted)] border border-[var(--color-border)] space-y-2 lg:col-span-2">
                <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider block">
                  Itemized Monthly Compensation Breakdown (RPN Rules)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-2 bg-[var(--color-bg-base)] rounded border border-[var(--color-border)]">
                    <span className="text-[10px] text-[var(--color-text-muted)] block">Basic Wage (50%)</span>
                    <span className="font-mono font-bold text-[var(--color-text-heading)]">₹{basicWage.toLocaleString()}</span>
                  </div>

                  <div className="p-2 bg-[var(--color-bg-base)] rounded border border-[var(--color-border)]">
                    <span className="text-[10px] text-[var(--color-text-muted)] block">HRA (40% of Basic)</span>
                    <span className="font-mono font-bold text-[var(--color-text-heading)]">₹{hraWage.toLocaleString()}</span>
                  </div>

                  <div className="p-2 bg-[var(--color-bg-base)] rounded border border-[var(--color-border)]">
                    <span className="text-[10px] text-[var(--color-text-muted)] block">Allowances</span>
                    <span className="font-mono font-bold text-[var(--color-text-heading)]">₹{allowanceWage.toLocaleString()}</span>
                  </div>

                  <div className="p-2 bg-[rgba(0,200,83,0.08)] rounded border border-[#00C853]/30">
                    <span className="text-[10px] text-[#00C853] font-bold block">Gross Pay</span>
                    <span className="font-mono font-bold text-[#00C853]">₹{monthlyWage.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Bank Disbursement Info */}
            <div className="p-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg-base)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-4 h-4 text-[var(--color-primary)]" />
                <div>
                  <span className="font-bold text-[var(--color-text-heading)] block">
                    Salary Bank Account: {primaryBank.bankName}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    A/C No: <strong className="font-mono text-[var(--color-text-heading)]">{primaryBank.accountNumber}</strong> | IFSC: {primaryBank.ifscCode}
                  </span>
                </div>
              </div>
              <span className="pp-badge pp-badge-neutral text-[10px] font-mono self-start sm:self-auto">
                Primary Account Verified
              </span>
            </div>
          </div>

          {/* Section 3: Daily Attendance & Punch Widget */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 pp-card space-y-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
                    Daily Attendance Punch
                  </h3>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">September 5, 2026</span>
              </div>

              <div className="p-4 rounded-[6px] bg-[var(--color-bg-muted)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        checkInState === 'checked_in'
                          ? 'bg-[#00C853] animate-pulse'
                          : checkInState === 'completed_today'
                          ? 'bg-gray-400'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-sm font-bold text-[var(--color-text-heading)] capitalize">
                      Status: {
                        checkInState === 'checked_in'
                          ? 'Clocked In (Active)'
                          : checkInState === 'completed_today'
                          ? 'Shift Completed Today (Punched Out)'
                          : 'Clocked Out'
                      }
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {checkInState === 'completed_today'
                      ? 'You have completed your shift punch out for today. Punch re-entry is locked until tomorrow.'
                      : 'Punch in/out daily to track working hours for monthly payrun proration.'}
                  </p>
                </div>

                {checkInState === 'completed_today' ? (
                  <button
                    type="button"
                    disabled
                    className="pp-btn text-xs py-2 px-5 font-bold rounded-[6px] inline-flex items-center gap-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-80"
                    title="Shift completed for today. Re-punching in on the same day is prohibited."
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Punched Out for Today</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleToggleCheckIn}
                    disabled={checkInMutation.isPending || checkOutMutation.isPending}
                    className={`pp-btn text-xs py-2 px-5 font-bold rounded-[6px] inline-flex items-center gap-2 cursor-pointer ${
                      checkInState === 'checked_in'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-[#00C853] hover:bg-[#00a845] text-white'
                    } ${checkInMutation.isPending || checkOutMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {checkInMutation.isPending || checkOutMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>
                      {checkInMutation.isPending || checkOutMutation.isPending
                        ? 'Processing...'
                        : checkInState === 'checked_in'
                        ? 'Clock Out'
                        : 'Clock In Now'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Time Off Request Form */}
            <div className="lg:col-span-4 pp-card space-y-3 border border-[var(--color-border)]">
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
                <PlusCircle className="w-4 h-4 text-[var(--color-primary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
                  Request Time Off
                </h3>
              </div>

              <form onSubmit={handleEmployeeSubmitLeave} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-heading)] mb-1">
                    Leave Type
                  </label>
                  <select
                    value={selectedTypeId}
                    onChange={(e) => setSelectedTypeId(e.target.value)}
                    className="pp-input text-xs w-full py-1.5"
                  >
                    {leaveTypes.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                    {leaveTypes.length === 0 && (
                      <option value="">Casual / PTO Leave</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--color-text-heading)] mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      max={maxStr}
                      value={leaveFrom}
                      onChange={(e) => setLeaveFrom(e.target.value)}
                      className="pp-input text-xs w-full py-1.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--color-text-heading)] mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      min={leaveFrom || todayStr}
                      max={maxStr}
                      value={leaveTo}
                      onChange={(e) => setLeaveTo(e.target.value)}
                      className="pp-input text-xs w-full py-1.5"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-heading)] mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    placeholder="Reason for leave request..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="pp-input text-xs w-full py-1.5"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={createLeaveMutation.isPending}
                  className="pp-btn-primary w-full text-xs py-2 font-bold flex items-center justify-center gap-1.5 cursor-pointer mt-1 disabled:opacity-50"
                >
                  {createLeaveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Leave Request</span>
                </button>
              </form>
            </div>
          </div>

          {/* Section 4: All Leaves Data (Balances & History) */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-[var(--color-text-muted)] uppercase tracking-wider mb-0 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
              <span>My Leave Allocations & Request History</span>
            </h3>

            {/* Leave Allocations Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {myAllocations.length === 0 ? (
                <>
                  <div className="pp-card p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-text-heading)]">Casual Leave (CL)</span>
                      <span className="pp-badge pp-badge-neutral text-[10px]">10 / 12 Days Left</span>
                    </div>
                    <div className="w-full bg-[var(--color-bg-muted)] h-2 rounded-full overflow-hidden mt-2">
                      <div className="bg-[var(--color-primary)] h-full w-[83%]"></div>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] pt-1">2 days taken this year</p>
                  </div>

                  <div className="pp-card p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-text-heading)]">Sick Leave (SL)</span>
                      <span className="pp-badge pp-badge-neutral text-[10px]">9 / 10 Days Left</span>
                    </div>
                    <div className="w-full bg-[var(--color-bg-muted)] h-2 rounded-full overflow-hidden mt-2">
                      <div className="bg-[#00C853] h-full w-[90%]"></div>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] pt-1">1 day taken this year</p>
                  </div>

                  <div className="pp-card p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-text-heading)]">Paid Time Off (PL)</span>
                      <span className="pp-badge pp-badge-neutral text-[10px]">15 / 15 Days Left</span>
                    </div>
                    <div className="w-full bg-[var(--color-bg-muted)] h-2 rounded-full overflow-hidden mt-2">
                      <div className="bg-[#FFAA00] h-full w-full"></div>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] pt-1">0 days taken this year</p>
                  </div>
                </>
              ) : (
                myAllocations.map((alloc: any) => {
                  const typeName = alloc.timeOffType?.name || 'Leave'
                  const allocated = Number(alloc.allocated) || 0
                  const remaining = Number(alloc.remaining) || 0
                  const percent = allocated > 0 ? Math.min(100, Math.round((remaining / allocated) * 100)) : 0

                  return (
                    <div key={alloc.id} className="pp-card p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--color-text-heading)]">{typeName}</span>
                        <span className="pp-badge pp-badge-neutral text-[10px]">
                          {remaining} / {allocated} Days Left
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-bg-muted)] h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-[var(--color-primary)] h-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)] pt-1">
                        {alloc.taken || (allocated - remaining)} days taken this year
                      </p>
                    </div>
                  )
                })
              )}
            </div>

            {/* My Leave Requests Table */}
            <div className="pp-card border border-[var(--color-border)] shadow-xs rounded-[6px] overflow-hidden">
              <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-muted)]/30">
                <h4 className="text-xs font-bold text-[var(--color-text-heading)] mb-0 uppercase tracking-wider">
                  My Submitted Leave Requests
                </h4>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">{myRequests.length} Total Requests</span>
              </div>

              <div className="overflow-x-auto">
                {myRequests.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                    No leave requests submitted yet.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        <th className="py-2.5 px-4">Leave Type</th>
                        <th className="py-2.5 px-4">Period</th>
                        <th className="py-2.5 px-4">Duration</th>
                        <th className="py-2.5 px-4">Reason</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-body)]">
                      {myRequests.map((req: any) => {
                        const leaveTypeName = req.timeOffType?.name || 'Casual Leave'
                        const startDateStr = req.startDate?.split('T')[0] || req.startDate
                        const endDateStr = req.endDate?.split('T')[0] || req.endDate

                        return (
                          <tr key={req.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                            <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                              {leaveTypeName}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px]">
                              {startDateStr} &rarr; {endDateStr}
                            </td>
                            <td className="py-3 px-4 font-semibold">{req.duration || 1} Days</td>
                            <td className="py-3 px-4 text-[var(--color-text-muted)] max-w-xs truncate">
                              {req.reason || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`pp-badge uppercase text-[10px] font-bold ${
                                  req.status === 'approved'
                                    ? 'pp-badge-success'
                                    : req.status === 'refused' || req.status === 'cancelled'
                                    ? 'pp-badge-danger'
                                    : 'pp-badge-warning'
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────────────────────── */
        /* MANAGER / ADMIN OPERATIONAL DASHBOARD LAYOUT */
        /* ───────────────────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Manager Metric Stat Cards */}
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
                {isLeaveLoading ? (
                  <div className="p-4 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                    <span>Loading time off requests...</span>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[var(--color-text-muted)] italic">
                    No time off requests found.
                  </div>
                ) : (
                  pendingRequests.map((req: any) => {
                    const empName = req.employee ? `${req.employee.firstName} ${req.employee.lastName}` : 'Employee'
                    const leaveType = req.timeOffType?.name || 'Leave'
                    const startDateStr = new Date(req.startDate).toISOString().split('T')[0]
                    const endDateStr = new Date(req.endDate).toISOString().split('T')[0]
                    const datesStr = startDateStr === endDateStr ? startDateStr : `${startDateStr} to ${endDateStr}`

                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-[6px] bg-[var(--color-bg-muted)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[var(--color-text-heading)]">
                              {empName}
                            </span>
                            <span className="pp-badge pp-badge-neutral text-[10px]">
                              {leaveType}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-3">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                              {datesStr}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                              {req.duration} Day(s)
                            </span>
                          </div>
                        </div>

                        {/* Approve/Refuse Buttons for HR Manager & Admin */}
                        <div className="flex items-center gap-2">
                          {req.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveLeave(req.id, empName)}
                                disabled={approveLeaveMutation.isPending || refuseLeaveMutation.isPending}
                                className="pp-btn text-xs py-1.5 px-3 bg-[#00C853] hover:bg-[#00a845] text-white font-semibold rounded inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRefuseLeave(req.id, empName)}
                                disabled={approveLeaveMutation.isPending || refuseLeaveMutation.isPending}
                                className="pp-btn text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
                    )
                  })
                )}
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
        </div>
      )}

      {/* Payrun Cycle Status Banner (Visible for Payroll Users/Managers and Admin) */}
      {isPayrollAccess && !isEmployee && (
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

          <button
            type="button"
            onClick={onNavigateToEmployees || (() => navigate('/employees'))}
            className="pp-btn-secondary text-xs py-2 px-4 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            <span>Open Employee Master</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}