import React, { useState, useEffect } from 'react'
import { type UserItem, CreateUserModal } from './CreateUserModal'
import apiClient from '@/lib/axios'

// Sample initial data matching the exact screenshot wireframe
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
    // Fetch users from backend API if available
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
        // Fallback to pre-loaded wireframe sample users if endpoint restricted
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

  // Filtered users calculation
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
    <div className="w-full bg-[#181b24] border border-[#2a2e3d] rounded-2xl p-6 text-white shadow-2xl">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#262a38]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">User Management</h2>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-800">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Manage application user accounts, role permissions, and access status.
          </p>
        </div>

        {/* Action Header Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md shadow-blue-900/30 flex items-center gap-2"
          >
            <span className="text-base font-bold">+</span> New User
          </button>
        </div>
      </div>

      {/* Toolbar: Search + Role Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, employees or email..."
            className="w-full bg-[#101218] border border-[#2e3344] rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-500 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-gray-400 whitespace-nowrap">Filter Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#101218] border border-[#2e3344] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Role Filter (All)</option>
            <option value="admin">Admin</option>
            <option value="payroll">Payroll</option>
            <option value="time off">Time Off</option>
            <option value="employee">Employee</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="overflow-x-auto rounded-xl border border-[#272b38] bg-[#101218]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#232734] bg-[#141720]">
              <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">User</th>
              <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Employee</th>
              <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Work Email</th>
              <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Role</th>
              <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#202432]">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-gray-500 italic">
                  No matching user accounts found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleEditUser(user)}
                  className="hover:bg-[#1b1f2d] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 text-xs font-semibold text-blue-400 group-hover:underline">
                    {user.name}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-300">
                    {user.employeeName}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400 font-mono">
                    {user.email}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-200">
                    <span className="inline-block px-2 py-0.5 rounded bg-[#1c2130] border border-[#2f364b] text-gray-300">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        user.status === 'active'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      ></span>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Caption */}
      <div className="mt-4 pt-3 border-t border-[#232734] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
        <span>Select a user to edit access, or create a new user.</span>
        <span className="text-[11px] text-gray-500 italic">
          User accounts are separate from Employee records, but should be linked to an employee for access and ownership.
        </span>
      </div>

      {/* Create / Edit Drawer Modal */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={editingUser}
        onSaved={handleUserSaved}
      />
    </div>
  )
}
