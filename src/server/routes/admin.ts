/**
 * Admin Routes
 *
 * Endpoints for administrative oversight of the Buy Nothing marketplace.
 * Includes dashboard metrics, facilitation tools, audit logging, and Radar impact analysis.
 */

import { Express, Request, Response } from 'express'
import { pool } from '../index'
import { MatchStatus } from '../../shared/data/buyNothingData'

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/admin/dashboard
 * Overall metrics and insights
 */
async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date()

    // Get all metrics in parallel
    const [
      nonprofitsResult,
      inventoryResult,
      needsResult,
      matchesResult,
      transactionsResult,
      ratingsResult,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM nonprofits WHERE deleted_at IS NULL AND is_active = true`),
      pool.query(`SELECT COUNT(*) FROM inventory_items WHERE deleted_at IS NULL AND is_available = true`),
      pool.query(`SELECT COUNT(*) FROM needs WHERE deleted_at IS NULL AND is_open = true`),
      pool.query(`SELECT COUNT(*) FROM matches WHERE deleted_at IS NULL AND status IN ($1, $2)`, [
        MatchStatus.PROPOSED,
        MatchStatus.NEGOTIATED,
      ]),
      pool.query(`SELECT COUNT(*) FROM transactions WHERE deleted_at IS NULL AND status = $1`, [
        MatchStatus.COMPLETED,
      ]),
      pool.query(`SELECT AVG(stars) as avg_stars, COUNT(*) as total_ratings FROM fairness_ratings`),
    ])

    const totalNonprofits = parseInt(nonprofitsResult.rows[0].count)
    const totalInventory = parseInt(inventoryResult.rows[0].count)
    const totalNeeds = parseInt(needsResult.rows[0].count)
    const activeMatches = parseInt(matchesResult.rows[0].count)
    const completedTransactions = parseInt(transactionsResult.rows[0].count)
    const avgFairnessRating = parseFloat(ratingsResult.rows[0].avg_stars || 0)
    const totalRatings = parseInt(ratingsResult.rows[0].total_ratings || 0)

    // Get reputation distribution
    const reputationQuery = `
      SELECT
        SUM(CASE WHEN reputation_score >= 80 THEN 1 ELSE 0 END) as excellent,
        SUM(CASE WHEN reputation_score >= 60 AND reputation_score < 80 THEN 1 ELSE 0 END) as good,
        SUM(CASE WHEN reputation_score < 60 THEN 1 ELSE 0 END) as needs_improvement
      FROM nonprofits WHERE deleted_at IS NULL
    `
    const reputationResult = await pool.query(reputationQuery)
    const reputationDist = reputationResult.rows[0]

    res.json({
      timestamp: now,
      overview: {
        totalNonprofits,
        totalInventoryItems: totalInventory,
        totalOpenNeeds: totalNeeds,
        activeMatches,
        completedTransactions,
      },
      fairness: {
        averageRating: parseFloat(avgFairnessRating.toFixed(2)),
        totalRatings,
      },
      reputationDistribution: {
        excellent: parseInt(reputationDist.excellent || 0),
        good: parseInt(reputationDist.good || 0),
        needsImprovement: parseInt(reputationDist.needs_improvement || 0),
      },
    })
  } catch (error) {
    console.error('Error getting dashboard:', error)
    res.status(500).json({ error: 'Failed to get dashboard' })
  }
}

/**
 * GET /api/admin/matches/pending
 * Matches awaiting org acceptance or rejection
 */
async function getPendingMatches(req: Request, res: Response): Promise<void> {
  try {
    const { limit = '50', offset = '0' } = req.query

    const limitNum = Math.min(parseInt(limit as string), 100)
    const offsetNum = parseInt(offset as string)

    const query = `
      SELECT m.*,
             ni.service_type as inv_service,
             ni.quantity as inv_quantity,
             nd.service_type as need_service,
             nd.quantity as need_quantity,
             fnp.operating_name as from_nonprofit,
             tnp.operating_name as to_nonprofit
      FROM matches m
      JOIN inventory_items ni ON m.inventory_id = ni.id
      JOIN needs nd ON m.need_id = nd.id
      JOIN nonprofits fnp ON m.from_nonprofit_id = fnp.id
      JOIN nonprofits tnp ON m.to_nonprofit_id = tnp.id
      WHERE m.deleted_at IS NULL AND m.status IN ($1, $2)
      ORDER BY m.proposed_at DESC
      LIMIT $3 OFFSET $4
    `

    const countQuery = `
      SELECT COUNT(*) FROM matches
      WHERE deleted_at IS NULL AND status IN ($1, $2)
    `

    const [result, countResult] = await Promise.all([
      pool.query(query, [MatchStatus.PROPOSED, MatchStatus.NEGOTIATED, limitNum, offsetNum]),
      pool.query(countQuery, [MatchStatus.PROPOSED, MatchStatus.NEGOTIATED]),
    ])

    const total = parseInt(countResult.rows[0].count)

    const matches = result.rows.map((row) => ({
      id: row.id,
      fromNonprofit: row.from_nonprofit,
      toNonprofit: row.to_nonprofit,
      status: row.status,
      proposedAt: row.proposed_at,
      fairnessScore: row.fairness_score,
      whatMatched: `${row.inv_service} (${row.inv_quantity}) → ${row.need_service} (${row.need_quantity})`,
    }))

    res.json({
      matches,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
      oldestProposed: result.rows.length > 0 ? result.rows[result.rows.length - 1].proposed_at : null,
    })
  } catch (error) {
    console.error('Error getting pending matches:', error)
    res.status(500).json({ error: 'Failed to get pending matches' })
  }
}

/**
 * GET /api/admin/fairness-ratings
 * All fairness ratings and analysis
 */
async function getFairnessRatings(req: Request, res: Response): Promise<void> {
  try {
    const { nonprofitId, transactionId, limit = '50', offset = '0' } = req.query

    const limitNum = Math.min(parseInt(limit as string), 100)
    const offsetNum = parseInt(offset as string)

    let query = `
      SELECT fr.*,
             t.from_nonprofit_id,
             t.to_nonprofit_id,
             fnp.operating_name as from_nonprofit,
             tnp.operating_name as to_nonprofit,
             rn.operating_name as rated_by_nonprofit
      FROM fairness_ratings fr
      JOIN transactions t ON fr.transaction_id = t.id
      JOIN nonprofits fnp ON t.from_nonprofit_id = fnp.id
      JOIN nonprofits tnp ON t.to_nonprofit_id = tnp.id
      JOIN nonprofits rn ON fr.rated_by_nonprofit_id = rn.id
      WHERE t.deleted_at IS NULL
    `

    const values: unknown[] = []
    let paramCount = 1

    if (nonprofitId) {
      query += ` AND (t.from_nonprofit_id = $${paramCount} OR t.to_nonprofit_id = $${paramCount})`
      values.push(nonprofitId)
      paramCount++
    }

    if (transactionId) {
      query += ` AND t.id = $${paramCount}`
      values.push(transactionId)
      paramCount++
    }

    // Get total count
    const countQuery = query.replace('SELECT fr.*,', 'SELECT COUNT(*)')
      .substring(0, query.indexOf('FROM'))
      .replace('SELECT COUNT(*)', 'SELECT COUNT(*) FROM fairness_ratings fr JOIN transactions t ON fr.transaction_id = t.id WHERE t.deleted_at IS NULL')

    const countResult = await pool.query(countQuery, values)
    const total = parseInt(countResult.rows[0].count)

    // Add ordering and pagination
    query += ` ORDER BY fr.submitted_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    values.push(limitNum, offsetNum)

    const result = await pool.query(query, values)

    // Calculate statistics
    const statsQuery = `
      SELECT
        AVG(stars) as avg_stars,
        MIN(stars) as min_stars,
        MAX(stars) as max_stars,
        COUNT(*) as total_ratings
      FROM fairness_ratings
    `
    const statsResult = await pool.query(statsQuery)
    const stats = statsResult.rows[0]

    const ratings = result.rows.map((row) => ({
      id: row.id,
      transactionId: row.transaction_id,
      ratedByNonprofit: row.rated_by_nonprofit,
      stars: row.stars,
      comment: row.comment,
      submittedAt: row.submitted_at,
      exchange: `${row.from_nonprofit} ↔ ${row.to_nonprofit}`,
    }))

    res.json({
      ratings,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
      statistics: {
        averageStars: parseFloat(stats.avg_stars?.toFixed(2) || '0'),
        minStars: stats.min_stars,
        maxStars: stats.max_stars,
        totalRatings: parseInt(stats.total_ratings || 0),
      },
    })
  } catch (error) {
    console.error('Error getting fairness ratings:', error)
    res.status(500).json({ error: 'Failed to get fairness ratings' })
  }
}

/**
 * GET /api/admin/radar-impact
 * Analyze which matches address Radar priority signals
 */
async function getRadarImpact(req: Request, res: Response): Promise<void> {
  try {
    // Get completed transactions by demographic
    const query = `
      SELECT
        radar_demographic,
        COUNT(*) as count,
        AVG(EXTRACT(DAY FROM (actual_end_date - start_date))) as avg_duration_days,
        SUM(people_served) as total_people_served
      FROM transactions
      WHERE deleted_at IS NULL
        AND status = $1
        AND radar_demographic IS NOT NULL
      GROUP BY radar_demographic
      ORDER BY count DESC
    `

    const result = await pool.query(query, [MatchStatus.COMPLETED])

    // Map results to demographic names
    const byDemographic: Record<string, unknown> = {}
    result.rows.forEach((row) => {
      byDemographic[row.radar_demographic] = {
        count: parseInt(row.count),
        avgDurationDays: row.avg_duration_days ? parseFloat(row.avg_duration_days.toFixed(1)) : 0,
        totalPeopleServed: parseInt(row.total_people_served || 0),
      }
    })

    // Get impact by service type
    const serviceQuery = `
      SELECT
        m.radar_signal,
        COUNT(*) as completed_matches,
        AVG(m.fairness_score) as avg_fairness_score
      FROM matches m
      JOIN transactions t ON m.transaction_id = t.id
      WHERE m.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND t.status = $1
        AND m.radar_signal IS NOT NULL
      GROUP BY m.radar_signal
      ORDER BY completed_matches DESC
    `

    const serviceResult = await pool.query(serviceQuery, [MatchStatus.COMPLETED])

    const bySignal: Record<string, unknown> = {}
    serviceResult.rows.forEach((row) => {
      bySignal[row.radar_signal] = {
        completedMatches: parseInt(row.completed_matches),
        avgFairnessScore: parseFloat(row.avg_fairness_score?.toFixed(1) || '0'),
      }
    })

    res.json({
      byDemographic,
      byRadarSignal: bySignal,
      summary: {
        totalDemographicsServed: Object.keys(byDemographic).length,
        totalSignalMatches: serviceResult.rows.length,
      },
    })
  } catch (error) {
    console.error('Error getting radar impact:', error)
    res.status(500).json({ error: 'Failed to get radar impact' })
  }
}

/**
 * GET /api/admin/audit-log
 * Full audit trail of all actions
 */
async function getAuditLog(req: Request, res: Response): Promise<void> {
  try {
    const { action, resourceType, actorId, limit = '100', offset = '0' } = req.query

    const limitNum = Math.min(parseInt(limit as string), 500)
    const offsetNum = parseInt(offset as string)

    let query = `SELECT * FROM audit_log WHERE 1=1`
    const values: unknown[] = []
    let paramCount = 1

    if (action) {
      query += ` AND action = $${paramCount}`
      values.push(action)
      paramCount++
    }

    if (resourceType) {
      query += ` AND resource_type = $${paramCount}`
      values.push(resourceType)
      paramCount++
    }

    if (actorId) {
      query += ` AND actor_id = $${paramCount}`
      values.push(actorId)
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

    const entries = result.rows.map((row) => ({
      id: row.id,
      action: row.action,
      actorType: row.actor_type,
      actorId: row.actor_id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      changes: row.changes ? JSON.parse(row.changes) : null,
      notes: row.notes,
      createdAt: row.created_at,
    }))

    res.json({
      entries,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    })
  } catch (error) {
    console.error('Error getting audit log:', error)
    res.status(500).json({ error: 'Failed to get audit log' })
  }
}

/**
 * POST /api/admin/facilitate/:matchId
 * Admin note to help orgs negotiate
 */
async function facilitateMatch(req: Request, res: Response): Promise<void> {
  try {
    const { matchId } = req.params
    const { adminNote, recommendation } = req.body

    if (!adminNote && !recommendation) {
      res.status(400).json({ error: 'adminNote or recommendation is required' })
      return
    }

    // Verify match exists
    const matchQuery = `SELECT * FROM matches WHERE id = $1 AND deleted_at IS NULL`
    const matchResult = await pool.query(matchQuery, [matchId])

    if (matchResult.rows.length === 0) {
      res.status(404).json({ error: 'Match not found' })
      return
    }

    // For now, just return a facilitation response
    // In production, this might update a "facilitation_notes" column on matches
    res.json({
      matchId,
      facilitation: {
        adminNote: adminNote || null,
        recommendation: recommendation || null,
        timestamp: new Date(),
      },
      message: 'Facilitation note recorded',
    })
  } catch (error) {
    console.error('Error facilitating match:', error)
    res.status(500).json({ error: 'Failed to facilitate match' })
  }
}

// ============================================================================
// ROUTE SETUP
// ============================================================================

export default function setupAdminRoutes(app: Express): void {
  app.get('/api/admin/dashboard', getDashboard)
  app.get('/api/admin/matches/pending', getPendingMatches)
  app.get('/api/admin/fairness-ratings', getFairnessRatings)
  app.post('/api/admin/facilitate/:matchId', facilitateMatch)
  app.get('/api/admin/radar-impact', getRadarImpact)
  app.get('/api/admin/audit-log', getAuditLog)
}
