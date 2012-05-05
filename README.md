## Store and share your files with OpenPGP encryption on any device via HTML5

* Homepage: http://safewith.me
* FAQ: https://github.com/tanx/SafeWith.me/wiki/FAQ
* Powered by: http://openpgpjs.org

## Development quick start

Install dependencies (e.g. with Macports):

    sudo port install nodejs npm
    cd src
    npm install

Start the server:

    node server.js 8888 --nossl

## Installation on Ubuntu Server (tested on 12.04 LTS AMD64)

Add your ssl certificate files:

    cd SafeWith.me  #git repo root
    mkdir ssl
    cp ssl.crt ssl.key sub.class1.server.ca.pem cp.pem ssl/

Install dependencies

    sudo apt-get update
    sudo apt-get install nodejs npm

Install the server daemon (including upstart and monit scripts):

    make ubuntu-install

The service should now be available at https://localhost:8888 and start automatically on reboot.