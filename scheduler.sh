#!/bin/sh

while true;
do
    DATE=$(date +"%H:%M:%S")
    if [[ $DATE == "18:00:00" ]]
    then
        echo "Sending update Mail"
        source .env
        curl -G -v "127.0.0.1:$PORT/api/scheduler" --data-urlencode "DUH=$SCHEDULER_SECRET"
        sleep 1s
    fi

    if [[ $DATE == "03:00:00" ]]
    then
        echo "BACKUP Database"
        /usr/bin/mysqldump --opt -h $DATABASE_HOST -u $DATABASE_USER -p$DATABASE_PASSWORD $DATABASE_DB >> /backups/$(date +"%Y-%m-%d_%H-%M-%S")_timetrack.sql
        sleep 1s
    fi
done