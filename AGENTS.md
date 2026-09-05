# AGENTS.md — PeoplePay360 AI Agent Guidelines & Project Map

## Project Overview
**PeoplePay360** is a multi-tenant SaaS ERP platform built for HR management, attendance tracking, contract administration, time off/leave management, and automated multi-tenant payroll calculation.

---

## Repository Structure

```txt
odoo-peoplepay-tortoise-499/
├── AGENTS.md                  # AI agent guidelines & architecture documentation
├── package.json               # Root pnpm scripts & workspace configuration
├── pnpm-workspace.yaml        # PNPM workspace definition
├── backend/                   # Node.js + Express REST API (TypeScript)
│   ├── .env                   # Environment variables (Git-ignored)
│   ├── .env.example           # Example environment template
│   ├── package.json           # Backend package configuration
│   ├── prisma/
│   │   └── schema.prisma      # PostgreSQL database schema (Prisma ORM)
│   └── src/
│       ├── server.ts          # Server entry point
│       ├── app.ts             # Express application setup
│       ├── core/              # Core modules (config, logger, middlewares, prisma client)
│       └── modules/           # Feature modules (auth, employees, payroll, etc.)
└── frontend/                  # React + Vite UI application
    ├── package.json           # Frontend package configuration
    └── src/                   # React components & UI logic
```

---

## Development & Execution Scripts

From the root directory:
- **`pnpm start`**: Runs the backend server in dev watch mode.
- **`pnpm start:all`**: Runs both backend and frontend concurrently in development mode.
- **`pnpm start:backend`**: Starts backend dev server.
- **`pnpm start:frontend`**: Starts frontend Vite dev server.
- **`pnpm build`**: Builds all workspace packages (`backend` and `frontend`).

From the `backend/` directory:
- **`pnpm run prisma:generate`**: Generates Prisma Client.
- **`pnpm run prisma:push`**: Pushes schema changes directly to PostgreSQL.
- **`pnpm run prisma:migrate`**: Runs Prisma migration dev workflow.

---

## Database Architecture & Prisma Standards

- **Database Engine**: PostgreSQL.
- **ORM**: Prisma.
- **Schema Location**: `backend/prisma/schema.prisma`.
- **Multi-Tenant Design**: `company_id` foreign key ties tenant-scoped entities back to `Company`.

### Database Domains (19 Models)
1. **Tenant (Company)**: `Company`
2. **Identity & Access**: `User`
3. **Organisation Structure**: `Department`, `JobPosition`
4. **Employee Master**: `Employee`, `EmployeeBankAccount`
5. **Contracts**: `Contract`
6. **Working Schedules**: `WorkingSchedule`, `ScheduleLine`
7. **Attendance**: `Attendance`
8. **Time Off**: `TimeOffType`, `TimeOffAllocation`, `TimeOffRequest`
9. **Salary Configuration**: `SalaryStructure`, `SalaryRule`, `StructureRule`
10. **Payroll**: `Payrun`, `PayrunEmployee`, `Payslip`, `PayslipLine`, `PayrollWarning`

### Schema Formatting Rules
- Model names use **PascalCase** (`Company`, `EmployeeBankAccount`).
- Database table names use **snake_case** via `@@map("table_name")`.
- Model field names use **camelCase** mapping to **snake_case** columns via `@map("col_name")`.
- Primary keys are UUIDs (`@id @default(uuid()) @db.Uuid`).
- Timestamps use Timestamptz (`@db.Timestamptz`).
- Model documentation uses triple-slash doc comments (`///`).
- Do not include excessive decorative banner headers (`// ───────`) in schema files.

---

## Guidelines for AI Coding Agents

1. **Environment Integrity**: Always preserve `.env` and `.env.example` configurations.
2. **Schema Safety**: When modifying `schema.prisma`, always run `npx prisma validate` and `npx prisma generate` to ensure client types are in sync.
3. **TypeScript Strictly Typed**: Avoid `any` types; use Zod validation for request body and environment variables.
4. **Verification**: Always execute `npm run build` or `pnpm build` in target directories after making changes to verify there are no compilation errors.
