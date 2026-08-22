/**
 * Transaction Routes
 *
 * Endpoints for tracking and managing executing/completed trades.
 * Transactions are created from accepted matches and track outcomes.
 */

import type { Express, Request, Response } from 'express'
import { pool } from '../index'
import { MatchStatus } from '../../shared/data/buyNothingData'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// TYPES
// ============================================================================

interface CreateTransactionRequest {
  matchId: string
  executionNote?: string
}

interface UpdateTransactionRequest {
  status?: string
  actualEndDate?: string | Date
  peopleServed?: number
  notes?: string
}

interface RateFairnessRequest {
  ratedByNonprofitId: string
  stars: number
  comment?: string
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/transactions
 * Create a transaction from an accepted match (admin only)
 */
async function createTransaction(req: Request, res: Response): Promise<void> {
  try {
    const { matchId } = req.body as CreateTransactionRequest

    if (!matchId) {
      res.status(400).json({ error: 'matchId is required' })
      return
    }

    // Get match (must be ACCEPTED)
    const matchQuery = `
      SELECT m.*, ni.service_type, nd.service_type as need_service_type
      FROM matches m
      JOIN inventory_items ni ON m.inventory_id = ni.id
      JOIN needs nd ON m.need_id = nd.id
      WHERE m.id = $1 AND m.deleted_at IS NULL
    `

    const matchResult = await pool.query(matchQuery, [matchId])

    if (matchResult.rows.length === 0) {
      res.status(404).json({ error: 'Match not found' })
      return
    }

    const match = matchResult.rows[0]

    // Only NEGOTIATED or ACCEPTED matches can become transactions
    if (match.status !== MatchStatus.NEGOTIATED && match.status !== MatchStatus.ACCEPTED) {
      res.status(400).json({
        error: `Match must be ${MatchStatus.NEGOTIATED} or ${MatchStatus.ACCEPTED} to create transaction`,
        currentStatus: match.status,
      })
      return
    }

    const transactionId = uuidv4()
    const now = new Date()

    // Create transaction
    const insertQuery = `
      INSERT INTO transactions (
        id, match_id, from_nonprofit_id, to_nonprofit_id,
        status, what_transferred, start_date, expected_end_date,
        radar_demographic, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `

    const values = [
      transactionId,
      matchId,
      match.from_nonprofit_id,
      match.to_nonprofit_id,
      MatchStatus.EXECUTING,
      `${match.service_type} → ${match.need_service_type}`,
      now,
      match.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      match.radar_demographic || null,
      now,
      now,
    ]

    const result = await pool.query(insertQuery, values)
    const transaction = result.rows[0]

    // Update match to point to transaction
    await pool.query(
      `UPDATE matches SET transaction_id = $1, status = $2 WHERE id = $3`,
      [transactionId, MatchStatus.EXECUTING, matchId]
    )

    // Audit log
    await logAuditEntry({
      action: 'transaction_created',
      actorType: 'admin',
      resourceType: 'transaction',
      resourceId: transactionId,
      changes: { matchId, fromNonprofit: match.from_nonprofit_id, toNonprofit: match.to_nonprofit_id },
    })

    res.status(201).json({
      id: transaction.id,
      matchId: transaction.match_id,
      fromNonprofitId: transaction.from_nonprofit_id,
      toNonprofitId: transaction.to_nonprofit_id,
      status: transaction.status,
      whatTransferred: transaction.what_transferred,
      startDate: transaction.start_date,
      expectedEndDate: transaction.expected_end_date,
      radarDemographic: transaction.radar_demographic,
      createdAt: transaction.created_at,
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    res.status(500).json({ error: 'Failed to create transaction' })
  }
}

/**
 * GET /api/transactions
 * List all transactions (admin view)
 */
async function listAllTransactions(req: Request, res: Response): Promise<void> {
  try {
    const { status, limit = '50', offset = '0' } = req.query

    const limitNum = Math.min(parseInt(limit as string), 100)
    const offsetNum = parseInt(offset as string)

    let query = `
      SELECT t.*,
             fnp.operating_name as from_nonprofit_name,
             tnp.operating_name as to_nonprofit_name
      FROM transactions t
      JOIN nonprofits fnp ON t.from_nonprofit_id = fnp.id
      JOIN nonprofits tnp ON t.to_nonprofit_id = tnp.id
      WHERE t.deleted_at IS NULL
    `
    const values: unknown[] = []
    let paramCount = 1

    if (status) {
      query += ` AND t.status = $${paramCount}`
      values.push(status)
      paramCount++
    }

    // Get total count
    const countQuery = query.replace('SELECT t.*, fnp.operating_name as from_nonprofit_name, tnp.operating_name as to_nonprofit_name', 'SELECT COUNT(*)')
      .substring(0, query.indexOf('FROM'))
      .replace('SELECT COUNT(*)', 'SELECT COUNT(*) FROM transactions t WHERE t.deleted_at IS NULL')

    const countResult = await pool.query(countQuery, values.slice(0, values.length))
    const total = parseInt(countResult.rows[0].count)

    // Add ordering and pagination
    query += ` ORDER BY t.start_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    values.push(limitNum, offsetNum)

    const result = await pool.query(query, values)

    const transactions = result.rows.map((row) => ({
      id: row.id,
      matchId: row.match_id,
      fromNonprofitId: row.from_nonprofit_id,
      fromNonprofitName: row.from_nonprofit_name,
      toNonprofitId: row.to_nonprofit_id,
      toNonprofitName: row.to_nonprofit_name,
      status: row.status,
      whatTransferred: row.what_transferred,
      startDate: row.start_date,
      expectedEndDate: row.expected_end_date,
      actualEndDate: row.actual_end_date,
      peopleServed: row.people_served,
      radarDemographic: row.radar_demographic,
      createdAt: row.created_at,
    }))

    res.json({
      transactions,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    })
  } catch (error) {
    console.error('Error listing transactions:', error)
    res.status(500).json({ error: 'Failed to list transactions' })
  }
}

/**
 * GET /api/nonprofits/:nonprofitId/transactions
 * Get transactions for a specific nonprofit (as giver and receiver)
 */
async function listTransactionsForNonprofit(req: Request, res: Response): Promise<void> {
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

    // Get transactions as giver
    const asGiverQuery = `
      SELECT t.* FROM transactions t
      WHERE t.deleted_at IS NULL AND t.from_nonprofit_id = $1
      ORDER BY t.start_date DESC
      LIMIT $2 OFFSET $3
    `

    // Get transactions as receiver
    const asReceiverQuery = `
      SELECT t.* FROM transactions t
      WHERE t.deleted_at IS NULL AND t.to_nonprofit_id = $1
      ORDER BY t.start_date DESC
      LIMIT $2 OFFSET $3
    `

    const [asGiverResult, asReceiverResult] = await Promise.all([
      pool.query(asGiverQuery, [nonprofitId, limitNum, offsetNum]),
      pool.query(asReceiverQuery, [nonprofitId, limitNum, offsetNum]),
    ])

    const formatTransactions = (rows: unknown[]) =>
      (rows as any[]).map((row) => ({
        id: row.id,
        matchId: row.match_id,
        fromNonprofitId: row.from_nonprofit_id,
        toNonprofitId: row.to_nonprofit_id,
        status: row.status,
        whatTransferred: row.what_transferred,
        startDate: row.start_date,
        expectedEndDate: row.expected_end_date,
        actualEndDate: row.actual_end_date,
        peopleServed: row.people_served,
        radarDemographic: row.radar_demographic,
      }))

    res.json({
      asGiver: formatTransactions(asGiverResult.rows),
      asReceiver: formatTransactions(asReceiverResult.rows),
    })
  } catch (error) {
    console.error('Error listing nonprofit transactions:', error)
    res.status(500).json({ error: 'Failed to list nonprofit transactions' })
  }
}

/**
 * GET /api/transactions/:id
 * Get specific transaction
 */
async function getTransaction(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    const query = `
      SELECT t.*,
             fnp.operating_name as from_nonprofit_name,
             tnp.operating_name as to_nonprofit_name
      FROM transactions t
      JOIN nonprofits fnp ON t.from_nonprofit_id = fnp.id
      JOIN nonprofits tnp ON t.to_nonprofit_id = tnp.id
      WHERE t.id = $1 AND t.deleted_at IS NULL
    `

    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Transaction not found' })
      return
    }

    const row = result.rows[0]

    res.json({
      id: row.id,
      matchId: row.match_id,
      fromNonprofitId: row.from_nonprofit_id,
      fromNonprofitName: row.from_nonprofit_name,
      toNonprofitId: row.to_nonprofit_id,
      toNonprofitName: row.to_nonprofit_name,
      status: row.status,
      whatTransferred: row.what_transferred,
      startDate: row.start_date,
      expectedEndDate: row.expected_end_date,
      actualEndDate: row.actual_end_date,
      peopleServed: row.people_served,
      radarDemographic: row.radar_demographic,
      createdAt: row.created_at,
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    res.status(500).json({ error: 'Failed to fetch transaction' })
  }
}

/**
 * PATCH /api/transactions/:id/update
 * Update transaction status and completion data
 */
async function updateTransaction(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { status, actualEndDate, peopleServed } = req.body as UpdateTransactionRequest

    // Verify transaction exists
    const checkQuery = `SELECT * FROM transactions WHERE id = $1 AND deleted_at IS NULL`
    const checkResult = await pool.query(checkQuery, [id])

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Transaction not found' })
      return
    }

    // Build update query
    const updates: string[] = []
    const values: unknown[] = []
    let paramCount = 1

    if (status) {
      updates.push(`status = $${paramCount}`)
      values.push(status)
      paramCount++
    }

    if (actualEndDate) {
      updates.push(`actual_end_date = $${paramCount}`)
      values.push(new Date(actualEndDate))
      paramCount++
    }

    if (peopleServed !== undefined) {
      updates.push(`people_served = $${paramCount}`)
      values.push(peopleServed)
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
      UPDATE transactions
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await pool.query(query, values)
    const transaction = result.rows[0]

    // Audit log
    await logAuditEntry({
      action: 'transaction_updated',
      actorType: 'nonprofit',
      resourceType: 'transaction',
      resourceId: id,
      changes: { status, peopleServed, actualEndDate },
    })

    res.json({
      id: transaction.id,
      status: transaction.status,
      actualEndDate: transaction.actual_end_date,
      peopleServed: transaction.people_served,
      updatedAt: transaction.updated_at,
    })
  } catch (error) {
    console.error('Error updating transaction:', error)
    res.status(500).json({ error: 'Failed to update transaction' })
  }
}

/**
 * POST /api/transactions/:id/rate
 * Post fairness rating after transaction completes
 */
async function rateTransaction(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { ratedByNonprofitId, stars, comment } = req.body as RateFairnessRequest

    if (!ratedByNonprofitId) {
      res.status(400).json({ error: 'ratedByNonprofitId is required' })
      return
    }

    if (typeof stars !== 'number' || stars < 1 || stars > 5) {
      res.status(400).json({ error: 'stars must be between 1 and 5' })
      return
    }

    // Verify transaction exists
    const txnQuery = `SELECT * FROM transactions WHERE id = $1 AND deleted_at IS NULL`
    const txnResult = await pool.query(txnQuery, [id])

    if (txnResult.rows.length === 0) {
      res.status(404).json({ error: 'Transaction not found' })
      return
    }

    const transaction = txnResult.rows[0]

    // Verify nonprofit is part of this transaction
    if (ratedByNonprofitId !== transaction.from_nonprofit_id && ratedByNonprofitId !== transaction.to_nonprofit_id) {
      res.status(403).json({ error: 'This nonprofit is not part of this transaction' })
      return
    }

    // Create rating
    const ratingId = uuidv4()
    const insertQuery = `
      INSERT INTO fairness_ratings (
        id, transaction_id, rated_by_nonprofit_id, stars, comment, submitted_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const now = new Date()
    const values = [ratingId, id, ratedByNonprofitId, stars, comment || null, now, now]

    const result = await pool.query(insertQuery, values)
    const rating = result.rows[0]

    // Audit log
    await logAuditEntry({
      action: 'transaction_rated',
      actorType: 'nonprofit',
      actorId: ratedByNonprofitId,
      resourceType: 'transaction',
      resourceId: id,
      changes: { stars, comment },
    })

    res.status(201).json({
      id: rating.id,
      transactionId: rating.transaction_id,
      ratedByNonprofitId: rating.rated_by_nonprofit_id,
      stars: rating.stars,
      comment: rating.comment,
      submittedAt: rating.submitted_at,
    })
  } catch (error) {
    console.error('Error rating transaction:', error)
    res.status(500).json({ error: 'Failed to rate transaction' })
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
// ROUTE SETUP
// ============================================================================

export default function setupTransactionRoutes(app: Express): void {
  app.post('/api/transactions', createTransaction)
  app.get('/api/transactions', listAllTransactions)
  app.get('/api/nonprofits/:nonprofitId/transactions', listTransactionsForNonprofit)
  app.get('/api/transactions/:id', getTransaction)
  app.patch('/api/transactions/:id/update', updateTransaction)
  app.post('/api/transactions/:id/rate', rateTransaction)
}
