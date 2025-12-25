import useSWR from "swr";
import { fetcher, type UserProfile, type PublicUser, type RepositoryWithStars } from "@/lib/api/client";
import { getApiUrl } from "@/lib/utils";

const API_URL = getApiUrl() || "";

export function useUserProfile(username: string) {
  return useSWR<UserProfile>(username ? `${API_URL}/api/users/${username}/profile` : null, fetcher);
}

export function useUserStarredRepos(username: string) {
  return useSWR<{ repos: RepositoryWithStars[] }>(username ? `${API_URL}/api/users/${username}/starred` : null, fetcher);
}

export function usePublicUsers(sortBy: "newest" | "oldest" = "newest", limit = 20, offset = 0) {
  return useSWR<{ users: PublicUser[]; hasMore: boolean }>(`${API_URL}/api/users/public?sortBy=${sortBy}&limit=${limit}&offset=${offset}`, fetcher);
}
