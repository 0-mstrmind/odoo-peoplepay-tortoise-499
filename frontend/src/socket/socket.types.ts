/**
 * Socket Types & Event Definitions for Frontend
 * Synchronized with backend Socket.io types
 */

export interface SocketNotificationPayload {
  id?: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  category?: 'timeoff' | 'attendance' | 'payroll' | 'employee' | 'system'
  metadata?: unknown
  timestamp?: string
  read?: boolean
}

export interface TimeOffEventPayload {
  requestId: string
  employeeId: string
  employeeName?: string
  timeOffTypeId: string
  timeOffTypeName?: string
  startDate: string | Date
  endDate: string | Date
  duration: number | string
  status: 'pending' | 'approved' | 'refused' | 'cancelled' | 'draft'
  actionBy?: {
    id?: string
    email?: string
    role?: string
  } | null
  refusalReason?: string | null
  timestamp: string
}

export interface AttendanceEventPayload {
  attendanceId: string
  employeeId: string
  employeeName?: string
  attendanceDate: string | Date
  checkIn?: string | Date | null
  checkOut?: string | Date | null
  workedHours?: number | string | null
  expectedHours?: number | string | null
  overtimeHours?: number | string | null
  status: string
  isCorrected?: boolean
  correctionReason?: string | null
  correctedBy?: string | null
  actionBy?: {
    id?: string
    email?: string
    role?: string
  } | null
  timestamp: string
}

export interface PayrunEventPayload {
  payrunId: string
  name: string
  periodLabel?: string | null
  periodStart: string | Date
  periodEnd: string | Date
  status: string
  previousStatus?: string
  totalGross?: number | string
  totalDeductions?: number | string
  totalNet?: number | string
  totalEmployees?: number
  warningsCount?: number
  actionBy?: {
    id?: string
    email?: string
    role?: string
  } | null
  timestamp: string
}

export interface PayslipAvailablePayload {
  payslipId: string
  payrunId: string
  employeeId: string
  periodLabel?: string | null
  periodStart: string | Date
  periodEnd: string | Date
  netSalary: number | string
  status: string
  pdfUrl?: string | null
  timestamp: string
}

export interface DashboardMetricsInvalidatedPayload {
  reason: string
  timestamp: string
  metadata?: unknown
}

export interface ServerCheckPayload {
  timestamp: string
  message: string
  payload?: unknown
}

export interface ServerToClientEvents {
  // System / Heartbeat
  'server:check': (data: ServerCheckPayload) => void
  'notification': (data: SocketNotificationPayload) => void

  // Time Off Events
  'timeoff:request:created': (data: TimeOffEventPayload) => void
  'timeoff:request:approved': (data: TimeOffEventPayload) => void
  'timeoff:request:refused': (data: TimeOffEventPayload) => void
  'timeoff:request:cancelled': (data: TimeOffEventPayload) => void
  'timeoff:request:updated': (data: TimeOffEventPayload) => void

  // Attendance Events
  'attendance:checkin': (data: AttendanceEventPayload) => void
  'attendance:checkout': (data: AttendanceEventPayload) => void
  'attendance:request:created': (data: AttendanceEventPayload) => void
  'attendance:request:approved': (data: AttendanceEventPayload) => void
  'attendance:request:refused': (data: AttendanceEventPayload) => void
  'attendance:updated': (data: AttendanceEventPayload) => void

  // Payroll & Payrun Events
  'payroll:payrun:status_changed': (data: PayrunEventPayload) => void
  'payroll:payrun:computed': (data: PayrunEventPayload) => void
  'payroll:payrun:validated': (data: PayrunEventPayload) => void
  'payroll:payrun:paid': (data: PayrunEventPayload) => void
  'payroll:payslip:available': (data: PayslipAvailablePayload) => void

  // Dashboard Live Metric Invalidation
  'dashboard:metrics:invalidated': (data: DashboardMetricsInvalidatedPayload) => void

  // Fallback
  [event: string]: (...args: any[]) => void
}

export interface ClientToServerEvents {
  'client:check': (data: { message?: string }, callback?: (response: unknown) => void) => void
  'timeoff:subscribe': (data: { employeeId?: string }, callback?: (response: unknown) => void) => void
  'attendance:subscribe': (data: { employeeId?: string }, callback?: (response: unknown) => void) => void
  'payroll:subscribe': (data: { payrunId?: string }, callback?: (response: unknown) => void) => void
  [event: string]: (...args: any[]) => void
}
