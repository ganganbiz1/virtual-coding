import { spawn, ChildProcess } from 'child_process'
import { BrowserWindow } from 'electron'
import { execSync } from 'child_process'

export interface AgentProcess {
  id: string
  process: ChildProcess
  buffer: string
}

export interface ClaudeJsonLine {
  type: 'system' | 'assistant' | 'user' | 'result'
  subtype?: string
  session_id?: string
  message?: {
    role: string
    content: ClaudeContent[]
  }
  result?: string
  cost_usd?: number
  is_error?: boolean
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

const agentProcesses = new Map<string, AgentProcess>()

function getClaudePath(): string {
  try {
    const result = execSync('which claude', { encoding: 'utf8' }).trim()
    return result || '/opt/homebrew/bin/claude'
  } catch {
    return '/opt/homebrew/bin/claude'
  }
}

export function spawnAgent(
  agentId: string,
  prompt: string,
  options: {
    workDir: string
    rolePrompt?: string
    allowedTools?: string[]
    sharedContext?: string
  },
  mainWindow: BrowserWindow
): void {
  // Kill existing process for this agent if any
  const existing = agentProcesses.get(agentId)
  if (existing) {
    existing.process.kill()
    agentProcesses.delete(agentId)
  }

  const claudePath = getClaudePath()
  // Prompt is passed via stdin to avoid --allowedTools variadic arg consuming it
  const args: string[] = ['-p', '--output-format', 'stream-json', '--verbose']

  if (options.allowedTools && options.allowedTools.length > 0) {
    args.push('--allowedTools', options.allowedTools.join(','))
  }

  if (options.rolePrompt) {
    args.push('--append-system-prompt', options.rolePrompt)
  }

  // Add shared context to prompt if provided
  const finalPrompt = options.sharedContext
    ? `${options.sharedContext}\n\n---\n\n${prompt}`
    : prompt

  // Remove CLAUDECODE env var to avoid nesting restriction
  const env = { ...process.env }
  delete env['CLAUDECODE']
  delete env['CLAUDE_CODE_ENTRYPOINT']

  const child = spawn(claudePath, args, {
    cwd: options.workDir || process.env.HOME,
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  })

  // Write prompt to stdin then close
  child.stdin?.write(finalPrompt)
  child.stdin?.end()

  const agentProcess: AgentProcess = {
    id: agentId,
    process: child,
    buffer: ''
  }

  agentProcesses.set(agentId, agentProcess)

  // Notify status: running
  mainWindow.webContents.send('agent:status', { agentId, status: 'running' })

  child.stdout?.on('data', (data: Buffer) => {
    agentProcess.buffer += data.toString()
    const lines = agentProcess.buffer.split('\n')
    agentProcess.buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const parsed: ClaudeJsonLine = JSON.parse(trimmed)
        handleClaudeOutput(agentId, parsed, mainWindow)
      } catch {
        // Non-JSON output, send as raw text
        mainWindow.webContents.send('agent:stream', {
          agentId,
          data: { type: 'raw', text: trimmed }
        })
      }
    }
  })

  child.stderr?.on('data', (data: Buffer) => {
    const text = data.toString()
    mainWindow.webContents.send('agent:stream', {
      agentId,
      data: { type: 'stderr', text }
    })
  })

  child.on('close', (code) => {
    // Process any remaining buffer
    if (agentProcess.buffer.trim()) {
      try {
        const parsed: ClaudeJsonLine = JSON.parse(agentProcess.buffer.trim())
        handleClaudeOutput(agentId, parsed, mainWindow)
      } catch {
        // ignore
      }
    }

    agentProcesses.delete(agentId)

    if (code === 0) {
      mainWindow.webContents.send('agent:done', { agentId })
      mainWindow.webContents.send('agent:status', { agentId, status: 'done' })
    } else {
      mainWindow.webContents.send('agent:error', {
        agentId,
        error: `Process exited with code ${code}`
      })
      mainWindow.webContents.send('agent:status', { agentId, status: 'error' })
    }
  })

  child.on('error', (err) => {
    agentProcesses.delete(agentId)
    mainWindow.webContents.send('agent:error', {
      agentId,
      error: err.message
    })
    mainWindow.webContents.send('agent:status', { agentId, status: 'error' })
  })
}

function handleClaudeOutput(
  agentId: string,
  line: ClaudeJsonLine,
  mainWindow: BrowserWindow
): void {
  mainWindow.webContents.send('agent:stream', { agentId, data: line })
}

export function killAgent(agentId: string): void {
  const agentProcess = agentProcesses.get(agentId)
  if (agentProcess) {
    agentProcess.process.kill('SIGTERM')
    agentProcesses.delete(agentId)
  }
}

export function killAllAgents(): void {
  for (const [, agentProcess] of agentProcesses) {
    agentProcess.process.kill('SIGTERM')
  }
  agentProcesses.clear()
}

export function isAgentRunning(agentId: string): boolean {
  return agentProcesses.has(agentId)
}
