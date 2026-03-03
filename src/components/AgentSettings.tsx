import React, { useState, useEffect } from 'react'
import type { Agent } from '../types/agent'

interface AgentSettingsProps {
  agent?: Agent
  onSave: (data: Omit<Agent, 'id' | 'status'>) => void
  onClose: () => void
}

const TOOL_OPTIONS = ['Bash', 'Edit', 'Read', 'Write', 'Glob', 'Grep', 'WebFetch', 'WebSearch']

const DEFAULT_AVATARS = ['🤖', '👨‍💻', '👩‍💻', '🧑‍💻', '🔧', '🎯', '🚀', '💡', '🔍', '📝', '🛠️', '⚡']

export function AgentSettings({ agent, onSave, onClose }: AgentSettingsProps): React.ReactElement {
  const [name, setName] = useState(agent?.name ?? '')
  const [avatar, setAvatar] = useState(agent?.avatar ?? '🤖')
  const [rolePrompt, setRolePrompt] = useState(agent?.rolePrompt ?? '')
  const [workDir, setWorkDir] = useState(agent?.workDir ?? '')
  const [allowedTools, setAllowedTools] = useState<string[]>(agent?.allowedTools ?? ['Bash', 'Edit', 'Read'])

  useEffect(() => {
    if (agent) {
      setName(agent.name)
      setAvatar(agent.avatar)
      setRolePrompt(agent.rolePrompt)
      setWorkDir(agent.workDir)
      setAllowedTools(agent.allowedTools)
    }
  }, [agent])

  const handleBrowseDir = async () => {
    const dir = await window.api.openDirectory()
    if (dir) setWorkDir(dir)
  }

  const toggleTool = (tool: string) => {
    setAllowedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), avatar, rolePrompt, workDir, allowedTools })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-white font-bold text-lg">
            {agent ? 'Edit Agent' : 'New Agent'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Avatar picker */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-colors ${
                    avatar === emoji
                      ? 'bg-blue-600 border-2 border-blue-400'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Frontend Dev"
              required
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Work Directory */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Work Directory</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={workDir}
                onChange={(e) => setWorkDir(e.target.value)}
                placeholder="/path/to/project"
                className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleBrowseDir}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Role Prompt */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Role Prompt</label>
            <textarea
              value={rolePrompt}
              onChange={(e) => setRolePrompt(e.target.value)}
              placeholder="You are a senior frontend developer specializing in React and TypeScript..."
              rows={4}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Allowed Tools */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Allowed Tools</label>
            <div className="flex flex-wrap gap-2">
              {TOOL_OPTIONS.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => toggleTool(tool)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    allowedTools.includes(tool)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium"
            >
              {agent ? 'Save Changes' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
