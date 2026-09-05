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
  MessageSquare,
  FileCheck,
  History,
  X,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthUser } from '@/store/auth.store'
import {
  useTimeOffRequests,
  useTimeOffTypes,
  useApproveTimeOffRequest,
  useRefuseTimeOffRequest,
  useCreateTimeOffRequest,
  useDepartmentsMaster,
  type TimeOffRequestItem,
} from '@/hooks/use-api'

export const TimeOffView: React.FC = () => {
  const user = useAuthUser()
  const role = (user?.role || '').toLowerCase()
  // Any role other than plain employee has approval authority
  const canApprove = role ? role !== 'employee' : true

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

  // Request Time Off Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTypeId, setNewTypeId] = useState('')
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0])
  const [newEndDate, setNewEndDate] = useState(new Date().toISOString().split('T')[0])
  const [newReason, setNewReason] = useState('')

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

  const approvedCount = allRequests.filter(
    (r) =>
      (r.status === 'approved' && !processedRequestIds.has(r.id)) ||
      processedRequestIds.get(r.id) === 'approved'
  ).length

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
      toast.error(err.response?.data?.message || 'Failed to approve leave request')
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
        id: reqId,
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
      toast.error(err.response?.data?.message || 'Failed to refuse leave request')
    } finally {
      setActionLoadingId(null)
      setActionType(null)
    }
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.employeeId && !user?.id) {
      toast.error('User employee profile not found')
      return
    }

    try {
      await createMutation.mutateAsync({
        employeeId: (user.employeeId || user.id) as string,
        timeOffTypeId: newTypeId || leaveTypes[0]?.id || '',
        startDate: newStartDate,
        endDate: newEndDate,
        reason: newReason || 'Personal leave',
      })
      toast.success('Leave request submitted successfully!')
      setIsCreateModalOpen(false)
      setNewReason('')
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--'
    return dateStr.split('T')[0]
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
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

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Request Time Off</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pp-card p-4 border border-[var(--color-border)] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Pending Approvals
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#FFAA00]">
                {isLoading ? '...' : pendingRequests.length}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">Requires Review</span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Awaiting manager action
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[rgba(255,170,0,0.12)] text-[#FFAA00] flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="pp-card p-4 border border-[var(--color-border)] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Approved Requests
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#00C853]">
                {isLoading ? '...' : approvedCount}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">Granted</span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Authorized time off
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[rgba(0,200,83,0.12)] text-[#00C853] flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="pp-card p-4 border border-[var(--color-border)] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Total Recorded Requests
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[var(--color-text-heading)]">
                {isLoading ? '...' : allRequests.length}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">All Time</span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Processed leave entries
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[rgba(113,72,103,0.1)] text-[var(--color-primary)] flex items-center justify-center font-bold shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="pp-card p-3.5 border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search employee by name, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pp-input pl-9 text-xs w-full"
          />
        </div>

        {/* Right: Department & Leave Type Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="pp-input text-xs py-1.5 min-w-[150px]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Leave Type Filter */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pp-input text-xs py-1.5 min-w-[150px]"
            >
              <option value="all">All Leave Types</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pending Leave Requests Alert Banner */}
      {pendingRequests.length > 0 && activeTab !== 'requests' && (
        <div className="pp-card p-3.5 border-l-4 border-l-[#FFAA00] border-[var(--color-border)] bg-[rgba(255,170,0,0.06)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[rgba(255,170,0,0.15)] text-[#FFAA00] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--color-text-heading)]">
                {pendingRequests.length} Pending Leave Request{pendingRequests.length === 1 ? '' : 's'} Awaiting Approval
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Employees have submitted time off requests requiring your review.
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

      {/* 4. Tabs: Leave Requests (Pending) vs History */}
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

      {/* 5. Tab 1 Content: Pending Leave Requests Table with Approve / Reject Buttons */}
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
                    <td colSpan={7} className="py-10 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-[#00C853] mx-auto opacity-70" />
                      <p className="text-xs font-semibold text-[var(--color-text-heading)]">
                        All Caught Up! No Pending Leave Requests
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        There are no outstanding leave requests requiring approval right now.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((req) => {
                    const empName = req.employee
                      ? `${req.employee.firstName} ${req.employee.lastName}`
                      : 'Employee'

                    return (
                      <tr key={req.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                        {/* Employee */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[rgba(113,72,103,0.1)] text-[var(--color-primary)] text-xs font-bold flex items-center justify-center shrink-0">
                              {empName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-[var(--color-text-heading)] truncate">
                                {empName}
                              </span>
                              <span className="text-[10px] text-[var(--color-text-muted)]">
                                {req.employee?.employeeCode || 'EMP'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department & Role */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[var(--color-text-heading)]">
                              {req.employee?.department?.name || 'General'}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-muted)]">
                              {req.employee?.jobPosition?.title || 'Staff'}
                            </span>
                          </div>
                        </td>

                        {/* Leave Type */}
                        <td className="py-3 px-4">
                          <span className="pp-badge pp-badge-neutral text-[10px] font-bold">
                            {req.timeOffType?.name || 'Leave'}
                          </span>
                        </td>

                        {/* Dates */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <span className="font-semibold text-[var(--color-text-heading)]">
                            {formatDate(req.startDate)}
                          </span>
                          <span className="text-[var(--color-text-muted)] mx-1">&rarr;</span>
                          <span className="font-semibold text-[var(--color-text-heading)]">
                            {formatDate(req.endDate)}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-4 font-semibold text-[var(--color-text-heading)]">
                          {req.duration} {req.timeOffType?.unit || 'days'}
                          {req.halfDay && <span className="text-[10px] text-[var(--color-text-muted)] block">(Half Day)</span>}
                        </td>

                        {/* Reason */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex items-start gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                            <span className="text-[11px] text-[var(--color-text-body)] line-clamp-2" title={req.reason || ''}>
                              {req.reason || 'No description provided'}
                            </span>
                          </div>
                        </td>

                        {/* Actions (Approve / Reject) */}
                        {canApprove && (
                          <td className="py-3 px-4 text-right">
                            {(() => {
                              const isRowActionPending = actionLoadingId === req.id
                              const isApproving = isRowActionPending && actionType === 'approve'
                              const isRejecting = isRowActionPending && actionType === 'refuse'
                              const isAnyActionPending = isRowActionPending || approveMutation.isPending || refuseMutation.isPending

                              return (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(req)}
                                    disabled={isAnyActionPending}
                                    className="px-3 py-1.5 rounded-[4px] bg-[#00C853] hover:bg-[#00B248] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                    title="Approve Leave Request"
                                  >
                                    {isApproving ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4" />
                                    )}
                                    <span>{isApproving ? 'Approving...' : 'Approve'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRefuse(req)}
                                    disabled={isAnyActionPending}
                                    className="px-3 py-1.5 rounded-[4px] bg-[rgba(255,23,68,0.1)] hover:bg-[rgba(255,23,68,0.2)] disabled:opacity-60 disabled:cursor-not-allowed text-[#FF1744] border border-[#FF1744]/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                    title="Reject Leave Request"
                                  >
                                    {isRejecting ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
                                    <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
                                  </button>
                                </div>
                              )
                            })()}
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

      {/* 6. Tab 2 Content: Leave Requests History Table */}
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
                        <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                          {empName}
                        </td>
                        <td className="py-3 px-4 text-[var(--color-text-muted)]">
                          {req.employee?.department?.name || 'General'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="pp-badge pp-badge-neutral text-[10px]">
                            {req.timeOffType?.name || 'Leave'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {formatDate(req.startDate)} &rarr; {formatDate(req.endDate)}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {req.duration} {req.timeOffType?.unit || 'days'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`pp-badge uppercase text-[10px] font-bold ${
                              req.status === 'approved'
                                ? 'pp-badge-success'
                                : req.status === 'refused'
                                ? 'pp-badge-danger'
                                : 'pp-badge-neutral'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-[var(--color-text-muted)] max-w-xs truncate">
                          {req.refusalReason ? (
                            <span className="text-[#FF1744]">Reason: {req.refusalReason}</span>
                          ) : req.reason ? (
                            req.reason
                          ) : (
                            '--'
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

      {/* 7. Reject Modal with Reason Input */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[8px] shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-[#FF1744]" />
                <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
                  Reject Leave Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-[var(--color-text-body)]">
              <p>
                <strong>Employee:</strong>{' '}
                {rejectingItem.employee
                  ? `${rejectingItem.employee.firstName} ${rejectingItem.employee.lastName}`
                  : 'Employee'}
              </p>
              <p>
                <strong>Leave Type:</strong> {rejectingItem.timeOffType?.name} ({rejectingItem.duration}{' '}
                {rejectingItem.timeOffType?.unit || 'days'})
              </p>
              <p>
                <strong>Requested Period:</strong> {formatDate(rejectingItem.startDate)} &rarr;{' '}
                {formatDate(rejectingItem.endDate)}
              </p>
              {rejectingItem.reason && (
                <div className="p-2.5 rounded-[4px] bg-[var(--color-bg-muted)] border border-[var(--color-border)] text-[11px]">
                  <span className="font-semibold text-[var(--color-text-heading)]">Employee's Note:</span>{' '}
                  {rejectingItem.reason}
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                  Reason for Rejection (Optional):
                </label>
                <textarea
                  value={refusalReason}
                  onChange={(e) => setRefusalReason(e.target.value)}
                  placeholder="e.g., Staff shortage on requested dates, please reschedule."
                  className="pp-input w-full text-xs min-h-[70px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--color-border)]">
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
                disabled={refuseMutation.isPending || actionType === 'refuse'}
                className="text-xs py-1.5 px-3.5 rounded-[4px] font-semibold bg-[#FF1744] hover:bg-[#D50000] disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center gap-1.5 cursor-pointer"
              >
                {refuseMutation.isPending || actionType === 'refuse' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <span>Confirm Rejection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Request Time Off Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[8px] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-text-heading)]">
                Submit Time Off Request
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                  Leave Type
                </label>
                <select
                  value={newTypeId || (leaveTypes[0]?.id ?? '')}
                  onChange={(e) => setNewTypeId(e.target.value)}
                  className="pp-input text-xs w-full"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
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
                  className="pp-btn-primary text-xs py-2 px-4 cursor-pointer"
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
