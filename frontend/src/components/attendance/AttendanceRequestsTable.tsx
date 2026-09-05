import React, { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Trash2,
  Calendar,
  Clock,
  MessageSquare,
  AlertTriangle,
  X,
  FileCheck,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useApproveAttendanceRequest,
  useRefuseAttendanceRequest,
  useDeleteAttendance,
  type AttendanceRecordItem,
} from '@/hooks/use-api'

interface AttendanceRequestsTableProps {
  items: AttendanceRecordItem[]
  isLoading?: boolean
  onRefresh?: () => void
}

export const AttendanceRequestsTable: React.FC<AttendanceRequestsTableProps> = ({
  items,
  isLoading = false,
  onRefresh,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'refused'>('pending')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'refuse' | 'delete' | null>(null)
  const [processedIds, setProcessedIds] = useState<Map<string, 'approved' | 'refused' | 'deleted'>>(new Map())

  const [activeModal, setActiveModal] = useState<{
    type: 'approve' | 'refuse' | 'delete'
    item: AttendanceRecordItem
  } | null>(null)
  const [reviewNote, setReviewNote] = useState('')

  const approveMutation = useApproveAttendanceRequest()
  const refuseMutation = useRefuseAttendanceRequest()
  const deleteMutation = useDeleteAttendance()

  const handleQuickApprove = async (item: AttendanceRecordItem) => {
    setActionLoadingId(item.id)
    setActionType('approve')
    try {
      await approveMutation.mutateAsync({ id: item.id })
      setProcessedIds((prev) => new Map(prev).set(item.id, 'approved'))
      toast.success(`Attendance request approved for ${item.employee?.firstName || 'employee'}`)
      onRefresh?.()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve request')
    } finally {
      setActionLoadingId(null)
      setActionType(null)
    }
  }

  const handleOpenAction = (type: 'approve' | 'refuse' | 'delete', item: AttendanceRecordItem) => {
    setActiveModal({ type, item })
    setReviewNote('')
  }

  const handleConfirmAction = async () => {
    if (!activeModal) return
    const { type, item } = activeModal
    setActionLoadingId(item.id)
    setActionType(type)

    try {
      if (type === 'approve') {
        await approveMutation.mutateAsync({
          id: item.id,
          reviewNote: reviewNote.trim() || undefined,
        })
        setProcessedIds((prev) => new Map(prev).set(item.id, 'approved'))
        toast.success(`Attendance request approved for ${item.employee?.firstName || 'employee'}`)
      } else if (type === 'refuse') {
        await refuseMutation.mutateAsync({
          id: item.id,
          reviewNote: reviewNote.trim() || undefined,
        })
        setProcessedIds((prev) => new Map(prev).set(item.id, 'refused'))
        toast.info(`Attendance request rejected for ${item.employee?.firstName || 'employee'}`)
      } else if (type === 'delete') {
        await deleteMutation.mutateAsync(item.id)
        setProcessedIds((prev) => new Map(prev).set(item.id, 'deleted'))
        toast.success('Attendance request removed successfully')
      }

      setActiveModal(null)
      onRefresh?.()
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${type} request`)
    } finally {
      setActionLoadingId(null)
      setActionType(null)
    }
  }

  // Helper to determine status
  const getRequestStatus = (req: AttendanceRecordItem) => {
    const override = processedIds.get(req.id)
    if (override === 'deleted') return 'deleted'
    if (override === 'approved') return 'approved'
    if (override === 'refused') return 'refused'
    if (req.status === 'pending') return 'pending'
    if (req.status === 'present' || req.isCorrected) return 'approved'
    if (req.status === 'absent') return 'refused'
    return 'pending'
  }

  // Counts
  const pendingCount = items.filter((req) => getRequestStatus(req) === 'pending').length
  const approvedCount = items.filter((req) => getRequestStatus(req) === 'approved').length
  const refusedCount = items.filter((req) => getRequestStatus(req) === 'refused').length

  // Filter items based on selected tab
  const filteredItems = items.filter((req) => {
    const status = getRequestStatus(req)
    if (status === 'deleted') return false
    if (filterStatus === 'pending') return status === 'pending'
    if (filterStatus === 'approved') return status === 'approved'
    if (filterStatus === 'refused') return status === 'refused'
    return true
  })

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--'
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoString
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Filter Sub-Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[6px] bg-[var(--color-bg-base)] border border-[var(--color-border)]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[var(--color-text-heading)] mr-2">
            Filter Requests:
          </span>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            <span>Pending Review</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${filterStatus === 'pending' ? 'bg-white/20 text-white' : 'bg-black/10 text-[var(--color-text-muted)]'}`}>
              {pendingCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'approved'
                ? 'bg-[#00C853] text-white shadow-xs'
                : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            <span>Approved</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${filterStatus === 'approved' ? 'bg-white/20 text-white' : 'bg-black/10 text-[var(--color-text-muted)]'}`}>
              {approvedCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('refused')}
            className={`px-3 py-1 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'refused'
                ? 'bg-[#FF1744] text-white shadow-xs'
                : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            <span>Refused / Declined</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${filterStatus === 'refused' ? 'bg-white/20 text-white' : 'bg-black/10 text-[var(--color-text-muted)]'}`}>
              {refusedCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[var(--color-bg-base)] text-[var(--color-text-heading)] border border-[var(--color-border)]'
                : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            All ({items.length})
          </button>
        </div>

        <span className="text-[11px] text-[var(--color-text-muted)]">
          Showing {filteredItems.length} attendance request{filteredItems.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* 2. Requests Table */}
      <div className="pp-card border border-[var(--color-border)] shadow-xs rounded-[6px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Requested Punch</th>
                <th className="py-2.5 px-4">Worked Hours</th>
                <th className="py-2.5 px-4">Employee Reason / Note</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">HR Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                    <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mx-auto mb-2" />
                    <span>Loading attendance requests...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center space-y-2">
                    <FileCheck className="w-8 h-8 text-[var(--color-text-muted)] mx-auto opacity-50" />
                    <p className="text-xs font-semibold text-[var(--color-text-heading)]">
                      No attendance requests found
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {filterStatus === 'pending'
                        ? 'All user attendance requests have been processed.'
                        : 'No requests match the selected status filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((req) => {
                  const status = getRequestStatus(req)
                  const isPending = status === 'pending'
                  const isApproved = status === 'approved'
                  const isRefused = status === 'refused'

                  const empName = req.employee
                    ? `${req.employee.firstName} ${req.employee.lastName}`
                    : 'Employee'

                  return (
                    <tr key={req.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                      {/* Employee Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[rgba(113,72,103,0.1)] text-[var(--color-primary)] text-xs font-bold flex items-center justify-center shrink-0">
                            {empName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[var(--color-text-heading)] truncate">
                              {empName}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
                              <span>{req.employee?.employeeCode || 'EMP'}</span>
                              <span>•</span>
                              <span className="truncate">
                                {req.employee?.department?.name || 'General'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[var(--color-text-heading)]">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                          <span>{req.attendanceDate?.split('T')[0] || req.attendanceDate}</span>
                        </div>
                      </td>

                      {/* Punch Times */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                          <span className="font-semibold text-[var(--color-text-heading)]">
                            {formatTime(req.checkIn)}
                          </span>
                          <span className="text-[var(--color-text-muted)]">→</span>
                          <span className="font-semibold text-[var(--color-text-heading)]">
                            {formatTime(req.checkOut)}
                          </span>
                        </div>
                      </td>

                      {/* Worked Hours */}
                      <td className="py-3 px-4 font-mono text-xs font-semibold">
                        {req.workedHours ? `${req.workedHours} hrs` : '--'}
                      </td>

                      {/* Request Reason */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                          <span className="text-[11px] text-[var(--color-text-body)] line-clamp-2" title={req.correctionReason || 'No reason specified'}>
                            {req.correctionReason || 'Manual punch request'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isApproved ? (
                          <span className="pp-badge pp-badge-success text-[10px] font-bold">
                            Approved
                          </span>
                        ) : isRefused ? (
                          <span className="pp-badge pp-badge-danger text-[10px] font-bold">
                            Refused
                          </span>
                        ) : (
                          <span className="pp-badge pp-badge-warning text-[10px] font-bold">
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(() => {
                            const isRowPending = actionLoadingId === req.id
                            const isApproving = isRowPending && actionType === 'approve'
                            const isRefusing = isRowPending && actionType === 'refuse'
                            const isDeleting = isRowPending && actionType === 'delete'
                            const isAnyLoading =
                              isRowPending ||
                              approveMutation.isPending ||
                              refuseMutation.isPending ||
                              deleteMutation.isPending

                            return (
                              <>
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleQuickApprove(req)}
                                      disabled={isAnyLoading}
                                      className="px-2.5 py-1 rounded-[4px] bg-[#00C853] hover:bg-[#00B248] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                      title="Quick Approve Request"
                                    >
                                      {isApproving ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      )}
                                      <span>{isApproving ? 'Approving...' : 'Approve'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAction('refuse', req)}
                                      disabled={isAnyLoading}
                                      className="px-2.5 py-1 rounded-[4px] bg-[rgba(255,23,68,0.1)] hover:bg-[rgba(255,23,68,0.2)] disabled:opacity-60 disabled:cursor-not-allowed text-[#FF1744] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Reject Request"
                                    >
                                      {isRefusing ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <XCircle className="w-3.5 h-3.5" />
                                      )}
                                      <span>{isRefusing ? 'Rejecting...' : 'Reject'}</span>
                                    </button>
                                  </>
                                )}

                                {/* Delete / Remove Request */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenAction('delete', req)}
                                  disabled={isAnyLoading}
                                  className="p-1.5 rounded-[4px] text-[var(--color-text-muted)] hover:text-[#FF1744] hover:bg-[rgba(255,23,68,0.08)] disabled:opacity-50 transition-colors cursor-pointer"
                                  title="Remove Attendance Request"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF1744]" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            )
                          })()}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Action Modal (Approve, Refuse, Delete) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[8px] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2">
                {activeModal.type === 'approve' && <CheckCircle2 className="w-5 h-5 text-[#00C853]" />}
                {activeModal.type === 'refuse' && <XCircle className="w-5 h-5 text-[#FF1744]" />}
                {activeModal.type === 'delete' && <AlertTriangle className="w-5 h-5 text-[#FF1744]" />}
                <h3 className="text-sm font-bold text-[var(--color-text-heading)] capitalize">
                  {activeModal.type === 'approve' && 'Approve Attendance Request'}
                  {activeModal.type === 'refuse' && 'Decline Attendance Request'}
                  {activeModal.type === 'delete' && 'Delete Attendance Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--color-text-body)]">
              <p>
                <strong>Employee:</strong>{' '}
                {activeModal.item.employee
                  ? `${activeModal.item.employee.firstName} ${activeModal.item.employee.lastName} (${activeModal.item.employee.employeeCode})`
                  : activeModal.item.employeeId}
              </p>
              <p>
                <strong>Target Date:</strong> {activeModal.item.attendanceDate?.split('T')[0]}
              </p>
              {activeModal.item.correctionReason && (
                <div className="p-2.5 rounded-[4px] bg-[var(--color-bg-muted)] border border-[var(--color-border)] text-[11px]">
                  <span className="font-semibold text-[var(--color-text-heading)]">User's Note:</span>{' '}
                  {activeModal.item.correctionReason}
                </div>
              )}

              {activeModal.type !== 'delete' ? (
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                    HR Review Note (Optional):
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder={
                      activeModal.type === 'approve'
                        ? 'e.g., Approved based on badge access log'
                        : 'e.g., Mismatched check-in time, please re-submit'
                    }
                    className="pp-input w-full text-xs min-h-[70px]"
                  />
                </div>
              ) : (
                <p className="text-[#FF1744] font-medium pt-2">
                  Are you sure you want to permanently remove this attendance request record?
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="pp-btn-secondary text-xs py-1.5 px-3 rounded-[4px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={
                  approveMutation.isPending ||
                  refuseMutation.isPending ||
                  deleteMutation.isPending ||
                  actionLoadingId !== null
                }
                className={`text-xs py-1.5 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  activeModal.type === 'approve'
                    ? 'bg-[#00C853] hover:bg-[#00B248] text-white'
                    : 'bg-[#FF1744] hover:bg-[#D50000] text-white'
                }`}
              >
                {(approveMutation.isPending || refuseMutation.isPending || deleteMutation.isPending) && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {activeModal.type === 'approve' && (approveMutation.isPending ? 'Approving...' : 'Confirm Approval')}
                {activeModal.type === 'refuse' && (refuseMutation.isPending ? 'Rejecting...' : 'Confirm Rejection')}
                {activeModal.type === 'delete' && (deleteMutation.isPending ? 'Removing...' : 'Confirm Remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
