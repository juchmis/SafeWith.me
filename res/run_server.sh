#!/bin/sh

# Change to base directory of git project
cd `dirname $0`
cd ../src

# Start with '--wipe' to delete datastore and blobstore to start with a fresh server
if [ "$1" = "--wipe" ]; then
	echo "TODO: --wipe"
fi

npm install
node server.js