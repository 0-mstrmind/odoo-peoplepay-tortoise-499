export type EmployeeStatus = 'active' | 'inactive' | 'on_leave'

export interface EmployeeItem {
  id: string
  firstName: string
  lastName: string
  employeeCode: string
  email: string
  phone?: string
  department: string
  jobPosition: string
  status: EmployeeStatus
  avatarInitials: string
  avatarColor?: string
  location?: string
  managerName?: string
  joinedDate?: string
}