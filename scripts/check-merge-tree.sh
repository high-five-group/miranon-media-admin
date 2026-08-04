#!/usr/bin/env bash
#
# check-merge-tree.sh — merge-tree-grinden (ADR-073 beslut 4, TASK-139).
#
# Körs av ORKESTRATORN efter en parallell-batch-agents push, FÖRE `gh pr
# create` — aldrig av CI (se kortets § "CI-inwiring — explicit AVGRÄNSAD
# BORT"; en generisk push har varken riktiga grenar eller ett skäl att
# jämföra dem).
#
# VAD DEN GÖR: `git fetch` mot bas-grenen (färskhets-kravet — worktree-
# familjen delar .git, så `origin/main`-refen är en DELAD RÖRLIG YTA under
# parallell drift, ADR-073 Amendering 3 punkt 3-kontexten) och därefter
# `git merge-tree --write-tree <bas> <gren>`. Skriver ALDRIG till
# arbetsträd eller index — `--write-tree` producerar ett löst trädobjekt,
# aldrig en checkout eller en HEAD-flytt (git-scm.com/docs/git-merge-tree).
#
# EXITKODEN PROPAGERAS RAKT AV från git självt, ingen mellanledd pipe
# (L440 — en pipe till `tail`/`head` sväljer den riktiga koden):
#   0   konfliktfri merge
#   1   konflikt (konfliktlistan skrivs ut + klassificeras, se nedan)
#   >1  git kunde inte slutföra försöket (fel argument, ingen
#       gemensam historik, etc. — git-scm.com/docs/git-merge-tree)
#
# VID EXIT 1 klassificeras VARJE konfliktande sökväg mot
# .merge-tree-mandat-policy.conf (mandat-berättigade path-mönster, ADR-073
# Amendering 3 punkt 3): enbart mandat-berättigade filer i konflikten →
# "mandat-berättigad" skrivs ut (mekanisk lösningsväg finns — SKRIPTET LÖSER
# INGET AUTOMATISKT, det bara klassificerar); minst en icke-mandat-fil →
# "HALT" skrivs ut (kontraktets halt-first, oförändrat).
#
# Användning: scripts/check-merge-tree.sh <gren> [<bas-gren>]
#   <gren>      grenen som ska prövas mot bas (t.ex. task/139-...)
#   <bas-gren>  default: origin/main
#
# Config: .merge-tree-mandat-policy.conf (projekt-specifika path-mönster;
# denna logik är universell — se husets config-driven-konvention,
# Lesson #6).
#
# Källor: docs/decisions/ADR-073-parallella-batch-pipelines.md
# Amendering 3 punkt 3 (citerad, inte flyttad) ·
# plugins/marcus-system/skills/work-batch/SKILL.md § "Parallell form" delta 4
# · git-scm.com/docs/git-merge-tree.

set -uo pipefail
# Notera: INTE `-e`. Vi läser git:s egen exitkod som SIGNAL (0/1/>1), och
# `-e` hade avslutat skriptet vid exit 1 innan klassificeringen körde.

CONFIG=".merge-tree-mandat-policy.conf"

die() { printf 'check-merge-tree: %s\n' "$1" >&2; exit "${2:-3}"; }

[[ $# -ge 1 ]] || die "användning: check-merge-tree.sh <gren> [<bas-gren>]"
BRANCH="$1"
BASE="${2:-origin/main}"

# Deklarera FÖRE source (shellcheck SC2154 — se check-permissions-claims.sh
# för samma motiv).
declare -a MANDAT_PATTERNS=()

[[ -f "${CONFIG}" ]] || die "config saknas: ${CONFIG} (kör från repo-roten)"
# shellcheck source=/dev/null
source "${CONFIG}"

[[ ${#MANDAT_PATTERNS[@]} -gt 0 ]] || die "MANDAT_PATTERNS är tom i ${CONFIG}"

# --- Färskhet: git fetch mot bas-grenen -------------------------------------
#
# BASE kan vara "origin/main" (default) eller en annan "<remote>/<ref>"-form.
# Utan "/" antas den vara en ref på "origin".
if [[ "${BASE}" == */* ]]; then
  fetch_remote="${BASE%%/*}"
  fetch_ref="${BASE#*/}"
else
  fetch_remote="origin"
  fetch_ref="${BASE}"
fi

if ! git fetch "${fetch_remote}" "${fetch_ref}" --quiet; then
  die "git fetch ${fetch_remote} ${fetch_ref} misslyckades" 3
fi

# --- Grinden: git merge-tree --write-tree -----------------------------------
output="$(git merge-tree --write-tree --name-only "${BASE}" "${BRANCH}" 2>&1)"
git_exit=$?

if [[ ${git_exit} -eq 0 ]]; then
  printf '✅ merge-tree: konfliktfri (%s mot %s).\n' "${BRANCH}" "${BASE}"
  exit 0
fi

if [[ ${git_exit} -ne 1 ]]; then
  printf '❌ merge-tree: git kunde inte slutföra försöket (exit %d) — %s mot %s.\n' \
    "${git_exit}" "${BRANCH}" "${BASE}" >&2
  printf '%s\n' "${output}" >&2
  exit "${git_exit}"
fi

# --- exit 1: konflikt. Extrahera konfliktlistan ur --name-only-utdatan -----
#
# Formatet (mätt manuellt mot git 2.50.1, S97/TASK-139): rad 1 = tree-OID,
# därefter en rad per konfliktande sökväg, avslutat av en TOM rad —
# därefter följer informationsmeddelanden (Auto-merging/CONFLICT-raderna),
# ointressanta för klassificeringen.
conflicts="$(printf '%s\n' "${output}" | sed -n '2,/^$/p' | sed '$d')"

if [[ -z "${conflicts}" ]]; then
  printf '❌ merge-tree: exit 1 men ingen konfliktlista kunde parsas ur git:s utdata:\n' >&2
  printf '%s\n' "${output}" >&2
  exit 1
fi

printf '⚠️  merge-tree: konflikt (%s mot %s). Konfliktande sökvägar:\n\n' "${BRANCH}" "${BASE}"

halt=0
while IFS= read -r path; do
  [[ -n "${path}" ]] || continue
  mandat=0
  for pattern in "${MANDAT_PATTERNS[@]}"; do
    if [[ "${path}" =~ ${pattern} ]]; then
      mandat=1
      break
    fi
  done
  if [[ ${mandat} -eq 1 ]]; then
    printf '  mandat-berättigad  %s\n' "${path}"
  else
    printf '  HALT               %s\n' "${path}"
    halt=1
  fi
done <<<"${conflicts}"

printf '\n'
if [[ ${halt} -eq 1 ]]; then
  printf '❌ HALT: minst en konfliktfil ligger utanför det bundna upplösnings-mandatet (ADR-073 Amendering 3 punkt 3). Merge-agenten löser INTE detta automatiskt.\n' >&2
else
  printf 'ℹ️  Samtliga konfliktfiler är mandat-berättigade — mekanisk lösningsväg finns (se ADR-073 Amendering 3 punkt 3). Skriptet löser INGET automatiskt; orkestratorn/agenten utför lösningen.\n'
fi

exit 1
