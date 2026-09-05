import React, { useState } from 'react'
import { X, Calendar, Clock, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateWorkingSchedule } from '@/hooks/use-contracts'

interface CreateWorkingScheduleModalProps {
  isOpen: boolean
  onClose: () => void
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

interface DayConfig {
  dayOfWeek: DayOfWeek
  label: string
  startTime: string
  endTime: string
  breakMinutes: number
  isDayOff: boolean
}

const DEFAULT_DAYS: DayConfig[] = [
  { dayOfWeek: 'monday', label: 'Monday', startTime: '09:00', endTime: '17:00', breakMinutes: 60, isDayOff: false },
  { dayOfWeek: 'tuesday', label: 'Tuesday', startTime: '09:00', endTime: '17:00', breakMinutes: 60, isDayOff: false },
  { dayOfWeek: 'wednesday', label: 'Wednesday', startTime: '09:00', endTime: '17:00', breakMinutes: 60, isDayOff: false },
  { dayOfWeek: 'thursday', label: 'Thursday', startTime: '09:00', endTime: '17:00', breakMinutes: 60, isDayOff: false },
  { dayOfWeek: 'friday', label: 'Friday', startTime: '09:00', endTime: '17:00', breakMinutes: 60, isDayOff: false },
  { dayOfWeek: 'saturday', label: 'Saturday', startTime: '09:00', endTime: '13:00', breakMinutes: 0, isDayOff: true },
  { dayOfWeek: 'sunday', label: 'Sunday', startTime: '09:00', endTime: '17:00', breakMinutes: 0, isDayOff: true },
]

export const CreateWorkingScheduleModal: React.FC<CreateWorkingScheduleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const createMutation = useCreateWorkingSchedule()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [scheduleType, setScheduleType] = useState<'fixed' | 'flexible' | 'shift'>('fixed')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [days, setDays] = useState<DayConfig[]>(DEFAULT_DAYS)

  if (!isOpen) return null

  const handleDayChange = (index: number, field: keyof DayConfig, value: any) => {
    setDays((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Schedule name is required')
      return
    }

    try {
      const payloadLines = days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.isDayOff ? null : d.startTime,
        endTime: d.isDayOff ? null : d.endTime,
        breakDurationMinutes: d.isDayOff ? 0 : Number(d.breakMinutes || 0),
        isDayOff: d.isDayOff,
      }))

      await createMutation.mutateAsync({
        name: name.trim(),
        code: code.trim() || undefined,
        scheduleType,
        timezone,
        scheduleLines: payloadLines,
      })

      toast.success(`Working schedule "${name}" created successfully!`)
      setName('')
      setCode('')
      setDays(DEFAULT_DAYS)
      onClose()
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to create working schedule'
      toast.error(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[8px] shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--color-text-heading)] mb-0">
                Create Working Schedule
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-0">
                Define standard working calendar hours and day-off rules for employee attendance tracking.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[var(--color-text-heading)] mb-1">
                Schedule Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Standard 40h General Shift"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pp-input text-xs w-full"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--color-text-heading)] mb-1">
                Schedule Code / Reference
              </label>
              <input
                type="text"
                placeholder="e.g. SCH-STD-40"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="pp-input text-xs w-full font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--color-text-heading)] mb-1">
                Schedule Type
              </label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as any)}
                className="pp-input text-xs w-full"
              >
                <option value="fixed">Fixed Hours Shift</option>
                <option value="flexible">Flexible Hours</option>
                <option value="shift">Rotational Shift</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[var(--color-text-heading)] mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="pp-input text-xs w-full"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">UTC (Universal Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>

          {/* Weekly Days Schedule Lines */}
          <div className="space-y-2 border-t border-[var(--color-border)] pt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-[var(--color-text-heading)] uppercase tracking-wider mb-0 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Weekly Working Days & Shift Hours</span>
              </h3>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Check &quot;Day Off&quot; for weekends/holidays.
              </span>
            </div>

            <div className="border border-[var(--color-border)] rounded-[6px] overflow-hidden bg-[var(--color-bg-base)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[10px] font-bold text-[var(--color-text-muted)] uppercase">
                    <th className="py-2 px-3">Day</th>
                    <th className="py-2 px-3">Start Time</th>
                    <th className="py-2 px-3">End Time</th>
                    <th className="py-2 px-3">Break (Mins)</th>
                    <th className="py-2 px-3 text-center">Day Off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {days.map((day, idx) => (
                    <tr key={day.dayOfWeek} className={day.isDayOff ? 'bg-gray-500/5' : ''}>
                      <td className="py-2 px-3 font-bold text-[var(--color-text-heading)]">
                        {day.label}
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="time"
                          disabled={day.isDayOff}
                          value={day.startTime}
                          onChange={(e) => handleDayChange(idx, 'startTime', e.target.value)}
                          className="pp-input text-xs py-1 px-2 font-mono disabled:opacity-40"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="time"
                          disabled={day.isDayOff}
                          value={day.endTime}
                          onChange={(e) => handleDayChange(idx, 'endTime', e.target.value)}
                          className="pp-input text-xs py-1 px-2 font-mono disabled:opacity-40"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          max="240"
                          disabled={day.isDayOff}
                          value={day.breakMinutes}
                          onChange={(e) => handleDayChange(idx, 'breakMinutes', parseInt(e.target.value, 10) || 0)}
                          className="pp-input text-xs py-1 px-2 font-mono w-20 disabled:opacity-40"
                        />
                      </td>

                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={day.isDayOff}
                          onChange={(e) => handleDayChange(idx, 'isDayOff', e.target.checked)}
                          className="w-4 h-4 rounded accent-[var(--color-primary)] cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="pp-btn-secondary text-xs py-2 px-4 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="pp-btn-primary text-xs py-2 px-5 font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Create Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
