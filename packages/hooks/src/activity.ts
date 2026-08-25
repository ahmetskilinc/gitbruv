import { useQuery } from "@tanstack/react-query";
import { useApi } from "./context";

export function useUserActivity(
  username: string,
  options?: { limit?: number; offset?: number }
) {
  const api = useApi();
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  return useQuery({
    queryKey: ["activity", "user", username, limit, offset],
    queryFn: () => api.activity.getUserActivity(username, { limit, offset }),
    enabled: !!username,
  });
}

export function useActivityFeed(options?: { limit?: number; offset?: number }) {
  const api = useApi();
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  return useQuery({
    queryKey: ["activity", "feed", limit, offset],
    queryFn: () => api.activity.getFeed({ limit, offset }),
  });
}

export function useContributions(username: string, days = 365) {
  const api = useApi();
  return useQuery({
    queryKey: ["activity", "contributions", username, days],
    queryFn: () => api.activity.getContributions(username, days),
    enabled: !!username,
    staleTime: 60_000,
  });
}
