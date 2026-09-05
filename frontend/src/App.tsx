import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] p-8">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-[var(--color-text-heading)]">PeoplePay360</h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Odoo Design Token System — Tailwind v4 + shadcn/ui
          </p>
        </div>

        {/* Buttons */}
        <div className="pp-card">
          <h2 className="mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <button className="pp-btn-primary">Primary</button>
            <button className="pp-btn-secondary">Secondary</button>
            <button className="pp-btn-ghost">Ghost</button>
            <button className="pp-btn-primary" disabled>Disabled</button>
          </div>
        </div>

        {/* Badges */}
        <div className="pp-card">
          <h2 className="mb-4">Status Badges</h2>
          <div className="flex flex-wrap gap-2">
            <span className="pp-badge pp-badge-success">Approved</span>
            <span className="pp-badge pp-badge-warning">Pending</span>
            <span className="pp-badge pp-badge-danger">Rejected</span>
            <span className="pp-badge pp-badge-neutral">Draft</span>
          </div>
        </div>

        {/* Input */}
        <div className="pp-card">
          <h2 className="mb-4">Form Controls</h2>
          <div className="space-y-3">
            <input className="pp-input" placeholder="Employee name..." />
            <input className="pp-input" placeholder="Search payroll..." />
          </div>
        </div>

        {/* Table */}
        <div className="pp-card-flat overflow-x-auto">
          <h2 className="mb-4">Data Table</h2>
          <table className="pp-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Net Pay</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Alice Johnson</td>
                <td>Engineering</td>
                <td>₹85,000</td>
                <td><span className="pp-badge pp-badge-success">Paid</span></td>
              </tr>
              <tr>
                <td>Bob Smith</td>
                <td>HR</td>
                <td>₹62,000</td>
                <td><span className="pp-badge pp-badge-warning">Pending</span></td>
              </tr>
              <tr>
                <td>Carol White</td>
                <td>Finance</td>
                <td>₹74,500</td>
                <td><span className="pp-badge pp-badge-danger">On Hold</span></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

export default App

