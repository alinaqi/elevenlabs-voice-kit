import { z } from 'zod'

export interface ToolParam {
  type: 'string' | 'number' | 'boolean'
  description: string
  enum?: string[]
  optional?: boolean
}

export interface ClientToolSpec {
  name: string
  description: string
  params: Record<string, ToolParam>
  /** How long the agent waits for the result (default 10s). */
  timeoutSecs?: number
  /** Make the agent say something ("one moment…") before a slow tool runs. */
  speakFirst?: boolean
}

export interface ElevenClientTool {
  type: 'client'
  name: string
  description: string
  expectsResponse: boolean
  responseTimeoutSecs: number
  forcePreToolSpeech: boolean
  parameters?: {
    type: 'object'
    required: string[]
    properties: Record<string, { type: string, description: string, enum?: string[] }>
  }
}

const specSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/, 'tool names are snake_case'),
  description: z.string().min(1),
  params: z.record(z.string(), z.any())
})

/** Declare a tool your agent can call; the browser (or your server) executes it. */
export function defineClientTool (spec: ClientToolSpec): ClientToolSpec {
  specSchema.parse(spec)
  return spec
}

function toProperty ({ type, description, enum: values }: ToolParam) {
  return values ? { type, description, enum: values } : { type, description }
}

/** Convert a tool spec into the ElevenAgents `client` tool config. */
export function toElevenTool (spec: ClientToolSpec): ElevenClientTool {
  const entries = Object.entries(spec.params)
  return {
    type: 'client',
    name: spec.name,
    description: spec.description,
    expectsResponse: true,
    responseTimeoutSecs: spec.timeoutSecs ?? 10,
    forcePreToolSpeech: spec.speakFirst ?? false,
    parameters: {
      type: 'object',
      required: entries.filter(([, p]) => !p.optional).map(([k]) => k),
      properties: Object.fromEntries(entries.map(([k, p]) => [k, toProperty(p)]))
    }
  }
}
