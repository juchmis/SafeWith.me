#!/bin/sh

# go to root
cd `dirname $0`
cd ../..

QUNIT=./node_modules/qunit/bin/cli.js

PORT=8080

echo "\n--> run unit tests..."

# run unit tests
$QUNIT --code ./server/oauth.js --tests ./server/test/oauth_test.js

#echo "\n--> run integration tests...\n"

# start server for integration tests
#node server.js $PORT &

# get process id
#PID=$!
# wait the service to init
#sleep 0.5

# run integration tests
#node ./server/test/server_test.js $PORT

# wait for request to terminate
#sleep 0.5
# kill server process
#kill $PID
