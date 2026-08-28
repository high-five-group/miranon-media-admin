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
#       RIVNINGS-KLAUSULEN (ADR-102 § Updates 2026-08-22): i ett STÄMPLAT
#       manifest är en källa som saknas på disk inte automatiskt ett brott.
#       ADR-103 B2 steg 4 föreskriver att prototyp-substratet rivs efter
#       stämpeln, och manifestet kan inte följa med (ADR-104-hooken fryser
#       det). Klausulen skiljer de två fallen ur GIT, inte ur sökvägens form:
#       fanns filen i stämpel-commitens träd ("godkand".sha) och är borta nu,
#       är frånvaron en riven källa och accepteras — men räknas ALLTID upp i
#       slutraden nedan. Fanns den inte heller där, fäller grinden som förut.
#       Bakgrunden är mätt: PR #1769 (TASK-285.11) föll 2026-08-22 på två
#       källor den rev enligt B2 steg 4, och fyra familjer till stod på tur.
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
#      ytor saknar den (mätt 2026-08-22; 24 av 28 mätt 2026-08-28 i
#      TASK-309.31 — talet har vandrat med antalet stämplade ytor, INTE med
#      någon backfill: TASK-288 står ännu To Do). Backfillen kräver mätning
#      per yta — endast 4 av 12 manifest namnger sina __aria__-sökvägar —
#      och är ett eget kort. Slutraden nedan RÄKNAR UPP de odeklarerade vid
#      varje körning, så frånvaron aldrig blir tyst (R5-lärdomen: en
#      odeklarerad lucka är oskiljbar från ett förbiseende).
#
#      SEDAN TASK-309.31 (2026-08-28) räcker inte räkningen. En siffra säger
#      HUR STOR luckan är men inte VAR den sitter, och en yta som ingen kan
#      peka ut är i praktiken lika otäckt bevakad som en yta ingen räknat.
#      Grinden NAMNGER därför varje stämplad yta som saknar nyckeln, på
#      stderr, som en WARN-rad (manifest · yta · vad som saknas) följd av en
#      summeringsrad "N av M". Exitkoden är OFÖRÄNDRAD — 0. Det är ett
#      medvetet val, inte en halvmesyr: en retroaktiv fällning hade gjort 24
#      ytor röda på en gång utan migrationsfönster medan backfillen
#      (TASK-288) aldrig utförts, och branschens ögonblicksverktyg (Percy,
#      Chromatic, BackstopJS, Storybook) accepterar baselines UTAN separat
#      källreferens men rapporterar täckningen. Underlag med citat:
#      docs/research/facit-pensionering-s102-2026-08-26.md § 4; beslutet:
#      ADR-102 § Updates 2026-08-28. Vägen till fällning går via TASK-288:s
#      backfill, inte via en strängare grind i dag.
#      Omkopplare: FACIT_VARNA_ODEKLARERAD_REFERENS i .facit-policy.conf.
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

# Omkopplare för invariant (d):s täckningsVARNING (TASK-309.31). Till skillnad
# från de fyra ovan är den INTE obligatorisk: default är PÅ. En config som
# ännu inte känner nyckeln — ett annat spoke, eller denna fils egen historik —
# ska varna, inte tiga. Tystnaden är precis det som kostade (ADR-102 § Updates
# 2026-08-28), så frånvaron av ett värde får aldrig tolkas som ett val att
# tiga. Sätt "0" i ${CONFIG} för att stänga av NAMNGIVNINGEN; den kosmetiska
# summeringsraden längst ned skrivs ändå, oberoende av omkopplaren.
: "${FACIT_VARNA_ODEKLARERAD_REFERENS:=1}"

VALIDERARE="scripts/lib/facit-validera.mjs"
[[ -f "${VALIDERARE}" ]] || die "${VALIDERARE} saknas."

FAILED=0
MANIFEST_ANTAL=0
YTA_ANTAL=0
REFERENS_ANTAL=0
STAMPLADE_YTOR=0
OGODKANDA=()
RIVNA_KALLOR=()
ODEKLARERADE_LISTA=()

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
    # Validerarens utdata bär TVÅ klasser: "FEL: …" fäller, "NOT: …" gör det
    # inte. NOT-raderna är rivnings-klausulens accepterade frånvaron — de
    # hålls utanför ❌-blocket (som ska visa bara det som fäller) och skrivs i
    # stället ut samlat i slutraden, vid VARJE körning. Aldrig tyst: samma
    # R5-disciplin som invariant (d):s täckningsrad bär.
    validering=""
    valkod=0
    validering=$(node "${VALIDERARE}" "${manifest}" "${FACIT_BILD_GLOB}" 2>&1) || valkod=$?

    fel_rader=""
    while IFS= read -r rad; do
        case "${rad}" in
            'NOT: '*) RIVNA_KALLOR+=("${rad#NOT: }") ;;
            '')       : ;;
            *)        fel_rader+="${rad}"$'\n' ;;
        esac
    done <<< "${validering}"

    if [[ "${valkod}" -ne 0 ]]; then
        echo "❌ ${manifest} — manifestet är inte konsistent med disken:"
        while IFS= read -r rad; do
            echo "     ${rad}"
        done <<< "${fel_rader%$'\n'}"
        FAILED=1
    fi

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

    # De odeklarerade ytorna NAMNGES, inte bara räknas (TASK-309.31). Listans
    # längd ÄR räkningen — slutradens tal härleds ur den, så namnen och talet
    # kan aldrig glida isär (två oberoende node-anrop hade kunnat säga olika
    # saker om samma manifest, och då är det inte längre mätbart vilket som
    # ljuger). Manifestet skickas som argv, inte interpolerat i skriptkroppen.
    odek_namn=""
    odek_namn=$(node -e "const m=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));if(!m.godkand)process.exit(0);process.stdout.write((m.ytor||[]).filter((y)=>!('referenser' in y)).map((y)=>String(y.yta ?? '(namnlös yta)')).join('\n'));" "${manifest}" 2>/dev/null) || odek_namn=""

    if [[ -n "${odek_namn}" ]]; then
        while IFS= read -r ytnamn; do
            [[ -n "${ytnamn}" ]] || continue
            ODEKLARERADE_LISTA+=("${manifest} · ytan \"${ytnamn}\"")
        done <<< "${odek_namn}"
    fi

    # Nämnaren i "N av M" — antalet ytor under ett STÄMPLAT manifest. Härleds
    # ur de två värden loopen redan har (ytantalet + godkand-läget), så den
    # kostar inget extra node-anrop.
    if [[ "${godkand}" != "null" ]]; then
        STAMPLADE_YTOR=$((STAMPLADE_YTOR + antal))
    fi
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

# Rivnings-klausulens bokföring. Skrivs i BÅDA utfallen — även när en annan
# invariant fällde: en accepterad frånvaro som bara syns i det gröna fallet
# vore osynlig precis när diffen är som mest värd att läsa.
skriv_rivna() {
    [[ "${#RIVNA_KALLOR[@]}" -gt 0 ]] || return 0
    echo "   Rivna källor (invariant b:s rivnings-klausul, ADR-102 § Updates 2026-08-22):"
    echo "   accepterade därför att de FANNS i stämpel-commitens träd och är borta nu."
    echo "   Klausulen skiljer INTE rivet prototyp-substrat (ADR-103 B2 steg 4) från en"
    echo "   skarp fil som tagits bort eller döpts om efter stämpeln — den skillnaden är"
    echo "   diff-granskningens, inte grindens."
    local rivet
    for rivet in "${RIVNA_KALLOR[@]}"; do
        echo "     ${rivet}"
    done
}

# Invariant (d):s TÄCKNINGSVARNING (TASK-309.31, ADR-102 § Updates 2026-08-28).
# Skrivs på stderr och ändrar ALDRIG exitkoden — anropen nedan står efter att
# utfallet redan är avgjort, aldrig i en gren som kan sätta FAILED.
#
# Varför varning och inte fällning: se filhuvudets lucka 1. Kort — backfillen
# (TASK-288) är inte utförd, så en fällning hade gjort 24 stämplade ytor röda
# på en gång utan migrationsfönster, och branschens ögonblicksverktyg
# rapporterar täckning i stället för att kräva den. Vägen till fällning går
# via backfillen, inte via denna rad.
#
# Varför NAMN och inte bara siffran som redan fanns: siffran säger hur stor
# luckan är, aldrig var den sitter. Den som ska stänga luckan behöver de 24
# raderna; den som läser en grön CI-logg behöver se att de finns.
skriv_odeklarerade() {
    [[ "${FACIT_VARNA_ODEKLARERAD_REFERENS}" = "1" ]] || return 0
    [[ "${#ODEKLARERADE_LISTA[@]}" -gt 0 ]] || return 0
    local post
    {
        echo "⚠️  VARNING (invariant d, täckning) — fäller INTE, exitkoden är oförändrad:"
        echo "   Följande STÄMPLADE ytor saknar nyckeln \"referenser\" och står därmed"
        echo "   utanför innehållslåset. Ingen mekanism ser om deras referenser ändras."
        for post in "${ODEKLARERADE_LISTA[@]}"; do
            echo "   ⚠️  ${post} — saknar nyckeln \"referenser\""
        done
        echo "   ⚠️  ${#ODEKLARERADE_LISTA[@]} av ${STAMPLADE_YTOR} stämplade ytor saknar innehållslås."
        echo "   Vägen till att stänga luckan: TASK-288 (backfill av referenser — ett"
        echo "   Marcus-moment, ADR-104-hooken fryser ett stämplat manifest). Beslutet"
        echo "   att varna i stället för att fälla: ADR-102 § Updates 2026-08-28."
        echo "   Tysta namngivningen med FACIT_VARNA_ODEKLARERAD_REFERENS=0 i ${CONFIG}."
    } >&2
}

if [[ "${FAILED}" -ne 0 ]]; then
    skriv_rivna
    skriv_odeklarerade
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

skriv_rivna

# Invariant (d):s täckning skrivs ALLTID ut, aldrig bara när den är hel.
# En grind som tiger om sin egen lucka gör frånvaron oskiljbar från
# fullständighet — samma R5-fälla manifestets "bilder"-nyckel finns för att
# stänga (ADR-102 § Updates 2026-08-22 § Vad som INTE mekaniseras här).
echo "   Innehållslås (invariant d): ${REFERENS_ANTAL} referenser låsta mot sha256 i stämplade manifest; ${#ODEKLARERADE_LISTA[@]} stämplade ytor saknar \"referenser\" och är därmed INTE innehållslåsta."

# Namngivningen sist: den gröna slutraden ska stå kvar överst i läsarens blick,
# och varningen läsas som det den är — en täckningslucka, inte ett fel i det
# som prövats.
skriv_odeklarerade
