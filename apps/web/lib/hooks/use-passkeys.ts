import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"

type Passkey = {
  id: string
  name: string | null
  deviceType: string
  createdAt: string
  backedUp: boolean
}

export function usePasskeys() {
  return useQuery({
    queryKey: ["passkeys"],
    queryFn: async () => {
      const result = await authClient.passkey.listUserPasskeys()
      if (result.error) throw result.error
      return (result.data ?? []) as unknown as Passkey[]
    },
  })
}

export function useAddPasskey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data?: {
      name?: string
      authenticatorAttachment?: "platform" | "cross-platform"
    }) => {
      const result = await authClient.passkey.addPasskey({
        name: data?.name,
        authenticatorAttachment: data?.authenticatorAttachment,
      })
      if (result.error) throw result.error
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passkeys"] })
    },
  })
}

export function useDeletePasskey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { passkeyId: string }) => {
      const result = await authClient.passkey.deletePasskey({
        id: data.passkeyId,
      })
      if (result.error) throw result.error
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passkeys"] })
    },
  })
}
