#!/usr/bin/env bash
# scripts/deny-precompact.sh — ADR-101 § Beslut 5, kedjans steg 3
# ("PreCompact-grinden, deny-familjen").
#
# VARFÖR SKRIPTET FINNS: ADR-101 löser "kontrollerad kontra okontrollerad
#   kompaktering" genom att sänka auto-compact-tröskeln till ~50 % (§ Beslut
#   2) och låta harnessens EGET auto-compact-försök vid den tröskeln BLI
#   zonlarmet — men bara om något faktiskt NEKAR försöket, annars kompakterar
#   harnessen bara tystare och tidigare utan att någon kontroll vunnits.
#   Denna hook är den nekningen: `trigger: "auto"` nekas ALLTID (harnessens
#   egen auto-compact får aldrig gå igenom okontrollerad); `trigger: "manual"`
#   (dvs. `/compact`) släpps ENDAST om en färsk markörfil visar att läget är
#   säkrat i fil av pre-compact-skillen (TASK-160.3) FÖRST.
#
# ═══ PREMISS-PASSET (ADR-086, TASK-160.2 AC 1) — PreCompact-hookens
#      indata-form, verifierad mot AKTUELL förstapartsdok ═══
#
#   T111 (tasks/threads/T111-autonom-orkestrering-kontexttroskel.md,
#   2026-07-31) bokförde "ingen PreCompact-hook finns" — ADR-101 § Källmärkning
#   vederlägger det redan mot en tidigare läsning av dokumentationen
#   (2026-08-07). DENNA skivas byggagent verifierade på nytt, ordagrant, mot
#   RÅ förstapartsdokumentation (curl mot .md-varianten — samma teknik
#   deny-arbetsform-push.sh:s premiss-pass använde för att undvika
#   WebFetch-sammanfattningsrisk):
#
#     curl -s https://code.claude.com/docs/en/hooks.md
#
#   Rad ~2758–2786 (§ "PreCompact"): PreCompact-hooken kör FÖRE en
#   kompakteringsoperation. Matcher-fältet är `trigger` med två dokumenterade
#   värden — `manual` (`/compact`) och `auto` (harnessens egen tröskel).
#   Exit-kod 2 BLOCKERAR kompaktering (bekräftat i exit-kod-tabellen, rad
#   ~805: "PreCompact | Yes | Blocks compaction"); JSON `"decision": "block"`
#   fungerar också (rad ~938), men denna hook använder EXIT 2 — samma
#   kontrakt som ALLA syskonhookar i deny-familjen (deny-arbetsform-push.sh,
#   deny-subagent-vantan.sh, deny-resend-send.sh m.fl.), enhetligt över hela
#   repot i stället för två parallella signalvägar.
#
#   Indata-JSON (rad ~2777–2785), utöver de gemensamma fälten
#   (`session_id`, `transcript_path`, `cwd`, `hook_event_name`):
#
#     {
#       "session_id": "abc123",
#       "transcript_path": "/Users/.../.claude/projects/.../<uuid>.jsonl",
#       "cwd": "/Users/...",
#       "hook_event_name": "PreCompact",
#       "trigger": "manual",
#       "custom_instructions": ""
#     }
#
#   `cwd` finns BEKRÄFTAT i indatan (samma "gemensamma fält"-tabell,
#   dokumenterad "Current working directory when the hook is invoked" — PER
#   ANROP) — vilket är den mätta, redan produktionsbevisade grunden för
#   § ARBETSTRÄDETS ROT nedan. INGEN DIVERGENS mot uppdragets premisser:
#   `trigger` (manual/auto), `cwd` och `transcript_path` finns alla, i den
#   form uppdraget antog.
#
# ═══ ARBETSTRÄDETS ROT — cwd, INTE ${CLAUDE_PROJECT_DIR:-.} ═══
#
#   Samma mätta divergens som scripts/deny-arbetsform-push.sh:s § PREMISS-
#   PASSET dokumenterar: `${CLAUDE_PROJECT_DIR:-.}` resolvar till den DELADE
#   HUVUDKATALOGEN oavsett vilket arbetsträd den anropande sessionen faktiskt
#   sitter i — INTE per-arbetsträd. Markörfilen (satt av pre-compact-skillen
#   i SESSIONENS EGET arbetsträd) hade aldrig synts för denna hook om
#   sökvägen löstes via `CLAUDE_PROJECT_DIR`. RÄTT FÄLT är `cwd` ur hook-
#   JSON:et (PER ANROP, se § PREMISS-PASSET ovan) → `cd` dit →
#   `git rev-parse --show-toplevel` — SAMMA mönster
#   deny-frammande-huvudkatalog.sh och deny-arbetsform-push.sh redan
#   använder, återanvänt rakt av. `${CLAUDE_PROJECT_DIR:-.}` används HÄR
#   ENDAST för att hitta skriptets EGEN policyfil (stabil, delad,
#   huvudkatalogs-förankrad config är rätt för det) — aldrig för
#   markörfilen.
#
# ═══ FAIL-CLOSED, OVILLKORLIGT — INGEN OSKYLDIG MAJORITET ATT SKYDDA ═══
#
#   Till skillnad från deny-arbetsform-push.sh (som är fail-OPEN på oparsbar
#   indata, scopat fail-closed BARA efter att ett push-försök redan
#   bekräftats i kommandosträngen — se den hookens § FAIL-OPEN vs
#   FAIL-CLOSED) har DENNA hook ingen sådan scopnings-gräns att korsa: den
#   registreras ENDAST på PreCompact-eventet (§ .claude/settings.json), så
#   VARJE anrop ÄR per definition ett kompakteringsförsök — det finns ingen
#   "de flesta Bash-anrop är inte push"-majoritet att hålla friktionsfri
#   här. Samma princip som deny-subagent-vantan.sh:s F1–F4 (ovillkorligt
#   fail-closed, eftersom Monitor/run_in_background i subagent-kontext ALLTID
#   är den farliga handlingen när de inträffar): jq saknas, tom stdin, trasig
#   JSON, `trigger` går inte att läsa, ett okänt `trigger`-värde, cwd saknas/
#   ogiltig, policyfilen saknas/otolkbar, markörfilen saknas/korrupt/gammal
#   → NEKAS (exit 2) i SAMTLIGA fall. "Kan inte avgöra om detta är en
#   kontrollerad kompaktering" väger mot att TYST RELEASE:A okontrollerad
#   kompaktering — exakt det hål ADR-101 finns för att stänga.
#
#   Blast-radien av denna ovillkorliga hållning är smal med avsikt: den
#   enda konsekvensen av ett internt hookfel är att BÅDE auto- OCH manuell
#   kompaktering blockeras tills felet är åtgärdat — sessionen fortsätter
#   okompakterad (ADR-101 § Källa hooks.md rad ~2771: en proaktivt
#   triggad, blockerad auto-compact hoppas bara över, konversationen
#   fortsätter). Det är återställbart (rätta hooken/policyn, försök igen)
#   och strikt SNÄVARE skada än att släppa igenom en okontrollerad
#   kompaktering hooken finns för att förhindra.
#
# ═══ VAD DEN INTE TÄCKER (ADR-101 § Konsekvenser, öppet buret) ═══
#
#   Om PreCompact-hooken blockerar en auto-compact som harnessen triggade
#   FÖR ATT ÅTERHÄMTA SIG från ett redan returnerat context-limit-fel (inte
#   den proaktiva, tröskel-baserade varianten denna nisch riktar sig mot),
#   surfacar det underliggande felet i stället och den aktuella turen
#   misslyckas (samma källrad, ~2771). Nischens ~50 %-tröskel (ADR-101
#   § Beslut 2) är satt med god marginal specifikt för att göra detta läge
#   osannolikt i praktiken — men denna hook kan inte skilja "proaktiv
#   tröskel-auto-compact" från "recovery-auto-compact" i sin egen indata
#   (`trigger` bär samma värde `"auto"` för båda); den behandlar dem
#   identiskt per ADR-101:s uttryckliga design ("trigger: auto → neka
#   ALLTID").
#
# SKARPBEVIS ÄR EN ÖPPEN SKULD (CLAUDE.md § "En ny hook kan ALDRIG
#   skarpbevisas i sessionen som byggde den"): registreras i
#   .claude/settings.json i SAMMA session som bygger den, och tas därför
#   INTE i bruk förrän nästa session (filbevakaren kan ha missat ändringen;
#   ingen reload-väg finns). Logiken är bevisad tvåsidigt i byggsessionen
#   (scripts/test-deny-precompact.sh + manuell körning mot verkligt
#   tillstånd). Betalas nästa session med samma differentialmätning som
#   deny-subagent-vantan.sh/deny-arbetsform-push.sh:s skuld: provocera en
#   REDAN laddad hook (t.ex. deny-grind-genom-pipe.sh) parallellt för att
#   skilja "fel logik här" från "ej laddad än". Denna hook har INGEN egen
#   verktygsyta att trigga från Bash (PreCompact fyrar bara vid faktisk
#   kompaktering, `/compact` eller harnessens auto-tröskel) — skarpbeviset
#   kräver alltså antingen en verklig `/compact`-körning eller att nästa
#   session närmar sig den sänkta tröskeln (TASK-160.5, ej byggd av denna
#   skiva), inte bara ett godtyckligt Bash-kommando. Bokfört öppet, inte
#   dolt.
#
# INPUT: PreCompact hook-JSON på stdin — `trigger` (manual/auto), `cwd`,
#   `transcript_path`, `session_id`, `hook_event_name` (samtliga verifierade
#   ordagrant mot code.claude.com/docs/en/hooks.md i premiss-passet ovan,
#   2026-08-07).
#
# Testsvit: scripts/test-deny-precompact.sh (tvåsidigt bevis: auto NEKAS
#   alltid · manual utan markör NEKAS · manual med gammal markör NEKAS ·
#   manual med färsk markör SLÄPPS · fail-closed på korrupt markör/policy/
#   indata).
#
# Källa: ADR-101-compact-formen-kontrollerad-kompaktering-smal-nisch.md
#        § Beslut 2, 4, 5 ·
#        scripts/deny-arbetsform-push.sh (cwd-mönstret, deny-familjens form) ·
#        scripts/deny-subagent-vantan.sh (ovillkorligt fail-closed-mönstret) ·
#        .precompact-policy.conf · code.claude.com/docs/en/hooks.md
# Etablerad: TASK-160.2, 2026-08-07

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRECOMPACT_POLICY="${PRECOMPACT_POLICY:-${SCRIPT_DIR}/../.precompact-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

# neka <skäl> — stderr (visas för Marcus vid manuell /compact; se
# hooks.md rad ~2769) + exit 2, den enda väg som garanterat blockerar
# kompaktering (§ FAIL-CLOSED ovan).
neka() {
    printf 'COMPACT-FORMEN (ADR-101, TASK-160.2): %s\n' "$1" >&2
    exit 2
}

# ── Steg 1: tolka hook-indatan. FAIL-CLOSED ovillkorligt — se § FAIL-CLOSED,
# OVILLKORLIGT ovan: denna hook har ingen oskyldig majoritet att skydda,
# till skillnad från deny-arbetsform-push.sh.
jq_version_ok || neka "jq saknas eller är för gammal i PATH (TASK-312, .jq-version-policy.conf) — kan inte avgöra om kompakteringen är kontrollerad (fail-closed). Detta är hookens eget fel, inte ditt."

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || neka "tom eller oläsbar hook-input på stdin (fail-closed). Detta är hookens eget fel, inte ditt."

TRIGGER="$(printf '%s' "${INPUT}" | jq -r '.trigger // empty' 2> /dev/null)"
[[ -n "${TRIGGER}" ]] || neka "hook-indatan gick inte att tolka som JSON, eller saknar ett trigger-fält — kan inte avgöra om detta är manual eller auto (fail-closed). Detta är hookens eget fel, inte ditt."

# ── Steg 2: trigger=auto → neka ALLTID, oavsett markör/policy (ADR-101
# § Beslut 2 — det nekade auto-compact-försöket ÄR zonlarmet). Kortsluts
# medvetet FÖRE markör-/policyläsningen: auto-grenen ska vara robust även om
# policyfilen eller markörkatalogen är trasig.
if [[ "${TRIGGER}" == "auto" ]]; then
    neka "auto-compact nekas ALLTID — det nekade försöket ÄR zonlarmet (ADR-101 § Beslut 2). Kör pre-compact-skillen för att säkra läget i fil och producera en fokus-instruktion, kompaktera sedan KONTROLLERAT med: /compact <fokus-instruktion>."
fi

[[ "${TRIGGER}" == "manual" ]] || neka "okänt trigger-värde '${TRIGGER}' (varken 'manual' eller 'auto') — fail-closed, kan inte avgöra om kompakteringen är kontrollerad. Detta är hookens eget fel, inte ditt."

# ── Från denna punkt: trigger=manual (dvs. /compact). Resten av hooken
# avgör om markören visar att läget FAKTISKT säkrades i fil, nyligen, av
# pre-compact-skillen.

# ── Steg 3: arbetsträdets rot via cwd, INTE ${CLAUDE_PROJECT_DIR:-.} — se
# § ARBETSTRÄDETS ROT ovan.
HOOK_CWD="$(printf '%s' "${INPUT}" | jq -r '.cwd // empty' 2> /dev/null)"
[[ -n "${HOOK_CWD}" && -d "${HOOK_CWD}" ]] || neka "cwd saknas eller pekar på en obefintlig katalog i hook-indatan — kan inte hitta markörfilen (fail-closed). Detta är hookens eget fel, inte ditt."
ARBETSTRAD_ROT="$(cd "${HOOK_CWD}" 2> /dev/null && git rev-parse --show-toplevel 2> /dev/null)"
[[ -n "${ARBETSTRAD_ROT}" ]] || neka "kunde inte lösa arbetsträdets rot från cwd ${HOOK_CWD} (fail-closed). Detta är hookens eget fel, inte ditt."

# ── Steg 4: läs policyn. Ovillkorligt fail-closed om den saknas/är otolkbar
# — se § FAIL-CLOSED, OVILLKORLIGT ovan (ingen scopnings-gräns att korsa; en
# manual-kompaktering utan känd policy KAN inte verifieras som kontrollerad).
if [[ -f "${PRECOMPACT_POLICY}" ]]; then
    # shellcheck source=/dev/null
    source "${PRECOMPACT_POLICY}" || neka "policyfilen ${PRECOMPACT_POLICY} gick inte att läsa (syntaxfel?) — fail-closed. Detta är hookens eget fel, inte ditt."
else
    neka "policyfilen ${PRECOMPACT_POLICY} saknas — fail-closed, kan inte avgöra markörfilens namn eller färskhetsfönstret. Detta är hookens eget fel, inte ditt."
fi
MARKOR_FILNAMN="${PRECOMPACT_MARKOR_FILNAMN:-.claude/precompact-markor.json}"
FARSKHETSFONSTER_MIN="${PRECOMPACT_FARSKHETSFONSTER_MINUTER:-15}"
MARKORFIL="${ARBETSTRAD_ROT}/${MARKOR_FILNAMN}"

# ── Steg 5: frånvaro av markör = NEKA. Detta är AC 2:s uttryckliga,
# MOTSATTA krav mot deny-arbetsform-push.sh:s frånvaro-släpper-regel:
# markören är ett AKTIVT bevis (läget säkrat i fil), inte ett FÖRBUD-läge —
# ADR-101 § Beslut 4 äger valet.
[[ -f "${MARKORFIL}" ]] || neka "ingen markörfil (${MARKORFIL}) — läget är inte säkrat i fil. Kör pre-compact-skillen FÖRST: den säkrar läget (rent arbetsträd, lokala commits räcker), producerar fokus-instruktionen och sätter markören. Kompaktera sedan med: /compact <fokus-instruktion>."

# ── Steg 6: tolka markören. Korrupt (ej JSON, eller saknar det load-bearing
# satt_vid-fältet) → NEKA, fail-closed (§ .precompact-policy.conf § JSON-FORMEN).
SATT_VID="$(jq -r '.satt_vid // empty' < "${MARKORFIL}" 2> /dev/null)"
[[ -n "${SATT_VID}" ]] || neka "markörfilen ${MARKORFIL} finns men går inte att tolka som JSON, eller saknar ett satt_vid-fält (korrupt markör, fail-closed). Kör pre-compact-skillen igen för att sätta en färsk, giltig markör. Detta är annars hookens eget fel, inte ditt."

# ── Steg 7: markörens ålder. `date -j -f` (BSD/macOS) prövas före
# `date -u -d` (GNU/Linux CI) — samma cross-platform-mönster som
# scripts/check-obesvarade-larm.sh redan använder för samma ISO 8601-form.
SATT_VID_EPOCH="$(date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "${SATT_VID}" +%s 2> /dev/null || date -u -d "${SATT_VID}" +%s 2> /dev/null)"
[[ -n "${SATT_VID_EPOCH}" ]] || neka "markörfilens satt_vid-tidsstämpel '${SATT_VID}' gick inte att tolka (korrupt markör, fail-closed). Kör pre-compact-skillen igen för att sätta en färsk, giltig markör."

NU_EPOCH="$(date -u +%s)" || neka "kunde inte läsa systemklockan (fail-closed). Detta är hookens eget fel, inte ditt."
ALDER_MIN=$(( (NU_EPOCH - SATT_VID_EPOCH) / 60 ))

if (( ALDER_MIN > FARSKHETSFONSTER_MIN )); then
    neka "markörfilen ${MARKORFIL} är ${ALDER_MIN} min gammal — äldre än färskhetsfönstret (${FARSKHETSFONSTER_MIN} min). Läget den beskriver har sannolikt hunnit ändras. Kör pre-compact-skillen igen för att sätta en FÄRSK markör innan du kompakterar."
fi

# ── Markören finns, är giltig och är färsk: kontrollerad kompaktering
# bekräftad. Släpp igenom.
exit 0
