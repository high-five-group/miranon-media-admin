#!/usr/bin/env bash
# scripts/post-merge-attribution.sh — post-merge-larmets ATTRIBUTION (TASK-334).
#
# Besvarar EN fråga åt larm-jobbet i .github/workflows/post-merge.yml:
#
#     Är den här landningen den primära misstänkta — eller ligger felet i ett
#     spann av landningar som ingen svit har mätt?
#
# Skriver ett markdown-stycke till stdout. Stycket blir avsnittet
# "## Är det den här landningen?" i ärendet.
#
# ═══ VARFÖR SKRIPTET FINNS — MÄTT, INTE ANTAGET ═══
# Larmet hämtade tidigare föregående post-merge-körnings WORKFLOW-nivå-
# conclusion och skrev, ordagrant:
#
#     "Föregående post-merge-körning var **GRÖN** ⇒ den här landningen är den
#      primära misstänkta. Revert nedan är sannolikt rätt första åtgärd."
#
# Den meningen är FALSK så fort föregående körning var grön DÄRFÖR ATT den
# hoppade sviten. En docs-landning ärver ci.yml:s D0-beslut (klassning-jobbet,
# scripts/classify-post-merge.sh), svit-anropet skippas, och körningen blir
# `success` på workflow-nivå UTAN att ha mätt någonting. Grönt betyder då
# "ingen mätning", inte "trädet var friskt".
#
# Mätt två gånger inom 13 minuter 2026-08-28, båda med texten ovan utskriven:
#   · ärende #2043, körning 33139629247, träd d5607d6254a3 (PR #2035).
#     Föregående körning 33138604694 var `success` — och dess
#     `Verifierande svit på det mergade trädet` hade conclusion `skipped`.
#   · ärende #2047, körning 33140227702, träd 55d83d0d674d (PR #2038).
#     Föregående körning 33139966256: samma sak, `success` + `skipped`.
# Den verkliga rotorsaken låg i staging-fixturens drift och åtgärdades i
# TASK-333 — inte i någon av de två landningar larmet pekade ut. Mellan den
# senaste körning som FAKTISKT körde sviten (33095380581, 2026-08-27T16:51Z)
# och 33139629247 låg fyra docs-landningar som alla hoppade den.
#
# Signalen är verifierad i API:t, inte antagen: elva på varandra följande
# post-merge-körningar lästes 2026-08-28 och utfallet var binärt utan undantag
# — antingen ETT jobb med EXAKT svit-jobbets namn och conclusion `skipped`,
# eller inner-jobb prefixade "<svit-jobbets namn> / ". Aldrig blandat. Det är
# samma form scripts/classify-post-merge.sh läser på ci.yml-sidan, och av samma
# skäl: ett SKIPPAT reusable-anrop rapporteras som ETT jobb med anropets egna
# namn, ett KÖRT expanderas till sina inner-jobb.
#
# ═══ VAD SKRIPTET INTE GÖR — DEN ÄRVDA KLASSNINGEN ÄR ORÖRD ═══
# Det ändrar INGENTING i vad post-merge kör. `klassning`-jobbet ärver fortsatt
# ci.yml:s D0-beslut och docs-landningar hoppar fortsatt sviten (ADR-077
# § Beslut 1-2, TASK-73, TASK-78). Optionen "kör alltid staging oavsett klass"
# är öppet förkastad, inte förbisedd: den återinför exakt den defekt TASK-73
# stängde — merge `ed51b95` (åtta rader i EN .md-fil) tog den globala
# `staging-tests`-mutexen, revert-PR #375 låg `pending` bakom den, och
# revert-vägen mätte 25 min 16 s mot en CI-kostnad under en minut.
#
# Det ändrar bara vad larmet PÅSTÅR när det väl fyrar. Se ADR-077 § Updates
# 2026-08-28 för hela options-rymden, inklusive den tidsbaserade drift-vakt
# som är flaggad men INTE byggd här.
#
# ═══ FAIL-SOFT PÅ STDOUT, ALDRIG FAIL-LOUD PÅ EXITKODEN ═══
# Skriptet returnerar ALLTID 0. Det är en MEDVETEN avvikelse från
# scripts/classify-post-merge.sh, som exit 2:ar på konfigfel — och skälet är
# att de två skripten sitter på olika platser i kedjan.
#
# Klassningens jobb ligger i larmets `needs`: faller det, fyrar larmet. Detta
# skript körs INNE I larm-steget, som har `set -euo pipefail`. En exitkod skild
# från noll hade därför dödat själva larmet, och ärendet hade aldrig skapats —
# alltså tystnad i exakt det läge signalen behövs (L321/L322-klassen).
#
# Ett ärende med "OKÄND" i attributionen är strikt bättre än inget ärende.
# Varje avvikelse — saknad env, API-fel, oläsbar jobblista, okänd form —
# rapporteras därför SOM TEXT i stycket, plus en `::error::`-annotering i
# körningen (som inte fäller steget). Ett faktapåstående byggs aldrig på
# frånvaro av data (TASK-51, L322-klassen).
#
# Att wiringen faktiskt finns kvar vaktas mekaniskt i stället, av
# scripts/test-post-merge-attribution.sh (A11-A13).
#
# ANVÄNDNING
#   REPO=<owner/namn> RUN_ID=<denna körnings databaseId> SHA=<merge-sha> \
#       scripts/post-merge-attribution.sh
#
#   Valfritt: MAX_KORNINGAR (default 20) — hur långt bakåt körningslistan läses.
#             MAX_JOBBFRAGOR (default 20) — tak för antalet `gh run view`-anrop.
#
# EXIT-KODER
#   0  alltid — utfallet står i texten på stdout, aldrig i exitkoden.
#
# ═══ gh — MEDVETET OPINNAD HÄR (samma skäl som classify-post-merge.sh) ═══
# Varje `gh`-anrop nedan är kopplat till en explicit felgren som landar i
# OKÄND-text. En för gammal eller trasig `gh` producerar därför i värsta fall
# en attribution som säger "vet inte" — aldrig ett tyst felaktigt påstående.
# Körs uteslutande på GitHub-hostade runners där `gh` är förinstallerat och
# versionshanterat av GitHub självt (se scripts/lib/gh-guard.sh § SCOPE).
#
# Källa: backlog TASK-334 · ADR-077 §§ 1-2 + § Updates 2026-08-28 ·
#        ADR-083 (prosa som påstår mekanism) · CONTRIBUTING.md § Nattnätet
# Etablerad: Session 112 (2026-08-28)

set -uo pipefail

# post-merge.yml:s `suite`-jobbs `name:`. Detta är skriptets ENDA koppling till
# workflow-filen, och den grindas mekaniskt av
# scripts/test-post-merge-attribution.sh A11. Byts namnet utan att strängen
# följer med hittas inga inner-jobb, varje körning klassas "okänd form", och
# attributionen blir permanent OKÄND — en tyst degradering, alltså samma
# L322-klass grinden vaktar.
POST_MERGE_SUITE_JOB_NAME="Verifierande svit på det mergade trädet"
POST_MERGE_WORKFLOW="post-merge.yml"

REPO="${REPO:-}"
RUN_ID="${RUN_ID:-}"
SHA="${SHA:-}"
# DE TVÅ TAKEN ÄR LIKA MED AVSIKT, och det är hela poängen med värdet.
# MAX_KORNINGAR är `gh run list --limit`, alltså hur långt bakåt fönstret
# sträcker sig; MAX_JOBBFRAGOR är taket för `gh run view`-anrop under
# vandringen. Listan innehåller ALLTID vår egen körning, så efter skärningen
# vid eget index finns som mest MAX_KORNINGAR-1 kandidater kvar — med lika
# värden kan jobbfråge-taket därför aldrig bli det bindande.
#
# RÄTTAT EFTER GRANSKNING (PR #2059, runda 2): värdena var 30 respektive 20.
# Vid 21-30 hoppade körningar i rad slog jobbfråge-taket först, och svaret blev
# OKÄND trots att listan bar outforskade kandidater — fail-soft, men ett
# onödigt "vet inte". Att göra dem lika tar bort läget i stället för att
# förklara det.
#
# 20 och inte 30: taket kostar ett `gh run view` per steg inuti ett larm-jobb
# med `timeout-minutes: 3`, och den mätta värsta vandringen hittills är fyra
# hoppade landningar i rad (2026-08-27→28). Höj BÅDA om fönstret behöver bli
# större; höj aldrig bara den ena.
MAX_KORNINGAR="${MAX_KORNINGAR:-20}"
MAX_JOBBFRAGOR="${MAX_JOBBFRAGOR:-20}"

emit() {
    printf '%s\n' "$1"
    exit 0
}

okand() {
    echo "::error::post-merge-attribution: $1" >&2
    emit "**OKÄND** — attributionen kunde inte avgöras (${1}). Detta är INTE ett påstående om historiken: läs körningslistan för hand innan du reverterar."
}

# --- (0) Konfigkontroll -------------------------------------------------------
if [[ -z "${REPO}" ]]; then
    okand "REPO är osatt"
fi
if [[ ! "${RUN_ID}" =~ ^[0-9]+$ ]]; then
    okand "RUN_ID är inte ett heltal ('${RUN_ID}')"
fi
if [[ -z "${SHA}" ]]; then
    okand "SHA är osatt"
fi

kort_sha="${SHA:0:12}"

# --- (1) Körningslistan på main ----------------------------------------------
list_failed=""
lista_json=$(gh run list --repo "${REPO}" \
    --workflow "${POST_MERGE_WORKFLOW}" --branch main --event push \
    --limit "${MAX_KORNINGAR}" \
    --json databaseId,headSha,conclusion,status) || list_failed="1"

if [[ -n "${list_failed}" ]]; then
    okand "anropet mot körnings-API:t misslyckades — kontrollera att larm-jobbet har actions: read"
fi

# ÄLDRE än DENNA körning, aldrig nyare. Listan är nyast-först, men en parallell
# landning kan ha lagt en NYARE körning ovanför oss medan larmet kör. Den gamla
# formen `[.[] | select(.databaseId != $rid)][0]` plockade då den NYARE
# körningen och kallade den "föregående" — därför skärs listan vid vårt EGET
# index i stället för att bara filtrera bort oss.
tolk_failed=""
aldre_json=$(jq -c --argjson rid "${RUN_ID}" '
    (map(.databaseId) | index($rid)) as $i
    | if $i == null then map(select(.databaseId != $rid)) else .[($i + 1):] end
' <<<"${lista_json}") || tolk_failed="1"

if [[ -n "${tolk_failed}" || -z "${aldre_json}" ]]; then
    okand "körningslistan kunde inte tolkas"
fi

antal=$(jq -r 'length' <<<"${aldre_json}")

if [[ "${antal}" -eq 0 ]]; then
    emit "**Ingen tidigare post-merge-körning** på \`main\` — det här är den första. Ingen jämförelse att göra."
fi

# --- (2) Gå bakåt till senaste körning som FAKTISKT körde sviten -------------
# Räknas separat, av två skäl som inte är samma sak:
#   hoppade — ärvd D0, sviten skippades med avsikt (docs-only landning).
#   omatta  — körningen gav ingen dom alls (avbruten, startup_failure, okänd
#             form). Inte ett beslut, bara en utebliven mätning.
hoppade=0
omatta=0
ankare_id=""
ankare_sha=""
ankare_utfall=""
hoppade_shas=""

fragor=0
i=0
while [[ "${i}" -lt "${antal}" ]]; do
    if [[ "${fragor}" -ge "${MAX_JOBBFRAGOR}" ]]; then
        break
    fi

    rad_id=$(jq -r ".[${i}].databaseId" <<<"${aldre_json}")
    rad_sha=$(jq -r ".[${i}].headSha // \"\"" <<<"${aldre_json}")
    fragor=$(( fragor + 1 ))
    i=$(( i + 1 ))

    view_failed=""
    jobb_json=$(gh run view "${rad_id}" --repo "${REPO}" --json jobs) || view_failed="1"

    if [[ -n "${view_failed}" ]]; then
        okand "jobblistan för körning ${rad_id} kunde inte läsas"
    fi

    klass=$(jq -r --arg n "${POST_MERGE_SUITE_JOB_NAME}" '
        ([.jobs[]? | select(.name == $n)]) as $exakt
        | ([.jobs[]? | select(.name | startswith($n + " / "))]) as $inre
        | if ($inre | length) > 0 then
              (if ([$inre[] | select(.conclusion == "failure" or .conclusion == "cancelled")] | length) > 0
               then "kord-rott" else "kord-gront" end)
          elif ($exakt | length) > 0 and ($exakt[0].conclusion == "skipped") then
              "hoppad"
          else
              "okand"
          end
    ' <<<"${jobb_json}")

    case "${klass}" in
        kord-gront | kord-rott)
            ankare_id="${rad_id}"
            ankare_sha="${rad_sha}"
            ankare_utfall="${klass}"
            break
            ;;
        hoppad)
            hoppade=$(( hoppade + 1 ))
            hoppade_shas="${hoppade_shas}\`${rad_sha:0:12}\` "
            ;;
        *)
            omatta=$(( omatta + 1 ))
            ;;
    esac
done

if [[ -z "${ankare_id}" ]]; then
    emit "**OKÄND** — ingen av de ${fragor} närmast föregående post-merge-körningarna på \`main\` körde sviten (alla hoppade den eller gav ingen dom). Senaste faktiska mätningen ligger längre bak än fönstret, så felets ursprung kan inte avgränsas härifrån. Läs körningslistan för hand: \`gh run list --workflow ${POST_MERGE_WORKFLOW} --branch main --event push\`."
fi

# --- (3) Formulera attributionen ---------------------------------------------
kort_ankare="${ankare_sha:0:12}"
omatta_totalt=$(( hoppade + omatta ))

mellanled=""
if [[ "${omatta_totalt}" -gt 0 ]]; then
    mellanled="Sedan dess har **${omatta_totalt} landning(ar) passerat utan att sviten mätte dem**"
    if [[ "${hoppade}" -gt 0 && "${omatta}" -gt 0 ]]; then
        mellanled="${mellanled} (${hoppade} hoppade sviten på ärvd \`D0\`, ${omatta} gav ingen dom)"
    elif [[ "${hoppade}" -gt 0 ]]; then
        mellanled="${mellanled} (ärvd \`D0\` — docs-only, \`klassning\`-jobbet hoppade svit-anropet)"
    else
        mellanled="${mellanled} (ingen dom: avbruten eller oväntad form)"
    fi
    mellanled="${mellanled}."
fi

spann="Spann att läsa: \`git log --oneline ${kort_ankare}..${kort_sha}\`."

if [[ "${ankare_utfall}" == "kord-rott" ]]; then
    text="Sviten kördes senast på \`${kort_ankare}\` (körning ${ankare_id}) och var **redan RÖD** ⇒ felet är sannolikt ÄLDRE än den här landningen. **Revertera inte reflexmässigt** — leta upp den första röda körningen först, annars backas fel commit."
    if [[ -n "${mellanled}" ]]; then
        text="${text} ${mellanled}"
    fi
    emit "${text} ${spann}"
fi

if [[ "${omatta_totalt}" -eq 0 ]]; then
    emit "Föregående post-merge-körning (${ankare_id}, \`${kort_ankare}\`) körde sviten och var **GRÖN** ⇒ den här landningen är den primära misstänkta. Revert nedan är sannolikt rätt första åtgärd."
fi

text="Sviten kördes senast på \`${kort_ankare}\` (körning ${ankare_id}) och var **GRÖN** — men det var **inte** föregående landning. ${mellanled} Felet kan därför ha uppstått var som helst i spannet, och den här landningen är **INTE** den primära misstänkta enbart för att den råkade vara den första som mätte igen. ${spann}"
if [[ -n "${hoppade_shas}" ]]; then
    text="${text}"$'\n\n'"Landningar som hoppade sviten däremellan (nyast först): ${hoppade_shas% }"
fi
emit "${text}"
