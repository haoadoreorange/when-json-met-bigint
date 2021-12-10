#!/bin/sh
set -eu
WORKSPACE="$(dirname "$(realpath "$0")")"

echo "*Generated from README.raw.md, any modifications will be overwritten.*" >README.md
cat "$WORKSPACE"/README.raw.md >>README.md
for file in "$WORKSPACE"/benchmark/results/*; do
    whole_name="$(basename "$file")"
    filename="${whole_name%.*}"
    extension="${whole_name##*.}"
    if [ "$extension" = "html" ]; then
        {
            echo
            echo "- $(echo "$filename" | sed "s|-| |g" | sed "s|.table||g")"
            echo
            cat "$file"
            echo
        } >>README.md
    fi
done
