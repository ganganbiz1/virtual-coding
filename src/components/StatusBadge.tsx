import React from 'react'
import type { AgentStatus } from '../types/agent'

interface StatusBadgeProps {
  status: AgentStatus
  size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<AgentStatus, { label: string; classes: string; dot: string }> = {
  idle: {
    label: 'Idle',
    classes: 'bg-gray-700 text-gray-300',
    dot: 'bg-gray-400'
  },
  running: {
    label: 'Running',
    classes: 'bg-blue-900 text-blue-300',
    dot: 'bg-blue-400 animate-pulse'
  },
  done: {
    label: 'Done',
    classes: 'bg-green-900 text-green-300',
    dot: 'bg-green-400'
  },
  error: {
    label: 'Error',
    classes: 'bg-red-900 text-red-300',
    dot: 'bg-red-400'
  }
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps): React.ReactElement {
  const config = STATUS_CONFIG[status]
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} ${config.classes}`}>
      <span className={`rounded-full ${dotSize} ${config.dot}`} />
      {config.label}
    </span>
  )
}
