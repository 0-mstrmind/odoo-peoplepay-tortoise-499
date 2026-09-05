import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { EmployeeItem, EmployeeStatus } from './types'

interface NewEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onAddEmployee: (employee: EmployeeItem) => void
}

export const NewEmployeeModal: React.FC<NewEmployeeModalProps> = ({
  isOpen,
  onClose,
  onAddEmployee,
}) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('Finance')
  const [jobPosition, setJobPosition] = useState('')
  const [status, setStatus] = useState<EmployeeStatus>('active')
  const [location, setLocation] = useState('Mumbai HQ')
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required'
    if (!jobPosition.trim()) newErrors.jobPosition = 'Job position is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    const newEmp: EmployeeItem = {
      id: `emp-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      email: email.trim(),
      phone: phone.trim() || undefined,
      department,
      jobPosition: jobPosition.trim(),
      status,
      avatarInitials: initials || 'EP',
      location,
      joinedDate: new Date().toISOString().split('T')[0],
    }

    onAddEmployee(newEmp)
    onClose()

    // reset
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setJobPosition('')
    setErrors({})
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
            onClick={onClose}
            className="p-1 rounded-[4px] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                First Name *
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
                Last Name *
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

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
              Job Position *
            </label>
            <input
              type="text"
              value={jobPosition}
              onChange={(e) => setJobPosition(e.target.value)}
              placeholder="e.g. Payroll Specialist"
              className={`pp-input text-sm ${errors.jobPosition ? 'border-[#FF1744]' : ''}`}
            />
            {errors.jobPosition && (
              <span className="text-xs text-[#FF1744] mt-1 block">{errors.jobPosition}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="pp-input text-sm cursor-pointer bg-white"
              >
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Engineering">Engineering</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                className="pp-input text-sm cursor-pointer bg-white"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
                Email Address *
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

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1 uppercase tracking-wide">
              Work Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Mumbai HQ"
              className="pp-input text-sm"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="pp-btn-ghost text-sm py-2 px-4 rounded-[4px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pp-btn-primary text-sm py-2 px-5 rounded-[4px] font-semibold"
            >
              Save Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}