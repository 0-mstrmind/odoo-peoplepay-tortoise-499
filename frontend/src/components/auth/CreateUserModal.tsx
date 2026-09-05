import React, { useState, useEffect } from 'react'
import { X, Lock, AlertCircle, UserPlus, Users, Sparkles, Eye, EyeOff, Mail, ShieldAlert, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/axios'
import { useAuthUser } from '@/store/auth.store'

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
  existingUsers?: UserItem[]
  initialMode?: 'edit' | 'password'
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
  existingUsers = [],
  initialMode = 'edit',
}) => {
  const currentUser = useAuthUser()
  const isCurrentUserAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super_admin'

  const availableRoles = isCurrentUserAdmin
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => r.id === 'EMPLOYEE')

  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [isCreatingNewEmployee, setIsCreatingNewEmployee] = useState(false)
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [role, setRole] = useState('EMPLOYEE')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [canDeactivate, setCanDeactivate] = useState(true)
  const [loading, setLoading] = useState(false)
  
  // Field-specific inline errors
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; employeeId?: string; firstName?: string; general?: string }>({})

  const [employeesList, setEmployeesList] = useState<Array<{ id: string; name: string; email: string }>>([])

  // Fetch employees list (withoutUser=true when creating a new user)
  useEffect(() => {
    if (!isOpen) return

    const fetchEmployees = async () => {
      try {
        if (!userToEdit) {
          // New User Mode: fetch unlinked employees
          const res = await apiClient.get('/v1/employees?withoutUser=true&limit=100')
          const items = res.data?.items || res.data?.data?.items || res.data?.data || []
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

  // Helper to check if email is already taken by an existing user
  const checkEmailDuplicate = (emailToCheck: string): boolean => {
    if (!emailToCheck || !emailToCheck.trim()) return false
    const normalized = emailToCheck.trim().toLowerCase()
    if (userToEdit) {
      return existingUsers.some(
        (u) => u.id !== userToEdit.id && u.email.trim().toLowerCase() === normalized
      )
    } else {
      return existingUsers.some(
        (u) => u.email.trim().toLowerCase() === normalized
      )
    }
  }

  // Reset or populate drawer fields on open/edit
  useEffect(() => {
    setFieldErrors({})
    setIsCreatingNewEmployee(false)
    setNewFirstName('')
    setNewLastName('')
    setPassword('')
    setShowPassword(false)

    if (userToEdit) {
      setSelectedEmployee(userToEdit.employeeId || '')
      setEmail(userToEdit.email)
      setIsUpdatingPassword(initialMode === 'password')
      
      // Normalize role name
      const r = userToEdit.role.toUpperCase().replace(/ /g, '_')
      setRole(r === 'HR_PAYROLL_ADMIN' ? 'HR_PAYROLL_MANAGER' : r)
      setStatus(userToEdit.status)

      // Fetch user detail for canDeactivate flag
      const fetchDetail = async () => {
        try {
          const res = await apiClient.get(`/v1/users/${userToEdit.id}`)
          const canDeact = res.data?.canDeactivate !== undefined
            ? res.data.canDeactivate
            : res.data?.data?.canDeactivate
          if (canDeact !== undefined) {
            setCanDeactivate(canDeact)
          }
        } catch {
          // Default to true
        }
      }
      fetchDetail()
    } else {
      setSelectedEmployee('')
      setEmail('')
      setIsUpdatingPassword(false)
      setRole('EMPLOYEE')
      setStatus('active')
      setCanDeactivate(true)
    }
  }, [userToEdit, isOpen, initialMode])

  const generateRandomPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghijkmnpqrstuvwxyz'
    const numbers = '23456789'
    const symbols = '!@#$%^&*'
    const all = upper + lower + numbers + symbols

    const pwd = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ]

    for (let i = pwd.length; i < 12; i++) {
      pwd.push(all[Math.floor(Math.random() * all.length)])
    }

    const shuffled = pwd.sort(() => 0.5 - Math.random()).join('')
    setPassword(shuffled)
    setShowPassword(true)
    setFieldErrors((prev) => ({ ...prev, password: undefined }))
    toast.success('Random password generated!')
  }

  const handleSelectEmployee = (empId: string) => {
    setFieldErrors((prev) => ({ ...prev, employeeId: undefined }))

    if (empId === '__new_employee__') {
      setIsCreatingNewEmployee(true)
      setSelectedEmployee('')
      return
    }

    setIsCreatingNewEmployee(false)
    setSelectedEmployee(empId)

    const emp = employeesList.find((e) => e.id === empId)
    if (emp && emp.email) {
      setEmail(emp.email)
      if (checkEmailDuplicate(emp.email)) {
        setFieldErrors((prev) => ({ ...prev, email: 'A user account with this email address already exists.' }))
      } else {
        setFieldErrors((prev) => ({ ...prev, email: undefined }))
      }
    }
  }

  const handleNameChange = (fname: string, lname: string) => {
    setNewFirstName(fname)
    setNewLastName(lname)

    if (fname || lname) {
      const suggested = `${fname.toLowerCase().trim()}.${lname.toLowerCase().trim()}@company.com`.replace(/\s+/g, '')
      if (!email || email.endsWith('@company.com')) {
        setEmail(suggested)
        if (checkEmailDuplicate(suggested)) {
          setFieldErrors((prev) => ({ ...prev, email: 'A user account with this email address already exists.' }))
        } else {
          setFieldErrors((prev) => ({ ...prev, email: undefined }))
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (!email || !email.includes('@')) {
      setFieldErrors({ email: 'Please enter a valid work email address' })
      return
    }

    // Pre-submission client-side duplicate check
    if (checkEmailDuplicate(email)) {
      setFieldErrors({ email: 'A user account with this email address already exists.' })
      toast.error('A user account with this email address already exists.')
      return
    }

    if (!userToEdit) {
      if (isCreatingNewEmployee) {
        if (!newFirstName.trim()) {
          setFieldErrors({ firstName: 'First name is required for new employee' })
          return
        }
      } else if (!selectedEmployee) {
        setFieldErrors({ employeeId: 'Please select an employee or add a new employee profile' })
        return
      }

      if (!password || password.length < 6) {
        setFieldErrors({ password: 'Password must be at least 6 characters' })
        return
      }
    } else {
      // Edit mode: if updating password, validate length
      if (isUpdatingPassword) {
        if (!password || !password.trim()) {
          setFieldErrors({ password: 'New password cannot be empty when updating password' })
          return
        }
        if (password.trim().length < 6) {
          setFieldErrors({ password: 'Password must be at least 6 characters' })
          return
        }
      }
    }

    setLoading(true)

    try {
      if (userToEdit && userToEdit.id) {
        // Edit Mode: PATCH /api/v1/users/:id
        const updatePayload: any = {
          role,
          isActive: status === 'active',
        }
        if (isUpdatingPassword && password.trim()) {
          updatePayload.password = password.trim()
        }

        const res = await apiClient.patch(`/v1/users/${userToEdit.id}`, updatePayload)
        const updated = res.data?.user || res.data?.data?.user || res.data?.data || {}

        const savedUser: UserItem = {
          id: userToEdit.id,
          name: userToEdit.name,
          employeeName: userToEdit.employeeName,
          email: updated.email || email,
          role: updated.role || role,
          status: (updated.isActive ?? (status === 'active')) ? 'active' : 'inactive',
          employeeId: userToEdit.employeeId,
        }

        if (isUpdatingPassword && password.trim()) {
          toast.success(`Password updated! New login credentials dispatched to ${userToEdit.email}`)
        } else {
          toast.success('User access configuration updated!')
        }

        onSaved(savedUser)
      } else {
        // Create Mode: POST /api/v1/users
        let targetEmployeeId = selectedEmployee
        let empName = 'New Employee'

        // If creating new employee on-the-fly:
        if (isCreatingNewEmployee) {
          try {
            const empRes = await apiClient.post('/v1/employees', {
              employeeCode: `EMP-${Date.now().toString().slice(-6)}`,
              firstName: newFirstName.trim(),
              lastName: newLastName.trim() || 'Staff',
              email: email.trim().toLowerCase(),
              status: 'active',
              employeeType: 'full_time',
            })
            const createdEmp = empRes.data?.employee || empRes.data?.data?.employee || empRes.data?.data || empRes.data
            targetEmployeeId = createdEmp?.id
            empName = `${createdEmp?.firstName || newFirstName} ${createdEmp?.lastName || newLastName}`.trim()
          } catch (empErr: any) {
            const empMsg = empErr.response?.data?.message || empErr.message || ''
            if (empMsg.toLowerCase().includes('already exists') || empErr.response?.status === 409) {
              const searchRes = await apiClient.get(`/v1/employees?search=${encodeURIComponent(email.trim().toLowerCase())}`)
              const searchItems = searchRes.data?.items || searchRes.data?.data?.items || searchRes.data?.data || []
              const existingEmp = searchItems.find((e: any) => e.email?.toLowerCase() === email.trim().toLowerCase())
              if (existingEmp) {
                if (existingEmp.userId) {
                  throw new Error(`A user account already exists for ${email.trim().toLowerCase()}.`)
                }
                targetEmployeeId = existingEmp.id
                empName = `${existingEmp.firstName} ${existingEmp.lastName}`.trim()
              } else {
                throw empErr
              }
            } else {
              throw empErr
            }
          }
        } else {
          const empObj = employeesList.find((e) => e.id === selectedEmployee)
          if (empObj) empName = empObj.name
        }

        if (!targetEmployeeId) {
          setFieldErrors({ employeeId: 'Please select an employee or provide employee details.' })
          return
        }

        const res = await apiClient.post('/v1/users', {
          employee_id: targetEmployeeId,
          email: email.trim().toLowerCase(),
          role,
          password: password.trim(),
          is_active: status === 'active',
        })

        const created = res.data?.user || res.data?.data?.user || res.data?.data || res.data

        const savedUser: UserItem = {
          id: created?.id || targetEmployeeId,
          name: empName,
          employeeName: empName,
          email: created?.email || email.trim().toLowerCase(),
          role: created?.role || role,
          status: (created?.isActive ?? (status === 'active')) ? 'active' : 'inactive',
          employeeId: targetEmployeeId,
        }

        toast.success(`User account created! Login credentials dispatched to ${email.trim().toLowerCase()}`)
        onSaved(savedUser)
      }

      onClose()
    } catch (err: any) {
      const respData = err.response?.data
      const message =
        respData?.message ||
        respData?.error ||
        (Array.isArray(respData?.errors) && respData.errors[0]?.message) ||
        err.message ||
        'Failed to save user access configuration.'

      const field =
        respData?.field ||
        (Array.isArray(respData?.errors) && (respData.errors[0]?.field || respData.errors[0]?.path))

      const lowerMsg = String(message).toLowerCase()
      if (
        field === 'email' ||
        lowerMsg.includes('already registered') ||
        lowerMsg.includes('already in use') ||
        lowerMsg.includes('already exists') ||
        err.response?.status === 409
      ) {
        setFieldErrors({ email: message })
        toast.error(message)
      } else if (field === 'employeeId' || field === 'employee_id') {
        setFieldErrors({ employeeId: message })
      } else if (field === 'password') {
        setFieldErrors({ password: message })
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
              <span className="pp-badge pp-badge-neutral text-[10px]">
                {userToEdit
                  ? isUpdatingPassword
                    ? 'Security & Password'
                    : 'Edit User Access'
                  : 'New User Account'}
              </span>
              <h3 className="text-xl font-bold text-[var(--color-text-heading)] mt-1">
                {userToEdit
                  ? isUpdatingPassword
                    ? 'Update User Password'
                    : 'Edit User Access'
                  : 'Create New User'}
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
            {/* Employee Selector Header */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--color-text-heading)]">
                  Employee <span className="text-[var(--color-danger)]">*</span>
                </label>
                {!userToEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewEmployee(!isCreatingNewEmployee)
                      setSelectedEmployee('')
                    }}
                    className="text-[11px] font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {isCreatingNewEmployee ? (
                      <>
                        <Users className="w-3 h-3" />
                        <span>Select Existing</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>+ Add New Employee</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {userToEdit ? (
                <input
                  type="text"
                  disabled
                  value={userToEdit.employeeName}
                  className="pp-input bg-[var(--color-bg-muted)] opacity-80 cursor-not-allowed text-xs font-medium"
                />
              ) : isCreatingNewEmployee ? (
                <div className="space-y-2 p-3 bg-[rgba(113,72,103,0.06)] border border-[rgba(113,72,103,0.2)] rounded-[6px] animate-in fade-in">
                  <div className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
                    New Employee Profile Details
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="First Name *"
                        value={newFirstName}
                        onChange={(e) => handleNameChange(e.target.value, newLastName)}
                        className="pp-input text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={newLastName}
                        onChange={(e) => handleNameChange(newFirstName, e.target.value)}
                        className="pp-input text-xs"
                      />
                    </div>
                  </div>
                  {fieldErrors.firstName && (
                    <p className="text-[11px] text-red-600 font-semibold">{fieldErrors.firstName}</p>
                  )}
                </div>
              ) : (
                <select
                  value={selectedEmployee}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className={`pp-input text-xs ${fieldErrors.employeeId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select employee...</option>
                  <option value="__new_employee__" className="font-bold text-[var(--color-primary)]">
                    + Add New Employee Profile...
                  </option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.employeeId && !isCreatingNewEmployee && (
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
                  const val = e.target.value
                  setEmail(val)
                  if (val.trim() && checkEmailDuplicate(val)) {
                    setFieldErrors((prev) => ({ ...prev, email: 'A user account with this email address already exists.' }))
                  } else {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }))
                  }
                }}
                onBlur={() => {
                  if (email.trim() && checkEmailDuplicate(email)) {
                    setFieldErrors((prev) => ({ ...prev, email: 'A user account with this email address already exists.' }))
                  }
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

            {/* In Edit Mode: Update User Password */}
            {userToEdit && (
              <div className="p-3 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-text-heading)] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>User Password Credentials</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpdatingPassword(!isUpdatingPassword)
                      if (isUpdatingPassword) {
                        setPassword('')
                        setFieldErrors((prev) => ({ ...prev, password: undefined }))
                      }
                    }}
                    className="text-[11px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
                  >
                    {isUpdatingPassword ? 'Cancel Change' : '+ Update Password'}
                  </button>
                </div>

                {isUpdatingPassword ? (
                  <div className="pt-2 border-t border-[var(--color-border)] space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
                        Set a new password for this user
                      </span>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[11px] font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        title="Generate secure random password"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate Random</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setFieldErrors((prev) => ({ ...prev, password: undefined }))
                        }}
                        placeholder="Enter new password (min 6 characters)"
                        className={`pp-input text-xs pr-10 font-mono ${fieldErrors.password ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] rounded cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.password}</p>
                    )}

                    <div className="flex items-start gap-1.5 text-[11px] text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] p-2 rounded border border-[var(--color-border)]">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-[var(--color-primary)] mt-0.5" />
                      <span>
                        Updating will immediately email the new password to <strong>{userToEdit.email}</strong>.
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--color-text-muted)] mb-0">
                    Password is saved and encrypted. Click <strong>+ Update Password</strong> to reset or generate a new password.
                  </p>
                )}
              </div>
            )}

            {/* Password Field (Only for new user creation) */}
            {!userToEdit && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--color-text-heading)]">
                    Password <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    title="Generate secure random password"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Random Password</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setFieldErrors((prev) => ({ ...prev, password: undefined }))
                    }}
                    placeholder="Enter password or click Generate Random"
                    className={`pp-input text-xs pr-10 font-mono ${fieldErrors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] rounded cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.password}</p>
                )}
                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] p-2 rounded border border-[var(--color-border)]">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-[var(--color-primary)] mt-0.5" />
                  <span>
                    This password and login details will be dispatched to <strong>{email || 'the work email'}</strong> upon creation.
                  </span>
                </div>
              </div>
            )}

            {/* Roles Choice List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-[var(--color-text-heading)]">
                  Roles <span className="text-[var(--color-danger)]">*</span>
                </label>
                {!isCurrentUserAdmin && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded">
                    Employee Access Only
                  </span>
                )}
              </div>

              {!isCurrentUserAdmin && (
                <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/25 rounded text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                  <span>HR Managers are permitted to provision Employee accounts. Administrator privilege is required for HR and Admin accounts.</span>
                </div>
              )}

              <div className="space-y-2">
                {availableRoles.map((r) => {
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
            {loading
              ? 'Saving Access...'
              : userToEdit
              ? isUpdatingPassword
                ? 'Update Password & Save Access'
                : 'Save User Access'
              : 'Create User & Send Credentials'}
          </button>
          <p className="text-[11px] text-[var(--color-text-muted)] text-center italic bg-[var(--color-bg-surface)] p-2.5 rounded border border-[var(--color-border)]">
            User accounts are separate from Employee records, but should be linked to an employee for access and ownership.
          </p>
        </div>
      </div>
    </div>
  )
}
