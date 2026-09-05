import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi, type ContractListItem, type ContractStatus } from "../lib/api";
import { ContractFormModal } from "./ContractFormModal";
import { Plus, Search, Loader2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function ContractsList() {
  const api = useApi();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => api.getContracts(),
  });

  const contracts = data?.contracts || [];

  const filteredContracts = contracts.filter((contract: ContractListItem) => {
    const employeeName = contract.employee
      ? `${contract.employee.firstName} ${contract.employee.lastName}`.toLowerCase()
      : "";
    const matchesSearch =
      contract.contractReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employeeName.includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: ContractStatus) => {
    const map: Record<string, string> = {
      active: "bg-[#00C853]/15 text-[#00C853] border-[#00C853]/30",
      draft: "bg-[#FFB300]/15 text-[#B27B00] border-[#FFB300]/30",
      expired: "bg-[#FF1744]/15 text-[#FF1744] border-[#FF1744]/30",
      terminated: "bg-gray-200 text-gray-700 border-gray-300",
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
          map[status] || map.draft
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search reference or employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm rounded-[4px] border-[rgba(0,0,0,0.12)]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-[4px] text-gray-700 focus:outline-none focus:border-[#714B67]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#714B67] hover:bg-[#5e3e56] text-white h-9 px-4 rounded-[4px] text-sm flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Contract
        </Button>
      </div>

      {/* Content Table */}
      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-md overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#714B67]" />
            <p className="text-sm">Loading contracts from PeoplePay360 database...</p>
          </div>
        ) : isError ? (
          <div className="p-10 flex flex-col items-center justify-center text-center text-red-600 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-medium">Failed to load contracts.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-2">
              Retry
            </Button>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-sm">No contracts found matching the criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8F9FA] border-b border-[rgba(0,0,0,0.08)] text-[12px] uppercase text-gray-500 font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4">Wage</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.06)]">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-[#F8F9FA]/70 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#1A1F36]">
                    {contract.contractReference}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {contract.employee
                      ? `${contract.employee.firstName} ${contract.employee.lastName} (${contract.employee.employeeCode})`
                      : "Unassigned"}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(contract.startDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "Permanent"}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#1A1F36]">
                    ₹{Number(contract.wage).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600 capitalize">
                    {contract.payFrequency.replace("_", "-")}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(contract.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ContractFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
