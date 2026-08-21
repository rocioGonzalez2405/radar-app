/**
 * Needs Routes
 *
 * Endpoints for managing needs (what nonprofits are looking for).
 * Needs include urgency levels and deadlines to prioritize matching.
 */

import { Express, Request, Response } from 'express'
import { pool } from '../index'
import { RTFHDemographic, UrgencyLevel } from '../../shared/data/buyNothingData'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// TYPES
// ============================================================================

interface CreateNeedRequest {
  serviceType: string
  quantity: number
  quantityUnit: string
  urgency: string
  deadline: string | Date
  demographics: string[]
  fairnessCriteria: string
}

interface NeedsFilters {
  serviceType?: string
  demographic?: string
  urgency?: string
  limit?: string
  offset?: string
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateCreateNeedInput(body: unknown): { valid: boolean; error?: string } {
  const req = body as CreateNeedRequest

  if (!req.serviceType || req.serviceType.trim().length === 0) {
    return { valid: false, error: 'serviceType is required' }
  }

  if (typeof req.quantity !== 'number' || req.quantity <= 0) {
    return { valid: false, error: 'quantity must be positive number' }
  }

  if (!req.quantityUnit || req.quantityUnit.trim().length === 0) {
    return { valid: false, error: 'quantityUnit is required' }
  }

  const validUrgencies = Object.values(UrgencyLevel)
  if (!validUrgencies.includes(req.urgency as UrgencyLevel)) {
    return { valid: false, error: `urgency must be one of: ${validUrgencies.join(', ')}` }
  }

  if (!req.deadline) {
    return { valid: false, error: 'deadline is required' }
  }

  const deadline = new Date(req.deadline)
  if (isNaN(deadline.getTime())) {
    return { valid: false, error: 'deadline must be valid ISO date' }
  }

  if (deadline <= new Date()) {
    return { valid: false, error: 'deadline must be in the future' }
  }

  if (!Array.isArray(req.demographics) || req.demographics.length === 0) {
    return { valid: false, error: 'demographics must be non-empty array' }
  }

  const validDemographics = Object.values(RTFHDemographic)
  for (const demo of req.demographics) {
    if (!validDemographics.includes(demo as RTFHDemographic)) {
      return { valid: false, error: `Invalid demographic: ${demo}` }
    }
  }

  if (!req.fairnessCriteria || req.fairnessCriteria.trim().length === 0) {
    return { valid: false, error: 'fairnessCriteria is required' }
  }

  return { valid: true }
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/nonprofits/:nonprofitId/needs
 * Post a need
 */
async function createNeed(req: Request, res: Response): Promise<void> {
  try {
    const { nonprofitId } = req.params

    // Verify nonprofit exists
    const checkQuery = `SELECT id FROM nonprofits WHERE id = $1 AND deleted_at IS NULL`
    const checkResult = await pool.query(checkQuery, [nonprofitId])

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Nonprofit not found' })
      return
    }

    const validation = validateCreateNeedInput(req.body)
    if (!validation.valid) {
      res.status(400).json({ error: validation.error })
      return
    }

    const {
      serviceType,
      quantity,
      quantityUnit,
      urgency,
      deadline,
      demographics,
      fairnessCriteria,
    } = req.body as CreateNeedRequest

    const id = uuidv4()
    const now = new Date()

    const query = `
      INSERT INTO needs (
        id, nonprofit_id, service_type, quantity, quantity_unit,
        urgency, deadline, demographics, fairness_criteria,
        is_open, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `

    const values = [
      id,
      nonprofitId,
      serviceType,
      quantity,
      quantityUnit,
      urgency,
      new Date(deadline),
      demographics,
      fairnessCriteria,
      true, // is_open
      now,
      now,
    ]

    const result = await pool.query(query, values)
    const need = result.rows[0]

    // Audit log
    await logAuditEntry({
      action: 'need_created',
      actorType: 'nonprofit',
      actorId: nonprofitId,
      resourceType: 'need',
      resourceId: id,
    })

    res.status(201).json({
      id: need.id,
      nonprofitId: need.nonprofit_id,
      serviceType: need.service_type,
      quantity: need.quantity,
      quantityUnit: need.quantity_unit,
      urgency: need.urgency,
      deadline: need.deadline,
      demographics: need.demographics,
      fairnessCriteria: need.fairness_criteria,
      createdAt: need.created_at,
    })
  } catch (error) {
    console.error('Error creating need:', error)
    res.status(500).json({ error: 'Failed to create need' })
  }
}

/**
 * GET /api/nonprofits/:nonprofitId/needs
 * List needs for a nonprofit
 */
async function listNeedsForNonprofit(req: Request, res: Response): Promise<void> {
  try {
    const { nonprofitId } = req.params
    const { limit = '50', offset = '0' } = req.query

    const limitNum = Math.min(parseInt(limit as string), 100)
    const offsetNum = parseInt(offset as string)

    // Verify nonprofit exists
    const checkQuery = `SELECT id FROM nonprofits WHERE id = $1 AND deleted_at IS NULL`
    const checkResult = await pool.query(checkQuery, [nonprofitId])

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Nonprofit not found' })
      return
    }

    const query = `
      SELECT * FROM needs
      WHERE nonprofit_id = $1 AND deleted_at IS NULL
      ORDER BY urgency DESC, deadline ASC
      LIMIT $2 OFFSET $3
    `

    const countQuery = `
      SELECT COUNT(*) FROM needs
      WHERE nonprofit_id = $1 AND deleted_at IS NULL
    `

    const result = await pool.query(query, [nonprofitId, limitNum, offsetNum])
    const countResult = await pool.query(countQuery, [nonprofitId])
    const total = parseInt(countResult.rows[0].count)

    const needs = result.rows.map((row) => ({
      id: row.id,
      nonprofitId: row.nonprofit_id,
      serviceType: row.service_type,
      quantity: row.quantity,
      quantityUnit: row.quantity_unit,
      urgency: row.urgency,
      deadline: row.deadline,
      demographics: row.demographics,
      fairnessCriteria: row.fairness_criteria,
      createdAt: row.created_at,
    }))

    res.json({
      needs,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    })
  } catch (error) {
    console.error('Error listing needs:', error)
    res.status(500).json({ error: 'Failed to list needs' })
  }
}

/**
 * GET /api/needs/:id
 * Get specific need
 */
async function getNeed(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    const query = `SELECT * FROM needs WHERE id = $1 AND deleted_at IS NULL`
    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Need not found' })
      return
    }

    const need = result.rows[0]

    res.json({
      id: need.id,
      nonprofitId: need.nonprofit_id,
      serviceType: need.service_type,
      quantity: need.quantity,
      quantityUnit: need.quantity_unit,
      urgency: need.urgency,
      deadline: need.deadline,
      demographics: need.demographics,
      fairnessCriteria: need.fairness_criteria,
      createdAt: need.created_at,
    })
  } catch (error) {
    console.error('Error fetching need:', error)
    res.status(500).json({ error: 'Failed to fetch need' })
  }
}

/**
 * GET /api/needs/search
 * Search open needs across all nonprofits
 */
async function searchNeeds(req: Request, res: Response): Promise<void> {
  try {
    const { serviceType, demographic, urgency, limit = '50', offset = '0' } = req.query as NeedsFilters

    const limitNum = Math.min(parseInt(limit), 100)
    const offsetNum = parseInt(offset)

    let query = `
      SELECT n.*, np.operating_name
      FROM needs n
      JOIN nonprofits np ON n.nonprofit_id = np.id
      WHERE n.deleted_at IS NULL
        AND n.is_open = true
        AND n.deadline > NOW()
        AND np.deleted_at IS NULL
    `
    const values: unknown[] = []
    let paramCount = 1

    if (serviceType) {
      query += ` AND n.service_type = $${paramCount}`
      values.push(serviceType)
      paramCount++
    }

    if (demographic) {
      query += ` AND n.demographics @> ARRAY[$${paramCount}]`
      values.push(demographic)
      paramCount++
    }

    if (urgency) {
      query += ` AND n.urgency = $${paramCount}`
      values.push(urgency)
      paramCount++
    }

    // Get total count
    const countQuery = query.replace('SELECT n.*, np.operating_name', 'SELECT COUNT(*)')
    const countResult = await pool.query(countQuery, values)
    const total = parseInt(countResult.rows[0].count)

    // Add ordering and pagination
    query += ` ORDER BY n.urgency DESC, n.deadline ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    values.push(limitNum, offsetNum)

    const result = await pool.query(query, values)

    const needs = result.rows.map((row) => ({
      id: row.id,
      nonprofitId: row.nonprofit_id,
      nonprofitName: row.operating_name,
      serviceType: row.service_type,
      quantity: row.quantity,
      quantityUnit: row.quantity_unit,
      urgency: row.urgency,
      deadline: row.deadline,
      demographics: row.demographics,
      fairnessCriteria: row.fairness_criteria,
      createdAt: row.created_at,
    }))

    res.json({
      needs,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    })
  } catch (error) {
    console.error('Error searching needs:', error)
    res.status(500).json({ error: 'Failed to search needs' })
  }
}

/**
 * DELETE /api/needs/:id
 * Remove need (soft delete)
 */
async function deleteNeed(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    const query = `
      UPDATE needs
      SET deleted_at = NOW(), is_open = false
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `

    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Need not found' })
      return
    }

    // Audit log
    await logAuditEntry({
      action: 'need_deleted',
      actorType: 'nonprofit',
      resourceType: 'need',
      resourceId: id,
    })

    res.json({ message: 'Need deleted', id })
  } catch (error) {
    console.error('Error deleting need:', error)
    res.status(500).json({ error: 'Failed to delete need' })
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function logAuditEntry(entry: {
  action: string
  actorType: string
  actorId?: string
  resourceType: string
  resourceId: string
}): Promise<void> {
  try {
    const query = `
      INSERT INTO audit_log (id, action, actor_type, actor_id, resource_type, resource_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `

    await pool.query(query, [
      uuidv4(),
      entry.action,
      entry.actorType,
      entry.actorId || null,
      entry.resourceType,
      entry.resourceId,
      new Date(),
    ])
  } catch (error) {
    console.error('Error logging to audit trail:', error)
  }
}

// ============================================================================
// ROUTE SETUP
// ============================================================================

export default function setupNeedsRoutes(app: Express): void {
  app.post('/api/nonprofits/:nonprofitId/needs', createNeed)
  app.get('/api/nonprofits/:nonprofitId/needs', listNeedsForNonprofit)
  app.get('/api/needs/:id', getNeed)
  app.get('/api/needs/search', searchNeeds)
  app.delete('/api/needs/:id', deleteNeed)
}
