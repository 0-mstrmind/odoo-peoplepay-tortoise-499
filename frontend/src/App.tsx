import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import './App.css'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { EmployeesPage } from './components/employees/EmployeesPage'
import { ContractsView } from './components/contracts/ContractsView'
import { AttendanceView } from './components/attendance/AttendanceView'
import { TimeOffView } from './components/timeoff/TimeOffView'
import { PayrollView } from './components/payroll/PayrollView'
import { PayoutHistoryView } from './components/payroll/PayoutHistoryView'
import { UserManagementView } from './components/auth/UserManagementView'
import { AuthPage } from './components/auth/AuthPage'
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute'
import { SocketProvider } from './socket/SocketProvider'

function App() {
  return (
    <SocketProvider>
      <Routes>
        {/* Public Authentication Route */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route path="/auth" element={<Navigate to="/login" replace />} />

        {/* Protected Application Workspace under AppLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Employee Directory: HR Manager, Payroll Users/Managers, Admins */}
          <Route
            path="employees"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'admin',
                  'super_admin',
                  'hr_manager',
                  'hr_payroll_user',
                  'payroll_user',
                  'hr_payroll_manager',
                  'payroll_manager',
                ]}
              >
                <EmployeesPage />
              </ProtectedRoute>
            }
          />

          {/* Contracts Administration: HR & Payroll Personnel */}
          <Route
            path="contracts"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'admin',
                  'super_admin',
                  'hr_manager',
                  'hr_payroll_user',
                  'payroll_user',
                  'hr_payroll_manager',
                  'payroll_manager',
                ]}
              >
                <ContractsView />
              </ProtectedRoute>
            }
          />

          {/* Attendance: All authenticated users (Employees check-in/view own, HR manages) */}
          <Route path="attendance" element={<AttendanceView />} />

          {/* Time Off: All authenticated users (Employees submit, HR approves) */}
          <Route path="time-off" element={<TimeOffView />} />
          <Route path="timeoff" element={<Navigate to="/time-off" replace />} />

          {/* Payout & Payslip History: All authenticated users */}
          <Route path="payouts" element={<PayoutHistoryView />} />
          <Route path="payout-history" element={<Navigate to="/payouts" replace />} />

          {/* Payroll Engine: HR Payroll User, HR Payroll Manager, and Admin Only */}
          <Route
            path="payroll"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'admin',
                  'super_admin',
                  'hr_payroll_user',
                  'payroll_user',
                  'hr_payroll_manager',
                  'payroll_manager',
                ]}
              >
                <PayrollView />
              </ProtectedRoute>
            }
          />

          {/* User Management: Administrators & HR Managers */}
          <Route
            path="user-management"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'hr_manager', 'hr_payroll_manager']}>
                <UserManagementView />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all: Redirect unmatched routes to /dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toaster position="top-right" richColors />
    </SocketProvider>
  )
}

export default App
