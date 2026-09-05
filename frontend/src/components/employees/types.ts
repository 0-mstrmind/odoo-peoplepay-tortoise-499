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

export const INITIAL_EMPLOYEES: EmployeeItem[] = [
  {
    id: 'emp-1',
    firstName: 'Aarav',
    lastName: 'Mehta',
    employeeCode: 'EMP-001',
    email: 'aarav.mehta@peoplepay360.internal',
    phone: '+91 98201 23456',
    department: 'Finance',
    jobPosition: 'Payroll Specialist',
    status: 'active',
    avatarInitials: 'AM',
    avatarColor: '#714867',
    location: 'Mumbai HQ',
    joinedDate: '2023-04-15',
  },
  {
    id: 'emp-2',
    firstName: 'Sara',
    lastName: 'Khan',
    employeeCode: 'EMP-002',
    email: 'sara.khan@peoplepay360.internal',
    phone: '+91 98202 34567',
    department: 'HR',
    jobPosition: 'HR Officer',
    status: 'active',
    avatarInitials: 'SK',
    avatarColor: '#5d3a55',
    location: 'Bengaluru Hub',
    joinedDate: '2023-06-01',
  },
  {
    id: 'emp-3',
    firstName: 'John',
    lastName: 'Dsouza',
    employeeCode: 'EMP-003',
    email: 'john.dsouza@peoplepay360.internal',
    phone: '+91 98203 45678',
    department: 'Engineering',
    jobPosition: 'Developer',
    status: 'active',
    avatarInitials: 'JD',
    avatarColor: '#2b4c7e',
    location: 'Pune Tech Center',
    joinedDate: '2022-11-10',
  },
  {
    id: 'emp-4',
    firstName: 'Neha',
    lastName: 'Patel',
    employeeCode: 'EMP-004',
    email: 'neha.patel@peoplepay360.internal',
    phone: '+91 98204 56789',
    department: 'HR',
    jobPosition: 'Recruiter',
    status: 'active',
    avatarInitials: 'NP',
    avatarColor: '#714867',
    location: 'Mumbai HQ',
    joinedDate: '2024-01-20',
  },
  {
    id: 'emp-5',
    firstName: 'Priya',
    lastName: 'Sharma',
    employeeCode: 'EMP-005',
    email: 'priya.sharma@peoplepay360.internal',
    phone: '+91 98205 67890',
    department: 'Finance',
    jobPosition: 'Senior Accountant',
    status: 'active',
    avatarInitials: 'PS',
    avatarColor: '#603055',
    location: 'Mumbai HQ',
    joinedDate: '2021-08-12',
  },
  {
    id: 'emp-6',
    firstName: 'Vikram',
    lastName: 'Malhotra',
    employeeCode: 'EMP-006',
    email: 'vikram.malhotra@peoplepay360.internal',
    phone: '+91 98206 78901',
    department: 'Engineering',
    jobPosition: 'Tech Lead',
    status: 'on_leave',
    avatarInitials: 'VM',
    avatarColor: '#34495e',
    location: 'Bengaluru Hub',
    joinedDate: '2020-03-01',
  },
]