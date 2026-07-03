/**
 * AgriSense AI — Crop Hooks
 * ============================
 * React Query hooks for crop lifecycle management.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Crop,
  CropCreateRequest,
  CropListParams,
  CropListResponse,
  CropUpdateRequest,
} from "@/types";

/** Fetch paginated list of crops. */
export function useCrops(params?: CropListParams) {
  return useQuery<CropListResponse>({
    queryKey: ["crops", params],
    queryFn: () => api.listCrops(params).then((r) => r.data as CropListResponse),
  });
}

/** Fetch a single crop by ID. */
export function useCrop(id: string | undefined) {
  return useQuery<Crop>({
    queryKey: ["crops", id],
    queryFn: () => api.getCrop(id!).then((r) => r.data as Crop),
    enabled: !!id,
  });
}

/** Create a new crop. */
export function useCreateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CropCreateRequest) => api.createCrop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crops"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Update a crop. */
export function useUpdateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CropUpdateRequest }) =>
      api.updateCrop(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crops"] });
      queryClient.invalidateQueries({ queryKey: ["crops", variables.id] });
    },
  });
}

/** Delete a crop. */
export function useDeleteCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCrop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crops"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
