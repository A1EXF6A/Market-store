#!/bin/sh

# Reemplazar variables de entorno en config.js
envsubst < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js

# Iniciar nginx
nginx -g "daemon off;"