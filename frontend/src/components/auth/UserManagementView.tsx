import React, { useState, useEffect } from 'react'
import { UserPlus, Search, Filter, Shield } from 'lucide-react'
import { type UserItem, CreateUserModal } from './CreateUserModal'
import apiClient from '@/lib/axios'

const INITIAL_USERS: UserItem[] = [
  {
    id: 'u-1',
    name: 'Aarav Mehta',
    employeeName: 'Aarav Mehta',
    email: 'aarav@company.com',
    role: 'Payroll User',
    status: 'active',
  },
  {
    id: 'u-2',
    name: 'Maya Shah',
    employeeName: 'Maya Shah',
    email: 'maya@company.com',
    role: 'Time Off Admin',
    status: 'active',
  },
  {
    id: 'u-3',
    name: 'Rohan Patel',
    employeeName: 'Rohan Patel',
    email: 'rohan@company.com',
    role: 'Time Off User',
    status: 'active',
  },
  {
    id: 'u-4',
    name: 'Nisha Rao',
    employeeName: 'Nisha Rao',
    email: 'nisha@company.com',
    role: 'Payroll Admin',
    status: 'active',
  },
]

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get('/v1/auth/users')
        const data = response.data?.data || response.data
        if (Array.isArray(data) && data.length > 0) {
          const mapped: UserItem[] = data.map((u: any) => {
            const empName = u.linkedEmployee
              ? `${u.linkedEmployee.firstName} ${u.linkedEmployee.lastName}`
              : u.email.split('@')[0]
            return {
              id: u.id,
              name: empName,
              employeeName: empName,
              email: u.email,
              role: u.role ? u.role.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Employee',
              status: u.isActive ? 'active' : 'inactive',
              employeeId: u.employeeId,
            }
          })
          setUsers(mapped)
        }
      } catch {
        // Fallback to sample data if endpoint not reachable
      }
    }
    fetchUsers()
  }, [])

  const handleCreateNew = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: UserItem) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleUserSaved = (savedUser: UserItem) => {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === savedUser.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = savedUser
        return next
      }
      return [savedUser, ...prev]
    })
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole =
      roleFilter === 'all' || u.role.toLowerCase().includes(roleFilter.toLowerCase())

    return matchesSearch && matchesRole
  })

  return (
    <div className="pp-card w-full shadow-sm">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[var(--color-text-heading)]">User Management</h2>
            <span className="pp-badge pp-badge-neutral text-[10px] inline-flex items-center gap-1">
              <Shield className="w-3 h-3 text-[var(--color-primary)]" />
              <span>ADMIN ONLY</span>
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Administrators create user accounts and assign access. Employees use Login to enter the HR and Payroll application.
          </p>
        </div>

        {/* New User Action Button */}
        <div>
          <button
            onClick={handleCreateNew}
            className="pp-btn-primary text-xs font-semibold py-2 px-3.5 inline-flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New User</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search + Role Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, employees or email..."
            className="pp-input text-xs pl-8"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pp-input text-xs"
          >
            <option value="all">Role Filter (All)</option>
            <option value="admin">Admin</option>
            <option value="payroll">Payroll</option>
            <option value="time off">Time Off</option>
            <option value="employee">Employee</option>
          </select>
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
              <th className="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-[var(--color-text-muted)] italic">
                  No matching user accounts found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleEditUser(user)}
                  className="cursor-pointer transition-colors"
                >
                  <td className="font-semibold text-[var(--color-primary)]">
                    {user.name}
                  </td>
                  <td>{user.employeeName}</td>
                  <td className="font-mono text-xs text-[var(--color-text-muted)]">
                    {user.email}
                  </td>
                  <td>
                    <span className="pp-badge pp-badge-neutral font-normal">
                      {user.role}
                    </span>
                  </td>
                  <td className="text-right">
                    <span
                      className={`pp-badge ${
                        user.status === 'active' ? 'pp-badge-success' : 'pp-badge-neutral'
                      }`}
                    >
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Captions */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--color-text-muted)] gap-2">
        <span>Select a user to edit access, or create a new user.</span>
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
      />
    </div>
  )
}
