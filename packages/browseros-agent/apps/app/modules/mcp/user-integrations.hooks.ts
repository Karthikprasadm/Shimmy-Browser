import { useQuery } from '@tanstack/react-query'
import { useAgentServerUrl } from '@/modules/browseros/agent-server-url.hooks'

export interface UserMCPIntegration {
  name: string
  is_authenticated: boolean
}

export interface UserMCPIntegrationsList {
  integrations: UserMCPIntegration[]
  count: number
}

export type KlavisServiceStatus =
  | 'connected'
  | 'unconfigured'
  | 'unreachable'
  | 'loading'

const INTEGRATIONS_QUERY_KEY = 'klavis-user-integrations'

const getUserMCPIntegrations = async (
  hostUrl: string,
): Promise<UserMCPIntegrationsList> => {
  const response = await fetch(`${hostUrl}/klavis/user-integrations`)
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as {
      error?: string
    }
    const message =
      errorBody.error || `Klavis server responded with HTTP ${response.status}`
    throw new Error(message)
  }
  const data = (await response.json()) as UserMCPIntegrationsList
  return data
}

export const useGetUserMCPIntegrations = () => {
  const { baseUrl: agentServerUrl } = useAgentServerUrl()

  const query = useQuery({
    queryKey: [INTEGRATIONS_QUERY_KEY, agentServerUrl],
    // biome-ignore lint/style/noNonNullAssertion: guarded by enabled
    queryFn: () => getUserMCPIntegrations(agentServerUrl!),
    enabled: !!agentServerUrl,
    refetchOnWindowFocus: true,
  })

  let klavisStatus: KlavisServiceStatus = 'loading'
  if (!agentServerUrl || query.isLoading) {
    klavisStatus = 'loading'
  } else if (query.isError) {
    const message =
      query.error instanceof Error ? query.error.message : String(query.error)
    if (
      message.includes('browserosId not configured') ||
      message.includes('unconfigured')
    ) {
      klavisStatus = 'unconfigured'
    } else {
      klavisStatus = 'unreachable'
    }
  } else if (query.isSuccess) {
    klavisStatus = 'connected'
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error,
    klavisStatus,
    mutate: query.refetch,
  }
}
