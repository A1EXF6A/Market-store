# Frontend Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Inject config.js from template using BACKEND_URL env at build time
ARG BACKEND_URL
ARG GOOGLE_MAPS_API_KEY
RUN mkdir -p public && \
    if [ -f public/config.js.template ]; then \
      cat public/config.js.template | sed "s|\${BACKEND_URL}|${BACKEND_URL:-http://localhost:3000}|g" | sed "s|\${GOOGLE_MAPS_API_KEY}|${GOOGLE_MAPS_API_KEY:-}|g" > public/config.js; \
    fi
RUN npm run build

# Use vite preview to serve production build
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 4173
CMD ["npm","run","preview","--","--host","0.0.0.0","--port","4173"]
