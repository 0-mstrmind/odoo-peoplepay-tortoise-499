import { Users, UserCheck, UserX, Clock } from 'lucide-react'
import type { TodayAttendanceStats } from '@/hooks/use-api'

interface AttendanceStatsCardsProps {
  stats?: TodayAttendanceStats
  isLoading?: boolean
  isAllottedOnly?: boolean
}

export const AttendanceStatsCards: React.FC<AttendanceStatsCardsProps> = ({
  stats,
  isLoading = false,
  isAllottedOnly = true,
}) => {
  const total = stats?.totalEmployees ?? 0
  const present = stats?.presentCount ?? 0
  const absent = stats?.absentCount ?? 0
  const late = stats?.lateCount ?? 0
  const halfDay = stats?.halfDayCount ?? 0
  const rate = stats?.attendanceRate ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Employees in Scope */}
      <div className="pp-card p-4 flex items-center justify-between border border-[var(--color-border)] shadow-xs">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {isAllottedOnly ? 'Allotted Employees' : 'Total Employees'}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[var(--color-text-heading)]">
              {isLoading ? '...' : total}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">Active</span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            {isAllottedOnly ? 'Under your HR management' : 'Company-wide workforce'}
          </p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-[rgba(113,72,103,0.1)] text-[var(--color-primary)] flex items-center justify-center font-bold shrink-0">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Present Today */}
      <div className="pp-card p-4 flex items-center justify-between border border-[var(--color-border)] shadow-xs">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Present Today
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#00C853]">
              {isLoading ? '...' : present}
            </span>
            <span className="pp-badge pp-badge-success text-[10px] font-bold">
              {isLoading ? '...' : `${rate}%`}
            </span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            {late > 0 ? `${late} late check-ins` : 'All on time'}
          </p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-[rgba(0,200,83,0.12)] text-[#00C853] flex items-center justify-center font-bold shrink-0">
          <UserCheck className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Absent Today */}
      <div className="pp-card p-4 flex items-center justify-between border border-[var(--color-border)] shadow-xs">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Absent Today
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#FF1744]">
              {isLoading ? '...' : absent}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {total > 0 ? `${(100 - rate).toFixed(1)}%` : '0%'}
            </span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            {stats?.onLeaveCount ? `${stats.onLeaveCount} on approved leave` : 'Not checked in'}
          </p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-[rgba(255,23,68,0.12)] text-[#FF1744] flex items-center justify-center font-bold shrink-0">
          <UserX className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Attention Required / Irregularities */}
      <div className="pp-card p-4 flex items-center justify-between border border-[var(--color-border)] shadow-xs">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Check-In Irregularities
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#FFAA00]">
              {isLoading ? '...' : late + halfDay}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">Cases</span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            {late} late, {halfDay} half-day
          </p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-[rgba(255,170,0,0.12)] text-[#FFAA00] flex items-center justify-center font-bold shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
