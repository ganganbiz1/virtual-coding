import { contextBridge, ipcRenderer } from 'electron'
import type { ClaudeJsonLine } from './agentManager'
import type { Project } from './projectStore'

export interface AgentSendPayload {
  agentId: string
  prompt: string
  workDir: string
  rolePrompt?: string
  allowedTools?: string[]
  sharedContext?: string
}

export interface StreamEvent {
  agentId: string
  data: ClaudeJsonLine | { type: 'raw' | 'stderr'; text: string }
}

export interface StatusEvent {
  agentId: string
  status: 'idle' | 'running' | 'done' | 'error'
}

export interface DoneEvent {
  agentId: string
}

export interface ErrorEvent {
  agentId: string
  error: string
}

const api = {
  // Agent operations
  sendPrompt: (payload: AgentSendPayload): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('agent:send', payload),

  killAgent: (agentId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('agent:kill', agentId),

  killAllAgents: (): Promise<{ success: boolean }> => ipcRenderer.invoke('agent:killAll'),

  // Project operations
  listProjects: (): Promise<Project[]> => ipcRenderer.invoke('project:list'),

  loadProject: (id: string): Promise<Project | null> => ipcRenderer.invoke('project:load', id),

  saveProject: (project: Project): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('project:save', project),

  deleteProject: (id: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('project:delete', id),

  // File operations
  readSharedContext: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('file:readSharedContext', filePath),

  writeSharedContext: (
    filePath: string,
    content: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('file:writeSharedContext', filePath, content),

  // Dialog operations
  openDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:openDirectory'),
  openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),

  // Event listeners
  onAgentStream: (callback: (event: StreamEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: StreamEvent) => callback(event)
    ipcRenderer.on('agent:stream', handler)
    return () => ipcRenderer.removeListener('agent:stream', handler)
  },

  onAgentDone: (callback: (event: DoneEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: DoneEvent) => callback(event)
    ipcRenderer.on('agent:done', handler)
    return () => ipcRenderer.removeListener('agent:done', handler)
  },

  onAgentError: (callback: (event: ErrorEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: ErrorEvent) => callback(event)
    ipcRenderer.on('agent:error', handler)
    return () => ipcRenderer.removeListener('agent:error', handler)
  },

  onAgentStatus: (callback: (event: StatusEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: StatusEvent) => callback(event)
    ipcRenderer.on('agent:status', handler)
    return () => ipcRenderer.removeListener('agent:status', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type API = typeof api
