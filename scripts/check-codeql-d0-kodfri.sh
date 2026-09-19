#!/usr/bin/env bash
# check-codeql-d0-kodfri.sh — vaktar premissen bakom TASK-464.2:s
# återanvändning av ci.yml:s D0-allowlist för CodeQL:s paths-ignore: att
# sökvägarna som undantas är KODFRIA. Sedan TASK-471 är grinden PARAMETRISERAD
# och kör TVÅ GÅNGER i ci.yml:s `lint`-jobb — en gång mot codeql.yml:s
# `klassning-codeql-d0`-region (som förut) och en gång DIREKT mot ci.yml:s
# EGEN `klassning-d0`-region, med SAMMA policy-fil (.codeql-d0-kodfri-
# policy.conf) som delad undantagslista. Se § TVÅ KONSUMENTER nedan.
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
# den ursprungliga JS/TS-familj-ändelselistan. § ANALYSERBARHET nedan
# byggdes då om mot CodeQL:s egen extraktor-dokumentation, plus ett
# INNEHÅLLSFILTER för HTML-familjen (bara filer med faktiskt `<script>`
# eller en handler-attribut skulle flaggas).
#
# Review runda 3 fann att innehållsfiltret SJÄLVT var fail-open (case-
# känsligt, saknade javascript:-URI-detektion, sårbart för attribut på
# egen rad) och lagade det — men review runda 4 (samma PR) tog ett steg
# TILLBAKA i stället för att jaga fler varianter: granskaren visade FYRA
# YTTERLIGARE bevisade bypasser mot det lagade filtret (HTML-entitet-
# kodning `&#106;avascript:`, hex-kodning, saknat semikolon, `data:text/
# html;base64,…`). Ett innehållsfilter för HTML/JS är en KAPPRUSTNING —
# varje ny kringgåendeteknik kräver en ny motåtgärd, och listan tar aldrig
# slut (samma insikt som motiverar att XSS-filter i produktionskod ersätts
# med kontextuell escaping, inte fler regex). BESLUT (Marcus mandat,
# review runda 4 fynd 1): INNEHÅLLSSNIFFNINGEN ÄR BORTTAGEN HELT. Varje
# `.html`/`.htm`/`.xhtml`/`.xhtm`-fil under en D0-sökväg är analyserbar PER
# DEFINITION (samma regel som `.js`/`.ts`/`.mjs` redan hade) och kräver ett
# DEKLARERAT undantag, oavsett innehåll. Mindre kod, inget att kringgå.
#
# Review runda 3 byggde också en språkmatris-vakt (`actions`-språket,
# codeql.yml:s ANDRA matrisrad) direkt i det här skriptet, med en
# regex-baserad extraktion. Review runda 4 fynd 2 visade att den blev ett
# TYST no-op om matrisen skrevs i flow-form i stället för `include:`-form —
# flyttad till scripts/check-codeql-push-pr-parity.mjs (samma skäl som
# review runda 1 fynd 2 redan flyttade push/pull_request-paritetskontrollen
# dit: det skriptet parsar redan hela filen med en RIKTIG YAML-parser,
# js-yaml, i stället för text/regex). Se det skriptets § SPRÅKMATRISEN.
#
# ═══ VAD GRINDEN LÄSER ═══
#
# D0-globlistan läses LIVE ur en workflow-fil (default codeql.yml), mellan
# ett par markörer (default `# paritet:start/slut klassning-codeql-d0`) —
# SAMMA region scripts/check-listparitet.sh:s par `klassning-codeql-positiv`
# håller byte-identisk med ci.yml. Grinden härleder alltså aldrig sin egen
# kopia av listan; glider D0-listan siktar den ändå rätt.
#
# ═══ TVÅ KONSUMENTER, EN VAKT, EN UNDANTAGSLISTA (TASK-471) ═══
#
# Fram till denna ändring litade skriptet HELT på check-listparitet.sh:s
# `klassning-codeql-positiv`-par för att "täcka" ci.yml:s egen D0-lista —
# TRANSITIVT, aldrig direkt: gick den paritets-vakten någonsin sönder (fel
# konfig, en glömd rad i .listparitet-policy.conf) hade DENNA grind fortsatt
# läsa codeql.yml:s kopia utan att märka att ci.yml:s ORIGINAL hade glidit.
# Prosan i ci.yml:s steg-kommentar påstod ändå (innan denna ändring) att
# grinden "läser D0-listan … oavsett vilket jobb de körs i" — ett påstående
# ADR-083 inte tillåter förrän mekaniken faktiskt gör det.
#
# Skriptet konsumeras nu av BÅDA `lint`-jobbets steg (ci.yml), samma binär,
# samma § ANALYSERBARHET-regler, samma `.codeql-d0-kodfri-policy.conf` som
# delad undantagslista (INGEN andra kopia):
#
#   WORKFLOW=.github/workflows/codeql.yml   (default — CodeQL-ytan, TASK-464.2)
#   WORKFLOW=.github/workflows/ci.yml       (TASK-471 — ci.yml:s EGEN klassning-d0)
#     + START_MARK/SLUT_MARK satta till `# paritet:start/slut klassning-d0`
#
# Eftersom de två regionerna hålls byte-identiska (positiv mängd) av
# check-listparitet.sh ger de två körningarna I DAG samma svar — det är
# AVSIKTEN, inte ett symptom på onödigt dubbelarbete: den ANDRA körningen är
# en DIREKT, oberoende bekräftelse som inte förlitar sig på att
# paritets-vakten förblir korrekt. Går de två isär en dag fäller BÅDA
# grindarna (paritets-vakten OCH denna), var för sig, på sin egen orsak.
#
# `git ls-files <pathspec...>` med flera D0-mönster som argument är en
# UNION (OR) av alla mönster — samma form review-fyndets egen
# reproduktions-kommando använde (`git ls-files 'tasks/**' 'docs/**'
# '.claude/**' | grep -E ...`). Git:s pathspec-glob stödjer `**` nativt
# (wildmatch sedan git 1.8.5), ingen `shopt -s globstar`-komplikation
# behövs.
#
# ═══ ANALYSERBARHET — REN ÄNDELSEMATCHNING, INGET INNEHÅLLSFILTER ═══
# (review runda 2 fynd 1, förenklad review runda 4 fynd 1)
#
# Filändelse, mot CodeQL:s EGEN dokumenterade extraktor-lista
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
# HTML-familjen (.html/.htm/.xhtml/.xhtm) har INGET separat innehållslager
# längre (review runda 4 fynd 1 rev den två-lagers-konstruktionen review
# runda 2/3 byggde ut). Skälet är inte bara att filtret hade bypasser — det
# är att INNEHÅLL överhuvudtaget är fel axel att pröva på: en fil som är
# "ren" i dag kan få ett `<script>`-block i morgon utan att D0-listan eller
# policy-conf:en ändras, och grinden körs bara när NÅGOT i D0-trädet rörs.
# En ändelse-baserad regel har inte det problemet — filens FORM avgör, inte
# ett ögonblicks innehåll.
#
# MEDVETET UTESLUTNA ändelser, trots att SAMMA CodeQL-sida namnger dem
# ("JSX and Flow code, YAML, JSON, HTML, and XML files may also be analyzed
# WITH JavaScript files"): ".json", ".yaml", ".yml", ".raml", ".xml",
# ".hbs", ".ejs", ".njk". Skälet är frasen "analyzed WITH" själv — sidan
# preciserar INTE om dessa är oberoende topp-nivå-källfiler extraktorn
# skannar på egen hand, eller enbart data som dras in NÄR en .js/.ts-fil
# refererar dem (t.ex. `import x from './x.json'`). Att inkludera dem hade
# svept in praktiskt taget VARJE JSON-fil under docs/**/tasks/**/.claude/**
# (sessionsdokens facit.json, backlog-kortens metadata, mängder av ren
# datakonfiguration) — en explosion av brus grinden inte kan skilja från en
# verklig risk med en ändelse-baserad regel. Detta är en NAMNGIVEN, ÖPPEN
# scope-avgränsning (inte en tyst lucka): frågan om detta villkorade
# "analyzed WITH"-beteendet ska stängas bärs framåt av `TASK-471`
# (review runda 4 fynd 3, info) — ingen kodåtgärd i den här skivan.
#
# actions-språket (codeql.yml:s ANDRA matrisrad, review runda 3 fynd 2):
# CodeQL:s extraktor-tabell (samma sida, GitHub Actions-raden) listar
# `.github/workflows/*.yml`, `.github/workflows/*.yaml`, `**/action.yml`,
# `**/action.yaml`. De två förstnämnda ligger ALDRIG i D0 (codeql.yml:s
# `paths-ignore` undantar bara namngivna `.github/`-underfiler, aldrig hela
# `workflows/**`), så bara den fristående `action.yml`/`action.yaml`-formen
# (composite/reusable actions definierade UTANFÖR `.github/workflows/`)
# behöver en egen kontroll: `ACTIONS_FIL_ERE` nedan. Matrisspråkets EGEN
# täckning (att `codeql.yml`s matris bara innehåller KÄNDA språk) vaktas
# numera av scripts/check-codeql-push-pr-parity.mjs, inte härifrån.
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
# Config: .codeql-d0-kodfri-policy.conf (delad mellan BÅDA konsumenterna,
#         TASK-471 — se § TVÅ KONSUMENTER ovan)
# Källa: TASK-464.2, review runda 1 fynd 1 (warning), review runda 2
# fynd 1 (warning) + fynd 5 (info), review runda 3 fynd 1 (warning) +
# fynd 2 (warning), review runda 4 fynd 1 (warning, förenkling) + fynd 2
# (warning, matris-kontrollen flyttad ut) + fynd 3 (info, TASK-471-pekare).

set -uo pipefail

POLICY_FIL="${CODEQL_D0_KODFRI_POLICY:-.codeql-d0-kodfri-policy.conf}"
WORKFLOW_FIL="${CODEQL_D0_KODFRI_WORKFLOW:-.github/workflows/codeql.yml}"
# TASK-471: parametriserade så SAMMA skript kan konsumera ci.yml:s EGEN
# `klassning-d0`-region direkt, inte bara codeql.yml:s (byte-identiska,
# TASK-85-vaktade) kopia — se § TVÅ KONSUMENTER nedan. Defaultvärdena är
# OFÖRÄNDRADE (CodeQL-ytan, som innan denna ändring).
START_MARK="${CODEQL_D0_KODFRI_START_MARK:-# paritet:start klassning-codeql-d0}"
SLUT_MARK="${CODEQL_D0_KODFRI_SLUT_MARK:-# paritet:slut klassning-codeql-d0}"

# Se § ANALYSERBARHET ovan för källa och motivering per ändelse. HTML-
# familjen (htm/html/xhtm/xhtml) ingår HÄR, rakt av — inget separat
# innehållslager sedan review runda 4 fynd 1.
ANALYSERBAR_ERE='\.(js|jsx|mjs|es6?|cjs|ts|tsx|mts|cts|vue|htm|html|xhtm|xhtml)$'
# actions-språket (§ ANALYSERBARHET ovan) — `**/action.yml`/`**/action.yaml`
# VAR SOM HELST i trädet, inte bara under .github/workflows/ (som aldrig är
# D0 i första hand).
ACTIONS_FIL_ERE='(^|/)action\.ya?ml$'

if [[ ! -f "${POLICY_FIL}" ]]; then
    echo "❌ policy-fil saknas: ${POLICY_FIL}" >&2
    echo "   Grinden vägrar gissa vilka undantag som är avsiktliga." >&2
    exit 2
fi
# shellcheck source=/dev/null
. "${POLICY_FIL}"
CODEQL_D0_UNDANTAG="${CODEQL_D0_UNDANTAG-}"

if [[ ! -f "${WORKFLOW_FIL}" ]]; then
    echo "❌ ${WORKFLOW_FIL} saknas" >&2
    exit 2
fi
if ! grep -qF -- "${START_MARK}" "${WORKFLOW_FIL}"; then
    echo "❌ start-markören saknas i ${WORKFLOW_FIL}" >&2
    echo "   Sökte: ${START_MARK}" >&2
    exit 2
fi
if ! grep -qF -- "${SLUT_MARK}" "${WORKFLOW_FIL}"; then
    echo "❌ slut-markören saknas i ${WORKFLOW_FIL}" >&2
    echo "   Sökte: ${SLUT_MARK}" >&2
    exit 2
fi

# ─── Extrahera D0-globs live ur workflow-filen ──────────────────────────────
# TASK-471: FORMAT-AGNOSTISK rad-tolkning — grinden konsumerar nu TVÅ olika
# skrivsätt för SAMMA lista (§ TVÅ KONSUMENTER, filhuvudet):
#
#   codeql.yml (klassning-codeql-d0): en YAML-LISTA, en citerad post per rad
#     - '**/*.md'
#     - 'docs/**'
#
#   ci.yml (klassning-d0): en tj-actions/changed-files `files: |`-block-
#   scalar — OCITERADE rader, plus NIO `!`-negerade rader som INTE hör till
#   den positiva mängden (package.json m.fl., aldrig under en D0-katalog i
#   dag — se ci.yml:s egen kommentar vid blocket för varför de ändå står
#   kvar där):
#     files: |
#       **/*.md
#       docs/**
#       !package.json
#
# Den GAMLA extraktionen (`grep -oE "'[^']+'"`) gav NOLL träffar på den andra
# formen — en tolkare byggd för EN form missar den ANDRA TYST, samma
# § ANALYSERBARHET-disciplin som redan gäller HTML-familjen: FORMEN avgör,
# aldrig ett antagande om vilken fil som läses.
#
# Regel, per rad efter `read`s standard-trimning (leading/trailing IFS-
# whitespace bort, ingen `IFS=` här — till skillnad från undantags-loopen
# nedan, som MÅSTE bevara mellanslag i skäl-texten):
#   tom rad                       → ignorerad
#   exakt "files: |"              → ignorerad (block-scalar-inledaren, ligger
#                                    INNANFÖR markörerna i ci.yml men är
#                                    aldrig en sökväg)
#   börjar med "!"                → ignorerad (negation, ej positiv mängd)
#   börjar med "- "                → "- "-prefixet stripas (YAML-listform)
#   omgärdas av raka citattecken   → citattecknen stripas
# Kvar står bara glob-strängen, oavsett ursprungsform. Körd mot codeql.yml:s
# citerade form ger detta IDENTISKT utfall som den gamla extraktionen (regel
# 5 ensam återskapar `grep -oE "'[^']+'" | tr -d "'"`).
#
# ═══ ÖVERLAPPET — BESLUT, UTTRYCKLIGT (TASK-464.4) ═══
# En `!`-negerad rad HOPPAS HELT — den appliceras ALDRIG som en exkludering
# mot de positiva globerna (till skillnad från vad tj-actions/changed-files
# faktiskt gör vid körtid). Skulle en negations sökväg någon dag FALLA
# INNANFÖR en positiv globs träd (i dag gör ingen av ci.yml:s nio negationer
# det — samtliga ligger på repo-roten, aldrig under docs/**, tasks/** eller
# .claude/**), räknas den filen ÄNDÅ som en träff av `git ls-files` nedan.
# Det är en SÄKER superset, aldrig en lucka: ci.yml:s VERKLIGA
# `should_skip_tests` skulle klassa en sådan fil som KOD (negationen gäller
# där, på riktigt) och köra full svit på den — grinden här blir bara
# STRÄNGARE än nödvändigt (kräver en deklaration för en fil som aldrig
# faktiskt hade landat i D0), aldrig SLAPPARE. Tvåsidigt bevis:
# scripts/test-check-codeql-d0-kodfri.sh T20.
#
# ═══ MARKÖRMATCHNINGEN ÄR RADSTARTS-ANKRAD (TASK-464.4) ═══
# ci.yml:s EGEN `lint`-jobb skickar markörsträngarna en ANDRA gång längre
# ned i filen, som env-VÄRDEN till detta skripts CODEQL_D0_KODFRI_START_MARK/
# _SLUT_MARK (`CODEQL_D0_KODFRI_START_MARK='# paritet:start klassning-d0'`
# m.fl.) — en rad som INNEHÅLLER samma substräng utan att VARA markören. Ett
# `index($0, s)`-uttryck utan ankring hade träffat BÅDA formerna lika, och
# fungerade tidigare bara för att den RIKTIGA regionen (i `files: |`-blocket)
# kommer FÖRE env-raderna i filen — `f && index($0, e) { exit }` avslutar
# awk vid FÖRSTA träffen, så den andra förekomsten aldrig nås. En framtida
# omkastad jobbordning (env-raderna FÖRE `files: |`-blocket) hade tyst gett
# en GARBAGE-region. Matchningen ankras nu vid raden EFTER whitespace-
# trimning: `index(rad, s) == 1` kräver att markören är radens FÖRSTA
# tecken, inte bara EN substräng någonstans — en env-tilldelning som
# `CODEQL_D0_KODFRI_START_MARK='...'` börjar aldrig med `#`, så den kan
# aldrig matcha ankrat, oavsett var i filen den står. Tvåsidigt bevis:
# scripts/test-check-codeql-d0-kodfri.sh T21 (den falska formen FÖRE den
# riktiga regionen i filen — ankrad matchning hittar ändå rätt region;
# ett oankrat `index()` hade fallit på detta scenario).
RAW_RADER="$(awk -v s="${START_MARK}" -v e="${SLUT_MARK}" '
    {
        rad = $0
        sub(/^[ \t]+/, "", rad)
    }
    !f && index(rad, s) == 1 { f = 1; next }
    f && index(rad, e) == 1  { exit }
    f                        { print }
' "${WORKFLOW_FIL}")"

GLOB_ARGS=()
while read -r rad; do
    [[ -z "${rad}" ]] && continue
    [[ "${rad}" == "files: |" ]] && continue
    [[ "${rad}" == "!"* ]] && continue
    rad="${rad#- }"
    rad="${rad#\'}"
    rad="${rad%\'}"
    [[ -z "${rad}" ]] && continue
    GLOB_ARGS+=("${rad}")
done <<< "${RAW_RADER}"

if [[ "${#GLOB_ARGS[@]}" -eq 0 ]]; then
    echo "❌ NOLL globs extraherade ur ${WORKFLOW_FIL} — grinden läser inget" >&2
    exit 2
fi

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
# Union av JS/TS/HTML-familjen och actions-språkets action.yml/action.yaml
# — grep -E med `|` ger varje matchande rad EN gång, ingen dubbelräkning
# även om en fil (aldrig i praktiken) skulle matcha båda mönstren.
TRAFFAR="$(printf '%s\n' "${ALLA_D0_FILER}" | grep -E "${ANALYSERBAR_ERE}|${ACTIONS_FIL_ERE}" || true)"

EXIT_CODE=0
antal_traffar=0
antal_odeklarerade=0
antal_deklarerade=0
SEDDA_FILER=""

while IFS= read -r fil; do
    [[ -z "${fil}" ]] && continue

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
    echo "✅ codeql-d0-kodfri: ${antal_traffar} analyserbara filer under D0 (js/ts/html-familjen + actions), ${antal_deklarerade} deklarerade undantag, 0 odeklarerade."
else
    echo "${antal_odeklarerade} odeklarerad(e), ${antal_obehovliga} obehövlig(a) undantag."
fi

exit "${EXIT_CODE}"
