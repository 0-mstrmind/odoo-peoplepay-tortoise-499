import React, { useState, useEffect } from 'react'
import { UserPlus, Search, Shield, KeyRound, Edit3 } from 'lucide-react'
import { type UserItem, CreateUserModal } from './CreateUserModal'
import apiClient from '@/lib/axios'

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
  const [users, setUsers] = useState<UserItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [modalMode, setModalMode] = useState<'edit' | 'password'>('edit')
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

  useEffect(() => {
    fetchUsers()
  }, [debouncedSearch])

  const handleCreateNew = () => {
    setEditingUser(null)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleEditUser = (user: UserItem, mode: 'edit' | 'password' = 'edit') => {
    setEditingUser(user)
    setModalMode(mode)
    setIsModalOpen(true)
  }

  const handleUserSaved = () => {
    fetchUsers()
  }

  return (
    <div className="pp-card w-full shadow-sm">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[var(--color-text-heading)] mb-0">User Management</h2>
            <span className="pp-badge pp-badge-neutral text-[10px] inline-flex items-center gap-1">
              <Shield className="w-3 h-3 text-[var(--color-primary)]" />
              <span>ADMIN ONLY</span>
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-0">
            Administrators create user accounts and assign access. Employees use Login to enter the HR and Payroll application.
          </p>
        </div>

        {/* New User Action Button */}
        <div>
          <button
            onClick={handleCreateNew}
            className="pp-btn-primary text-xs font-semibold py-2 px-3.5 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ New User</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, employees or email..."
            className="pp-input text-xs pl-8 w-full"
          />
        </div>
      </div>

      {/* Data Table */}
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

      {/* Footer Captions */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--color-text-muted)] gap-2">
        <span>Select a user or click &quot;Update Password&quot; to manage credentials and access.</span>
        <span className="text-[11px] italic">
          User accounts are separate from Employee records, but should be linked to an employee for access and ownership.
        </span>
      </div>

      {/* Drawer / Modal */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={editingUser}
        onSaved={handleUserSaved}
        existingUsers={users}
        initialMode={modalMode}
      />
    </div>
  )
}
