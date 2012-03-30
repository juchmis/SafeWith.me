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
find "$_src" -name "*.js" -exec cat "{}" >> "$_raw" \;

echo "Minimizing..."
java -jar "$_compiler" --js "$_raw" --js_output_file "$_min"
