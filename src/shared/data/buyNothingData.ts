/**
 * Buy Nothing Data Models & Schema
 *
 * This module defines all data structures for the Nonprofit Buy Nothing marketplace.
 * Integrated into Radar as native pages within the same app.
 *
 * Data flow:
 * - Radar PIT Count (weekly) → Priority signals (age 55+ rising) → Match prioritization
 * - Buy Nothing trades (real-time) → Store outcomes → Feedback to Radar
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ServiceType {
  // Housing & Shelter
  EMERGENCY_SHELTER = 'emergency_shelter',
  TRANSITIONAL_HOUSING = 'transitional_housing',
  PERMANENT_SUPPORTIVE_HOUSING = 'permanent_supportive_housing',

  // Healthcare
  MEDICAL_CLINIC = 'medical_clinic',
  MENTAL_HEALTH_SERVICES = 'mental_health_services',
  SUBSTANCE_ABUSE_TREATMENT = 'substance_abuse_treatment',
  GERIATRIC_CARE = 'geriatric_care',
  CHRONIC_DISEASE_MGMT = 'chronic_disease_mgmt',

  // Family Services
  CHILDCARE = 'childcare',
  FAMILY_COUNSELING = 'family_counseling',

  // Veteran Services
  VETERAN_HOUSING = 'veteran_housing',
  VETERAN_MENTAL_HEALTH = 'veteran_mental_health',

  // Support Services
  CASE_MANAGEMENT = 'case_management',
  JOB_TRAINING = 'job_training',
  MEALS = 'meals',
  HYGIENE_FACILITIES = 'hygiene_facilities',
}

export enum RTFHDemographic {
  SINGLE_ADULT = 'single_adult',
  FAMILY_WITH_CHILDREN = 'family_with_children',
  UNACCOMPANIED_MINOR = 'unaccompanied_minor',
  VETERAN = 'veteran',
  CHRONICALLY_HOMELESS = 'chronically_homeless',
  AGE_18_24 = 'age_18_24',
  AGE_25_54 = 'age_25_54',
  AGE_55_PLUS = 'age_55_plus',
}

export enum UrgencyLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum MatchStatus {
  PROPOSED = 'proposed',
  NEGOTIATED = 'negotiated',
  ACCEPTED = 'accepted',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Nonprofit {
  id: string
  legalName: string
  operatingName: string
  primaryServices: ServiceType[]
  demographics: RTFHDemographic[]
  serviceAreaZipCodes: string[]
  bedCapacity: number
  utilizationRate: number
  ftesCount: number
  reputationScore: number // 0-100
  completedExchanges: number
  registeredAt: Date
  lastVerifiedAt: Date
  isActive: boolean
}

export interface InventoryItem {
  id: string
  nonprofitId: string
  serviceType: ServiceType
  quantity: number
  quantityUnit: string // 'beds', 'hours', 'units', etc.
  description: string
  demographics: RTFHDemographic[] // Who this serves
  availableFrom: Date
  availableUntil: Date
  createdAt: Date
}

export interface Need {
  id: string
  nonprofitId: string
  serviceType: ServiceType
  quantity: number
  quantityUnit: string
  urgency: UrgencyLevel
  deadline: Date
  demographics: RTFHDemographic[] // Who needs this
  fairnessCriteria: string // What would feel fair?
  createdAt: Date
}

export interface Match {
  id: string
  inventoryId: string // From org
  needId: string // To org
  fromNonprofitId: string
  toNonprofitId: string
  status: MatchStatus
  proposedAt: Date
  fairnessScore: number // 0-100
  fairnessBreakdown: {
    fit: number // Type & quantity match
    value: number // Value equivalence
    benefit: number // Mutual benefit
    radarImpact: number // Addresses priority subgroup
    reputation: number // Trust history
  }
  radarSignal?: string // Which Radar insight triggered this (e.g., "age_55_plus_rising")
  transactionId?: string
}

export interface Transaction {
  id: string
  matchId: string
  fromNonprofitId: string
  toNonprofitId: string
  status: MatchStatus
  whatTransferred: string
  startDate: Date
  expectedEndDate: Date
  actualEndDate?: Date
  peopleServed?: number
  radarDemographic?: RTFHDemographic // Which subgroup this served
  createdAt: Date
}

export interface FairnessRating {
  id: string
  transactionId: string
  ratedByNonprofitId: string
  stars: number // 1-5
  comment: string
  submittedAt: Date
}

// ============================================================================
// PILOT DATA (For MVP)
// ============================================================================

/**
 * Seed data: 10 pilot nonprofits for MVP validation
 * Mix of: size, services, capacity (some excess, some need)
 */
export const pilotNonprofits: Nonprofit[] = [
  {
    id: 'np-001',
    legalName: 'Senior Living Coalition',
    operatingName: 'Senior Living Coalition',
    primaryServices: [ServiceType.GERIATRIC_CARE, ServiceType.PERMANENT_SUPPORTIVE_HOUSING],
    demographics: [RTFHDemographic.AGE_55_PLUS],
    serviceAreaZipCodes: ['92101', '92102', '92103'],
    bedCapacity: 50,
    utilizationRate: 0.85,
    ftesCount: 12,
    reputationScore: 85,
    completedExchanges: 0,
    registeredAt: new Date('2026-08-01'),
    lastVerifiedAt: new Date('2026-08-21'),
    isActive: true,
  },
  {
    id: 'np-002',
    legalName: "Rachel's Promise Center",
    operatingName: "Rachel's Promise",
    primaryServices: [ServiceType.FAMILY_COUNSELING, ServiceType.EMERGENCY_SHELTER],
    demographics: [RTFHDemographic.FAMILY_WITH_CHILDREN],
    serviceAreaZipCodes: ['92104', '92105'],
    bedCapacity: 40,
    utilizationRate: 0.65, // Excess capacity
    ftesCount: 10,
    reputationScore: 78,
    completedExchanges: 0,
    registeredAt: new Date('2026-08-01'),
    lastVerifiedAt: new Date('2026-08-21'),
    isActive: true,
  },
  {
    id: 'np-003',
    legalName: 'San Diego Rescue Mission',
    operatingName: 'SDRM',
    primaryServices: [ServiceType.CASE_MANAGEMENT, ServiceType.JOB_TRAINING, ServiceType.MEALS],
    demographics: [RTFHDemographic.SINGLE_ADULT, RTFHDemographic.VETERAN],
    serviceAreaZipCodes: ['92101', '92102', '92103', '92104'],
    bedCapacity: 120,
    utilizationRate: 0.75,
    ftesCount: 35,
    reputationScore: 92,
    completedExchanges: 0,
    registeredAt: new Date('2026-08-01'),
    lastVerifiedAt: new Date('2026-08-21'),
    isActive: true,
  },
  // Add 7 more for MVP (abbreviated for space)
  ...[
    { name: 'Urban League', services: [ServiceType.JOB_TRAINING, ServiceType.CASE_MANAGEMENT] },
    { name: 'Operation Homeless', services: [ServiceType.EMERGENCY_SHELTER] },
    { name: 'Mental Health Systems', services: [ServiceType.MENTAL_HEALTH_SERVICES] },
    { name: 'Healing Place Collective', services: [ServiceType.SUBSTANCE_ABUSE_TREATMENT] },
    { name: 'Downtown Outreach', services: [ServiceType.CASE_MANAGEMENT, ServiceType.MEALS] },
    { name: 'Family Resource Center', services: [ServiceType.CHILDCARE, ServiceType.FAMILY_COUNSELING] },
    { name: 'Veterans Resource', services: [ServiceType.VETERAN_HOUSING, ServiceType.VETERAN_MENTAL_HEALTH] },
  ].map((org, i) => ({
    id: `np-00${4 + i}`,
    legalName: org.name,
    operatingName: org.name,
    primaryServices: org.services as ServiceType[],
    demographics: [RTFHDemographic.SINGLE_ADULT],
    serviceAreaZipCodes: ['92101', '92102'],
    bedCapacity: Math.random() > 0.5 ? 30 : 60,
    utilizationRate: Math.random() * 0.8 + 0.2,
    ftesCount: 8 + Math.floor(Math.random() * 10),
    reputationScore: 70 + Math.floor(Math.random() * 20),
    completedExchanges: 0,
    registeredAt: new Date('2026-08-01'),
    lastVerifiedAt: new Date('2026-08-21'),
    isActive: true,
  }))
]

/**
 * Sample inventory: What some nonprofits have available
 */
export const sampleInventory: InventoryItem[] = [
  {
    id: 'inv-001',
    nonprofitId: 'np-001', // Senior Living Coalition
    serviceType: ServiceType.GERIATRIC_CARE,
    quantity: 10,
    quantityUnit: 'hours',
    description: 'Medical assessment & care coordination for seniors',
    demographics: [RTFHDemographic.AGE_55_PLUS],
    availableFrom: new Date('2026-08-25'),
    availableUntil: new Date('2026-12-31'),
    createdAt: new Date('2026-08-21'),
  },
  {
    id: 'inv-002',
    nonprofitId: 'np-002', // Rachel's Promise
    serviceType: ServiceType.EMERGENCY_SHELTER,
    quantity: 20,
    quantityUnit: 'beds',
    description: 'Family emergency shelter beds (women & children)',
    demographics: [RTFHDemographic.FAMILY_WITH_CHILDREN],
    availableFrom: new Date('2026-08-25'),
    availableUntil: new Date('2026-10-31'),
    createdAt: new Date('2026-08-21'),
  },
]

/**
 * Sample needs: What some nonprofits are looking for
 */
export const sampleNeeds: Need[] = [
  {
    id: 'need-001',
    nonprofitId: 'np-002', // Rachel's Promise needs case mgmt
    serviceType: ServiceType.CASE_MANAGEMENT,
    quantity: 40,
    quantityUnit: 'hours',
    urgency: UrgencyLevel.HIGH,
    deadline: new Date('2026-09-30'),
    demographics: [RTFHDemographic.FAMILY_WITH_CHILDREN],
    fairnessCriteria: 'Case mgmt hours that help families transition to housing',
    createdAt: new Date('2026-08-21'),
  },
]

/**
 * Radar integration: Priority signals that drive matching
 * These come from the Radar data and inform which trades to prioritize
 */
export const radarPrioritySignals = {
  age55Plus: {
    trend: 'RISING', // 29% -> 33%
    weight: 1.2, // 20% boost to matches serving this group
    rationale: 'Only subgroup getting worse; needs priority',
  },
  families: {
    trend: 'DECLINING', // Down 72%
    weight: 0.9,
    rationale: 'Improving; lower priority for new capacity',
  },
  veterans: {
    trend: 'DECLINING', // Down 25%
    weight: 0.95,
    rationale: 'Improving but still significant; maintain support',
  },
  housing_pressure: {
    rent_monthly: 2606,
    rent_increase_5yr: 22,
    eli_rent_burdened: 79,
    weight: 1.1, // Housing exchanges get priority
    rationale: 'Severe housing pressure; prioritize housing-related trades',
  },
}

/**
 * Helper: Get service type label for UI
 */
export const getServiceTypeLabel = (type: ServiceType): string => {
  const labels: Record<ServiceType, string> = {
    [ServiceType.EMERGENCY_SHELTER]: 'Emergency Shelter',
    [ServiceType.TRANSITIONAL_HOUSING]: 'Transitional Housing',
    [ServiceType.PERMANENT_SUPPORTIVE_HOUSING]: 'Permanent Supportive Housing',
    [ServiceType.MEDICAL_CLINIC]: 'Medical Clinic',
    [ServiceType.MENTAL_HEALTH_SERVICES]: 'Mental Health Services',
    [ServiceType.SUBSTANCE_ABUSE_TREATMENT]: 'Substance Abuse Treatment',
    [ServiceType.GERIATRIC_CARE]: 'Geriatric Care',
    [ServiceType.CHRONIC_DISEASE_MGMT]: 'Chronic Disease Management',
    [ServiceType.CHILDCARE]: 'Childcare',
    [ServiceType.FAMILY_COUNSELING]: 'Family Counseling',
    [ServiceType.VETERAN_HOUSING]: 'Veteran Housing',
    [ServiceType.VETERAN_MENTAL_HEALTH]: 'Veteran Mental Health',
    [ServiceType.CASE_MANAGEMENT]: 'Case Management',
    [ServiceType.JOB_TRAINING]: 'Job Training',
    [ServiceType.MEALS]: 'Meals',
    [ServiceType.HYGIENE_FACILITIES]: 'Hygiene Facilities',
  }
  return labels[type] || type
}

/**
 * Helper: Get demographic label for UI
 */
export const getDemographicLabel = (demo: RTFHDemographic): string => {
  const labels: Record<RTFHDemographic, string> = {
    [RTFHDemographic.SINGLE_ADULT]: 'Single Adult',
    [RTFHDemographic.FAMILY_WITH_CHILDREN]: 'Families with Children',
    [RTFHDemographic.UNACCOMPANIED_MINOR]: 'Unaccompanied Minors',
    [RTFHDemographic.VETERAN]: 'Veterans',
    [RTFHDemographic.CHRONICALLY_HOMELESS]: 'Chronically Homeless',
    [RTFHDemographic.AGE_18_24]: 'Age 18-24',
    [RTFHDemographic.AGE_25_54]: 'Age 25-54',
    [RTFHDemographic.AGE_55_PLUS]: 'Age 55+',
  }
  return labels[demo] || demo
}
