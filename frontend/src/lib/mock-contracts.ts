export interface Contract {
  id: string;
  reference: string;
  employee: string;
  startDate: string;
  endDate: string;
  wage: number;
  frequency: string;
  status: "Active" | "Draft" | "Expired";
}

export const EMPLOYEES = [
  "Amelia Richardson",
  "Daniel Okafor",
  "Priya Sharma",
  "Marcus Webb",
  "Sofia Delgado",
  "James Chen",
];

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: "c-1",
    reference: "CTR-001",
    employee: "Amelia Richardson",
    startDate: "2025-01-15",
    endDate: "2026-01-14",
    wage: 7200,
    frequency: "Monthly",
    status: "Active",
  },
  {
    id: "c-2",
    reference: "CTR-002",
    employee: "Daniel Okafor",
    startDate: "2025-06-01",
    endDate: "—",
    wage: 3850,
    frequency: "Bi-Weekly",
    status: "Active",
  },
  {
    id: "c-3",
    reference: "CTR-003",
    employee: "Priya Sharma",
    startDate: "2026-09-20",
    endDate: "2027-09-19",
    wage: 9100,
    frequency: "Monthly",
    status: "Draft",
  },
  {
    id: "c-4",
    reference: "CTR-004",
    employee: "Marcus Webb",
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    wage: 1600,
    frequency: "Weekly",
    status: "Expired",
  },
];
