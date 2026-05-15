#!/usr/bin/env bash
# check-public-checklists.sh — scripted-checklist-check grindvakt.
# Per ADR-030 § Del 1.5. Etablerad: Session 6.6 K5 2026-05-14.
#
# Syfte: oavslutade `- [ ]` i publika docs är professionalitets-friktion.
# Legitim checklist-mall-användning (CONTRIBUTING.md § Definition of Done)
# undantas via per-sektion-medveten awk-pattern.
#
# Per-sektion-exklusion: `## Definition of Done`-rubrik triggar skip=1
# tills nästa `## `-rubrik (annan sektion), då skip=0. Säkerställer att
# `- [ ]`-rader UNDER en exklusions-sektion ignoreras MEN rader UNDER en
# följande sektion fångas normalt.
#
# CI-only-grindvakt — ingen pre-commit-hook (pre-commit reserveras för
# biome + K7-frontmatter).
#
# Felmeddelande-design (K11.5 11/10-disciplin): fil:rad-format
# (klickbart) + faktisk item-text + actionable fix-rekommendation.

set -euo pipefail

# === Ladda projekt-config ===
# Per K7 Lesson #6 (UNIVERSAL) hub-spoke-portabilitet — skriptet är
# universellt, värden är per-projekt. Retroaktiv refactor 2026-05-15
# (Session 6.6 fortsättning #2 K7.5).
CONFIG_FILE=".checklist-policy.conf"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Config saknas: $CONFIG_FILE (sök i: $(pwd))"
    echo "   Fix: skapa .checklist-policy.conf i repo-root."
    echo "        Se ADR-030 § Del 1 (position #5) för spec."
    echo "        Om detta är ett nytt spoke: kopiera från miranon-media-admin"
    echo "        och anpassa CHECKLIST_FILES_PLAIN-listan."
    exit 1
fi
# shellcheck source=/dev/null
source "$CONFIG_FILE"

# Verifiera att config har nödvändiga variabler
: "${CHECKLIST_FILES_PLAIN?Config saknar CHECKLIST_FILES_PLAIN}"
: "${CHECKLIST_FILE_WITH_EXCLUSION?Config saknar CHECKLIST_FILE_WITH_EXCLUSION}"

FILES_PLAIN=("${CHECKLIST_FILES_PLAIN[@]}")
FILE_WITH_EXCLUSION="$CHECKLIST_FILE_WITH_EXCLUSION"

errors_total=0
output=""

# Plain scan — filer utan sektion-exklusion
for f in "${FILES_PLAIN[@]}"; do
  if [[ ! -f "$f" ]]; then
    continue
  fi
  matches=$(grep -nE "^- \[ \]" "$f" || true)
  if [[ -n "$matches" ]]; then
    count=$(printf '%s\n' "$matches" | wc -l | tr -d ' ')
    errors_total=$((errors_total + count))
    output+="$(printf '%s\n' "$matches" | sed "s|^|$f:|")\n"
  fi
done

# Sektion-medveten scan av CONTRIBUTING.md
if [[ -f "$FILE_WITH_EXCLUSION" ]]; then
  matches=$(awk '
    /^## Definition of Done/ { skip=1; next }
    /^## / { skip=0 }
    !skip && /^- \[ \]/ { print NR": "$0 }
  ' "$FILE_WITH_EXCLUSION")
  if [[ -n "$matches" ]]; then
    count=$(printf '%s\n' "$matches" | wc -l | tr -d ' ')
    errors_total=$((errors_total + count))
    output+="$(printf '%s\n' "$matches" | sed "s|^|$FILE_WITH_EXCLUSION:|")\n"
  fi
fi

if [[ $errors_total -gt 0 ]]; then
  printf "ERROR: Unchecked items found in public docs:\n"
  printf "\n"
  printf "%b" "$output" | sort
  printf "\n"
  printf "Public docs should not contain unchecked items outside legitimate\n"
  printf "Definition of Done sections.\n"
  printf "\n"
  printf "Fix:\n"
  printf "  - Complete the items, OR\n"
  printf "  - Move them to tasks/todo.md (defer-tracking), OR\n"
  printf "  - Move them to active sessionsdok (work-in-progress)\n"
  printf "\n"
  printf "Total: %s unchecked item(s) in publika docs.\n" "$errors_total"
  exit 1
fi

echo "✅ No unchecked checklist items in public docs."
exit 0
