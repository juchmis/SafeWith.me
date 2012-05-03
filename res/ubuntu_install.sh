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