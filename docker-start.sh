#!/bin/sh

export DATABASE_URL="mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_DB}"

echo ""
echo " * db init * "
echo ""

[ -f .env ] && echo ".env exists" || {
    echo "create .env";
    
    echo "DATABASE_URL=\"${DATABASE_URL}\"" >> ./.env;
    
    export SCHEDULER_SECRET="$(openssl rand -base64 32)"
    echo "SCHEDULER_SECRET=\"$SCHEDULER_SECRET\"" >> ./.env
    
    echo "start prisma generation"
    
    npx --yes prisma db push --accept-data-loss --skip-generate
    node prisma/seed.js
}

echo ""
echo " * db done * "
echo ""

echo " * Starting Server * "

(trap 'kill 0' SIGINT; sh scheduler.sh & node server.js)
