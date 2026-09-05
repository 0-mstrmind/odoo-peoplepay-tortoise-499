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
  ChevronDown,
  Trash2,
  Layers,
  Calculator,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthUser, canAccessPayroll } from '@/store/auth.store'
import {
  useContracts,
  useWorkingSchedules,
  useUpdateContract,
} from '@/hooks/use-contracts'
import {
  useSalaryStructures,
  useSalaryRules,
  useDeleteSalaryRule,
} from '@/hooks/use-salary'
import { CreateContractModal } from './CreateContractModal'
import { CreateSalaryStructureModal } from './CreateSalaryStructureModal'
import { CreateSalaryRuleModal } from './CreateSalaryRuleModal'
import { CreateWorkingScheduleModal } from './CreateWorkingScheduleModal'

export const ContractsView: React.FC = () => {
  const user = useAuthUser()
  const role = (user?.role || '').toLowerCase()
  const canActivate = role === 'admin' || role === 'super_admin' || role === 'hr_payroll_manager'

  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const statusParam = searchParams.get('status')
  const activeTab = !tabParam || tabParam === 'pending' ? 'contracts' : tabParam

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (statusParam) return statusParam
    if (tabParam === 'pending') return 'draft'
    return 'all'
  })

  React.useEffect(() => {
    const s = searchParams.get('status')
    const t = searchParams.get('tab')
    if (s) {
      setStatusFilter(s)
    } else if (t === 'pending') {
      setStatusFilter('draft')
    }
  }, [searchParams])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isCreateStructureModalOpen, setIsCreateStructureModalOpen] = useState(false)
  const [isCreateRuleModalOpen, setIsCreateRuleModalOpen] = useState(false)
  const [structSubView, setStructSubView] = useState<'structures' | 'rules'>('structures')
  const [expandedStructureId, setExpandedStructureId] = useState<string | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const isPayrollUser = canAccessPayroll(user?.role)

  const updateContractMutation = useUpdateContract()
  const deleteSalaryRuleMutation = useDeleteSalaryRule()

  const { data: salaryRules = [], isLoading: isLoadingRules } = useSalaryRules()

  const handleDeleteRule = async (ruleId: string, ruleCode: string) => {
    if (!window.confirm(`Are you sure you want to delete salary rule ${ruleCode}?`)) return
    try {
      await deleteSalaryRuleMutation.mutateAsync(ruleId)
      toast.success(`Rule ${ruleCode} deleted successfully!`)
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete rule'
      toast.error(msg)
    }
  }

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

  const { data: contracts = [], isLoading: isLoadingContracts } = useContracts()

  const { data: salaryStructures = [], isLoading: isLoadingStructures } = useSalaryStructures()
  const { data: workingSchedules = [], isLoading: isLoadingSchedules } = useWorkingSchedules()

  // Filtered contracts on client side
  const filteredContracts = contracts.filter((c) => {
    const ref = c.contractReference || ''
    const empName = c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : ''
    const dept = c.department?.name || ''
    const job = c.jobPosition?.title || ''
    const matchesSearch =
      !search ||
      empName.toLowerCase().includes(search.toLowerCase()) ||
      ref.toLowerCase().includes(search.toLowerCase()) ||
      dept.toLowerCase().includes(search.toLowerCase()) ||
      job.toLowerCase().includes(search.toLowerCase())

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

        {activeTab === 'schedules' ? (
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Working Schedule</span>
          </button>
        ) : activeTab === 'contracts' ? (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Contract</span>
          </button>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--color-border)] flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSearchParams({})
            setStatusFilter('all')
          }}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'contracts'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          All Contracts
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

      {/* Tab 1: Contracts List (All Contracts & Pending Approval inside) */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          {draftContractsCount > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-[6px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  {draftContractsCount} contract{draftContractsCount === 1 ? '' : 's'} pending approval.
                </span>
              </div>
              <div className="flex items-center gap-3">
                {statusFilter !== 'draft' ? (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('draft')}
                    className="text-xs font-bold text-amber-800 dark:text-amber-300 underline hover:no-underline cursor-pointer"
                  >
                    Filter Pending Approval ({draftContractsCount})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="text-xs font-bold text-amber-800 dark:text-amber-300 underline hover:no-underline cursor-pointer"
                  >
                    Show All Contracts
                  </button>
                )}
                {canActivate && (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    Click &quot;Approve&quot; below to activate.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
              className={`pp-card p-4 flex items-center gap-3 cursor-pointer transition-all ${
                statusFilter === 'active'
                  ? 'ring-2 ring-[#00C853] bg-[#00C853]/10'
                  : 'hover:border-[#00C853]/50'
              }`}
              title="Click to filter Active contracts"
            >
              <div className="w-10 h-10 rounded-lg bg-[rgba(0,200,83,0.12)] text-[#00C853] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Active Contracts</p>
                <p className="text-lg font-extrabold text-[var(--color-text-heading)]">{activeContractsCount}</p>
              </div>
            </div>

            <div
              onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')}
              className={`pp-card p-4 flex items-center gap-3 cursor-pointer transition-all ${
                statusFilter === 'draft'
                  ? 'ring-2 ring-amber-500 bg-amber-500/10'
                  : 'hover:border-amber-400/50'
              }`}
              title="Click to filter Pending Approval contracts"
            >
              <div className="w-10 h-10 rounded-lg bg-[rgba(255,170,0,0.12)] text-[#FFAA00] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Pending Approval</p>
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

          {/* Quick Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Quick Filter Pills inside All Contracts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
                }`}
              >
                All ({contracts.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('draft')}
                className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === 'draft'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:text-amber-600'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Approval</span>
                {draftContractsCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      statusFilter === 'draft' ? 'bg-white text-amber-700' : 'bg-amber-500 text-white'
                    }`}
                  >
                    {draftContractsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === 'active'
                    ? 'bg-[#00C853] text-white shadow-xs'
                    : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:text-[#00C853]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active ({activeContractsCount})</span>
              </button>
            </div>

            {/* Search input & Select */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search contracts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pp-input pl-9 text-xs w-full"
                />
              </div>

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

      {/* Tab 2: Salary Structures & Rules */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          {/* Header with Actions */}
          <div className="pp-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-[var(--color-text-heading)] flex items-center gap-2 mb-0">
                <Building2 className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Salary Structures & Rules Configuration</span>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-0">
                Configure custom salary structures and reusable compensation rules (Basic, HRA, Allowances, PF, Net).
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsCreateRuleModalOpen(true)}
                className="pp-btn-secondary text-xs py-2 px-3 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>New Salary Rule</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateStructureModalOpen(true)}
                className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>New Structure</span>
              </button>
            </div>
          </div>

          {/* Sub-view switcher */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
            <button
              type="button"
              onClick={() => setStructSubView('structures')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                structSubView === 'structures'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Structures ({salaryStructures.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setStructSubView('rules')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                structSubView === 'rules'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Rules Catalog ({salaryRules.length})</span>
            </button>
          </div>

          {/* Sub-view 1: Salary Structures */}
          {structSubView === 'structures' && (
            isLoadingStructures ? (
              <div className="pp-card py-12 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                <span>Loading salary structures...</span>
              </div>
            ) : salaryStructures.length === 0 ? (
              <div className="pp-card py-12 text-center text-xs text-[var(--color-text-muted)] space-y-3">
                <p>No salary structures configured yet.</p>
                <button
                  type="button"
                  onClick={() => setIsCreateStructureModalOpen(true)}
                  className="pp-btn-primary text-xs py-2 px-3 font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Structure</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {salaryStructures.map((struct) => {
                  const isExpanded = expandedStructureId === struct.id
                  const rules = struct.rules || []

                  return (
                    <div
                      key={struct.id}
                      className="pp-card p-4 border border-[var(--color-border)] rounded-[8px] space-y-3 transition-all hover:border-[var(--color-primary)]/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-[var(--color-text-heading)]">
                              {struct.name}
                            </span>
                            <span className="font-mono text-xs font-bold text-[var(--color-primary)] bg-[rgba(113,72,103,0.08)] px-1.5 py-0.5 rounded">
                              {struct.code}
                            </span>
                            <span
                              className={`pp-badge text-[10px] uppercase font-bold ${
                                struct.active ? 'pp-badge-success' : 'pp-badge-neutral'
                              }`}
                            >
                              {struct.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {struct.description && (
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                              {struct.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right text-xs">
                            <span className="text-[var(--color-text-muted)] block text-[11px]">
                              {struct.ruleCount ?? rules.length} Rules &bull; {struct.employeeCount ?? 0} Contracts
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedStructureId(isExpanded ? null : struct.id)}
                            className="pp-btn-secondary text-xs py-1.5 px-2.5 rounded-[4px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Rules' : 'View Formula Rules'}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Rules Breakdown */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-2">
                          <h5 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                            Evaluation Order & Formula Rules:
                          </h5>
                          {rules.length === 0 ? (
                            <p className="text-xs text-[var(--color-text-muted)] italic py-2">
                              No rules linked to this structure yet.
                            </p>
                          ) : (
                            <div className="overflow-x-auto border border-[var(--color-border)] rounded-[6px]">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-[var(--color-bg-muted)] border-b border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase">
                                    <th className="py-2 px-3">Sequence</th>
                                    <th className="py-2 px-3">Rule Name</th>
                                    <th className="py-2 px-3">Code</th>
                                    <th className="py-2 px-3">Category</th>
                                    <th className="py-2 px-3">Method</th>
                                    <th className="py-2 px-3">Computation Details</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)] text-xs">
                                  {rules.map((r, idx) => (
                                    <tr key={r.ruleId || idx} className="hover:bg-[var(--color-bg-muted)]/40">
                                      <td className="py-2 px-3 font-mono font-bold text-[var(--color-primary)]">
                                        {r.sequence}
                                      </td>
                                      <td className="py-2 px-3 font-semibold text-[var(--color-text-heading)]">
                                        {r.name}
                                      </td>
                                      <td className="py-2 px-3 font-mono font-bold text-[var(--color-text-muted)]">
                                        {r.code}
                                      </td>
                                      <td className="py-2 px-3">
                                        <span
                                          className={`pp-badge text-[9px] uppercase font-bold ${
                                            r.category === 'basic'
                                              ? 'pp-badge-success'
                                              : r.category === 'deduction'
                                              ? 'pp-badge-danger'
                                              : 'pp-badge-neutral'
                                          }`}
                                        >
                                          {r.category}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 capitalize text-[var(--color-text-muted)]">
                                        {r.computationMethod}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-[11px]">
                                        {r.computationMethod === 'fixed' && `₹${Number(r.amount || 0).toLocaleString()}`}
                                        {r.computationMethod === 'percentage' && `${r.percentageValue}% of ${r.basedOnCode || 'BASIC'}`}
                                        {r.computationMethod === 'formula' && `${r.formula}`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* Sub-view 2: Salary Rules Catalog */}
          {structSubView === 'rules' && (
            <div className="space-y-4">
              <div className="pp-card overflow-x-auto border border-[var(--color-border)] rounded-[6px] shadow-xs p-0">
                {isLoadingRules ? (
                  <div className="py-12 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                    <span>Loading rules catalog...</span>
                  </div>
                ) : salaryRules.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--color-text-muted)] space-y-3">
                    <p>No salary rules in catalog.</p>
                    <button
                      type="button"
                      onClick={() => setIsCreateRuleModalOpen(true)}
                      className="pp-btn-primary text-xs py-2 px-3 font-semibold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create First Rule</span>
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        <th className="py-2.5 px-4">Code</th>
                        <th className="py-2.5 px-4">Rule Name</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Computation Method</th>
                        <th className="py-2.5 px-4">Formula / Value</th>
                        <th className="py-2.5 px-4">Default Seq</th>
                        <th className="py-2.5 px-4">On Payslip</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
                      {salaryRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[var(--color-primary)]">
                            {rule.code}
                          </td>
                          <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                            {rule.name}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`pp-badge text-[10px] uppercase font-bold ${
                                rule.category === 'basic'
                                  ? 'pp-badge-success'
                                  : rule.category === 'deduction'
                                  ? 'pp-badge-danger'
                                  : 'pp-badge-neutral'
                              }`}
                            >
                              {rule.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 capitalize text-[var(--color-text-muted)]">
                            {rule.computationMethod}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] font-semibold text-[var(--color-text-heading)]">
                            {rule.computationMethod === 'fixed' && `₹${Number(rule.amount || 0).toLocaleString()}`}
                            {rule.computationMethod === 'percentage' && `${rule.percentageValue}% of ${rule.basedOnCode || 'BASIC'}`}
                            {rule.computationMethod === 'formula' && `${rule.formula}`}
                          </td>
                          <td className="py-3 px-4 font-mono text-[var(--color-text-muted)]">
                            {rule.sequence}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`pp-badge text-[9px] font-semibold ${
                                rule.appearsOnPayslip ? 'pp-badge-success' : 'pp-badge-neutral'
                              }`}
                            >
                              {rule.appearsOnPayslip ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id, rule.code)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                              title={`Delete rule ${rule.code}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Working Schedules */}
      {activeTab === 'schedules' && (
        <div className="pp-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-heading)] flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Working Schedules</span>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-0">
                Define standard working calendars used for attendance tracking and wage proration.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Working Schedule</span>
            </button>
          </div>

          {isLoadingSchedules ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
              <span>Loading working schedules...</span>
            </div>
          ) : workingSchedules.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--color-text-muted)] space-y-3">
              <p className="mb-0">No working schedules configured yet.</p>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(true)}
                className="pp-btn-primary text-xs py-2 px-4 rounded font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Working Schedule</span>
              </button>
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

      {/* Create Salary Structure Modal */}
      <CreateSalaryStructureModal
        isOpen={isCreateStructureModalOpen}
        onClose={() => setIsCreateStructureModalOpen(false)}
      />

      {/* Create Salary Rule Modal */}
      <CreateSalaryRuleModal
        isOpen={isCreateRuleModalOpen}
        onClose={() => setIsCreateRuleModalOpen(false)}
      />

      {/* Create Working Schedule Modal */}
      <CreateWorkingScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />
    </div>
  )
}
