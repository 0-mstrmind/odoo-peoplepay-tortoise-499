import React, { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Building2,
  RefreshCw,
  Plus,
  History,
  X,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthUser } from '@/store/auth.store'
import {
  useTimeOffRequests,
  useTimeOffAllocations,
  useTimeOffTypes,
  useApproveTimeOffRequest,
  useRefuseTimeOffRequest,
  useCreateTimeOffRequest,
  type TimeOffRequestItem,
} from '@/hooks/use-timeoff'
import {
  useEmployees,
  useMyEmployeeProfile,
  useDepartmentsMaster,
} from '@/hooks/use-api'

export const TimeOffView: React.FC = () => {
  const user = useAuthUser()
  const role = (user?.role || '').toLowerCase()
  const isStandardEmployee = role === 'employee'
  const isHrOrAdmin = ['admin', 'super_admin', 'hr_manager', 'hr_payroll_manager'].includes(role)
  const canApprove = role ? role !== 'employee' : true

  // Logged-in employee profile
  const { data: myEmployee } = useMyEmployeeProfile()
  const { data: employeesResponse } = useEmployees()
  const employeesList =
    (employeesResponse as any)?.data?.items ||
    (employeesResponse as any)?.items ||
    (Array.isArray(employeesResponse) ? employeesResponse : [])

  // Tabs: 'requests' (pending approvals) | 'history' (complete log)
  const [activeTab, setActiveTab] = useState<'requests' | 'history'>('requests')

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Action Loading & Optimistic State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'refuse' | null>(null)
  const [processedRequestIds, setProcessedRequestIds] = useState<Map<string, 'approved' | 'refused'>>(new Map())

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<TimeOffRequestItem | null>(null)
  const [refusalReason, setRefusalReason] = useState<string>('')

  // Request Time Off Modal State (Employees)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [newTypeId, setNewTypeId] = useState('')
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0])
  const [newEndDate, setNewEndDate] = useState(new Date().toISOString().split('T')[0])
  const [newReason, setNewReason] = useState('')

  // Manual Holiday Modal State (HR / Admin)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [manualEmployeeId, setManualEmployeeId] = useState('')
  const [manualTypeId, setManualTypeId] = useState('')
  const [manualStartDate, setManualStartDate] = useState(new Date().toISOString().split('T')[0])
  const [manualEndDate, setManualEndDate] = useState(new Date().toISOString().split('T')[0])
  const [manualHalfDay, setManualHalfDay] = useState(false)
  const [manualHalfDayPeriod, setManualHalfDayPeriod] = useState<'am' | 'pm'>('am')
  const [manualReason, setManualReason] = useState('')

  // API Queries - all company leave requests
  const {
    data: allRequests = [],
    isLoading,
    refetch,
    isRefetching,
  } = useTimeOffRequests({
    departmentId: selectedDepartment !== 'all' ? selectedDepartment : undefined,
    timeOffTypeId: selectedType !== 'all' ? selectedType : undefined,
    search: searchQuery,
  })

  const { data: allocations = [], isLoading: isLoadingAllocations } = useTimeOffAllocations()
  const { data: leaveTypes = [] } = useTimeOffTypes()
  const { data: departments = [] } = useDepartmentsMaster()

  // Mutations
  const approveMutation = useApproveTimeOffRequest()
  const refuseMutation = useRefuseTimeOffRequest()
  const createMutation = useCreateTimeOffRequest()

  const pendingRequests = allRequests.filter(
    (r) => r.status === 'pending' && !processedRequestIds.has(r.id)
  )
  const historyRequests = allRequests
    .map((r) =>
      processedRequestIds.has(r.id)
        ? { ...r, status: processedRequestIds.get(r.id)! }
        : r
    )
    .filter((r) => r.status !== 'pending' || processedRequestIds.has(r.id))

  const handleApprove = async (item: TimeOffRequestItem) => {
    setActionLoadingId(item.id)
    setActionType('approve')
    try {
      await approveMutation.mutateAsync(item.id)
      setProcessedRequestIds((prev) => new Map(prev).set(item.id, 'approved'))
      const empName = item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'employee'
      toast.success(`Leave request approved for ${empName}!`)
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to approve leave request')
    } finally {
      setActionLoadingId(null)
      setActionType(null)
    }
  }

  const handleOpenRefuse = (item: TimeOffRequestItem) => {
    setRejectingItem(item)
    setRefusalReason('')
  }

  const handleConfirmRefuse = async () => {
    if (!rejectingItem) return
    const reqId = rejectingItem.id
    setActionLoadingId(reqId)
    setActionType('refuse')
    try {
      await refuseMutation.mutateAsync({
        requestId: reqId,
        refusalReason: refusalReason.trim() || undefined,
      })
      setProcessedRequestIds((prev) => new Map(prev).set(reqId, 'refused'))
      const empName = rejectingItem.employee
        ? `${rejectingItem.employee.firstName} ${rejectingItem.employee.lastName}`
        : 'employee'
      toast.info(`Leave request rejected for ${empName}`)
      setRejectingItem(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to refuse leave request')
    } finally {
      setActionLoadingId(null)
      setActionType(null)
    }
  }

  const handleOpenCreateModal = () => {
    if (isStandardEmployee && myEmployee?.id) {
      setSelectedEmployeeId(myEmployee.id)
    } else if (employeesList.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employeesList[0].id)
    }
    if (leaveTypes.length > 0 && !newTypeId) {
      setNewTypeId(leaveTypes[0].id)
    }
    setIsCreateModalOpen(true)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const maxObj = new Date()
  maxObj.setMonth(maxObj.getMonth() + 6)
  const maxStr = maxObj.toISOString().split('T')[0]

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    const empId = isStandardEmployee && myEmployee?.id
      ? myEmployee.id
      : (selectedEmployeeId || (user as any)?.employeeId || employeesList[0]?.id)

    const typeId = newTypeId || leaveTypes[0]?.id

    if (!empId || !typeId || !newStartDate || !newEndDate) {
      toast.error('Please fill out all required fields.')
      return
    }

    if (newStartDate < todayStr) {
      toast.error('Time off start date cannot be in the past.')
      return
    }

    if (newEndDate < newStartDate) {
      toast.error('End date cannot be prior to start date.')
      return
    }

    if (newStartDate > maxStr || newEndDate > maxStr) {
      toast.error('Time off requests cannot be scheduled more than 6 months in advance.')
      return
    }

    try {
      await createMutation.mutateAsync({
        employeeId: empId,
        timeOffTypeId: typeId,
        startDate: newStartDate,
        endDate: newEndDate,
        reason: newReason || 'Personal leave',
      })
      toast.success('Leave request submitted successfully!')
      setIsCreateModalOpen(false)
      setNewReason('')
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit leave request')
    }
  }

  const handleOpenManualHolidayModal = () => {
    if (employeesList.length > 0 && !manualEmployeeId) {
      setManualEmployeeId(employeesList[0].id)
    }
    if (leaveTypes.length > 0 && !manualTypeId) {
      setManualTypeId(leaveTypes[0].id)
    }
    setIsManualModalOpen(true)
  }

  const handleGrantManualHoliday = async (e: React.FormEvent) => {
    e.preventDefault()

    const empId = manualEmployeeId || employeesList[0]?.id
    const typeId = manualTypeId || leaveTypes[0]?.id

    if (!empId || !typeId || !manualStartDate || !manualEndDate) {
      toast.error('Please select an employee, leave type, and valid dates.')
      return
    }

    if (manualEndDate < manualStartDate) {
      toast.error('End date cannot be prior to start date.')
      return
    }

    try {
      await createMutation.mutateAsync({
        employeeId: empId,
        timeOffTypeId: typeId,
        startDate: manualStartDate,
        endDate: manualEndDate,
        halfDay: manualHalfDay,
        halfDayPeriod: manualHalfDay ? manualHalfDayPeriod : undefined,
        reason: manualReason.trim() || 'Manual holiday granted by HR',
        isManualHoliday: true,
      })

      const targetEmp = employeesList.find((e: any) => e.id === empId)
      const empName = targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : 'employee'
      toast.success(`Manual holiday successfully granted for ${empName}! (Allocations automatically adjusted)`)
      setIsManualModalOpen(false)
      setManualReason('')
      setManualHalfDay(false)
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to grant manual holiday')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--'
    return dateStr.split('T')[0]
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-heading)] flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-[var(--color-primary)]" />
            <span>Time Off & Leave Management</span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Review and approve employee leave requests, track absence durations, and inspect historical leave records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              refetch()
              toast.info('Leave data refreshed')
            }}
            disabled={isRefetching}
            className="p-2 border border-[var(--color-border)] rounded-[6px] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] transition-colors cursor-pointer"
            title="Refresh Leave Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>

          {/* Standard Employee: Request Personal Leave */}
          {isStandardEmployee && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Request Time Off</span>
            </button>
          )}

          {/* HR Manager & Admin: Cannot request personal leave; Can grant manual holiday */}
          {isHrOrAdmin && (
            <button
              type="button"
              onClick={handleOpenManualHolidayModal}
              className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Grant Manual Holiday</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Active Leave Balances / Allocations Cards */}
      {isLoadingAllocations ? (
        <div className="py-4 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
          <span>Loading leave allocations...</span>
        </div>
      ) : allocations.length > 0 ? (
        <div>
          <h2 className="text-xs font-extrabold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            Active Leave Allocations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {allocations.map((alloc: any) => {
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
                    {alloc.taken || (allocated - remaining)} days taken
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* 3. Filter Bar */}
      <div className="pp-card p-3.5 border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search employee by name, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pp-input text-xs pl-9 w-full rounded-[6px]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 border border-[var(--color-border)] rounded-[6px] px-2.5 py-1.5 bg-[var(--color-bg-base)]">
            <Building2 className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-none text-[var(--color-text-heading)] font-semibold cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Leave Type Filter */}
          <div className="flex items-center gap-1.5 border border-[var(--color-border)] rounded-[6px] px-2.5 py-1.5 bg-[var(--color-bg-base)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-none text-[var(--color-text-heading)] font-semibold cursor-pointer"
            >
              <option value="all">All Leave Types</option>
              {leaveTypes.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Attention Banner: If there are pending leave requests */}
      {pendingRequests.length > 0 && activeTab !== 'requests' && (
        <div className="pp-card p-3 border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
              {pendingRequests.length}
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--color-text-heading)]">
                {pendingRequests.length} pending leave request{pendingRequests.length === 1 ? '' : 's'} awaiting your review
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Approve or refuse time off submissions to update employee schedules.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className="px-3 py-1.5 rounded-[4px] bg-[#FFAA00] hover:bg-[#E69900] text-black text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            Review Requests &rarr;
          </button>
        </div>
      )}

      {/* 5. Navigation Tabs: Leave Requests (Pending) vs History */}
      <div className="border-b border-[var(--color-border)] flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {/* Tab 1: Leave Requests */}
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[rgba(113,72,103,0.04)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#FFAA00]" />
            <span>Leave Requests</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'requests'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[rgba(255,170,0,0.12)] text-[#FFAA00]'
              }`}
            >
              {pendingRequests.length}
            </span>
          </button>

          {/* Tab 2: History */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[rgba(113,72,103,0.04)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            <History className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Leave History</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
              {historyRequests.length}
            </span>
          </button>
        </div>
      </div>

      {/* 6. Tab 1 Content: Pending Leave Requests Table */}
      {activeTab === 'requests' && (
        <div className="pp-card border border-[var(--color-border)] shadow-xs rounded-[6px] overflow-hidden">
          <div className="p-3.5 border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--color-text-heading)] uppercase tracking-wider mb-0">
              Pending Leave Requests Requiring Approval
            </h3>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {pendingRequests.length} pending request{pendingRequests.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-base)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Department & Role</th>
                  <th className="py-2.5 px-4">Leave Type</th>
                  <th className="py-2.5 px-4">Leave Dates</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">Reason</th>
                  {canApprove && <th className="py-2.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                      <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mx-auto mb-2" />
                      <span>Loading leave requests...</span>
                    </td>
                  </tr>
                ) : pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                      No pending leave requests awaiting approval.
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((req) => {
                    const empName = req.employee
                      ? `${req.employee.firstName} ${req.employee.lastName}`
                      : 'Employee'
                    const isRowBusy = actionLoadingId === req.id

                    return (
                      <tr key={req.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[var(--color-text-heading)]">{empName}</div>
                          <div className="text-[10px] text-[var(--color-text-muted)] font-mono">
                            {req.employee?.employeeCode || req.employee?.email || ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[var(--color-text-muted)]">
                          {(req.employee as any)?.department?.name || 'General'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[var(--color-text-heading)]">
                            {req.timeOffType?.name || 'Leave'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {formatDate(req.startDate)} &rarr; {formatDate(req.endDate)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {req.duration} day{Number(req.duration) === 1 ? '' : 's'}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-[var(--color-text-muted)]" title={req.reason}>
                          {req.reason || '—'}
                        </td>
                        {canApprove && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Approve Button */}
                              <button
                                type="button"
                                onClick={() => handleApprove(req)}
                                disabled={isRowBusy}
                                className={`pp-btn-primary text-[11px] py-1 px-2.5 rounded-[4px] font-semibold flex items-center gap-1 cursor-pointer transition-opacity ${
                                  isRowBusy && actionType === 'approve'
                                    ? 'opacity-60 cursor-wait'
                                    : isRowBusy
                                    ? 'opacity-40 cursor-not-allowed'
                                    : ''
                                }`}
                                title="Approve Leave Request"
                              >
                                {isRowBusy && actionType === 'approve' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>{isRowBusy && actionType === 'approve' ? 'Approving...' : 'Approve'}</span>
                              </button>

                              {/* Refuse Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenRefuse(req)}
                                disabled={isRowBusy}
                                className={`text-[11px] py-1 px-2.5 rounded-[4px] font-semibold flex items-center gap-1 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all ${
                                  isRowBusy && actionType === 'refuse'
                                    ? 'opacity-60 cursor-wait'
                                    : isRowBusy
                                    ? 'opacity-40 cursor-not-allowed'
                                    : ''
                                }`}
                                title="Reject Leave Request"
                              >
                                {isRowBusy && actionType === 'refuse' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                <span>{isRowBusy && actionType === 'refuse' ? 'Rejecting...' : 'Reject'}</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Tab 2 Content: Historical Leave Requests Log (No Approve/Reject buttons here) */}
      {activeTab === 'history' && (
        <div className="pp-card border border-[var(--color-border)] shadow-xs rounded-[6px] overflow-hidden">
          <div className="p-3.5 border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--color-text-heading)] uppercase tracking-wider mb-0">
              Leave Requests History & Activity Log
            </h3>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {historyRequests.length} past record{historyRequests.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-base)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Leave Type</th>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Remarks / Refusal Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                      <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mx-auto mb-2" />
                      <span>Loading history records...</span>
                    </td>
                  </tr>
                ) : historyRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                      No historical leave records found.
                    </td>
                  </tr>
                ) : (
                  historyRequests.map((req) => {
                    const empName = req.employee
                      ? `${req.employee.firstName} ${req.employee.lastName}`
                      : 'Employee'

                    return (
                      <tr key={req.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[var(--color-text-heading)]">{empName}</div>
                          <div className="text-[10px] text-[var(--color-text-muted)] font-mono">
                            {req.employee?.employeeCode || ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[var(--color-text-muted)]">
                          {(req.employee as any)?.department?.name || 'General'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[var(--color-text-heading)]">
                          {req.timeOffType?.name || 'Leave'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {formatDate(req.startDate)} &rarr; {formatDate(req.endDate)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {req.duration} day{Number(req.duration) === 1 ? '' : 's'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`pp-badge uppercase text-[10px] font-bold ${
                              req.status === 'approved'
                                ? 'pp-badge-success'
                                : req.status === 'refused'
                                ? 'pp-badge-danger'
                                : req.status === 'pending'
                                ? 'pp-badge-warning'
                                : 'pp-badge-neutral'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[var(--color-text-muted)] max-w-xs">
                          {req.refusalReason ? (
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              Refusal: {req.refusalReason}
                            </span>
                          ) : req.reason ? (
                            <span>{req.reason}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Refusal Reason Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="pp-card w-full max-w-md bg-[var(--color-bg-base)] border border-[var(--color-border)] shadow-xl rounded-[8px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
                  Reject Leave Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-muted)]">
              Provide an optional explanation for rejecting{' '}
              <strong className="text-[var(--color-text-heading)]">
                {rejectingItem.employee
                  ? `${rejectingItem.employee.firstName} ${rejectingItem.employee.lastName}`
                  : 'this employee'}
              </strong>
              's request for {rejectingItem.duration} day{Number(rejectingItem.duration) === 1 ? '' : 's'} of{' '}
              {rejectingItem.timeOffType?.name || 'leave'}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Refusal Reason (Optional)
              </label>
              <textarea
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                placeholder="e.g. Critical deployment scheduled during this timeframe..."
                className="pp-input text-xs w-full h-20 resize-none rounded-[6px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="pp-btn-secondary text-xs py-1.5 px-3 rounded-[4px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRefuse}
                disabled={actionLoadingId === rejectingItem.id}
                className="text-xs py-1.5 px-3.5 rounded-[4px] bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {actionLoadingId === rejectingItem.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Request Time Off Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="pp-card w-full max-w-md bg-[var(--color-bg-base)] border border-[var(--color-border)] shadow-xl rounded-[8px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Submit Time Off Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              {isStandardEmployee ? (
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                    Employee
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={
                      myEmployee
                        ? `${myEmployee.firstName} ${myEmployee.lastName} (${myEmployee.employeeCode || myEmployee.email})`
                        : user?.email ? `${user.email} (My Profile)` : 'My Employee Account'
                    }
                    className="pp-input text-xs w-full bg-[var(--color-bg-muted)] font-semibold cursor-not-allowed opacity-90"
                  />
                </div>
              ) : (
                employeesList.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                      Employee
                    </label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="pp-input text-xs w-full"
                      required
                    >
                      {employeesList.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                  Leave Type
                </label>
                <select
                  value={newTypeId || (leaveTypes[0]?.id ?? '')}
                  onChange={(e) => setNewTypeId(e.target.value)}
                  className="pp-input text-xs w-full"
                  required
                >
                  {leaveTypes.map((type: any) => (
                    <option key={type.id} value={type.id}>
                      {type.name} {type.unit ? `(${type.unit})` : ''}
                    </option>
                  ))}
                  {leaveTypes.length === 0 && (
                    <option value="">No leave types configured</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    max={maxStr}
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="pp-input text-xs w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    min={newStartDate || todayStr}
                    max={maxStr}
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="pp-input text-xs w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                  Reason / Description
                </label>
                <textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Reason for requesting time off..."
                  className="pp-input text-xs w-full h-20 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="pp-btn-secondary text-xs py-2 px-3 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="pp-btn-primary text-xs py-2 px-4 cursor-pointer flex items-center gap-1.5"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{createMutation.isPending ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Grant Manual Holiday Modal (HR & Admin) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="pp-card w-full max-w-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] shadow-xl rounded-[8px] p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[rgba(113,72,103,0.1)] flex items-center justify-center text-[var(--color-primary)]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
                    Grant Manual Holiday
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)] mb-0">
                    Directly grant an approved holiday even if leave balance is fully consumed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>
                <strong>Zero-balance override active:</strong> If this employee has 0 remaining days for the selected leave type, the system automatically expands the quota and immediately approves the holiday.
              </span>
            </div>

            <form onSubmit={handleGrantManualHoliday} className="space-y-3.5">
              {/* Employee Selector */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                  Select Employee <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualEmployeeId}
                  onChange={(e) => setManualEmployeeId(e.target.value)}
                  className="pp-input text-xs w-full"
                  required
                >
                  {employeesList.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.email})
                    </option>
                  ))}
                  {employeesList.length === 0 && (
                    <option value="">No employees found</option>
                  )}
                </select>
              </div>

              {/* Leave Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                  Leave / Holiday Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualTypeId || (leaveTypes[0]?.id ?? '')}
                  onChange={(e) => setManualTypeId(e.target.value)}
                  className="pp-input text-xs w-full"
                  required
                >
                  {leaveTypes.map((type: any) => (
                    <option key={type.id} value={type.id}>
                      {type.name} {type.unit ? `(${type.unit})` : ''}
                    </option>
                  ))}
                  {leaveTypes.length === 0 && (
                    <option value="">No leave types configured</option>
                  )}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={manualStartDate}
                    onChange={(e) => {
                      setManualStartDate(e.target.value)
                      if (manualEndDate < e.target.value) {
                        setManualEndDate(e.target.value)
                      }
                    }}
                    className="pp-input text-xs w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={manualStartDate}
                    value={manualEndDate}
                    onChange={(e) => setManualEndDate(e.target.value)}
                    className="pp-input text-xs w-full"
                    required
                  />
                </div>
              </div>

              {/* Half-Day Option */}
              <div className="p-3 bg-[var(--color-bg-muted)] rounded-[6px] space-y-2 border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <label htmlFor="manualHalfDay" className="text-xs font-semibold text-[var(--color-text-heading)] cursor-pointer flex items-center gap-2">
                    <input
                      id="manualHalfDay"
                      type="checkbox"
                      checked={manualHalfDay}
                      onChange={(e) => setManualHalfDay(e.target.checked)}
                      className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                    />
                    <span>Grant as Half Day (0.5 Day)</span>
                  </label>
                  {manualHalfDay && (
                    <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[rgba(113,72,103,0.1)] px-1.5 py-0.5 rounded">
                      0.5 Day
                    </span>
                  )}
                </div>

                {manualHalfDay && (
                  <div className="flex items-center gap-4 pt-1 pl-5">
                    <label className="text-xs flex items-center gap-1.5 cursor-pointer text-[var(--color-text-heading)]">
                      <input
                        type="radio"
                        name="manualPeriod"
                        value="am"
                        checked={manualHalfDayPeriod === 'am'}
                        onChange={() => setManualHalfDayPeriod('am')}
                        className="text-[var(--color-primary)]"
                      />
                      <span>AM (First Half)</span>
                    </label>
                    <label className="text-xs flex items-center gap-1.5 cursor-pointer text-[var(--color-text-heading)]">
                      <input
                        type="radio"
                        name="manualPeriod"
                        value="pm"
                        checked={manualHalfDayPeriod === 'pm'}
                        onChange={() => setManualHalfDayPeriod('pm')}
                        className="text-[var(--color-primary)]"
                      />
                      <span>PM (Second Half)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                  Reason / Notes
                </label>
                <textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g. Special management exemption, compensatory holiday, festival grant..."
                  className="pp-input text-xs w-full h-20 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="pp-btn-secondary text-xs py-2 px-3.5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="pp-btn-primary text-xs py-2 px-4 cursor-pointer flex items-center gap-1.5"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Granting Holiday...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Grant Holiday</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
