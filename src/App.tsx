import React from 'react'
import { useAgentStore } from './store/agentStore'
import { OfficeView } from './components/OfficeView'
import { ChatView } from './components/ChatView'
import { useAgentEvents } from './hooks/useAgent'

export function App(): React.ReactElement {
  const { view, selectedAgentId, selectAgent, setView } = useAgentStore()

  // Register global IPC event listeners
  useAgentEvents()

  const handleSelectAgent = (agentId: string) => {
    selectAgent(agentId)
    setView('chat')
  }

  const handleBack = () => {
    selectAgent(null)
    setView('office')
  }

  return (
    <div className="h-screen bg-office-bg text-white flex flex-col overflow-hidden">
      {view === 'office' ? (
        <OfficeView onSelectAgent={handleSelectAgent} />
      ) : selectedAgentId ? (
        <ChatView agentId={selectedAgentId} onBack={handleBack} />
      ) : (
        <OfficeView onSelectAgent={handleSelectAgent} />
      )}
    </div>
  )
}
