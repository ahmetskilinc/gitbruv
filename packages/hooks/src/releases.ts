import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./context";

export function useReleases(owner: string, repo: string) {
  const api = useApi();

  return useQuery({
    queryKey: ["releases", owner, repo],
    queryFn: () => api.releases.list(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useRelease(owner: string, repo: string, tag: string) {
  const api = useApi();

  return useQuery({
    queryKey: ["release", owner, repo, tag],
    queryFn: () => api.releases.get(owner, repo, tag),
    enabled: !!owner && !!repo && !!tag,
  });
}

export function useCreateRelease(owner: string, repo: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      tagName: string;
      targetCommitish?: string;
      name?: string;
      body?: string;
      isDraft?: boolean;
      isPrerelease?: boolean;
    }) => api.releases.create(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases", owner, repo] });
    },
  });
}

export function useUpdateRelease(owner: string, repo: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; body?: string; isDraft?: boolean; isPrerelease?: boolean };
    }) => api.releases.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases", owner, repo] });
    },
  });
}

export function useDeleteRelease(owner: string, repo: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.releases.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases", owner, repo] });
    },
  });
}
