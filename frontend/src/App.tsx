import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import './App.css'
import { Navbar } from './components/layout/Navbar'
import { EmployeesPage } from './components/employees/EmployeesPage'

function App() {
  const [activeNav, setActiveNav] = useState('Employees')

  const handleNavigate = (item: string) => {
    setActiveNav(item.split(' / ')[0])
    if (item !== 'Employees') {
      toast.info(`Navigated to ${item}`, {
        description: 'Module views are linked to PeoplePay360 ERP.',
        duration: 2500,
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-base)]">
      {/* Navbar without HR logo as strictly requested */}
      <Navbar activeItem={activeNav} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <div className="flex-1">
        <EmployeesPage />
      </div>

      <Toaster position="top-right" richColors />
    </div>
  )
}

export default App


