#!/bin/sh
set -e

echo "WINTPC: applying database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "WINTPC: starting server..."
exec node server.js
