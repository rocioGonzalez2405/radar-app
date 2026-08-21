/**
 * Match Routes
 *
 * Endpoints for matching inventory to needs.
 * Uses the fairness scoring algorithm to rank matches.
 * Supports proposal, acceptance, rejection, and execution workflows.
 */

import { Express, Request, Response } from 'express'
import { pool } from '../index'
import { MatchStatus } from '../../shared/data/buyNothingData'
import { calculateFairnessScore } from '../fairnessScoring'
import { findMatchesForNeed, findMatchesForInventory } from '../matchingEngine'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// TYPES
// ============================================================================

interface ProposeMatchRequest {
  inventoryId: string
  needId: string
  proposalNote?: string
}

interface MatchActionRequest {
  nonprofitId: string
  note?: string
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
  changes?: Record<string, unknown>
}): Promise<void> {
  try {
    const query = `
      INSERT INTO audit_log (id, action, actor_type, actor_id, resource_type, resource_id, changes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `

    await pool.query(query, [
      uuidv4(),
      entry.action,
      entry.actorType,
      entry.actorId || null,
      entry.resourceType,
      entry.resourceId,
      entry.changes ? JSON.stringify(entry.changes) : null,
      new Date(),
    ])
  } catch (error) {
    console.error('Error logging to audit trail:', error)
  }
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/matches
 * List all potential matches (admin view), sorted by fairness score
 */
async function listAllMatches(req: Request, res: Response): Promise<void> {
  try {
    const { status, minScore = '70', limit = '50', offset = '0' } = req.query

    const limitNum = Math.min(parseInt(limit as string), 100)
    const offsetNum = parseInt(offset as string)
    const minScoreNum = parseInt(minScore as string)

    let query = `
      SELECT m.*,
             ni.service_type as inv_service_type, ni.quantity as inv_quantity,
             nd.service_type as need_service_type, nd.quantity as need_quantity,
             fnp.operating_name as from_nonprofit_name,
             tnp.operating_name as to_nonprofit_name
      FROM matches m
      JOIN inventory_items ni ON m.inventory_id = ni.id
      JOIN needs nd ON m.need_id = nd.id
      JOIN nonprofits fnp ON m.from_nonprofit_id = fnp.id
      JOIN nonprofits tnp ON m.to_nonprofit_id = tnp.id
      WHERE m.deleted_at IS NULL
        AND m.fairness_score >= $1
    `
    const values: unknown[] = [minScoreNum]
    let paramCount = 2

    if (status) {
      query += ` AND m.status = $${paramCount}`
      values.push(status)
      paramCount++
    }

    // Get total count
    const countQuery = query.replace('SELECT m.*,', 'SELECT COUNT(*)')
      .replace(/JOIN.*nonprofits tnp.*WHERE/, 'WHERE')
      .substring(0, query.indexOf('JOIN') - 1)
      .replace('SELECT COUNT(*)', 'SELECT COUNT(*) FROM matches m WHERE m.deleted_at IS NULL AND m.fairness_score >= $1')

    const countResult = await pool.query(countQuery, [minScoreNum])
    const total = parseInt(countResult.rows[0].count)

    // Add ordering and pagination
    query += ` ORDER BY m.fairness_score DESC, m.proposed_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    values.push(limitNum, offsetNum)

    const result = await pool.query(query, values)

    const matches = result.rows.map((row) => ({
      id: row.id,
      inventoryId: row.inventory_id,
      needId: row.need_id,
      fromNonprofitId: row.from_nonprofit_id,
      fromNonprofitName: row.from_nonprofit_name,
      toNonprofitId: row.to_nonprofit_id,
      toNonprofitName: row.to_nonprofit_name,
      status: row.status,
      proposedAt: row.proposed_at,
      acceptedAt: row.accepted_at,
      fairnessScore: row.fairness_score,
      fairnessBreakdown: row.fairness_breakdown,
      radarSignal: row.radar_signal,
      inventory: {
        serviceType: row.inv_service_type,
        quantity: row.inv_quantity,
      },
      need: {
        serviceType: row.need_service_type,
        quantity: row.need_quantity,
      },
    }))

    res.json({
      matches,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    })
  } catch (error) {
    console.error('Error listing matches:', error)
    res.status(500).json({ error: 'Failed to list matches' })
  }
}

/**
 * GET /api/nonprofits/:nonprofitId/matches
 * Get matches relevant to a nonprofit (incoming and outgoing)
 */
async function listMatchesForNonprofit(req: Request, res: Response): Promise<void> {
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

    // Get incoming matches (they are the recipient)
    const incomingQuery = `
      SELECT m.* FROM matches m
      WHERE m.deleted_at IS NULL
        AND m.to_nonprofit_id = $1
      ORDER BY m.fairness_score DESC, m.proposed_at DESC
      LIMIT $2 OFFSET $3
    `

    // Get outgoing matches (they are the giver)
    const outgoingQuery = `
      SELECT m.* FROM matches m
      WHERE m.deleted_at IS NULL
        AND m.from_nonprofit_id = $1
      ORDER BY m.fairness_score DESC, m.proposed_at DESC
      LIMIT $2 OFFSET $3
    `

    const [incomingResult, outgoingResult] = await Promise.all([
      pool.query(incomingQuery, [nonprofitId, limitNum, offsetNum]),
      pool.query(outgoingQuery, [nonprofitId, limitNum, offsetNum]),
    ])

    const formatMatches = (rows: unknown[]) =>
      (rows as any[]).map((row) => ({
        id: row.id,
        inventoryId: row.inventory_id,
        needId: row.need_id,
        fromNonprofitId: row.from_nonprofit_id,
        toNonprofitId: row.to_nonprofit_id,
        status: row.status,
        proposedAt: row.proposed_at,
        fairnessScore: row.fairness_score,
        fairnessBreakdown: row.fairness_breakdown,
        radarSignal: row.radar_signal,
      }))

    res.json({
      incoming: formatMatches(incomingResult.rows),
      outgoing: formatMatches(outgoingResult.rows),
    })
  } catch (error) {
    console.error('Error listing nonprofit matches:', error)
    res.status(500).json({ error: 'Failed to list nonprofit matches' })
  }
}

/**
 * GET /api/matches/:id
 * Get specific match with full details
 */
async function getMatch(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    const query = `
      SELECT m.*,
             ni.*,
             nd.*,
             fnp.operating_name as from_nonprofit_name,
             tnp.operating_name as to_nonprofit_name
      FROM matches m
      JOIN inventory_items ni ON m.inventory_id = ni.id
      JOIN needs nd ON m.need_id = nd.id
      JOIN nonprofits fnp ON m.from_nonprofit_id = fnp.id
      JOIN nonprofits tnp ON m.to_nonprofit_id = tnp.id
      WHERE m.id = $1 AND m.deleted_at IS NULL
    `

    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Match not found' })
      return
    }

    const row = result.rows[0]

    res.json({
      id: row.id,
      inventoryId: row.inventory_id,
      needId: row.need_id,
      fromNonprofitId: row.from_nonprofit_id,
      fromNonprofitName: row.from_nonprofit_name,
      toNonprofitId: row.to_nonprofit_id,
      toNonprofitName: row.to_nonprofit_name,
      status: row.status,
      proposedAt: row.proposed_at,
      acceptedAt: row.accepted_at,
      fairnessScore: row.fairness_score,
      fairnessBreakdown: row.fairness_breakdown,
      fairnessReasoning: row.fairness_reasoning,
      radarSignal: row.radar_signal,
      transactionId: row.transaction_id,
      inventory: {
        serviceType: row.service_type,
        quantity: row.quantity,
        quantityUnit: row.quantity_unit,
        description: row.description,
      },
      need: {
        serviceType: row.service_type,
        quantity: row.quantity,
        quantityUnit: row.quantity_unit,
        urgency: row.urgency,
        deadline: row.deadline,
      },
    })
  } catch (error) {
    console.error('Error fetching match:', error)
    res.status(500).json({ error: 'Failed to fetch match' })
  }
}

/**
 * POST /api/matches
 * Admin proposes a new match
 */
async function proposeMatch(req: Request, res: Response): Promise<void> {
  try {
    const { inventoryId, needId, proposalNote } = req.body as ProposeMatchRequest

    if (!inventoryId || !needId) {
      res.status(400).json({ error: 'inventoryId and needId are required' })
      return
    }

    // Get inventory and need
    const [inventoryResult, needResult] = await Promise.all([
      pool.query(`SELECT * FROM inventory_items WHERE id = $1 AND deleted_at IS NULL`, [inventoryId]),
      pool.query(`SELECT * FROM needs WHERE id = $1 AND deleted_at IS NULL`, [needId]),
    ])

    if (inventoryResult.rows.length === 0) {
      res.status(404).json({ error: 'Inventory item not found' })
      return
    }

    if (needResult.rows.length === 0) {
      res.status(404).json({ error: 'Need not found' })
      return
    }

    const inventory = inventoryResult.rows[0]
    const need = needResult.rows[0]

    // Can't match the same org
    if (inventory.nonprofit_id === need.nonprofit_id) {
      res.status(400).json({ error: 'Cannot match inventory and need from same nonprofit' })
      return
    }

    // Check for existing match
    const existingMatch = await pool.query(
      `SELECT id FROM matches WHERE inventory_id = $1 AND need_id = $2 AND deleted_at IS NULL`,
      [inventoryId, needId]
    )

    if (existingMatch.rows.length > 0) {
      res.status(400).json({ error: 'Match already exists for this inventory and need' })
      return
    }

    // Get orgs for fairness scoring
    const [fromOrgResult, toOrgResult] = await Promise.all([
      pool.query(`SELECT * FROM nonprofits WHERE id = $1 AND deleted_at IS NULL`, [inventory.nonprofit_id]),
      pool.query(`SELECT * FROM nonprofits WHERE id = $1 AND deleted_at IS NULL`, [need.nonprofit_id]),
    ])

    if (fromOrgResult.rows.length === 0 || toOrgResult.rows.length === 0) {
      res.status(400).json({ error: 'One or both nonprofits not found' })
      return
    }

    const fromOrg = fromOrgResult.rows[0]
    const toOrg = toOrgResult.rows[0]

    // Calculate fairness score (convert DB rows to our interface)
    const fairnessResult = calculateFairnessScore(
      {
        id: inventory.id,
        nonprofitId: inventory.nonprofit_id,
        serviceType: inventory.service_type,
        quantity: inventory.quantity,
        quantityUnit: inventory.quantity_unit,
        description: inventory.description,
        demographics: inventory.demographics,
        availableFrom: inventory.available_from,
        availableUntil: inventory.available_until,
        createdAt: inventory.created_at,
      },
      {
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
      },
      {
        id: fromOrg.id,
        legalName: fromOrg.legal_name,
        operatingName: fromOrg.operating_name,
        primaryServices: fromOrg.primary_services,
        demographics: fromOrg.demographics,
        serviceAreaZipCodes: fromOrg.service_area_zip_codes,
        bedCapacity: fromOrg.bed_capacity,
        utilizationRate: fromOrg.utilization_rate,
        ftesCount: fromOrg.ftes_count,
        reputationScore: fromOrg.reputation_score,
        completedExchanges: fromOrg.completed_exchanges,
        registeredAt: fromOrg.registered_at,
        lastVerifiedAt: fromOrg.last_verified_at,
        isActive: fromOrg.is_active,
      },
      {
        id: toOrg.id,
        legalName: toOrg.legal_name,
        operatingName: toOrg.operating_name,
        primaryServices: toOrg.primary_services,
        demographics: toOrg.demographics,
        serviceAreaZipCodes: toOrg.service_area_zip_codes,
        bedCapacity: toOrg.bed_capacity,
        utilizationRate: toOrg.utilization_rate,
        ftesCount: toOrg.ftes_count,
        reputationScore: toOrg.reputation_score,
        completedExchanges: toOrg.completed_exchanges,
        registeredAt: toOrg.registered_at,
        lastVerifiedAt: toOrg.last_verified_at,
        isActive: toOrg.is_active,
      }
    )

    // Create match
    const matchId = uuidv4()
    const now = new Date()

    const insertQuery = `
      INSERT INTO matches (
        id, inventory_id, need_id, from_nonprofit_id, to_nonprofit_id,
        status, proposed_at, fairness_score, fairness_breakdown,
        fairness_reasoning, radar_signal, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `

    const values = [
      matchId,
      inventoryId,
      needId,
      inventory.nonprofit_id,
      need.nonprofit_id,
      MatchStatus.PROPOSED,
      now,
      fairnessResult.total,
      JSON.stringify(fairnessResult.breakdown),
      fairnessResult.reasoning,
      fairnessResult.breakdown.radarImpact > 60 ? 'high_impact' : 'standard',
      now,
      now,
    ]

    const matchResult = await pool.query(insertQuery, values)
    const match = matchResult.rows[0]

    // Audit log
    await logAuditEntry({
      action: 'match_proposed',
      actorType: 'admin',
      resourceType: 'match',
      resourceId: matchId,
      changes: {
        score: fairnessResult.total,
        fromNonprofit: inventory.nonprofit_id,
        toNonprofit: need.nonprofit_id,
      },
    })

    res.status(201).json({
      id: match.id,
      inventoryId: match.inventory_id,
      needId: match.need_id,
      fromNonprofitId: match.from_nonprofit_id,
      toNonprofitId: match.to_nonprofit_id,
      status: match.status,
      proposedAt: match.proposed_at,
      fairnessScore: match.fairness_score,
      fairnessBreakdown: JSON.parse(match.fairness_breakdown),
      fairnessReasoning: match.fairness_reasoning,
      radarSignal: match.radar_signal,
      isProposable: fairnessResult.isProposable,
    })
  } catch (error) {
    console.error('Error proposing match:', error)
    res.status(500).json({ error: 'Failed to propose match' })
  }
}

/**
 * PATCH /api/matches/:id/accept
 * Nonprofit accepts a proposed match
 */
async function acceptMatch(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { nonprofitId, note } = req.body as MatchActionRequest

    if (!nonprofitId) {
      res.status(400).json({ error: 'nonprofitId is required' })
      return
    }

    // Get match
    const matchResult = await pool.query(
      `SELECT * FROM matches WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )

    if (matchResult.rows.length === 0) {
      res.status(404).json({ error: 'Match not found' })
      return
    }

    const match = matchResult.rows[0]

    // Verify nonprofit is one of the parties
    if (nonprofitId !== match.from_nonprofit_id && nonprofitId !== match.to_nonprofit_id) {
      res.status(403).json({ error: 'This nonprofit is not part of this match' })
      return
    }

    // Update status to NEGOTIATED if first accept, or ACCEPTED if both
    // For MVP, we'll just move to NEGOTIATED and require both to accept
    const query = `
      UPDATE matches
      SET status = $1, accepted_at = NOW(), updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `

    const result = await pool.query(query, [MatchStatus.NEGOTIATED, id])

    // Audit log
    await logAuditEntry({
      action: 'match_accepted',
      actorType: 'nonprofit',
      actorId: nonprofitId,
      resourceType: 'match',
      resourceId: id,
    })

    res.json({
      id: result.rows[0].id,
      status: result.rows[0].status,
      acceptedAt: result.rows[0].accepted_at,
      message: 'Match accepted. Awaiting acceptance from other party.',
    })
  } catch (error) {
    console.error('Error accepting match:', error)
    res.status(500).json({ error: 'Failed to accept match' })
  }
}

/**
 * PATCH /api/matches/:id/reject
 * Nonprofit rejects a proposed match
 */
async function rejectMatch(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { nonprofitId, note } = req.body as MatchActionRequest

    if (!nonprofitId) {
      res.status(400).json({ error: 'nonprofitId is required' })
      return
    }

    // Get match
    const matchResult = await pool.query(
      `SELECT * FROM matches WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )

    if (matchResult.rows.length === 0) {
      res.status(404).json({ error: 'Match not found' })
      return
    }

    const match = matchResult.rows[0]

    // Verify nonprofit is one of the parties
    if (nonprofitId !== match.from_nonprofit_id && nonprofitId !== match.to_nonprofit_id) {
      res.status(403).json({ error: 'This nonprofit is not part of this match' })
      return
    }

    // Update match status to CANCELLED
    const query = `
      UPDATE matches
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `

    await pool.query(query, [MatchStatus.CANCELLED, id])

    // Log rejection
    const rejectionId = uuidv4()
    const rejectionQuery = `
      INSERT INTO match_rejections (id, match_id, rejected_by_nonprofit_id, reason, rejected_at, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `

    await pool.query(rejectionQuery, [
      rejectionId,
      id,
      nonprofitId,
      note || null,
      new Date(),
      new Date(),
    ])

    // Audit log
    await logAuditEntry({
      action: 'match_rejected',
      actorType: 'nonprofit',
      actorId: nonprofitId,
      resourceType: 'match',
      resourceId: id,
    })

    res.json({
      id,
      status: MatchStatus.CANCELLED,
      message: 'Match rejected.',
    })
  } catch (error) {
    console.error('Error rejecting match:', error)
    res.status(500).json({ error: 'Failed to reject match' })
  }
}

// ============================================================================
// ROUTE SETUP
// ============================================================================

export default function setupMatchRoutes(app: Express): void {
  app.get('/api/matches', listAllMatches)
  app.get('/api/nonprofits/:nonprofitId/matches', listMatchesForNonprofit)
  app.get('/api/matches/:id', getMatch)
  app.post('/api/matches', proposeMatch)
  app.patch('/api/matches/:id/accept', acceptMatch)
  app.patch('/api/matches/:id/reject', rejectMatch)
}
