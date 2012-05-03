#!/bin/sh

# set directories
INSTALL_DIR=/var/www/safewithme
LOG_FILE=/var/log/safewithme.sys.log

# install required packages
sudo apt-get update
sudo apt-get install nodejs npm

cd `dirname $0`

# install node depencies
cd ../src
npm install

# install upstart script for server daemon
cd ../res
sudo cp safewithme.conf /etc/init/

# install webservice to /var/www/
echo installing to $INSTALL_DIR
cd ..
sudo mkdir -p $INSTALL_DIR
sudo cp -r src $INSTALL_DIR
sudo mkdir -p $INSTALL_DIR/res
sudo cp res/run_server.sh $INSTALL_DIR/res

# copy ssl files (only required the first time)
sudo cp -r ssl $INSTALL_DIR

#create log file
echo creating log-file $LOG_FILE
sudo touch $LOG_FILE

# channge permission
sudo chown www-data:www-data $LOG_FILE
sudo chown -R www-data:www-data $INSTALL_DIR
sudo chmod -R 500 $INSTALL_DIR/ssl
