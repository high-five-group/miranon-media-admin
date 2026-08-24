#!/usr/bin/env bash
#
# check-claims-tackning.sh — täcknings-passet (ADR-073 Amendering 3 punkt 1,
# TASK-139).
#
# Körs av ORKESTRATORN FÖRE en parallell-batch-avfyrning — aldrig av CI (se
# kortets § "CI-inwiring — explicit AVGRÄNSAD BORT"; en generisk push har
# varken pipelines eller ett manifest att pröva).
#
# INVARIANTEN, i en mening: varje horisontell delad yta i registret
# (.claims-tackning-policy.conf) måste ha FÅTT en explicit disposition av
# minst en pipeline i claims-manifestet — aldrig tyst utelämnad.
#
# VARFÖR DEN FINNS (S75-gap-klassen). ADR-073 Amendering 3 punkt 1: en
# kollisions-check (overlap mellan kort) fångar INTE inkompletta claims.
# S75-premiären (samtliga 21 återstående kort i den batchen): 15/21 verdicts
# GAP — en registerpost som varken var tillåten eller förbjuden yta för
# något kort, trots att kollisions-checken var grön. Mekaniseringen ersätter
# orkestrator-vaksamhet (~9 %-klassen, ADR-053-grunden) med en grind.
#
# --- Claims-manifestets format ----------------------------------------------
#
# JSON, sökväg via argument. Författas av orkestratorn per batch-avfyrning:
#
#   {
#     "pipelines": {
#       "<pipeline-id>": {
#         "claims": ["<allowed-glob>", ...],
#         "dispositions": {
#           "<registerpost-namn>": "enda-agare" | "fasat" | "ej-berord",
#           ...
#         }
#       },
#       ...
#     }
#   }
#
# <registerpost-namn> måste matcha en post i SHARED_SURFACE_NAMES
# (.claims-tackning-policy.conf). "claims" konsumeras INTE av detta skript
# (den parvisa kollisions-checken och claims-kvittot är andra mekanismer,
# explicit avgränsade bort i TASK-139 — se kortets § samma namn) men hör
# hemma i manifestet av samma skäl orkestratorn redan författar den: det är
# EN artefakt per batch-avfyrning, inte två.
#
# De tre disposition-värdena (fast vokabulär — del av mekanismens kontrakt,
# inte spoke-specifik data, därför hårdkodad här snarare än i configen):
#   enda-agare   exakt en pipeline äger ytan exklusivt denna batch
#   fasat        ytan delas medvetet mellan flera pipelines (fasat schema)
#   ej-berord    ingen pipeline i batchen rör ytan denna gång
#
# --- Vad grinden fäller på ---------------------------------------------------
#
# 1. TÄCKNINGSGAP (exit 1): en registerpost saknas HELT i manifestet — ingen
#    pipeline har gett den en giltig disposition. Detta är ordagrant
#    "aldrig onämnd" — S75-gap-klassen.
# 2. DUBBEL-ÄGD UTAN FASAT (exit 2): två eller fler pipelines hävdar
#    "enda-agare" över SAMMA registerpost, och ingen av dem har markerat
#    "fasat" för den posten. Ett giltigt fasat-schema (minst en "fasat"-
#    disposition för posten) upphäver inte kravet på gapfrihet, men det
#    upphäver denna specifika konflikt-klass.
# 3. KONFIGURATIONS-/MANIFEST-FEL (exit 3): config saknas, manifestet finns
#    inte, eller manifestet är inte giltig JSON / saknar ett "pipelines"-
#    objekt.
#
# Exit 0: varje registerpost har minst en giltig, entydig disposition.
#
# Config: .claims-tackning-policy.conf (SHARED_SURFACE_NAMES +
# SHARED_SURFACE_GLOBS — projekt-specifika; skriptets logik är universell,
# se husets config-driven-konvention, Lesson #6).
#
# Användning: scripts/check-claims-tackning.sh <manifest.json>
#
# Källor: docs/decisions/ADR-073-parallella-batch-pipelines.md
# Amendering 3 punkt 1+2 (citerad, inte flyttad) ·
# plugins/marcus-system/skills/work-batch/SKILL.md § "Parallell form"
# delta 1.

set -uo pipefail

CONFIG=".claims-tackning-policy.conf"

# SCRIPT_DIR-relativ, INTE cwd-relativ som CONFIG ovan: testsviten
# (scripts/test-check-claims-tackning.sh) kör detta skript med cwd =
# en mktemp-sandlåda (för att testa olika CONFIG-scenarier där), inte
# repo-roten — en cwd-relativ jq-guard-sökväg hade brutit där.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

die() { printf 'check-claims-tackning: %s\n' "$1" >&2; exit "${2:-3}"; }

[[ $# -ge 1 ]] || die "användning: check-claims-tackning.sh <manifest.json>"
MANIFEST="$1"

jq_version_ok || die "jq krävs men saknas eller är för gammal i PATH (TASK-312, .jq-version-policy.conf)"

# Deklarera FÖRE source (shellcheck SC2154 — se check-permissions-claims.sh
# för samma motiv; arrayer behöver en tom deklaration). SHARED_SURFACE_GLOBS
# sourcas men konsumeras medvetet inte av detta skript (se header) — ingen
# föredeklaration behövs för en variabel som aldrig refereras.
declare -a SHARED_SURFACE_NAMES=()

[[ -f "${CONFIG}" ]] || die "config saknas: ${CONFIG} (kör från repo-roten)"
# shellcheck source=/dev/null
source "${CONFIG}"

[[ ${#SHARED_SURFACE_NAMES[@]} -gt 0 ]] || die "SHARED_SURFACE_NAMES är tom i ${CONFIG}"

[[ -f "${MANIFEST}" ]] || die "manifest saknas: ${MANIFEST}"

jq_err="$(jq empty "${MANIFEST}" 2>&1 1>/dev/null)"
if [[ -n "${jq_err}" ]]; then
  die "manifestet är inte giltig JSON (${MANIFEST}): ${jq_err}"
fi

if ! jq -e '.pipelines | type == "object"' "${MANIFEST}" >/dev/null 2>&1; then
  die "manifestet saknar ett giltigt \"pipelines\"-objekt (${MANIFEST})"
fi

# PORTABILITET: ingen `mapfile`/`readarray` (bash 4+) — macOS levererar
# bash 3.2, så en mapfile-form fungerar i CI men aldrig lokalt (samma fälla
# dokumenterad i check-backlog-closure.sh). `while read` kör i båda.
pipeline_ids=()
pipeline_ids_raw="$(jq -r '.pipelines | keys[]' "${MANIFEST}")"
while IFS= read -r pid; do
  [[ -n "${pid}" ]] || continue
  pipeline_ids+=("${pid}")
done <<<"${pipeline_ids_raw}"

# Fast vokabulär — se header. Inte spoke-data, hör hemma i skriptet.
VALID_DISPOSITIONS=("enda-agare" "fasat" "ej-berord")

is_valid_disposition() {
  local val="$1" v
  for v in "${VALID_DISPOSITIONS[@]}"; do
    [[ "${val}" == "${v}" ]] && return 0
  done
  return 1
}

gaps=()
conflicts=()

for post in "${SHARED_SURFACE_NAMES[@]}"; do
  valid_owners=()   # pipeline-id:ar med "enda-agare"
  valid_fasat=()    # pipeline-id:ar med "fasat"
  any_valid=0
  invalid_seen=()

  # Bash 3.2 (macOS default): "${arr[@]}" på en TOM array är "unbound
  # variable" under `set -u` (fixat först i bash 4.4) — ett tomt
  # "pipelines": {} i manifestet hade annars kraschat skriptet lokalt men
  # aldrig i CI (ubuntu-latest kör bash 5.x). Samma fälla dokumenterad i
  # check-backlog-closure.sh; guarda med en längd-check FÖRE expansionen.
  if [[ ${#pipeline_ids[@]} -gt 0 ]]; then
    for pid in "${pipeline_ids[@]}"; do
      val="$(jq -r --arg pid "${pid}" --arg post "${post}" \
        '.pipelines[$pid].dispositions[$post] // empty' "${MANIFEST}")"
      [[ -n "${val}" ]] || continue

      # is_valid_disposition anropas separat i stället för direkt i villkoret:
      # en funktion i if/! stänger av set -e i sitt anrop (SC2310) — samma
      # mönster som check-permissions-claims.sh key_exists.
      ok=0
      # shellcheck disable=SC2310  # returkoden ÄR svaret, inte ett fel att propagera
      if is_valid_disposition "${val}"; then ok=1; fi

      if [[ ${ok} -eq 0 ]]; then
        invalid_seen+=("${pid}=${val}")
        continue
      fi

      any_valid=1
      case "${val}" in
        enda-agare) valid_owners+=("${pid}") ;;
        fasat) valid_fasat+=("${pid}") ;;
        *) ;; # ej-berord — inget att räkna
      esac
    done
  fi

  if [[ ${any_valid} -eq 0 ]]; then
    if [[ ${#invalid_seen[@]} -gt 0 ]]; then
      gaps+=("${post} (ogiltiga värden: ${invalid_seen[*]})")
    else
      gaps+=("${post}")
    fi
    continue
  fi

  if [[ ${#valid_owners[@]} -ge 2 && ${#valid_fasat[@]} -eq 0 ]]; then
    conflicts+=("${post} (enda-agare hävdad av: ${valid_owners[*]})")
  fi
done

if [[ ${#gaps[@]} -gt 0 ]]; then
  printf '\n❌ Täckningsgap — registerpost saknar en giltig disposition i manifestet:\n\n' >&2
  for g in "${gaps[@]}"; do
    printf '  %s\n' "${g}" >&2
  done
  printf '\nGap läks i claims-designen FÖRE avfyrning (ADR-073 Amendering 3 punkt 1).\n' >&2
  printf 'Källa: S75-premiären, 15/21 kort GAP.\n' >&2
  exit 1
fi

if [[ ${#conflicts[@]} -gt 0 ]]; then
  printf '\n❌ Dubbel-ägd registerpost utan fasat-markering:\n\n' >&2
  for c in "${conflicts[@]}"; do
    printf '  %s\n' "${c}" >&2
  done
  printf '\nTvå pipelines kan inte båda hävda enda-ägarskap över samma yta. ' >&2
  printf 'Markera minst en "fasat" eller omdesigna claims (ADR-073 beslut 1).\n' >&2
  exit 2
fi

printf '✅ täcknings-pass: %d registerposter, samtliga har en giltig, entydig disposition.\n' \
  "${#SHARED_SURFACE_NAMES[@]}"
