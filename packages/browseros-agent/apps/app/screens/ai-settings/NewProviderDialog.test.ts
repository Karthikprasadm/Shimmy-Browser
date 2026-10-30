import { describe, expect, it } from 'bun:test'
import { providerTypeOptions } from '../../lib/llm-providers/providerTemplates'
import {
  normalizeProviderFormValues,
  providerFormSchema,
  trimTrailingSlashes,
} from './provider-form-schema'

const baseValues = {
  name: 'Provider',
  modelId: 'model',
  supportsImages: false,
  contextWindow: 128000,
  temperature: 0.2,
}

describe('provider setup boundary', () => {
  it('normalizes custom headers and keeps conversation placeholders for the server', () => {
    const values = providerFormSchema.parse({
      ...baseValues,
      type: 'openai-compatible',
      baseUrl: 'http://localhost:1234',
      headers: [{ name: 'x-opencode-session', value: '{{conversationId}}' }],
    })
    expect(normalizeProviderFormValues(values).headers).toEqual({
      'x-opencode-session': '{{conversationId}}',
    })
    expect(
      normalizeProviderFormValues({ ...values, headers: [] }).headers,
    ).toEqual({})
  })

  it.each([
    [{ name: '', value: 'a' }],
    [{ name: 'bad name', value: 'a' }],
    [{ name: 'x-test', value: 'a\nb' }],
    [
      { name: 'X-Test', value: 'a' },
      { name: 'x-test', value: 'b' },
    ],
  ])('rejects invalid header rows %j', (...headers) => {
    expect(
      providerFormSchema.safeParse({
        ...baseValues,
        type: 'openai-compatible',
        baseUrl: 'http://localhost:1234',
        headers,
      }).success,
    ).toBe(false)
  })

  for (const type of ['claude-code', 'codex', 'acp-custom']) {
    it(`rejects removed ACP provider type ${type}`, () => {
      expect(
        providerFormSchema.safeParse({ ...baseValues, type }).success,
      ).toBe(false)
    })
  }

  it('keeps ordinary provider validation unchanged', () => {
    const values = {
      ...baseValues,
      type: 'openai' as const,
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'secret',
    }

    expect(providerFormSchema.safeParse(values).success).toBe(true)
    expect(normalizeProviderFormValues(values)).toEqual(values)
  })

  it('does not show ACP agents in provider options', () => {
    const values = providerTypeOptions.map((option) => option.value)
    expect(values).not.toContain('claude-code')
    expect(values).not.toContain('codex')
    expect(values).not.toContain('acp-custom')
  })

  it('requires the API key for a new Azure provider', () => {
    const result = providerFormSchema.safeParse({
      ...baseValues,
      type: 'azure' as const,
      baseUrl: 'https://example.openai.azure.com',
      apiKey: '',
    })
    expect(result.success).toBe(false)
  })

  it('lets an Azure provider save blank when a key is already stored', () => {
    const result = providerFormSchema.safeParse({
      ...baseValues,
      type: 'azure' as const,
      baseUrl: 'https://example.openai.azure.com',
      apiKey: '',
      hasApiKey: true,
      originalType: 'azure' as const,
    })
    expect(result.success).toBe(true)
  })

  it('re-requires the credential when an edited provider switches type', () => {
    const result = providerFormSchema.safeParse({
      ...baseValues,
      type: 'azure' as const,
      baseUrl: 'https://example.openai.azure.com',
      apiKey: '',
      hasApiKey: true,
      originalType: 'openai-compatible' as const,
    })
    expect(result.success).toBe(false)
  })

  it('requires AWS credentials for a new Bedrock provider', () => {
    const result = providerFormSchema.safeParse({
      ...baseValues,
      type: 'bedrock' as const,
      region: 'us-east-1',
      accessKeyId: '',
      secretAccessKey: '',
    })
    expect(result.success).toBe(false)
  })

  it('lets a Bedrock provider save blank when credentials are already stored', () => {
    const result = providerFormSchema.safeParse({
      ...baseValues,
      type: 'bedrock' as const,
      region: 'us-east-1',
      accessKeyId: '',
      secretAccessKey: '',
      hasAccessKeyId: true,
      hasSecretAccessKey: true,
      originalType: 'bedrock' as const,
    })
    expect(result.success).toBe(true)
  })

  describe('local models and custom baseUrl with port forwarding', () => {
    it.each([
      ['ollama', 'http://localhost:11434/v1'],
      ['ollama', 'http://127.0.0.1:11434/v1'],
      ['ollama', 'http://localhost:8080/v1'],
      ['ollama', 'http://127.0.0.1:9090/v1'],
      ['ollama', 'http://[::1]:11434/v1'],
      ['ollama', 'http://host.docker.internal:11434/v1'],
      ['lmstudio', 'http://localhost:1234/v1'],
      ['lmstudio', 'http://127.0.0.1:1234/v1'],
      ['lmstudio', 'http://localhost:5000/v1'],
      ['lmstudio', 'http://127.0.0.1:8088/v1'],
      ['openai-compatible', 'http://localhost:11434/v1'],
      ['openai-compatible', 'http://127.0.0.1:1234/v1'],
    ] as const)('accepts %s with local baseUrl %s', (type, baseUrl) => {
      const values = {
        ...baseValues,
        type,
        baseUrl,
        ...(type === 'openai-compatible' ? { apiKey: 'optional-or-test' } : {}),
      }
      const result = providerFormSchema.safeParse(values)
      expect(result.success).toBe(true)
    })

    it.each([
      ['ollama', 'localhost:11434/v1'],
      ['ollama', 'ftp://localhost:11434/v1'],
      ['lmstudio', ''],
      ['lmstudio', 'not-a-url'],
    ] as const)('rejects %s with invalid baseUrl %s', (type, baseUrl) => {
      const values = {
        ...baseValues,
        type,
        baseUrl,
      }
      const result = providerFormSchema.safeParse(values)
      expect(result.success).toBe(false)
    })
  })

  describe('trimTrailingSlashes and baseUrl normalization for Ollama / LM Studio', () => {
    it.each([
      ['http://localhost:11434/', 'http://localhost:11434'],
      ['http://localhost:11434///', 'http://localhost:11434'],
      ['http://localhost:11434/v1/', 'http://localhost:11434/v1'],
      ['http://localhost:11434/v1///', 'http://localhost:11434/v1'],
      ['http://127.0.0.1:1234/', 'http://127.0.0.1:1234'],
      ['http://127.0.0.1:1234/v1/', 'http://127.0.0.1:1234/v1'],
      ['http://localhost:11434', 'http://localhost:11434'],
      ['  http://localhost:11434/  ', 'http://localhost:11434'],
      ['https://api.openai.com/v1/', 'https://api.openai.com/v1'],
    ])('trimTrailingSlashes(%j) returns %j', (input, expected) => {
      expect(trimTrailingSlashes(input)).toBe(expected)
    })

    it('returns undefined for undefined input', () => {
      expect(trimTrailingSlashes(undefined)).toBeUndefined()
    })

    it('normalizes Ollama custom baseUrl by stripping trailing slashes', () => {
      const values = providerFormSchema.parse({
        ...baseValues,
        type: 'ollama',
        baseUrl: 'http://localhost:11434/',
      })
      const normalized = normalizeProviderFormValues(values)
      expect(normalized.baseUrl).toBe('http://localhost:11434')
    })

    it('normalizes LM Studio custom baseUrl by stripping trailing slashes', () => {
      const values = providerFormSchema.parse({
        ...baseValues,
        type: 'lmstudio',
        baseUrl: 'http://127.0.0.1:1234/v1///',
      })
      const normalized = normalizeProviderFormValues(values)
      expect(normalized.baseUrl).toBe('http://127.0.0.1:1234/v1')
    })

    it('leaves baseUrl without trailing slashes unchanged', () => {
      const values = providerFormSchema.parse({
        ...baseValues,
        type: 'ollama',
        baseUrl: 'http://localhost:11434/v1',
      })
      const normalized = normalizeProviderFormValues(values)
      expect(normalized.baseUrl).toBe('http://localhost:11434/v1')
    })
  })
})
