import React, { useState } from 'react'
import { useAgentStore } from '../store/agentStore'
import { nanoid } from '../utils/nanoid'
import type { SharedContextFile } from '../types/agent'

interface SharedContextPanelProps {
  onClose: () => void
}

export function SharedContextPanel({ onClose }: SharedContextPanelProps): React.ReactElement {
  const { sharedContextFiles, setSharedContextFiles, updateSharedContext } = useAgentStore()
  const [selectedId, setSelectedId] = useState<string | null>(
    sharedContextFiles[0]?.id ?? null
  )
  const [editContent, setEditContent] = useState<string>(
    sharedContextFiles[0]?.content ?? ''
  )
  const [saving, setSaving] = useState(false)

  const selectedFile = sharedContextFiles.find((f) => f.id === selectedId)

  const handleSelect = (file: SharedContextFile) => {
    setSelectedId(file.id)
    setEditContent(file.content)
  }

  const handleAddFile = async () => {
    const path = await window.api.openFile()
    if (!path) return

    const content = await window.api.readSharedContext(path)
    const newFile: SharedContextFile = {
      id: nanoid(),
      path,
      content,
      updatedAt: new Date().toISOString()
    }
    setSharedContextFiles([...sharedContextFiles, newFile])
    setSelectedId(newFile.id)
    setEditContent(content)
  }

  const handleSave = async () => {
    if (!selectedFile) return
    setSaving(true)
    updateSharedContext(selectedId!, editContent)
    await window.api.writeSharedContext(selectedFile.path, editContent)
    setSaving(false)
  }

  const handleRemove = (id: string) => {
    const remaining = sharedContextFiles.filter((f) => f.id !== id)
    setSharedContextFiles(remaining)
    if (selectedId === id) {
      setSelectedId(remaining[0]?.id ?? null)
      setEditContent(remaining[0]?.content ?? '')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-white font-bold text-lg">Shared Context Files</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* File list */}
          <div className="w-56 border-r border-gray-700 p-3 flex flex-col gap-2 overflow-y-auto">
            {sharedContextFiles.map((file) => (
              <div
                key={file.id}
                className={`group flex items-start gap-2 p-2 rounded-lg cursor-pointer text-sm ${
                  selectedId === file.id
                    ? 'bg-blue-900 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
                onClick={() => handleSelect(file)}
              >
                <span className="flex-1 font-mono text-xs truncate">
                  {file.path.split('/').pop()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(file.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs"
                >
                  ×
                </button>
              </div>
            ))}

            <button
              onClick={handleAddFile}
              className="mt-auto px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-xs text-center"
            >
              + Add File
            </button>
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col">
            {selectedFile ? (
              <>
                <div className="px-4 py-2 border-b border-gray-700 text-xs text-gray-500 font-mono">
                  {selectedFile.path}
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 bg-transparent text-gray-200 p-4 text-sm font-mono resize-none focus:outline-none"
                  placeholder="Write shared context here..."
                />
                <div className="p-3 border-t border-gray-700 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                No file selected. Click "+ Add File" to load a context file.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
