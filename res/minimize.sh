#!/bin/bash

# Change to base directory of git project
cd `dirname $0`
cd ..

echo "Setup..."
_src="war/js";
_raw="res/safewithme.js";
_min="res/safewithme.min.js";
_compiler="res/compiler.jar";
:>"$_raw"
:>"$_min"

echo "Concatenating..."
# find "$_src" -name "safewithme*.js" -exec cat "{}" >> "$_raw" \;

# cat $_src/jquery-1.7.1.min.js >> "$_raw"
# cat $_src/bootstrap-2.0.1.min.js >> "$_raw"
# cat $_src/openpgp.min.js >> "$_raw"

# cat $_src/pdf.js >> "$_raw"

cat $_src/safewithme.util.js >> "$_raw"
cat $_src/safewithme.server.js >> "$_raw"
cat $_src/safewithme.crypto.js >> "$_raw"
cat $_src/safewithme.crypto.view.js >> "$_raw"
cat $_src/safewithme.cache.js >> "$_raw"
cat $_src/safewithme.menu.js >> "$_raw"
cat $_src/safewithme.menu.view.js >> "$_raw"
cat $_src/safewithme.fs.js >> "$_raw"
cat $_src/safewithme.fs.view.js >> "$_raw"
cat $_src/safewithme.js >> "$_raw"

echo "Minimizing..."
java -jar "$_compiler" --js "$_raw" --js_output_file "$_min" # --language_in=ECMASCRIPT5

echo "Deploying minified version..."
cp $_min $_src