/**
 * Query key factory — centralised, type-safe query keys
 *
 * Pattern:  queryKeys.<domain>.<scope>(...args)
 *
 * Benefits:
 *  - Invalidate an entire domain:  queryClient.invalidateQueries({ queryKey: queryKeys.employees.all })
 *  - Invalidate a single record:   queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) })
 *  - Fully type-safe — TypeScript will error on typos
 */

export const queryKeys = {
  // ── Employees ─────────────────────────────────────────────────────────────
  employees: {
    all:    ['employees'] as const,
    list:   (companyId: string) => ['employees', companyId, 'list'] as const,
    detail: (id: string)        => ['employees', id, 'detail'] as const,
    profile: ()                 => ['employees', 'me'] as const,
  },

  // ── Payroll ────────────────────────────────────────────────────────────────
  payroll: {
    all:      ['payroll'] as const,
    runs:     (companyId: string)           => ['payroll', companyId, 'runs'] as const,
    run:      (id: string)                  => ['payroll', 'run', id] as const,
    payslips: (runId: string)               => ['payroll', 'run', runId, 'payslips'] as const,
    payslip:  (id: string)                  => ['payroll', 'payslip', id] as const,
  },

  // ── Time Off ───────────────────────────────────────────────────────────────
  timeoff: {
    all:         ['timeoff'] as const,
    requests:    (companyId: string) => ['timeoff', companyId, 'requests'] as const,
    allocations: (employeeId: string) => ['timeoff', 'allocations', employeeId] as const,
    types:       (companyId: string) => ['timeoff', companyId, 'types'] as const,
  },

  // ── Attendance ─────────────────────────────────────────────────────────────
  attendance: {
    all:          ['attendance'] as const,
    records:      (employeeId: string, month: string) => ['attendance', employeeId, month] as const,
    todaySummary: (params?: Record<string, unknown>) => ['attendance', 'today-summary', params] as const,
    list:         (params?: Record<string, unknown>) => ['attendance', 'list', params] as const,
  },

  // ── Contracts ──────────────────────────────────────────────────────────────
  contracts: {
    all:    ['contracts'] as const,
    list:   (companyId: string)  => ['contracts', companyId, 'list'] as const,
    detail: (id: string)          => ['contracts', id] as const,
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: {
    overview: (companyId: string, params: Record<string, unknown>) =>
      ['dashboard', companyId, 'overview', params] as const,
  },

  // ── Salary ─────────────────────────────────────────────────────────────────
  salary: {
    structures: (companyId: string) => ['salary', companyId, 'structures'] as const,
    structure:  (id: string)        => ['salary', 'structure', id] as const,
    rules:      (structureId: string) => ['salary', 'rules', structureId] as const,
  },

  // ── Company / Tenant ───────────────────────────────────────────────────────
  company: {
    detail: (id: string) => ['company', id] as const,
  },
} as const