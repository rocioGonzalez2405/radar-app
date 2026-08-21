# Week 2 Implementation Guide
## Buy Nothing Backend: Core Infrastructure

**Status**: ✅ Architecture & Data Models Complete  
**Next Step**: Express API Server Implementation  
**Timeline**: Week 2 of 6-week MVP sprint

---

## What's Been Built

### 1. **Data Models** (`src/shared/data/buyNothingData.ts`)
- ✅ All TypeScript interfaces (Nonprofit, Inventory, Need, Match, Transaction, FairnessRating)
- ✅ Enums for ServiceType, RTFHDemographic, UrgencyLevel, MatchStatus
- ✅ Pilot seed data (10 nonprofits + sample inventory + needs)
- ✅ Radar priority signals integration (age 55+ rising, housing pressure, etc.)
- ✅ UI helper functions (getServiceTypeLabel, getDemographicLabel)

### 2. **Fairness Scoring Algorithm** (`src/server/fairnessScoring.ts`)
- ✅ Four-part scoring system (Fit 40%, Value 35%, RadarImpact 20%, Reputation 5%)
- ✅ Fit score: Service type matching + quantity alignment + demographic overlap
- ✅ Value score: Monetary equivalence + utilization gap analysis
- ✅ Radar impact: Priority subgroup weighting (Age 55+ = 1.2x, Housing = 1.1x)
- ✅ Reputation score: Historical track record + completed exchanges
- ✅ Proposable threshold: ≥70 score indicates good match

### 3. **Matching Engine** (`src/server/matchingEngine.ts`)
- ✅ Find all potential matches between inventory and needs
- ✅ Context-specific matching (for a specific need, for specific inventory)
- ✅ Radar signal inference (infer which trend triggered the match)
- ✅ Scoring filter (proposable ≥70 vs. low-score ≥<70)

### 4. **API Endpoint Structure** (`src/server/api/index.ts`)
- ✅ 30+ endpoints documented with request/response shapes
- ✅ Nonprofit management (register, profile, list)
- ✅ Inventory management (create, list, search)
- ✅ Needs management (create, list, search)
- ✅ Match discovery & proposal
- ✅ Transaction tracking & ratings
- ✅ Admin console (dashboard, facilitation, audit log)

### 5. **Database Schema** (`schema.sql`)
- ✅ PostgreSQL table design (12 tables + 3 views)
- ✅ Proper indexing for performance
- ✅ Foreign keys with cascade/restrict policies
- ✅ Audit trail table for compliance
- ✅ Dispute tracking table (Phase 2)

### 6. **Database Service Layer** (`src/server/db.ts`)
- ✅ Type-safe database operations (CRUD)
- ✅ Service classes: NonprofitService, InventoryService, NeedsService, MatchService, TransactionService, AuditService
- ✅ Query signatures showing parameter types
- ✅ Migration runner stub

---

## Next Steps: API Implementation

### Phase A: Express Server Setup (1-2 days)

**File**: `src/server/index.ts`

```typescript
import express from 'express'
import { healthCheck, runMigrations } from './db'
import { setupNonprofitRoutes } from './routes/nonprofits'
import { setupInventoryRoutes } from './routes/inventory'
import { setupNeedsRoutes } from './routes/needs'
import { setupMatchRoutes } from './routes/matches'
import { setupTransactionRoutes } from './routes/transactions'
import { setupAdminRoutes } from './routes/admin'

const app = express()
app.use(express.json())

// Health check
app.get('/health', async (req, res) => {
  const isHealthy = await healthCheck()
  res.json({ status: isHealthy ? 'ok' : 'error' })
})

// Mount route modules
setupNonprofitRoutes(app)
setupInventoryRoutes(app)
setupNeedsRoutes(app)
setupMatchRoutes(app)
setupTransactionRoutes(app)
setupAdminRoutes(app)

// Run migrations on startup
await runMigrations()

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Buy Nothing API listening on ${PORT}`))
```

### Phase B: Route Implementation (3-4 days)

Create route files under `src/server/routes/`:

1. **`nonprofits.ts`** (highest priority)
   - POST /api/nonprofits/register
   - GET /api/nonprofits/:id
   - GET /api/nonprofits (list all)
   - PATCH /api/nonprofits/:id (update)

2. **`inventory.ts`**
   - POST /api/nonprofits/:nonprofitId/inventory
   - GET /api/nonprofits/:nonprofitId/inventory
   - GET /api/inventory/search
   - DELETE /api/inventory/:id

3. **`needs.ts`**
   - POST /api/nonprofits/:nonprofitId/needs
   - GET /api/nonprofits/:nonprofitId/needs
   - GET /api/needs/search
   - DELETE /api/needs/:id

4. **`matches.ts`** (most complex)
   - GET /api/matches (admin view, sorted by score)
   - GET /api/nonprofits/:nonprofitId/matches
   - GET /api/matches/:id (with fairness breakdown)
   - POST /api/matches (admin proposes)
   - PATCH /api/matches/:id/accept
   - PATCH /api/matches/:id/reject
   - POST /api/matches/:id/execute

5. **`transactions.ts`**
   - GET /api/transactions
   - GET /api/nonprofits/:nonprofitId/transactions
   - GET /api/transactions/:id
   - PATCH /api/transactions/:id/update
   - POST /api/transactions/:id/rate

6. **`admin.ts`**
   - GET /api/admin/dashboard
   - GET /api/admin/matches/pending
   - GET /api/admin/fairness-ratings
   - GET /api/admin/radar-impact
   - GET /api/admin/audit-log

### Phase C: Matching Algorithm Integration (2-3 days)

In `POST /api/matches` and `GET /api/matches` endpoints:

```typescript
// When admin requests potential matches
const matches = await findPotentialMatches(
  inventoryItems,
  needs,
  nonprofitsMap
)

// Filter by proposable threshold (>70)
const { proposable, lowScore } = filterProposableMatches(matches, 70)

// Return with fairness breakdowns visible
return res.json({
  proposable: proposable.map(m => ({
    matchId: m.match.id,
    inventory: m.inventory,
    need: m.need,
    fromOrg: m.fromOrg,
    toOrg: m.toOrg,
    fairnessScore: m.fairnessScore.total,
    breakdown: m.fairnessScore.breakdown,
    reasoning: m.fairnessScore.reasoning,
  })),
  lowScore: lowScore.slice(0, 10), // Show top 10 low-score matches for context
})
```

---

## Database Connection

### Environment Setup

Create `.env` file in project root:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=radar_buy_nothing
DB_USER=radar
DB_PASSWORD=your_password_here

NODE_ENV=development
PORT=3000
```

### Local Development Database

```bash
# Using Docker (recommended)
docker run -d \
  --name radar_db \
  -e POSTGRES_USER=radar \
  -e POSTGRES_PASSWORD=your_password_here \
  -e POSTGRES_DB=radar_buy_nothing \
  -p 5432:5432 \
  postgres:15

# Run migrations
npm run db:migrate

# Optional: seed pilot data
npm run db:seed
```

### Production Considerations

- Use connection pooling (pg-pool)
- Set `DB_POOL_SIZE=20` for concurrent connections
- Enable SSL_MODE=require on production databases
- Regular backups (especially before transactions execute)

---

## Testing Strategy

### Unit Tests

```bash
# Test fairness scoring algorithm
npm run test -- src/server/fairnessScoring.test.ts

# Test matching engine
npm run test -- src/server/matchingEngine.test.ts
```

Example test:

```typescript
describe('Fairness Scoring', () => {
  it('should score a perfect match 100', () => {
    const result = calculateFairnessScore(
      sampleInventory[0], // geriatric care hours
      sampleNeeds[0], // case mgmt (related service)
      pilotNonprofits[0], // Senior Living
      pilotNonprofits[1] // Rachel's Promise
    )
    
    expect(result.total).toBeGreaterThanOrEqual(70)
    expect(result.isProposable).toBe(true)
  })

  it('should prioritize Age 55+ matches', () => {
    // Inventory serving Age 55+ should get Radar boost (1.2x)
    const score = calculateRadarImpactScore(inventory55plus, needsFamily)
    expect(score).toBeGreaterThan(50) // Baseline
  })
})
```

### Integration Tests

```bash
npm run test:integration -- api/nonprofits.test.ts
```

- Create nonprofit → verify stored + reputation_score defaults to 70
- Add inventory → verify indexed for search
- Post need → verify deadline validation
- Propose match → verify fairness score is calculated and stored
- Accept match → verify status transitions
- Create transaction → verify audit log entry

### End-to-End Tests

```bash
npm run test:e2e -- scenarios/complete-trade.test.ts
```

Scenario: "Complete Trade Workflow"
1. Register 2 nonprofits (Senior Living, Rachel's Promise)
2. Senior Living posts: 10 hrs geriatric care (available Aug 25 - Dec 31)
3. Rachel's Promise posts: Need 40 hrs case mgmt (deadline Sep 30)
4. System finds match (fairness score = 82)
5. Admin proposes match
6. Both orgs accept
7. Transaction created (status: EXECUTING)
8. Transaction marked complete (3 people served)
9. Rachel's Promise rates Senior Living: 5 stars
10. Verify audit log shows all steps

---

## Data Validation & Error Handling

### Input Validation

```typescript
// In route handlers, validate request body:
const { legalName, operatingName, primaryServices } = req.body

if (!legalName || legalName.trim().length === 0) {
  return res.status(400).json({ error: 'legalName is required' })
}

if (!Array.isArray(primaryServices) || primaryServices.length === 0) {
  return res.status(400).json({ error: 'primaryServices must be non-empty array' })
}

// Validate enum values
const validServiceTypes = Object.values(ServiceType)
for (const svc of primaryServices) {
  if (!validServiceTypes.includes(svc)) {
    return res.status(400).json({ error: `Invalid service type: ${svc}` })
  }
}
```

### Error Handling

```typescript
try {
  const nonprofit = await NonprofitService.create(input)
  await AuditService.log({
    action: 'nonprofit_registered',
    actorType: 'system',
    resourceType: 'nonprofit',
    resourceId: nonprofit.id,
  })
  res.status(201).json(nonprofit)
} catch (error) {
  console.error('Error creating nonprofit:', error)
  res.status(500).json({ error: 'Failed to create nonprofit' })
}
```

---

## Performance Optimization

### Database Indexes (Already in schema.sql)

```sql
-- Critical for search performance
CREATE INDEX idx_inventory_service_type ON inventory_items(service_type);
CREATE INDEX idx_inventory_available ON inventory_items(available_from, available_until, is_available);
CREATE INDEX idx_matches_score ON matches(fairness_score DESC);
```

### Query Optimization

```typescript
// ❌ SLOW: N+1 query problem
const matches = await MatchService.list()
for (const m of matches) {
  m.fromOrg = await NonprofitService.getById(m.from_nonprofit_id)
}

// ✅ FAST: Single query with JOINs
const matches = await MatchService.listWithOrgs() // Uses JOIN in SQL
```

### Connection Pooling

```typescript
const pool = new Pool({
  max: 20, // Max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

---

## Deployment Checklist

- [ ] Database migrations run successfully
- [ ] All routes tested and documented
- [ ] Fairness algorithm verified with sample data
- [ ] Audit logging working for all actions
- [ ] Error handling covers edge cases
- [ ] API rate limiting configured (if needed)
- [ ] CORS configured for frontend origin
- [ ] Environment variables documented
- [ ] Database backups automated
- [ ] Monitoring/logging setup

---

## File Structure After Week 2

```
src/
├── shared/
│   └── data/
│       └── buyNothingData.ts          ✅ DONE
├── server/
│   ├── index.ts                       ⏳ TODO: Express app
│   ├── db.ts                          ✅ DONE
│   ├── fairnessScoring.ts             ✅ DONE
│   ├── matchingEngine.ts              ✅ DONE
│   ├── api/
│   │   └── index.ts                   ✅ DONE (documentation)
│   └── routes/
│       ├── nonprofits.ts              ⏳ TODO: Implement
│       ├── inventory.ts               ⏳ TODO: Implement
│       ├── needs.ts                   ⏳ TODO: Implement
│       ├── matches.ts                 ⏳ TODO: Implement
│       ├── transactions.ts            ⏳ TODO: Implement
│       └── admin.ts                   ⏳ TODO: Implement
├── schema.sql                         ✅ DONE
└── WEEK_2_IMPLEMENTATION.md           ✅ DONE (this file)
```

---

## Week 3 Preview: Frontend

With the backend complete, Week 3 will build:

- **Nonprofit Dashboard** (`/portal/dashboard`)
  - Browse available inventory
  - Post needs
  - View incoming/outgoing matches
  - Accept/reject proposals
  - See transaction history
  - Rate completed trades

- **Components**
  - InventoryCard (show available services)
  - NeedForm (post what we're looking for)
  - MatchProposal (see fairness score breakdown)
  - TransactionTimeline (track execution)

- **Integration with existing Radar pages**
  - Capacity page: Show "Organizations Addressing Gap" cards
  - Rebalancing page: New page showing live trades
  - Portal: Add org inventory alongside projects

---

## Questions? Next Actions

1. **Ready to implement Express routes?** Start with `src/server/routes/nonprofits.ts`
2. **Need to adjust fairness formula?** Edit `src/server/fairnessScoring.ts`
3. **Want different Radar signal weights?** Edit `radarPrioritySignals` in `buyNothingData.ts`
