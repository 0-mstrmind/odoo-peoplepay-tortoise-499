import React, { useState } from 'react'
import {
  CreditCard,
  Play,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { useAuthUser } from '@/store/auth.store'

interface PayslipSummary {
  id: string
  slipNumber: string
  employeeName: string
  department: string
  basicWage: number
  grossWage: number
  deductions: number
  netWage: number
  status: 'draft' | 'computed' | 'validated'
}

const SAMPLE_SLIPS: PayslipSummary[] = [
  {
    id: 'slip-1',
    slipNumber: 'SLIP-2026-09-001',
    employeeName: 'Aarav Mehta',
    department: 'Engineering',
    basicWage: 60000,
    grossWage: 120000,
    deductions: 14400,
    netWage: 105600,
    status: 'computed',
  },
  {
    id: 'slip-2',
    slipNumber: 'SLIP-2026-09-002',
    employeeName: 'Maya Shah',
    department: 'Human Resources',
    basicWage: 42500,
    grossWage: 85000,
    deductions: 10200,
    netWage: 74800,
    status: 'computed',
  },
  {
    id: 'slip-3',
    slipNumber: 'SLIP-2026-09-003',
    employeeName: 'Rohan Patel',
    department: 'Finance',
    basicWage: 47500,
    grossWage: 95000,
    deductions: 11400,
    netWage: 83600,
    status: 'computed',
  },
]

export const PayrollView: React.FC = () => {
  const user = useAuthUser()
  const role = user?.role
  const isManager = role === 'admin' || role === 'super_admin' || role === 'hr_payroll_manager'

  const [slips, setSlips] = useState<PayslipSummary[]>(SAMPLE_SLIPS)
  const [payrunStatus, setPayrunStatus] = useState<'draft' | 'computed' | 'validated'>('computed')
  const [feedback, setFeedback] = useState<string | null>(null)

  const totalGross = slips.reduce((sum, s) => sum + s.grossWage, 0)
  const totalDeductions = slips.reduce((sum, s) => sum + s.deductions, 0)
  const totalNet = slips.reduce((sum, s) => sum + s.netWage, 0)

  const handleCompute = () => {
    setPayrunStatus('computed')
    setFeedback('Recomputed all employee payslips with latest attendance and leave deductions.')
    setTimeout(() => setFeedback(null), 3500)
  }

  const handleValidate = () => {
    setPayrunStatus('validated')
    setSlips((prev) => prev.map((s) => ({ ...s, status: 'validated' })))
    setFeedback('Payrun cycle validated! Payslips locked for bank disbursement.')
    setTimeout(() => setFeedback(null), 3500)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-heading)] flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[var(--color-primary)]" />
            <span>Payroll Engine & Payslips</span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Automated multi-tenant payrun batches and RPN salary calculations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCompute}
            className="pp-btn-secondary text-xs py-2 px-3 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Compute Batch</span>
          </button>
          {isManager && payrunStatus !== 'validated' && (
            <button
              type="button"
              onClick={handleValidate}
              className="pp-btn-primary text-xs py-2 px-3.5 rounded-[4px] font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Validate Payrun</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-[rgba(0,200,83,0.1)] border border-[#00C853] text-[#00C853] text-xs font-semibold rounded-[4px] animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Payrun Banner */}
      <div className="pp-card p-5 bg-[rgba(113,72,103,0.04)] border border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--color-text-heading)] mb-0">
              September 2026 Regular Monthly Payrun
            </h2>
            <span
              className={`pp-badge uppercase text-[10px] font-bold ${
                payrunStatus === 'validated' ? 'pp-badge-success' : 'pp-badge-warning'
              }`}
            >
              {payrunStatus}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Period: 01 Sep 2026 - 30 Sep 2026 | Assigned Structure: Multi-Tenant Standard RPN
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div>
            <span className="text-[10px] text-[var(--color-text-muted)] block">Employees</span>
            <span className="text-base font-extrabold text-[var(--color-text-heading)]">{slips.length}</span>
          </div>
          <div className="h-8 w-px bg-[var(--color-border)]" />
          <div>
            <span className="text-[10px] text-[var(--color-text-muted)] block">Total Net Pay</span>
            <span className="text-base font-extrabold text-[var(--color-primary)]">
              ₹{totalNet.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pp-card p-4">
          <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Total Gross Earnings</p>
          <p className="text-xl font-extrabold text-[var(--color-text-heading)] mt-1">
            ₹{totalGross.toLocaleString()}
          </p>
          <span className="text-[10px] text-[var(--color-text-muted)]">Basic + HRA + Allowances</span>
        </div>

        <div className="pp-card p-4">
          <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Total Deductions</p>
          <p className="text-xl font-extrabold text-[#FF1744] mt-1">
            -₹{totalDeductions.toLocaleString()}
          </p>
          <span className="text-[10px] text-[var(--color-text-muted)]">PF + Tax + Unpaid Leaves</span>
        </div>

        <div className="pp-card p-4">
          <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Total Net Payable</p>
          <p className="text-xl font-extrabold text-[#00C853] mt-1">
            ₹{totalNet.toLocaleString()}
          </p>
          <span className="text-[10px] text-[var(--color-text-muted)]">Direct Bank Transfers</span>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="pp-card border border-[var(--color-border)] shadow-xs rounded-[6px] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
              Individual Employee Payslips
            </h3>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">Formula context: WORKED_DAYS / TOTAL_DAYS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                <th className="py-2.5 px-4">Slip Number</th>
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Basic Wage</th>
                <th className="py-2.5 px-4">Gross Wage</th>
                <th className="py-2.5 px-4">Deductions</th>
                <th className="py-2.5 px-4">Net Wage</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-body)]">
              {slips.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-[var(--color-primary)]">
                    {s.slipNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                    {s.employeeName}
                  </td>
                  <td className="py-3 px-4 text-[var(--color-text-muted)]">{s.department}</td>
                  <td className="py-3 px-4 font-mono">₹{s.basicWage.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono font-semibold">₹{s.grossWage.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono text-[#FF1744]">-₹{s.deductions.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#00C853]">₹{s.netWage.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`pp-badge uppercase text-[10px] font-bold ${
                        s.status === 'validated' ? 'pp-badge-success' : 'pp-badge-warning'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
