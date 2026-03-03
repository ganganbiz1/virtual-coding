import { ipcMain, BrowserWindow, dialog } from 'electron'
import { spawnAgent, killAgent, killAllAgents } from './agentManager'
import {
  listProjects,
  loadProject,
  saveProject,
  deleteProject,
  type Project
} from './projectStore'
import { readFileSync, writeFileSync, existsSync } from 'fs'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Agent: send prompt
  ipcMain.handle(
    'agent:send',
    (
      _,
      payload: {
        agentId: string
        prompt: string
        workDir: string
        rolePrompt?: string
        allowedTools?: string[]
        sharedContext?: string
      }
    ) => {
      spawnAgent(payload.agentId, payload.prompt, payload, mainWindow)
      return { success: true }
    }
  )

  // Agent: kill
  ipcMain.handle('agent:kill', (_, agentId: string) => {
    killAgent(agentId)
    return { success: true }
  })

  // Agent: kill all
  ipcMain.handle('agent:killAll', () => {
    killAllAgents()
    return { success: true }
  })

  // Project: list
  ipcMain.handle('project:list', () => {
    return listProjects()
  })

  // Project: load
  ipcMain.handle('project:load', (_, id: string) => {
    return loadProject(id)
  })

  // Project: save
  ipcMain.handle('project:save', (_, project: Project) => {
    saveProject(project)
    return { success: true }
  })

  // Project: delete
  ipcMain.handle('project:delete', (_, id: string) => {
    deleteProject(id)
    return { success: true }
  })

  // File: read shared context
  ipcMain.handle('file:readSharedContext', (_, filePath: string) => {
    if (!filePath || !existsSync(filePath)) return ''
    try {
      return readFileSync(filePath, 'utf8')
    } catch {
      return ''
    }
  })

  // File: write shared context
  ipcMain.handle('file:writeSharedContext', (_, filePath: string, content: string) => {
    try {
      writeFileSync(filePath, content, 'utf8')
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // Dialog: open directory
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Dialog: open file
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md', 'txt'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // App: cleanup on quit
  mainWindow.on('closed', () => {
    killAllAgents()
  })
}
