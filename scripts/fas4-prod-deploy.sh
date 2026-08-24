#!/usr/bin/env bash
# scripts/fas4-prod-deploy.sh — Fas 4:s EF-deploy-sekvens som EN körning.
#
# VARFÖR SKRIPTET FINNS: sekvensen bestod av fem handkörda kommandon i rätt
#   ordning, där tre av felen kostar mest när de görs för hand:
#     (a) `supabase link` utan styrd stdin HÄNGER på databas-lösenordsprompten
#         — en hängning är inget felmeddelande (fas 4-underlagets fälla 1,
#         kostade en arbetsdag).
#     (b) Fel projekt länkat vid en skarp operation — MÄTT SKARPT: fem EF:er
#         deployades oavsiktligt till prod 2026-08-10 16:47 på exakt det felet.
#     (c) Återlänkningen till staging glöms — `link`-tillståndet är sticky och
#         OSYNLIGT, så nästa `db push` i samma katalog går mot prod.
#   Skriptet kodar bort alla tre: styrd stdin överallt, verifiering av
#   `supabase/.temp/project-ref` FÖRE varje skarp operation, och återlänkning
#   i en EXIT-trap som körs även när något fallerar halvvägs.
#   Källa: docs/research/fas4-ef-deploy-underlag-2026-08-17.md (steg 0–8, R1–R12).
#
# ═══ VARFÖR PROJECT-REFEN ÄR ETT ARGUMENT OCH INTE LÄSES UR POLICYN ═══
#
#   Skriptet KAN läsa PROD_REF_PROD ur .prod-ref-policy.conf — den finns och
#   sourcas här för validering. Men att låta refen komma DÄRIFRÅN skulle bryta
#   scripts/deny-prod-ref.sh: den hooken matchar på refens NÄRVARO I
#   BASH-KOMMANDOSTRÄNGEN, så ett anrop utan refen i texten passerar spärren.
#   Ett bekvämt `bash scripts/fas4-prod-deploy.sh --deploya` hade alltså gjort
#   hela prod-låset verkningslöst för varje agent som läser detta repo.
#
#   Därför KRÄVS refen som argument, i BÅDA lägena — även det read-only:
#     - Marcus anrop bär refen → hooken ser den → hans väg fungerar
#       (`!`-prefixet passerar PreToolUse, mätt två gånger: S103 Del 15 och
#       S106 — se tasks/lessons.d/bang-prefixet-passerar-pretooluse-hookar-*).
#     - En agents anrop bär också refen → hooken FÄLLER, precis som avsett.
#   Bekvämligheten ligger i att fem kommandon blir ett, inte i att kringgå
#   låset. Policyn läses bara för att VALIDERA det angivna värdet.
#
#   Read-only-läget kräver refen av samma skäl: .prod-ref-policy.conf § Matchning
#   slår fast att låset gäller "oavsett om kommandot skriver ut något eller inte".
#   Ett undantag här hade varit en tyst uppmjukning av den doktrinen.
#
# ANVÄNDNING (Marcus, via !-prefixet eller egen terminal):
#   bash scripts/fas4-prod-deploy.sh --kontrollera <prod-ref>
#   bash scripts/fas4-prod-deploy.sh --deploya     <prod-ref>
#
#   --kontrollera  Läser prod-läget. ÄNDRAR INGET, länkar inte om. Kör detta
#                  först och läs utfallet innan --deploya.
#   --deploya      Hela sekvensen: länka → deploya allowlisten → verifiera →
#                  länka tillbaka till staging.
#
# EXITKODER: 0 = allt gick igenom · 1 = felaktig användning eller preflight
#   fällde · 2 = en skarp operation avbröts (läs utdatan; återlänkningen har
#   ändå körts via trappen).
#
# Etablerad: TASK-272 (S102 resume 8, 2026-08-17), Marcus GO "Ja skript är
#   väl mycket bättre".

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROT="$(cd "${SCRIPT_DIR}/.." && pwd)"
POLICY="${REPO_ROT}/.prod-ref-policy.conf"
LANK_TILLSTAND="${REPO_ROT}/supabase/.temp/project-ref"

rott() { printf '\033[31m%s\033[0m\n' "$1" >&2; }
gront() { printf '\033[32m%s\033[0m\n' "$1"; }
rubrik() { printf '\n\033[1m══ %s\033[0m\n' "$1"; }

doden() {
    rott "❌ $1"
    exit "${2:-1}"
}

usage() {
    cat <<'HJALP'
Fas 4 — EF-deploy till prod.

  bash scripts/fas4-prod-deploy.sh --kontrollera <prod-ref>
  bash scripts/fas4-prod-deploy.sh --deploya     <prod-ref>

  --kontrollera   Läs prod-läget. Ändrar inget, länkar inte om.
  --deploya       Länka → deploya → verifiera → länka tillbaka till staging.

Project-refen MÅSTE anges explicit — se skriptets huvud för varför
(prod-låset matchar på refens närvaro i kommandosträngen).
HJALP
}

# ── Argument ────────────────────────────────────────────────────────────────
LAGE="${1:-}"
ANGIVEN_REF="${2:-}"

case "${LAGE}" in
    --kontrollera | --deploya) ;;
    -h | --help)
        usage
        exit 0
        ;;
    *)
        usage >&2
        doden "Ange --kontrollera eller --deploya (skriptet gissar aldrig läge)."
        ;;
esac

[[ -n "${ANGIVEN_REF}" ]] || {
    usage >&2
    doden "Project-ref saknas. Den anges explicit, aldrig ur config."
}

# ── Policyn: validera den angivna refen mot husets kända värden ─────────────
[[ -f "${POLICY}" ]] || doden "Policyfilen ${POLICY} saknas — kan inte validera refen."
# shellcheck source=/dev/null
source "${POLICY}" || doden "Policyfilen gick inte att läsa (syntaxfel?)."
[[ -n "${PROD_REF_PROD:-}" ]] || doden "Policyn saknar PROD_REF_PROD."
[[ -n "${PROD_REF_STAGING:-}" ]] || doden "Policyn saknar PROD_REF_STAGING."

if [[ "${ANGIVEN_REF}" = "${PROD_REF_STAGING}" ]]; then
    doden "Du angav STAGING-refen. Detta skript deployar till prod; för staging finns andra vägar."
fi
[[ "${ANGIVEN_REF}" = "${PROD_REF_PROD}" ]] \
    || doden "Angiven ref matchar varken prod eller staging i .prod-ref-policy.conf. Stoppar hellre än gissar."

# ── Preflight ───────────────────────────────────────────────────────────────
rubrik "Preflight"

command -v npx > /dev/null 2>&1 || doden "npx saknas i PATH."

# Supabase CLI: pinnad version, fail-closed guard — EN gång, tidigt, här.
# Poängen är att en trasig/felresolvd CLI blir högljudd FÖRE första
# funktionen, aldrig mitt i en halv deploy (S108, 2026-08-24 — se
# .supabase-cli-policy.conf § VARFÖR FILEN FINNS för incidenten).
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/supabase-cli.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/supabase-cli.sh"
# shellcheck disable=SC2310  # avsiktligt: `doden` ger eget skäl i stället
# för `set -e`:s tysta död — samma mönster som `lanka`-anropen nedan.
supabase_cli_guard || doden "Supabase CLI-versionen kunde inte verifieras mot .supabase-cli-policy.conf."

cd "${REPO_ROT}"

TRADSTATUS="$(git status --porcelain)" || doden "git status misslyckades."
if [[ -n "${TRADSTATUS}" ]]; then
    git status --short >&2
    doden "Arbetsträdet är smutsigt. Deploya aldrig från ett träd du inte vet vad det innehåller."
fi
gront "✓ Arbetsträdet rent"

GREN="$(git branch --show-current)" || doden "Kunde inte läsa aktuell gren."
[[ "${GREN}" = "main" ]] || doden "Du står på grenen '${GREN}'. Prod-deploy sker från main."
HEAD_KORT="$(git rev-parse --short HEAD)" || doden "Kunde inte läsa HEAD."
gront "✓ På main (${HEAD_KORT})"

git fetch --quiet origin main || doden "git fetch mot origin misslyckades."
LOKAL_SHA="$(git rev-parse HEAD)" || doden "Kunde inte läsa lokal HEAD."
FJARR_SHA="$(git rev-parse origin/main)" || doden "Kunde inte läsa origin/main."
if [[ "${LOKAL_SHA}" != "${FJARR_SHA}" ]]; then
    doden "Lokal main är inte i nivå med origin/main. Kör 'git merge --ff-only origin/main' först."
fi
gront "✓ main i nivå med origin/main"

# ── Nuvarande länkläge ──────────────────────────────────────────────────────
NUVARANDE_LANK=""
[[ -f "${LANK_TILLSTAND}" ]] && NUVARANDE_LANK="$(cat "${LANK_TILLSTAND}")"
printf 'Länkat projekt just nu: %s\n' "${NUVARANDE_LANK:-<inget>}"

# ── Hjälpare ────────────────────────────────────────────────────────────────

# lanka <ref> — styrd stdin är OBLIGATORISK: utan den frågar kommandot efter
# databas-lösenordet och HÄNGER (fas 4-underlagets fälla 1).
lanka() {
    local ref="$1"
    echo "" | supabase_cli link --project-ref "${ref}" > /dev/null 2>&1 \
        || return 1
}

# kraev_lankat <ref> <vad> — verifierar tillståndsfilen FÖRE en skarp
# operation. Detta är räcket mot R1, det fel som faktiskt inträffat.
kraev_lankat() {
    local forvantad="$1" vad="$2" faktisk=""
    [[ -f "${LANK_TILLSTAND}" ]] || doden "Länktillståndet saknas — vägrar ${vad}." 2
    faktisk="$(cat "${LANK_TILLSTAND}")"
    [[ "${faktisk}" = "${forvantad}" ]] \
        || doden "Länkat projekt är '${faktisk}', förväntat '${forvantad}' — vägrar ${vad}." 2
    gront "✓ Verifierat länkat projekt före ${vad}"
}

# ── KONTROLLERA: read-only ──────────────────────────────────────────────────
if [[ "${LAGE}" = "--kontrollera" ]]; then
    rubrik "Prod-läget (read-only — inget ändras, ingen omlänkning)"

    printf '\n--- Deployade funktioner ---\n'
    supabase_cli functions list --project-ref "${ANGIVEN_REF}" \
        || doden "Kunde inte lista funktioner. Är du inloggad? (npx supabase login)" 2

    printf '\n--- Hemligheter ---\n'
    supabase_cli secrets list --project-ref "${ANGIVEN_REF}" \
        || doden "Kunde inte lista hemligheter." 2

    printf '\n--- Bucket "bilagor" (Storage, TASK-308) ---\n'
    if bash "${SCRIPT_DIR}/kontrollera-bilagor-bucket.sh" "${ANGIVEN_REF}"; then
        gront "✓ Bucket \"bilagor\" konvergerad mot önskad config."
    else
        rott "⚠️  Bucket \"bilagor\" saknas eller avviker i prod."
    fi

    cat <<'NOT'

──────────────────────────────────────────────────────────────────────
LÄS DETTA I UTDATAN OVAN:

  INVITE_REDIRECT_URL   Dit inbjudningsmailets länk pekar. Ska vara
                        appens publika adress (admin.miranon.dev).
  CORS_ALLOWED_ORIGINS  Saknas prod-origin här ser appen HELT DÖD ut
                        för användaren — och deploy-verifieringens
                        curl-test upptäcker det INTE (curl skickar
                        ingen Origin-header).
  Bucket "bilagor"      Saknas den, faller varje Storage-beroende EF
                        (preview-receipt m.fl.) med 502 "Bucket not
                        found" i skarpt läge — mätt TASK-308, 2026-08-23.
                        `--deploya` VÄGRAR om denna rad är röd.

OBS: `secrets list` visar NAMN och DIGEST, inte värden. Syns inget
värde måste det läsas i Supabase-dashboarden:
Project Settings → Edge Functions → Secrets.
──────────────────────────────────────────────────────────────────────
NOT
    gront "✓ Kontrollen klar. Inget ändrat, länkläget orört."
    exit 0
fi

# ── DEPLOYA: den skarpa vägen ───────────────────────────────────────────────

# Trappen är hela poängen: återlänkningen till staging sker ÄVEN när något
# fallerar halvvägs. Det är steget som glöms och kostar mest senare.
ATERSTALLD=0
aterstall_staging() {
    local kod=$?
    [[ "${ATERSTALLD}" -eq 1 ]] && return
    ATERSTALLD=1
    rubrik "Återlänkar till staging"
    # shellcheck disable=SC2310  # `set -e` SKA vara avstängt här — trappen
    # måste rapportera ett misslyckande med egen text, inte dö tyst mitt i
    # återställningen. Det är hela poängen med steget.
    if lanka "${PROD_REF_STAGING}"; then
        local efter=""
        [[ -f "${LANK_TILLSTAND}" ]] && efter="$(cat "${LANK_TILLSTAND}")"
        if [[ "${efter}" = "${PROD_REF_STAGING}" ]]; then
            gront "✓ Länkat tillbaka till staging"
        else
            rott "⚠️  Återlänkningen rapporterade OK men tillståndsfilen säger något annat."
            rott "⚠️  KÖR MANUELLT innan du gör något mer i denna katalog."
        fi
    else
        rott "⚠️  ÅTERLÄNKNINGEN MISSLYCKADES — katalogen kan fortfarande peka på prod."
        # shellcheck disable=SC2154  # SUPABASE_CLI_VERSION sätts av det
        # sourcade scripts/lib/supabase-cli.sh (guarden körde i Preflight,
        # innan denna trap överhuvudtaget kan nås) — samma cross-file-
        # begränsning som andra sourcade policy-variabler i repot.
        rott "⚠️  Kör manuellt: echo \"\" | npx supabase@${SUPABASE_CLI_VERSION} link --project-ref ${PROD_REF_STAGING}"
    fi
    exit "${kod}"
}
trap aterstall_staging EXIT

rubrik "Kontrollerar bucket \"bilagor\" (Storage, TASK-308) innan deploy"
# shellcheck disable=SC2310  # samma avsiktliga mönster som `lanka` nedan.
if bash "${SCRIPT_DIR}/kontrollera-bilagor-bucket.sh" "${ANGIVEN_REF}"; then
    gront "✓ Bucket \"bilagor\" konvergerad — säkert att deploya Storage-beroende EF:er."
else
    doden "Bucket \"bilagor\" saknas eller avviker i prod (TASK-308) — en Storage-beroende EF (t.ex. preview-receipt) skulle deployas mot tomhet. Provisionera via dashboarden, verifiera med \`node scripts/provision-attachments-bucket.mjs --kontrollera ${ANGIVEN_REF}\`, kör om." 2
fi

rubrik "Länkar till prod"
# shellcheck disable=SC2310  # avsiktligt: `lanka` returnerar felkod och vi
# vill ge ett eget, begripligt skäl via `doden` i stället för `set -e`:s tysta
# död — utfallet är identiskt (avbrott), men läsaren får veta varför.
lanka "${ANGIVEN_REF}" || doden "Länkningen misslyckades." 2
kraev_lankat "${ANGIVEN_REF}" "deploy"

rubrik "Deployar allowlistade funktioner"
bash "${SCRIPT_DIR}/deploy-prod-functions.sh" --project-ref "${ANGIVEN_REF}" \
    || doden "Deployen avbröts. Skriptet är idempotent per funktion — läs vilken som föll, rätta, kör om." 2

rubrik "Verifierar"
kraev_lankat "${ANGIVEN_REF}" "verifiering"
supabase_cli functions list --project-ref "${ANGIVEN_REF}" \
    || doden "Kunde inte verifiera funktionslistan." 2

cat <<'NOT'

──────────────────────────────────────────────────────────────────────
LÄS `UPDATED_AT`, INTE `VERSION`.

En deploy bumpar VERSION +1 på ALLA funktioner medan UPDATED_AT står
stilla för dem som inte rördes — plattforms-artefakt, inte ett fel.
Färsk UPDATED_AT är det enda som bevisar att en funktion faktiskt
deployades.
──────────────────────────────────────────────────────────────────────
NOT

gront "✓ Deployen klar."
