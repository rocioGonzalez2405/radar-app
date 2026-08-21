import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { seedProjects, type Project } from '@/shared/data/portalData'

interface PortalContextValue {
  projects: Project[]
  createProject: (input: Omit<Project, 'id'>) => Project
}

const PortalContext = createContext<PortalContextValue | null>(null)

export const PortalProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(seedProjects)

  const value = useMemo<PortalContextValue>(
    () => ({
      projects,
      createProject: (input) => {
        const created: Project = { ...input, id: crypto.randomUUID() }
        setProjects((prev) => [...prev, created])
        return created
      },
    }),
    [projects],
  )

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
}

export const usePortal = () => {
  const ctx = useContext(PortalContext)
  if (!ctx) {
    throw new Error('usePortal must be used within a PortalProvider')
  }
  return ctx
}
