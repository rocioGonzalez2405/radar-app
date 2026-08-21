/**
 * Fairness Scoring Algorithm
 *
 * Evaluates potential matches between inventory and needs based on:
 * 1. Fit (40%): Does the inventory match the need?
 * 2. Value (35%): Is the exchange equitable?
 * 3. RadarImpact (20%): Does it address priority subgroups?
 * 4. Reputation (5%): Do we trust both organizations?
 *
 * Matches scoring >70 are proposed; both orgs must accept before locking.
 * Scoring is transparent — the breakdown is always shown to stakeholders.
 */

import {
  InventoryItem,
  Need,
  Nonprofit,
  RTFHDemographic,
  radarPrioritySignals,
} from '../shared/data/buyNothingData'

export interface FairnessScoreBreakdown {
  fit: number // 0-100
  value: number // 0-100
  benefit: number // 0-100
  radarImpact: number // 0-100
  reputation: number // 0-100
}

export interface FairnessScoreResult {
  total: number // 0-100 (weighted average)
  breakdown: FairnessScoreBreakdown
  reasoning: string
  isProposable: boolean // >= 70 is proposable
}

/**
 * Helper: Estimate monetary value of a service for fairness comparison
 * Based on typical nonprofit market rates in San Diego
 */
const estimateServiceValue = (
  serviceType: string,
  quantity: number,
  quantityUnit: string,
): number => {
  const hourlyRates: Record<string, number> = {
    case_management: 75, // Case manager hourly rate
    job_training: 60,
    meals: 12, // Per meal
    emergency_shelter: 85, // Per bed per night
    transitional_housing: 100, // Per bed per night
    permanent_supportive_housing: 120, // Per bed per night
    geriatric_care: 90, // Per hour for specialized care
    mental_health_services: 150, // Per session/hour
    substance_abuse_treatment: 80, // Per session/hour
    medical_clinic: 120, // Per visit
    childcare: 25, // Per hour
    family_counseling: 100, // Per session/hour
    veteran_housing: 110, // Per bed per night
    veteran_mental_health: 140, // Per session/hour
    hygiene_facilities: 15, // Per person per day
  }

  const rate = hourlyRates[serviceType] || 75 // Default to case mgmt rate
  let value = rate * quantity

  // Adjust for quantity units if not hours/beds/sessions
  if (quantityUnit === 'weeks') {
    value *= 7 * 5 // Assume 5 hours per day for 7 days
  } else if (quantityUnit === 'months') {
    value *= 30 * 5 // Approximate
  }

  return Math.round(value)
}

/**
 * Fit Score: Do the inventory and need match in type and quantity?
 * Considers:
 * - Service type match (exact > adjacent > different)
 * - Quantity match (within ±20% is ideal)
 * - Demographic alignment (serving overlapping populations)
 */
export const calculateFitScore = (
  inventory: InventoryItem,
  need: Need,
  fromOrg: Nonprofit,
  toOrg: Nonprofit,
): number => {
  let score = 0

  // 1. Service type match (up to 60 points)
  if (inventory.serviceType === need.serviceType) {
    score += 60
  } else {
    // Check if they're adjacent services (e.g., case_mgmt + job_training both support housing)
    const supportServices = ['case_management', 'job_training']
    const housingServices = [
      'emergency_shelter',
      'transitional_housing',
      'permanent_supportive_housing',
    ]
    const healthServices = [
      'medical_clinic',
      'mental_health_services',
      'substance_abuse_treatment',
      'geriatric_care',
    ]

    const invGroup = [
      ...supportServices,
      ...housingServices,
      ...healthServices,
    ].includes(inventory.serviceType)
      ? supportServices.includes(inventory.serviceType)
        ? 'support'
        : housingServices.includes(inventory.serviceType)
          ? 'housing'
          : 'health'
      : 'other'
    const needGroup = [
      ...supportServices,
      ...housingServices,
      ...healthServices,
    ].includes(need.serviceType)
      ? supportServices.includes(need.serviceType)
        ? 'support'
        : housingServices.includes(need.serviceType)
          ? 'housing'
          : 'health'
      : 'other'

    if (invGroup === needGroup && invGroup !== 'other') {
      score += 30 // Same category but different service
    } else {
      score += 10 // Different categories, minimal match
    }
  }

  // 2. Quantity match (up to 30 points)
  if (inventory.quantityUnit === need.quantityUnit) {
    const ratio = need.quantity / inventory.quantity
    if (ratio >= 0.8 && ratio <= 1.2) {
      score += 30 // Within 20%
    } else if (ratio >= 0.5 && ratio <= 1.5) {
      score += 20 // Within 50%
    } else if (ratio >= 0.3 && ratio <= 2.0) {
      score += 10 // Within 200%
    }
  }

  // 3. Demographic alignment (up to 10 points)
  const invDemos = new Set(inventory.demographics)
  const needDemos = new Set(need.demographics)
  const overlap = [...invDemos].filter((d) => needDemos.has(d)).length
  if (overlap > 0) {
    score += 10
  }

  return Math.min(score, 100)
}

/**
 * Value Score: Is the exchange equitable?
 * Compares monetary value, considering:
 * - Dollar equivalence (both sides see similar value)
 * - Service scarcity (rarer services worth more)
 * - Utilization gaps (excess capacity vs urgent need)
 */
export const calculateValueScore = (
  inventory: InventoryItem,
  need: Need,
  fromOrg: Nonprofit,
  toOrg: Nonprofit,
): number => {
  const invValue = estimateServiceValue(
    inventory.serviceType,
    inventory.quantity,
    inventory.quantityUnit,
  )
  const needValue = estimateServiceValue(
    need.serviceType,
    need.quantity,
    need.quantityUnit,
  )

  // Base: 100 if values are equal, decay from there
  const ratio = Math.min(invValue, needValue) / Math.max(invValue, needValue)
  let score = Math.round(ratio * 100)

  // Adjust for capacity strain
  // If giver is underutilized (has excess), add points
  if (fromOrg.utilizationRate < 0.6) {
    score += 10
  }

  // If receiver is overutilized (has need), add points
  if (toOrg.utilizationRate > 0.85) {
    score += 10
  }

  return Math.min(score, 100)
}

/**
 * Radar Impact Score: Does this match address priority subgroups?
 * Uses real Radar trend data to weight matches:
 * - Age 55+: Rising (29%→33%) → high weight (1.2x)
 * - Families: Declining (↓72%) → lower weight (0.9x)
 * - Veterans: Declining (↓25%) → baseline weight (0.95x)
 * - Housing pressure: Severe → bonus (1.1x)
 */
export const calculateRadarImpactScore = (
  inventory: InventoryItem,
  need: Need,
): number => {
  let score = 50 // Baseline: neutral impact

  // Check which priority demographic this serves
  for (const demo of inventory.demographics) {
    if (demo === RTFHDemographic.AGE_55_PLUS) {
      // Age 55+ rising — high priority
      score = Math.round(score * radarPrioritySignals.age55Plus.weight)
    } else if (demo === RTFHDemographic.FAMILY_WITH_CHILDREN) {
      // Families declining — lower priority
      score = Math.round(score * radarPrioritySignals.families.weight)
    } else if (demo === RTFHDemographic.VETERAN) {
      // Veterans stable with support
      score = Math.round(score * radarPrioritySignals.veterans.weight)
    }
  }

  // Housing services get housing pressure bonus
  const housingServices = [
    'emergency_shelter',
    'transitional_housing',
    'permanent_supportive_housing',
  ]
  if (housingServices.includes(inventory.serviceType)) {
    score = Math.round(score * radarPrioritySignals.housing_pressure.weight)
  }

  return Math.min(score, 100)
}

/**
 * Reputation Score: Do we trust both organizations?
 * Based on:
 * - Historical reputation (0-100 on org profile)
 * - Completed exchanges (more = more trustworthy)
 */
export const calculateReputationScore = (
  fromOrg: Nonprofit,
  toOrg: Nonprofit,
): number => {
  // Average reputation scores
  const avgReputation = (fromOrg.reputationScore + toOrg.reputationScore) / 2

  // Completed exchanges boost score (up to +15)
  const exchangeBoost = Math.min((fromOrg.completedExchanges + toOrg.completedExchanges) * 1.5, 15)

  return Math.min(avgReputation + exchangeBoost, 100)
}

/**
 * Calculate full fairness score for a potential match
 */
export const calculateFairnessScore = (
  inventory: InventoryItem,
  need: Need,
  fromOrg: Nonprofit,
  toOrg: Nonprofit,
): FairnessScoreResult => {
  const fit = calculateFitScore(inventory, need, fromOrg, toOrg)
  const value = calculateValueScore(inventory, need, fromOrg, toOrg)
  const radarImpact = calculateRadarImpactScore(inventory, need)
  const reputation = calculateReputationScore(fromOrg, toOrg)

  // Weighted average: Fit (40%) + Value (35%) + RadarImpact (20%) + Reputation (5%)
  const total = Math.round(fit * 0.4 + value * 0.35 + radarImpact * 0.2 + reputation * 0.05)

  const breakdown: FairnessScoreBreakdown = {
    fit,
    value,
    benefit: (fit + value) / 2, // For display purposes
    radarImpact,
    reputation,
  }

  // Generate reasoning string
  const reasons: string[] = []

  if (fit >= 80) {
    reasons.push('Strong service match')
  } else if (fit >= 60) {
    reasons.push('Good service match')
  } else {
    reasons.push('Partial service match')
  }

  if (value >= 80) {
    reasons.push('Equitable value exchange')
  } else if (value >= 60) {
    reasons.push('Reasonable value balance')
  }

  if (radarImpact >= 70) {
    reasons.push('Addresses priority Radar subgroup')
  }

  if (reputation >= 80) {
    reasons.push('Both orgs have strong track records')
  }

  const reasoning = reasons.join('; ')

  return {
    total,
    breakdown,
    reasoning,
    isProposable: total >= 70,
  }
}
