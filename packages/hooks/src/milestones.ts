import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./context";

export function useMilestones(owner: string, repo: string, state: "open" | "closed" = "open") {
  const api = useApi();

  return useQuery({
    queryKey: ["milestones", owner, repo, state],
    queryFn: () => api.milestones.list(owner, repo, state),
    enabled: !!owner && !!repo,
  });
}

export function useCreateMilestone(owner: string, repo: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; description?: string; dueOn?: string }) =>
      api.milestones.create(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", owner, repo] });
    },
  });
}

export function useUpdateMilestone(owner: string, repo: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; description?: string; state?: string; dueOn?: string | null };
    }) => api.milestones.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", owner, repo] });
    },
  });
}

export function useDeleteMilestone(owner: string, repo: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.milestones.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", owner, repo] });
    },
  });
}
