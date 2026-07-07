/**
 * AgriSense AI — Input Hooks
 * =============================
 * React Query hooks for agricultural input (fertilizer/pesticide) tracking.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { InputListParams, InputListResponse } from "@/types";

/** Fetch paginated list of input records. */
export function useInputs(params?: InputListParams) {
  return useQuery<InputListResponse>({
    queryKey: ["inputs", params],
    queryFn: () => api.listInputs(params).then((r) => r.data as InputListResponse),
  });
}

/** Create a new input record. */
export function useCreateInput() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createInput(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inputs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Upload a packet image for OCR extraction. */
export function useUploadInputOCR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.uploadInputOCR(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inputs"] });
    },
  });
}

/** Delete an input record. */
export function useDeleteInput() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteInput(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inputs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
