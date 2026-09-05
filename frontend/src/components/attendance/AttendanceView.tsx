import React, { useState } from 'react'
import {
  Clock,
  UserCheck,
  UserX,
  Search,
  Plus,
  LogIn,
  LogOut,
  Calendar as CalendarIcon,
  Shield,
  Building2,
  RefreshCw,
  History,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthUser } from '@/store/auth.store'
import {
  useTodayAttendanceSummary,
  useAttendanceList,
  useCheckIn,
  useCheckOut,
  useDepartmentsMaster,
} from '@/hooks/use-api'
import { AttendanceStatsCards } from './AttendanceStatsCards'
import { TodayPresentTable } from './TodayPresentTable'
import { TodayAbsentTable } from './TodayAbsentTable'
import { ManualAttendanceModal } from './ManualAttendanceModal'

export const AttendanceView: React.FC = () => {
  const user = useAuthUser()
  const role = user?.role
  const isHRManager = role === 'hr_manager' || role === 'hr_payroll_manager'
  const isAdmin = role === 'admin' || role === 'super_admin'

  // Default to today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

  // HR Allotment scope: default true for HR Manager, false for Admin
  const [isAllottedOnly, setIsAllottedOnly] = useState<boolean>(isHRManager && !isAdmin)

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'present' | 'absent' | 'logs'>('present')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalEmployeeId, setModalEmployeeId] = useState<string>('')
  const [modalEmployeeName, setModalEmployeeName] = useState<string>('')

  // Personal punch state
  const [personalPunchActive, setPersonalPunchActive] = useState<boolean>(true)

  // Backend TanStack Query integrations
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
    isRefetching: isSummaryRefetching,
  } = useTodayAttendanceSummary({
    departmentId: selectedDepartment !== 'all' ? selectedDepartment : undefined,
    hrAllotted: isAllottedOnly,
    date: selectedDate,
    search: searchQuery,
  })

  const {
    data: logsData,
    isLoading: isLogsLoading,
    refetch: refetchLogs,
  } = useAttendanceList({
    departmentId: selectedDepartment !== 'all' ? selectedDepartment : undefined,
    hrAllotted: isAllottedOnly,
    date: selectedDate,
    search: searchQuery,
    page: 1,
    limit: 50,
  })

  // Departments list from backend
  const { data: departments = summaryData?.departments || [] } = useDepartmentsMaster()

  // Punch Mutations
  const checkInMutation = useCheckIn()
  const checkOutMutation = useCheckOut()

  const handlePersonalCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync({
        attendanceDate: selectedDate,
      })
      setPersonalPunchActive(true)
      toast.success('Punched in successfully!')
      refetchSummary()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to punch in')
    }
  }

  const handlePersonalCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync()
      setPersonalPunchActive(false)
      toast.success('Punched out successfully!')
      refetchSummary()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to punch out')
    }
  }

  const handleOpenManualModal = (empId?: string, empName?: string) => {
    setModalEmployeeId(empId || '')
    setModalEmployeeName(empName || '')
    setIsModalOpen(true)
  }

  const presentCount = summaryData?.stats.presentCount ?? 0
  const absentCount = summaryData?.stats.absentCount ?? 0
  const logItems = (logsData as any)?.items || (Array.isArray(logsData) ? logsData : [])

  return (
    <div className="space-y-6">
      {/* 1. Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-heading)] flex items-center gap-2.5">
              <Clock className="w-6 h-6 text-[var(--color-primary)]" />
              <span>Attendance Management</span>
            </h1>
            {isHRManager && (
              <span className="pp-badge pp-badge-neutral text-[10px] font-bold uppercase">
                HR Manager Console
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Real-time daily attendance monitoring, check-in tracking, and allotted employee supervision.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              refetchSummary()
              refetchLogs()
              toast.info('Attendance data refreshed')
            }}
            disabled={isSummaryRefetching}
            className="p-2 border border-[var(--color-border)] rounded-[6px] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] transition-colors cursor-pointer"
            title="Refresh Attendance Data"
          >
            <RefreshCw className={`w-4 h-4 ${isSummaryRefetching ? 'animate-spin' : ''}`} />
          </button>

          {/* Record Attendance Action */}
          {(isHRManager || isAdmin) && (
            <button
              type="button"
              onClick={() => handleOpenManualModal()}
              className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Record Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Personal Quick Punch Card & Scope Switcher Banner */}
      <div className="pp-card p-4 border border-[var(--color-border)] bg-[rgba(113,72,103,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: HR Manager Employee Scope Selection */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-xs font-bold text-[var(--color-text-heading)]">
              Workforce Allotment View
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAllottedOnly(true)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all cursor-pointer ${
                isAllottedOnly
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-bg-muted)] text-[var(--color-text-body)] hover:bg-[var(--color-border)]'
              }`}
            >
              Allotted to Me (My Team)
            </button>
            <button
              type="button"
              onClick={() => setIsAllottedOnly(false)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all cursor-pointer ${
                !isAllottedOnly
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-bg-muted)] text-[var(--color-text-body)] hover:bg-[var(--color-border)]'
              }`}
            >
              All Company Employees
            </button>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] pt-0.5">
            {isAllottedOnly
              ? 'Showing only employees whose manager or department is assigned to your HR profile.'
              : 'Showing all active employees across the entire organization.'}
          </p>
        </div>

        {/* Right: Quick Punch Widget for HR Manager */}
        <div className="flex items-center gap-3 p-2.5 rounded-[6px] bg-[var(--color-bg-base)] border border-[var(--color-border)]">
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
              Your Daily Punch
            </span>
            <span className="text-xs font-bold text-[var(--color-text-heading)]">
              {user?.name || user?.email}
            </span>
          </div>

          <div className="h-7 w-px bg-[var(--color-border)] mx-1" />

          {personalPunchActive ? (
            <button
              type="button"
              onClick={handlePersonalCheckOut}
              disabled={checkOutMutation.isPending}
              className="px-3 py-1.5 rounded-[4px] bg-[#FF1744] hover:bg-[#D50000] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{checkOutMutation.isPending ? 'Punching Out...' : 'Punch Out'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePersonalCheckIn}
              disabled={checkInMutation.isPending}
              className="px-3 py-1.5 rounded-[4px] bg-[#00C853] hover:bg-[#00B248] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{checkInMutation.isPending ? 'Punching In...' : 'Punch In'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. KPI Metrics Summary Cards */}
      <AttendanceStatsCards
        stats={summaryData?.stats}
        isLoading={isSummaryLoading}
        isAllottedOnly={isAllottedOnly}
      />

      {/* 4. Filter Bar & Scope Controls */}
      <div className="pp-card p-3.5 border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search input */}
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

        {/* Right: Department selector & Date picker */}
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

          {/* Date Picker */}
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pp-input text-xs py-1.5"
            />
          </div>
        </div>
      </div>

      {/* 5. Navigation Tabs: Today Present, Today Absent, Attendance History Logs */}
      <div className="border-b border-[var(--color-border)] flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {/* Tab 1: Today: Present */}
          <button
            type="button"
            onClick={() => setActiveTab('present')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'present'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[rgba(113,72,103,0.04)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#00C853]" />
            <span>Today: Present</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'present'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[rgba(0,200,83,0.12)] text-[#00C853]'
              }`}
            >
              {presentCount}
            </span>
          </button>

          {/* Tab 2: Today: Absent */}
          <button
            type="button"
            onClick={() => setActiveTab('absent')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'absent'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[rgba(113,72,103,0.04)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            <UserX className="w-4 h-4 text-[#FF1744]" />
            <span>Today: Absent</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'absent'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[rgba(255,23,68,0.12)] text-[#FF1744]'
              }`}
            >
              {absentCount}
            </span>
          </button>

          {/* Tab 3: Attendance History & Logs */}
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[rgba(113,72,103,0.04)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            <History className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Attendance Logs & History</span>
          </button>
        </div>

        <span className="text-[11px] text-[var(--color-text-muted)] hidden sm:inline pr-2">
          Date: <strong className="text-[var(--color-text-heading)]">{selectedDate}</strong>
        </span>
      </div>

      {/* 6. Active Tab Content */}
      {activeTab === 'present' && (
        <TodayPresentTable
          items={summaryData?.present || []}
          isLoading={isSummaryLoading}
          onSelectEmployee={(id, name) => handleOpenManualModal(id, name)}
        />
      )}

      {activeTab === 'absent' && (
        <TodayAbsentTable
          items={summaryData?.absent || []}
          isLoading={isSummaryLoading}
          onLogAttendance={(id, name) => handleOpenManualModal(id, name)}
        />
      )}

      {activeTab === 'logs' && (
        <div className="pp-card border border-[var(--color-border)] shadow-xs rounded-[6px] overflow-hidden">
          <div className="p-3.5 border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--color-text-heading)] uppercase tracking-wider mb-0">
              Complete Attendance Log Records
            </h3>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Showing {logItems.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-base)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Check-In</th>
                  <th className="py-2.5 px-4">Check-Out</th>
                  <th className="py-2.5 px-4">Worked Hours</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
                {isLogsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                      <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mx-auto mb-2" />
                      <span>Loading attendance records...</span>
                    </td>
                  </tr>
                ) : logItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                      No attendance log records found for the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  logItems.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[var(--color-text-heading)]">
                        {rec.attendanceDate?.split('T')[0] || rec.attendanceDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                        {rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : rec.employeeId}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-muted)]">
                        {rec.employee?.department?.name || 'General'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--color-text-muted)]">
                        {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        {rec.workedHours ? `${rec.workedHours} hrs` : '--'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`pp-badge uppercase text-[10px] font-bold ${
                            rec.status === 'present'
                              ? 'pp-badge-success'
                              : rec.status === 'late'
                              ? 'pp-badge-warning'
                              : 'pp-badge-neutral'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Manual Attendance Entry Modal */}
      <ManualAttendanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          refetchSummary()
          refetchLogs()
        }}
        initialEmployeeId={modalEmployeeId}
        initialEmployeeName={modalEmployeeName}
        defaultDate={selectedDate}
      />
    </div>
  )
}
