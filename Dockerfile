# Buy Nothing MVP - Full Stack (Backend + Frontend)
# Multi-stage build: React frontend + Express server

# ============================================================================
# Stage 1: Build React Frontend
# ============================================================================
FROM node:24-alpine AS frontend-build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Build React app to dist/
RUN npm run build

# ============================================================================
# Stage 2: Runtime - Express Server + Static Frontend
# ============================================================================
FROM node:24-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies (no devDependencies)
RUN npm ci --omit=dev

# Install tsx for runtime TypeScript execution
RUN npm install -D tsx

# Copy backend code
COPY src ./src
COPY schema.sql ./
COPY .env.example ./.env.example

# Copy built frontend from stage 1
COPY --from=frontend-build /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start server (serves both backend API and frontend static files)
CMD ["npx", "tsx", "src/server/index.ts"]
