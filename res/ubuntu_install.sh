#!/bin/sh

cd `dirname $0`

# install required packages
sudo apt-get update
sudo apt-get install nodejs npm

# install node depencies
cd ../src
npm install


# install upstart script for server daemon
cd ../res
sudo cp safewithme.conf /etc/init/

# install webservice to /var/www/
cd ..
sudo mkdir -p /var/www/safewithme
sudo cp -r src /var/www/safewithme
sudo mkdir /var/www/safewithme/res
sudo cp res/run_server.sh /var/www/safewithme/res

#create log file
sudo touch /var/log/safewithme.sys.log
sudo chown www-data:www-data /var/log/safewithme.sys.log



