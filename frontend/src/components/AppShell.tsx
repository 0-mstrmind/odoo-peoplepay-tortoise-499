import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = ["Employees", "Contracts", "Attendance", "Time Off", "Payroll"];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed top navigation — Odoo style */}
      <header className="fixed inset-x-0 top-0 z-40 h-12 border-b border-border bg-card">
        <div className="flex h-full items-center gap-6 px-4">
          {/* Brand */}
          <a href="/" className="text-[15px] font-bold tracking-tight text-primary">
            PeoplePay360
          </a>

          {/* Horizontal nav */}
          <nav className="flex h-full items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item === "Contracts";
              return (
                <button
                  key={item}
                  className={cn(
                    "relative flex h-full items-center px-3 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item}
                  {active && (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Search"
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Search size={17} />
            </button>
            <button
              aria-label="Notifications"
              className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger" />
            </button>
            <div className="ml-1 flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              AR
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="pt-12">{children}</main>
    </div>
  );
}
