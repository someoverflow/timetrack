#!/bin/sh

echo ""
echo " * db init * "
echo ""

[ -f .env ] && echo ".env exists" || {
    echo "create .env";
    
    export DATABASE_URL="mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_DB}"
    echo "DATABASE_URL=\"{DATABASE_URL}\"" >> ./.env;
    
    if [ -z "$AUTH_SECRET" ]; then
        AUTH_SECRET="$(openssl rand -base64 32)"
    fi
    echo "AUTH_SECRET=\"$AUTH_SECRET\"" >> ./.env
    
    echo "start prisma generation"
    
    npm i --yes
    npx --yes prisma db push --accept-data-loss --skip-generate
    node prisma/seed.js
}

echo ""
echo " * db done * "
echo ""

echo " * Starting Server * "

(trap 'kill 0' SIGINT; (while $BACKUP; do /usr/bin/mysqldump --opt -h $DATABASE_HOST -u $DATABASE_DB -p$DATABASE_PASSWORD $DATABASE_USER >> /backups/$(date +"%Y-%m-%d_%H-%M-%S")_timetrack.sql & sleep $BACKUP_DELAY; done) & node server.js)
