import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  Briefcase,
} from 'lucide-react'
import { useAuthUser, canAccessPayroll } from '@/store/auth.store'

interface ContractItem {
  id: string
  reference: string
  employeeName: string
  department: string
  jobTitle: string
  schedule: string
  structure: string
  wage: number
  currency: string
  startDate: string
  status: 'active' | 'draft' | 'expired'
}

const SAMPLE_CONTRACTS: ContractItem[] = [
  {
    id: 'c-1',
    reference: 'CON-2026-001',
    employeeName: 'Aarav Mehta',
    department: 'Engineering',
    jobTitle: 'Senior Software Engineer',
    schedule: 'Standard 40h/week (Mon-Fri)',
    structure: 'Standard Technical Salary Structure',
    wage: 120000,
    currency: 'INR',
    startDate: '2025-01-15',
    status: 'active',
  },
  {
    id: 'c-2',
    reference: 'CON-2026-002',
    employeeName: 'Maya Shah',
    department: 'Human Resources',
    jobTitle: 'HR Specialist',
    schedule: 'Standard 40h/week (Mon-Fri)',
    structure: 'HR & Administrative Structure',
    wage: 85000,
    currency: 'INR',
    startDate: '2025-03-01',
    status: 'active',
  },
  {
    id: 'c-3',
    reference: 'CON-2026-003',
    employeeName: 'Rohan Patel',
    department: 'Finance',
    jobTitle: 'Financial Analyst',
    schedule: 'Flexible 35h/week',
    structure: 'Finance & Accounts Structure',
    wage: 95000,
    currency: 'INR',
    startDate: '2025-06-10',
    status: 'active',
  },
  {
    id: 'c-4',
    reference: 'CON-2026-004',
    employeeName: 'Nisha Rao',
    department: 'Product',
    jobTitle: 'Product Manager',
    schedule: 'Standard 40h/week (Mon-Fri)',
    structure: 'Management Structure',
    wage: 140000,
    currency: 'INR',
    startDate: '2026-01-01',
    status: 'draft',
  },
]

export const ContractsView: React.FC = () => {
  const user = useAuthUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'contracts'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const isPayrollUser = canAccessPayroll(user?.role)

  const filteredContracts = SAMPLE_CONTRACTS.filter((c) => {
    const matchesSearch =
      c.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      c.reference.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-heading)] flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[var(--color-primary)]" />
            <span>Contracts Administration</span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Manage employee wage arrangements, working schedules, and assigned salary structures.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('New contract creation dialog')}
          className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--color-border)] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'contracts'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          All Contracts
        </button>
        {isPayrollUser && (
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'structures' })}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'structures'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            Salary Structures
          </button>
        )}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'schedules' })}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'schedules'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
          }`}
        >
          Working Schedules
        </button>
      </div>

      {/* Tab 1: Contracts List */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="pp-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(0,200,83,0.12)] text-[#00C853] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Active Contracts</p>
                <p className="text-lg font-extrabold text-[var(--color-text-heading)]">3</p>
              </div>
            </div>

            <div className="pp-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(255,170,0,0.12)] text-[#FFAA00] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Draft Contracts</p>
                <p className="text-lg font-extrabold text-[var(--color-text-heading)]">1</p>
              </div>
            </div>

            <div className="pp-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Avg Monthly Wage</p>
                <p className="text-lg font-extrabold text-[var(--color-text-heading)]">₹1,10,000</p>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search contracts by employee or ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pp-input pl-9 text-xs w-full"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pp-input text-xs py-1.5"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Contracts Table */}
          <div className="pp-card overflow-x-auto border border-[var(--color-border)] shadow-xs rounded-[6px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Contract Ref</th>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Job & Department</th>
                  <th className="py-2.5 px-4">Working Schedule</th>
                  <th className="py-2.5 px-4">Monthly Wage</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
                {filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[var(--color-primary)]">
                      {c.reference}
                    </td>
                    <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                      {c.employeeName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--color-text-heading)]">{c.jobTitle}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">{c.department}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text-muted)]">{c.schedule}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[var(--color-text-heading)]">
                      ₹{c.wage.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`pp-badge uppercase text-[10px] font-bold ${
                          c.status === 'active' ? 'pp-badge-success' : 'pp-badge-warning'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Salary Structures */}
      {activeTab === 'structures' && (
        <div className="pp-card p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--color-text-heading)] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Salary Structures & Rules Configuration</span>
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Salary structures define standard computation formulas (BASIC, HRA, DEDUCTIONS, NET) using Reverse Polish Notation (RPN).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg-muted)]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[var(--color-text-heading)]">Standard Technical Structure</span>
                <span className="pp-badge pp-badge-success text-[10px]">Active</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">Code: TECH_STD_2026 | Rules: 6 active formulas</p>
              <div className="text-[10px] font-mono text-[var(--color-primary)] bg-[rgba(113,72,103,0.06)] p-2 rounded">
                BASIC: WAGE * 0.50 | HRA: BASIC * 0.40 | NET: GROSS - DEDUCTIONS
              </div>
            </div>

            <div className="p-4 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg-muted)]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[var(--color-text-heading)]">HR & Administrative Structure</span>
                <span className="pp-badge pp-badge-success text-[10px]">Active</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">Code: HR_ADMIN_2026 | Rules: 5 active formulas</p>
              <div className="text-[10px] font-mono text-[var(--color-primary)] bg-[rgba(113,72,103,0.06)] p-2 rounded">
                BASIC: WAGE * 0.50 | CONVEYANCE: 1600 | NET: GROSS - DEDUCTIONS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Working Schedules */}
      {activeTab === 'schedules' && (
        <div className="pp-card p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--color-text-heading)] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Working Schedules</span>
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Define standard working calendars used for attendance tracking and wage proration.
          </p>

          <div className="space-y-3">
            <div className="p-3.5 border border-[var(--color-border)] rounded-[6px] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[var(--color-text-heading)]">Standard 40h/week (Mon-Fri)</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">09:00 - 18:00 (1 hour lunch break) | Timezone: Asia/Kolkata</p>
              </div>
              <span className="pp-badge pp-badge-neutral text-xs">Default Schedule</span>
            </div>

            <div className="p-3.5 border border-[var(--color-border)] rounded-[6px] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[var(--color-text-heading)]">Flexible 35h/week</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Core hours 11:00 - 16:00 | Timezone: Asia/Kolkata</p>
              </div>
              <span className="pp-badge pp-badge-neutral text-xs">Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
