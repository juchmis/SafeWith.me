#!upstart
description "SafeWith.me node.js server"
author      "Tankred"

start on startup
stop on shutdown

script
    export HOME="/root"

    echo $$ > /var/run/safewithme.pid
    exec sudo -u ubuntu /usr/local/bin/node ~/SafeWith.me/src/server.js >> /var/log/safewithme.sys.log 2>&1
end script

pre-start script
    # Date format same as (new Date()).toISOString() for consistency
    echo "[`date -u +%Y-%m-%dT%T.%3NZ`] (sys) Starting" >> /var/log/safewithme.sys.log
end script

pre-stop script
    rm /var/run/safewithme.pid
    echo "[`date -u +%Y-%m-%dT%T.%3NZ`] (sys) Stopping" >> /var/log/safewithme.sys.log
end script
