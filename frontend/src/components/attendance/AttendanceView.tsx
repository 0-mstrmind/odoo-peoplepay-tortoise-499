import React, { useState } from 'react'
import {
  Clock,
  UserCheck,
  UserX,
  Search,
  Plus,
  Calendar as CalendarIcon,
  Building2,
  RefreshCw,
  History,
  FileCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthUser } from '@/store/auth.store'
import {
  useTodayAttendanceSummary,
  useAttendanceList,
  useAttendanceRequests,
  useDepartmentsMaster,
} from '@/hooks/use-api'
import { AttendanceStatsCards } from './AttendanceStatsCards'
import { TodayPresentTable } from './TodayPresentTable'
import { TodayAbsentTable } from './TodayAbsentTable'
import { AttendanceRequestsTable } from './AttendanceRequestsTable'
import { ManualAttendanceModal } from './ManualAttendanceModal'

export const AttendanceView: React.FC = () => {
  const user = useAuthUser()
  const role = (user?.role || '').toLowerCase()
  const isHRManager = role === 'hr_manager' || role === 'hr_payroll_manager' || role === 'admin' || role === 'super_admin'
  const isAdmin = role === 'admin' || role === 'super_admin'

  // Default to today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'present' | 'absent' | 'requests' | 'logs'>('present')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalEmployeeId, setModalEmployeeId] = useState<string>('')
  const [modalEmployeeName, setModalEmployeeName] = useState<string>('')

  // Backend TanStack Query integrations
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
    isRefetching: isSummaryRefetching,
  } = useTodayAttendanceSummary({
    departmentId: selectedDepartment !== 'all' ? selectedDepartment : undefined,
    date: selectedDate,
    search: searchQuery,
  })

  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useAttendanceRequests({
    departmentId: selectedDepartment !== 'all' ? selectedDepartment : undefined,
    search: searchQuery,
  })

  const {
    data: logsData,
    isLoading: isLogsLoading,
    refetch: refetchLogs,
  } = useAttendanceList({
    departmentId: selectedDepartment !== 'all' ? selectedDepartment : undefined,
    date: selectedDate,
    search: searchQuery,
    page: 1,
    limit: 50,
  })

  // Departments list from backend
  const { data: departments = summaryData?.departments || [] } = useDepartmentsMaster()

  const handleOpenManualModal = (empId?: string, empName?: string) => {
    setModalEmployeeId(empId || '')
    setModalEmployeeName(empName || '')
    setIsModalOpen(true)
  }

  const presentCount = summaryData?.stats.presentCount ?? 0
  const absentCount = summaryData?.stats.absentCount ?? 0
  const requestItems = (requestsData as any)?.items || (Array.isArray(requestsData) ? requestsData : [])
  const pendingRequestsCount =
    summaryData?.stats?.pendingRequestsCount ??
    requestItems.filter((r: any) => !r.isCorrected && r.status !== 'absent').length
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
            Real-time daily attendance monitoring, check-in tracking, and workforce attendance supervision.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              refetchSummary()
              refetchRequests()
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


      {/* 3. KPI Metrics Summary Cards */}
      <AttendanceStatsCards
        stats={summaryData?.stats}
        isLoading={isSummaryLoading}
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

      {/* Pending Attendance Requests Alert Banner */}
      {pendingRequestsCount > 0 && activeTab !== 'requests' && (
        <div className="pp-card p-3.5 border-l-4 border-l-[#FFAA00] border-[var(--color-border)] bg-[rgba(255,170,0,0.06)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[rgba(255,170,0,0.15)] text-[#FFAA00] flex items-center justify-center shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--color-text-heading)]">
                {pendingRequestsCount} Pending Attendance Request{pendingRequestsCount === 1 ? '' : 's'} Awaiting Approval
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Employees have submitted manual attendance or correction requests requiring your review.
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

      {/* 5. Navigation Tabs: Today Present, Today Absent, Attendance Requests, History Logs */}
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

          {/* Tab 3: Attendance Requests (Corrections / Manual Punches) */}
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[rgba(113,72,103,0.04)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Attendance Requests</span>
            {pendingRequestsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFAA00] text-black">
                {pendingRequestsCount}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
                {requestItems.length}
              </span>
            )}
          </button>

          {/* Tab 4: Attendance History & Logs */}
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

      {activeTab === 'requests' && (
        <AttendanceRequestsTable
          items={requestItems}
          isLoading={isRequestsLoading}
          onRefresh={() => {
            refetchRequests()
            refetchSummary()
            refetchLogs()
          }}
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
          refetchRequests()
          refetchLogs()
        }}
        initialEmployeeId={modalEmployeeId}
        initialEmployeeName={modalEmployeeName}
        defaultDate={selectedDate}
      />
    </div>
  )
}
