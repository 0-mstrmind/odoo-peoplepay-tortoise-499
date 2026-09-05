import React, { useState, useMemo } from 'react'
import { Search, LayoutGrid, List, Plus, Users, Filter, X } from 'lucide-react'
import { EmployeeCard } from './EmployeeCard'
import { EmployeeTableView } from './EmployeeTableView'
import { NewEmployeeModal } from './NewEmployeeModal'
import { EmployeeDetailDrawer } from './EmployeeDetailDrawer'
import { type EmployeeItem } from './types'
import { useEmployees } from '@/hooks/use-api'

export const EmployeesPage: React.FC = () => {
  // View mode state — Default view is 'kanban' as requested in the wireframe
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  // Search query state
  const [searchQuery, setSearchQuery] = useState('')

  // Department filter state
  const [selectedDept, setSelectedDept] = useState<string>('all')

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeItem | null>(null)

  // TanStack Query integration with backend API
  const { data: apiResponse, isLoading: isApiLoading } = useEmployees({
    search: searchQuery || undefined,
  })

  // Sync strictly with live API data from backend
  const displayEmployees = useMemo(() => {
    const apiItems = (apiResponse as any)?.data?.items || (apiResponse as any)?.items || (Array.isArray(apiResponse) ? apiResponse : [])
    if (Array.isArray(apiItems) && apiItems.length > 0) {
      const mapped: EmployeeItem[] = apiItems.map((emp: any) => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        employeeCode: emp.employeeCode || `EMP-${emp.id.slice(0, 4)}`,
        email: emp.email,
        phone: emp.phone,
        department: emp.department?.name || emp.department || 'General',
        jobPosition: emp.jobPosition?.title || emp.jobPosition || 'Employee',
        status: (emp.status as any) || 'active',
        avatarInitials: `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase() || 'EM',
        location: emp.location || 'HQ',
        joinedDate: emp.hireDate || emp.createdAt?.split('T')[0],
      }))
      return mapped
    }

    return []
  }, [apiResponse])

  // Filtered employees based on search query and department
  const filteredEmployees = useMemo(() => {
    return displayEmployees.filter((emp) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.jobPosition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDept =
        selectedDept === 'all' || emp.department.toLowerCase() === selectedDept.toLowerCase()

      return matchesSearch && matchesDept
    })
  }, [displayEmployees, searchQuery, selectedDept])

  const departments = useMemo(() => {
    const set = new Set<string>()
    displayEmployees.forEach((e) => {
      if (e.department) set.add(e.department)
    })
    return Array.from(set)
  }, [displayEmployees])

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-body)] font-sans antialiased">
      {/* Main Container — without Navbar as strictly requested */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Header Section (matching wireframe) */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-heading)] leading-none mb-1">
            Employees
          </h1>
          <p className="text-sm font-normal text-[var(--color-text-muted)]">
            Default view: Kanban
          </p>
        </div>

        {/* Toolbar Section (matching wireframe) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Left Controls: NEW Button + Search Input */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* "NEW" Button with brand purple (#714867) and 4px rounding */}
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="pp-btn-primary h-10 px-5 text-sm font-bold tracking-wider rounded-[4px] shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>NEW</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className="pp-input h-10 pl-9 pr-8 text-sm rounded-[4px] placeholder:text-[var(--color-text-muted)] w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: View Switcher (Kanban vs List) */}
          <div className="flex items-center self-end sm:self-auto">
            <div className="inline-flex rounded-[4px] border border-[var(--color-border)] p-0.5 bg-[var(--color-bg-surface)] shadow-2xs">
              {/* Kanban Toggle */}
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[3px] transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                }`}
                title="Kanban View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>

              {/* List Toggle */}
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[3px] transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)]'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Tags & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-2 border-b border-[var(--color-border)]/50 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[var(--color-text-muted)] flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              Department:
            </span>
            <button
              type="button"
              onClick={() => setSelectedDept('all')}
              className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                selectedDept === 'all'
                  ? 'bg-[var(--color-primary)] text-white font-semibold'
                  : 'bg-[var(--color-bg-muted)] text-[var(--color-text-body)] hover:bg-[var(--color-border)]'
              }`}
            >
              All
            </button>
            {departments.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                  selectedDept === dept
                    ? 'bg-[var(--color-primary)] text-white font-semibold'
                    : 'bg-[var(--color-bg-muted)] text-[var(--color-text-body)] hover:bg-[var(--color-border)]'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          <div className="text-[var(--color-text-muted)] font-medium">
            Showing <span className="font-bold text-[var(--color-text-heading)]">{filteredEmployees.length}</span> of {displayEmployees.length} employees
          </div>
        </div>

        {/* Content View: Kanban vs List */}
        {isApiLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-32 rounded-[8px] bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-5"
              />
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[var(--color-bg-surface)] rounded-[8px] border border-dashed border-[var(--color-border)]">
            <Users className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[var(--color-text-heading)] mb-1">
              No employees found
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto mb-4">
              {searchQuery
                ? `No employee matches the query "${searchQuery}".`
                : 'Get started by adding your first team member.'}
            </p>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="pp-btn-secondary text-xs py-1.5 px-3 rounded-[4px] cursor-pointer"
              >
                Clear Search
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="pp-btn-primary text-xs py-1.5 px-4 rounded-[4px] cursor-pointer"
              >
                Add Employee
              </button>
            )}
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Grid (2 columns on medium screens, matching wireframe layout) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {filteredEmployees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onClick={(e) => setSelectedEmployee(e)}
              />
            ))}
          </div>
        ) : (
          /* Table List View */
          <EmployeeTableView
            employees={filteredEmployees}
            onSelectEmployee={(e) => setSelectedEmployee(e)}
          />
        )}
      </main>

      {/* New Employee Modal */}
      <NewEmployeeModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onAddEmployee={() => {}}
      />

      {/* Employee Detail Drawer */}
      <EmployeeDetailDrawer
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  )
}