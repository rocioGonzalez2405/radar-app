/**
 * Inventory Routes
 *
 * Endpoints for managing inventory items (what nonprofits have available).
 * Inventory items are timestamped and can be searched by service type, demographics, and location.
 */

import type { Express, Request, Response } from 'express'
import { pool } from '../index'
import { InventoryItem, ServiceType, RTFHDemographic } from '../../shared/data/buyNothingData'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// TYPES
// ============================================================================

interface CreateInventoryRequest {
  serviceType: string
  quantity: number
  quantityUnit: string
  description: string
  demographics: string[]
  availableFrom: string | Date
  availableUntil: string | Date
}

interface InventoryFilters {
  serviceType?: string
  demographic?: string
  zip?: string
  limit?: string
  offset?: string
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateCreateInventoryInput(body: unknown): { valid: boolean; error?: string } {
  const req = body as CreateInventoryRequest

  if (!req.serviceType || req.serviceType.trim().length === 0) {
    return { valid: false, error: 'serviceType is required' }
  }

  if (typeof req.quantity !== 'number' || req.quantity <= 0) {
    return { valid: false, error: 'quantity must be positive number' }
  }

  if (!req.quantityUnit || req.quantityUnit.trim().length === 0) {
    return { valid: false, error: 'quantityUnit is required' }
  }

  if (!req.description || req.description.trim().length === 0) {
    return { valid: false, error: 'description is required' }
  }

  if (!Array.isArray(req.demographics) || req.demographics.length === 0) {
    return { valid: false, error: 'demographics must be non-empty array' }
  }

  if (!req.availableFrom) {
    return { valid: false, error: 'availableFrom is required' }
  }

  if (!req.availableUntil) {
    return { valid: false, error: 'availableUntil is required' }
  }

  const fromDate = new Date(req.availableFrom)
  const untilDate = new Date(req.availableUntil)

  if (isNaN(fromDate.getTime())) {
    return { valid: false, error: 'availableFrom must be valid ISO date' }
  }

  if (isNaN(untilDate.getTime())) {
    return { valid: false, error: 'availableUntil must be valid ISO date' }
  }

  if (untilDate <= fromDate) {
    return { valid: false, error: 'availableUntil must be after availableFrom' }
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
 * POST /api/nonprofits/:nonprofitId/inventory
 * Add an inventory item
 */
async function createInventory(req: Request, res: Response): Promise<void> {
  try {
    const { nonprofitId } = req.params

    // Verify nonprofit exists
    const checkQuery = `SELECT id FROM nonprofits WHERE id = $1 AND deleted_at IS NULL`
    const checkResult = await pool.query(checkQuery, [nonprofitId])

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Nonprofit not found' })
      return
    }

    const validation = validateCreateInventoryInput(req.body)
    if (!validation.valid) {
      res.status(400).json({ error: validation.error })
      return
    }

    const {
      serviceType,
      quantity,
      quantityUnit,
      description,
      demographics,
      availableFrom,
      availableUntil,
    } = req.body as CreateInventoryRequest

    const id = uuidv4()
    const now = new Date()

    const query = `
      INSERT INTO inventory_items (
        id, nonprofit_id, service_type, quantity, quantity_unit,
        description, demographics, available_from, available_until,
        is_available, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `

    const values = [
      id,
      nonprofitId,
      serviceType,
      quantity,
      quantityUnit,
      description,
      demographics,
      new Date(availableFrom),
      new Date(availableUntil),
      true, // is_available
      now,
      now,
    ]

    const result = await pool.query(query, values)
    const item = result.rows[0]

    // Audit log
    await logAuditEntry({
      action: 'inventory_created',
      actorType: 'nonprofit',
      actorId: nonprofitId,
      resourceType: 'inventory',
      resourceId: id,
    })

    res.status(201).json({
      id: item.id,
      nonprofitId: item.nonprofit_id,
      serviceType: item.service_type,
      quantity: item.quantity,
      quantityUnit: item.quantity_unit,
      description: item.description,
      demographics: item.demographics,
      availableFrom: item.available_from,
      availableUntil: item.available_until,
      createdAt: item.created_at,
    })
  } catch (error) {
    console.error('Error creating inventory:', error)
    res.status(500).json({ error: 'Failed to create inventory' })
  }
}

/**
 * GET /api/nonprofits/:nonprofitId/inventory
 * List inventory for a nonprofit
 */
async function listInventoryForNonprofit(req: Request, res: Response): Promise<void> {
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
      SELECT * FROM inventory_items
      WHERE nonprofit_id = $1 AND deleted_at IS NULL
      ORDER BY available_from DESC
      LIMIT $2 OFFSET $3
    `

    const countQuery = `
      SELECT COUNT(*) FROM inventory_items
      WHERE nonprofit_id = $1 AND deleted_at IS NULL
    `

    const result = await pool.query(query, [nonprofitId, limitNum, offsetNum])
    const countResult = await pool.query(countQuery, [nonprofitId])
    const total = parseInt(countResult.rows[0].count)

    const items = result.rows.map((row) => ({
      id: row.id,
      nonprofitId: row.nonprofit_id,
      serviceType: row.service_type,
      quantity: row.quantity,
      quantityUnit: row.quantity_unit,
      description: row.description,
      demographics: row.demographics,
      availableFrom: row.available_from,
      availableUntil: row.available_until,
      createdAt: row.created_at,
    }))

    res.json({
      items,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    })
  } catch (error) {
    console.error('Error listing inventory:', error)
    res.status(500).json({ error: 'Failed to list inventory' })
  }
}

/**
 * GET /api/inventory/:id
 * Get specific inventory item
 */
async function getInventory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    const query = `SELECT * FROM inventory_items WHERE id = $1 AND deleted_at IS NULL`
    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Inventory item not found' })
      return
    }

    const item = result.rows[0]

    res.json({
      id: item.id,
      nonprofitId: item.nonprofit_id,
      serviceType: item.service_type,
      quantity: item.quantity,
      quantityUnit: item.quantity_unit,
      description: item.description,
      demographics: item.demographics,
      availableFrom: item.available_from,
      availableUntil: item.available_until,
      createdAt: item.created_at,
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
}

/**
 * GET /api/inventory/search
 * Search available inventory across all nonprofits
 */
async function searchInventory(req: Request, res: Response): Promise<void> {
  try {
    const { serviceType, demographic, zip, limit = '50', offset = '0' } = req.query as InventoryFilters

    const limitNum = Math.min(parseInt(limit), 100)
    const offsetNum = parseInt(offset)

    let query = `
      SELECT i.*, n.operating_name
      FROM inventory_items i
      JOIN nonprofits n ON i.nonprofit_id = n.id
      WHERE i.deleted_at IS NULL
        AND i.is_available = true
        AND i.available_from <= NOW()
        AND i.available_until > NOW()
        AND n.deleted_at IS NULL
    `
    const values: unknown[] = []
    let paramCount = 1

    if (serviceType) {
      query += ` AND i.service_type = $${paramCount}`
      values.push(serviceType)
      paramCount++
    }

    if (demographic) {
      query += ` AND i.demographics @> ARRAY[$${paramCount}]`
      values.push(demographic)
      paramCount++
    }

    if (zip) {
      query += ` AND n.service_area_zip_codes @> ARRAY[$${paramCount}]`
      values.push(zip)
      paramCount++
    }

    // Get total count
    const countQuery = query.replace('SELECT i.*, n.operating_name', 'SELECT COUNT(*)')
    const countResult = await pool.query(countQuery, values)
    const total = parseInt(countResult.rows[0].count)

    // Add ordering and pagination
    query += ` ORDER BY i.available_from DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    values.push(limitNum, offsetNum)

    const result = await pool.query(query, values)

    const items = result.rows.map((row) => ({
      id: row.id,
      nonprofitId: row.nonprofit_id,
      nonprofitName: row.operating_name,
      serviceType: row.service_type,
      quantity: row.quantity,
      quantityUnit: row.quantity_unit,
      description: row.description,
      demographics: row.demographics,
      availableFrom: row.available_from,
      availableUntil: row.available_until,
      createdAt: row.created_at,
    }))

    res.json({
      items,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    })
  } catch (error) {
    console.error('Error searching inventory:', error)
    res.status(500).json({ error: 'Failed to search inventory' })
  }
}

/**
 * DELETE /api/inventory/:id
 * Remove inventory item (soft delete)
 */
async function deleteInventory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    const query = `
      UPDATE inventory_items
      SET deleted_at = NOW(), is_available = false
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `

    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Inventory item not found' })
      return
    }

    // Audit log
    await logAuditEntry({
      action: 'inventory_deleted',
      actorType: 'nonprofit',
      resourceType: 'inventory',
      resourceId: id,
    })

    res.json({ message: 'Inventory item deleted', id })
  } catch (error) {
    console.error('Error deleting inventory:', error)
    res.status(500).json({ error: 'Failed to delete inventory' })
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

export default function setupInventoryRoutes(app: Express): void {
  app.post('/api/nonprofits/:nonprofitId/inventory', createInventory)
  app.get('/api/nonprofits/:nonprofitId/inventory', listInventoryForNonprofit)
  app.get('/api/inventory/search', searchInventory)
  app.get('/api/inventory/:id', getInventory)
  app.delete('/api/inventory/:id', deleteInventory)
}
