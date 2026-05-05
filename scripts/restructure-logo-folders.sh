#!/bin/bash
# For every university folder:
# 1. Create a logo-search/ subfolder
# 2. Move the existing logo file(s) from logo/ into logo-search/
# The logo/ folder is then left empty, ready for multiple logo variants.

BASE="/Users/oscarwoldskaarderud/linkin idee/public/universities"

moved=0
skipped=0
created=0

find "$BASE" -mindepth 1 -maxdepth 2 -type d -name "logo" | while read logo_dir; do
  uni_dir=$(dirname "$logo_dir")
  search_dir="$uni_dir/logo-search"

  # Create logo-search dir if it doesn't exist
  mkdir -p "$search_dir"

  # Move all logo files from logo/ to logo-search/
  for f in "$logo_dir"/logo.*; do
    if [ -f "$f" ]; then
      filename=$(basename "$f")
      if [ ! -f "$search_dir/$filename" ]; then
        mv "$f" "$search_dir/$filename"
        echo "MOVED: $(basename $uni_dir)/logo/$filename → logo-search/$filename"
        ((moved++))
      else
        echo "SKIP (exists): $(basename $uni_dir)/logo-search/$filename"
        ((skipped++))
      fi
    fi
  done

  ((created++))
done

echo ""
echo "✅ Done!"
echo "   Folders processed: $created"
echo "   Files moved: $moved"
echo "   Files skipped (already existed): $skipped"
