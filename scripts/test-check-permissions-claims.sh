#!/usr/bin/env bash
#
# test-check-permissions-claims.sh — self-test för check-permissions-claims.sh.
#
# SJU FALL: T1 inga påståenden · T2 påstående utan täckning (FÄLLER) ·
# T3 påstående MED täckning · T4 tom deny-array räknas som frånvaro ·
# T5 beskrivande fil utanför GOVERNING_FILES fälls inte · T6 config saknas.
#
# T4 och T5 är de som gör grinden användbar i stället för irriterande: en tom
# `"deny": []` stoppar inget och ska räknas som frånvaro, och ett sessionsdok
# som KORREKT konstaterar att en mekanism saknas får aldrig fällas för det.
#
# Test-isolering: allt sker i en temp-katalog, återställd via trap.
# INGEN ändring av real-repo.
#
# Användning: bash scripts/test-check-permissions-claims.sh
# Exit 0 om alla sju passerar, annars 1.
#
# Källa: S91 Del 28 (grillningens A2:8) · ADR-039 § lesson→grind.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATE="${REPO_ROOT}/scripts/check-permissions-claims.sh"
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/test-perm-claims.XXXXXX")"
trap 'rm -rf "${TEST_DIR}"' EXIT

pass=0
fail=0

report() {
  local name="$1" expected="$2" actual="$3"
  if [[ "${expected}" == "${actual}" ]]; then
    printf '  ✅ %-58s exit=%s\n' "${name}" "${actual}"
    pass=$((pass + 1))
  else
    printf '  ❌ %-58s exit=%s (väntat %s)\n' "${name}" "${actual}" "${expected}"
    fail=$((fail + 1))
  fi
}

# Bygg en isolerad värld: styrande fil + settings + config.
# $1 = innehåll i styrande fil, $2 = settings-JSON, $3 = skriv config? (ja/nej)
build_world() {
  # Radera KATALOGEN, inte dess glob. `rm -rf dir/*` matchar inte dotfiles,
  # och configen heter `.permissions-claims-policy.conf` — den överlevde då
  # från föregående fall och gjorde T6 rött av fel skäl. Fångat 2026-07-30 av
  # den här sviten själv.
  rm -rf "${TEST_DIR:?}"
  mkdir -p "${TEST_DIR}/.claude"
  printf '%s\n' "$1" > "${TEST_DIR}/CLAUDE.md"
  printf '%s\n' "$2" > "${TEST_DIR}/.claude/settings.json"
  if [[ "${3:-ja}" == "ja" ]]; then
    cat > "${TEST_DIR}/.permissions-claims-policy.conf" <<'CONF'
# shellcheck shell=bash
# shellcheck disable=SC2034
GOVERNING_FILES=("CLAUDE.md")
SETTINGS_FILES=(".claude/settings.json")
CLAIMED_KEYS=("permissions.deny" "permissions.ask")
CLAIM_MARKERS=("mekaniserad" "spärr" "se \`settings")
CLAIM_WINDOW=2
CONF
  fi
}

run_gate() { (cd "${TEST_DIR}" && bash "${GATE}" >/dev/null 2>&1; echo $?); }

printf '\ntest-check-permissions-claims — sju fall\n'
printf '%.0s─' {1..70}; printf '\n'

# T1 — styrande fil utan permissions-påstående: grönt.
build_world "# Regler
Alla svar på svenska. Ingen lathet." '{}' ja
ec=$(run_gate)
report "T1 inga påståenden → grönt" 0 "${ec}"

# T2 — påstår deny som inte finns: FÄLLER. Detta är det skarpa fallet, och
# exakt det verkliga felet i hub-CLAUDE.md 2026-07-29.
build_world "# Regler
STOPPA-OCH-FRÅGA skrivs som text — mekaniserad som spärr, se
\`settings.json\` \`permissions.deny\`." '{}' ja
ec=$(run_gate)
report "T2 påstående utan täckning → fäller" 1 "${ec}"

# T3 — samma påstående, men regeln finns: grönt.
build_world "# Regler
Mekaniserad som spärr — se \`permissions.deny\`." \
  '{"permissions":{"deny":["Bash(rm -rf /)"]}}' ja
ec=$(run_gate)
report "T3 påstående MED täckning → grönt" 0 "${ec}"

# T4 — tom array. En tom deny stoppar inget; påståendet är lika falskt.
build_world "# Regler
Mekaniserad som spärr — se \`permissions.deny\`." \
  '{"permissions":{"deny":[]}}' ja
ec=$(run_gate)
report "T4 tom deny-array räknas som frånvaro → fäller" 1 "${ec}"

# T5 — beskrivande fil utanför GOVERNING_FILES. Ett sessionsdok måste kunna
# konstatera att en mekanism SAKNAS utan att fällas för att ha sagt ordet.
build_world "# Regler
Inget att se här." '{}' ja
mkdir -p "${TEST_DIR}/tasks/sessions"
printf 'Fyndet: filen påstod permissions.deny men ingen deny-lista finns.\n' \
  > "${TEST_DIR}/tasks/sessions/dok.md"
ec=$(run_gate)
report "T5 beskrivande fil utanför listan → grönt" 0 "${ec}"

# T6 — config saknas: konfigurationsfel (3), inte falskt grönt.
build_world "# Regler
Mekaniserad via \`permissions.deny\`." '{}' nej
ec=$(run_gate)
report "T6 config saknas → exit 3" 3 "${ec}"

# T7 — REGRESSIONSTEST. Ett OMNÄMNANDE är inte ett påstående. Detta är ordagrant
# den mening grindens första skarpa körning fällde (CONTRIBUTING.md:921) innan
# markör-kravet infördes — en referens till en framtida möjlig åtgärd, helt
# korrekt skriven. Fäller grinden här igen har den återfått sin trubbighet.
build_world "# Regler
**Läs den innan \`permissions.deny\` eller en tvingande hook övervägs.** Hela
poängen är att beslutet ska vila på siffror i stället för åsikter." '{}' ja
ec=$(run_gate)
report "T7 omnämnande utan påstående → grönt (regression)" 0 "${ec}"

printf '%.0s─' {1..70}; printf '\n'
printf '  %d godkända, %d underkända\n\n' "${pass}" "${fail}"
[[ ${fail} -eq 0 ]]
