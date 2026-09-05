import React, { useState, useEffect } from 'react'
import { X, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateAttendance } from '@/hooks/use-api'

interface ManualAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  initialEmployeeId?: string
  initialEmployeeName?: string
  defaultDate?: string
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  initialEmployeeId = '',
  initialEmployeeName = '',
  defaultDate = new Date().toISOString().split('T')[0],
}) => {
  const [employeeId, setEmployeeId] = useState(initialEmployeeId)
  const [employeeName, setEmployeeName] = useState(initialEmployeeName)
  const [attendanceDate, setAttendanceDate] = useState(defaultDate)
  const [checkInTime, setCheckInTime] = useState('09:00')
  const [checkOutTime, setCheckOutTime] = useState('18:00')
  const [status, setStatus] = useState('present')
  const [reason, setReason] = useState('')

  const createAttendanceMutation = useCreateAttendance()

  useEffect(() => {
    if (initialEmployeeId) {
      setEmployeeId(initialEmployeeId)
    }
    if (initialEmployeeName) {
      setEmployeeName(initialEmployeeName)
    }
    if (defaultDate) {
      setAttendanceDate(defaultDate)
    }
  }, [initialEmployeeId, initialEmployeeName, defaultDate])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employeeId) {
      toast.error('Please specify an employee')
      return
    }

    try {
      const checkInIso = checkInTime ? new Date(`${attendanceDate}T${checkInTime}:00`).toISOString() : null
      const checkOutIso = checkOutTime ? new Date(`${attendanceDate}T${checkOutTime}:00`).toISOString() : null

      await createAttendanceMutation.mutateAsync({
        employeeId,
        attendanceDate,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        status,
        correctionReason: reason || 'Manual attendance entry recorded by HR Manager',
      })

      toast.success(`Attendance recorded for ${employeeName || 'employee'}!`, {
        description: `Marked as ${status} on ${attendanceDate}.`,
      })
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record attendance entry')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[8px] shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-base font-bold text-[var(--color-text-heading)]">
              Record Attendance Entry
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Employee display or input */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
              Employee
            </label>
            <input
              type="text"
              value={employeeName || employeeId}
              disabled={!!initialEmployeeId}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Employee name or ID"
              className="pp-input text-xs w-full disabled:opacity-75"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
              Attendance Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="pp-input text-xs w-full"
              required
            />
          </div>

          {/* Check-In & Check-Out Time Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                Check-In Time
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="pp-input text-xs w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                Check-Out Time
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="pp-input text-xs w-full"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
              Attendance Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="pp-input text-xs w-full"
            >
              <option value="present">Present (On-Time)</option>
              <option value="late">Late Arrival</option>
              <option value="half_day">Half Day</option>
              <option value="absent">Absent</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          {/* Reason / Remarks */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
              HR Remarks / Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Logged based on biometrics / manual approval"
              className="pp-input text-xs w-full h-16 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="pp-btn-secondary text-xs py-2 px-3.5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAttendanceMutation.isPending}
              className="pp-btn-primary text-xs py-2 px-4 cursor-pointer"
            >
              {createAttendanceMutation.isPending ? 'Saving...' : 'Confirm & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
