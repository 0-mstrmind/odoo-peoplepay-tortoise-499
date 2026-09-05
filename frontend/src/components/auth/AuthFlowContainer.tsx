import React, { useState } from 'react'
import { LoginView } from './LoginView'
import { UserManagementView } from './UserManagementView'
import { useAuthStore } from '@/store/auth.store'

export const AuthFlowContainer: React.FC = () => {
  const [viewMode, setViewMode] = useState<'wireframe' | 'login' | 'admin'>('wireframe')
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="min-h-screen bg-[#0d0f14] text-gray-100 p-4 md:p-8 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar & Screen Flow View Controls */}
      <div className="max-w-7xl mx-auto mb-8 bg-[#161822] border border-[#282c3c] rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-900/40">
              0)
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                Login & User Access Flow
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Administrators create user accounts and assign access. Employees use Login to enter the HR and Payroll application.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-[#0e1017] p-1.5 rounded-xl border border-[#242838]">
          <button
            onClick={() => setViewMode('wireframe')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'wireframe'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Side-by-Side Wireframe
          </button>
          <button
            onClick={() => setViewMode('login')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'login'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔑 Live Login Portal
          </button>
          <button
            onClick={() => setViewMode('admin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'admin'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            👥 Live User Management
          </button>
        </div>
      </div>

      {/* User Session Bar */}
      {user && (
        <div className="max-w-7xl mx-auto mb-6 p-3 rounded-xl bg-blue-950/40 border border-blue-800/80 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Logged in as: <strong>{user.email}</strong> ({user.role})</span>
          </div>
          <button
            onClick={logout}
            className="px-2.5 py-1 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700 text-xs font-medium"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {viewMode === 'wireframe' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: HR Portal Login Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <span>Step 1</span>
                  <span className="w-8 h-0.5 bg-blue-500/40"></span>
                  <span>User Login Screen</span>
                </div>
                <LoginView onSuccess={() => setViewMode('admin')} />
              </div>

              {/* Right Column: User Management Dashboard */}
              <div className="lg:col-span-7 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <span>Step 2</span>
                  <span className="w-8 h-0.5 bg-emerald-500/40"></span>
                  <span>Admin User Access & Provisioning</span>
                </div>
                <UserManagementView />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'login' && (
          <div className="py-12 flex justify-center">
            <LoginView onSuccess={() => setViewMode('admin')} />
          </div>
        )}

        {viewMode === 'admin' && (
          <div className="py-4">
            <UserManagementView />
          </div>
        )}
      </div>

      {/* Footer Title */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#202432] text-center">
        <h3 className="text-lg font-bold text-gray-300 tracking-wide">
          Odoo HR Payroll Hackathon — Functional Screen Flow
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Multi-tenant SaaS Architecture with Scoped Role-Based Access Control (RBAC)
        </p>
      </div>
    </div>
  )
}
