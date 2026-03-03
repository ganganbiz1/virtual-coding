import React, { useState } from 'react'
import { useAgentStore } from '../store/agentStore'
import { AgentCard } from './AgentCard'
import { AgentSettings } from './AgentSettings'
import { SharedContextPanel } from './SharedContextPanel'
import type { Agent } from '../types/agent'

interface OfficeViewProps {
  onSelectAgent: (agentId: string) => void
}

export function OfficeView({ onSelectAgent }: OfficeViewProps): React.ReactElement {
  const { agents, addAgent, updateAgent, removeAgent, currentProject, setProject } =
    useAgentStore()

  const [showSettings, setShowSettings] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>(undefined)
  const [showSharedContext, setShowSharedContext] = useState(false)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [projectName, setProjectName] = useState('')

  const handleAddAgent = () => {
    setEditingAgent(undefined)
    setShowSettings(true)
  }

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent)
    setShowSettings(true)
  }

  const handleSaveAgent = (data: Omit<Agent, 'id' | 'status'>) => {
    if (editingAgent) {
      updateAgent(editingAgent.id, data)
    } else {
      addAgent(data)
    }
    setShowSettings(false)
    setEditingAgent(undefined)
  }

  const handleSaveProject = async () => {
    const name = projectName.trim() || currentProject?.name || 'My Project'
    const project = {
      id: currentProject?.id ?? `proj-${Date.now()}`,
      name,
      agents,
      createdAt: currentProject?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await window.api.saveProject(project)
    setProject(project)
    setShowProjectMenu(false)
    setProjectName('')
  }

  const handleLoadProject = async () => {
    const projects = await window.api.listProjects()
    if (projects.length === 0) {
      alert('No saved projects found.')
      return
    }
    // Simple: load the most recent project
    const project = projects[0]
    const { loadAgentsFromProject } = useAgentStore.getState()
    loadAgentsFromProject(project)
    setShowProjectMenu(false)
  }

  const runningCount = agents.filter((a) => a.status === 'running').length

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-xl">Virtual Office</h1>
          {currentProject && (
            <span className="text-gray-500 text-sm">/ {currentProject.name}</span>
          )}
          {runningCount > 0 && (
            <span className="bg-blue-900 text-blue-300 text-xs px-2 py-0.5 rounded-full animate-pulse">
              {runningCount} running
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSharedContext(true)}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm flex items-center gap-1"
          >
            📄 Shared Context
          </button>

          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm flex items-center gap-1"
            >
              💾 Project ▾
            </button>
            {showProjectMenu && (
              <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 p-3 w-64">
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder={currentProject?.name ?? 'Project name'}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSaveProject}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm mb-1"
                >
                  Save Project
                </button>
                <button
                  onClick={handleLoadProject}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm"
                >
                  Load Recent Project
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleAddAgent}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
          >
            + New Agent
          </button>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <span className="text-6xl mb-4">🏢</span>
            <p className="text-lg font-medium text-gray-500">Your office is empty</p>
            <p className="text-sm mt-1">Create your first agent to get started</p>
            <button
              onClick={handleAddAgent}
              className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium"
            >
              + Create Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => onSelectAgent(agent.id)}
                onEdit={() => handleEditAgent(agent)}
                onDelete={() => removeAgent(agent.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showSettings && (
        <AgentSettings
          agent={editingAgent}
          onSave={handleSaveAgent}
          onClose={() => {
            setShowSettings(false)
            setEditingAgent(undefined)
          }}
        />
      )}

      {showSharedContext && <SharedContextPanel onClose={() => setShowSharedContext(false)} />}

      {/* Click outside to close project menu */}
      {showProjectMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowProjectMenu(false)} />
      )}
    </div>
  )
}
