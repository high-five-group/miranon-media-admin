#!/usr/bin/env bash
# scripts/deny-prod-ref.sh — mekaniskt lås mot agent-kommandon riktade mot
# produktions-Supabase-projektet (TASK-203).
#
# VARFÖR SKRIPTET FINNS: prod-skydds-kortet var föreslaget och obesvarat
#   sedan tidigare (tasks/todo.md rad 47, "Öppet beslut: prod-skydds-
#   kortet"). Marcus-ordern 2026-08-12 ("Fixa skiten för gott ... Gör det
#   PROFFSIGT!") är dess kvittens — byggd i samma arbete som
#   scripts/deny-hemlighet-utskrift.sh (TASK-203), men SEPARAT LÅS för en
#   SEPARAT riskklass: detta stoppar kommandon riktade mot prod, oavsett
#   om de skriver ut något eller inte.
#
# VAD DEN PRÖVAR: förekomst av prod-project-refen (PROD_REF_PROD,
#   .prod-ref-policy.conf) NÅGONSTANS i Bash-kommandosträngen. Se
#   .prod-ref-policy.conf § Matchning för den fulla motiveringen till
#   varför detta MEDVETET är bredare än en subkommando-specifik lista
#   (link/db push/functions deploy/secrets set) — kort sagt: refen är en
#   20-tecken CID, praktiskt taget omöjlig att nämna av misstag, och en
#   ren ref-match behöver inte hållas i synk med varje ny Supabase CLI-
#   subkommando som kan skriva till ett projekt.
#
# ═══ MEDVETEN VÄG FÖRBI — LÄS DETTA INNAN DU ÄNDRAR NÅGOT HÄR ═══
#
#   Två helt olika mekanismer, med olika styrka:
#
#   (1) STRUKTURELL, KRÄVER INGEN KOD: en PreToolUse-hook ser BARA Claude
#       Codes egna Bash-anrop. Ett kommando Marcus skriver i sin egen
#       terminal, utanför Claude Code, når aldrig denna hook — den vägen
#       är redan garanterad av HUR mekanismen fungerar, inte av något
#       skriptet gör. Detta är den STARKA vägen: ingen agent kan
#       konstruera den, eftersom den inte går genom agentens verktygsyta
#       alls.
#
#   (2) DESIGNAD BYPASS, SVAGARE MEN DOKUMENTERAD: för fall där Marcus
#       explicit vill dirigera en agent i chatten (t.ex. "kör detta prod-
#       kommando åt mig") — ett miljövariabel-PREFIX på SAMMA
#       kommandorad, `${PROD_REF_BYPASS_VAR}=${PROD_REF_PROD}`. Kravet på
#       att VÄRDET är refen SJÄLV (inte "true"/"yes") är samma typa-för-
#       att-bekräfta-mönster som GitHubs repo-radering eller Herokus
#       `pg:reset --confirm APP_NAME` — en kort generisk bekräftelse kan
#       klistras in av vana, hela project-refen kräver avsiktlig handling.
#
#       ÄRLIG BEGRÄNSNING, INTE DOLD: skriptets källkod ligger i repot och
#       är läsbar för varje agent. Ingenting HINDRAR mekaniskt en agent
#       från att själv läsa denna kommentar och konstruera bypass-formen
#       utan att Marcus faktiskt dikterat den — exakt samma öppna
#       avvägning som ADR-104:s "!"-kanal för facit-godkännande gör
#       (dokumenterad konvention + en smal teknisk spärr, inte ett
#       matematiskt bevisat outbrytbart lås). Mitigeringen: (a) formen är
#       distinkt nog att den aldrig uppstår i ett agents NORMALA
#       arbetsvokabulär, (b) VARJE användning loggas SYNLIGT till stderr
#       (aldrig tyst) så bruket alltid är efterhandsgranskningsbart, och
#       (c) denna kommentar säger uttryckligen: bypass-formen ska ENDAST
#       skrivas av Marcus, i klartext, aldrig av en agent på eget initiativ.
#
# ═══ FAIL-CLOSED-KONTRAKTET — se deny-resend-send.sh för fullt resonemang ═══
#
#   Samma motivering som deny-hemlighet-utskrift.sh: en obehörig
#   prod-mutation är IRREVERSIBEL (data i prod, Lottas skarpa miljö).
#   Varje nekande väg slutar i exit 2; varje internt fel NEKAR. `set -uo
#   pipefail`, INTE `-e` (samma skäl som deny-resend-send.sh).
#
# MATCHER: registrerad i .claude/settings.json på matcher "Bash" ENDAST.
#
# INPUT: PreToolUse hook-JSON på stdin, `tool_name` + `tool_input.command`.
#
# Testsvit: scripts/test-deny-prod-ref.sh (tvåsidigt bevis, inkl. bypass-
#   formen i båda riktningar: fel/saknat bypass-värde nekas, korrekt
#   bypass-värde släpper igenom).
#
# Källa: TASK-203 · tasks/todo.md rad 47 (prod-skydds-kortets historik) ·
#        .prod-ref-policy.conf · scripts/deny-resend-send.sh (formmall) ·
#        docs/reference/atkomst-och-nycklar.md § Register (ref-bekräftelse)
# Etablerad: TASK-203, 2026-08-12

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_REF_POLICY="${PROD_REF_POLICY:-${SCRIPT_DIR}/../.prod-ref-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

# deny <skäl> — se deny-hemlighet-utskrift.sh för samma kontrakt.
deny() {
    printf 'PROD-REF-LÅS (%s): %s\n' "${PROD_REF_TASK_ID:-TASK-203}" "$1" >&2
    printf 'Marcus-order 2026-08-12: agenter får ALDRIG rikta kommandon mot prod-Supabase-projektet mekaniskt. Detta är hans data och hans beslut. Väg förbi: (1) Marcus kör kommandot själv i sin EGEN terminal, utanför Claude Code — denna hook ser bara Claude Codes egna Bash-anrop, den vägen är alltid öppen för honom och kräver ingen bypass, ELLER (2) Marcus dikterar explicit bypass-prefixet i klartext i chatten om han vill att en agent kör det åt honom — se scripts/deny-prod-ref.sh § MEDVETEN VÄG FÖRBI. En agent konstruerar ALDRIG bypass-formen på eget initiativ.\n' >&2
    exit 2
}

jq_version_ok || deny "jq saknas eller är för gammal i PATH — hooken kan inte verifiera anropet (TASK-312, .jq-version-policy.conf)."

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || deny "tom eller oläsbar hook-input på stdin."

TOOL_NAME="$(printf '%s' "${INPUT}" | jq -r '.tool_name // empty' 2>/dev/null)"
[[ -n "${TOOL_NAME}" ]] || deny "hook-input gick inte att tolka som JSON, eller saknar tool_name."

[[ "${TOOL_NAME}" = "Bash" ]] || exit 0

[[ -f "${PROD_REF_POLICY}" ]] || deny "policyfilen ${PROD_REF_POLICY} saknas."
# shellcheck source=/dev/null
source "${PROD_REF_POLICY}" || deny "policyfilen ${PROD_REF_POLICY} gick inte att läsa (syntaxfel?)."

[[ -n "${PROD_REF_PROD:-}" ]] || deny "policyn definierar ingen PROD_REF_PROD — ett tomt värde är inte 'inget att neka', det är ett trasigt lås."
[[ -n "${PROD_REF_BYPASS_VAR:-}" ]] || deny "policyn definierar ingen PROD_REF_BYPASS_VAR."

COMMAND="$(printf '%s' "${INPUT}" | jq -r '.tool_input.command // empty' 2>/dev/null)"
[[ -n "${COMMAND}" ]] || exit 0

# Kommandot nämner inte prod-refen alls → inget att neka. Detta är den
# vanliga, ofarliga vägen (staging-arbete, orelaterade kommandon).
[[ "${COMMAND}" == *"${PROD_REF_PROD}"* ]] || exit 0

# Prod-refen förekommer. Prövar bypass-formen INNAN nekande: krävt värde
# är refen SJÄLV, som ett variabel-prefix ELLER en explicit `export`/`VAR=
# värde` någonstans i SAMMA kommandorad (Bash-tool startar en färsk shell
# per anrop, se .prod-ref-policy.conf § Medveten väg förbi — ett tidigare
# `export` i ett ANNAT Bash-anrop kan aldrig nå hit).
BYPASS_PATTERN="(^|[;&[:space:]])${PROD_REF_BYPASS_VAR}=${PROD_REF_PROD}([[:space:]]|$)"
if [[ "${COMMAND}" =~ ${BYPASS_PATTERN} ]]; then
    printf 'PROD-REF-LÅS (%s): BYPASS ANVÄND — kommandot innehöll %s=%s och släpps igenom. Detta ska ENDAST ha skett på Marcus egen, uttryckliga diktering. Om du ser denna rad utan att minnas att Marcus bad om just detta: stanna och fråga honom innan du fortsätter.\n' \
        "${PROD_REF_TASK_ID:-TASK-203}" "${PROD_REF_BYPASS_VAR}" "${PROD_REF_PROD}" >&2
    exit 0
fi

deny "Bash-kommandot nämner produktions-Supabase-projektets ref. Ingen bypass-form (${PROD_REF_BYPASS_VAR}=<ref>) hittades på kommandoraden."
