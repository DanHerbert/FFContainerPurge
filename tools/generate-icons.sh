#!/bin/bash

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
ICONS_DIR="$(realpath "$SCRIPT_DIR"/../src/icons)"

themes=( 'dark' 'light' )
sizes=( 32 48 64 256 )

for theme in "${themes[@]}"; do
    theme_output="-$theme"
    if [[ $theme == 'dark' ]]; then
        theme_output=""
    fi
    for size in "${sizes[@]}"; do
        if [[ $size -eq 48 ]] && [[ $theme == 'light' ]]; then
            continue
        fi
        if [[ $theme == 'light' ]]; then
            sed -E -i 's/fill="[^\"]+"/fill="#fff"/' "$ICONS_DIR/fire-icon.svg"
        else
            sed -E -i 's/fill="[^\"]+"/fill="#000"/' "$ICONS_DIR/fire-icon.svg"
        fi
        rsvg-convert -h "$size" -w "$size" "$ICONS_DIR/fire-icon.svg" > "$ICONS_DIR/fire-icon-${size}${theme_output}.png"
    done
done
sed -E -i 's/fill="[^\"]+"/fill="#000"/' "$ICONS_DIR/fire-icon.svg"
