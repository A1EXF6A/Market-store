FROM node:25-alpine as builder
WORKDIR /app

COPY --link package.json ./
RUN npm i

COPY --link . .
RUN npm run build

FROM nginx:alpine3.22 as production

RUN apk add --no-cache gettext-dev

COPY --link nginx.conf /etc/nginx/nginx.conf
COPY --link --from=builder /app/dist /usr/share/nginx/html

COPY --link docker-entrypoint.sh /docker-entrypoint.sh
COPY --link public/config.js.template /usr/share/nginx/html/config.js.template

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
