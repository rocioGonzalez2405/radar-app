# Express API Quick Start
## Get the backend running in 15 minutes

---

## Step 1: Install Dependencies

```bash
cd /Users/toadkicker/Projects/radar-app

# Install Express + database driver
npm install express pg cors dotenv
npm install --save-dev @types/express @types/pg typescript

# Verify TypeScript setup
npx tsc --version
```

---

## Step 2: Create Server Entry Point

**File**: `src/server/index.ts`

```typescript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { healthCheck } from './db'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', async (req, res) => {
  try {
    const isHealthy = await healthCheck()
    res.json({
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: String(error),
    })
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Buy Nothing API running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export default app
```

---

## Step 3: Create .env File

**File**: `.env` (in project root)

```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=radar_buy_nothing
DB_USER=radar
DB_PASSWORD=password

# Server
NODE_ENV=development
PORT=3000

# Optional: logging level
LOG_LEVEL=debug
```

---

## Step 4: Start PostgreSQL

```bash
# Using Docker
docker run -d \
  --name radar_db \
  -e POSTGRES_USER=radar \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=radar_buy_nothing \
  -p 5432:5432 \
  postgres:15

# Verify it's running
docker ps | grep radar_db
```

---

## Step 5: Run Migrations

```bash
# Connect to database and create tables
psql -h localhost -U radar -d radar_buy_nothing < schema.sql

# Verify tables created
psql -h localhost -U radar -d radar_buy_nothing -c "\dt"
```

Expected output:
```
           List of relations
 Schema |        Name         | Type  | Owner
--------+---------------------+-------+-------
 public | nonprofits          | table | radar
 public | inventory_items     | table | radar
 public | needs               | table | radar
 public | matches             | table | radar
 public | transactions        | table | radar
 public | fairness_ratings    | table | radar
 public | audit_log           | table | radar
 public | disputes            | table | radar
 public | match_rejections    | table | radar
 public | available_inventory | view  | radar
 public | open_needs          | view  | radar
 public | active_matches      | view  | radar
```

---

## Step 6: Test the Server

```bash
# Build TypeScript
npx tsc

# Start server
node src/server/index.js
# or: npm run dev (if you set up dev script)

# In another terminal, test health endpoint
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-08-21T21:00:00.000Z"
}
```

---

## Step 7: Implement First Route (Nonprofits)

**File**: `src/server/routes/nonprofits.ts`

```typescript
import { Router, Request, Response } from 'express'
import { NonprofitService } from '../db'
import { AuditService } from '../db'
import { CreateNonprofitInput } from '../db'

const router = Router()

// POST /api/nonprofits/register
router.post('/api/nonprofits/register', async (req: Request, res: Response) => {
  try {
    const { legalName, operatingName, primaryServices, demographics, serviceAreaZipCodes, bedCapacity, ftesCount } = req.body

    // Validate required fields
    if (!legalName || !operatingName || !primaryServices || !demographics) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const input: CreateNonprofitInput = {
      legalName,
      operatingName,
      primaryServices,
      demographics,
      serviceAreaZipCodes,
      bedCapacity,
      ftesCount,
    }

    const nonprofit = await NonprofitService.create(input)

    // Audit log
    await AuditService.log({
      action: 'nonprofit_registered',
      actorType: 'system',
      resourceType: 'nonprofit',
      resourceId: nonprofit.id,
    })

    res.status(201).json(nonprofit)
  } catch (error) {
    console.error('Error registering nonprofit:', error)
    res.status(500).json({ error: 'Failed to register nonprofit' })
  }
})

// GET /api/nonprofits/:id
router.get('/api/nonprofits/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const nonprofit = await NonprofitService.getById(id)

    if (!nonprofit) {
      return res.status(404).json({ error: 'Nonprofit not found' })
    }

    res.json(nonprofit)
  } catch (error) {
    console.error('Error fetching nonprofit:', error)
    res.status(500).json({ error: 'Failed to fetch nonprofit' })
  }
})

// GET /api/nonprofits (list all)
router.get('/api/nonprofits', async (req: Request, res: Response) => {
  try {
    const { serviceType, demographic, zip, limit = '50', offset = '0' } = req.query

    const result = await NonprofitService.list(
      {
        serviceType: serviceType as string | undefined,
        demographic: demographic as string | undefined,
        zip: zip as string | undefined,
      },
      parseInt(limit as string),
      parseInt(offset as string)
    )

    res.json(result)
  } catch (error) {
    console.error('Error listing nonprofits:', error)
    res.status(500).json({ error: 'Failed to list nonprofits' })
  }
})

export default router
```

**Then, update `src/server/index.ts` to mount routes:**

```typescript
import nonprofitRoutes from './routes/nonprofits'

app.use(nonprofitRoutes)
```

---

## Step 8: Test Your First Endpoint

```bash
# Register a nonprofit
curl -X POST http://localhost:3000/api/nonprofits/register \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "Senior Living Coalition",
    "operatingName": "Senior Living Coalition",
    "primaryServices": ["geriatric_care"],
    "demographics": ["age_55_plus"],
    "serviceAreaZipCodes": ["92101", "92102"],
    "bedCapacity": 50,
    "ftesCount": 12
  }'

# Expected response (after database implementation):
# {
#   "id": "550e8400-e29b-41d4-a716-446655440000",
#   "legalName": "Senior Living Coalition",
#   "operatingName": "Senior Living Coalition",
#   "reputationScore": 70,
#   "completedExchanges": 0,
#   ...
# }
```

---

## Checklist: Next Routes to Implement

- [ ] **Inventory** (`src/server/routes/inventory.ts`)
  - POST /api/nonprofits/:nonprofitId/inventory
  - GET /api/nonprofits/:nonprofitId/inventory
  - GET /api/inventory/search

- [ ] **Needs** (`src/server/routes/needs.ts`)
  - POST /api/nonprofits/:nonprofitId/needs
  - GET /api/nonprofits/:nonprofitId/needs
  - GET /api/needs/search

- [ ] **Matches** (`src/server/routes/matches.ts`)
  - GET /api/matches (calls findPotentialMatches)
  - GET /api/nonprofits/:nonprofitId/matches
  - POST /api/matches/:id/accept
  - POST /api/matches/:id/execute

- [ ] **Transactions** (`src/server/routes/transactions.ts`)
  - GET /api/transactions
  - GET /api/nonprofits/:nonprofitId/transactions
  - PATCH /api/transactions/:id/update
  - POST /api/transactions/:id/rate

- [ ] **Admin** (`src/server/routes/admin.ts`)
  - GET /api/admin/dashboard
  - GET /api/admin/matches/pending
  - GET /api/admin/radar-impact

---

## Common Commands

```bash
# Start server in development
npm run dev

# Build TypeScript
npm run build

# Run tests
npm run test

# Check linting
npm run lint

# Stop PostgreSQL
docker stop radar_db
docker rm radar_db

# View PostgreSQL logs
docker logs radar_db

# Connect to database manually
psql -h localhost -U radar -d radar_buy_nothing
```

---

## Debugging Tips

**"Cannot connect to database"**
```bash
# Check if PostgreSQL is running
docker ps | grep radar_db

# Check connection settings in .env
cat .env

# Verify port 5432 is open
lsof -i :5432
```

**"Table does not exist"**
```bash
# Re-run migrations
psql -h localhost -U radar -d radar_buy_nothing < schema.sql

# Verify tables exist
psql -h localhost -U radar -d radar_buy_nothing -c "\dt"
```

**"Service layer not found"**
```bash
# Make sure db.ts is compiled
npx tsc src/server/db.ts

# Check that import path is correct
# Should be: import { NonprofitService } from '../db'
```

---

## Next Steps After Basic Server

1. Implement all route handlers (follow the patterns above)
2. Add input validation (zod or joi library)
3. Add error handling middleware
4. Write unit tests for fairness scoring
5. Write integration tests for trade workflow
6. Add API documentation (Swagger/OpenAPI)

---

## Questions?

Refer to:
- `WEEK_2_IMPLEMENTATION.md` — Full implementation guide
- `src/server/api/index.ts` — All endpoint signatures
- `schema.sql` — Database structure
- `buyNothingData.ts` — Data models and seed data

**Ready to code!** 🚀
