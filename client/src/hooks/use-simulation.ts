/**
 * AgriSense AI — Simulation Hooks
 * ===================================
 * React Query hooks for simulation scenarios and history.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  SimulationHistoryParams,
  SimulationHistoryResponse,
  SimulationResult,
  SimulationRunRequest,
  SimulationScenario,
} from "@/types";

/** Fetch all available simulation scenarios. */
export function useSimulationScenarios() {
  return useQuery<SimulationScenario[]>({
    queryKey: ["simulation", "scenarios"],
    queryFn: () =>
      api.listSimulations().then((r) => r.data as SimulationScenario[]),
    staleTime: 5 * 60 * 1000, // Scenarios rarely change — 5 min cache
  });
}

/** Run a simulation scenario. */
export function useRunSimulation() {
  const queryClient = useQueryClient();
  return useMutation<SimulationResult, Error, SimulationRunRequest>({
    mutationFn: (data) =>
      api.runSimulation(data).then((r) => r.data as SimulationResult),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulation", "history"] });
    },
  });
}

/** Fetch simulation run history. */
export function useSimulationHistory(params?: SimulationHistoryParams) {
  return useQuery<SimulationHistoryResponse>({
    queryKey: ["simulation", "history", params],
    queryFn: () =>
      api
        .getSimulationHistory(params)
        .then((r) => r.data as SimulationHistoryResponse),
  });
}
