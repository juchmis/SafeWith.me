#!/bin/bash

# Change to base directory of git project
cd `dirname $0`
cd ..

echo "Setup..."
_src="lib/openpgpjs/src";
_raw="res/openpgp.worker.js";
_min="res/openpgp.worker.min.js";
_compiler="res/compiler.jar";
:>"$_raw"
:>"$_min"

echo "Concatenating..."

cat $_src/util/util.js >> "$_raw"
cat $_src/ciphers/hash/sha.js >> "$_raw"
cat $_src/ciphers/symmetric/aes.js >> "$_raw"
cat $_src/ciphers/openpgp.cfb.js >> "$_raw"
cat $_src/ciphers/openpgp.crypto.sym.js >> "$_raw"

echo "Minimizing..."
java -jar "$_compiler" --js "$_raw" --js_output_file "$_min" # --language_in=ECMASCRIPT5

echo "Deploying minified version..."
cp $_min war/js