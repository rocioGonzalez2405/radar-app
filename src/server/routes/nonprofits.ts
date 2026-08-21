/**
 * Nonprofit Routes
 *
 * Endpoints for nonprofit registration, profile management, and listing.
 * These are the foundational endpoints that other systems depend on.
 */

import { Express, Request, Response } from 'express'
import { pool } from '../index'
import { Nonprofit, ServiceType, RTFHDemographic } from '../../shared/data/buyNothingData'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// TYPES
// ============================================================================

interface RegisterNonprofitRequest {
  legalName: string
  operatingName: string
  primaryServices: string[]
  demographics: string[]
  serviceAreaZipCodes: string[]
  bedCapacity: number
  ftesCount: number
}

interface PaginationQuery {
  limit?: string
  offset?: string
}

interface NonprofitFilters extends PaginationQuery {
  serviceType?: string
  demographic?: string
  zip?: string
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateRegisterInput(body: unknown): { valid: boolean; error?: string } {
  const req = body as RegisterNonprofitRequest

  if (!req.legalName || req.legalName.trim().length === 0) {
    return { valid: false, error: 'legalName is required' }
  }

  if (!req.operatingName || req.operatingName.trim().length === 0) {
    return { valid: false, error: 'operatingName is required' }
  }

  if (!Array.isArray(req.primaryServices) || req.primaryServices.length === 0) {
    return { valid: false, error: 'primaryServices must be non-empty array' }
  }

  if (!Array.isArray(req.demographics) || req.demographics.length === 0) {
    return { valid: false, error: 'demographics must be non-empty array' }
  }

  if (!Array.isArray(req.serviceAreaZipCodes) || req.serviceAreaZipCodes.length === 0) {
    return { valid: false, error: 'serviceAreaZipCodes must be non-empty array' }
  }

  if (typeof req.bedCapacity !== 'number' || req.bedCapacity < 0) {
    return { valid: false, error: 'bedCapacity must be non-negative number' }
  }

  if (typeof req.ftesCount !== 'number' || req.ftesCount < 0) {
    return { valid: false, error: 'ftesCount must be non-negative number' }
  }

  // Validate service types
  const validServiceTypes = Object.values(ServiceType)
  for (const svc of req.primaryServices) {
    if (!validServiceTypes.includes(svc as ServiceType)) {
      return { valid: false, error: `Invalid service type: ${svc}` }
    }
  }

  // Validate demographics
  const validDemographics = Object.values(RTFHDemographic)
  for (const demo of req.demographics) {
    if (!validDemographics.includes(demo as RTFHDemographic)) {
      return { valid: false, error: `Invalid demographic: ${demo}` }
    }
  }

  return { valid: true }
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/nonprofits/register
 * Register a new nonprofit in the system
 */
async function registerNonprofit(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateRegisterInput(req.body)
    if (!validation.valid) {
      res.status(400).json({ error: validation.error })
      return
    }

    const {
      legalName,
      operatingName,
      primaryServices,
      demographics,
      serviceAreaZipCodes,
      bedCapacity,
      ftesCount,
    } = req.body as RegisterNonprofitRequest

    const id = uuidv4()
    const now = new Date()

    const query = `
      INSERT INTO nonprofits (
        id, legal_name, operating_name, primary_services, demographics,
        service_area_zip_codes, bed_capacity, utilization_rate, ftes_count,
        reputation_score, completed_exchanges, registered_at, last_verified_at,
        is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `

    const values = [
      id,
      legalName,
      operatingName,
      primaryServices, // PostgreSQL array
      demographics, // PostgreSQL array
      serviceAreaZipCodes, // PostgreSQL array
      bedCapacity,
      0.5, // Default utilization rate
      ftesCount,
      70, // Default reputation score
      0, // No completed exchanges yet
      now,
      now,
      true, // is_active
      now,
      now,
    ]

    const result = await pool.query(query, values)
    const nonprofit = result.rows[0]

    // Log to audit trail
    await logAuditEntry({
      action: 'nonprofit_registered',
      actorType: 'system',
      resourceType: 'nonprofit',
      resourceId: id,
    })

    res.status(201).json({
      id: nonprofit.id,
      legalName: nonprofit.legal_name,
      operatingName: nonprofit.operating_name,
      primaryServices: nonprofit.primary_services,
      demographics: nonprofit.demographics,
      serviceAreaZipCodes: nonprofit.service_area_zip_codes,
      bedCapacity: nonprofit.bed_capacity,
      utilizationRate: nonprofit.utilization_rate,
      ftesCount: nonprofit.ftes_count,
      reputationScore: nonprofit.reputation_score,
      completedExchanges: nonprofit.completed_exchanges,
      registeredAt: nonprofit.registered_at,
      lastVerifiedAt: nonprofit.last_verified_at,
      isActive: nonprofit.is_active,
    })
  } catch (error) {
    console.error('Error registering nonprofit:', error)
    res.status(500).json({ error: 'Failed to register nonprofit' })
  }
}

/**
 * GET /api/nonprofits/:id
 * Get nonprofit profile by ID
 */
async function getNonprofit(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    const query = `
      SELECT * FROM nonprofits
      WHERE id = $1 AND deleted_at IS NULL
    `

    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Nonprofit not found' })
      return
    }

    const nonprofit = result.rows[0]

    res.json({
      id: nonprofit.id,
      legalName: nonprofit.legal_name,
      operatingName: nonprofit.operating_name,
      primaryServices: nonprofit.primary_services,
      demographics: nonprofit.demographics,
      serviceAreaZipCodes: nonprofit.service_area_zip_codes,
      bedCapacity: nonprofit.bed_capacity,
      utilizationRate: nonprofit.utilization_rate,
      ftesCount: nonprofit.ftes_count,
      reputationScore: nonprofit.reputation_score,
      completedExchanges: nonprofit.completed_exchanges,
      registeredAt: nonprofit.registered_at,
      lastVerifiedAt: nonprofit.last_verified_at,
      isActive: nonprofit.is_active,
    })
  } catch (error) {
    console.error('Error fetching nonprofit:', error)
    res.status(500).json({ error: 'Failed to fetch nonprofit' })
  }
}

/**
 * GET /api/nonprofits
 * List all nonprofits with optional filters
 */
async function listNonprofits(req: Request, res: Response): Promise<void> {
  try {
    const { serviceType, demographic, zip, limit = '50', offset = '0' } = req.query as NonprofitFilters

    const limitNum = Math.min(parseInt(limit), 100) // Max 100 per page
    const offsetNum = parseInt(offset)

    let query = `SELECT * FROM nonprofits WHERE deleted_at IS NULL`
    const values: unknown[] = []
    let paramCount = 1

    // Service type filter
    if (serviceType) {
      query += ` AND primary_services @> ARRAY[$${paramCount}]`
      values.push(serviceType)
      paramCount++
    }

    // Demographic filter
    if (demographic) {
      query += ` AND demographics @> ARRAY[$${paramCount}]`
      values.push(demographic)
      paramCount++
    }

    // Zip code filter
    if (zip) {
      query += ` AND service_area_zip_codes @> ARRAY[$${paramCount}]`
      values.push(zip)
      paramCount++
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)')
    const countResult = await pool.query(countQuery, values)
    const total = parseInt(countResult.rows[0].count)

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    values.push(limitNum, offsetNum)

    const result = await pool.query(query, values)

    const nonprofits = result.rows.map((row) => ({
      id: row.id,
      legalName: row.legal_name,
      operatingName: row.operating_name,
      primaryServices: row.primary_services,
      demographics: row.demographics,
      serviceAreaZipCodes: row.service_area_zip_codes,
      bedCapacity: row.bed_capacity,
      utilizationRate: row.utilization_rate,
      ftesCount: row.ftes_count,
      reputationScore: row.reputation_score,
      completedExchanges: row.completed_exchanges,
      registeredAt: row.registered_at,
      lastVerifiedAt: row.last_verified_at,
      isActive: row.is_active,
    }))

    res.json({
      nonprofits,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    })
  } catch (error) {
    console.error('Error listing nonprofits:', error)
    res.status(500).json({ error: 'Failed to list nonprofits' })
  }
}

/**
 * PATCH /api/nonprofits/:id
 * Update nonprofit profile
 */
async function updateNonprofit(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { operatingName, primaryServices, demographics, serviceAreaZipCodes, bedCapacity, ftesCount } = req.body

    // Verify nonprofit exists
    const checkQuery = `SELECT id FROM nonprofits WHERE id = $1 AND deleted_at IS NULL`
    const checkResult = await pool.query(checkQuery, [id])

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Nonprofit not found' })
      return
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: unknown[] = []
    let paramCount = 1

    if (operatingName !== undefined) {
      updates.push(`operating_name = $${paramCount}`)
      values.push(operatingName)
      paramCount++
    }

    if (primaryServices !== undefined) {
      updates.push(`primary_services = $${paramCount}`)
      values.push(primaryServices)
      paramCount++
    }

    if (demographics !== undefined) {
      updates.push(`demographics = $${paramCount}`)
      values.push(demographics)
      paramCount++
    }

    if (serviceAreaZipCodes !== undefined) {
      updates.push(`service_area_zip_codes = $${paramCount}`)
      values.push(serviceAreaZipCodes)
      paramCount++
    }

    if (bedCapacity !== undefined) {
      updates.push(`bed_capacity = $${paramCount}`)
      values.push(bedCapacity)
      paramCount++
    }

    if (ftesCount !== undefined) {
      updates.push(`ftes_count = $${paramCount}`)
      values.push(ftesCount)
      paramCount++
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' })
      return
    }

    updates.push(`updated_at = $${paramCount}`)
    values.push(new Date())
    paramCount++

    values.push(id)

    const query = `
      UPDATE nonprofits
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await pool.query(query, values)
    const nonprofit = result.rows[0]

    // Log to audit trail
    await logAuditEntry({
      action: 'nonprofit_updated',
      actorType: 'system',
      resourceType: 'nonprofit',
      resourceId: id,
    })

    res.json({
      id: nonprofit.id,
      legalName: nonprofit.legal_name,
      operatingName: nonprofit.operating_name,
      primaryServices: nonprofit.primary_services,
      demographics: nonprofit.demographics,
      serviceAreaZipCodes: nonprofit.service_area_zip_codes,
      bedCapacity: nonprofit.bed_capacity,
      utilizationRate: nonprofit.utilization_rate,
      ftesCount: nonprofit.ftes_count,
      reputationScore: nonprofit.reputation_score,
      completedExchanges: nonprofit.completed_exchanges,
      registeredAt: nonprofit.registered_at,
      lastVerifiedAt: nonprofit.last_verified_at,
      isActive: nonprofit.is_active,
    })
  } catch (error) {
    console.error('Error updating nonprofit:', error)
    res.status(500).json({ error: 'Failed to update nonprofit' })
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Log action to audit trail
 */
async function logAuditEntry(entry: {
  action: string
  actorType: string
  resourceType: string
  resourceId: string
}): Promise<void> {
  try {
    const query = `
      INSERT INTO audit_log (id, action, actor_type, resource_type, resource_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `

    await pool.query(query, [
      uuidv4(),
      entry.action,
      entry.actorType,
      entry.resourceType,
      entry.resourceId,
      new Date(),
    ])
  } catch (error) {
    console.error('Error logging to audit trail:', error)
    // Don't throw — audit failure shouldn't break the main operation
  }
}

// ============================================================================
// ROUTE SETUP
// ============================================================================

export default function setupNonprofitRoutes(app: Express): void {
  app.post('/api/nonprofits/register', registerNonprofit)
  app.get('/api/nonprofits/:id', getNonprofit)
  app.get('/api/nonprofits', listNonprofits)
  app.patch('/api/nonprofits/:id', updateNonprofit)
}
