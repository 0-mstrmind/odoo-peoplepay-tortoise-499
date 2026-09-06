import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  UserPlus,
  Search,
  Shield,
  KeyRound,
  Edit3,
  Building2,
  Briefcase,
  Users,
  Plus,
} from 'lucide-react'
import { type UserItem, CreateUserModal } from './CreateUserModal'
import { CreateDepartmentModal } from '../admin/CreateDepartmentModal'
import { CreateRoleModal } from '../admin/CreateRoleModal'
import apiClient from '@/lib/axios'

export interface DepartmentItem {
  id: string
  name: string
  code?: string | null
  managerId?: string | null
  managerName?: string | null
  managerEmail?: string | null
  isActive: boolean
  employeeCount: number
  positionCount: number
  createdAt: string
}

export interface RoleItem {
  id: string
  title: string
  code?: string | null
  departmentId?: string | null
  departmentName?: string | null
  isActive: boolean
  employeeCount: number
  createdAt: string
}

// Role formatting helper
function formatRoleName(roleRaw: string): string {
  if (!roleRaw) return 'Employee'
  const normalized = roleRaw.toUpperCase().trim()
  switch (normalized) {
    case 'ADMIN':
      return 'Admin'
    case 'HR_MANAGER':
      return 'HR Manager'
    case 'HR_PAYROLL_USER':
      return 'HR Payroll User'
    case 'HR_PAYROLL_MANAGER':
    case 'HR_PAYROLL_ADMIN':
    case 'PAYROLL_ADMIN':
      return 'HR Payroll Manager'
    case 'EMPLOYEE':
      return 'Employee'
    default:
      return roleRaw.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }
}

export const UserManagementView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const activeTab: 'users' | 'departments' | 'roles' =
    rawTab === 'departments' || rawTab === 'roles' ? rawTab : 'users'

  // Users state
  const [users, setUsers] = useState<UserItem[]>([])
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [modalMode, setModalMode] = useState<'edit' | 'password'>('edit')

  // Departments state
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false)

  // Roles (Job Positions) state
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)

  // Employees master list (for manager selection)
  const [employeesList, setEmployeesList] = useState<Array<{ id: string; name: string; email?: string }>>([])

  // Search & loading
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // 300ms Debounce effect on search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch users from backend GET /api/v1/users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (debouncedSearch) params.search = debouncedSearch

      const response = await apiClient.get('/v1/users', { params })
      const resData = response.data?.data
      const items = resData?.data || resData || []

      if (Array.isArray(items)) {
        const mapped: UserItem[] = items.map((u: any) => ({
          id: u.id,
          name: u.employeeName || u.email.split('@')[0],
          employeeName: u.employeeName || u.email.split('@')[0],
          email: u.email,
          role: formatRoleName(u.role),
          status: u.isActive ? 'active' : 'inactive',
          employeeId: u.employeeId,
          clerkUserId: u.clerkUserId,
        }))
        setUsers(mapped)
      }
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch departments from backend GET /api/v1/employees/meta/departments
  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/employees/meta/departments')
      const items = res.data?.departments || res.data?.data?.departments || res.data?.data || []
      if (Array.isArray(items)) {
        setDepartments(items)
      }
    } catch {
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch roles (job positions) from backend GET /api/v1/employees/meta/job-positions
  const fetchRoles = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/employees/meta/job-positions')
      const items = res.data?.jobPositions || res.data?.data?.jobPositions || res.data?.data || []
      if (Array.isArray(items)) {
        setRoles(items)
      }
    } catch {
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch employees list for dropdown selectors
  const fetchEmployeesList = async () => {
    try {
      const res = await apiClient.get('/v1/employees?limit=100')
      const items = res.data?.items || res.data?.data?.items || res.data?.data || []
      if (Array.isArray(items)) {
        setEmployeesList(
          items.map((e: any) => ({
            id: e.id,
            name: `${e.firstName} ${e.lastName}`.trim(),
            email: e.email,
          }))
        )
      }
    } catch {
      // Ignore
    }
  }

  // Fetch data depending on active tab
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'departments') {
      fetchDepartments()
      fetchEmployeesList()
    } else if (activeTab === 'roles') {
      fetchRoles()
      fetchDepartments()
    }
  }, [activeTab, debouncedSearch])

  // Initial load of master helper lists
  useEffect(() => {
    fetchDepartments()
    fetchEmployeesList()
  }, [])

  const handleTabChange = (tab: 'users' | 'departments' | 'roles') => {
    setSearchQuery('')
    setSearchParams({ tab })
  }

  // User Handlers
  const handleCreateNewUser = () => {
    setEditingUser(null)
    setModalMode('edit')
    setIsUserModalOpen(true)
  }

  const handleEditUser = (user: UserItem, mode: 'edit' | 'password' = 'edit') => {
    setEditingUser(user)
    setModalMode(mode)
    setIsUserModalOpen(true)
  }

  // Filtered lists for client-side search on Departments & Roles
  const filteredDepartments = departments.filter((d) => {
    if (!debouncedSearch.trim()) return true
    const q = debouncedSearch.toLowerCase()
    return (
      d.name.toLowerCase().includes(q) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      (d.managerName && d.managerName.toLowerCase().includes(q))
    )
  })

  const filteredRoles = roles.filter((r) => {
    if (!debouncedSearch.trim()) return true
    const q = debouncedSearch.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      (r.code && r.code.toLowerCase().includes(q)) ||
      (r.departmentName && r.departmentName.toLowerCase().includes(q))
    )
  })

  return (
    <div className="pp-card w-full shadow-sm">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[var(--color-text-heading)] mb-0">
              {activeTab === 'users'
                ? 'User Management'
                : activeTab === 'departments'
                ? 'Department Management'
                : 'Role & Job Position Management'}
            </h2>
            <span className="pp-badge pp-badge-neutral text-[10px] inline-flex items-center gap-1">
              <Shield className="w-3 h-3 text-[var(--color-primary)]" />
              <span>ADMIN PORTAL</span>
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-0">
            {activeTab === 'users'
              ? 'Administrators create user accounts and assign access. Employees use Login to enter the HR and Payroll application.'
              : activeTab === 'departments'
              ? 'Define company departments, operational teams, and designated department managers.'
              : 'Configure organizational roles and job positions assigned to employee contracts.'}
          </p>
        </div>

        {/* Primary Action Button */}
        <div>
          {activeTab === 'users' && (
            <button
              onClick={handleCreateNewUser}
              className="pp-btn-primary text-xs font-semibold py-2 px-3.5 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ New User</span>
            </button>
          )}
          {activeTab === 'departments' && (
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="pp-btn-primary text-xs font-semibold py-2 px-3.5 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Department</span>
            </button>
          )}
          {activeTab === 'roles' && (
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="pp-btn-primary text-xs font-semibold py-2 px-3.5 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Role</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] mb-4">
        <button
          type="button"
          onClick={() => handleTabChange('users')}
          className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[rgba(113,72,103,0.05)] rounded-t'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Accounts</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] font-medium">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('departments')}
          className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'departments'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[rgba(113,72,103,0.05)] rounded-t'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Departments</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] font-medium">
            {departments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('roles')}
          className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'roles'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[rgba(113,72,103,0.05)] rounded-t'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Roles (Job Positions)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] font-medium">
            {roles.length}
          </span>
        </button>
      </div>

      {/* Toolbar: Search */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'users'
                ? 'Search users, employees or email...'
                : activeTab === 'departments'
                ? 'Search departments, code or manager...'
                : 'Search roles, code or department...'
            }
            className="pp-input text-xs pl-8 w-full"
          />
        </div>
      </div>

      {/* Tab 1: Users Data Table */}
      {activeTab === 'users' && (
        <div className="pp-card-flat overflow-x-auto p-0">
          <table className="pp-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Employee</th>
                <th>Work Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-text-muted)] italic">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleEditUser(user, 'edit')}
                    className="cursor-pointer transition-colors hover:bg-[var(--color-bg-muted)]"
                  >
                    <td className="font-semibold text-[var(--color-primary)]">
                      {user.name}
                    </td>
                    <td>{user.employeeName}</td>
                    <td className="font-mono text-xs text-[var(--color-text-muted)]">
                      {user.email}
                    </td>
                    <td>
                      <span className="pp-badge pp-badge-neutral font-medium">
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`pp-badge ${
                          user.status === 'active' ? 'pp-badge-success font-bold' : 'pp-badge-neutral'
                        }`}
                      >
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditUser(user, 'password')}
                          className="pp-btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1 cursor-pointer hover:border-[var(--color-primary)]"
                          title="Update or reset password"
                        >
                          <KeyRound className="w-3 h-3 text-[var(--color-primary)]" />
                          <span>Update Password</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditUser(user, 'edit')}
                          className="pp-btn-secondary text-[11px] py-1 px-2 inline-flex items-center gap-1 cursor-pointer"
                          title="Edit user access"
                        >
                          <Edit3 className="w-3 h-3 text-[var(--color-text-muted)]" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Departments Data Table */}
      {activeTab === 'departments' && (
        <div className="pp-card-flat overflow-x-auto p-0">
          <table className="pp-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Code</th>
                <th>Manager / Lead</th>
                <th>Staff Count</th>
                <th>Roles Count</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
                    Loading departments...
                  </td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-text-muted)] italic">
                    No departments found. Click &quot;+ Create Department&quot; to add one.
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="transition-colors hover:bg-[var(--color-bg-muted)]">
                    <td className="font-semibold text-[var(--color-text-heading)]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        <span>{dept.name}</span>
                      </div>
                    </td>
                    <td>
                      {dept.code ? (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--color-bg-muted)] text-[var(--color-text-heading)]">
                          {dept.code}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td>
                      {dept.managerName ? (
                        <span className="text-xs font-medium text-[var(--color-text-body)]">
                          {dept.managerName}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)] italic">No manager assigned</span>
                      )}
                    </td>
                    <td>
                      <span className="pp-badge pp-badge-neutral text-xs font-medium">
                        {dept.employeeCount} {dept.employeeCount === 1 ? 'employee' : 'employees'}
                      </span>
                    </td>
                    <td>
                      <span className="pp-badge pp-badge-neutral text-xs font-medium">
                        {dept.positionCount} {dept.positionCount === 1 ? 'role' : 'roles'}
                      </span>
                    </td>
                    <td className="text-right">
                      <span
                        className={`pp-badge ${
                          dept.isActive ? 'pp-badge-success font-bold' : 'pp-badge-neutral'
                        }`}
                      >
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Roles (Job Positions) Data Table */}
      {activeTab === 'roles' && (
        <div className="pp-card-flat overflow-x-auto p-0">
          <table className="pp-table">
            <thead>
              <tr>
                <th>Role Title</th>
                <th>Department</th>
                <th>Role Code</th>
                <th>Staff Count</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
                    Loading roles &amp; job positions...
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[var(--color-text-muted)] italic">
                    No roles found. Click &quot;+ Create Role&quot; to define a new position.
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="transition-colors hover:bg-[var(--color-bg-muted)]">
                    <td className="font-semibold text-[var(--color-text-heading)]">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        <span>{role.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-medium text-[var(--color-text-body)]">
                        {role.departmentName}
                      </span>
                    </td>
                    <td>
                      {role.code ? (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--color-bg-muted)] text-[var(--color-text-heading)]">
                          {role.code}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td>
                      <span className="pp-badge pp-badge-neutral text-xs font-medium">
                        {role.employeeCount} {role.employeeCount === 1 ? 'employee' : 'employees'}
                      </span>
                    </td>
                    <td className="text-right">
                      <span
                        className={`pp-badge ${
                          role.isActive ? 'pp-badge-success font-bold' : 'pp-badge-neutral'
                        }`}
                      >
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Captions */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--color-text-muted)] gap-2">
        <span>
          {activeTab === 'users'
            ? 'Select a user or click "Update Password" to manage credentials and access.'
            : activeTab === 'departments'
            ? 'Departments organize workforce assignments and manager approval hierarchies.'
            : 'Roles and job positions define operational duties and contract titles for employees.'}
        </span>
        <span className="text-[11px] italic">
          Admin configurations apply company-wide across the HR and Payroll ecosystem.
        </span>
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={editingUser}
        onSaved={fetchUsers}
        existingUsers={users}
        initialMode={modalMode}
      />

      <CreateDepartmentModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onSaved={() => {
          fetchDepartments()
        }}
        employeesList={employeesList}
      />

      <CreateRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSaved={() => {
          fetchRoles()
        }}
        departmentsList={departments}
      />
    </div>
  )
}

