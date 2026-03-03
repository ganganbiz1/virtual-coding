export type AgentStatus = 'idle' | 'running' | 'done' | 'error'

export interface Agent {
  id: string
  name: string
  avatar: string
  rolePrompt: string
  workDir: string
  allowedTools: string[]
  status: AgentStatus
}

export interface ClaudeContent {
  type: 'text' | 'tool_use' | 'tool_result'
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  content?: string | ClaudeContent[]
  is_error?: boolean
}

export interface ClaudeJsonLine {
  type: 'system' | 'assistant' | 'user' | 'result' | 'raw' | 'stderr'
  subtype?: string
  session_id?: string
  text?: string // for raw/stderr
  message?: {
    role: string
    content: ClaudeContent[]
  }
  result?: string
  cost_usd?: number
  is_error?: boolean
  duration_ms?: number
  num_turns?: number
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool' | 'error' | 'info'

export interface Message {
  id: string
  agentId: string
  role: MessageRole
  content: string
  toolName?: string
  toolInput?: Record<string, unknown>
  timestamp: number
  isStreaming?: boolean
}

export interface SharedContextFile {
  id: string
  path: string
  content: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  agents: Agent[]
  sharedContextPath?: string
  createdAt: string
  updatedAt: string
}

export interface StreamEvent {
  agentId: string
  data: ClaudeJsonLine | { type: 'raw' | 'stderr'; text: string }
}

export interface StatusEvent {
  agentId: string
  status: AgentStatus
}
