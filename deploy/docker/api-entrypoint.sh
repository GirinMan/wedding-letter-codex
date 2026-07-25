#!/bin/sh
set -eu

cd /workspace/apps/api
node dist/cli/migrate.js
exec node dist/server.js
