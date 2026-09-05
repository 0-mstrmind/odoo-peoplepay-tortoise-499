import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  Briefcase,
  Loader2,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthUser, canAccessPayroll } from '@/store/auth.store'
import {
  useContracts,
  useSalaryStructures,
  useWorkingSchedules,
  useUpdateContract,
} from '@/hooks/use-contracts'
import { CreateContractModal } from './CreateContractModal'

export const ContractsView: React.FC = () => {
  const user = useAuthUser()
  const role = (user?.role || '').toLowerCase()
  const canActivate = role === 'admin' || role === 'super_admin' || role === 'hr_payroll_manager'

  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'contracts'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const isPayrollUser = canAccessPayroll(user?.role)

  const updateContractMutation = useUpdateContract()

  const handleActivateContract = async (id: string, contractRef: string) => {
    try {
      setActivatingId(id)
      await updateContractMutation.mutateAsync({
        id,
        data: { status: 'active' },
      })
      toast.success(`Contract ${contractRef} approved and activated successfully!`)
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to activate contract'
      toast.error(message)
    } finally {
      setActivatingId(null)
    }
  }

  const { data: contracts = [], isLoading: isLoadingContracts } = useContracts({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: search ? search : undefined,
  })

  const { data: salaryStructures = [], isLoading: isLoadingStructures } = useSalaryStructures()
  const { data: workingSchedules = [], isLoading: isLoadingSchedules } = useWorkingSchedules()

  // Filtered contracts on client side if search is typed
  const filteredContracts = contracts.filter((c) => {
    const ref = c.contractReference || ''
    const empName = c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : ''
    const dept = c.department?.name || ''
    const matchesSearch =
      empName.toLowerCase().includes(search.toLowerCase()) ||
      ref.toLowerCase().includes(search.toLowerCase()) ||
      dept.toLowerCase().includes(search.toLowerCase())

    if (activeTab === 'pending') {
      return matchesSearch && c.status === 'draft'
    }

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Summary Metrics calculated from live backend data
  const activeContractsCount = contracts.filter((c) => c.status === 'active').length
  const draftContractsCount = contracts.filter((c) => c.status === 'draft').length
  const avgMonthlyWage = contracts.length > 0
    ? Math.round(contracts.reduce((acc, c) => acc + (Number(c.wage) || 0), 0) / contracts.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-heading)] flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[var(--color-primary)]" />
            <span>Contracts Administration</span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Manage employee wage arrangements, working schedules, and assigned salary structures.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--color-border)] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'contracts'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          All Contracts
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'pending' })}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          <span>Pending Approval</span>
          {draftContractsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
              {draftContractsCount}
            </span>
          )}
        </button>

        {isPayrollUser && (
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'structures' })}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'structures'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            Salary Structures
          </button>
        )}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'schedules' })}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'schedules'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          Working Schedules
        </button>
      </div>

      {/* Tab 1: Contracts List (All Contracts & Pending Approval) */}
      {(activeTab === 'contracts' || activeTab === 'pending') && (
        <div className="space-y-4">
          {draftContractsCount > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-[6px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  {draftContractsCount} contract{draftContractsCount === 1 ? '' : 's'} submitted by HR Manager{draftContractsCount === 1 ? '' : 's'} pending admin approval.
                </span>
              </div>
              {canActivate && (
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  Click &quot;Approve&quot; in the table to activate.
                </span>
              )}
            </div>
          )}
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="pp-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(0,200,83,0.12)] text-[#00C853] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Active Contracts</p>
                <p className="text-lg font-extrabold text-[var(--color-text-heading)]">{activeContractsCount}</p>
              </div>
            </div>

            <div className="pp-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(255,170,0,0.12)] text-[#FFAA00] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Draft Contracts</p>
                <p className="text-lg font-extrabold text-[var(--color-text-heading)]">{draftContractsCount}</p>
              </div>
            </div>

            <div className="pp-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Avg Monthly Wage</p>
                <p className="text-lg font-extrabold text-[var(--color-text-heading)]">₹{avgMonthlyWage.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search contracts by employee or ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pp-input pl-9 text-xs w-full"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pp-input text-xs py-1.5"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Pending Approval (Draft)</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Contracts Table */}
          <div className="pp-card overflow-x-auto border border-[var(--color-border)] shadow-xs rounded-[6px]">
            {isLoadingContracts ? (
              <div className="py-12 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                <span>Loading contracts...</span>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
                No contracts found matching criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Contract Ref</th>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Job & Department</th>
                    <th className="py-2.5 px-4">Working Schedule</th>
                    <th className="py-2.5 px-4">Monthly Wage</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
                  {filteredContracts.map((c) => {
                    const empName = c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : 'N/A'
                    const job = c.jobPosition?.title || 'N/A'
                    const dept = c.department?.name || 'N/A'
                    const sched = c.schedule?.name || 'Standard Schedule'

                    return (
                      <tr key={c.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-[var(--color-primary)]">
                          {c.contractReference}
                        </td>
                        <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                          {empName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-[var(--color-text-heading)]">{job}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)]">{dept}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[var(--color-text-muted)]">{sched}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[var(--color-text-heading)]">
                          ₹{Number(c.wage || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`pp-badge uppercase text-[10px] font-bold ${
                              c.status === 'active'
                                ? 'pp-badge-success'
                                : c.status === 'draft'
                                ? 'pp-badge-warning'
                                : 'pp-badge-neutral'
                            }`}
                          >
                            {c.status === 'draft' ? 'Pending Approval' : c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {c.status === 'draft' ? (
                            canActivate ? (
                              <button
                                type="button"
                                disabled={activatingId === c.id}
                                onClick={() => handleActivateContract(c.id, c.contractReference)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[4px] bg-[#00C853] text-white hover:bg-[#00B048] shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                                title="Approve and activate contract"
                              >
                                {activatingId === c.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                )}
                                <span>Approve</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic">
                                Awaiting Admin Review
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approved</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Salary Structures */}
      {activeTab === 'structures' && (
        <div className="pp-card p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--color-text-heading)] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Salary Structures & Rules Configuration</span>
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Salary structures define standard computation formulas (BASIC, HRA, DEDUCTIONS, NET) using rules and expressions.
          </p>

          {isLoadingStructures ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
              <span>Loading salary structures...</span>
            </div>
          ) : salaryStructures.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
              No salary structures configured yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {salaryStructures.map((struct) => (
                <div key={struct.id} className="p-4 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg-muted)]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--color-text-heading)]">{struct.name}</span>
                    <span className={`pp-badge text-[10px] ${struct.active ? 'pp-badge-success' : 'pp-badge-neutral'}`}>
                      {struct.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Code: {struct.code} | Rules: {struct.ruleCount ?? 0} active formulas | Assigned Employees: {struct.employeeCount ?? 0}
                  </p>
                  {struct.description && (
                    <p className="text-[11px] text-[var(--color-text-muted)] italic">{struct.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Working Schedules */}
      {activeTab === 'schedules' && (
        <div className="pp-card p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--color-text-heading)] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Working Schedules</span>
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Define standard working calendars used for attendance tracking and wage proration.
          </p>

          {isLoadingSchedules ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
              <span>Loading working schedules...</span>
            </div>
          ) : workingSchedules.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
              No working schedules configured yet.
            </div>
          ) : (
            <div className="space-y-3">
              {workingSchedules.map((sched) => (
                <div key={sched.id} className="p-3.5 border border-[var(--color-border)] rounded-[6px] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[var(--color-text-heading)]">{sched.name}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {sched.totalWeeklyHours}h/week | Code: {sched.code} | Timezone: {sched.timezone || 'Asia/Kolkata'}
                    </p>
                  </div>
                  <span className={`pp-badge text-xs ${sched.isActive ? 'pp-badge-neutral' : 'pp-badge-warning'}`}>
                    {sched.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Create Contract Modal */}
      <CreateContractModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
