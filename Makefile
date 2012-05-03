default: help

help:
	@echo "update         - get latest sources"
	@echo "ubuntu-install - install the daemon on ubuntu"
	@echo "minify         - makes JavaScript download and run faster"
	@echo "server         - starts a fresh server with empty db and blob-store"
	@echo "clean-chrome   - wipes Chrome's locally cached data"
	@echo "test           - runs JavaScript unit tests"

update: update-me update-deps

update-me:
	@git pull

update-deps:
	@git submodule foreach git pull

minify:
	@echo See http://code.google.com/closure/compiler/
	@./res/minimize.sh

server:
	@echo Starting server...
	@./res/run_server.sh

ubuntu-install:
	@echo Installing Daemon...
	@./res/ubuntu_install.sh

clean-chrome:
	@echo Deleting Chrome LocalStorage, AppCache and FileSystem data
	@./res/clean_chrome.sh

test:
	@echo Running tests...
	@./src/server/test/test.sh
