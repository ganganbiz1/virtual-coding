import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export interface AgentConfig {
  id: string
  name: string
  avatar: string
  rolePrompt: string
  workDir: string
  allowedTools: string[]
  status: 'idle' | 'running' | 'done' | 'error'
}

export interface Project {
  id: string
  name: string
  agents: AgentConfig[]
  sharedContextPath?: string
  createdAt: string
  updatedAt: string
}

const PROJECTS_DIR = join(homedir(), '.virtual-office', 'projects')

function ensureDir(): void {
  if (!existsSync(PROJECTS_DIR)) {
    mkdirSync(PROJECTS_DIR, { recursive: true })
  }
}

export function listProjects(): Project[] {
  ensureDir()
  const files = readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.json'))
  const projects: Project[] = []
  for (const file of files) {
    try {
      const content = readFileSync(join(PROJECTS_DIR, file), 'utf8')
      projects.push(JSON.parse(content))
    } catch {
      // skip corrupt files
    }
  }
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function loadProject(id: string): Project | null {
  ensureDir()
  const filePath = join(PROJECTS_DIR, `${id}.json`)
  if (!existsSync(filePath)) return null
  try {
    const content = readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export function saveProject(project: Project): void {
  ensureDir()
  project.updatedAt = new Date().toISOString()
  const filePath = join(PROJECTS_DIR, `${project.id}.json`)
  writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf8')
}

export function deleteProject(id: string): void {
  ensureDir()
  const filePath = join(PROJECTS_DIR, `${id}.json`)
  if (existsSync(filePath)) {
    unlinkSync(filePath)
  }
}
