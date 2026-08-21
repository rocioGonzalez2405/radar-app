import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface ApprovedIntervention {
  householdId: number
  subsidy: number
}

export interface AffordStoreValue {
  approvedRecommendations: string[]
  dismissedRecommendations: string[]
  approvedInterventions: ApprovedIntervention[]
  approveRecommendation: (id: string) => void
  dismissRecommendation: (id: string) => void
  approveIntervention: (householdId: number, subsidy: number) => void
}

const AffordStoreContext = createContext<AffordStoreValue | null>(null)

/**
 * In-memory only, by design — approvals do not survive a reload. What matters is
 * that approving an intervention on a household moves the numbers on the
 * Subsidies and Impact pages inside one demo run.
 */
export const AffordStoreProvider = ({ children }: { children: ReactNode }) => {
  const [approvedRecommendations, setApprovedRecommendations] = useState<string[]>([])
  const [dismissedRecommendations, setDismissedRecommendations] = useState<string[]>([])
  const [approvedInterventions, setApprovedInterventions] = useState<
    ApprovedIntervention[]
  >([])

  const approveRecommendation = useCallback((id: string) => {
    setDismissedRecommendations((ids) => ids.filter((existing) => existing !== id))
    setApprovedRecommendations((ids) => (ids.includes(id) ? ids : [...ids, id]))
  }, [])

  const dismissRecommendation = useCallback((id: string) => {
    setApprovedRecommendations((ids) => ids.filter((existing) => existing !== id))
    setDismissedRecommendations((ids) => (ids.includes(id) ? ids : [...ids, id]))
  }, [])

  const approveIntervention = useCallback((householdId: number, subsidy: number) => {
    setApprovedInterventions((entries) =>
      entries.some((entry) => entry.householdId === householdId)
        ? entries
        : [...entries, { householdId, subsidy }],
    )
  }, [])

  const value = useMemo(
    () => ({
      approvedRecommendations,
      dismissedRecommendations,
      approvedInterventions,
      approveRecommendation,
      dismissRecommendation,
      approveIntervention,
    }),
    [
      approvedRecommendations,
      dismissedRecommendations,
      approvedInterventions,
      approveRecommendation,
      dismissRecommendation,
      approveIntervention,
    ],
  )

  return (
    <AffordStoreContext.Provider value={value}>{children}</AffordStoreContext.Provider>
  )
}

export const useAffordStore = (): AffordStoreValue => {
  const value = useContext(AffordStoreContext)
  if (!value) throw new Error('useAffordStore must be used inside AffordStoreProvider')
  return value
}
