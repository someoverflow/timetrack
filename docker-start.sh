#!/bin/sh

echo ""
echo " * db init * "
echo ""

[ -f .env ] && echo ".env exists" || {
    echo "create .env";
    echo "DATABASE_URL=\"${DATABASE_URL}\"" >> ./.env;
    
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

node server.js
