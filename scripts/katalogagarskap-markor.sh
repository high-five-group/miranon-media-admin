#!/usr/bin/env bash
# scripts/katalogagarskap-markor.sh — RAPPORTERAR en främmande ägarlapp vid
# SessionStart. Skriver den ALDRIG. Se § ÄGARSKAP TAS VID SKRIVNING nedan för
# varför — det är en rivning av en tidigare form, inte den ursprungliga.
#
# VARFÖR SKRIPTET FINNS: ADR-090 beslut 2 (ägarskaps-regeln) fanns bara i
#   prosa och bröts tre gånger i ETT pass (S96 Del 8). Prövningen bor i
#   scripts/deny-frammande-huvudkatalog.sh, som SEDAN T120 även äger
#   SKRIVNINGEN av lappen (§ ÄGARSKAP TAS VID SKRIVNING). Detta skript är kvar
#   som den TIDIGA VARNINGEN — en session ska få veta REDAN VID START att
#   huvudkatalogen har en främmande, potentiellt levande, anspråkstagare,
#   innan den ens försöker en git-skrivning.
#
# ═══ ÄGARSKAP TAS VID SKRIVNING, INTE VID ANKOMST (T120, Marcus-GO 2026-08-04) ═══
#
#   Detta skript SATTE tidigare lappen redan här, vid SessionStart. Formen
#   reviderades SAMMA DAG den byggdes, innan den nådde skarp drift: Marcus
#   håller MEDVETET gamla sessionsfönster öppna som referens (för att kunna
#   gå tillbaka och läsa chatten om paus-dokumentationen visar sig sakna
#   något) — mätt levande exempel 2026-08-04, PID 56246, öppet sedan
#   2026-08-02, alltså över två dygn. Ett sådant fönster LÄSER men ARBETAR
#   inte. Med lappen satt vid SessionStart skulle VARJE sådant referensfönster
#   ha ockuperat huvudkatalogen PERMANENT, och varje ny session hamnat i
#   worktree av fel skäl — ju fler referensfönster Marcus sparar, desto
#   säkrare felet.
#
#   Rotorsaken: en lapp satt vid ANKOMST mäter "lever processen?" när det som
#   faktiskt betyder något är "arbetar sessionen just nu?". Lösningen är att
#   flytta skrivningen från SessionStart (ankomst) till första git-SKRIVNING
#   (behov) — ett fönster som bara läser tar aldrig lappen, oavsett hur länge
#   det står öppet. Mekaniken (kill -0, PID-återanvändningsgard, atomär
#   skapelse/övertagande) bor i scripts/deny-frammande-huvudkatalog.sh
#   § ÄGARSKAP-TAGANDE.
#
# FAIL-OPEN, MEDVETET: varje internt fel här (jq saknas, inte ett git-repo)
#   avslutar tyst med exit 0. Samma hållning som prövningshooken —
#   detaljerad motivering i deny-frammande-huvudkatalog.sh § FAIL-OPEN-VALET.
#
# ═══ TVÅ SAKER SOM LÅTER LIKA MEN INTE HAR MED VARANDRA ATT GÖRA ═══
#
#   `session-end` är marcus-system-pluginets DISCIPLIN-SKILL. Den skriver
#   `lifecycle: closed` i ett markdown-sessionsdok. Den rör ALDRIG denna lapp.
#
#   `SessionEnd` är HARNESSETS HOOK-EVENT (matchers `clear`, `resume`,
#   `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other`).
#   Den fyrar när PROCESSEN faktiskt avslutas — det är den scripts/
#   katalogagarskap-slapp.sh är kopplad till.
#
#   Namnkrocken har redan gett en FELAKTIG slutsats (Marcus, 2026-08-04): att
#   en PAUSAD session (`lifecycle: paused` i sessionsdoket) äger huvudkatalogen
#   tills någon kör disciplin-skillen `session-end` på den. Fel — lappen är
#   knuten till PROCESSEN (det öppna terminalfönstret) OCH, sedan denna
#   revidering, till om den processen NYLIGEN GJORT EN GIT-SKRIVNING där. En
#   `lifecycle: paused`-session vars fönster fortfarande är öppet och som
#   ÄGER lappen (den skrev där tidigare) behåller den; en session vars fönster
#   är stängt äger ingenting — processen är död, och deny-frammande-
#   huvudkatalog.sh:s `kill -0`-prövning släpper då tyst igenom vid nästa
#   skrivningsförsök.
#
# ═══ --SLAPP-LÄGE (T120, tredje designtillägget) ═══
#
#   `bash katalogagarskap-markor.sh --slapp` (samma JSON-på-stdin-kontrakt
#   som normalläget: `{"session_id": "...", "cwd": "..."}`) släpper AKTIVT
#   den anropande sessionens EGEN lapp, om den äger en. Detta är det SNABBASTE
#   av tre lager (§ ÄGARSKAP-TAGANDE i deny-frammande-huvudkatalog.sh,
#   fjärde verbet TYSTNAD): `session-paus` och `session-end`
#   (marcus-system-pluginets disciplin-skills) SKA anropa detta som ett eget
#   steg vid stängning — snabbare och tydligare än att vänta ut
#   tystnads-tröskeln. Det är INTE den enda vägen (ett skill-steg är prosa,
#   kan glömmas) — tystnads-övertagandet och död-process-övertagandet är
#   näten UNDER, och bara det understa (död process) måste vara pålitligt.
#
#   EXAKT TRÄFF, ALDRIG SVEPANDE: lappen tas bort OM OCH ENDAST OM dess
#   `session_id` är anropets eget. En främmande lapp lämnas ORÖRD med ett
#   tydligt felmeddelande på stderr och exit 1 — aldrig tyst, aldrig gissat.
#
#   SKILL-SIDANS ANROP (hub-repot marcus-system) ÄR UTANFÖR DENNA LANDNING —
#   se slutrapporten för öppen följdpunkt.
#
# INPUT: SessionStart hook-JSON på stdin (fält `session_id`, `cwd`) i
#   normalläge; SAMMA form i --slapp-läge — bekräftat mot
#   code.claude.com/docs/en/hooks.md 2026-08-04.
#
# OUTPUT: normalläge — `hookSpecificOutput.additionalContext` med ett rent
#   faktapåstående om en EVENTUELL främmande lapp. Förstaparten varnar för
#   imperativ text i additionalContext (kan trigga injektionsförsvaret) —
#   därför påståenden, aldrig uppmaningar. Samma hållning som
#   session-facts.sh. Ingen lapp att rapportera ⇒ helt tyst, ingen
#   additionalContext alls. BÅDA rapportvägarna (stale och normal) bär
#   samma handlingsregel ur EN delad sträng — se § EN REGEL, EN STRÄNG
#   längst ned för incidenten som gjorde det till ett krav. --slapp-läge — inget hook-JSON-kontrakt (det är
#   en manuellt/skill-anropad CLI, inte en hook-output): människoläsbar text
#   på stderr, exit 0 vid släpp eller inget-att-göra, exit 1 om lappen är
#   främmande.
#
# Testsvit: scripts/test-deny-frammande-huvudkatalog.sh (täcker samtliga tre
#   skript: denna rapporterings-/släpp-hook, prövnings-/tagande-hooken och
#   SessionEnd-släpp-hooken).
#
# Källa: T119 arbetslista (a) · T120-rotorsaken · ADR-090 beslut 2 + 5 ·
#        S96 Del 8 · .katalogagarskap-policy.conf ·
#        scripts/deny-frammande-huvudkatalog.sh (§ ÄGARSKAP-TAGANDE) ·
#        code.claude.com/docs/en/hooks.md
# Etablerad: S97, 2026-08-04. Omgjord till ren rapportering + --slapp-läge
#   samma dag (T120, Marcus-GO) innan den ursprungliga skriv-formen nådde
#   skarp drift.

set -uo pipefail

SLAPP_LAGE="false"
[[ "${1:-}" = "--slapp" ]] && SLAPP_LAGE="true"

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

# Kör i sessionens egen katalog. `cwd` ur hook-inputen är auktoritativ; utan
# den faller vi tillbaka på processens katalog.
HOOK_CWD="$(printf '%s' "${INPUT}" | jq -r '.cwd // empty' 2>/dev/null)"
if [[ -n "${HOOK_CWD}" && -d "${HOOK_CWD}" ]]; then
    cd "${HOOK_CWD}" 2>/dev/null || exit 0
fi

GIT_DIR="$(git rev-parse --path-format=absolute --git-dir 2>/dev/null)" || exit 0
COMMON_DIR="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || exit 0
[[ -n "${GIT_DIR}" && -n "${COMMON_DIR}" ]] || exit 0

if [[ "${SLAPP_LAGE}" = "true" ]]; then
    MARKOR="${COMMON_DIR}/${KATALOG_MARKOR_FILNAMN:-katalogagarskap-agare.json}"
    if [[ ! -f "${MARKOR}" ]]; then
        printf 'Ingen ägarlapp finns för %s — inget att släppa.\n' "${COMMON_DIR%/.git}" >&2
        exit 0
    fi
    AGARE="$(jq -r '.session_id // empty' "${MARKOR}" 2>/dev/null)"
    if [[ -z "${AGARE}" ]]; then
        printf 'Ägarlappen går inte att läsa — lämnas ORÖRD (fail-open).\n' >&2
        exit 0
    fi
    if [[ "${AGARE}" != "${SESSION_ID}" ]]; then
        printf 'Ägarlappen tillhör en ANNAN session (%s) — lämnas ORÖRD. Denna session (%s) kan inte släppa någon annans anspråk.\n' "${AGARE}" "${SESSION_ID}" >&2
        exit 1
    fi
    rm -f "${MARKOR}" 2>/dev/null
    printf 'Ägarlappen släppt.\n' >&2
    exit 0
fi

# En worktree-session gör inga anspråk och kan inte kollidera med en
# huvudkatalogs-lapp på samma sätt — inget att rapportera härifrån. Se
# policyfilen § VARFÖR LAPPEN BOR I --git-common-dir för mätningen bakom
# denna jämförelse.
[[ "${GIT_DIR}" = "${COMMON_DIR}" ]] || exit 0

HUVUDKATALOG="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
MARKOR="${COMMON_DIR}/${KATALOG_MARKOR_FILNAMN:-katalogagarskap-agare.json}"
NU_EPOCH="$(date +%s 2>/dev/null)" || exit 0

fakta() {
    jq -nc --arg ctx "$1" \
        '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}' \
        2>/dev/null || true
    exit 0
}

# Ingen lapp → inget anspråk att rapportera. Denna session tar INGET
# ägarskap här — det sker (om alls) vid dess FÖRSTA git-skrivning i
# huvudkatalogen, se scripts/deny-frammande-huvudkatalog.sh.
[[ -f "${MARKOR}" ]] || exit 0

AGARE="$(jq -r '.session_id // empty' "${MARKOR}" 2>/dev/null)"
# Oläsbar lapp → inget tillförlitligt att rapportera (fail-open).
[[ -n "${AGARE}" ]] || exit 0

# Egen lapp (denna sessions session_id råkar redan äga den — t.ex. en
# resume med samma session_id som redan skrev tidigare) → inget FYND.
[[ "${AGARE}" != "${SESSION_ID}" ]] || exit 0

AGARE_EPOCH="$(jq -r '.satt_vid_epoch // 0' "${MARKOR}" 2>/dev/null)"
AGARE_ISO="$(jq -r '.satt_vid // "okänt"' "${MARKOR}" 2>/dev/null)"

# Främmande lapp. STJÄL ALDRIG — rapportera det som fakta, så detektionen
# blir synlig i sessionsstartens RAPPORTERA (ADR-090 beslut 1 gör detta till
# ett FYND som Marcus avgör).
ALDER_TIMMAR=$(( (NU_EPOCH - AGARE_EPOCH) / 3600 ))
STALE_GRANS="${KATALOG_STALE_TIMMAR:-1}"

# ═══ EN REGEL, EN STRÄNG (S93, 2026-08-05) ═══
#
#   Handlingsregeln nedan delas av BÅDA rapportvägarna och får aldrig
#   dupliceras isär igen. Skälet är en mätt incident, inte en princip:
#
#   Skriptet bar två fakta-anrop — stale-grenen och normalgrenen. Bara
#   normalgrenen bar regeln "den senare tar en worktree"; stale-grenen
#   nämnde `rm` som enda handling. En resume-session 2026-08-05 mötte en
#   LEVANDE ägarlapp som råkade vara >1 h gammal, fick alltså stale-grenen,
#   och läste den som en öppen fråga: "är ägaren död — ska jag rm:a?" Den
#   STOPPADE och eskalerade till Marcus i stället för att ta en worktree och
#   fortsätta — precis tvärtemot vad mekanismen är byggd för.
#
#   Regeln fanns hela tiden — i deny-texten i
#   scripts/deny-frammande-huvudkatalog.sh (§ ÄGARSKAP-TAGANDE, "ARBETA I DIN
#   EGEN WORKTREE I STÄLLET … eskalera det INTE till Marcus"). Men den
#   levereras bara vid ett FAKTISKT nekat skrivförsök. En session som läser
#   SessionStart-rapporten och drar sin slutsats i FÖRVÄG når aldrig den
#   ytan. Följden är kontraintuitiv och värd att minnas: ju FÖRSIKTIGARE
#   sessionen är — ju mindre den provocerar fram en deny — desto säkrare
#   missar den instruktionen. Försiktighet kringgick den enda regelbäraren.
#
#   Därför bär ankomst-ytan (denna rapport) nu samma regel som
#   skrivnings-ytan (deny-texten), och delar den mellan sina grenar så att
#   en framtida ändring av den ena inte kan tappa den andra.
#
#   PÅSTÅENDEN, ALDRIG IMPERATIV: additionalContext får inte bära uppmaningar
#   (se OUTPUT i skripthuvudet — förstaparten varnar för injektionsförsvaret).
#   Deny-texten får vara imperativ eftersom den är `permissionDecisionReason`,
#   ett annat fält med ett annat kontrakt. Formuleringen nedan är därför
#   deklarativ hela vägen, med samma sakinnehåll.
HANDLINGSREGEL="Regeln vid en levande ägare är ADR-090 beslut 2: den först startade sessionen behåller huvudträdet, den senare arbetar i en egen worktree. Worktree är alltså den normala vägen framåt här — ett agent-beslut med all information redan tillgänglig, inte en eskalering till Marcus och inte ett skäl att pausa arbetet. Samma regel levereras av scripts/deny-frammande-huvudkatalog.sh vid ett faktiskt nekat skrivförsök; den står också här, så att en session som läser denna rapport slipper provocera fram en deny för att få veta den. Ett medvetet åsidosättande av en LEVANDE ägare (rm ${MARKOR}) är Marcus manuella val, inte agentens fråga."

if (( AGARE_EPOCH > 0 && ALDER_TIMMAR >= STALE_GRANS )); then
    fakta "Huvudkatalogen ${HUVUDKATALOG} bär en katalogägarskaps-lapp från en annan session (satt ${AGARE_ISO}, ${ALDER_TIMMAR} timmar sedan, över stale-tröskeln ${STALE_GRANS} h). Åldern ensam avgör INGENTING: lappen är kvar och orörd, och prövas mot processens liveness (inte bara ålder) först vid nästa git-skrivning i huvudkatalogen. En gammal lapp kan mycket väl ha en levande ägare. ${HANDLINGSREGEL}"
fi

fakta "Huvudkatalogen ${HUVUDKATALOG} bär en katalogägarskaps-lapp satt av en annan session (${AGARE_ISO}). Denna session har INTE tagit ägarskapet — det sker (om alls) automatiskt vid dess första git-skrivning i huvudkatalogen, och bara om den andra sessionens process visar sig död. ${HANDLINGSREGEL}"
