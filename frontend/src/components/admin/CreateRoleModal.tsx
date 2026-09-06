import React, { useState } from 'react'
import { X, Briefcase, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/axios'

interface CreateRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (role: any) => void
  departmentsList?: Array<{ id: string; name: string; code?: string | null }>
}

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  departmentsList = [],
}) => {
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; general?: string }>({})

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!title.trim()) {
      setErrors({ title: 'Role title / name is required' })
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.post('/employees/meta/job-positions', {
        title: title.trim(),
        code: code.trim() || undefined,
        departmentId: departmentId || undefined,
      })

      const created = res.data?.jobPosition || res.data?.data?.jobPosition || res.data?.data || res.data
      toast.success(`Role "${title.trim()}" created successfully!`)
      onSaved(created)
      onClose()
      setTitle('')
      setCode('')
      setDepartmentId('')
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to create role'
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
                <Briefcase className="w-3 h-3 text-[var(--color-primary)]" />
                <span>Job Roles &amp; Positions</span>
              </span>
              <h3 className="text-xl font-bold text-[var(--color-text-heading)] mt-1">
                Create Role
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
          <form id="role-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Role / Job Title <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setErrors((prev) => ({ ...prev, title: undefined }))
                }}
                placeholder="e.g. Senior Software Engineer, HR Specialist"
                className={`pp-input text-xs ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && (
                <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="pp-input text-xs"
              >
                <option value="">Select department (optional)...</option>
                {departmentsList.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} {dept.code ? `(${dept.code})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                Associate this role with a functional company department.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Role Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SSE, HR-SPEC, QA"
                maxLength={30}
                className="pp-input text-xs font-mono uppercase"
              />
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                Short job position code identifier for reports and contracts.
              </p>
            </div>
          </form>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
          <button
            type="submit"
            form="role-form"
            disabled={loading}
            className="pp-btn-primary w-full py-2.5 text-sm font-medium cursor-pointer"
          >
            {loading ? 'Creating Role...' : 'Create Role'}
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
