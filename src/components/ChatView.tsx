import React, { useState, useRef, useEffect } from 'react'
import { useAgentStore, selectMessages } from '../store/agentStore'
import { useSendPrompt } from '../hooks/useAgent'
import { StatusBadge } from './StatusBadge'
import type { Message } from '../types/agent'

interface ChatViewProps {
  agentId: string
  onBack: () => void
}

function MessageBubble({ message }: { message: Message }): React.ReactElement {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool'
  const isError = message.role === 'error'
  const isInfo = message.role === 'info'

  if (isInfo) {
    return (
      <div className="text-center text-gray-600 text-xs py-1">
        {message.content}
      </div>
    )
  }

  if (isTool) {
    return (
      <div className="bg-gray-800 rounded-lg p-3 text-xs font-mono">
        <div className="text-yellow-400 font-semibold mb-1">
          🔧 {message.toolName}
        </div>
        <pre className="text-gray-300 overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
          {message.content}
        </pre>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
        {message.content}
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}
      >
        <pre className="whitespace-pre-wrap font-sans break-words">{message.content}</pre>
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse align-middle" />
        )}
      </div>
    </div>
  )
}

export function ChatView({ agentId, onBack }: ChatViewProps): React.ReactElement {
  const agents = useAgentStore((s) => s.agents)
  const messages = useAgentStore(selectMessages(agentId))
  const sharedContextFiles = useAgentStore((s) => s.sharedContextFiles)
  const sendPrompt = useSendPrompt()

  const [input, setInput] = useState('')
  const [selectedContextId, setSelectedContextId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const agent = agents.find((a) => a.id === agentId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || !agent || agent.status === 'running') return
    setInput('')
    await sendPrompt(agentId, trimmed, {
      sharedContextId: selectedContextId || undefined
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStop = async () => {
    await window.api.killAgent(agentId)
  }

  if (!agent) return <div className="text-white p-4">Agent not found</div>

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>
        <span className="text-2xl">{agent.avatar}</span>
        <div className="flex-1">
          <div className="text-white font-semibold">{agent.name}</div>
          <div className="text-gray-500 text-xs font-mono truncate max-w-xs">{agent.workDir}</div>
        </div>
        <StatusBadge status={agent.status} size="md" />
        {agent.status === 'running' && (
          <button
            onClick={handleStop}
            className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-red-200 rounded-lg text-sm"
          >
            Stop
          </button>
        )}
        <button
          onClick={() => useAgentStore.getState().clearMessages(agentId)}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm"
          title="Clear messages"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Start a conversation with {agent.name}
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 p-4 bg-gray-900/50 backdrop-blur">
        {/* Shared context selector */}
        {sharedContextFiles.length > 0 && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-gray-500 text-xs">Context:</span>
            <select
              value={selectedContextId}
              onChange={(e) => setSelectedContextId(e.target.value)}
              className="text-xs bg-gray-800 text-gray-300 rounded px-2 py-1 border border-gray-700 focus:outline-none"
            >
              <option value="">None</option>
              {sharedContextFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.path.split('/').pop()}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              agent.status === 'running'
                ? 'Agent is running...'
                : 'Type a message... (Enter to send, Shift+Enter for newline)'
            }
            disabled={agent.status === 'running'}
            rows={3}
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:border-blue-500 focus:outline-none resize-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={agent.status === 'running' || !input.trim()}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
