#!/usr/bin/env bash
#
# check-facit.sh
#
# Hävdar att LÅST FACIT är adresserbart, fullständigt deklarerat, och att
# prototyp-substratet inte rivs innan Marcus godkänt att skarpa bygget är
# identiskt med prototypen.
#
# Fyra invarianter:
#   (a) En bilage-katalog som bär minst en facit-bild bär också ett
#       facit-manifest. Utan manifest är facit inte adresserbart — och en
#       agent som inte hittar facit drar slutsatsen "det finns inte" och
#       bygger vidare. Mätt: TASK-145.3:s utförare rapporterade ordagrant
#       "bilderna finns inte i repot och fanns inte i uppdraget" och
#       substituerade en annan baslinje — DAGEN EFTER att bilderna landat
#       (ecd4e1c0, 2026-08-06; PR #929 mergad 2026-08-07).
#   (b) Manifestet är strukturellt konsistent med disken: varje deklarerad
#       bild finns, varje facit-namngiven fil är deklarerad, varje yta
#       deklarerar sina bilder (tom lista = deklarerad frånvaro) och sina
#       källsökvägar. Delegeras till scripts/lib/facit-validera.mjs.
#   (c) Så länge ett manifest har "godkand": null får prototyp-markörerna
#       inte försvinna ur koden. ADR-102 B3: prototyp-kod rivs ALDRIG före
#       Marcus godkännande. Utan denna spärr är blockeringen av rivnings-
#       skivan en handpåläggning — precis den prosa-utan-mekanism som
#       ADR-102 finns för att ersätta. VEM/HUR "godkand" får sättas — och
#       vilket SCHEMA ett satt värde bär (ett objekt, aldrig en bar sträng)
#       — är ADR-104:s domän (§ Beslut 2–3, TASK-167): denna grind läser
#       bara "är fältet null eller inte", schemavalideringen bor i
#       scripts/lib/facit-validera.mjs (invariant b, se nedan).
#   (d) Ett STÄMPLAT manifests deklarerade referenser är innehållslåsta:
#       varje "referenser[].sha256" måste vara filens faktiska sha256.
#       ADR-102 § Updates 2026-08-22 (T157). Bakgrunden är mätt: S109 fick
#       två instanser på ETT dygn av samma handling — en agent uppdaterade
#       ariaSnapshot-referenser i samma commit som en formändring — och
#       skillnaden mellan dem (#1730 armerad, "godkand": null; #1715
#       stoppad, stämplat facit) avgjordes av orkestrerarens omdöme, varje
#       gång, eftersom INGEN grind fällde. Invariant (d) är den skillnaden
#       kodad: hash-jämförelsen hoppas över för "godkand": null (klass a,
#       fri ändring) och fäller för ett stämplat manifest (klass b/c).
#       Vägen till grönt går via en AMENDERING-<datum>-<slug>.md-sidofil i
#       samma bilage-katalog som namnger både referensen och dess nya
#       sha256 — manifestet självt är agent-fruset så snart det är stämplat
#       (ADR-104-hooken nekar varje Edit/Write mot det, mätt 2026-08-22).
#       Delegeras till scripts/lib/facit-validera.mjs.
#
# VAD GRINDEN INTE GÖR, uttryckligen: den avgör INTE om skarpa ytan SER UT
# som facit. Den jämförelsen är Marcus öga, och en grind som påstod sig göra
# den vore exakt den ADR-083-klass repot bekämpar — en text som utlovar en
# täckning ingen mekanism håller. Grinden gör facit omöjligt att INTE hitta,
# och rivning omöjlig att göra i förtid. Jämförelsen självt förblir mänsklig.
#
# TVÅ NAMNGIVNA LUCKOR I (d), öppet bokförda i stället för utjämnade:
#   1. TÄCKNINGEN. Nyckeln "referenser" är valfri, och 21 av 22 stämplade
#      ytor saknar den (mätt 2026-08-22). Backfillen kräver mätning per yta
#      — endast 4 av 12 manifest namnger sina __aria__-sökvägar — och är ett
#      eget kort. Slutraden nedan RÄKNAR UPP de odeklarerade vid varje
#      körning, så frånvaron aldrig blir tyst (R5-lärdomen: en odeklarerad
#      lucka är oskiljbar från ett förbiseende).
#   2. BOKFÖRINGENS SANNINGSHALT. Grinden hävdar att en ändring under ett
#      stämplat facit ÄR bokförd — att en sidofil namnger referensen och
#      dess nya hash. Den kan aldrig hävda att bokföringens SKÄL är sant,
#      alltså att ändringen verkligen tillhör klass (b) och inte (c). Den
#      domen är Marcus öga; ADR-102 § Updates 2026-08-22 § A2 bär testet och
#      eskaleringsregeln (osäkerhet ⇒ klass c), som konvention utan spärr.
#      Baslinjen i manifestet skyddas däremot av ADR-104-hooken, som fryser
#      ett stämplat manifest i sin helhet — det är därför "referenser"
#      måste deklareras medan manifestet ännu är ogodkänt.
#
# Config: .facit-policy.conf (projekt-specifika värden; denna logik är
# universell och kan dupliceras till andra spokes utan refactor).
#
# Exit: 0 = grönt, 1 = invariant bruten, 3 = felkonfigurerad/körd från fel plats.

set -euo pipefail

CONFIG=".facit-policy.conf"

die() { printf 'check-facit: %s\n' "$1" >&2; exit "${2:-3}"; }

[[ -f "${CONFIG}" ]] || die "${CONFIG} saknas — körs grinden från repo-roten?"

# Pre-deklareras FÖRE source så shellcheck-strict (--enable=all) ser arrayen
# som tilldelad — samma form som check-thread-index.sh:112-115. Utan raden
# fäller SC2154 på användningen i (c).
declare -a FACIT_PROTO_MARKORER=()

# shellcheck source=/dev/null
source "${CONFIG}"

: "${FACIT_BILAGE_ROT:?FACIT_BILAGE_ROT är osatt i ${CONFIG}}"
: "${FACIT_MANIFEST_NAMN:?FACIT_MANIFEST_NAMN är osatt i ${CONFIG}}"
: "${FACIT_BILD_GLOB:?FACIT_BILD_GLOB är osatt i ${CONFIG}}"
: "${FACIT_PROTO_SOKVAG:?FACIT_PROTO_SOKVAG är osatt i ${CONFIG}}"

VALIDERARE="scripts/lib/facit-validera.mjs"
[[ -f "${VALIDERARE}" ]] || die "${VALIDERARE} saknas."

FAILED=0
MANIFEST_ANTAL=0
YTA_ANTAL=0
REFERENS_ANTAL=0
ODEKLARERADE_YTOR=0
OGODKANDA=()

# Frånvarande bilage-rot är GRÖNT: ett repo utan prototyp-pass har inget
# facit att skydda. Grinden är tillgänglig, inte obligatorisk.
if [[ ! -d "${FACIT_BILAGE_ROT}" ]]; then
    echo "✅ Facit-manifest OK: ${FACIT_BILAGE_ROT}/ finns inte — inget prototyp-pass att pröva."
    exit 0
fi

# --- Svep varje bilage-katalog -------------------------------------------
# Glob-iteration per husets idiom (check-lesson-numbers.sh rad 80) i stället
# för find-pipe: command substitution med pipe maskerar returvärdet (SC2312).
for katalog in "${FACIT_BILAGE_ROT}"/*/; do
    [[ -d "${katalog}" ]] || continue

    katalog="${katalog%/}"
    manifest="${katalog}/${FACIT_MANIFEST_NAMN}"

    # Har katalogen någon facit-namngiven bild?
    har_facit_bild=0
    for bild in "${katalog}"/${FACIT_BILD_GLOB}; do
        [[ -e "${bild}" ]] || continue
        har_facit_bild=1
        break
    done

    # --- (a) Facit-bild utan manifest ------------------------------------
    if [[ "${har_facit_bild}" -eq 1 && ! -f "${manifest}" ]]; then
        echo "❌ ${katalog}/ bär facit-bilder men saknar ${FACIT_MANIFEST_NAMN}."
        echo "   Utan manifest är facit inte adresserbart: den som söker det"
        echo "   hittar en katalog med blandade bilder och kan inte avgöra"
        echo "   vilka som är låsta — eller om en frånvaro är en lucka."
        echo "   Fix: skapa ${manifest} med fälten prototyp, last, lasning,"
        echo "        godkand och ytor[] (yta, bilder[], kallor[])."
        FAILED=1
        continue
    fi

    [[ -f "${manifest}" ]] || continue
    MANIFEST_ANTAL=$((MANIFEST_ANTAL + 1))

    # --- (b) Strukturell konsistens --------------------------------------
    validering=""
    validering=$(node "${VALIDERARE}" "${manifest}" "${FACIT_BILD_GLOB}" 2>&1) || {
        echo "❌ ${manifest} — manifestet är inte konsistent med disken:"
        # shellcheck disable=SC2001  # sed på multi-line är klarast här
        echo "${validering}" | sed 's/^/     /'
        FAILED=1
    }

    # Räkna ytor för slutraden. node -p ger 0 vid trasig JSON, vilket redan
    # rapporterats ovan — räkningen är kosmetisk och får aldrig fälla.
    antal=""
    antal=$(node -p "JSON.parse(require('fs').readFileSync('${manifest}','utf8')).ytor.length" 2>/dev/null) || antal=0
    YTA_ANTAL=$((YTA_ANTAL + antal))

    # Samla manifest som ännu inte är godkända (driver invariant c).
    godkand=""
    godkand=$(node -p "JSON.parse(require('fs').readFileSync('${manifest}','utf8')).godkand ?? 'null'" 2>/dev/null) || godkand="null"
    if [[ "${godkand}" = "null" ]]; then
        OGODKANDA+=("${manifest}")
    fi

    # Täcknings-räkning för invariant (d), slutraden. Räknas ENDAST för
    # stämplade manifest — det är där innehållslåset gäller. Kosmetisk som
    # ytantalet ovan: den får aldrig fälla, bara berätta hur stor luckan är.
    las=""
    las=$(node -p "(()=>{const m=JSON.parse(require('fs').readFileSync('${manifest}','utf8'));if(!m.godkand)return 0;return (m.ytor||[]).reduce((n,y)=>n+(Array.isArray(y.referenser)?y.referenser.length:0),0);})()" 2>/dev/null) || las=0
    REFERENS_ANTAL=$((REFERENS_ANTAL + las))

    odek=""
    odek=$(node -p "(()=>{const m=JSON.parse(require('fs').readFileSync('${manifest}','utf8'));if(!m.godkand)return 0;return (m.ytor||[]).filter((y)=>!('referenser' in y)).length;})()" 2>/dev/null) || odek=0
    ODEKLARERADE_YTOR=$((ODEKLARERADE_YTOR + odek))
done

# --- (c) B3-spärren: rivning före godkännande ----------------------------
# Spärren gäller bara så länge minst ett manifest är ogodkänt. Är allt
# godkänt är rivningen tillåten och grinden ska inte stå i vägen.
#
# VIKTIGT, TASK-287: kontrollen nedan är GLOBAL, inte per yta. Den prövar
# att varje registrerad markör i FACIT_PROTO_MARKORER finns kvar NÅGONSTANS
# i FACIT_PROTO_SOKVAG — den vet inte VILKET ogodkänt manifest en given
# markör hör till, och den upptäcker INTE en ogodkänd yta som saknar en
# registrerad markör helt och hållet (det var precis TASK-287:s fynd: fem
# markörer, noll av dem för S109:s två ytor). Framgångsraden nedan (rad
# ~180) är formulerad för att bara påstå det som faktiskt kontrollerats —
# se .facit-policy.conf § "REGEL: NÄR en markör registreras" för hur luckan
# hålls stängd framåt (registrering vid facit-låsning, inte vid rivningen).
MARKOR_KONTROLLERAD=0
if [[ "${#OGODKANDA[@]}" -gt 0 && "${#FACIT_PROTO_MARKORER[@]}" -gt 0 ]]; then
    if [[ -d "${FACIT_PROTO_SOKVAG}" ]]; then
        MARKOR_KONTROLLERAD=1
        for markor in "${FACIT_PROTO_MARKORER[@]}"; do
            traffar=0
            traffar=$(grep -rlF "${markor}" "${FACIT_PROTO_SOKVAG}" 2>/dev/null | grep -c . ) || traffar=0

            if [[ "${traffar}" -eq 0 ]]; then
                echo "❌ Prototyp-markören '${markor}' finns inte kvar i ${FACIT_PROTO_SOKVAG}/,"
                echo "   men facit är ännu inte godkänt av Marcus:"
                for m in "${OGODKANDA[@]}"; do
                    echo "     ${m} — \"godkand\": null"
                done
                echo "   ADR-102 B3: prototyp-kod rivs ALDRIG före Marcus godkännande."
                echo "   Rätt ordning (B4): skarpa görs identisk → Marcus jämför"
                echo "   sida vid sida → Marcus godkänner → FÖRST DÅ rivs substratet."
                echo "   Fix: återställ rivningen, eller sätt \"godkand\": \"<datum>\""
                echo "        i manifestet när Marcus faktiskt godkänt."
                FAILED=1
            fi
        done
    fi
fi

if [[ "${FAILED}" -ne 0 ]]; then
    exit 1
fi

if [[ "${MANIFEST_ANTAL}" -eq 0 ]]; then
    echo "✅ Facit-manifest OK: inga facit-bilder funna under ${FACIT_BILAGE_ROT}/."
    exit 0
fi

if [[ "${MARKOR_KONTROLLERAD}" -eq 1 ]]; then
    echo "✅ Facit-manifest OK: ${MANIFEST_ANTAL} manifest, ${YTA_ANTAL} ytor deklarerade, ${#OGODKANDA[@]} ogodkända (${#FACIT_PROTO_MARKORER[@]} registrerade prototyp-markörer verifierade kvar i ${FACIT_PROTO_SOKVAG}/ — global kontroll, ingen koppling manifest→markör; se .facit-policy.conf)."
else
    echo "✅ Facit-manifest OK: ${MANIFEST_ANTAL} manifest, ${YTA_ANTAL} ytor deklarerade, ${#OGODKANDA[@]} ogodkända."
fi

# Invariant (d):s täckning skrivs ALLTID ut, aldrig bara när den är hel.
# En grind som tiger om sin egen lucka gör frånvaron oskiljbar från
# fullständighet — samma R5-fälla manifestets "bilder"-nyckel finns för att
# stänga (ADR-102 § Updates 2026-08-22 § Vad som INTE mekaniseras här).
echo "   Innehållslås (invariant d): ${REFERENS_ANTAL} referenser låsta mot sha256 i stämplade manifest; ${ODEKLARERADE_YTOR} stämplade ytor saknar \"referenser\" och är därmed INTE innehållslåsta."
