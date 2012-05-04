Store and share your files with OpenPGP encryption on any device via HTML5
===

### Learn more:

* Homepage: http://safewith.me
* FAQ: https://github.com/tanx/SafeWith.me/wiki/FAQ
* Powered by: http://openpgpjs.org

### Development quick start:

Install node.js, npm and mongodb (e.g. with Macports):

    sudo port install nodejs npm mongodb

Start the server:

    node src/server.js 8888 --nossl

### Installation on Ubuntu Server (tested on 12.04 LTS AMD64)

Add your ssl certificate files

    cd SafeWith.me  #git repo root
    mkdir ssl
    cp ssl.crt ssl.key sub.class1.server.ca.pem cp.pem ssl/

Install the server daemon (including upstart and monit scripts)

    make ubuntu-install

The service should now be available on https://localhost:8888