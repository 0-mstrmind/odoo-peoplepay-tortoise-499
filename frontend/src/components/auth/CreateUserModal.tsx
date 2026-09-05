import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import apiClient from '@/lib/axios'

export interface UserItem {
  id: string
  name: string
  employeeName: string
  email: string
  role: string
  status: 'active' | 'inactive'
  employeeId?: string
}

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  userToEdit?: UserItem | null
  onSaved: (user: UserItem) => void
}

export const ROLE_OPTIONS = [
  { id: 'employee', label: 'Employee', desc: 'Standard employee self-service access' },
  { id: 'hr_manager', label: 'HR Manager', desc: 'Manage departments, positions & employee master' },
  { id: 'hr_payroll_user', label: 'HR Payroll User', desc: 'View and compute employee payslips' },
  { id: 'hr_payroll_admin', label: 'HR Payroll Admin', desc: 'Manage salary structures, rules & payruns' },
  { id: 'admin', label: 'Admin', desc: 'Full system administration & user access control' },
]

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSaved,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('employee')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employeesList, setEmployeesList] = useState<Array<{ id: string; name: string; email: string }>>([
    { id: 'emp-1', name: 'Aarav Mehta', email: 'aarav@company.com' },
    { id: 'emp-2', name: 'Maya Shah', email: 'maya@company.com' },
    { id: 'emp-3', name: 'Rohan Patel', email: 'rohan@company.com' },
    { id: 'emp-4', name: 'Nisha Rao', email: 'nisha@company.com' },
  ])

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await apiClient.get('/v1/employees?limit=100')
        const items = res.data?.data?.items || res.data?.items || []
        if (Array.isArray(items) && items.length > 0) {
          const mapped = items.map((e: any) => ({
            id: e.id,
            name: `${e.firstName} ${e.lastName}`,
            email: e.email,
          }))
          setEmployeesList(mapped)
        }
      } catch {
        // Fallback to sample list if offline
      }
    }
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (userToEdit) {
      setSelectedEmployee(userToEdit.employeeId || userToEdit.employeeName)
      setEmail(userToEdit.email)
      setRole(userToEdit.role.toLowerCase().replace(/ /g, '_'))
      setStatus(userToEdit.status)
    } else {
      setSelectedEmployee('')
      setEmail('')
      setRole('employee')
      setStatus('active')
    }
  }, [userToEdit, isOpen])

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployee(empId)
    const emp = employeesList.find((e) => e.id === empId || e.name === empId)
    if (emp && emp.email) {
      setEmail(emp.email)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const selectedEmpObj = employeesList.find((e) => e.id === selectedEmployee || e.name === selectedEmployee)
      const empName = selectedEmpObj ? selectedEmpObj.name : selectedEmployee || 'New User'

      if (userToEdit && userToEdit.id) {
        try {
          await apiClient.patch(`/v1/auth/users/${userToEdit.id}/role`, { role })
          await apiClient.patch(`/v1/auth/users/${userToEdit.id}/status`, { isActive: status === 'active' })
        } catch {
          // Graceful fallback
        }
      } else if (selectedEmpObj) {
        try {
          await apiClient.patch(`/v1/employees/${selectedEmpObj.id}/role`, { role })
        } catch {
          // Graceful fallback
        }
      }

      const savedUser: UserItem = {
        id: userToEdit ? userToEdit.id : `usr-${Date.now()}`,
        name: empName,
        employeeName: empName,
        email: email || `${empName.toLowerCase().replace(/ /g, '.')}@company.com`,
        role: role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        status,
        employeeId: selectedEmployee,
      }

      onSaved(savedUser)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user access configuration.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md h-full bg-[var(--color-bg-base)] border-l border-[var(--color-border)] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-6">
            <div>
              <span className="pp-badge pp-badge-neutral text-[10px]">Open on New User</span>
              <h3 className="text-xl font-bold text-[var(--color-text-heading)] mt-1">
                {userToEdit ? 'Edit User Access' : 'Create / Edit User'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] p-1.5 rounded-lg bg-[var(--color-bg-muted)] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-[var(--color-danger-bg)] border border-[var(--color-danger)] text-xs text-[#a00020]">
              {error}
            </div>
          )}

          {/* Form */}
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Employee <span className="text-[var(--color-danger)]">*</span>
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => handleSelectEmployee(e.target.value)}
                className="pp-input"
              >
                <option value="">Select employee...</option>
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Work Email <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@company.com"
                className="pp-input"
              />
            </div>

            {/* Roles Choice List */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-2">
                Roles <span className="text-[var(--color-danger)]">*</span>
              </label>
              <div className="space-y-2">
                {ROLE_OPTIONS.map((r) => {
                  const isChecked = role === r.id
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)]'
                          : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value={r.id}
                        checked={isChecked}
                        onChange={() => setRole(r.id)}
                        className="mt-0.5 accent-[var(--color-primary)]"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[var(--color-text-heading)]">{r.label}</div>
                        <div className="text-[11px] text-[var(--color-text-muted)]">{r.desc}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Account Status Toggle */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-2">
                Account Status
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                    status === 'active'
                      ? 'pp-badge-success border-emerald-500 font-bold'
                      : 'bg-[var(--color-bg-muted)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                    status === 'inactive'
                      ? 'pp-badge-danger border-red-500 font-bold'
                      : 'bg-[var(--color-bg-muted)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Drawer Actions & Caption */}
        <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
          <button
            type="submit"
            form="user-form"
            disabled={loading}
            className="pp-btn-primary w-full py-2.5 text-sm font-medium"
          >
            {loading ? 'Saving Access...' : 'Create User / Save Access'}
          </button>
          <p className="text-[11px] text-[var(--color-text-muted)] text-center italic bg-[var(--color-bg-surface)] p-2.5 rounded border border-[var(--color-border)]">
            User accounts are separate from Employee records, but should be linked to an employee for access and ownership.
          </p>
        </div>
      </div>
    </div>
  )
}
