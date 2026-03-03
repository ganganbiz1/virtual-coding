import { create } from 'zustand'
import { nanoid } from '../utils/nanoid'
import type { Agent, Message, Project, SharedContextFile, AgentStatus } from '../types/agent'

interface AgentStore {
  agents: Agent[]
  messages: Record<string, Message[]>
  selectedAgentId: string | null
  currentProject: Project | null
  sharedContextFiles: SharedContextFile[]
  view: 'office' | 'chat'

  // Agent actions
  addAgent: (agent: Omit<Agent, 'id' | 'status'>) => Agent
  updateAgent: (id: string, updates: Partial<Agent>) => void
  removeAgent: (id: string) => void
  setAgentStatus: (id: string, status: AgentStatus) => void
  selectAgent: (id: string | null) => void
  setView: (view: 'office' | 'chat') => void

  // Message actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  appendToLastMessage: (agentId: string, content: string) => void
  finalizeLastMessage: (agentId: string) => void
  clearMessages: (agentId: string) => void

  // Project actions
  setProject: (project: Project | null) => void
  loadAgentsFromProject: (project: Project) => void

  // Shared context
  setSharedContextFiles: (files: SharedContextFile[]) => void
  updateSharedContext: (id: string, content: string) => void
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  messages: {},
  selectedAgentId: null,
  currentProject: null,
  sharedContextFiles: [],
  view: 'office',

  addAgent: (agentData) => {
    const agent: Agent = {
      ...agentData,
      id: nanoid(),
      status: 'idle'
    }
    set((state) => ({
      agents: [...state.agents, agent],
      messages: { ...state.messages, [agent.id]: [] }
    }))
    return agent
  },

  updateAgent: (id, updates) => {
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a))
    }))
  },

  removeAgent: (id) => {
    set((state) => {
      const { [id]: _, ...remainingMessages } = state.messages
      return {
        agents: state.agents.filter((a) => a.id !== id),
        messages: remainingMessages,
        selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId
      }
    })
  },

  setAgentStatus: (id, status) => {
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, status } : a))
    }))
  },

  selectAgent: (id) => {
    set({ selectedAgentId: id })
  },

  setView: (view) => {
    set({ view })
  },

  addMessage: (messageData) => {
    const message: Message = {
      ...messageData,
      id: nanoid(),
      timestamp: Date.now()
    }
    set((state) => ({
      messages: {
        ...state.messages,
        [messageData.agentId]: [...(state.messages[messageData.agentId] || []), message]
      }
    }))
  },

  appendToLastMessage: (agentId, content) => {
    set((state) => {
      const msgs = state.messages[agentId] || []
      if (msgs.length === 0) return state
      const last = msgs[msgs.length - 1]
      if (!last.isStreaming) return state
      return {
        messages: {
          ...state.messages,
          [agentId]: [...msgs.slice(0, -1), { ...last, content: last.content + content }]
        }
      }
    })
  },

  finalizeLastMessage: (agentId) => {
    set((state) => {
      const msgs = state.messages[agentId] || []
      if (msgs.length === 0) return state
      const last = msgs[msgs.length - 1]
      return {
        messages: {
          ...state.messages,
          [agentId]: [...msgs.slice(0, -1), { ...last, isStreaming: false }]
        }
      }
    })
  },

  clearMessages: (agentId) => {
    set((state) => ({
      messages: { ...state.messages, [agentId]: [] }
    }))
  },

  setProject: (project) => {
    set({ currentProject: project })
  },

  loadAgentsFromProject: (project) => {
    const messages: Record<string, Message[]> = {}
    for (const agent of project.agents) {
      messages[agent.id] = []
    }
    set({
      agents: project.agents,
      messages,
      currentProject: project
    })
  },

  setSharedContextFiles: (files) => {
    set({ sharedContextFiles: files })
  },

  updateSharedContext: (id, content) => {
    set((state) => ({
      sharedContextFiles: state.sharedContextFiles.map((f) =>
        f.id === id ? { ...f, content, updatedAt: new Date().toISOString() } : f
      )
    }))
  }
}))

// Selector helpers
export const selectAgent = (id: string) => (state: AgentStore) =>
  state.agents.find((a) => a.id === id)

export const selectMessages = (agentId: string) => (state: AgentStore) =>
  state.messages[agentId] || []
