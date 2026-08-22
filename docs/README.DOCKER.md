# Buy Nothing MVP - Docker Setup

## Quick Start (Production - All-in-One)

```bash
# Build and run everything
docker-compose up --build

# App will be available at:
# Frontend:   http://localhost:3000
# API:        http://localhost:3000/api
# Health:     http://localhost:3000/health
```

## Development (Backend + DB only)

Run database and API backend in Docker, frontend locally with hot-reload:

```bash
# Start backend + database
docker-compose -f docker-compose.dev.yml up

# In another terminal, start Vite frontend dev server
npm run dev

# Access:
# Frontend:   http://localhost:5173
# API:        http://localhost:3000/api
```

## What's Included

### Dockerfile (Multi-stage)
- Stage 1: Builds React frontend (`npm run build` → `dist/`)
- Stage 2: Runtime Node.js with:
  - Express server on port 3000
  - Serves built React app as static files
  - All backend APIs at `/api/*`
  - SPA fallback for React Router

### docker-compose.yml (Production)
- PostgreSQL 15 (auto-loads schema)
- Express + React on single port (3000)
- Health checks on both services
- Automatic restart on failure

### docker-compose.dev.yml (Development)
- PostgreSQL 15 (auto-loads schema)
- Express API with file watching (hot reload on code changes)
- Vite dev server runs locally for fast frontend reload

## Environment Variables

Create `.env` file:

```env
DB_USER=radar
DB_PASSWORD=password
DB_NAME=radar_buy_nothing
DB_PORT=5432
NODE_ENV=development
PORT=3000
```

## API Endpoints

All endpoints prefixed with `/api`:

**Nonprofits** (4)
- POST /api/nonprofits/register
- GET /api/nonprofits/:id
- GET /api/nonprofits
- PATCH /api/nonprofits/:id

**Inventory** (5)
- POST /api/nonprofits/:nonprofitId/inventory
- GET /api/nonprofits/:nonprofitId/inventory
- GET /api/inventory/:id
- GET /api/inventory/search
- DELETE /api/inventory/:id

**Needs** (5)
- POST /api/nonprofits/:nonprofitId/needs
- GET /api/nonprofits/:nonprofitId/needs
- GET /api/needs/:id
- GET /api/needs/search
- DELETE /api/needs/:id

**Matches** (6)
- GET /api/matches
- GET /api/nonprofits/:nonprofitId/matches
- GET /api/matches/:id
- POST /api/matches
- PATCH /api/matches/:id/accept
- PATCH /api/matches/:id/reject

**Transactions** (6)
- POST /api/transactions
- GET /api/transactions
- GET /api/nonprofits/:nonprofitId/transactions
- GET /api/transactions/:id
- PATCH /api/transactions/:id/update
- POST /api/transactions/:id/rate

**Admin** (6)
- GET /api/admin/dashboard
- GET /api/admin/matches/pending
- GET /api/admin/fairness-ratings
- POST /api/admin/facilitate/:matchId
- GET /api/admin/radar-impact
- GET /api/admin/audit-log

## Testing

```bash
# Health check
curl http://localhost:3000/health

# API root
curl http://localhost:3000/api

# Register nonprofit
curl -X POST http://localhost:3000/api/nonprofits/register \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "Test Nonprofit",
    "operatingName": "Test Org",
    "primaryServices": ["meals"],
    "demographics": ["age_55_plus"],
    "serviceAreaZipCodes": ["92101"],
    "bedCapacity": 50,
    "utilizationRate": 0.75,
    "ftesCount": 10
  }'
```

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill Docker containers
docker-compose down -v
```

### Database connection refused
```bash
# Check if postgres is running
docker ps | grep postgres

# View logs
docker-compose logs postgres

# Rebuild everything
docker-compose down -v && docker-compose up --build
```

### Frontend not loading
- Check that React build succeeded: `npm run build`
- Verify frontend code is in `dist/` folder
- Check server logs: `docker-compose logs app`

## Architecture

```
Frontend (React)
    ↓
Express Server (Port 3000)
    ├─ Serves static /dist/* files
    ├─ Routes /api/* to backend handlers
    └─ Connects to PostgreSQL

Database (PostgreSQL)
    ├─ Schema auto-loaded on startup
    └─ Data persisted in docker volume
```
