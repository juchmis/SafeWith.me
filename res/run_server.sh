#!/bin/sh

# Change to base directory of git project
cd `dirname $0`
cd ..

# Set to current google appenginge SDK directory
GAE_SDK=/Applications/eclipse/plugins/com.google.appengine.eclipse.sdkbundle_1.6.4.v201203300216r37/appengine-java-sdk-1.6.4

# Start with '--wipe' to delete datastore and blobstore to start with a fresh server
if [ "$1" = "--wipe" ]; then
	rm -rf war/WEB-INF/appengine-generated/
fi

$GAE_SDK/bin/dev_appserver.sh --port=8888 war