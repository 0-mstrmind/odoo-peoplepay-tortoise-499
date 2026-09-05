import { useAuth } from "@clerk/clerk-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export interface ApiErrorDetail {
  path?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ApiErrorDetail[];
}

export type UserRole = "admin" | "hr_manager" | "hr_payroll_manager" | "hr_payroll_user" | "employee";
export type ContractStatus = "draft" | "active" | "expired" | "terminated";
export type PayFrequency = "monthly" | "bi_weekly" | "weekly";

export interface ContractListItem {
  id: string;
  companyId: string;
  employeeId: string;
  contractReference: string;
  startDate: string;
  endDate: string | null;
  departmentId: string | null;
  jobPositionId: string | null;
  scheduleId: string | null;
  wage: string | number;
  currency: string;
  payFrequency: PayFrequency;
  salaryStructureId: string | null;
  status: ContractStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
}

export interface GetContractsResponse {
  success: true;
  message: string;
  contracts: ContractListItem[];
}

export interface CreateContractRequest {
  employeeId: string;
  contractReference: string;
  startDate: string;
  endDate?: string | null;
  departmentId?: string;
  jobPositionId?: string;
  scheduleId?: string;
  wage: number;
  currency?: string;
  payFrequency: PayFrequency;
  salaryStructureId?: string;
  status?: ContractStatus;
  notes?: string;
}

export interface CreateContractResponse {
  success: true;
  message: string;
  contract: ContractListItem;
}

export function extractErrorMessage(error: any): string {
  if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors.map((e: ApiErrorDetail) => (e.path ? `${e.path}: ` : "") + e.message).join(", ");
  }
  if (error?.message) return error.message;
  return "An unexpected error occurred.";
}

export function useApi() {
  const { getToken } = useAuth();

  const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = await getToken();
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw data as ApiErrorResponse;
    }
    return data as T;
  };

  return {
    getContracts: (employeeId?: string) =>
      request<GetContractsResponse>(`/contracts${employeeId ? `?employeeId=${employeeId}` : ""}`),
    createContract: (contract: CreateContractRequest) =>
      request<CreateContractResponse>("/contracts", {
        method: "POST",
        body: JSON.stringify(contract),
      }),
    updateContract: (id: string, contract: Partial<CreateContractRequest>) =>
      request<{ success: true; message: string; contract: ContractListItem }>(`/contracts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(contract),
      }),
  };
}
