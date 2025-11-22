#!/bin/sh
set -e

echo "Running database migrations..."
npm run migration:run

echo "Starting app..."
exec node dist/main.js
