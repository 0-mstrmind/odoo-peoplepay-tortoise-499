import React, { useState } from 'react'
import { X, Building2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/axios'

interface CreateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (dept: any) => void
  employeesList?: Array<{ id: string; name: string; email?: string }>
}

export const CreateDepartmentModal: React.FC<CreateDepartmentModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  employeesList = [],
}) => {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [managerId, setManagerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; general?: string }>({})

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!name.trim()) {
      setErrors({ name: 'Department name is required' })
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.post('/employees/meta/departments', {
        name: name.trim(),
        code: code.trim() || undefined,
        managerId: managerId || undefined,
      })

      const created = res.data?.department || res.data?.data?.department || res.data?.data || res.data
      toast.success(`Department "${name.trim()}" created successfully!`)
      onSaved(created)
      onClose()
      setName('')
      setCode('')
      setManagerId('')
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to create department'
      setErrors({ general: msg })
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md h-full bg-[var(--color-bg-base)] border-l border-[var(--color-border)] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-6">
            <div>
              <span className="pp-badge pp-badge-neutral text-[10px] inline-flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[var(--color-primary)]" />
                <span>Organization Structure</span>
              </span>
              <h3 className="text-xl font-bold text-[var(--color-text-heading)] mt-1">
                Create Department
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] p-1.5 rounded-lg bg-[var(--color-bg-muted)] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* General Error Banner */}
          {errors.general && (
            <div className="mb-4 p-3 rounded bg-[var(--color-danger-bg)] border border-[var(--color-danger)] text-xs text-[#a00020] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Form */}
          <form id="department-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Department Name <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                placeholder="e.g. Engineering, Human Resources, Finance"
                className={`pp-input text-xs ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Department Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ENG, HR, FIN"
                maxLength={20}
                className="pp-input text-xs font-mono uppercase"
              />
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                Short code identifier used on payroll slips and organizational charts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Department Manager / Lead
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="pp-input text-xs"
              >
                <option value="">Select manager (optional)...</option>
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.email ? `(${emp.email})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                The designated manager for employee approvals and hierarchy.
              </p>
            </div>
          </form>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
          <button
            type="submit"
            form="department-form"
            disabled={loading}
            className="pp-btn-primary w-full py-2.5 text-sm font-medium cursor-pointer"
          >
            {loading ? 'Creating Department...' : 'Create Department'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="pp-btn-secondary w-full py-2 text-xs font-medium cursor-pointer text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
