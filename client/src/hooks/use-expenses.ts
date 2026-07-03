/**
 * AgriSense AI — Expense Hooks
 * ================================
 * React Query hooks for expense tracking.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface ExpenseListParams {
  page?: number;
  page_size?: number;
  crop_id?: string;
  category?: string;
}

/** Fetch paginated expenses with category summary. */
export function useExpenses(params?: ExpenseListParams) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => api.listExpenses(params).then((r) => r.data),
  });
}

/** Fetch a single expense by ID. */
export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: ["expenses", id],
    queryFn: () => api.getExpense(id!).then((r) => r.data),
    enabled: !!id,
  });
}

/** Create a new expense. */
export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Update an expense. */
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.updateExpense(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses", variables.id] });
    },
  });
}

/** Delete an expense. */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
