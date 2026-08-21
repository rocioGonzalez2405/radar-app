/**
 * Matching Engine
 *
 * Finds potential matches between nonprofit inventory and needs.
 * Runs after fairness scoring to rank matches by quality.
 *
 * Two modes:
 * 1. Manual matching (MVP): Admin proposes matches to orgs for approval
 * 2. Automated matching (Phase 2): System automatically suggests top matches
 */

import {
  InventoryItem,
  Need,
  Nonprofit,
  Match,
  MatchStatus,
} from '../shared/data/buyNothingData'
import { calculateFairnessScore, FairnessScoreResult } from './fairnessScoring'

export interface PotentialMatch {
  match: Match
  fairnessScore: FairnessScoreResult
  fromOrg: Nonprofit
  toOrg: Nonprofit
  inventory: InventoryItem
  need: Need
}

/**
 * Find all potential matches between inventory and needs
 * Returns sorted by fairness score (highest first)
 */
export const findPotentialMatches = (
  inventoryItems: InventoryItem[],
  needs: Need[],
  nonprofits: Map<string, Nonprofit>,
): PotentialMatch[] => {
  const matches: PotentialMatch[] = []

  for (const inventory of inventoryItems) {
    for (const need of needs) {
      // Skip if same org (can't trade with yourself)
      if (inventory.nonprofitId === need.nonprofitId) {
        continue
      }

      // Skip if inventory is from same time period as need (no double-booking)
      // This would be more sophisticated with date overlap checking in production

      const fromOrg = nonprofits.get(inventory.nonprofitId)
      const toOrg = nonprofits.get(need.nonprofitId)

      if (!fromOrg || !toOrg) {
        continue // Skip if org not found
      }

      // Calculate fairness score
      const fairnessScore = calculateFairnessScore(inventory, need, fromOrg, toOrg)

      // Create match object
      const match: Match = {
        id: `match-${inventory.id}-${need.id}`,
        inventoryId: inventory.id,
        needId: need.id,
        fromNonprofitId: inventory.nonprofitId,
        toNonprofitId: need.nonprofitId,
        status: MatchStatus.PROPOSED,
        proposedAt: new Date(),
        fairnessScore: fairnessScore.total,
        fairnessBreakdown: fairnessScore.breakdown,
        radarSignal: inferRadarSignal(inventory),
      }

      matches.push({
        match,
        fairnessScore,
        fromOrg,
        toOrg,
        inventory,
        need,
      })
    }
  }

  // Sort by fairness score (highest first)
  matches.sort((a, b) => b.fairnessScore.total - a.fairnessScore.total)

  return matches
}

/**
 * Find matches for a specific need
 * (When an org posts a need, show them potential matches)
 */
export const findMatchesForNeed = (
  need: Need,
  inventoryItems: InventoryItem[],
  nonprofits: Map<string, Nonprofit>,
): PotentialMatch[] => {
  const needOrg = nonprofits.get(need.nonprofitId)
  if (!needOrg) return []

  const matches: PotentialMatch[] = []

  for (const inventory of inventoryItems) {
    // Skip if same org
    if (inventory.nonprofitId === need.nonprofitId) {
      continue
    }

    const fromOrg = nonprofits.get(inventory.nonprofitId)
    if (!fromOrg) continue

    const fairnessScore = calculateFairnessScore(inventory, need, fromOrg, needOrg)

    const match: Match = {
      id: `match-${inventory.id}-${need.id}`,
      inventoryId: inventory.id,
      needId: need.id,
      fromNonprofitId: inventory.nonprofitId,
      toNonprofitId: need.nonprofitId,
      status: MatchStatus.PROPOSED,
      proposedAt: new Date(),
      fairnessScore: fairnessScore.total,
      fairnessBreakdown: fairnessScore.breakdown,
      radarSignal: inferRadarSignal(inventory),
    }

    matches.push({
      match,
      fairnessScore,
      fromOrg,
      toOrg: needOrg,
      inventory,
      need,
    })
  }

  matches.sort((a, b) => b.fairnessScore.total - a.fairnessScore.total)

  return matches
}

/**
 * Find matches for a specific inventory item
 * (When an org lists inventory, show them where it's needed)
 */
export const findMatchesForInventory = (
  inventory: InventoryItem,
  needs: Need[],
  nonprofits: Map<string, Nonprofit>,
): PotentialMatch[] => {
  const fromOrg = nonprofits.get(inventory.nonprofitId)
  if (!fromOrg) return []

  const matches: PotentialMatch[] = []

  for (const need of needs) {
    // Skip if same org
    if (inventory.nonprofitId === need.nonprofitId) {
      continue
    }

    const toOrg = nonprofits.get(need.nonprofitId)
    if (!toOrg) continue

    const fairnessScore = calculateFairnessScore(inventory, need, fromOrg, toOrg)

    const match: Match = {
      id: `match-${inventory.id}-${need.id}`,
      inventoryId: inventory.id,
      needId: need.id,
      fromNonprofitId: inventory.nonprofitId,
      toNonprofitId: need.nonprofitId,
      status: MatchStatus.PROPOSED,
      proposedAt: new Date(),
      fairnessScore: fairnessScore.total,
      fairnessBreakdown: fairnessScore.breakdown,
      radarSignal: inferRadarSignal(inventory),
    }

    matches.push({
      match,
      fairnessScore,
      fromOrg,
      toOrg,
      inventory,
      need,
    })
  }

  matches.sort((a, b) => b.fairnessScore.total - a.fairnessScore.total)

  return matches
}

/**
 * Helper: Infer which Radar signal triggered this match
 * Examples: "age_55_plus_rising", "housing_pressure", etc.
 */
const inferRadarSignal = (inventory: InventoryItem): string | undefined => {
  const { demographics, serviceType } = inventory

  // Check demographics
  if (demographics.includes('age_55_plus')) {
    return 'age_55_plus_rising' // 29% → 33%
  }

  // Check service type for housing pressure
  const housingServices = [
    'emergency_shelter',
    'transitional_housing',
    'permanent_supportive_housing',
  ]
  if (housingServices.includes(serviceType)) {
    return 'housing_pressure' // $2,606/mo rent, 79% burdened
  }

  // Default: no specific signal
  return undefined
}

/**
 * Filter matches by minimum fairness threshold
 * MVP uses manual review, so we can propose lower-scoring matches
 * but flag them for admin review
 */
export const filterProposableMatches = (
  allMatches: PotentialMatch[],
  minScore: number = 70,
): { proposable: PotentialMatch[]; lowScore: PotentialMatch[] } => {
  const proposable: PotentialMatch[] = []
  const lowScore: PotentialMatch[] = []

  for (const match of allMatches) {
    if (match.fairnessScore.total >= minScore) {
      proposable.push(match)
    } else {
      lowScore.push(match)
    }
  }

  return { proposable, lowScore }
}
