# Multi-stage Docker build for History Rewriter Live

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install PM2 globally
RUN npm install -g pm2

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/server ./server
COPY --from=builder --chown=nextjs:nodejs /app/ecosystem.config.js ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Create logs directory
RUN mkdir -p logs && chown -R nextjs:nodejs logs

# Create audio directory for TTS files
RUN mkdir -p server/audio && chown -R nextjs:nodejs server/audio

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]