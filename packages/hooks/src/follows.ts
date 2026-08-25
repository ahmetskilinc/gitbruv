import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./context";

export function useFollowInfo(username: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["follows", "info", username],
    queryFn: () => api.users.getFollowInfo(username),
    enabled: !!username,
  });
}

export function useToggleFollow(username: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.users.toggleFollow(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follows"] });
      queryClient.invalidateQueries({ queryKey: ["activity", "feed"] });
    },
  });
}

export function useFollowers(
  username: string,
  options?: { limit?: number; offset?: number }
) {
  const api = useApi();
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  return useQuery({
    queryKey: ["follows", "followers", username, limit, offset],
    queryFn: () => api.users.getFollowers(username, { limit, offset }),
    enabled: !!username,
  });
}

export function useFollowing(
  username: string,
  options?: { limit?: number; offset?: number }
) {
  const api = useApi();
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  return useQuery({
    queryKey: ["follows", "following", username, limit, offset],
    queryFn: () => api.users.getFollowing(username, { limit, offset }),
    enabled: !!username,
  });
}
