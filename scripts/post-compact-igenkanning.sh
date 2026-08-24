#!/usr/bin/env bash
# scripts/post-compact-igenkanning.sh — SessionStart-igenkänning av
# compact-källan (TASK-160.4, ADR-101 § Beslut 5, kedjans steg 6).
#
# VARFÖR SKRIPTET FINNS: ADR-101 löser "kontrollerad kontra okontrollerad
#   kompaktering" med en kedja där sista länken är att en session som just
#   startat om EFTER en kompaktering mekaniskt känner igen det läget och
#   omorienterar sig mot DISK i stället för att lita på kompakteringens
#   sammanfattning (US6, TASK-160.4 § Beskrivning). Denna hook är den
#   igenkänningen: den injicerar en omorienterings-instruktion när
#   `source: "compact"`, och är annars helt TYST (ingen additionalContext,
#   inget stdout alls) vid `startup`/`resume`/`clear`/`fork`.
#
#   RENSNINGEN AV MARKÖREN GÖRS AV INSTRUKTIONEN, INTE AV DETTA SKRIPT
#   (ADR-101, uppdragstext TASK-160.4): hooken är BUDBÄRARE — den namnger
#   markörfilen och instruerar att den rensas — men filen tas INTE bort
#   här. Utföraren är modellen som läser additionalContext och agerar (ev.
#   via pre-compact-skillens post-compact-steg, TASK-160.3). Skälet är
#   samma som varför deny-precompact.sh inte heller skriver: en hook som
#   TAR BORT filer på egen hand vid varje SessionStart är en betydligt
#   större blast radius än en hook som bara pratar.
#
# ═══ PREMISS-PASSET (ADR-086, TASK-160.4 AC 1) — SessionStart-hookens
#      additionalContext-stöd OCH exit-kods-/blockerings-beteende,
#      verifierade mot AKTUELL förstapartsdok (curl, samma teknik som
#      deny-precompact.sh:s premiss-pass) ═══
#
#   curl -s https://code.claude.com/docs/en/hooks.md
#
#   1. `SessionStart`-hookens `source`-fält bär exakt fem dokumenterade
#      värden: `startup` (ny session), `resume` (--resume/--continue/
#      /resume), `clear` (/clear), `compact` (auto ELLER manuell
#      kompaktering — BÅDA ger source=compact, hooken skiljer inte på dem),
#      `fork` (ny session grenad ur en existerande). ADR-101 § Källmärkning
#      bokförde redan detta; denna skivas byggagent verifierade det på nytt
#      ordagrant (rad ~1030–1046, § "SessionStart input") — INGEN
#      DIVERGENS mot uppdragets premiss.
#   2. `additionalContext` STÖDS av SessionStart (till skillnad från
#      PreCompact, som bara kan blockera/släppa): `hookSpecificOutput.
#      additionalContext` läggs till Claudes kontext FÖRE första prompten
#      (rad ~1052–1069, § "SessionStart decision control"). INGEN
#      DIVERGENS mot uppdragets premiss.
#   3. Text i `additionalContext` ska vara PÅSTÅENDEN, inte imperativa
#      systemkommandon: "Write the text as factual statements rather than
#      imperative system instructions ... Text framed as out-of-band system
#      commands can trigger Claude's prompt-injection defenses" (rad ~928,
#      § "Add context for Claude"). Samma regel som redan styr
#      scripts/katalogagarskap-markor.sh:s utdata — HANDLINGSTEXTEN nedan
#      är därför deklarativ ("repots konvention är X"), aldrig "gör X".
#   4. FAIL-OPEN ÄR DET ENDA MENINGSFULLA VALET FÖR DENNA HOOK — inte bara
#      en stilistisk preferens utan en STRUKTURELL konsekvens av hur
#      harnessen behandlar `SessionStart`: tabellen "Exit code 2 behavior
#      per event" (rad ~792–814) listar `SessionStart` som `Can block? No`
#      — och det finns INGEN blockerande väg alls för detta event ("Any
#      other exit code is a non-blocking error for most hook events", rad
#      ~753). Explicit brödtext (rad ~814): "For SessionStart, Setup, and
#      SubagentStart, the exit code 2 stderr renders in the transcript as a
#      `<hook name> hook error` notice ... Claude doesn't see it, and the
#      session ... proceeds." En krasch i detta skript kan alltså ALDRIG
#      hindra sessionen från att starta — harnessen garanterar det, oavsett
#      vad skriptet gör. Det enda VERKLIGA designvalet kvar är om ett
#      internt fel (jq saknas, trasig indata, otolkbar policy) ska synas
#      (icke-noll exitkod → en synlig "hook error"-notis för Marcus, men
#      Claude ser den ändå inte) eller vara HELT TYST (exit 0, ingen
#      additionalContext). Detta skript väljer TYST (exit 0) — SAMMA val
#      som scripts/katalogagarskap-markor.sh redan gör för samma hook-typ
#      (SessionStart, rapporterande, aldrig gatande): en rapporterings-hook
#      utan en oskyldig majoritet att skydda från en falsk blockering (det
#      finns ingen blockering att skydda från här) tjänar inget på att
#      larma högt för ett internt miljöfel — bara på att inte krascha
#      synligt för användaren i onödan. Om omorienteringen uteblir en gång
#      på grund av t.ex. jq-frånvaro är kostnaden låg (samma manuella
#      omorientering en session alltid kan göra för hand) och ÅTERSTÄLLBAR
#      nästa SessionStart.
#
# ═══ SEKVENSBEROENDE, ÖPPET BOKFÖRT (uppdragstext TASK-160.4) ═══
#
#   Markörfilens namn ska läsas ur `.precompact-policy.conf` (variabeln
#   `PRECOMPACT_MARKOR_FILNAMN`), som landar via TASK-160.2 (PR #943,
#   armerad i kön men INTE på `main` när denna skiva byggdes — mätt
#   `gh pr view 943`: `mergeStateStatus: BLOCKED`, `state: OPEN`,
#   2026-08-07). Denna skiva är BASERAD på `main` utan den filen. Skriptet
#   nedan sourcar `.precompact-policy.conf` OM den finns — annars faller
#   det tillbaka på det EXAKT dokumenterade default-värdet
#   (`.claude/precompact-markor.json`, verifierat mot
#   `origin/feat/task-160-2-precompact-grinden`:s `.precompact-policy.conf`
#   och mot ADR-101 § Beslut 4). När #943 landar plockar detta skript UPP
#   den riktiga policyfilen automatiskt, utan att röras — ingen egen kopia
#   av `.precompact-policy.conf` skapas här (det vore en konkurrerande
#   duplicering av TASK-160.2:s leverabel, inte en lösning).
#
#   TASK-160.4 är även formellt beroende av TASK-160.3 (pre-compact-
#   skillen som SÄTTER markören, hub-pluginet) — även den `○ To Do` när
#   denna skiva byggdes. Detta skript behöver INTE TASK-160.3:s faktiska
#   implementation för att vara korrekt: markörens JSON-schema
#   (`fokus_instruktion`, `satt_vid`, `sattare`) är fullt specificerat i
#   ADR-101 § Beslut 4 OCH i `.precompact-policy.conf`:s § JSON-FORMEN
#   (samma källa som ovan) — detta skript använder ENDAST markörens
#   NÄRVARO/FRÅNVARO (för att kunna namnge den korrekt i instruktionen),
#   aldrig dess innehåll, så en framtida TASK-160.3-implementation som
#   följer det redan låsta schemat kräver ingen ändring här.
#
# INPUT: SessionStart hook-JSON på stdin — `source`, `cwd`, `session_id`
#   (samtliga verifierade ordagrant mot code.claude.com/docs/en/hooks.md i
#   premiss-passet ovan, 2026-08-07).
#
# OUTPUT: `source == "compact"` → `hookSpecificOutput.additionalContext`
#   med omorienterings-instruktionen. ALLA ANDRA `source`-värden (`startup`,
#   `resume`, `clear`, `fork`) OCH samtliga interna fel → HELT TYST (exit 0,
#   tomt stdout, inget stderr).
#
# Testsvit: scripts/test-post-compact-igenkanning.sh (tvåsidigt bevis:
#   injicerar vid source=compact, oavsett markörens närvaro · TYST vid
#   startup/resume/clear/fork · fail-open på interna fel, testat).
#
# SKARPBEVIS ÄR EN ÖPPEN SKULD (CLAUDE.md § "En ny hook kan ALDRIG
#   skarpbevisas i sessionen som byggde den"): registreras i
#   .claude/settings.json i SAMMA session som bygger den, tas alltså INTE i
#   bruk förrän nästa session (ingen reload-väg finns). Logiken är bevisad
#   tvåsidigt i byggsessionen (testsviten ovan + manuell körning mot
#   verkligt tillstånd, se slutrapportens bevis-avsnitt). Betalas nästa
#   session med samma differentialmätning som deny-precompact.sh/
#   deny-subagent-vantan.sh/deny-arbetsform-push.sh:s skuld: provocera en
#   REDAN laddad hook (t.ex. scripts/katalogagarskap-markor.sh, som kör på
#   SAMMA hook-event) parallellt för att skilja "fel logik här" från "ej
#   laddad än" — en session som ser katalogagarskap-markor.sh:s
#   additionalContext men INTE denna hooks (efter en genuin `/compact`)
#   pekar mot registrering, inte logik.
#
# Källa: ADR-101-compact-formen-kontrollerad-kompaktering-smal-nisch.md
#        § Beslut 4, 5 ·
#        scripts/katalogagarskap-markor.sh (SessionStart-formförebild,
#        additionalContext-mönster, fail-open-hållning) ·
#        scripts/deny-precompact.sh (policy-läsningens struktur,
#        cwd-baserad arbetsträdsupplösning) ·
#        .precompact-policy.conf (origin/feat/task-160-2-precompact-grinden
#        — markörens JSON-schema och default-filnamn) ·
#        code.claude.com/docs/en/hooks.md
# Etablerad: TASK-160.4, 2026-08-07

set -uo pipefail

# ── Fail-open ovillkorligt, se § FAIL-OPEN ovan: varje internt fel nedan
# avslutar TYST med exit 0 — ingen additionalContext, inget stderr. jq-
# kontrollen körs FÖRST, innan något annat (inklusive `dirname` nedan) —
# på system där `jq` och coreutils som `dirname` delar katalog (mätt lokalt:
# macOS med jq under /usr/bin) skulle en PATH utan jq-katalogen annars ta
# bort `dirname` också, och ett `command not found` hade läckt till stderr
# INNAN jq-kontrollen ens hann köra. Ordningen är alltså inte kosmetisk.
command -v jq > /dev/null 2>&1 || exit 0

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || exit 0

SOURCE="$(printf '%s' "${INPUT}" | jq -r '.source // empty' 2> /dev/null)"
# TYST vid allt utom "compact" — startup/resume/clear/fork, ett tomt fält,
# eller ett okänt/otolkbart värde. Detta ÄR AC 2:s tvåsidiga kontrakt: bara
# EN källa injicerar, alla andra (inklusive fel) är tysta. Kortslutningen
# sker HÄR, före SCRIPT_DIR/dirname nedan, av samma skäl som ovan — och som
# ett bra biprodukt: de fyra tysta källorna gör noll filsystemsarbete.
[[ "${SOURCE}" == "compact" ]] || exit 0

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
PRECOMPACT_POLICY="${PRECOMPACT_POLICY:-${SCRIPT_DIR}/../.precompact-policy.conf}"

# ── jq-VERSIONSKONTROLL, MEDVETET INTE VID RAD 150 (TASK-312) ──────────────
# Raden 150 (`command -v jq > /dev/null 2>&1 || exit 0`) MÅSTE förbli en
# bar presence-check FÖRE all dirname/coreutils-användning — se § ovan
# ("jq-kontrollen körs FÖRST, innan något annat... på system där jq och
# coreutils som dirname delar katalog"). Att source:a jq-guard.sh DÄR hade
# krävt dirname FÖRE presence-checken, exakt den ordning stycket ovan
# varnar för. Guarden läggs i stället HÄR: SCRIPT_DIR är redan beräknad
# (raden ovan, av ett ANNAT skäl — PRECOMPACT_POLICY), och vi är redan
# förbi "källan är compact"-grinden (rad 162) — de fyra tysta källorna gör
# därför fortfarande NOLL extra filsystemsarbete, precis som kommentaren
# vid rad 160 kräver. jq:s presence är redan bevisad (rad 150); detta
# lägger bara till versionskontrollen ovanpå den.
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh" || exit 0
jq_version_ok > /dev/null 2>&1 || exit 0

# ── Arbetsträdets rot via cwd, INTE ${CLAUDE_PROJECT_DIR:-.} — samma
# mönster och samma skäl som scripts/deny-precompact.sh § ARBETSTRÄDETS
# ROT: markörfilen (satt av pre-compact-skillen i SESSIONENS EGET
# arbetsträd) hade aldrig synts korrekt om sökvägen löstes via den delade
# huvudkatalogen. `${CLAUDE_PROJECT_DIR:-.}` används HÄR ENDAST i
# .claude/settings.json:s command-fält för att hitta DETTA SKRIPT (stabil,
# delad, huvudkatalogs-förankrad kod) — aldrig för markörfilen.
HOOK_CWD="$(printf '%s' "${INPUT}" | jq -r '.cwd // empty' 2> /dev/null)"
ARBETSTRAD_ROT=""
if [[ -n "${HOOK_CWD}" && -d "${HOOK_CWD}" ]]; then
    ARBETSTRAD_ROT="$(cd "${HOOK_CWD}" 2> /dev/null && git rev-parse --show-toplevel 2> /dev/null)"
fi
# Kan inte lösa arbetsträdets rot (cwd saknas/ogiltig, inget git-repo) →
# fail-open TYST. Detta är ett rapporterande, aldrig gatande, skript: utan
# en rot att slå upp markören mot finns inget tillförlitligt att säga.
[[ -n "${ARBETSTRAD_ROT}" ]] || exit 0

# ── Markörfilens namn: sourca .precompact-policy.conf OM den finns
# (TASK-160.2), annars det exakt dokumenterade default-värdet — se
# § SEKVENSBEROENDE ovan. Ett fel vid sourcing (trasig policy-syntax)
# faller tillbaka på samma default i stället för att fail-closed:a — denna
# hook gatar ingenting, så en otolkbar policy ska aldrig göra den tystare
# än nödvändigt.
MARKOR_FILNAMN=".claude/precompact-markor.json"
if [[ -f "${PRECOMPACT_POLICY}" ]]; then
    # shellcheck source=/dev/null
    source "${PRECOMPACT_POLICY}" 2> /dev/null || true
    MARKOR_FILNAMN="${PRECOMPACT_MARKOR_FILNAMN:-.claude/precompact-markor.json}"
fi
MARKORFIL="${ARBETSTRAD_ROT}/${MARKOR_FILNAMN}"

# ── Bygg omorienterings-instruktionen. PÅSTÅENDEN, ALDRIG IMPERATIV — se
# § PREMISS-PASSET punkt 3 ovan (injektionsförsvaret). Samma disciplin som
# scripts/katalogagarskap-markor.sh:s HANDLINGSREGEL-sträng.
MONITOR_RAD="Sessionens körtids-monitor startas om enligt session-resume-skillens paragraf 7-form: Monitor(command: \"bash scripts/heartbeat-svep.sh --quiet\", persistent: true) — repon som saknar det skriptet hoppar över steget som vilande, inte som ett fel."

if [[ -f "${MARKORFIL}" ]]; then
    MARKOR_RAD="Markörfilen ${MARKORFIL} finns fortfarande och är en engångsbiljett satt av pre-compact-skillen före kompakteringen (ADR-101 § Beslut 4) — den hör till denna omorienterings sista steg och tas bort som en del av den, inte av hook-skriptet som injicerade denna text."
else
    MARKOR_RAD="Ingen markörfil hittades vid ${MARKORFIL} — omorienteringen gäller ändå: markören är i så fall redan borttagen eller aldrig satt, och det finns inget kvar att rensa."
fi

CONTEXT="COMPACT-FORMEN (ADR-101, TASK-160.4): denna session startade om efter en kompaktering (SessionStart source: compact). Repots konvention för det läget, i stället för att förlita sig på kompakteringens sammanfattning, är en mekanisk omorientering mot disk: kärnytorna re-läses innan nytt arbete påbörjas — todo-kadensraden i tasks/todo.md, sessionsdokets senaste Del under tasks/sessions/, och git status. ${MONITOR_RAD} ${MARKOR_RAD}"

jq -nc --arg ctx "${CONTEXT}" \
    '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}' \
    2> /dev/null || exit 0

exit 0
