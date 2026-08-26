#!/usr/bin/env bash
#
# check-permissions-claims.sh — en styrande fil får inte påstå en
# permissions-mekanism som inte finns.
#
# INVARIANTEN, i en mening: nämner en styrande fil `permissions.deny` eller
# `permissions.ask`, ska den nyckeln faktiskt existera och vara icke-tom i
# någon settings-fil.
#
# VARFÖR DEN FINNS (S91, 2026-07-29). Hub-CLAUDE.md påstod på två ställen att
# regler var "mekaniserad som spärr — se settings.json permissions.deny".
# Ingen deny-lista fanns. Reglerna bröts aldrig — prosan fungerade — men
# ingen granskade dem på månader, eftersom filen sade att saken var löst.
#
# Grillningens A2:8 (Del 28) drog regeln: synden är inte prosa, synden är
# PROSA SOM PÅSTÅR SIG VARA MEKANISM. Marcus strök tre av fyra föreslagna
# spärrar; denna fick stå därför att den "fyrar noll gånger när Code har rätt,
# och exakt en gång när Code inte har det".
#
# VAD DEN MEDVETET INTE GÖR. Den läser inte påståendets innebörd — bara att
# den åberopade nyckeln existerar. Att avgöra om en deny-regel faktiskt täcker
# det prosan påstår kräver semantik, och en grind som gissar semantik fäller
# fel. Snävt och mekaniskt slår brett och ungefärligt.
#
# Config: .permissions-claims-policy.conf (projekt-specifika värden; denna
# logik är universell — se husets config-driven-konvention, Lesson #6).
#
# Exit: 0 grönt · 1 påstående utan täckning · 3 konfigurationsfel.

set -euo pipefail

CONFIG=".permissions-claims-policy.conf"

# SCRIPT_DIR-relativ, INTE cwd-relativ som CONFIG ovan: testsviten
# (scripts/test-check-permissions-claims.sh) kör detta skript med cwd =
# en mktemp-sandlåda (för att testa olika CONFIG-scenarier där), inte
# repo-roten — en cwd-relativ jq-guard-sökväg hade brutit där.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

die() { printf 'check-permissions-claims: %s\n' "$1" >&2; exit "${2:-3}"; }

# Deklarera FÖRE source. shellcheck kan inte spåra variabler över filgränser
# (SC2154), och husets övriga grindar löser samma sak med `: "${VAR:?}"` för
# skalärer. Arrayer behöver en tom deklaration i stället.
declare -a GOVERNING_FILES=() SETTINGS_FILES=() CLAIMED_KEYS=() CLAIM_MARKERS=()
CLAIM_WINDOW=0

[[ -f "${CONFIG}" ]] || die "config saknas: ${CONFIG} (kör från repo-roten)"
# shellcheck source=/dev/null
source "${CONFIG}"

[[ ${#GOVERNING_FILES[@]} -gt 0 ]] || die "GOVERNING_FILES är tom i ${CONFIG}"
[[ ${#CLAIMED_KEYS[@]} -gt 0 ]] || die "CLAIMED_KEYS är tom i ${CONFIG}"
[[ ${#CLAIM_MARKERS[@]} -gt 0 ]] || die "CLAIM_MARKERS är tom i ${CONFIG}"
[[ ${CLAIM_WINDOW} -ge 0 ]] || die "CLAIM_WINDOW är ogiltig i ${CONFIG}"

# --- Steg 1: vilka nycklar finns FAKTISKT, och är de icke-tomma? ------------
#
# En nyckel räknas som verklig endast om den finns OCH har minst ett element.
# En tom `"deny": []` är samma tomhet som ingen nyckel alls — den stoppar inget,
# och ett påstående som lutar sig mot den är lika falskt.
key_exists() {
  local dotted="$1" file jq_path
  # permissions.deny -> .permissions.deny
  jq_path=".$(printf '%s' "${dotted}" | tr '.' '\n' | paste -sd. -)"
  for file in "${SETTINGS_FILES[@]}"; do
    [[ -f "${file}" ]] || continue
    if jq -e "${jq_path} // empty | if type == \"array\" then length > 0 else . != null end" \
      "${file}" >/dev/null 2>&1; then
      return 0
    fi
  done
  return 1
}

jq_version_ok || die "jq krävs men saknas eller är för gammal i PATH (TASK-312, .jq-version-policy.conf)"

# --- Steg 2: leta påståenden och pröva vart och ett -------------------------
violations=0
claims_found=0

for key in "${CLAIMED_KEYS[@]}"; do
  # Matcha nyckeln som den skrivs i prosa: `permissions.deny`, permissions.deny,
  # "permissions" "deny". Punkten escapas så den inte blir wildcard.
  pattern="${key//./[.\"[:space:]]+}"

  for file in "${GOVERNING_FILES[@]}"; do
    [[ -f "${file}" ]] || continue

    while IFS=: read -r lineno text; do
      [[ -n "${lineno}" ]] || continue

      # Ett omnämnande är inte ett påstående. Kräv en markör som hävdar att
      # mekanismen FINNS — annars är raden en referens till något som kan
      # byggas, och den är korrekt skriven.
      #
      # Markören söks i ett FÖNSTER, inte på samma rad. Skälet är det verkliga
      # felet grinden byggdes för: i hub-CLAUDE.md är påståendet radbrutet —
      # "mekaniserad som spärr — se `settings.json`" på en rad, `permissions.deny`
      # på nästa. En samma-rad-kontroll missade det, vilket self-testens T2
      # fångade innan grinden landade.
      ctx_start=$((lineno - CLAIM_WINDOW)); [[ ${ctx_start} -lt 1 ]] && ctx_start=1
      ctx_end=$((lineno + CLAIM_WINDOW))
      context="$(sed -n "${ctx_start},${ctx_end}p" "${file}")"

      is_claim=0
      for marker in "${CLAIM_MARKERS[@]}"; do
        if printf '%s' "${context}" | grep -qiF "${marker}"; then
          is_claim=1
          break
        fi
      done
      [[ ${is_claim} -eq 1 ]] || continue

      claims_found=$((claims_found + 1))

      # key_exists anropas separat i stället för direkt i villkoret: en funktion
      # i `if`/`!` stänger av set -e i sitt anrop (SC2310), och här ÄR
      # returkoden svaret vi vill ha — inte ett fel som ska propagera.
      key_present=0
      # shellcheck disable=SC2310  # returkoden ÄR svaret, inte ett fel att propagera
      if key_exists "${key}"; then key_present=1; fi

      if [[ ${key_present} -eq 0 ]]; then
        if [[ ${violations} -eq 0 ]]; then
          printf '\n❌ Styrande fil påstår en permissions-mekanism som inte finns:\n\n'
        fi
        violations=$((violations + 1))
        # Trimma och korta i separata steg — en pipe i en command substitution
        # maskerar returvärdet (SC2312).
        excerpt="${text#"${text%%[![:space:]]*}"}"
        excerpt="${excerpt:0:100}"
        printf '  %s:%s\n' "${file}" "${lineno}"
        printf '    påstår: %s\n' "${key}"
        printf '    men:    nyckeln saknas eller är tom i %s\n' "${SETTINGS_FILES[*]}"
        printf '    rad:    %s\n\n' "${excerpt}"
      fi
    done < <(grep -nEi "${pattern}" "${file}" 2>/dev/null || true)
  done
done

if [[ ${violations} -gt 0 ]]; then
  cat >&2 <<'EOF'
Två vägar framåt, och valet är en riktig avvägning:

  1. BYGG MEKANISMEN. Lägg regeln i settings.json så påståendet blir sant.
  2. SKRIV OM PÅSTÅENDET. Regeln får vara prosa — men då ska den heta prosa,
     inte påstå en spärr. "Regeln gäller" är ärligt; "mekaniserad som spärr"
     är det inte.

Det som INTE är en väg: att tysta grinden. Den fyrar därför att ett dokument
säger något osant om systemet, och det felet läks bara i dokumentet eller i
systemet.

Källa: S91 Del 28 (grillningens A2:8).
EOF
  exit 1
fi

if [[ ${claims_found} -eq 0 ]]; then
  printf '✅ permissions-påståenden: inga funna i %d styrande filer (grönt — inget att pröva).\n' \
    "${#GOVERNING_FILES[@]}"
else
  printf '✅ permissions-påståenden: %d funna, samtliga har täckning i settings.\n' "${claims_found}"
fi
