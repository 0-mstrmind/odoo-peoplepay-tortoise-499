import React, { useState, useEffect } from 'react'
import { X, Lock, AlertCircle } from 'lucide-react'
import apiClient from '@/lib/axios'

export interface UserItem {
  id: string
  name: string
  employeeName: string
  email: string
  role: string
  status: 'active' | 'inactive'
  employeeId?: string
  clerkUserId?: string
  canDeactivate?: boolean
}

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  userToEdit?: UserItem | null
  onSaved: (user: UserItem) => void
}

export const ROLE_OPTIONS = [
  { id: 'EMPLOYEE', label: 'Employee', desc: 'Standard employee self-service access' },
  { id: 'HR_MANAGER', label: 'HR Manager', desc: 'Manage departments, positions & employee master' },
  { id: 'HR_PAYROLL_USER', label: 'HR Payroll User', desc: 'View and compute employee payslips' },
  { id: 'HR_PAYROLL_MANAGER', label: 'HR Payroll Manager', desc: 'Manage salary structures, rules & payruns' },
  { id: 'ADMIN', label: 'Admin', desc: 'Full system administration & user access control' },
]

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSaved,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('EMPLOYEE')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [canDeactivate, setCanDeactivate] = useState(true)
  const [loading, setLoading] = useState(false)
  
  // Field-specific inline errors
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; employeeId?: string; general?: string }>({})

  const [employeesList, setEmployeesList] = useState<Array<{ id: string; name: string; email: string }>>([])

  // Fetch employees list (withoutUser=true when creating a new user)
  useEffect(() => {
    if (!isOpen) return

    const fetchEmployees = async () => {
      try {
        if (!userToEdit) {
          // New User Mode: fetch unlinked employees
          const res = await apiClient.get('/v1/employees?withoutUser=true&limit=100')
          const items = res.data?.data?.data || res.data?.data || []
          if (Array.isArray(items)) {
            const mapped = items.map((e: any) => ({
              id: e.id,
              name: `${e.firstName} ${e.lastName}`,
              email: e.email,
            }))
            setEmployeesList(mapped)
          }
        }
      } catch (err) {
        console.warn('Failed to fetch unlinked employees:', err)
      }
    }

    fetchEmployees()
  }, [isOpen, userToEdit])

  // Reset or populate drawer fields on open/edit
  useEffect(() => {
    setFieldErrors({})

    if (userToEdit) {
      setSelectedEmployee(userToEdit.employeeId || '')
      setEmail(userToEdit.email)
      
      // Normalize role name
      const r = userToEdit.role.toUpperCase().replace(/ /g, '_')
      setRole(r === 'HR_PAYROLL_ADMIN' ? 'HR_PAYROLL_MANAGER' : r)
      setStatus(userToEdit.status)

      // Fetch user detail for canDeactivate flag
      const fetchDetail = async () => {
        try {
          const res = await apiClient.get(`/v1/users/${userToEdit.id}`)
          if (res.data?.data?.canDeactivate !== undefined) {
            setCanDeactivate(res.data.data.canDeactivate)
          }
        } catch {
          // Default to true
        }
      }
      fetchDetail()
    } else {
      setSelectedEmployee('')
      setEmail('')
      setRole('EMPLOYEE')
      setStatus('active')
      setCanDeactivate(true)
    }
  }, [userToEdit, isOpen])

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployee(empId)
    setFieldErrors((prev) => ({ ...prev, employeeId: undefined }))

    const emp = employeesList.find((e) => e.id === empId)
    if (emp && emp.email) {
      setEmail(emp.email)
      setFieldErrors((prev) => ({ ...prev, email: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    // Basic frontend validation
    if (!userToEdit && !selectedEmployee) {
      setFieldErrors({ employeeId: 'Please select an employee' })
      return
    }
    if (!email || !email.includes('@')) {
      setFieldErrors({ email: 'Please enter a valid work email address' })
      return
    }

    setLoading(true)

    try {
      if (userToEdit && userToEdit.id) {
        // Edit Mode: PATCH /api/v1/users/:id
        const res = await apiClient.patch(`/v1/users/${userToEdit.id}`, {
          role,
          isActive: status === 'active',
        })
        const updated = res.data?.data?.user || res.data?.data

        const savedUser: UserItem = {
          id: userToEdit.id,
          name: userToEdit.name,
          employeeName: userToEdit.employeeName,
          email: updated.email || email,
          role: updated.role || role,
          status: updated.isActive === false ? 'inactive' : 'active',
          employeeId: userToEdit.employeeId,
        }

        onSaved(savedUser)
      } else {
        // Create Mode: POST /api/v1/users
        const res = await apiClient.post('/v1/users', {
          employee_id: selectedEmployee,
          email: email.trim().toLowerCase(),
          role,
          is_active: status === 'active',
        })

        const created = res.data?.data?.user || res.data?.data
        const empObj = employeesList.find((e) => e.id === selectedEmployee)
        const empName = empObj ? empObj.name : 'New Employee'

        const savedUser: UserItem = {
          id: created.id,
          name: empName,
          employeeName: empName,
          email: created.email || email,
          role: created.role || role,
          status: created.isActive === false ? 'inactive' : 'active',
          employeeId: selectedEmployee,
        }

        onSaved(savedUser)
      }

      onClose()
    } catch (err: any) {
      const respData = err.response?.data
      const message = respData?.message || respData?.error || 'Failed to save user access configuration.'
      const field = respData?.field

      if (field === 'email') {
        setFieldErrors({ email: message })
      } else if (field === 'employeeId' || field === 'employee_id') {
        setFieldErrors({ employeeId: message })
      } else if (field === 'isActive') {
        setFieldErrors({ general: message })
      } else {
        setFieldErrors({ general: message })
      }
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

          {/* General Error Banner */}
          {fieldErrors.general && (
            <div className="mb-4 p-3 rounded bg-[var(--color-danger-bg)] border border-[var(--color-danger)] text-xs text-[#a00020] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fieldErrors.general}</span>
            </div>
          )}

          {/* Form */}
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Employee <span className="text-[var(--color-danger)]">*</span>
              </label>
              {userToEdit ? (
                <input
                  type="text"
                  disabled
                  value={userToEdit.employeeName}
                  className="pp-input bg-[var(--color-bg-muted)] opacity-80 cursor-not-allowed text-xs font-medium"
                />
              ) : (
                <select
                  value={selectedEmployee}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className={`pp-input text-xs ${fieldErrors.employeeId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select employee...</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.employeeId && (
                <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.employeeId}</p>
              )}
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-1">
                Work Email <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="email"
                required
                disabled={!!userToEdit}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setFieldErrors((prev) => ({ ...prev, email: undefined }))
                }}
                placeholder="employee@company.com"
                className={`pp-input text-xs ${userToEdit ? 'bg-[var(--color-bg-muted)] opacity-80 cursor-not-allowed' : ''} ${
                  fieldErrors.email ? 'border-red-500' : ''
                }`}
              />
              {fieldErrors.email && (
                <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.email}</p>
              )}
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
                          ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)] shadow-2xs'
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

            {/* Account Status Toggle with Last Admin Protection Tooltip */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-heading)] mb-2">
                Account Status
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`px-3.5 py-1.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                    status === 'active'
                      ? 'pp-badge-success border-emerald-500 font-bold shadow-xs'
                      : 'bg-[var(--color-bg-muted)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  Active
                </button>

                <div className="relative group">
                  <button
                    type="button"
                    disabled={!canDeactivate && role === 'ADMIN'}
                    onClick={() => {
                      if (canDeactivate || role !== 'ADMIN') {
                        setStatus('inactive')
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
                      status === 'inactive'
                        ? 'pp-badge-danger border-red-500 font-bold shadow-xs'
                        : 'bg-[var(--color-bg-muted)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                    } ${!canDeactivate && role === 'ADMIN' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    Inactive
                  </button>

                  {!canDeactivate && role === 'ADMIN' && (
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-[11px] rounded shadow-lg z-50">
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Cannot remove the last active Admin</span>
                      </div>
                    </div>
                  )}
                </div>
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
            className="pp-btn-primary w-full py-2.5 text-sm font-medium cursor-pointer"
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
