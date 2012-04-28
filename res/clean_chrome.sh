#!/bin/sh

# Change to base directory of git project
cd `dirname $0`
cd ..

rm -rf ~/Library/Application\ Support/Google/Chrome/Default/File\ System/*
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Application\ Cache/Cache/*
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Local\ Storage/*