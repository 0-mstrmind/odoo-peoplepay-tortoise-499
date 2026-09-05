import React, { useState } from 'react'
import {
  Calendar,
  Plus,
  FileCheck,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import { useAuthUser } from '@/store/auth.store'
import {
  useTimeOffRequests,
  useTimeOffAllocations,
  useTimeOffTypes,
  useApproveTimeOffRequest,
  useRefuseTimeOffRequest,
  useCreateTimeOffRequest,
} from '@/hooks/use-timeoff'
import { useEmployees, useMyEmployeeProfile } from '@/hooks/use-api'

export const TimeOffView: React.FC = () => {
  const user = useAuthUser()
  const role = user?.role?.toLowerCase()
  const isStandardEmployee = role === 'employee'
  const canApprove = role === 'admin' || role === 'super_admin' || role === 'hr_manager' || role === 'hr_payroll_manager'

  const { data: myEmployee } = useMyEmployeeProfile()
  const { data: requests = [], isLoading: isLoadingRequests } = useTimeOffRequests()
  const { data: allocations = [], isLoading: isLoadingAllocations } = useTimeOffAllocations()
  const { data: leaveTypes = [] } = useTimeOffTypes()
  const { data: employeesResponse } = useEmployees()

  const approveMutation = useApproveTimeOffRequest()
  const refuseMutation = useRefuseTimeOffRequest()
  const createMutation = useCreateTimeOffRequest()

  const employeesList = (employeesResponse as any)?.data?.items || (employeesResponse as any)?.items || (Array.isArray(employeesResponse) ? employeesResponse : [])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // New request form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')
  const [newReason, setNewReason] = useState('')

  const handleApprove = async (id: string, name: string) => {
    try {
      await approveMutation.mutateAsync(id)
      setFeedback(`Approved leave request for ${name}.`)
      setTimeout(() => setFeedback(null), 3000)
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || 'Failed to approve request.')
    }
  }

  const handleRefuse = async (id: string, name: string) => {
    try {
      await refuseMutation.mutateAsync({ requestId: id, refusalReason: 'Refused by manager' })
      setFeedback(`Refused leave request for ${name}.`)
      setTimeout(() => setFeedback(null), 3000)
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || 'Failed to refuse request.')
    }
  }

  const handleOpenModal = () => {
    if (isStandardEmployee && myEmployee?.id) {
      setSelectedEmployeeId(myEmployee.id)
    } else if (employeesList.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employeesList[0].id)
    }
    if (leaveTypes.length > 0) {
      setSelectedTypeId(leaveTypes[0].id)
    }
    setIsModalOpen(true)
  }

  const todayObj = new Date()
  const todayStr = todayObj.toISOString().split('T')[0]
  const maxObj = new Date()
  maxObj.setMonth(maxObj.getMonth() + 6)
  const maxStr = maxObj.toISOString().split('T')[0]

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    const empId = isStandardEmployee && myEmployee?.id ? myEmployee.id : (selectedEmployeeId || employeesList[0]?.id)
    const typeId = selectedTypeId || (leaveTypes[0]?.id)

    if (!empId || !typeId || !newFrom || !newTo) {
      setFeedback('Please fill out all required fields.')
      return
    }

    if (newFrom < todayStr) {
      setFeedback('Time off start date cannot be in the past. Please select today or a future date.')
      return
    }

    if (newTo < newFrom) {
      setFeedback('End date cannot be prior to start date.')
      return
    }

    if (newFrom > maxStr || newTo > maxStr) {
      setFeedback('Time off requests cannot be scheduled more than 6 months in advance.')
      return
    }

    try {
      await createMutation.mutateAsync({
        employeeId: empId,
        timeOffTypeId: typeId,
        startDate: newFrom,
        endDate: newTo,
        reason: newReason,
      })
      setIsModalOpen(false)
      setNewReason('')
      setNewFrom('')
      setNewTo('')
      setFeedback('Leave request submitted successfully!')
      setTimeout(() => setFeedback(null), 3000)
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || 'Failed to submit leave request.')
    }
  }

  const pendingRequests = requests.filter((r: any) => r.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-heading)] flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-[var(--color-primary)]" />
            <span>Time Off & Leave Management</span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Track allocations, submit leave requests, and manage manager approvals.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Request Time Off</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-[rgba(0,200,83,0.1)] border border-[#00C853] text-[#00C853] text-xs font-semibold rounded-[4px] animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Leave Balances / Allocations */}
      <div>
        <h2 className="text-xs font-extrabold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Active Leave Allocations
        </h2>

        {isLoadingAllocations ? (
          <div className="py-6 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
            <span>Loading allocations...</span>
          </div>
        ) : allocations.length === 0 ? (
          <div className="pp-card p-4 text-center text-xs text-[var(--color-text-muted)]">
            No active leave allocations found.
          </div>
        ) : (
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
        )}
      </div>

      {/* Pending Requests Table (Manager / Admin Approval Scope) */}
      {canApprove && (
        <div className="pp-card border border-[var(--color-border)] shadow-xs rounded-[6px] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[rgba(113,72,103,0.03)]">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[var(--color-primary)]" />
              <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
                Pending Manager Approvals
              </h3>
            </div>
            <span className="pp-badge pp-badge-warning text-xs font-bold">
              {pendingRequests.length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            {isLoadingRequests ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                <span>Loading pending requests...</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Leave Type</th>
                    <th className="py-2.5 px-4">Dates</th>
                    <th className="py-2.5 px-4">Duration</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
                  {pendingRequests.map((r: any) => {
                    const empName = r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'N/A'
                    const leaveType = r.timeOffType?.name || 'Leave'
                    const startDateStr = r.startDate?.split('T')[0] || r.startDate
                    const endDateStr = r.endDate?.split('T')[0] || r.endDate

                    return (
                      <tr key={r.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                          {empName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="pp-badge pp-badge-neutral text-[11px]">{leaveType}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {startDateStr} &rarr; {endDateStr}
                        </td>
                        <td className="py-3 px-4 font-bold">{r.duration || 1} Days</td>
                        <td className="py-3 px-4 text-[var(--color-text-muted)] max-w-xs truncate">
                          {r.reason || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApprove(r.id, empName)}
                              disabled={approveMutation.isPending}
                              title="Approve leave"
                              className="p-1 text-[#00C853] hover:bg-[#00C853]/10 rounded border border-[#00C853]/30 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRefuse(r.id, empName)}
                              disabled={refuseMutation.isPending}
                              title="Refuse leave"
                              className="p-1 text-[#FF1744] hover:bg-[#FF1744]/10 rounded border border-[#FF1744]/30 cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {pendingRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                        No pending leave requests requiring approval.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Leave Request History Table */}
      <div className="pp-card border border-[var(--color-border)] shadow-xs rounded-[6px] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
            Leave Requests History
          </h3>
        </div>

        <div className="overflow-x-auto">
          {isLoadingRequests ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
              <span>Loading leave history...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
              No leave requests found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Leave Type</th>
                  <th className="py-2.5 px-4">Dates</th>
                  <th className="py-2.5 px-4">Days</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
                {requests.map((r: any) => {
                  const empName = r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'N/A'
                  const leaveType = r.timeOffType?.name || 'Leave'
                  const startDateStr = r.startDate?.split('T')[0] || r.startDate
                  const endDateStr = r.endDate?.split('T')[0] || r.endDate

                  return (
                    <tr key={r.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                        {empName}
                      </td>
                      <td className="py-3 px-4">{leaveType}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {startDateStr} &rarr; {endDateStr}
                      </td>
                      <td className="py-3 px-4 font-semibold">{r.duration || 1} Days</td>
                      <td className="py-3 px-4">
                        <span
                          className={`pp-badge uppercase text-[10px] font-bold ${
                            r.status === 'approved'
                              ? 'pp-badge-success'
                              : r.status === 'refused' || r.status === 'cancelled'
                              ? 'pp-badge-danger'
                              : 'pp-badge-warning'
                          }`}
                        >
                          {r.status}
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

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[8px] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-text-heading)]">
                Submit Time Off Request
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-3">
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
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="pp-input text-xs w-full"
                  required
                >
                  {leaveTypes.map((type: any) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
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
                    value={newFrom}
                    onChange={(e) => setNewFrom(e.target.value)}
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
                    min={newFrom || todayStr}
                    max={maxStr}
                    value={newTo}
                    onChange={(e) => setNewTo(e.target.value)}
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
                  onClick={() => setIsModalOpen(false)}
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
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
