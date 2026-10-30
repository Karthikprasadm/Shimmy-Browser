import { LLM_PROVIDERS } from '@browseros/shared/schemas/llm'
import type {
  FilePart,
  ImagePart,
  ModelMessage,
  ToolModelMessage,
  ToolResultPart,
  UserContent,
  UserModelMessage,
} from 'ai'
import { stripToolResultOutput } from './compaction/content'
import type { ResolvedAgentConfig } from './types'

type ToolResultOutput = ToolResultPart['output']
type ToolResultContentPart = Extract<
  ToolResultOutput,
  { type: 'content' }
>['value'][number]
type UserMessagePart = Exclude<UserContent, string>[number]
type UserMediaPart = Extract<UserMessagePart, ImagePart | FilePart>

export interface MessageNormalizationOptions {
  supportsImages: boolean
  supportsMediaInToolResults: boolean
}

// See how opencode handles, inspiration from there
// https://github.com/anomalyco/opencode/blob/5ec5d1daceaab23c8ffa9ae32b40f53120f4609e/packages/opencode/src/session/message-v2.ts#L503-L522
function supportsToolResultMediaTransport(
  config: ResolvedAgentConfig,
): boolean {
  switch (config.provider) {
    case LLM_PROVIDERS.ANTHROPIC:
    case LLM_PROVIDERS.OPENAI:
    case LLM_PROVIDERS.AZURE:
    case LLM_PROVIDERS.BEDROCK:
      return true
    case LLM_PROVIDERS.GOOGLE: {
      const modelId = config.model.toLowerCase()
      return modelId.includes('gemini-3') && !modelId.includes('gemini-2')
    }
    case LLM_PROVIDERS.BROWSEROS:
      return (
        config.upstreamProvider === LLM_PROVIDERS.ANTHROPIC ||
        config.upstreamProvider === LLM_PROVIDERS.AZURE
      )
    default:
      return false
  }
}

export function getMessageNormalizationOptions(
  config: ResolvedAgentConfig,
): MessageNormalizationOptions {
  return {
    supportsImages: config.supportsImages !== false,
    supportsMediaInToolResults: supportsToolResultMediaTransport(config),
  }
}

function buildToolResultMediaLabel(parts: UserMediaPart[]): string {
  const imageCount = parts.filter(
    (part) =>
      part.type === 'image' ||
      (part.type === 'file' && part.mediaType.startsWith('image/')),
  ).length

  if (imageCount === parts.length) {
    return 'Attached image(s) from tool result:'
  }

  if (imageCount === 0) {
    return 'Attached file(s) from tool result:'
  }

  return 'Attached files from tool result:'
}

function toolResultContentPartToUserMedia(
  part: ToolResultContentPart,
): UserMediaPart | null {
  switch (part.type) {
    case 'image-data':
      if (part.mediaType.startsWith('image/')) {
        return {
          type: 'image',
          image: part.data,
          mediaType: part.mediaType,
        }
      }
      return {
        type: 'file',
        data: part.data,
        mediaType: part.mediaType,
      }
    case 'file-data':
      if (part.mediaType.startsWith('image/')) {
        return {
          type: 'image',
          image: part.data,
          mediaType: part.mediaType,
        }
      }
      return {
        type: 'file',
        data: part.data,
        mediaType: part.mediaType,
        filename: part.filename,
      }
    default:
      return null
  }
}

function normalizeToolMessageForModel(
  message: ToolModelMessage,
  supportsImages: boolean,
): ModelMessage[] {
  let extractedMedia: UserMediaPart[] = []
  let changed = false

  const content = message.content.map((part) => {
    if (part.type !== 'tool-result' || part.output.type !== 'content') {
      return part
    }

    changed = true

    if (supportsImages) {
      extractedMedia = [
        ...extractedMedia,
        ...part.output.value
          .map(toolResultContentPartToUserMedia)
          .filter(
            (mediaPart): mediaPart is UserMediaPart => mediaPart !== null,
          ),
      ]
    }

    return {
      ...part,
      output: stripToolResultOutput(part.output),
    }
  })

  if (!changed) {
    return [message]
  }

  const normalizedToolMessage: ToolModelMessage = {
    ...message,
    content,
  }

  if (extractedMedia.length === 0) {
    return [normalizedToolMessage]
  }

  const mediaMessage: UserModelMessage = {
    role: 'user',
    content: [
      {
        type: 'text',
        text: buildToolResultMediaLabel(extractedMedia),
      },
      ...extractedMedia,
    ],
  }

  return [normalizedToolMessage, mediaMessage]
}

function isToolResultMediaMessage(message: UserModelMessage): boolean {
  if (!Array.isArray(message.content) || message.content.length === 0) {
    return false
  }
  const first = message.content[0]
  if (first.type !== 'text') return false
  return (
    first.text === 'Attached image(s) from tool result:' ||
    first.text === 'Attached file(s) from tool result:' ||
    first.text === 'Attached files from tool result:'
  )
}

function normalizeUserMessageForNonVisionModel(
  message: UserModelMessage,
): UserModelMessage | null {
  if (typeof message.content === 'string') {
    return message
  }

  if (isToolResultMediaMessage(message)) {
    const nonImageFiles = message.content.slice(1).filter((part) => {
      if (part.type === 'image') return false
      if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
        return false
      }
      return true
    }) as UserMediaPart[]

    if (nonImageFiles.length === 0) {
      return null
    }

    return {
      ...message,
      content: [
        {
          type: 'text',
          text: buildToolResultMediaLabel(nonImageFiles),
        },
        ...nonImageFiles,
      ],
    }
  }

  let hasImage = false
  const content = message.content.map((part) => {
    if (part.type === 'image') {
      hasImage = true
      return { type: 'text' as const, text: '[Image]' }
    }
    if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
      hasImage = true
      return { type: 'text' as const, text: '[Image]' }
    }
    return part
  })

  return hasImage ? { ...message, content } : message
}

// opencode handles this at message serialization time for providers that do not
// reliably support media inside tool results. BrowserOS uses the same boundary:
// normalize model messages before the next step, not inside the screenshot tool.
// When switching mid-conversation from a vision model to a non-vision model,
// tool screenshots and follow-up media messages are stripped to prevent provider 400 rejection.
export function normalizeMessagesForModel(
  messages: ModelMessage[],
  options: MessageNormalizationOptions,
): ModelMessage[] {
  if (options.supportsImages && options.supportsMediaInToolResults) {
    return messages
  }

  let changed = false
  const normalized: ModelMessage[] = []

  for (const message of messages) {
    if (message.role === 'tool') {
      const replacement = normalizeToolMessageForModel(
        message,
        options.supportsImages,
      )
      if (replacement.length !== 1 || replacement[0] !== message) {
        changed = true
      }
      normalized.push(...replacement)
      continue
    }

    if (message.role === 'user' && !options.supportsImages) {
      const sanitized = normalizeUserMessageForNonVisionModel(message)
      if (sanitized === null) {
        changed = true
        continue
      }
      if (sanitized !== message) {
        changed = true
      }
      normalized.push(sanitized)
      continue
    }

    normalized.push(message)
  }

  return changed ? normalized : messages
}
