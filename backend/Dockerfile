FROM node:25-alpine AS build

WORKDIR /app
COPY --link package*.json ./
RUN npm install

COPY --link tsconfig*.json ./
COPY src ./src

RUN npm run build

FROM node:25-alpine AS runtime
EXPOSE 3000

WORKDIR /app
COPY --link package*.json ./
RUN npm install --omit=dev

COPY --link --from=build /app/dist ./dist

COPY --link docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
