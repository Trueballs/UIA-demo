#!/bin/bash
# Merges domain-named folders into proper university name folders, then removes duplicates.

BASE="/Users/oscarwoldskaarderud/linkin idee/public/universities"

merge() {
  local domain="$1"
  local name="$2"
  local src="$BASE/$domain"
  local dst_logo="$BASE/$name/logo"

  if [ ! -d "$src" ]; then
    echo "SKIP (not found): $domain"
    return
  fi

  # Copy any logo files if destination doesn't already have them
  for ext in png svg webp jpg; do
    if [ -f "$src/logo.$ext" ]; then
      if [ ! -f "$dst_logo/logo.$ext" ]; then
        mkdir -p "$dst_logo"
        cp "$src/logo.$ext" "$dst_logo/logo.$ext"
        echo "COPIED: $domain/logo.$ext → $name/logo/logo.$ext"
      else
        echo "SKIP (exists): $name already has logo.$ext"
      fi
    fi
  done

  rm -rf "$src"
  echo "REMOVED: $domain"
}

merge "abdn.ac.uk"      "University of Aberdeen"
merge "aber.ac.uk"      "Aberystwyth University"
merge "abertay.ac.uk"   "Abertay University"
merge "aru.ac.uk"       "Anglia Ruskin University"
merge "aston.ac.uk"     "Aston University"
merge "aub.ac.uk"       "Arts University Bournemouth"
merge "aup.ac.uk"       "Arts University Plymouth"
merge "bangor.ac.uk"    "Bangor University"
merge "bath.ac.uk"      "University of Bath"
merge "bathspa.ac.uk"   "Bath Spa University"
merge "bbk.ac.uk"       "Birkbeck University of London"
merge "beds.ac.uk"      "University of Bedfordshire"
merge "birmingham.ac.uk" "University of Birmingham"

echo ""
echo "✅ Done! Remaining folders:"
ls "$BASE" | wc -l
echo ""
echo "Checking for any remaining domain-style folders:"
ls "$BASE" | grep "\."
