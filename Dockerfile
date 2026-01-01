# --- STAGE 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies based on preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source files
COPY . .

# Build the application
# Note: Next.js telemetry is disabled during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- STAGE 2: Run ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-privileged user to run the app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential files from the builder stage
# We use the standalone output for ultra-minimal images if configured, 
# but for standard builds we need .next, public, and node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
