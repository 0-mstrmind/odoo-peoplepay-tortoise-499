import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import './App.css'

function AuthHeader() {
  const { user } = useUser()

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#1a1a24', borderRadius: '8px', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>PeoplePay360</h2>
        <span style={{ fontSize: '0.85rem', background: '#334155', color: '#94a3b8', padding: '2px 8px', borderRadius: '4px' }}>HR & Payroll</span>
      </div>

      <div>
        <SignedOut>
          <SignInButton mode="modal">
            <button style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              Sign In with Clerk
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
              Welcome, <strong>{user?.firstName || user?.emailAddresses[0]?.emailAddress}</strong>
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </div>
    </header>
  )
}

function App() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <AuthHeader />

      <SignedIn>
        <div style={{ padding: '2rem', background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }}>
          <h3>PeoplePay360 ERP Control Center</h3>
          <p>Authentication handled by Clerk & User RBAC permissions managed in PostgreSQL database.</p>
          <ul>
            <li><strong>Authentication:</strong> Active via Clerk</li>
            <li><strong>Role-Based Access Control (RBAC):</strong> Integrated</li>
            <li><strong>Module Map:</strong> Employee → Contract → Working Schedule → Attendance/Time Off → Payroll → Payslip</li>
          </ul>
        </div>
      </SignedIn>

      <SignedOut>
        <div style={{ padding: '3rem', textAlign: 'center', background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#94a3b8' }}>
          <h3>Welcome to PeoplePay360</h3>
          <p>Please sign in using Clerk to access your HR, Attendance, and Payroll workspace.</p>
          <SignInButton mode="modal">
            <button style={{ padding: '10px 20px', marginTop: '1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              Get Started
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </div>
  )
}

export default App
