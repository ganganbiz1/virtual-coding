import { useEffect, useCallback } from 'react'
import { useAgentStore } from '../store/agentStore'
import type { Agent, ClaudeJsonLine, StreamEvent, StatusEvent } from '../types/agent'

export function useAgentEvents(): void {
  const { setAgentStatus, addMessage, appendToLastMessage, finalizeLastMessage } = useAgentStore()

  useEffect(() => {
    const removeStream = window.api.onAgentStream((event: StreamEvent) => {
      const { agentId, data } = event
      const line = data as ClaudeJsonLine

      if (line.type === 'raw' || line.type === 'stderr') {
        // Low-level text output - skip or add as info
        return
      }

      if (line.type === 'system' && line.subtype === 'init') {
        addMessage({
          agentId,
          role: 'info',
          content: `Session started (${line.session_id?.slice(0, 8) ?? '...'})`,
          isStreaming: false
        })
        return
      }

      if (line.type === 'assistant' && line.message) {
        for (const content of line.message.content) {
          if (content.type === 'text' && content.text) {
            // Check if we have a streaming message open
            const store = useAgentStore.getState()
            const msgs = store.messages[agentId] || []
            const last = msgs[msgs.length - 1]

            if (last?.isStreaming && last.role === 'assistant') {
              appendToLastMessage(agentId, content.text)
            } else {
              addMessage({
                agentId,
                role: 'assistant',
                content: content.text,
                isStreaming: true
              })
            }
          } else if (content.type === 'tool_use') {
            // Finalize any open streaming message first
            finalizeLastMessage(agentId)
            addMessage({
              agentId,
              role: 'tool',
              content: JSON.stringify(content.input, null, 2) || '',
              toolName: content.name,
              toolInput: content.input,
              isStreaming: false
            })
          }
        }
      }

      if (line.type === 'result') {
        finalizeLastMessage(agentId)
        if (line.result) {
          addMessage({
            agentId,
            role: 'assistant',
            content: line.result,
            isStreaming: false
          })
        }
        if (line.cost_usd !== undefined) {
          addMessage({
            agentId,
            role: 'info',
            content: `Cost: $${line.cost_usd.toFixed(4)}`,
            isStreaming: false
          })
        }
      }
    })

    const removeDone = window.api.onAgentDone(({ agentId }) => {
      finalizeLastMessage(agentId)
    })

    const removeError = window.api.onAgentError(({ agentId, error }) => {
      finalizeLastMessage(agentId)
      addMessage({
        agentId,
        role: 'error',
        content: `Error: ${error}`,
        isStreaming: false
      })
    })

    const removeStatus = window.api.onAgentStatus((event: StatusEvent) => {
      setAgentStatus(event.agentId, event.status)
    })

    return () => {
      removeStream()
      removeDone()
      removeError()
      removeStatus()
    }
  }, [setAgentStatus, addMessage, appendToLastMessage, finalizeLastMessage])
}

export function useSendPrompt() {
  const { agents, sharedContextFiles, addMessage } = useAgentStore()

  return useCallback(
    async (
      agentId: string,
      prompt: string,
      opts?: { sharedContextId?: string }
    ) => {
      const agent = agents.find((a) => a.id === agentId)
      if (!agent) return

      // Add user message
      addMessage({
        agentId,
        role: 'user',
        content: prompt,
        isStreaming: false
      })

      let sharedContext: string | undefined
      if (opts?.sharedContextId) {
        const file = sharedContextFiles.find((f) => f.id === opts.sharedContextId)
        sharedContext = file?.content
      }

      await window.api.sendPrompt({
        agentId,
        prompt,
        workDir: agent.workDir,
        rolePrompt: agent.rolePrompt,
        allowedTools: agent.allowedTools,
        sharedContext
      })
    },
    [agents, sharedContextFiles, addMessage]
  )
}

export function useCreateAgent() {
  const { addAgent } = useAgentStore()
  return useCallback(
    (data: Omit<Agent, 'id' | 'status'>) => {
      return addAgent(data)
    },
    [addAgent]
  )
}
