import React from 'react'
import { StatusBadge } from './StatusBadge'
import type { Agent } from '../types/agent'

interface AgentCardProps {
  agent: Agent
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

export function AgentCard({ agent, onClick, onEdit, onDelete }: AgentCardProps): React.ReactElement {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete agent "${agent.name}"?`)) {
      onDelete()
    }
  }

  const handleKill = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await window.api.killAgent(agent.id)
  }

  return (
    <div
      className="relative bg-office-card rounded-xl p-5 cursor-pointer border border-gray-700 hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/20 group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl select-none">{agent.avatar || '🤖'}</span>
          <div>
            <h3 className="text-white font-semibold text-base leading-tight">{agent.name}</h3>
            <StatusBadge status={agent.status} size="sm" />
          </div>
        </div>

        {/* Action buttons - shown on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {agent.status === 'running' && (
            <button
              onClick={handleKill}
              className="p-1 rounded text-yellow-400 hover:bg-yellow-900/30 text-xs"
              title="Stop"
            >
              ⏹
            </button>
          )}
          <button
            onClick={handleEdit}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 text-xs"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-900/20 text-xs"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Role prompt preview */}
      {agent.rolePrompt && (
        <p className="text-gray-400 text-xs line-clamp-2 mb-3">{agent.rolePrompt}</p>
      )}

      {/* Work dir */}
      <div className="text-gray-500 text-xs font-mono truncate" title={agent.workDir}>
        📁 {agent.workDir || 'No directory set'}
      </div>

      {/* Tools */}
      {agent.allowedTools.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {agent.allowedTools.slice(0, 4).map((tool) => (
            <span key={tool} className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded">
              {tool}
            </span>
          ))}
          {agent.allowedTools.length > 4 && (
            <span className="text-gray-500 text-xs">+{agent.allowedTools.length - 4}</span>
          )}
        </div>
      )}

      {/* Running indicator overlay */}
      {agent.status === 'running' && (
        <div className="absolute inset-0 rounded-xl border-2 border-blue-500 animate-pulse pointer-events-none" />
      )}
    </div>
  )
}
