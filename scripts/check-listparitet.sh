#!/usr/bin/env bash
# check-listparitet.sh — fångar två listor som ska vara i synk och har glidit isär.
#
# ═══ VARFÖR GRINDEN FINNS ═══
#
# Repot bär flera INVARIANTER SOM STÅR PÅ TVÅ STÄLLEN. Filerna säger det själva,
# ordagrant: "PARAD ÄNDRING (obligatorisk)", "Exkluderingarna är IDENTISKA med
# should_skip_tests-stegets", "speglar det blocket i sak … får inte glida isär".
# Ingen av de meningarna hade en mekanism bakom sig. ci.yml skrev till och med ut
# konsekvensen: "De två listorna härleds oberoende och ingen grind håller dem
# synkade — paret hålls för hand."
#
# Att handen inte räcker är MÄTT, inte befarat. ADR-081:s landning (40e79e1) lade
# `./tasks/lessons.d/*.md` i BÅDA lychee-listorna och ökade därmed duplikationen
# med en rad; att den landade i båda var tur, inte mekanik. Samma vecka
# ackumulerade CONTRIBUTING.md TVÅ omissioner mot .purge-staging-policy.json
# (`ZZ-note-test+` och `app-segment-test+`) utan att någon såg dem.
#
# Detta är L328-klassen i sin renaste form: en nedskriven regel utan mekanism
# efterlevs inte. Grinden gör mekanik av de meningar filerna redan skrivit.
#
# ═══ VAD GRINDEN FAKTISKT PRÖVAR ═══
#
# Ett PAR är två listor, var och en utpekad som (fil, region, uttryck):
#
#   * FIL      — var listan bor.
#   * REGION   — raderna mellan en start- och en slut-MARKÖR (`# paritet:start
#                <namn>` / `# paritet:slut <namn>`). Tomma markörer = hela filen,
#                vilket är enda vägen för filformat som saknar kommentarer (JSON).
#   * UTTRYCK  — en ERE som plockar POSTERNA ur regionens rader (`grep -oE`).
#
# Posterna normaliseras (blanksteg trimmas, ett matchande par av citattecken
# eller bakåtfnuttar skalas av), dubbletter slås ihop, och de två mängderna
# jämförs. Riktningen `bada` kräver mängd-LIKHET; `a-till-b` kräver bara att
# varje post i A finns i B — den formen finns för par där B-sidan legitimt bär
# mer (prosa som nämner markörer, inte bara räknar upp dem).
#
# Avvikelser som ÄR avsiktliga deklareras som UNDANTAG med skriftligt skäl. Ett
# undantag som inte längre behövs FÄLLER också: annars ligger det kvar och
# maskerar nästa drift på samma post, vilket är precis den tysta luckan grinden
# finns för att stänga.
#
# ═══ FAIL-CLOSED ═══
#
# Kan grinden inte LÄSA ett par är det exit 2, aldrig tyst grönt. Konkret:
# saknad policy-fil, tom par-lista, fel antal fält i en post, saknad fil, saknad
# start- eller slut-markör, slut-markör före start-markör, NOLL extraherade
# poster på en sida, undantag för ett okänt par-namn, och undantag på B-sidan av
# ett `a-till-b`-par (där B-extra per definition är tillåtet, alltså ett
# konfigurationsfel som annars vore verkningslöst).
#
# Noll poster är den viktigaste av dem: ett uttryck som slutar matcha ger två
# tomma mängder, och tom == tom är grönt. Grinden skulle då rapportera paritet
# på ett par den inte längre läser.
#
# ═══ VARFÖR MARKÖRER OCH INTE STRUKTUR-PARSNING ═══
#
# Ett alternativ vore att låta grinden förstå YAML respektive bash och plocka
# blocken strukturellt. Det förkastades av två skäl. Dels binder det skriptet
# till filformaten och gör det oduglig i nästa spoke (AC#4 kräver duplicering
# utan refactor). Dels — och tyngre — GÖR MARKÖREN KOPPLINGEN SYNLIG för den som
# redigerar listan. En strukturell parser hade vetat om paret utan att berätta
# det för läsaren, och läsaren är den som orsakar driften.
#
# Markörerna måste stå UTANFÖR YAML:s block scalars: en `#`-rad inne i ett
# `files: |`-block är en literal glob-post, inte en kommentar. Placeringen är
# verifierad med js-yaml, yamllint och actionlint — blockens värden är
# byte-identiska med och utan markörerna.
#
# Exit 0 = alla par i synk. Exit 1 = drift (eller obehövligt undantag).
# Exit 2 = anropsfel — grinden kunde inte läsa det den skulle pröva.
#
# Config: .listparitet-policy.conf (per-projekt; skriptets logik är universell)

set -uo pipefail

POLICY_FIL="${LISTPARITET_POLICY:-.listparitet-policy.conf}"

if [[ ! -f "${POLICY_FIL}" ]]; then
    echo "❌ policy-fil saknas: ${POLICY_FIL}" >&2
    echo "   Grinden vägrar gissa vilka listpar som ska vaktas." >&2
    exit 2
fi
# shellcheck source=/dev/null
. "${POLICY_FIL}"

# Obligatoriska variabler prövas med EXPLICIT test, inte med `${VAR:?...}`.
# Skälet är kontraktsraden ovan: `${VAR:?}` avslutar skalet med exit 1, alltså
# "drift funnen", och en ofullständig policy hade då rapporterats som ett fynd.
# Samma rättelse som .backlog-closure-policy.conf-grinden bär.
if [[ -z "${LISTPARITET_PAR:-}" ]]; then
    echo "❌ LISTPARITET_PAR saknas eller är tom i ${POLICY_FIL}" >&2
    echo "   En tom par-lista är ett anropsfel, aldrig 'inga par att vakta'." >&2
    exit 2
fi
LISTPARITET_UNDANTAG="${LISTPARITET_UNDANTAG-}"

# Fältseparatorn är tre kolon. Den är vald för att inga av de värden som ska
# bäras — sökvägar, markörtexter, ERE:er — innehåller den. `[[:space:]]` bär
# `[:` och `:]` men aldrig `:::`. Fel fältantal är fail-closed, så ett värde som
# någon gång ändå råkar bära separatorn fälls i stället för att tolkas fel.
ANTAL_FALT=10

EXIT_CODE=0
antal_par=0
antal_drift=0

# ─── Hjälpare ────────────────────────────────────────────────────────────────

# Plocka fält N ur en `:::`-separerad post.
#
# REN PARAMETEREXPANSION, INGEN awk-process. Fält-plockningen är grindens
# hetaste väg — tio fält per par, plus fyra per undantag och par — och en
# awk-form spawnade ~250 processer.
#
# MÄTT LOKALT (macOS, 2026-07-30), och lasten hör till talet eftersom maskinen
# körde parallella agenter: awk-formen 2,94 s väggtid / 1,36 s user vid loadavg
# 5,37; formen nedan 1,15–1,28 s väggtid / 0,54 s user vid loadavg 3,97–4,13.
# Väggtiderna är INTE jämförbara rakt av — lasten skiljer — men user-tiden är
# vad processen faktiskt förbrukade, och den föll 1,36 → 0,54 s. Ingen av
# siffrorna är mätt i CI.
#
# Semantiken är prövad lika mot `awk -F':::'` för tomma fält, som uppstår när
# markörerna utelämnas: `X:::::::::Y` ger X, "", "", Y i båda formerna.
falt() {
    local rad="${1}" n="${2}" i=1
    while [[ "${i}" -lt "${n}" ]]; do
        rad="${rad#*:::}"
        i=$((i + 1))
    done
    printf '%s\n' "${rad%%:::*}"
}

antal_falt() {
    local rad="${1}" n=1
    while [[ "${rad}" == *:::* ]]; do
        rad="${rad#*:::}"
        n=$((n + 1))
    done
    printf '%s\n' "${n}"
}

# Finns par-namnet? Jämförelsen är EXAKT sträng, aldrig regex: ett par-namn med
# punkt eller plustecken hade som regex matchat fel par, tyst.
par_finns() {
    local sokt="${1}" rad namn
    while IFS= read -r rad; do
        [[ -z "${rad}" ]] && continue
        namn="$(falt "${rad}" 1)"
        [[ "${namn}" == "${sokt}" ]] && return 0
    done <<< "${LISTPARITET_PAR}"
    return 1
}

# Regionens rader. Tomma markörer ⇒ hela filen (enda vägen för JSON och andra
# format utan kommentarssyntax). Markörraderna själva ingår ALDRIG i regionen:
# de bär par-namnet, som annars hade blivit en extraherad post.
region() {
    local fil="${1}" start="${2}" slut="${3}"
    if [[ -z "${start}" ]]; then
        cat -- "${fil}"
        return 0
    fi
    awk -v s="${start}" -v e="${slut}" '
        !f && index($0, s) { f = 1; next }
        f && index($0, e)  { exit }
        f                  { print }
    ' "${fil}"
}

# Normalisering: trimma blanksteg i båda ändar, och skala av ETT matchande par
# av citattecken eller bakåtfnuttar. Bara matchande par skalas — en post med
# citattecken i bara en ände är inte citerad, den är trasig, och att tyst laga
# den hade dolt exakt den sortens fel.
normalisera() {
    local post
    while IFS= read -r post; do
        post="${post#"${post%%[![:space:]]*}"}"
        post="${post%"${post##*[![:space:]]}"}"
        case "${post}" in
            \'?*\'|\"?*\"|\`?*\`) post="${post:1:${#post}-2}" ;;
            *) ;;
        esac
        [[ -z "${post}" ]] && continue
        printf '%s\n' "${post}"
    done
}

# Poster i lista 1 som saknas i lista 2. Mängdlogiken bor i awk och inte i en
# associativ bash-array med flit: `declare -A` kräver bash 4, och macOS levererar
# 3.2 — en bash-4-form hade fungerat i CI och aldrig lokalt, alltså en grind
# ingen kan pröva på sin egen maskin före push.
#
# JÄMFÖRELSE-LISTAN GÅR VIA MILJÖN, ALDRIG VIA `awk -v`. Mätt 2026-07-30:
# `-v andra="$(flera\nrader)"` fäller BSD awk med "newline in string" — awk
# tolkar `-v`-värden som strängliteraler och en radbrytning avslutar literalen.
# Utfallet var värre än ett fel: funktionen gav TOM utdata, alltså noll drift,
# alltså grönt. ENVIRON bär värdet ordagrant och har ingen sådan tolkning.
saknas_i() {
    LISTPARITET_JMF="${2}" awk '
        BEGIN {
            n = split(ENVIRON["LISTPARITET_JMF"], arr, "\n")
            for (i = 1; i <= n; i++) if (arr[i] != "") b[arr[i]] = 1
        }
        $0 != "" && !($0 in b) { print }
    ' <<< "${1}"
}

# Är posten deklarerad som undantag för detta par och denna sida?
ar_undantagen() {
    local par="${1}" sida="${2}" post="${3}" rad namn s p
    while IFS= read -r rad; do
        [[ -z "${rad}" ]] && continue
        namn="$(falt "${rad}" 1)"
        s="$(falt "${rad}" 2)"
        p="$(falt "${rad}" 3)"
        if [[ "${namn}" == "${par}" && "${s}" == "${sida}" && "${p}" == "${post}" ]]; then
            return 0
        fi
    done <<< "${LISTPARITET_UNDANTAG}"
    return 1
}

# ─── Undantagens egen form prövas FÖRST ──────────────────────────────────────
#
# Ett undantag med felstavat par-namn ser ut att undanta något och gör
# ingenting. Utan denna kontroll är det tyst fail-open — grinden fäller på en
# post som någon TROR är undantagen, eller värre: undantaget saknas där det
# behövs och ingen förstår varför. Fyra fält krävs; det fjärde är skälet, och
# ett tomt skäl är inte ett undantag utan en tystad avvikelse.
while IFS= read -r rad; do
    [[ -z "${rad}" ]] && continue
    nf=0; nf="$(antal_falt "${rad}")"
    if [[ "${nf}" -ne 4 ]]; then
        echo "❌ undantags-post har ${nf} fält, förväntade 4: ${rad}" >&2
        echo "   Format: <par>:::<sida A|B>:::<post>:::<skäl>" >&2
        exit 2
    fi
    u_par="$(falt "${rad}" 1)"
    u_sida="$(falt "${rad}" 2)"
    u_skal="$(falt "${rad}" 4)"
    case "${u_sida}" in
        A|B) ;;
        *) echo "❌ undantag för '${u_par}' har sida '${u_sida}' — måste vara A eller B" >&2; exit 2 ;;
    esac
    if [[ -z "${u_skal}" ]]; then
        echo "❌ undantag för '${u_par}' saknar skäl" >&2
        echo "   Ett undantag utan skrivet skäl är en tystad avvikelse, inte ett undantag." >&2
        exit 2
    fi
    if ! par_finns "${u_par}"; then
        echo "❌ undantag pekar på okänt par: '${u_par}'" >&2
        echo "   Ett felstavat par-namn undantar ingenting och döljer att så är fallet." >&2
        exit 2
    fi
done <<< "${LISTPARITET_UNDANTAG}"

# ─── Paren ───────────────────────────────────────────────────────────────────

while IFS= read -r rad; do
    [[ -z "${rad}" ]] && continue

    nf=0; nf="$(antal_falt "${rad}")"
    if [[ "${nf}" -ne "${ANTAL_FALT}" ]]; then
        echo "❌ par-post har ${nf} fält, förväntade ${ANTAL_FALT}: ${rad}" >&2
        echo "   Format: <namn>:::<riktning>:::<A-fil>:::<A-start>:::<A-slut>:::<A-uttryck>:::<B-fil>:::<B-start>:::<B-slut>:::<B-uttryck>" >&2
        exit 2
    fi

    namn="$(falt "${rad}" 1)"
    riktning="$(falt "${rad}" 2)"
    a_fil="$(falt "${rad}" 3)";  a_start="$(falt "${rad}" 4)"
    a_slut="$(falt "${rad}" 5)"; a_regex="$(falt "${rad}" 6)"
    b_fil="$(falt "${rad}" 7)";  b_start="$(falt "${rad}" 8)"
    b_slut="$(falt "${rad}" 9)"; b_regex="$(falt "${rad}" 10)"

    case "${riktning}" in
        bada|a-till-b) ;;
        *) echo "❌ par '${namn}' har riktning '${riktning}' — måste vara 'bada' eller 'a-till-b'" >&2; exit 2 ;;
    esac

    antal_par=$((antal_par + 1))
    fel_i_paret=0

    # Fil, markörer och tomhet prövas per sida. Slingan gör A och B med samma
    # kod — det är hela poängen med att sidorna har identisk form.
    for sida in A B; do
        if [[ "${sida}" == "A" ]]; then
            s_fil="${a_fil}"; s_start="${a_start}"; s_slut="${a_slut}"; s_regex="${a_regex}"
        else
            s_fil="${b_fil}"; s_start="${b_start}"; s_slut="${b_slut}"; s_regex="${b_regex}"
        fi

        if [[ ! -f "${s_fil}" ]]; then
            echo "❌ par '${namn}' sida ${sida}: filen saknas — ${s_fil}" >&2
            exit 2
        fi
        if [[ -n "${s_start}" ]]; then
            if ! grep -qF -- "${s_start}" "${s_fil}"; then
                echo "❌ par '${namn}' sida ${sida}: start-markören saknas i ${s_fil}" >&2
                echo "   Sökte: ${s_start}" >&2
                exit 2
            fi
            if ! grep -qF -- "${s_slut}" "${s_fil}"; then
                echo "❌ par '${namn}' sida ${sida}: slut-markören saknas i ${s_fil}" >&2
                echo "   Sökte: ${s_slut}" >&2
                exit 2
            fi
            start_rad=0
            start_rad="$(awk -v s="${s_start}" 'index($0, s) { print NR; exit }' "${s_fil}")" || true
            slut_rad=0
            slut_rad="$(awk -v e="${s_slut}" 'index($0, e) { print NR; exit }' "${s_fil}")" || true
            if [[ "${slut_rad}" -le "${start_rad}" ]]; then
                echo "❌ par '${namn}' sida ${sida}: slut-markören står före start-markören i ${s_fil}" >&2
                exit 2
            fi
        fi

        rader=""; rader="$(region "${s_fil}" "${s_start}" "${s_slut}")"
        # `-e` är OBLIGATORISKT, inte stilval: uttrycken börjar regelmässigt med
        # två bindestreck (`--exclude-path …`), och utan `-e` läser grep dem som
        # en okänd flagga och avbryter med usage-fel. Mätt 2026-07-30 under
        # härledningen — lychee-paret gav då NOLL poster på båda sidor, alltså
        # tom == tom == grönt. Det var fail-closed-kontrollen nedan som fångade
        # det, och den incidenten är skälet till att kontrollen finns.
        poster=""
        poster="$(printf '%s\n' "${rader}" | grep -oE -e "${s_regex}" | normalisera | sort -u)" || true

        if [[ -z "${poster}" ]]; then
            echo "❌ par '${namn}' sida ${sida}: NOLL poster extraherade ur ${s_fil}" >&2
            echo "   Uttryck: ${s_regex}" >&2
            echo "   Tom mängd == tom mängd är grönt — grinden hade rapporterat" >&2
            echo "   paritet på ett par den inte längre läser. Fail-closed i stället." >&2
            exit 2
        fi

        if [[ "${sida}" == "A" ]]; then A_POSTER="${poster}"; else B_POSTER="${poster}"; fi
    done

    # A ∖ B — alltid fällande (modulo undantag). Detta är riktningen som bär
    # fail-open-risken i klassnings-paren: en post som finns i den ena listan och
    # inte i den andra gör filen både testsvit-skippad och docs-skippad.
    # Slingorna läser rad för rad, aldrig `for post in $(…)`: en post kan innehålla
    # blanksteg (prosa-sidan gör det regelmässigt), och ordsplittring hade då delat
    # en post i två och rapporterat drift som inte finns.
    # Mängd-differensens EGET utfall prövas. Faller awk ger funktionen tom
    # utdata, och tom utdata betyder "ingen drift" — alltså tyst grönt på ett
    # par som aldrig jämfördes. Det felläget inträffade skarpt under bygget
    # (se saknas_i ovan), vilket är skälet till att kontrollen står här.
    a_utan_b=""
    if ! a_utan_b="$(saknas_i "${A_POSTER}" "${B_POSTER}")"; then
        echo "❌ par '${namn}': mängd-jämförelsen A∖B kunde inte utföras" >&2
        exit 2
    fi
    while IFS= read -r post; do
        [[ -z "${post}" ]] && continue
        if ar_undantagen "${namn}" "A" "${post}"; then continue; fi
        echo "❌ ${namn}: '${post}' finns i A (${a_fil}) men inte i B (${b_fil})"
        fel_i_paret=$((fel_i_paret + 1))
    done <<< "${a_utan_b}"

    if [[ "${riktning}" == "bada" ]]; then
        b_utan_a=""
        if ! b_utan_a="$(saknas_i "${B_POSTER}" "${A_POSTER}")"; then
            echo "❌ par '${namn}': mängd-jämförelsen B∖A kunde inte utföras" >&2
            exit 2
        fi
        while IFS= read -r post; do
            [[ -z "${post}" ]] && continue
            if ar_undantagen "${namn}" "B" "${post}"; then continue; fi
            echo "❌ ${namn}: '${post}' finns i B (${b_fil}) men inte i A (${a_fil})"
            fel_i_paret=$((fel_i_paret + 1))
        done <<< "${b_utan_a}"
    fi

    # Obehövliga undantag. Ett undantag som inte längre motsvarar en faktisk
    # asymmetri ligger kvar och maskerar nästa drift på samma post — samma tysta
    # lucka som grinden finns för att stänga, återinförd av grindens egen config.
    while IFS= read -r urad; do
        [[ -z "${urad}" ]] && continue
        u_par="$(falt "${urad}" 1)"
        [[ "${u_par}" == "${namn}" ]] || continue
        u_sida="$(falt "${urad}" 2)"
        u_post="$(falt "${urad}" 3)"
        if [[ "${riktning}" == "a-till-b" && "${u_sida}" == "B" ]]; then
            echo "❌ ${namn}: undantag på B-sidan av ett a-till-b-par är verkningslöst ('${u_post}')" >&2
            echo "   B får bära extra poster per riktningen — undantaget döljer bara att det inte gör något." >&2
            exit 2
        fi
        kvar=""
        if [[ "${u_sida}" == "A" ]]; then
            kvar="${a_utan_b}"
        else
            kvar="${b_utan_a:-}"
        fi
        if ! grep -qxF -- "${u_post}" <<< "${kvar}"; then
            echo "❌ ${namn}: undantaget för '${u_post}' (sida ${u_sida}) behövs inte längre"
            echo "   Posten är inte längre asymmetrisk. Ett kvarliggande undantag maskerar"
            echo "   nästa drift på samma post. Ta bort raden ur ${POLICY_FIL}."
            fel_i_paret=$((fel_i_paret + 1))
        fi
    done <<< "${LISTPARITET_UNDANTAG}"

    if [[ "${fel_i_paret}" -gt 0 ]]; then
        antal_drift=$((antal_drift + 1))
        EXIT_CODE=1
    fi
done <<< "${LISTPARITET_PAR}"

echo ""
if [[ "${EXIT_CODE}" -eq 0 ]]; then
    echo "✅ listparitet: ${antal_par} par prövade, samtliga i synk."
else
    echo "${antal_drift} av ${antal_par} par har glidit isär."
    echo "Är avvikelsen AVSIKTLIG? Deklarera den med skäl i ${POLICY_FIL}"
    echo "(LISTPARITET_UNDANTAG). Ett undantag utan skäl accepteras inte."
fi

exit "${EXIT_CODE}"
