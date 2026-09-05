import React, { useState } from 'react'
import { X, Plus, Calculator, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateSalaryRule, useSalaryRules } from '@/hooks/use-salary'

interface CreateSalaryRuleModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateSalaryRuleModal: React.FC<CreateSalaryRuleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: existingRules = [] } = useSalaryRules()
  const createRuleMutation = useCreateSalaryRule()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<'basic' | 'allowance' | 'gross' | 'deduction' | 'net'>('allowance')
  const [computationMethod, setComputationMethod] = useState<'fixed' | 'percentage' | 'formula'>('percentage')
  const [amount, setAmount] = useState<string>('')
  const [percentageValue, setPercentageValue] = useState<string>('20')
  const [basedOnCode, setBasedOnCode] = useState<string>('BASIC')
  const [formula, setFormula] = useState<string>('')
  const [sequence, setSequence] = useState<number>(20)
  const [appearsOnPayslip, setAppearsOnPayslip] = useState(true)
  const [description, setDescription] = useState('')

  if (!isOpen) return null

  const handleNameChange = (val: string) => {
    setName(val)
    if (!code || code === name.toUpperCase().replace(/\s+/g, '_').slice(0, 20)) {
      setCode(val.toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_').slice(0, 25))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter a rule name')
      return
    }

    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) {
      toast.error('Please enter a unique rule code')
      return
    }

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(cleanCode)) {
      toast.error('Rule code must start with a letter and contain only letters, numbers, and underscores')
      return
    }

    const payload: any = {
      name: name.trim(),
      code: cleanCode,
      category,
      computationMethod,
      sequence: Number(sequence) || 10,
      appearsOnPayslip,
      description: description.trim() || null,
      isActive: true,
    }

    if (computationMethod === 'fixed') {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        toast.error('Please enter a valid fixed amount')
        return
      }
      payload.amount = parsedAmount
    } else if (computationMethod === 'percentage') {
      const parsedPct = parseFloat(percentageValue)
      if (isNaN(parsedPct) || parsedPct <= 0) {
        toast.error('Please enter a valid percentage value')
        return
      }
      if (!basedOnCode.trim()) {
        toast.error('Please select the base rule code for percentage calculation')
        return
      }
      payload.percentageValue = parsedPct
      payload.basedOnCode = basedOnCode.trim()
    } else if (computationMethod === 'formula') {
      if (!formula.trim()) {
        toast.error('Please enter a valid formula expression')
        return
      }
      payload.formula = formula.trim()
    }

    try {
      await createRuleMutation.mutateAsync(payload)
      toast.success(`Salary rule ${cleanCode} created successfully!`)
      onClose()
      // Reset form
      setName('')
      setCode('')
      setDescription('')
      setAmount('')
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to create salary rule'
      toast.error(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--color-text-heading)] mb-0">
                Create Salary Rule
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Define a reusable pay slip compensation, allowance, or deduction formula.
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
          {/* Rule Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                Rule Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Conveyance Allowance"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="pp-input w-full"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                Rule Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CONV_ALL"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="pp-input w-full font-mono font-bold text-[var(--color-primary)]"
                required
              />
            </div>
          </div>

          {/* Category & Computation Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="pp-input w-full font-medium"
              >
                <option value="basic">Basic (Base Earnings)</option>
                <option value="allowance">Allowance (Benefits / Perks)</option>
                <option value="gross">Gross (Total Pre-tax)</option>
                <option value="deduction">Deduction (PF / Tax / Retainage)</option>
                <option value="net">Net (Final Take Home)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                Computation Method <span className="text-red-500">*</span>
              </label>
              <select
                value={computationMethod}
                onChange={(e) => setComputationMethod(e.target.value as any)}
                className="pp-input w-full font-medium"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
                <option value="formula">Expression Formula</option>
              </select>
            </div>
          </div>

          {/* Dynamic computation parameters */}
          <div className="p-3.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg-muted)]/50 space-y-3">
            {computationMethod === 'fixed' && (
              <div>
                <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                  Fixed Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pp-input w-full pl-6 font-mono font-bold"
                    required
                  />
                </div>
              </div>
            )}

            {computationMethod === 'percentage' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                    Percentage (%) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="any"
                      placeholder="e.g. 25"
                      value={percentageValue}
                      onChange={(e) => setPercentageValue(e.target.value)}
                      className="pp-input w-full pr-7 font-mono font-bold"
                      required
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-bold">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                    Calculated On Code <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={basedOnCode}
                    onChange={(e) => setBasedOnCode(e.target.value)}
                    className="pp-input w-full font-mono font-bold"
                  >
                    <option value="BASIC">BASIC (Basic Wage)</option>
                    <option value="GROSS">GROSS (Total Gross)</option>
                    {existingRules
                      .filter((r) => r.code !== code)
                      .map((r) => (
                        <option key={r.id} value={r.code}>
                          {r.code} ({r.name})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {computationMethod === 'formula' && (
              <div>
                <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                  Formula Expression <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BASIC * 0.4 + 1200"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  className="pp-input w-full font-mono font-bold"
                  required
                />
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                  Available tokens: rule codes (BASIC, HRA, GROSS), numbers, and standard operators (+, -, *, /).
                </p>
              </div>
            )}
          </div>

          {/* Sequence & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
                Evaluation Sequence
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={sequence}
                onChange={(e) => setSequence(parseInt(e.target.value, 10) || 1)}
                className="pp-input w-full font-mono"
              />
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Lower sequences evaluate first (e.g. Basic = 10, Allowances = 20-50, Net = 100).
              </p>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={appearsOnPayslip}
                  onChange={(e) => setAppearsOnPayslip(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-[var(--color-text-heading)]">
                  Display on Employee Payslip
                </span>
              </label>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 ml-6">
                When unchecked, this item acts as an internal computation rule.
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-[var(--color-text-heading)] mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Monthly tax-exempt travel and conveyance proration"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="pp-input w-full resize-none"
            />
          </div>

          {/* Footer Action Buttons */}
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
              disabled={createRuleMutation.isPending}
              className="pp-btn-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {createRuleMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Create Rule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
