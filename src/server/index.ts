/**
 * Buy Nothing API Server
 *
 * Express server with PostgreSQL connection pool.
 * Runs all API endpoints for nonprofit resource exchange marketplace.
 */

import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Pool, QueryResult } from 'pg'
import { healthCheck } from './db'

// Load environment variables
dotenv.config()

// ============================================================================
// APPLICATION SETUP
// ============================================================================

const app: Express = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path}`)
  next()
})

// ============================================================================
// DATABASE CONNECTION POOL
// ============================================================================

export let pool: Pool

async function initializeDatabase(): Promise<void> {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'radar_buy_nothing',
    user: process.env.DB_USER || 'radar',
    password: process.env.DB_PASSWORD || 'password',
    max: 20, // Max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

  // Test connection
  try {
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Database connection successful')
    console.log(`   Connected to ${process.env.DB_NAME} at ${process.env.DB_HOST}`)
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await healthCheck()
    res.json({
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      service: 'Buy Nothing API',
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: String(error),
      timestamp: new Date().toISOString(),
    })
  }
})

// API root
app.get('/api', (req: Request, res: Response) => {
  res.json({
    service: 'Buy Nothing Marketplace API',
    version: '1.0.0',
    endpoints: {
      nonprofits: '/api/nonprofits',
      inventory: '/api/inventory',
      needs: '/api/needs',
      matches: '/api/matches',
      transactions: '/api/transactions',
      admin: '/api/admin',
    },
  })
})

// ============================================================================
// ROUTES
// ============================================================================

import setupNonprofitRoutes from './routes/nonprofits'
import setupInventoryRoutes from './routes/inventory'
import setupNeedsRoutes from './routes/needs'
import setupMatchRoutes from './routes/matches'
import setupTransactionRoutes from './routes/transactions'
import setupAdminRoutes from './routes/admin'

setupNonprofitRoutes(app)
setupInventoryRoutes(app)
setupNeedsRoutes(app)
setupMatchRoutes(app)
setupTransactionRoutes(app)
setupAdminRoutes(app)

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
  })
})

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    timestamp: new Date().toISOString(),
  })
})

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function start(): Promise<void> {
  try {
    // Initialize database
    await initializeDatabase()

    // Start listening
    app.listen(PORT, () => {
      console.log('')
      console.log('🚀 Buy Nothing API Server')
      console.log(`   Listening on http://localhost:${PORT}`)
      console.log(`   Health check: http://localhost:${PORT}/health`)
      console.log(`   API root: http://localhost:${PORT}/api`)
      console.log('')
      console.log('Environment:')
      console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
      console.log(`   DB_HOST: ${process.env.DB_HOST || 'localhost'}`)
      console.log(`   DB_NAME: ${process.env.DB_NAME || 'radar_buy_nothing'}`)
      console.log('')
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await pool.end()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  await pool.end()
  process.exit(0)
})

// Start server
start()

export default app
