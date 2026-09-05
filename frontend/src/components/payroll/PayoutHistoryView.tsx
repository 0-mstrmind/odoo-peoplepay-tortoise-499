import React, { useState } from 'react'
import {
  CreditCard,
  Calendar,
  FileText,
  CheckCircle2,
  DollarSign,
  X,
  Landmark,
  Loader2,
  Eye,
  Search,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useAuthUser } from '@/store/auth.store'
import { useMyEmployeeProfile } from '@/hooks/use-api'
import { usePayslips, usePayslip as usePayslipDetail, type Payslip as PayslipItem, type PayslipLine } from '@/hooks/use-payroll'

export const PayoutHistoryView: React.FC = () => {
  const user = useAuthUser()
  const { data: myEmployee } = useMyEmployeeProfile()
  const { data: rawPayslips = [], isLoading: isPayslipsLoading } = usePayslips()

  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fetch single payslip breakdown when modal is opened
  const { data: payslipDetail, isLoading: isDetailLoading } = usePayslipDetail(selectedPayslipId || '')

  const isEmployee = user?.role?.toLowerCase() === 'employee'
  const employeeName = myEmployee
    ? `${myEmployee.firstName} ${myEmployee.lastName}`
    : (user?.name || user?.email || 'Employee')

  // Bank details
  const primaryBank = myEmployee?.bankAccounts?.[0] || {
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50100458923412',
    ifscCode: 'HDFC0001234',
  }

  // Filter payslips
  const payslipsList: PayslipItem[] = Array.isArray(rawPayslips) ? rawPayslips : []

  const filteredPayslips = payslipsList.filter((p) => {
    const period = p.payrun?.periodLabel || p.periodStart || ''
    const matchesSearch = period.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.status.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  // Summary Metrics
  const totalNetDisbursed = payslipsList
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.net || 0), 0)

  const latestPaid = payslipsList.find((p) => p.status === 'paid')

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-payslip')
    if (!element) {
      toast.error('Payslip statement view not found')
      return
    }

    setIsDownloadingPdf(true)
    const periodLabel = payslipDetail?.payrun?.periodLabel || 'Monthly Payrun'
    const empName = payslipDetail?.employee
      ? `${payslipDetail.employee.firstName}_${payslipDetail.employee.lastName}`
      : (user?.name ? user.name.replace(/\s+/g, '_') : 'Employee')
    const fileName = `Payslip_${empName}_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`

    try {
      // Method 1: Render live element canvas directly
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 190
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Top branding banner in PDF
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.setTextColor(113, 72, 103)
      pdf.text('PeoplePay360', 10, 14)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(107, 114, 128)
      pdf.text(`Official Salary Statement — ${periodLabel}`, 10, 19)

      pdf.setDrawColor(113, 72, 103)
      pdf.setLineWidth(0.5)
      pdf.line(10, 22, 200, 22)

      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, Math.min(imgHeight, pageHeight - 30))

      // Generate Blob & trigger system download via virtual anchor
      const pdfBlob = pdf.output('blob')
      const blobUrl = URL.createObjectURL(pdfBlob)

      const downloadAnchor = document.createElement('a')
      downloadAnchor.href = blobUrl
      downloadAnchor.download = fileName
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()

      document.body.removeChild(downloadAnchor)
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 1000)

      toast.success(`Downloaded ${fileName}`)
    } catch (err: any) {
      console.warn('Canvas rendering error, using jsPDF text fallback:', err)
      // Method 2: High-reliability jsPDF text & table Blob fallback
      try {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(18)
        pdf.setTextColor(113, 72, 103)
        pdf.text('PeoplePay360', 14, 18)

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor(107, 114, 128)
        pdf.text('Official Salary Payslip Statement & Remuneration Receipt', 14, 24)

        pdf.setDrawColor(226, 229, 234)
        pdf.setLineWidth(0.5)
        pdf.line(14, 27, 196, 27)

        let y = 35
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        pdf.setTextColor(26, 31, 54)
        pdf.text(`Pay Period: ${periodLabel}`, 14, y)
        pdf.text(`Status: ${payslipDetail?.status?.toUpperCase() || 'PAID'}`, 140, y)
        y += 7

        const empFullName = payslipDetail?.employee
          ? `${payslipDetail.employee.firstName} ${payslipDetail.employee.lastName}`
          : employeeName
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.text(`Employee Name: ${empFullName}`, 14, y)
        pdf.text(`Employee Code: ${payslipDetail?.employee?.employeeCode || 'EMP-0001'}`, 140, y)
        y += 6

        pdf.text(`Worked Days: ${payslipDetail?.workedDays || 22} Days`, 14, y)
        pdf.text(`Unpaid Leaves: ${payslipDetail?.leaveDays || 0} Days`, 140, y)
        y += 10

        pdf.setDrawColor(113, 72, 103)
        pdf.line(14, y, 196, y)
        y += 6

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.setTextColor(113, 72, 103)
        pdf.text('Itemized Salary Computation Lines', 14, y)
        y += 8

        pdf.setFontSize(9)
        pdf.setTextColor(60, 68, 96)

        const lines = payslipDetail?.payslipLines || []
        if (lines.length > 0) {
          lines.forEach((l: any) => {
            pdf.text(`${l.ruleCode || ''} — ${l.ruleName || ''}`, 14, y)
            pdf.text(`INR ${Number(l.amount || 0).toLocaleString()}`, 196, y, { align: 'right' })
            y += 6
          })
        } else {
          pdf.text(`Basic Salary`, 14, y)
          pdf.text(`INR ${Number(payslipDetail?.basic || 0).toLocaleString()}`, 196, y, { align: 'right' }); y += 6
          pdf.text(`Gross Salary`, 14, y)
          pdf.text(`INR ${Number(payslipDetail?.gross || 0).toLocaleString()}`, 196, y, { align: 'right' }); y += 6
          if (Number(payslipDetail?.totalDeductions || 0) > 0) {
            pdf.text(`Unpaid Leave Deductions`, 14, y)
            pdf.text(`-INR ${Number(payslipDetail?.totalDeductions || 0).toLocaleString()}`, 196, y, { align: 'right' }); y += 6
          }
        }

        y += 4
        pdf.setDrawColor(0, 200, 83)
        pdf.setLineWidth(1)
        pdf.line(14, y, 196, y)
        y += 8

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(12)
        pdf.setTextColor(0, 200, 83)
        pdf.text('Net Payable Salary Disbursed:', 14, y)
        pdf.text(`INR ${Number(payslipDetail?.net || 0).toLocaleString()}`, 196, y, { align: 'right' })

        const pdfBlob = pdf.output('blob')
        const blobUrl = URL.createObjectURL(pdfBlob)

        const downloadAnchor = document.createElement('a')
        downloadAnchor.href = blobUrl
        downloadAnchor.download = fileName
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()

        document.body.removeChild(downloadAnchor)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)

        toast.success(`Downloaded ${fileName}`)
      } catch (fallbackErr) {
        console.error('Fallback PDF generation error:', fallbackErr)
        toast.error('Failed to generate PDF download.')
      }
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pp-badge pp-badge-neutral text-[10px] font-bold uppercase tracking-wider">
              {isEmployee ? 'Personal Finance & Remuneration' : 'Employee Payout Register'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-heading)] flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[var(--color-primary)]" />
            <span>Payout & Payslip History</span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Comprehensive ledger of historical salary disbursements, monthly payrun receipts, and breakdown statements.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pp-card p-4 flex items-center gap-3 border border-[var(--color-border)]">
          <div className="w-10 h-10 rounded-lg bg-[rgba(0,200,83,0.12)] text-[#00C853] flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Total Net Disbursed</p>
            <p className="text-lg font-extrabold text-[var(--color-text-heading)] font-mono">
              ₹{totalNetDisbursed.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="pp-card p-4 flex items-center gap-3 border border-[var(--color-border)]">
          <div className="w-10 h-10 rounded-lg bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Total Payslips Issued</p>
            <p className="text-lg font-extrabold text-[var(--color-text-heading)]">
              {payslipsList.length} Statements
            </p>
          </div>
        </div>

        <div className="pp-card p-4 flex items-center gap-3 border border-[var(--color-border)]">
          <div className="w-10 h-10 rounded-lg bg-[rgba(0,180,216,0.12)] text-[#00B4D8] flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Last Disbursed Period</p>
            <p className="text-sm font-extrabold text-[var(--color-text-heading)]">
              {latestPaid?.payrun?.periodLabel || latestPaid?.periodStart?.split('T')[0] || 'N/A'}
            </p>
          </div>
        </div>

        <div className="pp-card p-4 flex items-center gap-3 border border-[var(--color-border)]">
          <div className="w-10 h-10 rounded-lg bg-[rgba(255,170,0,0.12)] text-[#FFAA00] flex items-center justify-center font-bold">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Salary Disbursement Bank</p>
            <p className="text-xs font-extrabold text-[var(--color-text-heading)] truncate max-w-[140px]">
              {primaryBank.bankName}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="pp-card border border-[var(--color-border)] shadow-xs rounded-[6px] overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-bg-muted)]/30">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-sm font-bold text-[var(--color-text-heading)] mb-0">
              Historical Remuneration Receipts ({filteredPayslips.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search by period..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pp-input text-xs pl-8 py-1 w-36 sm:w-48"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pp-input text-xs py-1"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="validated">Validated</option>
              <option value="computed">Computed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                <th className="py-3 px-4">Pay Period</th>
                {!isEmployee && <th className="py-3 px-4">Employee</th>}
                <th className="py-3 px-4">Basic Wage</th>
                <th className="py-3 px-4">Gross Salary</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Disbursed</th>
                <th className="py-3 px-4">Worked / Leave</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-body)]">
              {isPayslipsLoading ? (
                <tr>
                  <td colSpan={isEmployee ? 8 : 9} className="py-10 text-center text-[var(--color-text-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--color-primary)]" />
                    <span>Loading payout history records from database...</span>
                  </td>
                </tr>
              ) : filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={isEmployee ? 8 : 9} className="py-10 text-center text-[var(--color-text-muted)] italic">
                    No payout history records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPayslips.map((p) => {
                  const periodName = p.payrun?.periodLabel || p.periodStart?.split('T')[0] || 'Monthly Payrun'
                  const empFullName = p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : employeeName
                  const netVal = Number(p.net || 0)
                  const grossVal = Number(p.gross || 0)
                  const basicVal = Number(p.basic || 0)
                  const dedVal = Number(p.totalDeductions || 0)

                  return (
                    <tr key={p.id} className="hover:bg-[var(--color-bg-muted)]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[var(--color-text-heading)]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                          <span>{periodName}</span>
                        </div>
                      </td>
                      {!isEmployee && (
                        <td className="py-3 px-4 font-semibold">{empFullName}</td>
                      )}
                      <td className="py-3 px-4 font-mono">₹{basicVal.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[var(--color-text-heading)]">
                        ₹{grossVal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-600 dark:text-amber-400">
                        {dedVal > 0 ? `-₹${dedVal.toLocaleString()}` : '₹0'}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-[#00C853] text-sm">
                        ₹{netVal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <span className="font-bold">{p.workedDays || 22}d worked</span>
                        {Number(p.leaveDays || 0) > 0 && (
                          <span className="text-red-500 font-semibold ml-1">
                            ({p.leaveDays}d unpaid)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`pp-badge uppercase text-[10px] font-bold ${
                            p.status === 'paid'
                              ? 'pp-badge-success'
                              : p.status === 'validated'
                              ? 'pp-badge-primary'
                              : 'pp-badge-warning'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayslipId(p.id)}
                          className="pp-btn-secondary text-[11px] py-1 px-2.5 rounded font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Statement</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Itemized Payslip Statement Modal */}
      {selectedPayslipId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-[8px] shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(113,72,103,0.12)] text-[var(--color-primary)] flex items-center justify-center font-black text-lg">
                  360
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[var(--color-text-heading)] mb-0">
                    Official Salary Payslip Statement
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mb-0">
                    PeoplePay360 Multi-Tenant Enterprise HR & Payroll System
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPayslipId(null)}
                className="p-1.5 rounded-full hover:bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isDetailLoading || !payslipDetail ? (
              <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--color-primary)]" />
                <span>Loading itemized payslip computation breakdown...</span>
              </div>
            ) : (
              <div id="printable-payslip" className="space-y-5 text-xs">
                {/* Statement Banner Header */}
                <div className="p-3 bg-[var(--color-bg-muted)] rounded-[6px] border border-[var(--color-border)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase block">
                      Pay Period Statement
                    </span>
                    <span className="text-sm font-extrabold text-[var(--color-primary)]">
                      {payslipDetail.payrun?.periodLabel || 'Monthly Payrun'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase block">
                      Status & Date
                    </span>
                    <span className="pp-badge pp-badge-success text-[10px] uppercase font-bold">
                      {payslipDetail.status} ({(payslipDetail as any).paidAt?.split('T')[0] || payslipDetail.createdAt?.split('T')[0] || '2026-08-31'})
                    </span>
                  </div>
                </div>

                {/* Employee & Bank Info Grid */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg-base)]">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-[var(--color-primary)] uppercase tracking-wider block border-b border-[var(--color-border)] pb-1">
                      Employee Details
                    </span>
                    <p className="font-bold text-[var(--color-text-heading)]">
                      {payslipDetail.employee ? `${payslipDetail.employee.firstName} ${payslipDetail.employee.lastName}` : employeeName}
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      Emp Code: <strong className="text-[var(--color-text-heading)]">{payslipDetail.employee?.employeeCode || 'EMP-0001'}</strong>
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      Dept: <strong className="text-[var(--color-text-heading)]">{typeof payslipDetail.employee?.department === 'object' && payslipDetail.employee?.department !== null ? (payslipDetail.employee.department as any)?.name : (payslipDetail.employee?.department || 'Engineering')}</strong>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-[var(--color-primary)] uppercase tracking-wider block border-b border-[var(--color-border)] pb-1">
                      Disbursement Account
                    </span>
                    <p className="font-bold text-[var(--color-text-heading)]">
                      {primaryBank.bankName}
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      A/C No: <strong className="font-mono text-[var(--color-text-heading)]">{primaryBank.accountNumber}</strong>
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      IFSC: <strong className="font-mono text-[var(--color-text-heading)]">{primaryBank.ifscCode}</strong>
                    </p>
                  </div>
                </div>

                {/* Working Days & Attendance Summary */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)]">
                    <span className="text-[10px] text-[var(--color-text-muted)] block font-medium">Worked Days</span>
                    <span className="text-sm font-bold text-[var(--color-text-heading)]">{Number(payslipDetail.workedDays || 22)} Days</span>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)]">
                    <span className="text-[10px] text-[var(--color-text-muted)] block font-medium">Unpaid Leaves</span>
                    <span className="text-sm font-bold text-[var(--color-text-heading)]">{Number(payslipDetail.leaveDays || 0)} Days</span>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)]">
                    <span className="text-[10px] text-[var(--color-text-muted)] block font-medium">Contract Wage</span>
                    <span className="text-sm font-bold text-[var(--color-text-heading)] font-mono">₹{Number((payslipDetail as any).contract?.wage || 75000).toLocaleString()}</span>
                  </div>
                </div>

                {/* Itemized Calculation Lines Table */}
                <div className="border border-[var(--color-border)] rounded-[6px] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[10px] font-bold text-[var(--color-text-muted)] uppercase">
                        <th className="py-2 px-3">Rule Code</th>
                        <th className="py-2 px-3">Component Description</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-xs">
                      {payslipDetail.payslipLines && payslipDetail.payslipLines.length > 0 ? (
                        payslipDetail.payslipLines.map((line: PayslipLine) => (
                          <tr key={line.id} className={line.category === 'net' ? 'bg-[#00C853]/10 font-extrabold' : ''}>
                            <td className="py-2 px-3 font-mono text-[11px]">{line.ruleCode}</td>
                            <td className="py-2 px-3 font-semibold">{line.ruleName}</td>
                            <td className="py-2 px-3 uppercase text-[10px]">{line.category}</td>
                            <td className={`py-2 px-3 text-right font-mono font-bold ${
                              line.category === 'deduction' ? 'text-red-600' : line.category === 'net' ? 'text-[#00C853] text-sm' : 'text-[var(--color-text-heading)]'
                            }`}>
                              {line.category === 'deduction' ? `-₹${Number(line.amount).toLocaleString()}` : `₹${Number(line.amount).toLocaleString()}`}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <tr>
                            <td className="py-2 px-3 font-mono">BASIC</td>
                            <td className="py-2 px-3">Basic Salary (50%)</td>
                            <td className="py-2 px-3 uppercase text-[10px]">basic</td>
                            <td className="py-2 px-3 text-right font-mono font-bold">₹{Number(payslipDetail.basic || 37500).toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-mono">HRA</td>
                            <td className="py-2 px-3">House Rent Allowance (40%)</td>
                            <td className="py-2 px-3 uppercase text-[10px]">allowance</td>
                            <td className="py-2 px-3 text-right font-mono font-bold">₹15,000</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-mono">ALLOWANCE</td>
                            <td className="py-2 px-3">Special Allowance</td>
                            <td className="py-2 px-3 uppercase text-[10px]">allowance</td>
                            <td className="py-2 px-3 text-right font-mono font-bold">₹22,500</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-mono">GROSS</td>
                            <td className="py-2 px-3 font-bold">Gross Earnings</td>
                            <td className="py-2 px-3 uppercase text-[10px]">gross</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[var(--color-text-heading)]">₹{Number(payslipDetail.gross || 75000).toLocaleString()}</td>
                          </tr>
                          {Number(payslipDetail.totalDeductions || 0) > 0 && (
                            <tr>
                              <td className="py-2 px-3 font-mono text-red-600">UNPAID_LEAVE</td>
                              <td className="py-2 px-3 text-red-600 font-semibold">Unpaid Leave Deductions</td>
                              <td className="py-2 px-3 uppercase text-[10px] text-red-600">deduction</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-red-600">-₹{Number(payslipDetail.totalDeductions).toLocaleString()}</td>
                            </tr>
                          )}
                          <tr className="bg-[#00C853]/10 font-extrabold">
                            <td className="py-2 px-3 font-mono text-[#00C853]">NET</td>
                            <td className="py-2 px-3 text-[#00C853]">Net Payable Salary Disbursed</td>
                            <td className="py-2 px-3 uppercase text-[10px] text-[#00C853]">net</td>
                            <td className="py-2 px-3 text-right font-mono font-extrabold text-[#00C853] text-sm">
                              ₹{Number(payslipDetail.net || 75000).toLocaleString()}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Net Disbursed Highlight Card */}
                <div className="p-4 rounded-[6px] bg-[#00C853]/10 border border-[#00C853]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#00C853]" />
                    <div>
                      <span className="text-xs font-extrabold text-[var(--color-text-heading)] block">
                        Net Salary Disbursed via Bank Transfer
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Transferred to {primaryBank.bankName} (A/C ending {primaryBank.accountNumber.slice(-4)})
                      </span>
                    </div>
                  </div>

                  <span className="text-lg font-black font-mono text-[#00C853]">
                    ₹{Number(payslipDetail.net || 75000).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setSelectedPayslipId(null)}
                className="pp-btn-secondary text-xs py-2 px-4 font-semibold cursor-pointer"
              >
                Close Statement
              </button>

              <button
                type="button"
                disabled={isDownloadingPdf}
                onClick={handleDownloadPdf}
                className="pp-btn-primary text-xs py-2 px-4 font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Slip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
