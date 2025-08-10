# ====================================
# KMP SUPPLY CHAIN - MESSAGE BUS API
# Multi-stage Docker build for production
# ====================================

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S nodejs && adduser -S kmp -u 1001

# ====================================
# DEPENDENCIES STAGE
# ====================================
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ====================================
# BUILD STAGE  
# ====================================
FROM base AS build
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# ====================================
# PRODUCTION STAGE
# ====================================
FROM base AS production

# Security: Run as non-root user
USER kmp

# Copy built application
COPY --from=build --chown=kmp:nodejs /app/dist ./dist
COPY --from=deps --chown=kmp:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=kmp:nodejs /app/package.json ./package.json

# Copy configuration files
COPY --chown=kmp:nodejs drizzle.config.ts ./
COPY --chown=kmp:nodejs openapi.yaml ./

# Create required directories
RUN mkdir -p storage/payloads logs && chown -R kmp:nodejs storage logs

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL=""
ENV JWT_SECRET=""
ENV RUST_SUBMITTER_PATH="/app/kaspa_broadcaster"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Expose port
EXPOSE 4000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"] 