# Stage 1: Build client frontend
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production runtime runner
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled frontend from builder
COPY --from=builder /app/dist ./dist

# Copy application source (includes server, db, assets/images, config)
COPY src ./src

# Expose Cloud Run standard port
EXPOSE 8080

# Start production server
CMD ["node", "src/server/server.ts"]
