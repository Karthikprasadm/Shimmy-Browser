import { type FC, useCallback, useEffect, useState } from 'react'
import { getMcpServerUrl } from '@/lib/browseros/helpers'
import { useGetUserMCPIntegrations } from '@/modules/mcp/user-integrations.hooks'
import { BrowserClawMcpBanner } from './BrowserClawMcpBanner'
import { IntegrationsSection } from './IntegrationsSection'
import { MCPServerHeader } from './MCPServerHeader'
import { MCPToolsSection } from './MCPToolsSection'

/** @public */
export const MCPSettingsPage: FC = () => {
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(true)
  const [urlError, setUrlError] = useState<string | null>(null)
  const {
    klavisStatus,
    mutate: refetchKlavis,
    isFetching: isKlavisFetching,
  } = useGetUserMCPIntegrations()

  const loadServerUrl = useCallback(async () => {
    setUrlLoading(true)
    setUrlError(null)
    try {
      setServerUrl(await getMcpServerUrl())
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setUrlLoading(false)
    }
  }, [])

  useEffect(() => {
    loadServerUrl()
  }, [loadServerUrl])

  return (
    <div className="fade-in slide-in-from-bottom-5 animate-in space-y-6 duration-500">
      <MCPServerHeader
        serverUrl={serverUrl}
        isLoading={urlLoading}
        error={urlError}
        klavisStatus={klavisStatus}
        onServerRestart={loadServerUrl}
        onRetryKlavis={() => refetchKlavis()}
        isRetryingKlavis={isKlavisFetching}
      />

      <BrowserClawMcpBanner />

      <IntegrationsSection serverUrl={serverUrl} />

      <MCPToolsSection />
    </div>
  )
}
