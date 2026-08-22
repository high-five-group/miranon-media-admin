#!/usr/bin/env bash
# scripts/test-deny-facit-godkand-skrivning.sh
#
# Tvåsidig empirisk testsvit för scripts/deny-facit-godkand-skrivning.sh
# (ADR-104 § Beslut 2, TASK-167). Samma familjeform som
# scripts/test-deny-arbetsform-push.sh (hook_json-byggare, run_case med
# EXPECT_OUT/NOT_EXPECT_OUT, PATH_NO_<verktyg>-tekniken för fail-open-prov).
#
#   ED1–ED3  Edit NEKAS: new_string sätter "godkand" till ett objekt, en
#            sträng, ELLER new_string ensam avslöjar försöket även när
#            old_string inte matchar filens nuvarande innehåll (den breda
#            reservregeln i facit-godkand-skrivning.mjs).
#   ED4–WD3  NEKA-SKÄLETS DIAGNOSTIK (ADR-102 § Updates 2026-08-22): mot ett
#            REDAN stämplat manifest ska skälet namnge den verkliga regeln
#            ("manifestet är STÄMPLAT", agent-fruset i sin helhet) och peka
#            ut sidofilen — inte den gamla, i det läget FALSKA texten om att
#            skrivningen skulle sätta "godkand". Verdiktet är oförändrat
#            (exit 2); ED1–ED3/WD1–WD2 bevisar att den gamla texten står kvar
#            där den är sann.
#   EA1–EA3  Edit SLÄPPER: orelaterad nyckel redigeras (ytor-tillägg),
#            "godkand": null skrivs EXPLICIT (initial-skapelse-formen),
#            filen är INTE ett facit-manifest alls (scopning).
#   WD1–WD2  Write NEKAS: fullständigt innehåll med icke-null "godkand"
#            (objekt-form, sträng-form).
#   WA1–WA2  Write SLÄPPER: fullständigt innehåll med "godkand": null
#            (den legitima initial-skapelsen agenten GÖR i slutet av ett
#            prototyp-pass), fil utanför manifest-mönstret.
#   BD1–BD5  Bash NEKAS: `npm run facit:godkann` DIREKT (kanal A, den
#            farligaste bypass-vägen — skriptet skriver fältet korrekt
#            formaterat, ingen heredoc-heuristik hade fångat den), `node
#            scripts/facit-godkann.mjs` direkt (kanal A, samma skäl),
#            redirect (kanal B), heredoc+redirect (kanal B), `sed -i`
#            (kanal B).
#   BD6–BD7  Bash NEKAS, KEDJADE FORMER (TASK-168 — segmenteringen får
#            INTE försvaga skyddet): kanal A efter `&&`, kanal B efter `&&`
#            med redirect-mål = manifestet.
#   BA1–BA4  Bash SLÄPPER: läsning utan skriv-vektor, "godkand" nämnt utan
#            manifest-sökväg, manifest-sökväg + redirect utan "godkand",
#            ett helt orelaterat kommando.
#   BA5–BA11 Bash SLÄPPER, TASK-168:s FEM MÄTTA FALSK-POSITIVA KLASSER
#            (kortets Description + notes, 2026-08-08/09) + en direkt
#            regressionsbevisning av Kanal B:s mål-isolering:
#              BA5  klass 2 — grep NÄMNER skriptets filnamn (läser, kör inte)
#              BA6  klass 2 — `git add` NÄMNER skriptet + dess testsvit
#              BA7  klass 3 — kör facit-godkann.mjs:s EGEN testsvit
#                   (`node scripts/test-facit-godkann.mjs`; "test-" + namnet
#                   RÅKAR sluta på skriptnamnet — suffix-fällan den gamla
#                   substräng-matchningen gick i)
#              BA8  klass 1 — python3-heredoc som bara LÄSER manifestet
#                   (`open()`, ingen egen skriv-operation i segmentet)
#              BA9  klass 4 — `backlog task create -d "..."` vars
#                   payload-TEXT nämner stämplingskommandot
#              BA10 klass 5 — `backlog task edit --append-notes "..."` vars
#                   notes-TEXT nämner skriptets filnamn
#              BA11 regression — manifestet NÄMNS (grep-mål) OCH "godkand"
#                   nämns OCH kommandot har en redirect, men redirect-MÅLET
#                   är en ANNAN fil — bevisar att Kanal B nu kräver att
#                   MÅLET är manifestet, inte bara att båda förekommer
#                   någonstans i kommandot
#   F1–F8    FAIL-OPEN (medvetet, oscopat — se hookens § FAIL-OPEN):
#            jq saknas, node saknas, tom stdin, trasig JSON, tool_name
#            saknas, tool_name utanför {Edit,Write,Bash}, policyn saknas,
#            policyn saknar de TVÅ NYA TASK-168-variablerna (finns men
#            ofullständig). SAMTLIGA prövas med ett i övrigt NEKANDE
#            kommando/innehåll — om hooken släpper HÄR är den garanterat
#            fail-open i det svagare fallet också.
#   E1       Exit-koden på en deny-väg är EXAKT 2.
#
# Test-isolering: TEST_DIR är en /tmp-sandlåda med KOPIOR av hooken, dess
# node-helper och en fixturpolicy — rör aldrig det verkliga repots
# .facit-policy.conf eller facit-manifest. Ingen nätverkstrafik.
#
# Användning: bash scripts/test-deny-facit-godkand-skrivning.sh
# Exit 0 om alla testfall passerar, 1 annars.
#
# Källa: TASK-167 · scripts/deny-facit-godkand-skrivning.sh ·
#        scripts/test-deny-arbetsform-push.sh (mönster-förebild)
# Etablerad: TASK-167, 2026-08-08

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/task167-test-deny-facit-godkand-skrivning"
SKRIPT_SRC="${REPO_ROOT}/scripts/deny-facit-godkand-skrivning.sh"
HELPER_SRC="${REPO_ROOT}/scripts/lib/facit-godkand-skrivning.mjs"

SKRIPT="${TEST_DIR}/scripts/deny-facit-godkand-skrivning.sh"
MANIFEST_REL="bilagor/test-pass/facit.json"
MANIFEST="${TEST_DIR}/${MANIFEST_REL}"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # anropas via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/scripts/lib"
    mkdir -p "${TEST_DIR}/bilagor/test-pass"
    cp "${SKRIPT_SRC}" "${SKRIPT}"
    chmod +x "${SKRIPT}"
    cp "${HELPER_SRC}" "${TEST_DIR}/scripts/lib/facit-godkand-skrivning.mjs"
    cat > "${TEST_DIR}/.facit-policy.conf" <<'CONF'
FACIT_BILAGE_ROT="bilagor"
FACIT_MANIFEST_NAMN="facit.json"
FACIT_GODKANN_NPM_SCRIPT="facit:godkann"
FACIT_GODKANN_SKRIPT_NAMN="facit-godkann.mjs"
CONF
    cat > "${MANIFEST}" <<'JSON'
{
  "prototyp": "test-pass",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "godkand": null,
  "ytor": [{ "yta": "x", "bilder": [], "kallor": ["src/x.tsx"] }]
}
JSON
}

# Byter fixturens manifest till ett STÄMPLAT (ADR-102 § Updates 2026-08-22).
# Driver ED4/WD3: skälet hooken ger ska då namnge den VERKLIGA regeln
# ("manifestet är stämplat och därmed fruset i sin helhet"), inte den gamla,
# missvisande texten om att skrivningen skulle sätta "godkand".
stampla_manifest() {
    cat > "${MANIFEST}" <<'JSON'
{
  "prototyp": "test-pass",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "godkand": { "av": "marcus", "datum": "2026-08-10", "citat": "Ser bra ut, godkänner", "sha": "abc1234" },
  "ytor": [{ "yta": "x", "bilder": [], "kallor": ["src/x.tsx"] }]
}
JSON
}

# PATH utan katalogen som äger en given binär (F-serien). Beräknas mot den
# FAKTISKA platsen — ingen hårdkodning av en specifik katalog. Skriver till
# en NAMNGIVEN utdata-variabel via `printf -v` (bash 3.1+, portabelt —
# `local -n`/nameref kräver bash 4.3+ och FAILAR på macOS systembash 3.2,
# mätt i denna byggsession) i stället för att returneras via command
# substitution i anropsstället, vilket SC2312 varnar för.
path_utan() {
    local malvar="$1" bin="$2" bin_path bin_dir out="" seg segs
    bin_path="$(command -v "${bin}")"
    bin_dir="$(dirname "${bin_path}")"
    IFS=':' read -r -a segs <<< "${PATH}"
    for seg in "${segs[@]}"; do
        [[ "${seg}" == "${bin_dir}" ]] && continue
        out="${out:+${out}:}${seg}"
    done
    printf -v "${malvar}" '%s' "${out}"
}

# hook_json_edit <file_path> <old_string> <new_string> [replace_all]
hook_json_edit() {
    local fp="$1" old="$2" new="$3" ra="${4:-false}"
    jq -nc --arg fp "${fp}" --arg old "${old}" --arg new "${new}" --argjson ra "${ra}" \
        '{tool_name:"Edit", tool_input:{file_path:$fp, old_string:$old, new_string:$new, replace_all:$ra}}'
}

# hook_json_write <file_path> <content>
hook_json_write() {
    local fp="$1" content="$2"
    jq -nc --arg fp "${fp}" --arg c "${content}" \
        '{tool_name:"Write", tool_input:{file_path:$fp, content:$c}}'
}

# hook_json_bash <command>
hook_json_bash() {
    local cmd="$1"
    jq -nc --arg cmd "${cmd}" '{tool_name:"Bash", tool_input:{command:$cmd}}'
}

# hook_json_other <tool_name>
hook_json_other() {
    local tn="$1"
    jq -nc --arg tn "${tn}" '{tool_name:$tn, tool_input:{file_path:"/tmp/x"}}'
}

EXPECT_OUT=""
NOT_EXPECT_OUT=""

# run_case <namn> <väntad exit> <json> [env-tilldelningar...]
run_case() {
    local name="$1" want="$2" json="$3"
    shift 3
    local got expect="${EXPECT_OUT}" nexpect="${NOT_EXPECT_OUT}"
    EXPECT_OUT=""
    NOT_EXPECT_OUT=""
    (cd "${TEST_DIR}" && printf '%s' "${json}" | env "$@" bash "${SKRIPT}") > "${TEST_DIR}/out.txt" 2>&1
    got=$?

    if [[ "${got}" -ne "${want}" ]]; then
        printf '  ✗ %s — exit %s, väntade %s\n' "${name}" "${got}" "${want}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$((FAILED + 1))
        return
    fi
    if [[ -n "${expect}" ]] && ! grep -qF -- "${expect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan saknade "%s"\n' "${name}" "${expect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$((FAILED + 1))
        return
    fi
    if [[ -n "${nexpect}" ]] && grep -qF -- "${nexpect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan innehöll oväntat "%s"\n' "${name}" "${nexpect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$((FAILED + 1))
        return
    fi
    printf '  ✓ %s\n' "${name}"
    PASSED=$((PASSED + 1))
}

setup
printf 'test-deny-facit-godkand-skrivning: kör testsvit mot %s\n\n' "${SKRIPT_SRC}"

# ============================================================
# ED1–ED3 — Edit NEKAS.
JSON="$(hook_json_edit "${MANIFEST_REL}" '"godkand": null' '"godkand": { "av": "agent", "datum": "2026-08-08", "citat": "jag godkänner mig själv", "sha": "fusk" }')"
EXPECT_OUT="skulle sätta"
run_case "ED1  Edit sätter godkand till objekt NEKAS" 2 "${JSON}"

JSON="$(hook_json_edit "${MANIFEST_REL}" '"godkand": null' '"godkand": "2026-08-08"')"
EXPECT_OUT="skulle sätta"
run_case "ED2  Edit sätter godkand till sträng NEKAS" 2 "${JSON}"

# old_string matchar INTE filens innehåll (simulerar t.ex. läsfel) — men
# new_string AVSLÖJAR ändå försöket. Den breda reservregeln (§ HELLRE FÖR
# BRETT i facit-godkand-skrivning.mjs) ska fånga detta.
JSON="$(hook_json_edit "${MANIFEST_REL}" 'något som inte finns i filen' '"godkand": { "av": "agent" }')"
EXPECT_OUT="skulle sätta"
run_case "ED3  Edit där old_string inte matchar filen, new_string avslöjar försöket, NEKAS" 2 "${JSON}"

# ── ED4/WD3 — NEKA-SKÄLETS DIAGNOSTIK (ADR-102 § Updates 2026-08-22) ──────
# Verdiktet är oförändrat (exit 2). Det som prövas är att SKÄLET namnger den
# verkliga regeln. Tvåsidigt i BÅDA riktningar: ED1–ED3/WD1–WD2 ovan bevisar
# att den gamla texten står kvar där den är SANN (ostämplat manifest, och
# skrivningen sätter faktiskt fältet); ED4/WD3 bevisar att den bytts där den
# var FALSK. NOT_EXPECT_OUT gör det till ett äkta par: fanns bara EXPECT_OUT
# hade en text som sade BÅDA sakerna passerat.
echo ""
stampla_manifest
JSON="$(hook_json_edit "${MANIFEST_REL}" '"yta": "x"' '"yta": "y"')"
EXPECT_OUT="är STÄMPLAT"
NOT_EXPECT_OUT="skulle sätta"
run_case "ED4  Edit av ORELATERAD nyckel i STÄMPLAT manifest nekas — skälet namnger frysningen" 2 "${JSON}"

JSON="$(hook_json_edit "${MANIFEST_REL}" '"yta": "x"' '"yta": "y"')"
EXPECT_OUT="AMENDERING-"
run_case "ED4b Samma skäl pekar ut sidofilen som väg framåt" 2 "${JSON}"

FULLT_STAMPLAT='{"prototyp":"test-pass","last":"2026-08-06","lasning":"x","godkand":{"av":"marcus","datum":"2026-08-10","citat":"c","sha":"abc"},"ytor":[]}'
JSON="$(hook_json_write "${MANIFEST_REL}" "${FULLT_STAMPLAT}")"
EXPECT_OUT="är STÄMPLAT"
NOT_EXPECT_OUT="skulle sätta"
run_case "WD3  Write mot ett REDAN stämplat manifest — skälet namnger frysningen" 2 "${JSON}"
setup

# ============================================================
# EA1–EA3 — Edit SLÄPPER.
echo ""
JSON="$(hook_json_edit "${MANIFEST_REL}" '"ytor": [{ "yta": "x", "bilder": [], "kallor": ["src/x.tsx"] }]' '"ytor": [{ "yta": "x", "bilder": ["facit-x.png"], "kallor": ["src/x.tsx"] }]')"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "EA1  Edit av orelaterad nyckel (ytor) SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_edit "${MANIFEST_REL}" 'lasning": "Lås som facit."' 'lasning": "Lås som facit.",\n  "godkand": null')"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "EA2  Edit som skriver \"godkand\": null explicit (initial-skapelse) SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_edit "src/nagot-annat.ts" 'x' '"godkand": { "av": "agent" }')"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "EA3  Edit mot fil UTANFÖR manifest-mönstret SLÄPPS (scopning)" 0 "${JSON}"

# ============================================================
# WD1–WD2 — Write NEKAS.
echo ""
FULLT_ICKE_NULL='{
  "prototyp": "test-pass",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "godkand": { "av": "agent", "datum": "2026-08-08", "citat": "fusk", "sha": "abc" },
  "ytor": []
}'
JSON="$(hook_json_write "${MANIFEST_REL}" "${FULLT_ICKE_NULL}")"
EXPECT_OUT="skulle sätta"
run_case "WD1  Write med fullständigt icke-null godkand (objekt) NEKAS" 2 "${JSON}"

FULLT_STRANG='{"prototyp":"t","last":"2026-08-06","lasning":"x","godkand":"2026-08-08","ytor":[]}'
JSON="$(hook_json_write "${MANIFEST_REL}" "${FULLT_STRANG}")"
EXPECT_OUT="skulle sätta"
run_case "WD2  Write med godkand som sträng (gamla schemat) NEKAS" 2 "${JSON}"

# ============================================================
# WA1–WA2 — Write SLÄPPER.
echo ""
FULLT_NULL='{
  "prototyp": "test-pass",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "godkand": null,
  "ytor": [{ "yta": "x", "bilder": [], "kallor": ["src/x.tsx"] }]
}'
JSON="$(hook_json_write "${MANIFEST_REL}" "${FULLT_NULL}")"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "WA1  Write med godkand: null (legitim initial-skapelse) SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_write "src/nagot-annat.ts" "${FULLT_ICKE_NULL}")"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "WA2  Write mot fil UTANFÖR manifest-mönstret SLÄPPS trots innehållet (scopning)" 0 "${JSON}"

# ============================================================
# BD1–BD5 — Bash NEKAS.
echo ""
JSON="$(hook_json_bash 'npm run facit:godkann -- --pass test-pass --citat "jag godkänner mig själv"')"
EXPECT_OUT="stämplingskanal"
run_case "BD1  Bash kör 'npm run facit:godkann' DIREKT NEKAS (kanal A)" 2 "${JSON}"

JSON="$(hook_json_bash 'node scripts/facit-godkann.mjs --pass test-pass --citat fusk')"
EXPECT_OUT="stämplingskanal"
run_case "BD2  Bash kör 'node scripts/facit-godkann.mjs' DIREKT NEKAS (kanal A)" 2 "${JSON}"

JSON="$(hook_json_bash "echo '{\"godkand\":\"2026-08-08\"}' >> ${MANIFEST_REL}")"
EXPECT_OUT="MOT ett facit-manifest"
run_case "BD3  Bash-redirect mot manifestet som nämner godkand NEKAS (kanal B)" 2 "${JSON}"

JSON="$(hook_json_bash "cat <<EOF > ${MANIFEST_REL}
{\"godkand\": {\"av\": \"agent\"}}
EOF")"
EXPECT_OUT="MOT ett facit-manifest"
run_case "BD4  Bash-heredoc+redirect mot manifestet som nämner godkand NEKAS (kanal B)" 2 "${JSON}"

JSON="$(hook_json_bash "sed -i 's/\"godkand\": null/\"godkand\": {}/' ${MANIFEST_REL}")"
EXPECT_OUT="MOT ett facit-manifest"
run_case "BD5  Bash 'sed -i' mot manifestet som nämner godkand NEKAS (kanal B)" 2 "${JSON}"

# ============================================================
# BD6–BD7 — Bash NEKAS, KEDJADE FORMER (TASK-168: segmenteringen får INTE
# försvaga skyddet jämfört med den gamla fria substräng-matchningen).
echo ""
JSON="$(hook_json_bash 'echo hej && npm run facit:godkann -- --pass test-pass --citat fusk')"
EXPECT_OUT="stämplingskanal"
run_case "BD6  kanal A EFTER && i en kedja NEKAS (segmenteringen tappar inte skyddet)" 2 "${JSON}"

JSON="$(hook_json_bash "ls scripts/ && echo '{\"godkand\":\"2026-08-08\"}' >> ${MANIFEST_REL}")"
EXPECT_OUT="MOT ett facit-manifest"
run_case "BD7  kanal B EFTER && i en kedja NEKAS (redirect-mål = manifestet)" 2 "${JSON}"

# ============================================================
# BA1–BA4 — Bash SLÄPPER. Den viktigaste halvan — falsklarm kostar
# friktion på VARJE läsning av ett facit-manifest.
echo ""
JSON="$(hook_json_bash "cat ${MANIFEST_REL} | grep godkand")"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "BA1  läsning UTAN skriv-vektor SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_bash 'echo "jag ska godkanna det senare"')"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "BA2  \"godkand\" nämnt utan manifest-sökväg SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_bash "echo 'ny yta' >> ${MANIFEST_REL}")"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "BA3  manifest-sökväg + redirect UTAN \"godkand\" SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_bash 'npm run typecheck')"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "BA4  helt orelaterat kommando SLÄPPS" 0 "${JSON}"

# ============================================================
# BA5–BA11 — Bash SLÄPPER, TASK-168:s FEM MÄTTA FALSK-POSITIVA KLASSER +
# en direkt regressionsbevisning av Kanal B:s mål-isolering. Se skriptets
# eget huvud för klass-till-testfall-kartan.
echo ""
JSON="$(hook_json_bash "grep -n 'facit-godkann.mjs' scripts/deny-facit-godkand-skrivning.sh")"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "BA5  klass 2: grep NÄMNER skriptets filnamn (läser, kör inte) SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_bash 'git add scripts/facit-godkann.mjs scripts/test-facit-godkann.mjs')"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "BA6  klass 2: 'git add' NÄMNER skriptet + dess testsvit SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_bash 'node scripts/test-facit-godkann.mjs')"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "BA7  klass 3: kör facit-godkann.mjs:s EGEN testsvit SLÄPPS (suffix-fällan)" 0 "${JSON}"

JSON="$(hook_json_bash "python3 <<'PYEOF'
import json
d = json.load(open('${MANIFEST_REL}'))
print(d['godkand'])
PYEOF")"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "BA8  klass 1: python3-heredoc som bara LÄSER manifestet SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_bash 'npx backlog task create "Titel" -d "Kör npm run facit:godkann för att godkänna passet"')"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "BA9  klass 4: 'task create -d' vars TEXT nämner stämplingskommandot SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_bash "npx backlog task edit 168 --append-notes 'Se scripts/facit-godkann.mjs för detaljer'")"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "BA10 klass 5: 'task edit --append-notes' vars TEXT nämner filnamnet SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_bash "grep godkand ${MANIFEST_REL} > /tmp/kopia-168.txt")"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "BA11 regression: manifest+godkand nämnda, men redirect-MÅLET är EN ANNAN fil SLÄPPS" 0 "${JSON}"

# ============================================================
# F1–F8 — FAIL-OPEN (medvetet, oscopat — se hookens § FAIL-OPEN).
# Samtliga prövas med ett i övrigt NEKANDE kommando.
echo ""
DENY_JSON="$(hook_json_bash 'npm run facit:godkann -- --pass test-pass --citat fusk')"
PATH_UTAN_JQ=""
PATH_UTAN_NODE=""
path_utan PATH_UTAN_JQ jq
path_utan PATH_UTAN_NODE node

NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "F1  fail-open: jq saknas i PATH SLÄPPS trots nekande kommando" 0 "${DENY_JSON}" \
    "PATH=${PATH_UTAN_JQ}"

NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "F2  fail-open: node saknas i PATH SLÄPPS trots nekande kommando" 0 "${DENY_JSON}" \
    "PATH=${PATH_UTAN_NODE}"

NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "F3  fail-open: tom stdin SLÄPPS" 0 ""

NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "F4  fail-open: trasig JSON på stdin SLÄPPS" 0 '{"tool_name": detta är inte json'

JSON='{"tool_input":{"command":"npm run facit:godkann -- --pass test-pass --citat fusk"}}'
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "F5  fail-open: tool_name saknas SLÄPPS" 0 "${JSON}"

JSON="$(hook_json_other "Read")"
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "F6  tool_name utanför {Edit,Write,Bash} (Read) SLÄPPS" 0 "${JSON}"

NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "F7  fail-open: policyn saknas HELT SLÄPPS trots nekande kommando" 0 "${DENY_JSON}" \
    "FACIT_GODKANN_POLICY=/finns/inte/.facit-policy.conf"

# F8 — policyn FINNS men saknar de TVÅ NYA TASK-168-variablerna (t.ex. en
# ouppdaterad policy-fil kvarlämnad från före denna fix). En egen,
# ofullständig policy-fixtur skrivs bredvid den normala.
OFULLSTANDIG_POLICY="${TEST_DIR}/.facit-policy-ofullstandig.conf"
cat > "${OFULLSTANDIG_POLICY}" <<'CONF'
FACIT_BILAGE_ROT="bilagor"
FACIT_MANIFEST_NAMN="facit.json"
CONF
NOT_EXPECT_OUT="FACIT-GODKÄNNANDETS"
run_case "F8  fail-open: policyn saknar FACIT_GODKANN_*-variablerna SLÄPPS trots nekande kommando" 0 "${DENY_JSON}" \
    "FACIT_GODKANN_POLICY=${OFULLSTANDIG_POLICY}"

# ============================================================
# E1 — exit-koden på en deny-väg är EXAKT 2.
echo ""
(cd "${TEST_DIR}" && printf '%s' "${DENY_JSON}" | bash "${SKRIPT}") > /dev/null 2>&1
E1_EXIT=$?
if [[ "${E1_EXIT}" -eq 2 ]]; then
    printf '  ✓ E1  deny-vägens exit-kod är EXAKT 2 (Claude Codes enda garanterat blockerande kod)\n'
    PASSED=$((PASSED + 1))
else
    printf '  ✗ E1  deny-vägen gav exit %s, inte 2\n' "${E1_EXIT}"
    FAILED=$((FAILED + 1))
fi

printf '\ntest-deny-facit-godkand-skrivning: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
