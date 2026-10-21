FROM node:20-alpine AS base
WORKDIR /app

FROM base AS development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --omit=dev
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist
COPY --chown=nodejs:nodejs drizzle ./drizzle
RUN mkdir -p /app/data/ga-evidence && chown -R nodejs:nodejs /app/data
USER nodejs
EXPOSE 5000
CMD ["node", "dist/server.js"]
