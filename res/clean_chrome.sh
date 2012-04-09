#!/bin/sh

# Change to base directory of git project
cd `dirname $0`
cd ..

rm -r ~/Library/Application\ Support/Google/Chrome/Default/File\ System/*
rm -r ~/Library/Application\ Support/Google/Chrome/Default/Application\ Cache/Cache/*
rm -r ~/Library/Application\ Support/Google/Chrome/Default/Local\ Storage/*