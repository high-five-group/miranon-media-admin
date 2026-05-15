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

# Vita listan — publika docs som måste vara grön
FILES_PLAIN=(
  "README.md"
  "CHANGELOG.md"
  "SECURITY.md"
  "docs/byggplan.md"
  "docs/specs/BYGGPLAN-LÄTTLÄST-v3.md"
)

# Filer med sektion-baserad exklusion (CONTRIBUTING.md har
# `## Definition of Done — per session` + `## Definition of Done — per fas`)
FILE_WITH_EXCLUSION="CONTRIBUTING.md"

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
