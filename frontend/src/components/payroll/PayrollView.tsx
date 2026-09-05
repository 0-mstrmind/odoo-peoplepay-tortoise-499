import React, { useState, useMemo } from 'react'
import {
  CreditCard,
  Play,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Layers,
  Settings,
  Calendar,
  Search,
  X,
  AlertCircle,
  RefreshCw,
  Eye,
  Check,
  Ban,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthUser, canWriteSalaryConfig } from '@/store/auth.store'
import { useEmployees } from '@/hooks/use-api'
import {
  usePayruns,
  useCreatePayrun,
  useComputePayrun,
  useValidatePayrun,
  useMarkPaidPayrun,
  useCancelPayrun,
  useSelectPayrunEmployees,
  usePayslips,
  useSalaryStructures,
  useCreateSalaryStructure,
  useUpdateSalaryStructure,
  useDeleteSalaryStructure,
  useSalaryRules,
  useCreateSalaryRule,
  useUpdateSalaryRule,
  useDeleteSalaryRule,
  type Payrun,
  type Payslip,
  type SalaryStructure,
  type SalaryRule,
} from '@/hooks/use-payroll'

type TabType = 'payruns' | 'payslips' | 'structures' | 'rules'

export const PayrollView: React.FC = () => {
  const user = useAuthUser()
  const role = user?.role?.toLowerCase() || ''
  const isPayrollAuthorized =
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'hr_payroll_user' ||
    role === 'payroll_user' ||
    role === 'hr_payroll_manager' ||
    role === 'payroll_manager' ||
    role === 'hr_manager'

  // hr_payroll_user has READ-ONLY access to salary structures/rules
  const canWriteSalary = canWriteSalaryConfig(role)

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('payruns')

  // Select Employees modal
  const [selectEmpPayrun, setSelectEmpPayrun] = useState<Payrun | null>(null)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set())
  const [empSearchQuery, setEmpSearchQuery] = useState('')
  const [isSubmittingSelect, setIsSubmittingSelect] = useState(false)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPayrunId, setSelectedPayrunId] = useState<string>('all')

  // Modals state
  const [isPayrunModalOpen, setIsPayrunModalOpen] = useState(false)
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null)
  const [editingRule, setEditingRule] = useState<SalaryRule | null>(null)

  // Form states for New Payrun
  const [payrunForm, setPayrunForm] = useState({
    name: '',
    periodLabel: '',
    periodStart: '',
    periodEnd: '',
    salaryStructureId: '',
  })

  // Form states for Structure
  const [structureForm, setStructureForm] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
  })

  // Form states for Rule
  const [ruleForm, setRuleForm] = useState<{
    name: string
    code: string
    category: 'basic' | 'allowance' | 'deduction' | 'net'
    sequence: number
    computationMethod: 'fixed' | 'percentage' | 'formula'
    amount: string
    percentageValue: string
    basedOnCode: string
    formula: string
    appearsOnPayslip: boolean
  }>({
    name: '',
    code: '',
    category: 'allowance',
    sequence: 20,
    computationMethod: 'fixed',
    amount: '5000',
    percentageValue: '10',
    basedOnCode: 'BASIC',
    formula: '',
    appearsOnPayslip: true,
  })

  // ── TanStack Query API Hooks ──────────────────────────────────────────────
  const { data: payruns = [], isLoading: isPayrunsLoading, refetch: refetchPayruns } = usePayruns()
  const { data: payslips = [], isLoading: isPayslipsLoading, refetch: refetchPayslips } = usePayslips(
    selectedPayrunId !== 'all' ? { payrunId: selectedPayrunId } : undefined,
  )
  const { data: structures = [], isLoading: isStructuresLoading, refetch: refetchStructures } = useSalaryStructures()
  const { data: rules = [], isLoading: isRulesLoading, refetch: refetchRules } = useSalaryRules()

  // Mutations
  const createPayrunMutation = useCreatePayrun()
  const computePayrunMutation = useComputePayrun()
  const validatePayrunMutation = useValidatePayrun()
  const markPaidPayrunMutation = useMarkPaidPayrun()
  const cancelPayrunMutation = useCancelPayrun()
  const selectEmployeesMutation = useSelectPayrunEmployees()

  // Employees for the Select Employees modal
  const { data: employeesData } = useEmployees({ limit: 200 })

  const createStructureMutation = useCreateSalaryStructure()
  const updateStructureMutation = useUpdateSalaryStructure()
  const deleteStructureMutation = useDeleteSalaryStructure()

  const createRuleMutation = useCreateSalaryRule()
  const updateRuleMutation = useUpdateSalaryRule()
  const deleteRuleMutation = useDeleteSalaryRule()

  // ── Metrics Calculation ───────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalGross = payruns.reduce((sum, p) => sum + Number(p.totalGross || 0), 0)
    const totalDeductions = payruns.reduce((sum, p) => sum + Number(p.totalDeductions || 0), 0)
    const totalNet = payruns.reduce((sum, p) => sum + Number(p.totalNet || 0), 0)
    const activeBatches = payruns.filter((p) => p.status !== 'cancelled').length
    return { totalGross, totalDeductions, totalNet, activeBatches }
  }, [payruns])

  // ── Payrun Handlers ───────────────────────────────────────────────────────
  const handleCreatePayrun = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payrunForm.name || !payrunForm.periodStart || !payrunForm.periodEnd) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await createPayrunMutation.mutateAsync({
        name: payrunForm.name.trim(),
        periodLabel: payrunForm.periodLabel.trim() || payrunForm.name.trim(),
        periodStart: payrunForm.periodStart,   // backend expects YYYY-MM-DD
        periodEnd: payrunForm.periodEnd,         // backend expects YYYY-MM-DD
        salaryStructureId: payrunForm.salaryStructureId || null,
      })
      toast.success('Payrun batch created successfully')
      setIsPayrunModalOpen(false)
      setPayrunForm({ name: '', periodLabel: '', periodStart: '', periodEnd: '', salaryStructureId: '' })
      refetchPayruns()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create payrun')
    }
  }

  const handleValidate = async (id: string) => {
    try {
      await validatePayrunMutation.mutateAsync(id)
      toast.success('Payrun cycle validated! Payslips locked for bank transfer')
      refetchPayruns()
      refetchPayslips()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to validate payrun')
    }
  }

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaidPayrunMutation.mutateAsync(id)
      toast.success('Payrun marked as paid! Disbursement confirmed')
      refetchPayruns()
      refetchPayslips()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark payrun as paid')
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this payrun batch?')) return
    try {
      await cancelPayrunMutation.mutateAsync(id)
      toast.success('Payrun batch cancelled')
      refetchPayruns()
      refetchPayslips()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel payrun')
    }
  }

  // ── Select Employees & Compute ────────────────────────────────────────────
  const handleOpenSelectEmployees = (p: Payrun) => {
    setSelectEmpPayrun(p)
    setSelectedEmployeeIds(new Set())
    setEmpSearchQuery('')
  }

  const handleConfirmSelectAndCompute = async () => {
    if (!selectEmpPayrun) return
    if (selectedEmployeeIds.size === 0) {
      toast.error('Please select at least one employee')
      return
    }
    setIsSubmittingSelect(true)
    try {
      await selectEmployeesMutation.mutateAsync({
        id: selectEmpPayrun.id,
        employeeIds: Array.from(selectedEmployeeIds),
      })
      toast.success(`${selectedEmployeeIds.size} employee(s) added to payrun`)
      // Now immediately compute
      await computePayrunMutation.mutateAsync(selectEmpPayrun.id)
      toast.success('Payrun computed successfully!')
      setSelectEmpPayrun(null)
      refetchPayruns()
      refetchPayslips()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process payrun')
    } finally {
      setIsSubmittingSelect(false)
    }
  }

  // ── Structure Handlers ────────────────────────────────────────────────────
  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!structureForm.name || !structureForm.code) {
      toast.error('Name and code are required')
      return
    }

    try {
      if (editingStructure) {
        await updateStructureMutation.mutateAsync({
          id: editingStructure.id,
          payload: {
            name: structureForm.name.trim(),
            code: structureForm.code.trim().toUpperCase(),
            description: structureForm.description.trim() || undefined,
            isActive: structureForm.isActive,
          },
        })
        toast.success('Salary structure updated successfully')
      } else {
        await createStructureMutation.mutateAsync({
          name: structureForm.name.trim(),
          code: structureForm.code.trim().toUpperCase(),
          description: structureForm.description.trim() || undefined,
          isActive: structureForm.isActive,
        })
        toast.success('Salary structure created successfully')
      }
      setIsStructureModalOpen(false)
      setEditingStructure(null)
      setStructureForm({ name: '', code: '', description: '', isActive: true })
      refetchStructures()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save salary structure')
    }
  }

  const handleDeleteStructure = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete structure "${name}"?`)) return
    try {
      await deleteStructureMutation.mutateAsync(id)
      toast.success('Salary structure deleted')
      refetchStructures()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cannot delete salary structure')
    }
  }

  // ── Rule Handlers ─────────────────────────────────────────────────────────
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleForm.name || !ruleForm.code) {
      toast.error('Rule name and code are required')
      return
    }

    try {
      const payload: Partial<SalaryRule> = {
        name: ruleForm.name.trim(),
        code: ruleForm.code.trim().toUpperCase(),
        category: ruleForm.category,
        sequence: Number(ruleForm.sequence) || 10,
        computationMethod: ruleForm.computationMethod,
        amount: ruleForm.computationMethod === 'fixed' ? Number(ruleForm.amount) : undefined,
        percentageValue: ruleForm.computationMethod === 'percentage' ? Number(ruleForm.percentageValue) : undefined,
        basedOnCode: ruleForm.computationMethod === 'percentage' ? ruleForm.basedOnCode.trim().toUpperCase() : undefined,
        formula: ruleForm.computationMethod === 'formula' ? ruleForm.formula.trim() : undefined,
        appearsOnPayslip: ruleForm.appearsOnPayslip,
        isActive: true,
      }

      if (editingRule) {
        await updateRuleMutation.mutateAsync({ id: editingRule.id, payload })
        toast.success('Salary rule updated successfully')
      } else {
        await createRuleMutation.mutateAsync(payload)
        toast.success('Salary rule created successfully')
      }
      setIsRuleModalOpen(false)
      setEditingRule(null)
      setRuleForm({
        name: '',
        code: '',
        category: 'allowance',
        sequence: 20,
        computationMethod: 'fixed',
        amount: '5000',
        percentageValue: '10',
        basedOnCode: 'BASIC',
        formula: '',
        appearsOnPayslip: true,
      })
      refetchRules()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save salary rule')
    }
  }

  const handleDeleteRule = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete salary rule "${name}"?`)) return
    try {
      await deleteRuleMutation.mutateAsync(id)
      toast.success('Salary rule deleted')
      refetchRules()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cannot delete salary rule')
    }
  }

  // ── Helper UI Formatter ───────────────────────────────────────────────────
  const formatCurrency = (val: number | string | undefined | null) => {
    const n = Number(val || 0)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'validated':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'computed':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  // Filtered lists
  const filteredPayruns = useMemo(() => {
    return payruns.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.periodLabel.toLowerCase().includes(searchQuery.toLowerCase())
      return matchSearch
    })
  }, [payruns, searchQuery])

  const filteredPayslips = useMemo(() => {
    return payslips.filter((s: any) => {
      const empName = `${s.employee?.firstName || ''} ${s.employee?.lastName || ''}`.toLowerCase()
      const code = (s.employee?.employeeCode || '').toLowerCase()
      return empName.includes(searchQuery.toLowerCase()) || code.includes(searchQuery.toLowerCase())
    })
  }, [payslips, searchQuery])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-heading)] flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-[var(--color-primary)]" />
              <span>Payroll Management Hub</span>
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] border border-[rgba(113,72,103,0.2)]">
              {user?.role || 'HR Payroll'}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            End-to-end multi-tenant payroll engine, automated RPN calculations, salary structures, and payslips.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'payruns' && isPayrollAuthorized && (
            <button
              type="button"
              onClick={() => setIsPayrunModalOpen(true)}
              className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Payrun Batch</span>
            </button>
          )}

          {activeTab === 'structures' && canWriteSalary && (
            <button
              type="button"
              onClick={() => {
                setEditingStructure(null)
                setStructureForm({ name: '', code: '', description: '', isActive: true })
                setIsStructureModalOpen(true)
              }}
              className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Salary Structure</span>
            </button>
          )}

          {activeTab === 'rules' && canWriteSalary && (
            <button
              type="button"
              onClick={() => {
                setEditingRule(null)
                setRuleForm({
                  name: '',
                  code: '',
                  category: 'allowance',
                  sequence: (rules.length + 1) * 10,
                  computationMethod: 'fixed',
                  amount: '5000',
                  percentageValue: '10',
                  basedOnCode: 'BASIC',
                  formula: '',
                  appearsOnPayslip: true,
                })
                setIsRuleModalOpen(true)
              }}
              className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Salary Rule</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              refetchPayruns()
              refetchPayslips()
              refetchStructures()
              refetchRules()
              toast.info('Refreshed payroll data from server')
            }}
            title="Refresh from backend"
            className="pp-btn-secondary p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="pp-card p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] shadow-xs bg-[var(--color-bg-base)]">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-xs mb-1 font-medium">
            <span>Total Gross Pay</span>
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-[var(--color-text-heading)] tracking-tight">
            {formatCurrency(metrics.totalGross)}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-1">Across all payrun cycles</div>
        </div>

        <div className="pp-card p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] shadow-xs bg-[var(--color-bg-base)]">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-xs mb-1 font-medium">
            <span>Deductions & Taxes</span>
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {formatCurrency(metrics.totalDeductions)}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-1">PF, TDS & Unpaid leave</div>
        </div>

        <div className="pp-card p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] shadow-xs bg-[var(--color-bg-base)]">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-xs mb-1 font-medium">
            <span>Net Disbursed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(metrics.totalNet)}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-1">Final employee take-home</div>
        </div>

        <div className="pp-card p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] shadow-xs bg-[var(--color-bg-base)]">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-xs mb-1 font-medium">
            <span>Batches / Slips</span>
            <Layers className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-[var(--color-primary)] tracking-tight">
            {payruns.length} / {payslips.length}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-1">Total batches and generated slips</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-[var(--color-border)] gap-2 sm:gap-6 text-xs sm:text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('payruns')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'payruns'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Payrun Batches ({payruns.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payslips')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'payslips'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Employee Payslips ({payslips.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('structures')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'structures'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Salary Structures ({structures.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'rules'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Salary Rules ({rules.length})</span>
        </button>
      </div>

      {/* Tab Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder={
              activeTab === 'payruns'
                ? 'Search payrun batches...'
                : activeTab === 'payslips'
                  ? 'Search by employee or code...'
                  : 'Search by name or code...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pp-input text-xs pl-9 w-full"
          />
        </div>

        {activeTab === 'payslips' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">Filter Payrun:</span>
            <select
              value={selectedPayrunId}
              onChange={(e) => setSelectedPayrunId(e.target.value)}
              className="pp-input text-xs py-1.5"
            >
              <option value="all">All Payrun Batches</option>
              {payruns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.periodLabel})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── TAB 1: PAYRUN BATCHES ────────────────────────────────────────── */}
      {activeTab === 'payruns' && (
        <div className="pp-card border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xs bg-[var(--color-bg-base)] p-0">
          {isPayrunsLoading ? (
            <div className="p-8 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
              <span>Loading payrun batches...</span>
            </div>
          ) : filteredPayruns.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-8 h-8 text-[var(--color-text-muted)]/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-[var(--color-text-heading)]">No payrun batches found</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Create your first monthly payrun batch to compute wages.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Batch Name</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Salary Structure</th>
                    <th className="px-4 py-3 text-right">Employees</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">Deductions</th>
                    <th className="px-4 py-3 text-right">Net</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-body)]">
                  {filteredPayruns.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[var(--color-text-heading)]">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-[var(--color-text-muted)] font-normal font-mono">ID: {p.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-[var(--color-primary)]">{p.periodLabel}</span>
                        <div className="text-[10px] text-[var(--color-text-muted)]">
                          {p.periodStart.slice(0, 10)} &rarr; {p.periodEnd.slice(0, 10)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">
                        {p.salaryStructure?.name || 'Default Assigned Structure'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--color-text-heading)]">{p.totalEmployees}</td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--color-text-heading)]">
                        {formatCurrency(p.totalGross)}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400 font-medium">
                        {formatCurrency(p.totalDeductions)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.totalNet)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${getStatusBadge(
                            p.status,
                          )}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPayrollAuthorized && (
                            <>
                              {p.status === 'draft' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSelectEmployees(p)}
                                  title="Select Employees & Compute Payslips"
                                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[var(--color-primary)] hover:opacity-90 rounded-[4px] flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <Play className="w-3 h-3" />
                                  <span>Compute</span>
                                </button>
                              )}

                              {p.status === 'computed' && (
                                <button
                                  type="button"
                                  onClick={() => handleValidate(p.id)}
                                  title="Validate Payrun"
                                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-[4px] flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Validate</span>
                                </button>
                              )}

                              {p.status === 'validated' && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkPaid(p.id)}
                                  title="Mark as Paid"
                                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-[4px] flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Disburse</span>
                                </button>
                              )}

                              {p.status !== 'paid' && p.status !== 'cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancel(p.id)}
                                  title="Cancel Payrun"
                                  className="p-1 text-[var(--color-text-muted)] hover:text-rose-600 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: EMPLOYEE PAYSLIPS ─────────────────────────────────────── */}
      {activeTab === 'payslips' && (
        <div className="pp-card border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xs bg-[var(--color-bg-base)] p-0">
          {isPayslipsLoading ? (
            <div className="p-8 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
              <span>Loading employee payslips...</span>
            </div>
          ) : filteredPayslips.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-8 h-8 text-[var(--color-text-muted)]/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-[var(--color-text-heading)]">No payslips generated yet</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Compute a payrun batch to generate automated payslips.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Payrun Cycle</th>
                    <th className="px-4 py-3 text-right">Worked / Leave</th>
                    <th className="px-4 py-3 text-right">Basic Wage</th>
                    <th className="px-4 py-3 text-right">Allowances</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">Deductions</th>
                    <th className="px-4 py-3 text-right">Net Wage</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-body)]">
                  {filteredPayslips.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--color-text-heading)]">
                          {s.employee?.firstName} {s.employee?.lastName}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] font-mono">{s.employee?.employeeCode}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[var(--color-primary)] font-medium">
                        {s.payrun?.name || s.periodStart.slice(0, 7)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{s.workedDays}d</span> /{' '}
                        <span className="text-amber-600 dark:text-amber-400">{s.leaveDays}d</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--color-text-heading)]">{formatCurrency(s.basic)}</td>
                      <td className="px-4 py-3 text-right text-[var(--color-text-heading)]">{formatCurrency(s.totalAllowances)}</td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--color-text-heading)]">{formatCurrency(s.gross)}</td>
                      <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{formatCurrency(s.totalDeductions)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(s.net)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${getStatusBadge(
                            s.status,
                          )}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayslip(s)}
                          className="pp-btn-secondary py-1 px-2.5 text-xs font-semibold rounded inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Breakdown</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: SALARY STRUCTURES ─────────────────────────────────────── */}
      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isStructuresLoading ? (
            <div className="col-span-full p-8 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
              <span>Loading salary structures...</span>
            </div>
          ) : structures.length === 0 ? (
            <div className="col-span-full pp-card p-8 text-center border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-base)]">
              <Layers className="w-8 h-8 text-[var(--color-text-muted)]/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-[var(--color-text-heading)]">No salary structures configured</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Create a salary structure and assign computation rules.</p>
            </div>
          ) : (
            structures.map((st) => (
              <div
                key={st.id}
                className="pp-card p-4 border border-[var(--color-border)] rounded-xl flex flex-col justify-between hover:border-[var(--color-primary)]/30 transition-all shadow-xs bg-[var(--color-bg-base)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-text-heading)] tracking-tight">{st.name}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[rgba(113,72,103,0.08)] text-[var(--color-primary)] border border-[rgba(113,72,103,0.15)] font-bold">
                        {st.code}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                        st.active ?? st.isActive
                          ? 'pp-badge-success'
                          : 'pp-badge-neutral'
                      }`}
                    >
                      {st.active ?? st.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-4">
                    {st.description || 'Standard corporate salary structure rules template.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-muted)]/60 border border-[var(--color-border)] p-2.5 rounded-lg mb-4">
                    <div>
                      <div className="text-[10px] text-[var(--color-text-muted)] font-medium">Linked Rules</div>
                      <div className="text-sm font-bold text-[var(--color-text-heading)]">{st.ruleCount ?? st.rules?.length ?? 0} Rules</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-text-muted)] font-medium">Assigned Employees</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{st.employeeCount ?? 0} Contracts</div>
                    </div>
                  </div>
                </div>

                {canWriteSalary && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStructure(st)
                        setStructureForm({
                          name: st.name,
                          code: st.code,
                          description: st.description || '',
                          isActive: st.active ?? st.isActive ?? true,
                        })
                        setIsStructureModalOpen(true)
                      }}
                      className="pp-btn-secondary text-xs py-1 px-2.5 rounded-[4px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStructure(st.id, st.name)}
                      className="p-1 text-[var(--color-text-muted)] hover:text-rose-600 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                      title="Delete Structure"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB 4: SALARY RULES ─────────────────────────────────────────── */}
      {activeTab === 'rules' && (
        <div className="pp-card border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xs bg-[var(--color-bg-base)] p-0">
          {isRulesLoading ? (
            <div className="p-8 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
              <span>Loading salary rules...</span>
            </div>
          ) : rules.length === 0 ? (
            <div className="p-8 text-center">
              <Settings className="w-8 h-8 text-[var(--color-text-muted)]/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-[var(--color-text-heading)]">No salary rules configured</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Configure earnings, allowances, and statutory deductions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Seq</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Rule Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3 text-right">Computation Value</th>
                    <th className="px-4 py-3 text-center">On Slip</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-body)]">
                  {rules
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-[var(--color-text-muted)] font-bold">{r.sequence}</td>
                        <td className="px-4 py-3 font-mono font-bold text-[var(--color-primary)]">{r.code}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--color-text-heading)]">{r.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.category === 'basic'
                                ? 'pp-badge-success'
                                : r.category === 'allowance'
                                  ? 'pp-badge-success'
                                  : r.category === 'deduction'
                                    ? 'pp-badge-danger'
                                    : 'pp-badge-neutral'
                            }`}
                          >
                            {r.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 uppercase text-[10px] text-[var(--color-text-muted)] font-medium">
                          {r.computationMethod}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-[var(--color-text-heading)]">
                          {r.computationMethod === 'fixed' && formatCurrency(r.amount)}
                          {r.computationMethod === 'percentage' && `${r.percentageValue}% of ${r.basedOnCode || 'BASIC'}`}
                          {r.computationMethod === 'formula' && <span className="font-mono text-amber-600 dark:text-amber-400 text-[10px]">{r.formula}</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.appearsOnPayslip ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">&check;</span>
                          ) : (
                            <span className="text-[var(--color-text-muted)]">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canWriteSalary && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRule(r)
                                  setRuleForm({
                                    name: r.name,
                                    code: r.code,
                                    category: r.category,
                                    sequence: r.sequence,
                                    computationMethod: r.computationMethod,
                                    amount: String(r.amount || ''),
                                    percentageValue: String(r.percentageValue || ''),
                                    basedOnCode: r.basedOnCode || 'BASIC',
                                    formula: r.formula || '',
                                    appearsOnPayslip: r.appearsOnPayslip,
                                  })
                                  setIsRuleModalOpen(true)
                                }}
                                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] rounded cursor-pointer transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(r.id, r.name)}
                                className="p-1 text-[var(--color-text-muted)] hover:text-rose-600 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: SELECT EMPLOYEES & COMPUTE ───────────────────────────── */}
      {selectEmpPayrun && (() => {
        const allEmployees = (employeesData as any)?.items ?? (employeesData as any)?.employees ?? (employeesData as any)?.data ?? []
        const filtered = allEmployees.filter((e: any) => {
          const q = empSearchQuery.toLowerCase()
          return (
            `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
            (e.employeeCode ?? '').toLowerCase().includes(q) ||
            (e.email ?? '').toLowerCase().includes(q)
          )
        })
        const allChecked = filtered.length > 0 && filtered.every((e: any) => selectedEmployeeIds.has(e.id))

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-2xl w-full max-w-xl shadow-2xl text-[var(--color-text-heading)] flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Play className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>Select Employees to Compute</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    <span className="font-semibold text-[var(--color-primary)]">{selectEmpPayrun.name}</span>
                    {' · '}{selectEmpPayrun.periodStart.slice(0, 10)} &rarr; {selectEmpPayrun.periodEnd.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedEmployeeIds.size > 0 && (
                    <span className="text-[11px] font-bold bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">
                      {selectedEmployeeIds.size} selected
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectEmpPayrun(null)}
                    className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search + Select All */}
              <div className="px-5 pt-4 pb-2 space-y-2 flex-shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search by name, code or email..."
                    value={empSearchQuery}
                    onChange={(e) => setEmpSearchQuery(e.target.value)}
                    className="pp-input text-xs pl-9 w-full"
                  />
                </div>
                {filtered.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer px-1 py-1 hover:bg-[var(--color-bg-muted)] rounded-md transition-colors">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={() => {
                        if (allChecked) {
                          setSelectedEmployeeIds(prev => {
                            const next = new Set(prev)
                            filtered.forEach((e: any) => next.delete(e.id))
                            return next
                          })
                        } else {
                          setSelectedEmployeeIds(prev => {
                            const next = new Set(prev)
                            filtered.forEach((e: any) => next.add(e.id))
                            return next
                          })
                        }
                      }}
                      className="w-3.5 h-3.5 accent-[var(--color-primary)]"
                    />
                    <span className="text-xs text-[var(--color-text-body)] font-medium">
                      {allChecked ? 'Deselect all' : `Select all ${filtered.length} employees`}
                    </span>
                  </label>
                )}
              </div>

              {/* Employee List */}
              <div className="overflow-y-auto flex-1 px-5 pb-2 space-y-1">
                {filtered.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                    {empSearchQuery ? 'No employees match your search.' : 'No employees found in your company.'}
                  </div>
                ) : (
                  filtered.map((emp: any) => {
                    const checked = selectedEmployeeIds.has(emp.id)
                    const initials = `${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase()
                    const dept = typeof emp.department === 'object' ? emp.department?.name : emp.department
                    const job  = typeof emp.jobPosition === 'object' ? emp.jobPosition?.title : emp.jobPosition
                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                          checked
                            ? 'bg-[rgba(113,72,103,0.08)] border-[var(--color-primary)]'
                            : 'border-transparent hover:bg-[var(--color-bg-muted)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedEmployeeIds(prev => {
                              const next = new Set(prev)
                              checked ? next.delete(emp.id) : next.add(emp.id)
                              return next
                            })
                          }}
                          className="w-3.5 h-3.5 accent-[var(--color-primary)] flex-shrink-0"
                        />
                        {/* Avatar */}
                        <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-white">{initials}</span>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[var(--color-text-heading)] truncate">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                            {[dept, job].filter(Boolean).join(' · ') || emp.email}
                          </div>
                        </div>
                        {/* Status dot */}
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          emp.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                        }`} />
                      </label>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[var(--color-border)] flex-shrink-0">
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Payslips will be computed immediately after selection.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectEmpPayrun(null)}
                    className="pp-btn-secondary text-xs py-1.5 px-3 rounded-lg cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSelectAndCompute}
                    disabled={isSubmittingSelect || selectedEmployeeIds.size === 0}
                    className="pp-btn-primary text-xs py-1.5 px-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    {isSubmittingSelect ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>{isSubmittingSelect ? 'Computing...' : `Select & Compute (${selectedEmployeeIds.size})`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── MODAL: CREATE PAYRUN ────────────────────────────────────────── */}
      {isPayrunModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl text-[var(--color-text-heading)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Create New Payrun Batch</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPayrunModalOpen(false)}
                className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayrun} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Batch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., September 2026 Monthly Payrun"
                  value={payrunForm.name}
                  onChange={(e) => setPayrunForm({ ...payrunForm, name: e.target.value })}
                  className="pp-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Period Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2026-09"
                  value={payrunForm.periodLabel}
                  onChange={(e) => setPayrunForm({ ...payrunForm, periodLabel: e.target.value })}
                  className="pp-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Period Start *</label>
                  <input
                    type="date"
                    required
                    value={payrunForm.periodStart}
                    onChange={(e) => setPayrunForm({ ...payrunForm, periodStart: e.target.value })}
                    className="pp-input text-xs w-full font-mono cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Period End *</label>
                  <input
                    type="date"
                    required
                    value={payrunForm.periodEnd}
                    onChange={(e) => setPayrunForm({ ...payrunForm, periodEnd: e.target.value })}
                    className="pp-input text-xs w-full font-mono cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                  Salary Structure (Optional Override)
                </label>
                <select
                  value={payrunForm.salaryStructureId}
                  onChange={(e) => setPayrunForm({ ...payrunForm, salaryStructureId: e.target.value })}
                  className="pp-input text-xs w-full"
                >
                  <option value="">Auto (Use employee assigned contracts)</option>
                  {structures.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsPayrunModalOpen(false)}
                  className="pp-btn-secondary text-xs py-2 px-4 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPayrunMutation.isPending}
                  className="pp-btn-primary text-xs py-2 px-5 font-bold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {createPayrunMutation.isPending ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT SALARY STRUCTURE ────────────────────────── */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl text-[var(--color-text-heading)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--color-primary)]" />
                <span>{editingStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsStructureModalOpen(false)}
                className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStructure} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Structure Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Executive Management Structure"
                  value={structureForm.name}
                  onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                  className="pp-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Structure Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., EXEC_STRUCT_2026"
                  value={structureForm.code}
                  onChange={(e) => setStructureForm({ ...structureForm, code: e.target.value.toUpperCase() })}
                  className="pp-input text-xs w-full font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of this salary configuration..."
                  value={structureForm.description}
                  onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
                  className="pp-input text-xs w-full resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="structActive"
                  checked={structureForm.isActive}
                  onChange={(e) => setStructureForm({ ...structureForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--color-primary)] cursor-pointer"
                />
                <label htmlFor="structActive" className="text-xs text-[var(--color-text-body)] cursor-pointer select-none">
                  Active (Ready to be assigned to contracts)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsStructureModalOpen(false)}
                  className="pp-btn-secondary text-xs py-2 px-4 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStructureMutation.isPending || updateStructureMutation.isPending}
                  className="pp-btn-primary text-xs py-2 px-5 font-bold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT SALARY RULE ─────────────────────────────── */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl text-[var(--color-text-heading)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-[var(--color-primary)]" />
                <span>{editingRule ? 'Edit Salary Rule' : 'Create Salary Rule'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., House Rent Allowance"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="pp-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Rule Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., HRA"
                    value={ruleForm.code}
                    onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value.toUpperCase() })}
                    className="pp-input text-xs w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Category *</label>
                  <select
                    value={ruleForm.category}
                    onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value as any })}
                    className="pp-input text-xs w-full"
                  >
                    <option value="basic">Basic</option>
                    <option value="allowance">Allowance</option>
                    <option value="deduction">Deduction</option>
                    <option value="net">Net</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Sequence</label>
                  <input
                    type="number"
                    value={ruleForm.sequence}
                    onChange={(e) => setRuleForm({ ...ruleForm, sequence: Number(e.target.value) })}
                    className="pp-input text-xs w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Computation Method</label>
                  <select
                    value={ruleForm.computationMethod}
                    onChange={(e) => setRuleForm({ ...ruleForm, computationMethod: e.target.value as any })}
                    className="pp-input text-xs w-full"
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                    <option value="formula">RPN Formula</option>
                  </select>
                </div>
              </div>

              {ruleForm.computationMethod === 'fixed' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Fixed Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g., 5000"
                    value={ruleForm.amount}
                    onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })}
                    className="pp-input text-xs w-full font-mono"
                  />
                </div>
              )}

              {ruleForm.computationMethod === 'percentage' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Percentage (%)</label>
                    <input
                      type="number"
                      placeholder="e.g., 25"
                      value={ruleForm.percentageValue}
                      onChange={(e) => setRuleForm({ ...ruleForm, percentageValue: e.target.value })}
                      className="pp-input text-xs w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">Based On Rule Code</label>
                    <input
                      type="text"
                      placeholder="e.g., BASIC"
                      value={ruleForm.basedOnCode}
                      onChange={(e) => setRuleForm({ ...ruleForm, basedOnCode: e.target.value.toUpperCase() })}
                      className="pp-input text-xs w-full font-mono"
                    />
                  </div>
                </div>
              )}

              {ruleForm.computationMethod === 'formula' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                    Reverse Polish Notation (RPN) Formula
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., BASIC 0.5 * HRA +"
                    value={ruleForm.formula}
                    onChange={(e) => setRuleForm({ ...ruleForm, formula: e.target.value })}
                    className="pp-input text-xs w-full font-mono"
                  />
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Available identifiers: BASIC, HRA, WORKED_DAYS, TOTAL_DAYS</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="appearsSlip"
                  checked={ruleForm.appearsOnPayslip}
                  onChange={(e) => setRuleForm({ ...ruleForm, appearsOnPayslip: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--color-primary)] cursor-pointer"
                />
                <label htmlFor="appearsSlip" className="text-xs text-[var(--color-text-body)] cursor-pointer select-none">
                  Appears on employee payslip breakdown
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="pp-btn-secondary text-xs py-2 px-4 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                  className="pp-btn-primary text-xs py-2 px-5 font-bold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PAYSLIP BREAKDOWN DRAWER ──────────────────────────────── */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl text-[var(--color-text-heading)]">
            <div className="flex items-start justify-between pb-4 border-b border-[var(--color-border)]">
              <div>
                <div className="text-xs text-[var(--color-text-muted)] font-medium">Employee Payslip Breakdown</div>
                <h3 className="text-base font-bold text-[var(--color-text-heading)]">
                  {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}
                </h3>
                <div className="text-xs text-[var(--color-primary)] font-mono font-bold">{selectedPayslip.employee?.employeeCode}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 bg-[var(--color-bg-muted)]/60 border border-[var(--color-border)] p-3 rounded-lg text-center">
                <div>
                  <div className="text-[10px] text-[var(--color-text-muted)] font-medium">Worked Days</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">{selectedPayslip.workedDays} Days</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--color-text-muted)] font-medium">Time-off Leaves</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400">{selectedPayslip.leaveDays} Days</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--color-text-muted)] font-medium">Cycle Status</div>
                  <div className="font-bold text-[var(--color-primary)] uppercase">{selectedPayslip.status}</div>
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-[var(--color-border)] py-3">
                <div className="flex justify-between py-1">
                  <span className="text-[var(--color-text-muted)]">Basic Wage</span>
                  <span className="font-medium text-[var(--color-text-heading)]">{formatCurrency(selectedPayslip.basic)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--color-text-muted)]">Total Allowances</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedPayslip.totalAllowances)}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-[var(--color-border)] font-semibold">
                  <span className="text-[var(--color-text-muted)]">Gross Salary</span>
                  <span className="text-[var(--color-text-heading)]">{formatCurrency(selectedPayslip.gross)}</span>
                </div>
                <div className="flex justify-between py-1 text-amber-600 dark:text-amber-400 font-medium">
                  <span>Statutory & Leave Deductions</span>
                  <span>- {formatCurrency(selectedPayslip.totalDeductions)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">Net Take-Home Pay</span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedPayslip.net)}
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayslip(null)}
                  className="pp-btn-secondary text-xs py-2 px-4 font-semibold rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
