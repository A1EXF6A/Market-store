# Backend Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy built app and necessary files
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
# Uploads directory for static assets
COPY uploads ./uploads
# Default port can be overridden by env
ENV PORT=3000
# Database envs
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USER=postgres
ENV DB_PASSWORD=postgres
ENV DB_NAME=marketstore
# Optional: DATABASE_URL takes precedence if set
# Run migrations then start the server
CMD sh -c "node -e 'console.log(\"Waiting for DB...\")' && npx typeorm-ts-node-commonjs migration:run -d ./dist/data-source.js || true && npm run start:prod"
EXPOSE 3000
