import React, { useState } from 'react'
import { X, Building2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateSalaryStructure, useSalaryRules } from '@/hooks/use-salary'

interface CreateSalaryStructureModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SelectedRuleConfig {
  ruleId: string
  sequence: number
}

export const CreateSalaryStructureModal: React.FC<CreateSalaryStructureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: salaryRules = [], isLoading: isLoadingRules } = useSalaryRules()
  const createStructureMutation = useCreateSalaryStructure()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Map of ruleId -> sequence (or null if unselected)
  const [selectedRuleMap, setSelectedRuleMap] = useState<Record<string, number>>({})

  // Auto-initialize default rules when rules are loaded if map is empty
  React.useEffect(() => {
    if (salaryRules.length > 0 && Object.keys(selectedRuleMap).length === 0) {
      const initialMap: Record<string, number> = {}
      salaryRules.forEach((r) => {
        // Preselect basic standard rules if available
        if (['BASIC', 'HRA', 'PF'].includes(r.code)) {
          initialMap[r.id] = r.sequence || 10
        }
      })
      if (Object.keys(initialMap).length > 0) {
        setSelectedRuleMap(initialMap)
      }
    }
  }, [salaryRules])

  if (!isOpen) return null

  const handleNameChange = (val: string) => {
    setName(val)
    if (!code || code === name.toUpperCase().replace(/\s+/g, '_').slice(0, 20)) {
      setCode(val.toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_').slice(0, 25))
    }
  }

  const toggleRule = (ruleId: string, defaultSeq: number) => {
    setSelectedRuleMap((prev) => {
      const next = { ...prev }
      if (next[ruleId] !== undefined) {
        delete next[ruleId]
      } else {
        next[ruleId] = defaultSeq || 10
      }
      return next
    })
  }

  const handleSequenceChange = (ruleId: string, seq: number) => {
    setSelectedRuleMap((prev) => ({
      ...prev,
      [ruleId]: seq,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter a structure name')
      return
    }

    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) {
      toast.error('Please enter a unique structure code')
      return
    }

    const rulesPayload: SelectedRuleConfig[] = Object.entries(selectedRuleMap).map(
      ([ruleId, sequence]) => ({
        ruleId,
        sequence: Number(sequence) || 10,
      })
    )

    try {
      await createStructureMutation.mutateAsync({
        name: name.trim(),
        code: cleanCode,
        description: description.trim() || null,
        isActive,
        rules: rulesPayload.length > 0 ? rulesPayload : undefined,
      })

      toast.success(`Salary structure ${cleanCode} created successfully!`)
      onClose()
      setName('')
      setCode('')
      setDescription('')
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to create salary structure'
      toast.error(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--color-text-heading)] mb-0">
                Create Salary Structure
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Define a named container of ordered salary calculation rules for contracts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Structure Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                Structure Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Standard Executive Structure"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="pp-input w-full"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                Structure Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. EXEC_STD_2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="pp-input w-full font-mono font-bold text-[var(--color-primary)]"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Standard compensation package applicable to leadership roles"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="pp-input w-full resize-none"
            />
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="struct-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="struct-active" className="font-semibold text-[var(--color-text-heading)] cursor-pointer">
              Set as Active Structure
            </label>
          </div>

          {/* Select & Order Salary Rules */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[var(--color-text-heading)] mb-0">
                  Assign Salary Rules to this Structure
                </h4>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Selected rules are evaluated in ascending sequence order during payroll computation.
                </p>
              </div>
              <span className="pp-badge pp-badge-neutral text-[10px] font-mono">
                {Object.keys(selectedRuleMap).length} Rules Selected
              </span>
            </div>

            {isLoadingRules ? (
              <div className="py-6 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                <span>Loading available rules...</span>
              </div>
            ) : salaryRules.length === 0 ? (
              <div className="p-3.5 rounded-[6px] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] text-center italic text-xs">
                No salary rules created yet. You can create rules first in the Rules Catalog.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {salaryRules.map((rule) => {
                  const isSelected = selectedRuleMap[rule.id] !== undefined
                  const currentSeq = selectedRuleMap[rule.id] ?? rule.sequence

                  return (
                    <div
                      key={rule.id}
                      className={`p-2.5 rounded-[6px] border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[var(--color-primary)]/40 bg-[rgba(113,72,103,0.06)]'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-muted)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRule(rule.id, rule.sequence)}
                          className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[var(--color-text-heading)] truncate">
                              {rule.name}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-[var(--color-primary)]">
                              [{rule.code}]
                            </span>
                            <span
                              className={`pp-badge text-[9px] uppercase font-bold ${
                                rule.category === 'basic'
                                  ? 'pp-badge-success'
                                  : rule.category === 'deduction'
                                  ? 'pp-badge-danger'
                                  : 'pp-badge-neutral'
                              }`}
                            >
                              {rule.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">
                            Method: {rule.computationMethod}
                            {rule.amount ? ` • ₹${rule.amount}` : ''}
                            {rule.percentageValue ? ` • ${rule.percentageValue}% of ${rule.basedOnCode || 'BASIC'}` : ''}
                            {rule.formula ? ` • Formula: ${rule.formula}` : ''}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                            Seq:
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="5"
                            value={currentSeq}
                            onChange={(e) => handleSequenceChange(rule.id, parseInt(e.target.value, 10) || 10)}
                            className="pp-input text-xs py-1 px-2 w-16 font-mono font-bold text-center"
                            title="Evaluation Sequence"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="pp-btn-secondary text-xs py-2 px-3.5 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStructureMutation.isPending}
              className="pp-btn-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {createStructureMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Create Structure</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
