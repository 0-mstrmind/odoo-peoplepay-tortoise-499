import React, { useState, useEffect } from 'react'
import { X, FileText, Loader2, DollarSign, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCreateContract,
  useSalaryStructures,
  useWorkingSchedules,
  useEmployeeMasters,
} from '@/hooks/use-contracts'
import { useEmployees } from '@/hooks/use-api'

interface CreateContractModalProps {
  isOpen: boolean
  onClose: () => void
  initialEmployeeId?: string
}

export const CreateContractModal: React.FC<CreateContractModalProps> = ({
  isOpen,
  onClose,
  initialEmployeeId,
}) => {
  const { data: employeesResponse, isLoading: isLoadingEmployees } = useEmployees()
  const employees =
    (employeesResponse as any)?.data?.items ||
    (employeesResponse as any)?.items ||
    (Array.isArray(employeesResponse) ? employeesResponse : [])

  const { data: masters } = useEmployeeMasters()
  const { data: salaryStructures = [], isLoading: isLoadingStructures } = useSalaryStructures()
  const { data: workingSchedules = [] } = useWorkingSchedules()
  const createContractMutation = useCreateContract()

  // Form State
  const todayStr = new Date().toISOString().split('T')[0]
  const [employeeId, setEmployeeId] = useState<string>(initialEmployeeId || '')
  const [contractReference, setContractReference] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(todayStr)
  const [endDate, setEndDate] = useState<string>('')
  const [wage, setWage] = useState<string>('50000')
  const [currency, setCurrency] = useState<string>('INR')
  const [payFrequency, setPayFrequency] = useState<'monthly' | 'bi_weekly' | 'weekly'>('monthly')
  const [salaryStructureId, setSalaryStructureId] = useState<string>('')
  const [scheduleId, setScheduleId] = useState<string>('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [jobPositionId, setJobPositionId] = useState<string>('')
  const [status, setStatus] = useState<'draft' | 'active'>('draft')
  const [notes, setNotes] = useState<string>('')

  // Prepopulate employee and auto-generate reference on open / employee select
  useEffect(() => {
    if (isOpen) {
      const selectedEmp = employees.find((e: any) => e.id === employeeId) || employees[0]
      if (selectedEmp && !employeeId) {
        setEmployeeId(selectedEmp.id)
      }
      if (selectedEmp) {
        const code = selectedEmp.employeeCode || selectedEmp.id.slice(0, 5).toUpperCase()
        const year = new Date().getFullYear()
        if (!contractReference) {
          setContractReference(`CNT-${code}-${year}`)
        }
        if (!departmentId && selectedEmp.departmentId) {
          setDepartmentId(selectedEmp.departmentId)
        }
        if (!jobPositionId && selectedEmp.jobPositionId) {
          setJobPositionId(selectedEmp.jobPositionId)
        }
        if (!scheduleId && selectedEmp.scheduleId) {
          setScheduleId(selectedEmp.scheduleId)
        }
      }
      if (salaryStructures.length > 0 && !salaryStructureId) {
        setSalaryStructureId(salaryStructures[0].id)
      }
      if (workingSchedules.length > 0 && !scheduleId) {
        setScheduleId(workingSchedules[0].id)
      }
    }
  }, [isOpen, employees, employeeId, salaryStructures, workingSchedules])

  // Handle Employee Change
  const handleEmployeeChange = (selectedId: string) => {
    setEmployeeId(selectedId)
    const emp = employees.find((e: any) => e.id === selectedId)
    if (emp) {
      const code = emp.employeeCode || emp.id.slice(0, 5).toUpperCase()
      const year = new Date().getFullYear()
      setContractReference(`CNT-${code}-${year}`)
      if (emp.departmentId) setDepartmentId(emp.departmentId)
      if (emp.jobPositionId) setJobPositionId(emp.jobPositionId)
      if (emp.scheduleId) setScheduleId(emp.scheduleId)
    }
  }

  // Filter positions by selected department if department is set
  const filteredJobPositions = masters?.jobPositions?.filter((jp: any) => {
    if (!departmentId) return true
    return !jp.departmentId || jp.departmentId === departmentId
  }) || []

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employeeId) {
      toast.error('Please select an employee')
      return
    }

    if (!contractReference.trim()) {
      toast.error('Contract reference is required')
      return
    }

    if (!startDate) {
      toast.error('Start date is required')
      return
    }

    if (endDate && endDate < startDate) {
      toast.error('End date cannot be earlier than start date')
      return
    }

    const numWage = Number(wage)
    if (isNaN(numWage) || numWage <= 0) {
      toast.error('Wage must be a positive number')
      return
    }

    try {
      await createContractMutation.mutateAsync({
        employeeId,
        contractReference: contractReference.trim(),
        startDate,
        endDate: endDate ? endDate : null,
        departmentId: departmentId || null,
        jobPositionId: jobPositionId || null,
        scheduleId: scheduleId || null,
        salaryStructureId: salaryStructureId || null,
        wage: numWage,
        currency,
        payFrequency,
        status,
        notes: notes.trim() || null,
      })

      toast.success(
        status === 'active'
          ? `Active contract ${contractReference} created successfully!`
          : `Draft contract ${contractReference} saved successfully!`
      )
      onClose()
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || err?.message || 'Failed to create contract. Please verify input data.'
      toast.error(errMsg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="pp-card w-full max-w-2xl bg-[var(--color-bg-base)] border border-[var(--color-border)] shadow-2xl rounded-[10px] overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-muted)]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--color-text-heading)] mb-0 flex items-center gap-2">
                <span>Create Employment Contract</span>
                <span className="pp-badge pp-badge-neutral text-[10px] uppercase font-bold">
                  {status}
                </span>
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Define compensation, working schedule, and salary structure parameters.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Section 1: Employee & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                value={employeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="pp-input w-full"
                required
                disabled={isLoadingEmployees}
              >
                {isLoadingEmployees ? (
                  <option value="">Loading employees...</option>
                ) : employees.length === 0 ? (
                  <option value="">No employees available</option>
                ) : (
                  employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.email})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                Contract Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contractReference}
                onChange={(e) => setContractReference(e.target.value)}
                placeholder="e.g. CNT-EMP001-2026"
                className="pp-input w-full font-mono"
                required
              />
            </div>
          </div>

          {/* Section 2: Compensation & Pay Frequency */}
          <div className="p-3.5 bg-[var(--color-bg-muted)]/40 border border-[var(--color-border)] rounded-[6px] space-y-3">
            <h3 className="font-extrabold text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1.5 mb-0">
              <DollarSign className="w-3.5 h-3.5 text-[#00C853]" />
              <span>Wage & Compensation Terms</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                  Base Wage <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    value={wage}
                    onChange={(e) => setWage(e.target.value)}
                    className="pp-input w-full pl-6 font-mono font-bold text-[var(--color-text-heading)]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="pp-input w-full font-mono"
                >
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                  Pay Frequency
                </label>
                <select
                  value={payFrequency}
                  onChange={(e) => setPayFrequency(e.target.value as any)}
                  className="pp-input w-full"
                >
                  <option value="monthly">Monthly</option>
                  <option value="bi_weekly">Bi-Weekly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Salary Structure & Working Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1 flex items-center justify-between">
                <span>Salary Structure</span>
                <span className="text-[10px] text-[var(--color-text-muted)] font-normal">Optional</span>
              </label>
              <select
                value={salaryStructureId}
                onChange={(e) => setSalaryStructureId(e.target.value)}
                className="pp-input w-full"
                disabled={isLoadingStructures}
              >
                <option value="">No Salary Structure (Fixed Wage)</option>
                {salaryStructures.map((struct: any) => (
                  <option key={struct.id} value={struct.id}>
                    {struct.name} ({struct.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1 flex items-center justify-between">
                <span>Working Schedule</span>
                <span className="text-[10px] text-[var(--color-text-muted)] font-normal">Optional</span>
              </label>
              <select
                value={scheduleId}
                onChange={(e) => setScheduleId(e.target.value)}
                className="pp-input w-full"
              >
                <option value="">Standard Schedule (40h/week)</option>
                {(workingSchedules.length > 0 ? workingSchedules : masters?.schedules || []).map((sch: any) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} {sch.totalWeeklyHours ? `(${sch.totalWeeklyHours} hrs/wk)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 4: Department & Job Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1 flex items-center justify-between">
                <span>Department</span>
                <span className="text-[10px] text-[var(--color-text-muted)] font-normal">Optional</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value)
                  setJobPositionId('')
                }}
                className="pp-input w-full"
              >
                <option value="">Company General</option>
                {masters?.departments?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1 flex items-center justify-between">
                <span>Job Position</span>
                <span className="text-[10px] text-[var(--color-text-muted)] font-normal">Optional</span>
              </label>
              <select
                value={jobPositionId}
                onChange={(e) => setJobPositionId(e.target.value)}
                className="pp-input w-full"
              >
                <option value="">Select Position</option>
                {filteredJobPositions.map((jp: any) => (
                  <option key={jp.id} value={jp.id}>
                    {jp.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 5: Dates & Contract Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pp-input w-full font-mono cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1 flex items-center justify-between">
                <span>End Date</span>
                <span className="text-[10px] text-[var(--color-text-muted)] font-normal">Permanent if empty</span>
              </label>
              <input
                type="date"
                min={startDate || todayStr}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pp-input w-full font-mono cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                Contract Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="pp-input w-full font-semibold"
              >
                <option value="draft">Draft (Pending review)</option>
                <option value="active">Active (Immediate effect)</option>
              </select>
            </div>
          </div>

          {/* Notes / Special Terms */}
          <div>
            <label className="block font-semibold text-[var(--color-text-heading)] mb-1 flex items-center justify-between">
              <span>Contract Notes & Special Clauses</span>
              <span className="text-[10px] text-[var(--color-text-muted)] font-normal">Optional</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Probation period duration, performance bonus eligibility, notice period..."
              className="pp-input w-full h-16 resize-none rounded-[6px]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={createContractMutation.isPending}
              className="pp-btn-secondary text-xs py-2 px-4 rounded-[4px] cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={createContractMutation.isPending}
              className="pp-btn-primary text-xs py-2 px-5 rounded-[4px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {createContractMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Contract...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create Contract</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
