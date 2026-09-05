import React, { useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateEmployee, useDepartmentsList, useJobPositionsList } from '@/hooks/use-api'

interface NewEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const NewEmployeeModal: React.FC<NewEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [jobPositionId, setJobPositionId] = useState('')
  const [employeeType, setEmployeeType] = useState('full_time')
  const [status, setStatus] = useState('active')
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createEmployee = useCreateEmployee()
  const { data: departments = [] } = useDepartmentsList()
  const { data: jobPositions = [] } = useJobPositionsList()

  if (!isOpen) return null

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleClose = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setDepartmentId('')
    setJobPositionId('')
    setEmployeeType('full_time')
    setStatus('active')
    setDateOfJoining(new Date().toISOString().split('T')[0])
    setErrors({})
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // Auto-generate employee code from name + timestamp
    const code = `EMP-${firstName.trim().charAt(0).toUpperCase()}${lastName.trim().charAt(0).toUpperCase()}${Date.now().toString().slice(-5)}`

    try {
      await createEmployee.mutateAsync({
        employeeCode: code,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        departmentId: departmentId || undefined,
        jobPositionId: jobPositionId || undefined,
        employeeType,
        status,
        dateOfJoining,
      })

      toast.success(`Employee ${firstName} ${lastName} created successfully!`)
      handleClose()
      onSuccess?.()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create employee'
      setErrors({ general: msg })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[8px] shadow-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-heading)] mb-0 leading-tight">
              Create New Employee
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Add a new team member to your organisation
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-[4px] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* General Error */}
          {errors.general && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                First Name <span className="text-[#FF1744]">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Aarav"
                className={`pp-input text-sm ${errors.firstName ? 'border-[#FF1744]' : ''}`}
              />
              {errors.firstName && (
                <span className="text-xs text-[#FF1744] mt-1 block">{errors.firstName}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                Last Name <span className="text-[#FF1744]">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Mehta"
                className={`pp-input text-sm ${errors.lastName ? 'border-[#FF1744]' : ''}`}
              />
              {errors.lastName && (
                <span className="text-xs text-[#FF1744] mt-1 block">{errors.lastName}</span>
              )}
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                Email Address <span className="text-[#FF1744]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={`pp-input text-sm ${errors.email ? 'border-[#FF1744]' : ''}`}
              />
              {errors.email && (
                <span className="text-xs text-[#FF1744] mt-1 block">{errors.email}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98000 00000"
                className="pp-input text-sm"
              />
            </div>
          </div>

          {/* Department & Job Position (from backend) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="pp-input text-sm cursor-pointer"
              >
                <option value="">Select department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                Job Position
              </label>
              <select
                value={jobPositionId}
                onChange={(e) => setJobPositionId(e.target.value)}
                className="pp-input text-sm cursor-pointer"
              >
                <option value="">Select position...</option>
                {jobPositions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                Employment Type
              </label>
              <select
                value={employeeType}
                onChange={(e) => setEmployeeType(e.target.value)}
                className="pp-input text-sm cursor-pointer"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="pp-input text-sm cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Date of Joining */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
              Date of Joining
            </label>
            <input
              type="date"
              value={dateOfJoining}
              onChange={(e) => setDateOfJoining(e.target.value)}
              className="pp-input text-sm"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 mt-2 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={createEmployee.isPending}
              className="pp-btn-ghost text-sm py-2 px-4 rounded-[4px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEmployee.isPending}
              className="pp-btn-primary text-sm py-2 px-5 rounded-[4px] font-semibold flex items-center gap-2 cursor-pointer"
            >
              {createEmployee.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {createEmployee.isPending ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}