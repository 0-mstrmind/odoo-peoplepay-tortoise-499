import React, { useState } from 'react'
import {
  Calendar,
  Plus,
  FileCheck,
  Check,
  X,
} from 'lucide-react'
import { useAuthUser } from '@/store/auth.store'

interface LeaveRequestItem {
  id: string
  employeeName: string
  leaveType: string
  dateFrom: string
  dateTo: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'refused'
}

const INITIAL_REQUESTS: LeaveRequestItem[] = [
  {
    id: 'req-1',
    employeeName: 'Aarav Mehta',
    leaveType: 'Casual Leave',
    dateFrom: '2026-09-10',
    dateTo: '2026-09-12',
    days: 3,
    reason: 'Family function in Ahmedabad',
    status: 'pending',
  },
  {
    id: 'req-2',
    employeeName: 'Maya Shah',
    leaveType: 'Sick Leave',
    dateFrom: '2026-09-08',
    dateTo: '2026-09-08',
    days: 1,
    reason: 'Medical appointment',
    status: 'pending',
  },
  {
    id: 'req-3',
    employeeName: 'Rohan Patel',
    leaveType: 'Paid Time Off',
    dateFrom: '2026-08-20',
    dateTo: '2026-08-22',
    days: 3,
    reason: 'Vacation',
    status: 'approved',
  },
  {
    id: 'req-4',
    employeeName: 'Nisha Rao',
    leaveType: 'Unpaid Leave',
    dateFrom: '2026-08-15',
    dateTo: '2026-08-16',
    days: 2,
    reason: 'Personal emergency',
    status: 'approved',
  },
]

export const TimeOffView: React.FC = () => {
  const user = useAuthUser()
  const role = user?.role
  const canApprove = role === 'admin' || role === 'super_admin' || role === 'hr_manager'

  const [requests, setRequests] = useState<LeaveRequestItem[]>(INITIAL_REQUESTS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // New request form state
  const [newType, setNewType] = useState('Paid Time Off')
  const [newFrom, setNewFrom] = useState('2026-09-15')
  const [newTo, setNewTo] = useState('2026-09-16')
  const [newReason, setNewReason] = useState('')

  const handleApprove = (id: string, name: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    )
    setFeedback(`Approved leave request for ${name}.`)
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleRefuse = (id: string, name: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'refused' } : r))
    )
    setFeedback(`Refused leave request for ${name}.`)
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    const newReq: LeaveRequestItem = {
      id: `req-${Date.now()}`,
      employeeName: user?.name || user?.email || 'Current User',
      leaveType: newType,
      dateFrom: newFrom,
      dateTo: newTo,
      days: 2,
      reason: newReason || 'Personal leave request',
      status: 'pending',
    }
    setRequests([newReq, ...requests])
    setIsModalOpen(false)
    setNewReason('')
    setFeedback('Leave request submitted successfully!')
    setTimeout(() => setFeedback(null), 3000)
  }

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
          onClick={() => setIsModalOpen(true)}
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

      {/* Leave Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pp-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-text-heading)]">Paid Time Off (PTO)</span>
            <span className="pp-badge pp-badge-neutral text-[10px]">18 / 24 Days Left</span>
          </div>
          <div className="w-full bg-[var(--color-bg-muted)] h-2 rounded-full overflow-hidden mt-2">
            <div className="bg-[var(--color-primary)] h-full w-3/4"></div>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] pt-1">6 days taken this year</p>
        </div>

        <div className="pp-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-text-heading)]">Sick Leave</span>
            <span className="pp-badge pp-badge-neutral text-[10px]">7 / 10 Days Left</span>
          </div>
          <div className="w-full bg-[var(--color-bg-muted)] h-2 rounded-full overflow-hidden mt-2">
            <div className="bg-[#00C853] h-full w-[70%]"></div>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] pt-1">3 days taken this year</p>
        </div>

        <div className="pp-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-text-heading)]">Casual Leave</span>
            <span className="pp-badge pp-badge-neutral text-[10px]">4 / 6 Days Left</span>
          </div>
          <div className="w-full bg-[var(--color-bg-muted)] h-2 rounded-full overflow-hidden mt-2">
            <div className="bg-[#FFAA00] h-full w-[66%]"></div>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] pt-1">2 days taken this year</p>
        </div>
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
              {requests.filter((r) => r.status === 'pending').length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
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
                {requests
                  .filter((r) => r.status === 'pending')
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                        {r.employeeName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="pp-badge pp-badge-neutral text-[11px]">{r.leaveType}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {r.dateFrom} &rarr; {r.dateTo}
                      </td>
                      <td className="py-3 px-4 font-bold">{r.days} Days</td>
                      <td className="py-3 px-4 text-[var(--color-text-muted)] max-w-xs truncate">
                        {r.reason}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(r.id, r.employeeName)}
                            title="Approve leave"
                            className="p-1 text-[#00C853] hover:bg-[#00C853]/10 rounded border border-[#00C853]/30 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRefuse(r.id, r.employeeName)}
                            title="Refuse leave"
                            className="p-1 text-[#FF1744] hover:bg-[#FF1744]/10 rounded border border-[#FF1744]/30 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {requests.filter((r) => r.status === 'pending').length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                      No pending leave requests requiring approval.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                    {r.employeeName}
                  </td>
                  <td className="py-3 px-4">{r.leaveType}</td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {r.dateFrom} &rarr; {r.dateTo}
                  </td>
                  <td className="py-3 px-4 font-semibold">{r.days} Days</td>
                  <td className="py-3 px-4">
                    <span
                      className={`pp-badge uppercase text-[10px] font-bold ${
                        r.status === 'approved'
                          ? 'pp-badge-success'
                          : r.status === 'refused'
                          ? 'pp-badge-danger'
                          : 'pp-badge-warning'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                  Leave Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="pp-input text-xs w-full"
                >
                  <option value="Paid Time Off">Paid Time Off (PTO)</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
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
                  className="pp-btn-primary text-xs py-2 px-4 cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
