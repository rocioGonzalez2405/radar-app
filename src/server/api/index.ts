/**
 * Buy Nothing API Routes
 *
 * Week 2 Backend Implementation - API structure
 * These are the core endpoints needed for MVP:
 * - Nonprofit registration & profile
 * - Inventory management
 * - Needs posting
 * - Match discovery
 * - Transaction tracking
 *
 * Database connectivity and implementation follow below
 */

// This is a placeholder structure showing endpoint organization.
// Full implementation uses Express/Hono with the database layer.

export const APIEndpoints = {
  // ========================================================================
  // NONPROFIT ENDPOINTS
  // ========================================================================
  nonprofits: {
    // POST /api/nonprofits/register
    // Register a new nonprofit in the system
    // Request: { legalName, operatingName, primaryServices[], demographics[], serviceAreaZipCodes[], bedCapacity, ftesCount }
    // Response: { id, legalName, ... }
    register: 'POST /nonprofits/register',

    // GET /api/nonprofits/:id
    // Get nonprofit profile
    // Response: { id, legalName, primaryServices[], reputationScore, completedExchanges, isActive, ... }
    profile: 'GET /nonprofits/:id',

    // PATCH /api/nonprofits/:id
    // Update nonprofit profile
    // Request: { operatingName?, primaryServices[]?, demographics[]?, serviceAreaZipCodes[]?, ... }
    // Response: updated nonprofit object
    update: 'PATCH /nonprofits/:id',

    // GET /api/nonprofits
    // List all registered nonprofits (for admin + discovery)
    // Query params: ?service=SERVICE_TYPE&demographic=DEMOGRAPHIC&zip=92101
    // Response: { nonprofits: [...], total, nextCursor }
    list: 'GET /nonprofits',
  },

  // ========================================================================
  // INVENTORY ENDPOINTS
  // ========================================================================
  inventory: {
    // POST /api/nonprofits/:nonprofitId/inventory
    // Add an inventory item (what this org has to offer)
    // Request: { serviceType, quantity, quantityUnit, description, demographics[], availableFrom, availableUntil }
    // Response: { id, nonprofitId, serviceType, quantity, ... }
    create: 'POST /nonprofits/:nonprofitId/inventory',

    // GET /api/nonprofits/:nonprofitId/inventory
    // List this org's inventory
    // Query: ?status=available|available_soon|expired
    // Response: { items: [...], total }
    list: 'GET /nonprofits/:nonprofitId/inventory',

    // GET /api/inventory/:id
    // Get specific inventory item
    // Response: inventory item + which needs it matches (top 3)
    get: 'GET /inventory/:id',

    // PATCH /api/inventory/:id
    // Update inventory item (extend dates, modify description)
    // Request: { description?, availableUntil?, ... }
    update: 'PATCH /inventory/:id',

    // DELETE /api/inventory/:id
    // Remove inventory item
    delete: 'DELETE /inventory/:id',

    // GET /api/inventory/search
    // Search available inventory across all orgs
    // Query: ?serviceType=CASE_MANAGEMENT&demographic=AGE_55_PLUS&zip=92101
    // Response: { items: [...], total }
    search: 'GET /inventory/search',
  },

  // ========================================================================
  // NEEDS ENDPOINTS
  // ========================================================================
  needs: {
    // POST /api/nonprofits/:nonprofitId/needs
    // Post a need (what this org is looking for)
    // Request: { serviceType, quantity, quantityUnit, urgency, deadline, demographics[], fairnessCriteria }
    // Response: { id, nonprofitId, serviceType, ... }
    create: 'POST /nonprofits/:nonprofitId/needs',

    // GET /api/nonprofits/:nonprofitId/needs
    // List this org's posted needs
    // Query: ?status=open|negotiating|fulfilled|expired
    // Response: { needs: [...], total }
    list: 'GET /nonprofits/:nonprofitId/needs',

    // GET /api/needs/:id
    // Get specific need + top matching inventory
    // Response: need object + matches: [{ inventory, fromOrg, fairnessScore, ... }]
    get: 'GET /needs/:id',

    // PATCH /api/needs/:id
    // Update need (change deadline, quantity, etc.)
    // Request: { quantity?, urgency?, deadline?, fairnessCriteria?, ... }
    update: 'PATCH /needs/:id',

    // DELETE /api/needs/:id
    // Close/remove a need
    delete: 'DELETE /needs/:id',

    // GET /api/needs/search
    // Search unfulfilled needs across all orgs
    // Query: ?serviceType=CASE_MANAGEMENT&urgency=HIGH&demographic=FAMILY_WITH_CHILDREN
    // Response: { needs: [...], total }
    search: 'GET /needs/search',
  },

  // ========================================================================
  // MATCH ENDPOINTS
  // ========================================================================
  matches: {
    // GET /api/matches
    // List all potential matches (admin view)
    // Query: ?minScore=70&status=proposed|negotiated|accepted
    // Response: { matches: [...], total }
    listAll: 'GET /matches',

    // GET /api/nonprofits/:nonprofitId/matches
    // Get matches relevant to this org (both proposed TO and FROM)
    // Response: { incoming: [...], outgoing: [...] }
    listForOrg: 'GET /nonprofits/:nonprofitId/matches',

    // GET /api/matches/:id
    // Get specific match with full fairness breakdown
    // Response: { id, inventory, need, fromOrg, toOrg, fairnessScore, breakdown, ... }
    get: 'GET /matches/:id',

    // POST /api/matches
    // Admin proposes a new match (manual matching in MVP)
    // Request: { inventoryId, needId, proposalNote? }
    // Response: match object with status=PROPOSED
    propose: 'POST /matches',

    // PATCH /api/matches/:id/accept
    // Nonprofit accepts a proposed match
    // Request: { nonprofitId, acceptanceNote? }
    // Response: updated match with status=NEGOTIATED
    accept: 'PATCH /matches/:id/accept',

    // PATCH /api/matches/:id/reject
    // Nonprofit rejects a proposed match with optional reason
    // Request: { nonprofitId, rejectionReason? }
    // Response: match marked as CANCELLED
    reject: 'PATCH /matches/:id/reject',

    // POST /api/matches/:id/execute
    // Both orgs agree → lock match and create transaction
    // Request: { executionNote? }
    // Response: transaction object created from this match
    execute: 'POST /matches/:id/execute',

    // GET /api/matches/search
    // Find matches by criteria (for admin facilitation)
    // Query: ?inventoryServiceType=CASE_MANAGEMENT&needServiceType=CASE_MANAGEMENT&minScore=70
    search: 'GET /matches/search',
  },

  // ========================================================================
  // TRANSACTION ENDPOINTS
  // ========================================================================
  transactions: {
    // GET /api/transactions
    // List all transactions (admin + org views)
    // Query: ?status=executing|completed|failed
    // Response: { transactions: [...], total }
    listAll: 'GET /transactions',

    // GET /api/nonprofits/:nonprofitId/transactions
    // Get transactions for specific org
    // Response: { asGiver: [...], asReceiver: [...] }
    listForOrg: 'GET /nonprofits/:nonprofitId/transactions',

    // GET /api/transactions/:id
    // Get transaction details
    // Response: { id, matchId, whatTransferred, startDate, expectedEndDate, peopleServed, ... }
    get: 'GET /transactions/:id',

    // PATCH /api/transactions/:id/update
    // Update transaction status (mark completed, update people served, etc.)
    // Request: { status?, actualEndDate?, peopleServed?, notes? }
    // Response: updated transaction
    update: 'PATCH /transactions/:id/update',

    // POST /api/transactions/:id/rate
    // Post fairness rating after transaction completes
    // Request: { ratedByNonprofitId, stars: 1-5, comment }
    // Response: fairness rating object
    rate: 'POST /transactions/:id/rate',
  },

  // ========================================================================
  // ADMIN ENDPOINTS
  // ========================================================================
  admin: {
    // GET /api/admin/dashboard
    // Overall metrics and insights
    // Response: { totalNonprofits, totalInventory, totalNeeds, activeMatches, completedTransactions, ... }
    dashboard: 'GET /admin/dashboard',

    // GET /api/admin/matches/pending
    // Matches awaiting org acceptance or rejection
    // Response: { matches: [...], total, oldestProposed }
    pendingMatches: 'GET /admin/matches/pending',

    // GET /api/admin/fairness-ratings
    // All fairness ratings + analysis
    // Query: ?nonprofitId=np-001&transactionId=txn-001
    // Response: { ratings: [...], avgStars, trends }
    fairnessRatings: 'GET /admin/fairness-ratings',

    // POST /api/admin/facilitate/:matchId
    // Admin note to help orgs negotiate (in conversation flow)
    // Request: { adminNote, recommendation? }
    // Response: match updated with admin notes
    facilitate: 'POST /admin/facilitate/:matchId',

    // GET /api/admin/audit-log
    // Full audit trail of all actions
    // Query: ?action=match_proposed|match_accepted|transaction_completed&limit=100
    // Response: { events: [...], total }
    auditLog: 'GET /admin/audit-log',

    // GET /api/admin/radar-impact
    // Analyze which matches address Radar priority signals
    // Response: { byDemographic: { age_55_plus: { count, matches: [...] }, ... } }
    radarImpact: 'GET /admin/radar-impact',
  },

  // ========================================================================
  // HEALTH & METADATA
  // ========================================================================
  system: {
    // GET /api/health
    // Check service health
    health: 'GET /health',

    // GET /api/service-types
    // Get all available service types for filtering/UI
    // Response: { serviceTypes: [{ id, label, category }, ...] }
    serviceTypes: 'GET /service-types',

    // GET /api/demographics
    // Get all demographics for filtering/UI
    // Response: { demographics: [{ id, label }, ...] }
    demographics: 'GET /demographics',
  },
}

export type APIEndpointKeys = typeof APIEndpoints
