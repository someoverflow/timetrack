#!/bin/sh

echo " * db * "
echo ""

[ -f .env ] && echo ".env exists" || {
    echo "create .env";
    echo "DATABASE_URL=\"${DATABASE_URL}\"" >> .env;
    echo "NEXTAUTH_URL=\"${NEXTAUTH_URL}\"" >> .env;
    echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env;
}

npx --yes prisma db push --accept-data-loss --skip-generate
node prisma/seed.js

echo ""
echo " * db * "
echo ""

echo " * Starting Server * "

node server.js
