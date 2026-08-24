#!/usr/bin/env bash
# scripts/katalogagarskap-slapp.sh — släpper ägarlappen vid SessionEnd.
#
# VARFÖR SKRIPTET FINNS: T120-rotorsaken. Ägarlappen (tagen av
#   deny-frammande-huvudkatalog.sh § ÄGARSKAP-TAGANDE vid första
#   git-skrivningen, inte längre av detta repos katalogagarskap-markor.sh)
#   bär IDENTITET + LIVSTID via PID (§ LIVENESS-PRÖVNING) + TYSTNAD
#   (§ ÄGARSKAP-TAGANDE, fjärde verbet) — men varken PID-liveness eller
#   tystnads-övertagandet fångar OMEDELBART en session som avslutas LOGISKT
#   medan processen fortsätter köra (tystnaden kräver att tröskeln hinner
#   passera). Detta skript är ETT SNABBARE BÄLTE ovanpå de mekanismerna, inte
#   en ersättning — se § VAD SOM INTE FÅNGAS nedan.
#
# ═══ TVÅ SAKER SOM LÅTER LIKA MEN INTE HAR MED VARANDRA ATT GÖRA ═══
#
#   Full förklaring i scripts/katalogagarskap-markor.sh § TVÅ SAKER SOM LÅTER
#   LIKA. Kort: `session-end` (pluginets disciplin-skill, skriver
#   `lifecycle: closed` i ett sessionsdok) och `SessionEnd` (harnessets
#   hook-event, DETTA skripts trigger) är inte samma sak. Lappen är knuten
#   till PROCESSEN, inte till `lifecycle`-fältet.
#
# ═══ VARFÖR SessionEnd HÅLLER HÄR TROTS pluginets stada-worktrees.sh-DECLINE ═══
#
#   plugins/marcus-system/scripts/stada-worktrees.sh avstod uttryckligen från
#   SessionEnd (2026-07-30) med motiveringen: "harnessets SessionEnd fyrar
#   vid varje /clear och exit, inte vid vår LOGISKA sessionsgräns (S91 → S92)
#   — fel granularitet, och städning ingen bett om är värre än ingen städning."
#
#   Den decline:n gäller INTE här, av ett strukturellt skäl, inte bara ett
#   sakskäl: stada-worktrees.sh städar en FLERSESSIONERS ARBETSENHET (en
#   pausad S97 SKA behålla sina worktrees över flera /clear inom samma
#   sessionsnummer) — /clear är fel gräns FÖR DEN. Denna lapp uttrycker ETT
#   ENDA ANSPRÅK: "just nu, i just detta terminalfönster, äger session X
#   huvudkatalogen." /clear byter session_id i SAMMA fönster — det gamla
#   anspråket ÄR per definition slut när dess context rensas, oavsett om
#   samma OS-process lever vidare. /clear ÄR alltså den rätta gränsen för
#   just detta anspråk, inte fel granularitet.
#
# ═══ VAD SOM INTE FÅNGAS ═══
#
#   SIGKILL, strömavbrott, krasch — allt som hoppar över SessionEnd-eventet
#   helt. Det är EXAKT det fall PID-liveness i deny-frammande-huvudkatalog.sh
#   redan täcker (`kill -0` mot en död process, tyst övertagande). De två
#   mekanismerna täcker olika hälfter av samma problem; ingen ersätter den
#   andra — se den filens § ÄGARSKAP-TAGANDE för alla fyra lagren
#   (tas/behålls/övertas/släpps) i sammanhang.
#
# ENDAST EXAKT TRÄFF: lappen tas bort OM OCH ENDAST OM dess `session_id` är
#   DENNA sessions — aldrig svepande. En session som aldrig tog lappen (t.ex.
#   en worktree-session, som aldrig är berättigad att ta den — se
#   deny-frammande-huvudkatalog.sh § VARFÖR "TA" BARA GÄLLER...) rör alltså
#   aldrig lappen här.
#
# INPUT: SessionEnd hook-JSON på stdin (`session_id`, `cwd`, `reason`) —
#   bekräftat mot code.claude.com/docs/en/hooks 2026-08-04. SessionEnd har
#   INGEN beslutskontroll ("SessionEnd supports side effects only — no
#   decision control or blocking capability") — skriptet producerar därför
#   ingen stdout-JSON och kan inte blockera sessionens avslut.
#
# FAIL-OPEN, SAMMA HÅLLNING SOM SYSKON-SKRIPTEN: varje internt fel (jq/git
#   saknas, ingen policyfil, ingen lapp, session_id matchar inte) avslutar
#   tyst med exit 0. Värsta utfallet av ett fel HÄR är att en lapp blir kvar
#   en stund för länge — PID-liveness fångar den ändå vid nästa git-skrivning.
#
# Testsvit: scripts/test-deny-frammande-huvudkatalog.sh SIDA 5 (samma rigg
#   som markör- och prövningshooken).
#
# Källa: T120-rotorsaken · ADR-090 beslut 2 ·
#        scripts/katalogagarskap-markor.sh (§ TVÅ SAKER SOM LÅTER LIKA,
#        § --SLAPP-LÄGE) · scripts/deny-frammande-huvudkatalog.sh
#        (§ LIVENESS-PRÖVNING, § ÄGARSKAP-TAGANDE) · code.claude.com/docs/en/hooks ·
#        plugins/marcus-system/scripts/stada-worktrees.sh (decline-precedent,
#        avgränsad ovan)
# Etablerad: S97, 2026-08-04 (T120)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
KATALOG_POLICY="${KATALOG_POLICY:-${SCRIPT_DIR}/../.katalogagarskap-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

jq_version_ok > /dev/null 2>&1 || exit 0
command -v git >/dev/null 2>&1 || exit 0
[[ -f "${KATALOG_POLICY}" ]] || exit 0
# shellcheck source=/dev/null
source "${KATALOG_POLICY}" 2>/dev/null || exit 0

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || exit 0

SESSION_ID="$(printf '%s' "${INPUT}" | jq -r '.session_id // empty' 2>/dev/null)"
[[ -n "${SESSION_ID}" ]] || exit 0

# Kör i sessionens egen katalog, precis som markör-hooken — `cwd` ur
# hook-inputen är auktoritativ.
HOOK_CWD="$(printf '%s' "${INPUT}" | jq -r '.cwd // empty' 2>/dev/null)"
if [[ -n "${HOOK_CWD}" && -d "${HOOK_CWD}" ]]; then
    cd "${HOOK_CWD}" 2>/dev/null || exit 0
fi

COMMON_DIR="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || exit 0
[[ -n "${COMMON_DIR}" ]] || exit 0

MARKOR="${COMMON_DIR}/${KATALOG_MARKOR_FILNAMN:-katalogagarskap-agare.json}"
[[ -f "${MARKOR}" ]] || exit 0

AGARE="$(jq -r '.session_id // empty' "${MARKOR}" 2>/dev/null)"
[[ -n "${AGARE}" ]] || exit 0

# EXAKT träff, aldrig svepande — se § ENDAST EXAKT TRÄFF ovan. En session som
# inte äger lappen rör den inte, oavsett skäl (`reason`) för avslutet.
[[ "${AGARE}" = "${SESSION_ID}" ]] || exit 0

rm -f "${MARKOR}" 2>/dev/null
exit 0
