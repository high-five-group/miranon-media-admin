#!/usr/bin/env bash
#
# SC2312 varnar för att $(run_exit) maskerar kommandots returvärde. Den är
# falsk-positiv här MED AVSIKT: run_exit() fångar redan check-facit.sh:s
# exitkod och echo:ar den som DATA, så substitutionens egen returkod saknar
# betydelse — det är hela poängen med formen. Fil-nivå (måste stå före första
# kommandot) i stället för nio spridda rad-direktiv. Precedent för disable-
# formen: arkivera-sessionsdok.sh:296.
# shellcheck disable=SC2312
#
# scripts/test-check-facit.sh
#
# Empirisk test-suite för scripts/check-facit.sh (ADR-102-grind) OCH för
# scripts/lib/facit-validera.mjs:s "godkand"-schemavalidering (ADR-104 §
# Beslut 2, TASK-167 — schemat bytte från bar sträng till objektet
# { av, datum, citat, sha, undantag? }).
# 36 testfall, TVÅSIDIGA: varje invariant prövas både i sitt gröna och sitt
# röda läge. En grind som bara bevisats grön är inte bevisad — den kan vara
# blind (L43, ADR-039 § lesson→grind).
#
#   T1  rent manifest                                    → 0
#   T2  facit-bild utan manifest            (invariant a) → 1
#   T3  deklarerad bild saknas på disk      (invariant b) → 1
#   T4  föräldralös facit-bild              (invariant b) → 1
#   T5  yta saknar nyckeln "bilder"         (R5)          → 1
#   T6  toppnivåns "godkand" saknas         (B3)          → 1
#   T7  tom bilder[] = deklarerad frånvaro  (R5, grön)    → 0
#   T8  proto-markör riven, godkand null    (B3, röd)     → 1
#   T9  proto-markör riven, godkand SATT (objektschema,
#       ADR-104)                            (B3, grön)    → 0
#   T10 config saknas                                     → 3
#   T11 trasig JSON                                       → 1
#   T12 godkand som bar sträng (GAMLA schemat, ADR-104
#       river stödet)                       (schema)      → 1
#   T13 godkand-objekt saknar "av"           (schema)      → 1
#   T14 godkand.datum inte ISO-format        (schema)      → 1
#   T15 godkand-objekt fullständigt + undantag[] (schema,
#       grön)                                              → 0
#   T16 godkand.undantag[].skal saknas       (schema)      → 1
#   T17 stämplat facit, referens oförändrad  (inv. d, grön)→ 0
#   T18 stämplat facit, referens ändrad      (inv. d, röd) → 1
#   T19 OGODKÄNT facit, SAMMA ändring        (klass a, grön)→ 0
#   T20 deklarerad referens saknas på disk   (inv. d)      → 1
#   T21 referenser[].sha256 i fel format     (schema)      → 1
#   T22 tom referenser[] = deklarerad frånvaro (grön)      → 0
#   T23 sidofil bokför ändringen med rätt hash (klass b)   → 0
#   T24 sidofil namnger filen men INTE dess hash           → 1
#   T25 "amendering" som JSON-nyckel i manifestet          → 1
#   T26 sidofil med fel namnform                           → 1
#   T27 sidofil utan kanonisk rubrik                       → 1
#   T28 prosa-sidofil utan hashar (precedentformen, grön)  → 0
#   T29 stämplat facit, källan RIVEN efter stämpeln
#       (invariant b:s rivnings-klausul, grön)             → 0
#   T30 OGODKÄNT facit, SAMMA rivning av SAMMA fil
#       (klausulens gräns, röd)                            → 1
#   T31 stämplat facit, källan fanns ALDRIG i stämpel-
#       trädet (trasig källhänvisning, röd)                → 1
#   T32 stämplat facit, stämpel-commiten går inte att slå
#       upp lokalt (fail-closed, röd)                      → 1
#   T33 STÄMPLAD yta UTAN referenser-nyckeln → WARN,
#       räkning "1 av 1"                     (inv. d-täckning) → 0
#   T34 stämplad yta MED referenser → INGEN WARN               → 0
#   T35 samma som T33 men omkopplaren AV → INGEN WARN          → 0
#   T36 OGODKÄND yta utan referenser → INGEN WARN              → 0
#
# T33–T36 BÄR TÄCKNINGSVARNINGEN (TASK-309.31, ADR-102 § Updates 2026-08-28).
# Tre negativa fall mot ett positivt, med avsikt: en varning som alltid skriks
# är exakt lika oanvändbar som en som aldrig hörs — den drunknar, och nästa
# läsare filtrerar bort hela klassen. De tre gränserna som måste hålla är
# därför NYCKELN (T34), OMKOPPLAREN (T35) och STÄMPELN (T36). Just T36 är den
# som lätt byggs fel: ett ogodkänt manifest SKA deklarera "referenser" i samma
# landning som det skapas, men innehållslåset gäller först efter stämpeln —
# varnade grinden där vore den brus under hela promoveringsarbetet.
# ALLA FYRA ÄR GRÖNA (exit 0). Det är hela poängen: varningen fäller aldrig.
#
# T18/T19 ÄR PARET SOM BÄR HELA INVARIANT (d): samma ändring av samma
# referens, en gång stämplat (röd) och en gång ogodkänt (grön). Utan BÅDA
# bevisar sviten bara att grinden kan säga nej — inte att den säger nej på
# rätt sida av gränsen. Gränsen är den S109 fick dra med omdöme två gånger
# på ett dygn (#1715 stoppad, #1730 armerad).
#
# T29/T30 ÄR SAMMA PAR FÖR RIVNINGS-KLAUSULEN: samma borttagna fil, en gång
# stämplad (grön — rivningen är ADR-103 B2 steg 4) och en gång ogodkänd (röd
# — rivning före stämpeln är exakt det ADR-102 B3 förbjuder). T31 är det som
# skiljer klausulen från en form-regel: en sökväg som ALDRIG funnits fäller,
# också när den ser ut som prototyp-substrat. T32 bevisar fail-closed —
# grinden gissar aldrig åt det tillåtande hållet när den inte kan titta efter.
#
# Test-isolering: skapar /tmp/s93-test-facit/ med bilage-fixtur + src-fixtur.
# T29–T32 gör dessutom TEST_DIR till ett eget litet git-repo (klausulen
# härleder ur historiken och kan inte prövas utan en). Återställer (rm -rf)
# via trap. INGEN ändring av real-repo.
#
# Användning: bash scripts/test-check-facit.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/s93-test-facit"
GATE_SRC="${REPO_ROOT}/scripts/check-facit.sh"
LIB_SRC="${REPO_ROOT}/scripts/lib/facit-validera.mjs"

BILAGE="tasks/sessions/bilagor/s93-test-prototyp"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/scripts/lib"
    mkdir -p "${TEST_DIR}/${BILAGE}"
    mkdir -p "${TEST_DIR}/src/komponenter"
    cp "${GATE_SRC}" "${TEST_DIR}/scripts/check-facit.sh"
    cp "${LIB_SRC}" "${TEST_DIR}/scripts/lib/facit-validera.mjs"
    chmod +x "${TEST_DIR}/scripts/check-facit.sh"
    write_config
    write_kalla
    printf 'png\n' > "${TEST_DIR}/${BILAGE}/facit-yta.png"
}

write_config() {
    cat > "${TEST_DIR}/.facit-policy.conf" <<'CONF'
FACIT_BILAGE_ROT="tasks/sessions/bilagor"
FACIT_MANIFEST_NAMN="facit.json"
FACIT_BILD_GLOB="facit-*"
FACIT_PROTO_MARKORER=("protoAktiv")
FACIT_PROTO_SOKVAG="src"
CONF
}

# Källfilen som manifestets kallor[] pekar på, med prototyp-markören i.
write_kalla() {
    printf 'export const x = protoAktiv ? 1 : 2;\n' \
        > "${TEST_DIR}/src/komponenter/Yta.tsx"
}

# Källfilen UTAN markören — simulerar en rivning.
riv_markor() {
    printf 'export const x = 1;\n' > "${TEST_DIR}/src/komponenter/Yta.tsx"
}

# ── Fixtur för invariant (d): ytans MEKANISKA facit -----------------------
# En ariaSnapshot-referens (ADR-103 B4) med känt innehåll. sha256 räknas med
# node — samma väg som validerarens egen, och portabelt över macOS/Linux
# (shasum vs sha256sum är exakt den sortens skillnad som gör ett testfall
# grönt på en maskin och rött på en annan).
REFERENS="tests/visual/__aria__/prov.aria.yml"

skriv_referens() {
    mkdir -p "${TEST_DIR}/tests/visual/__aria__"
    printf -- '- searchbox "Sök person"\n- status\n' > "${TEST_DIR}/${REFERENS}"
}

# Ändrar referensens innehåll — simulerar en agent som regenererat en
# ariaSnapshot utan att röra manifestet.
andra_referens() {
    printf -- '- searchbox "Sök person"\n- navigation "Bokstäver"\n- status\n' \
        > "${TEST_DIR}/${REFERENS}"
}

sha_av_referens() {
    node -e "const{createHash}=require('node:crypto');const{readFileSync}=require('node:fs');process.stdout.write(createHash('sha256').update(readFileSync('${TEST_DIR}/${REFERENS}')).digest('hex'))"
}

# write_manifest_ref <godkand-json> <referenser-json>
# Samma fixtur som write_manifest men med ytans "referenser". Egen funktion i
# stället för fler positionsargument på write_manifest: de sexton befintliga
# anropen ska inte behöva röras.
write_manifest_ref() {
    local godkand=$1 referenser=$2
    cat > "${TEST_DIR}/${BILAGE}/facit.json" <<JSON
{
  "prototyp": "s93-test",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "godkand": ${godkand},
  "ytor": [
    {
      "yta": "yta",
      "bilder": ["facit-yta.png"],
      "kallor": ["src/komponenter/Yta.tsx"],
      "referenser": ${referenser}
    }
  ]
}
JSON
}

# write_manifest <godkand-json> <bilder-json> [extra-yta-json]
write_manifest() {
    local godkand=$1 bilder=$2
    cat > "${TEST_DIR}/${BILAGE}/facit.json" <<JSON
{
  "prototyp": "s93-test",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "godkand": ${godkand},
  "ytor": [
    {
      "yta": "yta",
      "bilder": ${bilder},
      "kallor": ["src/komponenter/Yta.tsx"]
    }
  ]
}
JSON
}

run_gate() {
    ( cd "${TEST_DIR}" && bash scripts/check-facit.sh 2>&1 )
}

run_exit() {
    ( cd "${TEST_DIR}" && bash scripts/check-facit.sh >/dev/null 2>&1 )
    echo $?
}

check_exit() {
    local label=$1 expected=$2 actual=$3
    if [[ "${actual}" = "${expected}" ]]; then
        echo "  ✅ ${label}: exit=${actual}"
        PASSED=$((PASSED + 1))
        return 0
    fi
    echo "  ❌ ${label}: exit=${actual} (förväntat ${expected})"
    FAILED=$((FAILED + 1))
    return 1
}

# check_utdata <label> <mönster> — fäller om mönstret INTE finns i utdatan.
# Skiljer "grinden föll" från "grinden föll av RÄTT skäl": en röd exitkod
# från fel invariant är ett falskt bevis.
check_utdata() {
    local label=$1 monster=$2 utdata
    utdata=$(run_gate)
    if grep -qE "${monster}" <<< "${utdata}"; then
        echo "  ✅ ${label}: utdatan nämner det förväntade skälet"
        PASSED=$((PASSED + 1))
        return 0
    fi
    echo "  ❌ ${label}: utdatan saknar mönstret '${monster}'"
    # shellcheck disable=SC2001  # sed på multi-line är klarast här
    echo "${utdata}" | sed 's/^/       /'
    FAILED=$((FAILED + 1))
    return 1
}

# check_utdata_saknas <label> <mönster> — spegelbilden av check_utdata: fäller
# om mönstret FINNS. Utan den kan en varnings-testrad bara bevisa att raden KAN
# skrivas, aldrig att den skrivs på rätt sida av gränsen — samma tvåsidighets-
# krav som T18/T19 bär för invariant (d) självt.
check_utdata_saknas() {
    local label=$1 monster=$2 utdata
    utdata=$(run_gate)
    if grep -qE "${monster}" <<< "${utdata}"; then
        echo "  ❌ ${label}: utdatan bär mönstret '''${monster}''' som INTE skulle finnas"
        # shellcheck disable=SC2001  # sed på multi-line är klarast här
        echo "${utdata}" | sed '''s/^/       /'''
        FAILED=$((FAILED + 1))
        return 1
    fi
    echo "  ✅ ${label}: utdatan saknar mönstret, som förväntat"
    PASSED=$((PASSED + 1))
    return 0
}

echo "=== test-check-facit.sh ==="

# --- T1: rent manifest ---------------------------------------------------
setup
write_manifest "null" '["facit-yta.png"]'
check_exit "T1 rent manifest" 0 "$(run_exit)"

# --- T2: facit-bild utan manifest (invariant a) --------------------------
setup
rm -f "${TEST_DIR}/${BILAGE}/facit.json"
check_exit "T2 facit-bild utan manifest" 1 "$(run_exit)"
check_utdata "T2 skäl" "saknar facit\.json"

# --- T3: deklarerad bild saknas på disk (invariant b) --------------------
setup
write_manifest "null" '["facit-saknas.png"]'
check_exit "T3 deklarerad bild saknas" 1 "$(run_exit)"
check_utdata "T3 skäl" "facit-saknas\.png"

# --- T4: föräldralös facit-bild (invariant b / R4) -----------------------
setup
write_manifest "null" '["facit-yta.png"]'
printf 'png\n' > "${TEST_DIR}/${BILAGE}/facit-odeklarerad.png"
check_exit "T4 föräldralös facit-bild" 1 "$(run_exit)"
check_utdata "T4 skäl" "facit-odeklarerad\.png"

# --- T5: yta saknar nyckeln "bilder" (R5) --------------------------------
setup
cat > "${TEST_DIR}/${BILAGE}/facit.json" <<'JSON'
{
  "prototyp": "s93-test",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "godkand": null,
  "ytor": [{ "yta": "yta", "kallor": ["src/komponenter/Yta.tsx"] }]
}
JSON
check_exit "T5 yta saknar bilder-nyckeln" 1 "$(run_exit)"
check_utdata "T5 skäl" "saknar nyckeln \"bilder\""

# --- T6: toppnivåns "godkand" saknas (B3) --------------------------------
setup
cat > "${TEST_DIR}/${BILAGE}/facit.json" <<'JSON'
{
  "prototyp": "s93-test",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "ytor": [
    { "yta": "yta", "bilder": ["facit-yta.png"], "kallor": ["src/komponenter/Yta.tsx"] }
  ]
}
JSON
check_exit "T6 godkand-nyckeln saknas" 1 "$(run_exit)"
check_utdata "T6 skäl" "nyckeln \"godkand\" saknas"

# --- T7: tom bilder[] = deklarerad frånvaro (R5, GRÖN sida) --------------
# Ytan har medvetet ingen låst facit-bild. Det ska INTE fälla — poängen är
# att frånvaron är deklarerad i stället för gissad.
setup
rm -f "${TEST_DIR}/${BILAGE}/facit-yta.png"
write_manifest "null" '[]'
check_exit "T7 tom bilder[] är deklarerad frånvaro" 0 "$(run_exit)"

# --- T8: proto-markör riven medan godkand=null (B3, RÖD) -----------------
setup
write_manifest "null" '["facit-yta.png"]'
riv_markor
check_exit "T8 rivning före godkännande" 1 "$(run_exit)"
check_utdata "T8 skäl" "rivs ALDRIG före Marcus godkännande"

# Ett STRUKTURELLT GILTIGT "godkand"-objekt (ADR-104 § Beslut 2, TASK-167)
# — återanvänds av T9 och T15.
GODKAND_OK='{"av":"marcus","datum":"2026-08-10","citat":"Jag är nöjd. Lås som facit.","sha":"abc1234def5678"}'

# --- T9: proto-markör riven men godkand satt (B3, GRÖN) ------------------
# Samma rivning som T8. Skillnaden är ENBART godkännandet — spärren ska
# släppa, annars vore den ett permanent hinder i stället för en ordning.
# godkand bär det NYA objektschemat (ADR-104) — den gamla bara-sträng-formen
# testas separat i T12, som ett RÖTT fall (schemat river medvetet stödet).
setup
write_manifest "${GODKAND_OK}" '["facit-yta.png"]'
riv_markor
check_exit "T9 rivning efter godkännande (objektschema)" 0 "$(run_exit)"

# --- T10: config saknas --------------------------------------------------
setup
write_manifest "null" '["facit-yta.png"]'
rm -f "${TEST_DIR}/.facit-policy.conf"
check_exit "T10 config saknas" 3 "$(run_exit)"

# --- T11: trasig JSON ----------------------------------------------------
setup
printf '{ detta är inte json\n' > "${TEST_DIR}/${BILAGE}/facit.json"
check_exit "T11 trasig JSON" 1 "$(run_exit)"
check_utdata "T11 skäl" "JSON"

# --- T12: godkand som bar sträng — GAMLA schemat, nu RÖTT (ADR-104) ------
# Fram till TASK-167 var en sträng ("2026-08-10") ett GILTIGT godkand-värde.
# ADR-104 byter schemat till ett objekt — denna testrad bevisar att det
# gamla formatet medvetet inte längre accepteras, inte att det glömdes bort.
setup
write_manifest '"2026-08-10"' '["facit-yta.png"]'
check_exit "T12 godkand som bar sträng (gamla schemat) NEKAS" 1 "$(run_exit)"
check_utdata "T12 skäl" "objekt.*av, datum, citat, sha"

# --- T13: godkand-objekt saknar "av" --------------------------------------
setup
write_manifest '{"datum":"2026-08-10","citat":"x","sha":"abc123"}' '["facit-yta.png"]'
check_exit "T13 godkand.av saknas" 1 "$(run_exit)"
check_utdata "T13 skäl" "godkand\.av"

# --- T14: godkand.datum är inte ISO-format --------------------------------
setup
write_manifest '{"av":"marcus","datum":"10 augusti 2026","citat":"x","sha":"abc123"}' '["facit-yta.png"]'
check_exit "T14 godkand.datum inte ISO-format" 1 "$(run_exit)"
check_utdata "T14 skäl" "godkand\.datum"

# --- T15: godkand-objekt fullständigt + undantag[] (GRÖN) -----------------
setup
write_manifest '{"av":"marcus","datum":"2026-08-10","citat":"Delvis nöjd.","sha":"abc123","undantag":[{"yta":"atgarder","skal":"körande prototyp är facit"}]}' '["facit-yta.png"]'
check_exit "T15 godkand-objekt med giltigt undantag[]" 0 "$(run_exit)"

# --- T16: godkand.undantag[].skal saknas ----------------------------------
setup
write_manifest '{"av":"marcus","datum":"2026-08-10","citat":"x","sha":"abc123","undantag":[{"yta":"atgarder"}]}' '["facit-yta.png"]'
check_exit "T16 godkand.undantag[].skal saknas" 1 "$(run_exit)"
check_utdata "T16 skäl" "undantag\[0\]\.skal"

# ═══ INVARIANT (d) — den stämplade formens innehållslås ═══════════════════
# ADR-102 § Updates 2026-08-22 (T157). Paret T18/T19 är kärnan: SAMMA
# ändring av SAMMA referens, en gång under ett stämplat facit (röd) och en
# gång under ett ogodkänt (grön). Det är precis den skillnad S109 fick
# avgöra med omdöme två gånger på ett dygn — #1715 stoppad, #1730 armerad —
# och som ingen grind kunde se då.

# skriv_amendering <filnamn> <kropp>
# Amenderings-SIDOFILEN — bokföringens kanoniska bärare (manifestet är
# agent-fruset så snart det är stämplat, ADR-104-hooken).
skriv_amendering() {
    local namn=$1 kropp=$2
    printf '%s\n' "${kropp}" > "${TEST_DIR}/${BILAGE}/${namn}"
}

# --- T17: stämplat facit, referensens sha256 stämmer (GRÖN) ---------------
setup
skriv_referens
write_manifest_ref "${GODKAND_OK}" "[{\"fil\":\"${REFERENS}\",\"sha256\":\"$(sha_av_referens)\"}]"
check_exit "T17 stämplat facit, referens oförändrad" 0 "$(run_exit)"

# --- T18: stämplat facit, referensen ändrad utan bokföring (RÖD) ----------
setup
skriv_referens
write_manifest_ref "${GODKAND_OK}" "[{\"fil\":\"${REFERENS}\",\"sha256\":\"$(sha_av_referens)\"}]"
andra_referens
check_exit "T18 stämplat facit, referens ändrad" 1 "$(run_exit)"
check_utdata "T18 skäl" "har ÄNDRATS och ändringen är inte bokförd"

# --- T19: OGODKÄNT facit, SAMMA ändring (GRÖN) — klass (a) ----------------
# Ett ogodkänt facit som ändras av sin egen skiva MÅSTE få sina referenser
# uppdaterade, annars går promoverings-grinden röd på en legitim ändring och
# kortet kan inte landa alls. Skulle detta fall bli rött vore invarianten
# fel byggd, inte strängare.
setup
skriv_referens
write_manifest_ref "null" "[{\"fil\":\"${REFERENS}\",\"sha256\":\"$(sha_av_referens)\"}]"
andra_referens
check_exit "T19 ogodkänt facit, samma ändring (klass a)" 0 "$(run_exit)"

# --- T20: deklarerad referens saknas på disk (RÖD) ------------------------
setup
skriv_referens
write_manifest_ref "${GODKAND_OK}" "[{\"fil\":\"${REFERENS}\",\"sha256\":\"$(sha_av_referens)\"}]"
rm -f "${TEST_DIR}/${REFERENS}"
check_exit "T20 deklarerad referens saknas" 1 "$(run_exit)"
check_utdata "T20 skäl" "ett lås utan objekt"

# --- T21: sha256 i fel format (RÖD) ---------------------------------------
setup
skriv_referens
write_manifest_ref "${GODKAND_OK}" "[{\"fil\":\"${REFERENS}\",\"sha256\":\"abc123\"}]"
check_exit "T21 sha256 i fel format" 1 "$(run_exit)"
check_utdata "T21 skäl" "64 hex-tecken"

# --- T22: tom referenser[] = deklarerad frånvaro (GRÖN) -------------------
setup
skriv_referens
write_manifest_ref "${GODKAND_OK}" "[]"
check_exit "T22 tom referenser[] är deklarerad frånvaro" 0 "$(run_exit)"

# --- T23: sidofil bokför ändringen med filens FAKTISKA sha256 (GRÖN) ------
# Klass (b) i sin fullbordade form: manifestet ORÖRT (det är fruset), och
# bokföringen i en sidofil som namnger både referensen och dess nya hash.
setup
skriv_referens
BOKFORD_SHA="$(sha_av_referens)"
write_manifest_ref "${GODKAND_OK}" "[{\"fil\":\"${REFERENS}\",\"sha256\":\"${BOKFORD_SHA}\"}]"
andra_referens
skriv_amendering "AMENDERING-2026-08-22-fixturbyte.md" \
    "# Amendering 2026-08-22 — referensen omfångad efter fixturbyte (TASK-286.2)

**Yta:** yta. **Klass (b)** — formen oförändrad.

Referensen \`${REFERENS}\` bär nu sha256 \`$(sha_av_referens)\`."
check_exit "T23 sidofil bokför ändringen (klass b)" 0 "$(run_exit)"

# --- T24: sidofil namnger filen men INTE dess hash (RÖD) ------------------
# Det är denna kontroll som håller låset kvar EFTER en amendering. Utan
# hash-kravet hade en enda sidofil som nämner sökvägen låst upp filen för
# all framtid, och nästa tysta omskrivning hade passerat.
setup
skriv_referens
BOKFORD_SHA="$(sha_av_referens)"
write_manifest_ref "${GODKAND_OK}" "[{\"fil\":\"${REFERENS}\",\"sha256\":\"${BOKFORD_SHA}\"}]"
andra_referens
skriv_amendering "AMENDERING-2026-08-22-utan-hash.md" \
    "# Amendering 2026-08-22 — referensen ändrad (TASK-286.2)

Referensen \`${REFERENS}\` är omfångad."
check_exit "T24 sidofil utan filens faktiska hash" 1 "$(run_exit)"
check_utdata "T24 skäl" "har ÄNDRATS och ändringen är inte bokförd"

# --- T25: manifestet bär nyckeln "amendering" (RÖD) -----------------------
# Exakt det försök som gjordes 2026-08-22 innan regeln fanns: bokföringen
# skriven i manifestets JSON, där ADR-104-hooken ändå aldrig hade släppt in
# den. Grinden namnger sidofilen i stället för att bara säga nej.
setup
skriv_referens
cat > "${TEST_DIR}/${BILAGE}/facit.json" <<JSON
{
  "prototyp": "s93-test",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "godkand": ${GODKAND_OK},
  "amendering": [{ "datum": "2026-08-22", "vad": "x" }],
  "ytor": [
    { "yta": "yta", "bilder": ["facit-yta.png"], "kallor": ["src/komponenter/Yta.tsx"], "referenser": [] }
  ]
}
JSON
check_exit "T25 amendering som JSON-nyckel i manifestet" 1 "$(run_exit)"
check_utdata "T25 skäl" "hör inte hemma i manifestet"

# --- T26: sidofil med fel namnform (RÖD) ----------------------------------
setup
skriv_referens
write_manifest_ref "${GODKAND_OK}" "[]"
skriv_amendering "AMENDERING-fixturbyte.md" "# Amendering 2026-08-22 — x"
check_exit "T26 sidofil med fel namnform" 1 "$(run_exit)"
check_utdata "T26 skäl" "AMENDERING-<ISO-datum>-<slug>\.md"

# --- T27: sidofil utan den kanoniska rubriken (RÖD) -----------------------
setup
skriv_referens
write_manifest_ref "${GODKAND_OK}" "[]"
skriv_amendering "AMENDERING-2026-08-22-utan-rubrik.md" "## Något annat"
check_exit "T27 sidofil utan kanonisk rubrik" 1 "$(run_exit)"
check_utdata "T27 skäl" "kanoniska rubriken"

# --- T28: korrekt namngiven sidofil utan referens-koppling (GRÖN) ---------
# De fem sidofiler som redan fanns i repot när regeln skrevs bokför PROSA om
# formavvikelser, inte hashar — de ska fortsätta vara gröna.
setup
skriv_referens
write_manifest_ref "${GODKAND_OK}" "[]"
skriv_amendering "AMENDERING-2026-08-17-mallnot-riven.md" \
    "# Amendering 2026-08-17 — mall-noten riven (TASK-273.3)

**Yta:** yta. Formen i övrigt orörd."
check_exit "T28 prosa-sidofil utan hashar (precedentformen)" 0 "$(run_exit)"

# ── Fixtur för invariant (b):s RIVNINGS-KLAUSUL ---------------------------
# Klausulen (ADR-102 § Updates 2026-08-22) härleder "fanns vid stämpeln,
# borta nu" ur GIT — inte ur sökvägens form. Fixturen måste därför vara ett
# riktigt git-repo. Det skapas INUTI TEST_DIR och rivs med resten via trap;
# det verkliga repot rörs aldrig.
#
# --no-verify + gpgsign=false + explicit identitet: commiten ska lyckas på en
# maskin med hooks, signering eller saknad global git-identitet. Ett testfall
# som är grönt lokalt och rött i CI bevisar ingenting.
RIVBAR="src/komponenter/Prototyp.tsx"

skapa_git_fixtur() {
    printf 'export const p = 1;\n' > "${TEST_DIR}/${RIVBAR}"
    (
        cd "${TEST_DIR}" || exit 1
        git init -q .
        git add -A
        git -c user.email=fixtur@example.invalid \
            -c user.name=Fixtur \
            -c commit.gpgsign=false \
            commit -q --no-verify -m "fixtur: laget vid stampeln"
    ) >/dev/null 2>&1
}

fixtur_sha() {
    ( cd "${TEST_DIR}" && git rev-parse HEAD )
}

# godkand_med_sha <sha> — samma schema som GODKAND_OK, men med en sha som
# FAKTISKT går att slå upp i fixtur-repot.
godkand_med_sha() {
    printf '{"av":"marcus","datum":"2026-08-10","citat":"Jag ar nojd. Las som facit.","sha":"%s"}' "$1"
}

# write_manifest_kallor <godkand-json> <extra-kalla-sokvag>
# Ytan bär TVÅ kallor: den bestående (Yta.tsx, som också bär prototyp-
# markören så invariant c inte förorenar utfallet) och den som prövas.
write_manifest_kallor() {
    local godkand=$1 extra=$2
    cat > "${TEST_DIR}/${BILAGE}/facit.json" <<JSON
{
  "prototyp": "s93-test",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "godkand": ${godkand},
  "ytor": [
    {
      "yta": "yta",
      "bilder": ["facit-yta.png"],
      "kallor": ["src/komponenter/Yta.tsx", "${extra}"]
    }
  ]
}
JSON
}

# --- T29: stämplat facit, källan riven efter stämpeln (GRÖN) --------------
# Det verkliga fallet, mätt 2026-08-22 mot PR #1769: TASK-285.11 rev
# MessageBoxPrototyp.tsx och AppErrorPrototyp.tsx enligt ADR-103 B2 steg 4,
# och grinden fällde på att skivan gjorde exakt det ADR-102 föreskriver.
setup
skapa_git_fixtur
write_manifest_kallor "$(godkand_med_sha "$(fixtur_sha)")" "${RIVBAR}"
rm -f "${TEST_DIR}/${RIVBAR}"
check_exit "T29 stämplat facit, källan riven efter stämpeln" 0 "$(run_exit)"
check_utdata "T29 bokföring" "riven efter stämpeln"

# --- T30: OGODKÄNT facit, SAMMA rivning av SAMMA fil (RÖD) ----------------
# Klausulens gräns. Före stämpeln finns ingen stämpel att förankra frånvaron
# i, och rivning är dessutom exakt det ADR-102 B3 förbjuder. Skulle detta
# fall bli grönt vore klausulen inte en precisering av invariant (b) utan en
# rivning av den.
setup
skapa_git_fixtur
write_manifest_kallor "null" "${RIVBAR}"
rm -f "${TEST_DIR}/${RIVBAR}"
check_exit "T30 ogodkänt facit, samma rivning" 1 "$(run_exit)"
check_utdata "T30 skäl" "pekar på källan .* som inte finns"

# --- T31: källan fanns ALDRIG i stämpel-trädet (RÖD) ----------------------
# Det som skiljer klausulen från en form-regel. En regel som accepterade
# sökvägens UTSEENDE ("allt under /dev/") hade släppt igenom en fil som
# aldrig funnits — en felstavning blir då ett permanent, osynligt hål.
# Klausulen vet i stället att filen FANNS, och fäller när den inte gjorde det.
setup
skapa_git_fixtur
write_manifest_kallor "$(godkand_med_sha "$(fixtur_sha)")" "src/komponenter/AldrigFunnits.tsx"
check_exit "T31 stämplat facit, källan fanns aldrig" 1 "$(run_exit)"
check_utdata "T31 skäl" "fanns INTE HELLER i stämpel-commiten"

# --- T32: stämpel-commiten går inte att slå upp lokalt (RÖD) --------------
# Fail-closed. GODKAND_OK bär en påhittad sha; klausulen kan då inte prövas,
# och invariant (b) fäller oförändrat. Grinden påstår aldrig "verifierat att
# filen fanns" när den inte kunde titta efter (ADR-083).
setup
skapa_git_fixtur
write_manifest_kallor "${GODKAND_OK}" "${RIVBAR}"
rm -f "${TEST_DIR}/${RIVBAR}"
check_exit "T32 stämpel-commiten går inte att slå upp" 1 "$(run_exit)"
check_utdata "T32 skäl" "går inte att slå upp i det lokala git-objektlagret"

# ═══ INVARIANT (d):s TÄCKNINGSVARNING ════════════════════════════════════
# TASK-309.31, ADR-102 § Updates 2026-08-28. Grinden NAMNGER varje stämplad
# yta som saknar nyckeln "referenser" i stället för att bara räkna dem — men
# fäller ALDRIG på det. Exitkoden är 0 i alla fyra fallen nedan; det som
# prövas är vad grinden SÄGER, inte vad den gör med exitkoden.
WARN_RUBRIK="VARNING \(invariant d, täckning\)"

# --- T33: stämplad yta UTAN referenser-nyckeln → WARN (GRÖN) --------------
# Fixturens .facit-policy.conf sätter INTE FACIT_VARNA_ODEKLARERAD_REFERENS.
# Att fallet ändå varnar bevisar defaultvärdet: en config som inte känner
# nyckeln tiger inte. Tystnad får aldrig uppstå av att någon glömt ett värde.
setup
write_manifest "${GODKAND_OK}" '''["facit-yta.png"]'''
check_exit "T33 stämplad yta utan referenser varnar men fäller inte" 0 "$(run_exit)"
check_utdata "T33 WARN-rubrik" "${WARN_RUBRIK}"
check_utdata "T33 namnger manifest + yta" "facit\.json · ytan \"yta\" — saknar nyckeln"
check_utdata "T33 summeringsrad N av M" "1 av 1 stämplade ytor saknar innehållslås"

# --- T34: stämplad yta MED referenser → INGEN WARN (GRÖN) -----------------
# Gränsen mot T33. Deklarerar ytan sin nyckel är den innehållslåst, och då
# finns ingen lucka att varna om — inte ens en tom lista är en lucka (T22:s
# "deklarerad frånvaro" är ett VAL, till skillnad från en frånvarande nyckel).
setup
skriv_referens
write_manifest_ref "${GODKAND_OK}" "[{\"fil\":\"${REFERENS}\",\"sha256\":\"$(sha_av_referens)\"}]"
check_exit "T34 stämplad yta med referenser" 0 "$(run_exit)"
check_utdata_saknas "T34 ingen WARN" "${WARN_RUBRIK}"

# --- T35: samma som T33 men omkopplaren AV → INGEN WARN (GRÖN) ------------
# Bevisar att beteendet är CONFIG-DRIVET och inte hårdkodat i skriptet
# (TASK-309.31 AC #4). Utan detta fall är "konfig-driven" ett påstående, inte
# en mätning — exakt den ADR-083-klass repot städat bort två gånger.
setup
write_manifest "${GODKAND_OK}" '''["facit-yta.png"]'''
printf '''FACIT_VARNA_ODEKLARERAD_REFERENS="0"\n''' >> "${TEST_DIR}/.facit-policy.conf"
check_exit "T35 omkopplaren av, exitkoden oförändrad" 0 "$(run_exit)"
check_utdata_saknas "T35 ingen WARN när omkopplaren är av" "${WARN_RUBRIK}"

# --- T36: OGODKÄND yta utan referenser → INGEN WARN (GRÖN) ----------------
# Stämpel-gränsen. Innehållslåset gäller först efter stämpeln (invariant d
# hoppar över hash-jämförelsen för "godkand": null, se T19), så en ogodkänd
# yta utan nyckel är inte en täckningslucka utan ett pågående arbete.
setup
write_manifest "null" '''["facit-yta.png"]'''
check_exit "T36 ogodkänd yta utan referenser" 0 "$(run_exit)"
check_utdata_saknas "T36 ingen WARN före stämpeln" "${WARN_RUBRIK}"

echo
echo "=== Resultat: ${PASSED} passerade, ${FAILED} failade ==="
[[ "${FAILED}" -eq 0 ]] || exit 1
