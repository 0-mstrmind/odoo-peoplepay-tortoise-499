import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useApi,
  type CreateContractRequest,
  extractErrorMessage,
  type ContractStatus,
  type PayFrequency,
} from "../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { AlertCircle, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ContractFormModal({ isOpen, onClose }: Props) {
  const api = useApi();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateContractRequest>({
    employeeId: "",
    contractReference: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    wage: 50000,
    currency: "INR",
    payFrequency: "monthly" as PayFrequency,
    status: "draft" as ContractStatus,
    notes: "",
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: CreateContractRequest) => api.createContract(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setErrorMessage(null);
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(extractErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.employeeId.trim()) {
      setErrorMessage("Please enter an Employee UUID");
      return;
    }

    const payload: CreateContractRequest = {
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      wage: Number(formData.wage),
    };

    createMutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white p-6 rounded-lg border border-[rgba(0,0,0,0.12)]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1A1F36]">
            Create Employment Contract
          </DialogTitle>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to save contract</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Employee UUID *
              </label>
              <Input
                required
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contract Reference *
              </label>
              <Input
                required
                placeholder="CNT-2026-001"
                value={formData.contractReference}
                onChange={(e) => setFormData({ ...formData, contractReference: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Start Date *
              </label>
              <Input
                required
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                End Date (Optional)
              </label>
              <Input
                type="date"
                value={formData.endDate || ""}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Wage (INR ₹) *
              </label>
              <Input
                required
                type="number"
                min="0"
                value={formData.wage}
                onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Pay Frequency *
              </label>
              <select
                value={formData.payFrequency}
                onChange={(e) =>
                  setFormData({ ...formData, payFrequency: e.target.value as PayFrequency })
                }
                className="w-full h-9 px-3 text-xs bg-white border border-gray-300 rounded-[4px] focus:outline-none focus:border-[#714B67]"
              >
                <option value="monthly">Monthly</option>
                <option value="bi_weekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ContractStatus })
                }
                className="w-full h-9 px-3 text-xs bg-white border border-gray-300 rounded-[4px] focus:outline-none focus:border-[#714B67]"
              >
                <option value="draft">Draft</option>
                <option value="active">Active (Temporal Overlap Checked)</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-[4px] text-xs cursor-pointer"
            >
              Discard
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="bg-[#714B67] hover:bg-[#5e3e56] text-white rounded-[4px] text-xs flex items-center gap-1.5 cursor-pointer"
            >
              {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Contract
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
