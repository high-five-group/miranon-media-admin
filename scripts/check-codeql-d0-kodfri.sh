#!/usr/bin/env bash
# check-codeql-d0-kodfri.sh — vaktar premissen bakom TASK-464.2:s
# återanvändning av ci.yml:s D0-allowlist för CodeQL:s paths-ignore: att
# sökvägarna som undantas är KODFRIA.
#
# ═══ VARFÖR GRINDEN FINNS ═══
#
# Review runda 1 (TASK-464.2, PR #2558) stickprovade D0-listan mot repots
# faktiska träd och fann ÅTTA spårade .mjs/.js-filer under `docs/**` och
# `tasks/**` — arkiverade backfill-/rigg-skript, aldrig körda av npm eller
# CI, men analyserbara till sin FORM. Premissen "D0 = ingen analyserbar kod"
# var alltså ett antagande, inte en mätt invariant. Den här grinden gör
# antagandet till en grind: den listar spårade filer under CodeQL:s
# D0-undantag och fäller om någon är analyserbar (se § ANALYSERBARHET nedan)
# utan att stå deklarerad i undantagslistan, med skäl.
#
# Review runda 2 (samma PR) fann att grinden ändå missade
# `docs/design/farg-atlas.html` — ett äkta `<script>`-block, osynligt för
# den ursprungliga JS/TS-familj-ändelselistan. § ANALYSERBARHET nedan är
# omskriven mot CodeQL:s egen extraktor-dokumentation.
#
# ═══ VAD GRINDEN LÄSER ═══
#
# D0-globlistan läses LIVE ur .github/workflows/codeql.yml, mellan
# markörerna `# paritet:start klassning-codeql-d0` / `# paritet:slut
# klassning-codeql-d0` — SAMMA region scripts/check-listparitet.sh:s par
# `klassning-codeql-positiv` vaktar mot ci.yml. Grinden härleder alltså
# aldrig sin egen kopia av listan; glider D0-listan siktar den ändå rätt.
#
# `git ls-files <pathspec...>` med flera D0-mönster som argument är en
# UNION (OR) av alla mönster — samma form review-fyndets egen
# reproduktions-kommando använde (`git ls-files 'tasks/**' 'docs/**'
# '.claude/**' | grep -E ...`). Git:s pathspec-glob stödjer `**` nativt
# (wildmatch sedan git 1.8.5), ingen `shopt -s globstar`-komplikation
# behövs.
#
# ═══ ANALYSERBARHET — TVÅ LAGER (review runda 2 fynd 1) ═══
#
# LAGER 1 — filändelse, mot CodeQL:s EGEN dokumenterade extraktor-lista
# (codeql.github.com, "Supported languages and frameworks", tabellraden
# för JavaScript, hämtad 2026-09-19): ".js", ".jsx", ".mjs", ".es", ".es6",
# ".htm", ".html", ".xhtm", ".xhtml", ".vue" (JS-extraktorn) plus ".ts",
# ".tsx", ".mts", ".cts" (TS-extraktorn, samma sida). `.cjs` läggs till
# TROTS att den INTE står explicit i den tabellen — den är CommonJS-syskonet
# till den listade `.mjs` och review-instruktionen namngav den uttryckligen;
# en falsk POSITIV (en .cjs-fil som visar sig ofarlig) kostar bara ett extra
# granskat undantag, en falsk NEGATIV (en verklig .cjs-fil som aldrig synas)
# kostar ett riktigt hål — säkraste riktningen är att inkludera den.
#
# MEDVETET UTESLUTNA, trots att SAMMA sida namnger dem ("JSX and Flow code,
# YAML, JSON, HTML, and XML files may also be analyzed WITH JavaScript
# files"): ".json", ".yaml", ".yml", ".raml", ".xml", ".hbs", ".ejs", ".njk".
# Skälet är fras­en "analyzed WITH" själv — sidan preciserar INTE om dessa
# är oberoende topp-nivå-källfiler extraktorn skannar på egen hand, eller
# enbart data som dras in NÄR en .js/.ts-fil refererar dem (t.ex. `import
# x from './x.json'`). Att inkludera dem hade svept in praktiskt taget
# VARJE JSON-fil under docs/**/tasks/**/.claude/** (sessionsdokens
# facit.json, backlog-kortens metadata, mängder av ren datakonfiguration)
# — en explosion av brus grinden inte kan skilja från en verklig risk med
# en ändelse-baserad regel. Detta är en NAMNGIVEN, ÖPPEN scope-avgränsning
# (inte en tyst lucka): om evidens dyker upp för att dessa format extraheras
# OBEROENDE av JS/TS-referenser, måste denna gräns omprövas.
#
# LAGER 2 — INNEHÅLL, bara för HTML-familjen (.html/.htm/.xhtml/.xhtm): en
# ren statisk HTML-fil UTAN `<script`-block och UTAN inline-händelsehanterare
# (onclick=, onload= osv.) bär ingen analyserbar JS-kod — den får PASSERA
# TYST, ingen flaggning, inget undantag krävs. Detta håller grinden fokuserad
# på faktisk kod i stället för att drunkna i vanlig dokumentations-HTML.
# `.vue`/`.js`/`.ts`-familjen filtreras INTE på innehåll — hela poängen med
# de ändelserna är att filen per definition ÄR kod.
#
# ═══ UNDANTAG ═══
#
# En rad per fil i policy-conf:en, format `<sökväg>:::<skäl>`. Skälet ska
# vara VERIFIERAT (körs filen av ett npm-skript eller en workflow hör den
# INTE hemma i en dokumentkatalog — flytta den, undanta den inte).
#
# Ett undantag som inte längre behövs FÄLLER också, av samma skäl som
# check-listparitet.sh: annars maskerar det nästa drift på samma post.
#
# INGEN `mapfile`/`declare -A` — macOS levererar bash 3.2, som saknar
# båda (samma fälla check-listparitet.sh dokumenterar i sin `falt()`-
# kommentar). Set-medlemskap löses med `grep -qxF` mot en radseparerad
# sträng i stället för en associativ array.
#
# ═══ FAIL-CLOSED PÅ git ls-files (review runda 2 fynd 5) ═══
#
# `git ls-files`:s stderr och exitkod SVALDES tidigare tyst
# (`2>/dev/null ... || true`) — körd UTANFÖR ett git-repo (t.ex. `.git`
# saknas, eller `git`-binären saknas) hade det gett TOM utdata, tolkad som
# "0 spårade filer, 0 analyserbara" — FAIL-OPEN på precis det sätt hela
# den här grinden finns för att förhindra (jämför NOLL-poster-disciplinen i
# check-listparitet.sh). Nu prövas exitkoden explicit: ett `git ls-files`-fel
# fäller grinden med den kontrakterade anropsfel-koden (2), aldrig tyst 0.
#
# Exit 0 = inga otillåtna filer (eller samtliga är deklarerade undantag,
#          och inga obehövliga undantag kvarligger).
# Exit 1 = otillåten fil funnen ODEKLARERAD, eller obehövligt undantag.
# Exit 2 = anropsfel — grinden kunde inte läsa det den skulle pröva
#          (inklusive: git ls-files själv fallerade).
#
# Config: .codeql-d0-kodfri-policy.conf
# Källa: TASK-464.2, review runda 1 fynd 1 (warning), review runda 2
# fynd 1 (warning) + fynd 5 (info).

set -uo pipefail

POLICY_FIL="${CODEQL_D0_KODFRI_POLICY:-.codeql-d0-kodfri-policy.conf}"
CODEQL_YML="${CODEQL_D0_KODFRI_WORKFLOW:-.github/workflows/codeql.yml}"
START_MARK="# paritet:start klassning-codeql-d0"
SLUT_MARK="# paritet:slut klassning-codeql-d0"

# LAGER 1 — se § ANALYSERBARHET ovan för källa och motivering per ändelse.
ANALYSERBAR_ERE='\.(js|jsx|mjs|es6?|cjs|ts|tsx|mts|cts|vue|htm|html|xhtm|xhtml)$'
# Delmängden som kräver LAGER 2 (innehållskontroll) innan den flaggas.
HTML_FAMILJ_ERE='\.(htm|html|xhtm|xhtml)$'
# `<script`-block eller ett inline-händelsehanterar-attribut (onclick=,
# onload=, ...). `-i` för attributnamnets skiftläge; `<script` matchar även
# `<script>`/`<script type=...>` utan att kräva en avslutande `>`.
HTML_KOD_ERE='<script|[[:space:]]on[a-zA-Z]+[[:space:]]*='

if [[ ! -f "${POLICY_FIL}" ]]; then
    echo "❌ policy-fil saknas: ${POLICY_FIL}" >&2
    echo "   Grinden vägrar gissa vilka undantag som är avsiktliga." >&2
    exit 2
fi
# shellcheck source=/dev/null
. "${POLICY_FIL}"
CODEQL_D0_UNDANTAG="${CODEQL_D0_UNDANTAG-}"

if [[ ! -f "${CODEQL_YML}" ]]; then
    echo "❌ ${CODEQL_YML} saknas" >&2
    exit 2
fi
if ! grep -qF -- "${START_MARK}" "${CODEQL_YML}"; then
    echo "❌ start-markören saknas i ${CODEQL_YML}" >&2
    echo "   Sökte: ${START_MARK}" >&2
    exit 2
fi
if ! grep -qF -- "${SLUT_MARK}" "${CODEQL_YML}"; then
    echo "❌ slut-markören saknas i ${CODEQL_YML}" >&2
    echo "   Sökte: ${SLUT_MARK}" >&2
    exit 2
fi

# ─── Extrahera D0-globs live ur codeql.yml ──────────────────────────────────
GLOBS="$(awk -v s="${START_MARK}" -v e="${SLUT_MARK}" '
    !f && index($0, s) { f = 1; next }
    f && index($0, e)  { exit }
    f                  { print }
' "${CODEQL_YML}" | grep -oE "'[^']+'" | tr -d "'")"

if [[ -z "${GLOBS}" ]]; then
    echo "❌ NOLL globs extraherade ur ${CODEQL_YML} — grinden läser inget" >&2
    exit 2
fi

# git ls-files tar pathspecs som separata argument. `xargs` hade riskerat
# ord-splittring på mellanslag i sökvägar (ingen av D0:s 17 poster har det
# i dag, men grinden ska inte tysta gå fel om det ändras) — bygg arg-listan
# rad för rad i stället.
GLOB_ARGS=()
while IFS= read -r g; do
    [[ -z "${g}" ]] && continue
    GLOB_ARGS+=("${g}")
done <<< "${GLOBS}"

# ─── Undantagens egen form prövas FÖRST ─────────────────────────────────────
UNDANTAGS_FILER=""
while IFS= read -r rad; do
    [[ -z "${rad}" ]] && continue
    if [[ "${rad}" != *:::* ]]; then
        echo "❌ undantags-post saknar ':::'-separator: ${rad}" >&2
        echo "   Format: <sökväg>:::<skäl>" >&2
        exit 2
    fi
    u_fil="${rad%%:::*}"
    u_skal="${rad#*:::}"
    if [[ -z "${u_skal}" ]]; then
        echo "❌ undantag för '${u_fil}' saknar skäl" >&2
        echo "   Ett undantag utan skrivet skäl är en tystad avvikelse." >&2
        exit 2
    fi
    if grep -qxF -- "${u_fil}" <<< "${UNDANTAGS_FILER}"; then
        echo "❌ dubblerad undantags-post för '${u_fil}'" >&2
        exit 2
    fi
    UNDANTAGS_FILER="${UNDANTAGS_FILER}${u_fil}"$'\n'
done <<< "${CODEQL_D0_UNDANTAG}"

# ─── Träffarna — spårade filer under D0 med analyserbar ändelse ────────────
# `git ls-files`:s exitkod prövas EXPLICIT (review runda 2 fynd 5) — ett fel
# (t.ex. körning utanför ett git-repo) fäller grinden med anropsfel-koden i
# stället för att tyst tolkas som "noll filer, allt grönt". `set -o
# pipefail` (satt ovan via `set -uo pipefail`) gör att LS_STATUS speglar
# `git ls-files`, inte `grep`:s efterföljande led.
LS_UTDATA=""
LS_STATUS=0
LS_UTDATA="$(git ls-files -- "${GLOB_ARGS[@]}" 2>&1)" || LS_STATUS=$?
if [[ "${LS_STATUS}" -ne 0 ]]; then
    echo "❌ git ls-files fallerade (exit ${LS_STATUS}) — grinden kan inte lista D0-trädet" >&2
    echo "   Utdata: ${LS_UTDATA}" >&2
    exit 2
fi
ALLA_D0_FILER="${LS_UTDATA}"
TRAFFAR="$(printf '%s\n' "${ALLA_D0_FILER}" | grep -E "${ANALYSERBAR_ERE}" || true)"

EXIT_CODE=0
antal_traffar=0
antal_odeklarerade=0
antal_deklarerade=0
antal_html_passerade=0
SEDDA_FILER=""

while IFS= read -r fil; do
    [[ -z "${fil}" ]] && continue

    # LAGER 2: HTML-familjen kräver bevis på faktisk kod innan den räknas.
    if [[ "${fil}" =~ ${HTML_FAMILJ_ERE} ]]; then
        if [[ ! -f "${fil}" ]] || ! grep -qE "${HTML_KOD_ERE}" -- "${fil}" 2>/dev/null; then
            antal_html_passerade=$((antal_html_passerade + 1))
            continue
        fi
    fi

    antal_traffar=$((antal_traffar + 1))
    SEDDA_FILER="${SEDDA_FILER}${fil}"$'\n'
    if grep -qxF -- "${fil}" <<< "${UNDANTAGS_FILER}"; then
        antal_deklarerade=$((antal_deklarerade + 1))
        continue
    fi
    echo "❌ ${fil}: analyserbar (se § ANALYSERBARHET) och täckt av CodeQL:s D0-undantag, men odeklarerad" >&2
    echo "   Antingen: flytta filen ur en D0-sökväg (den KÖRS/analyseras, hör inte i en dokumentkatalog)," >&2
    echo "   eller deklarera den i ${POLICY_FIL} med ett verifierat skäl." >&2
    antal_odeklarerade=$((antal_odeklarerade + 1))
    EXIT_CODE=1
done <<< "${TRAFFAR}"

# ─── Obehövliga undantag — samma disciplin som check-listparitet.sh ────────
antal_obehovliga=0
while IFS= read -r u_fil; do
    [[ -z "${u_fil}" ]] && continue
    if ! grep -qxF -- "${u_fil}" <<< "${SEDDA_FILER}"; then
        echo "❌ undantaget för '${u_fil}' behövs inte längre (filen matchar inte längre" >&2
        echo "   D0 + analyserbar). Ta bort raden ur ${POLICY_FIL}." >&2
        antal_obehovliga=$((antal_obehovliga + 1))
        EXIT_CODE=1
    fi
done <<< "${UNDANTAGS_FILER}"

echo ""
if [[ "${EXIT_CODE}" -eq 0 ]]; then
    echo "✅ codeql-d0-kodfri: ${antal_traffar} analyserbara filer under D0 (${antal_html_passerade} HTML-familjefiler passerade utan kod), ${antal_deklarerade} deklarerade undantag, 0 odeklarerade."
else
    echo "${antal_odeklarerade} odeklarerad(e), ${antal_obehovliga} obehövlig(a) undantag."
fi

exit "${EXIT_CODE}"
