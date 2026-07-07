/**
 * AgriSense AI — Recommendation Hooks
 * ========================================
 * React Query hooks for AI-powered crop recommendations.
 */

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { RecommendationRequest, RecommendationResponse } from "@/types";

/**
 * Generate AI-powered recommendations for a specific crop.
 *
 * Uses a mutation (not a query) because recommendations are
 * generated on-demand and may be expensive to compute.
 */
export function useGenerateRecommendation() {
  return useMutation<RecommendationResponse, Error, RecommendationRequest>({
    mutationFn: (data) =>
      api.getRecommendations(data).then((r) => r.data as RecommendationResponse),
  });
}
