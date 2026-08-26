#!/usr/bin/env bash
# scripts/acceptance-urval.sh — PR-grindens acceptance-urval (TASK-75).
#
# Besvarar EN fråga om den diff som ska grindas:
#
#     Är HELA diffen sådan att acceptance-klassen kan köras som delmängd?
#
# Ja  ⇒ skriver de spec-filer som ska köras, blankstegsseparerat, till stdout.
# Nej ⇒ skriver INGENTING. Tomt betyder full acceptance-klass.
#
# ═══ VARFÖR SKRIPTET FINNS — MÄTT, INTE ANTAGET ═══
# Acceptance-sviten kör alla 18 spec-filer på varje kod-PR. Efter A7:5
# (`TASK-70.3`) flyttade `Staging (API + E2E)` till post-merge-lagret och
# `Acceptance (hermetisk)` blev ENSAM bärare av PR-grindens kritiska väg —
# mätt till 422/433/422 s över tre fulla körningar 2026-07-28, alltså cirka
# 50 s LÅNGSAMMARE än den staging-svit som flyttades bort.
#
# En del av den tiden är inte spillo utan appens verkliga retry-beteende:
# `TASK-65` mätte att ETT felvägs-test kostar cirka 7,9 s enbart i
# backoff-sömn (`fetchWithRetry` fyra försök i `src/data/utils.ts`,
# `QueryClient` tre i `src/router.ts:18`, och lager 2 kör om lager 1 per
# försök). Att korta dem vore att testa något annat än appen. Urval är därför
# hävstången, inte timeout-trimning.
#
# ═══ ÄRVER D0:s ALLOWLIST — ÄGER NOLL GLOBAR ═══
# Skriptet klassar INTE diffen mot egna mönster. Det läser `changed`-jobbets
# BEFINTLIGA D0-steg (`steps.changed-files`) och tar dess `other_changed_files`
# — per actionens egen källa vid den pinnade SHA:n exakt "de ändrade filer som
# INTE matchade D0-listan", inklusive dem som slogs ut av `!`-exkluderingarna:
#
#     otherChangedFiles = allOtherChangedFilesPaths.filter(
#       (filePath) => !allChangedFilesPaths.includes(filePath))
#
# (src/changedFilesOutput.ts @ 9426d40, verifierad 2026-07-29.)
#
# Det är hela poängen med formen. ADR-077 § Beslut 1 slår fast att klassningen
# "förblir deklarativ i changed-files-steget" och avvisar ett eget
# klassnings-skript rakt ut, eftersom ett sådant hade "tvingat fram en
# omimplementation av glob-semantik som actionen redan äger, med divergens-risk
# mot D0". Detta skript implementerar noll glob-semantik och har därför ingen
# lista som kan drifta ifrån D0:s. En TREDJE hand-hållen kopia av docs-listan
# (ci.yml bär redan två, med en uttrycklig varning om att paret hålls för hand)
# vore precis den skuld ADR:n avvisar.
#
# ═══ ALLOWLIST, ALDRIG BLOCKLIST ═══
# Urvalet tillämpas ENDAST när VARENDA post i `other_changed_files` är en
# acceptance-spec-fil som finns på disk. En enda post som inte är det — en
# källfil, den delade testsömmen `tests/acceptance/acceptance-bas.ts`, en
# workflow, ett paketmanifest, en okänd filtyp — ger tomt utfall och därmed
# full klass. En ny filtyp kan aldrig tyst hamna i snabbfilen; den är per
# konstruktion okänd och okänt givet faller till full svit (ADR-077 § Beslut
# 1, D3-defaulten).
#
# Riktningen är asymmetrisk med avsikt: skriptet kan bara orsaka att FÖR MYCKET
# körs, aldrig att för lite körs — utom via en spec-fil, och en spec-fil kan per
# konstruktion bara påverka sig själv (Playwright-specar importerar inte
# varandra; sömmen bor i `tests/acceptance/acceptance-bas.ts` — sedan TASK-123
# en platt fil, inte längre en egen `support/`-katalog — och är inte valbar
# eftersom namnet inte matchar `SPEC_MONSTER` nedan, så den fäller alltid till
# full klass).
#
# ═══ VAD SOM MEDVETET INTE GÖRS: URVAL PÅ KÄLLKOD ═══
# Ett urval som mappar `src/**` till spec-filer kräver en testgraf. ADR-077
# § Beslut 1 lämnar den slotten öppen MED AVSIKT ("klassas ärligt D3 tills en
# framtida testgrafs-design") och `TASK-75` mintar den inte på egen hand.
#
# Playwrights INBYGGDA `--only-changed` är prövad och FÖRKASTAD, empiriskt och
# inte resonerat (2026-07-29, playwright 1.61.1): dess graf är test-filernas
# egen modulgraf, inte appens. Mätt i båda riktningar i denna worktree —
#   · ändrad `src/routes/_authenticated/hem.tsx` → `Total: 0 tests in 0 files`
#   · ändrad `tests/acceptance/hem.acceptance.test.ts` → `28 tests in 1 file`
# Den första raden ÄR falsk-grön-klassen kortet varnar för: en källändring hade
# gett noll acceptance-täckning utan att se avvikande ut.
#
# ═══ SKYDDSNÄTET ÄR EN FÖRUTSÄTTNING, INTE EN TRÖST ═══
# Google-modellen (ADR-077 § Kontext): en riskanpassad presubmit är försvarbar
# ENDAST med ett post-submit-nät under sig. `post-merge.yml` anropar
# `ci-suite.yml` UTAN `acceptance_selection` och får defaulten tom — alltså full
# klass på varje mergat träd. Ett urval som missar något fångas där, inom
# minuter, i stället för att aldrig fångas.
#
# ANVÄNDNING
#   scripts/acceptance-urval.sh "<other_changed_files från D0-steget>"
#
#   Skriver urvalet till stdout (tomt = full klass) och en människoläsbar
#   motivering till stderr. Fyller GITHUB_STEP_SUMMARY när den är satt.
#
# EXIT-KODER
#   0  klassning genomförd (utfallet står i stdout, aldrig i exitkoden)
#   2  användningsfel (fel antal argument) — fail-loud: ett anropsfel ska fälla
#      jobbet och fyra larmet, inte tyst bli "full klass"
#
# Källa: backlog TASK-75 · ADR-077 §§ 1+3 · ADR-080 · CONTRIBUTING.md § Acceptance-klassen
# Etablerad: Session 91 (2026-07-29)

set -uo pipefail

# Formen en valbar post MÅSTE ha. Snäv med avsikt: allt annat under
# tests/acceptance/ — inklusive den delade sömmen `acceptance-bas.ts` — faller
# till full klass.
readonly SPEC_MONSTER='^tests/acceptance/[A-Za-z0-9._-]+\.acceptance\.test\.ts$'

usage() {
    echo "Användning: $0 \"<other_changed_files>\"" >&2
}

if [[ $# -ne 1 ]]; then
    echo "❌ Fel antal argument ($#), väntade exakt 1." >&2
    usage
    exit 2
fi

RAA="$1"
urval=()
skal=""

emit() {
    local utfall="${urval[*]:-}"
    echo "${utfall}"
    echo "acceptance-urval: ${skal}" >&2
    if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
        {
            echo "## Acceptance-urval (PR-grinden)"
            echo ""
            echo "| Vad | Värde |"
            echo "|---|---|"
            if [[ -n "${utfall}" ]]; then
                echo "| Utfall | \`${#urval[@]}\` av klassens spec-filer |"
                echo "| Urval | \`${utfall}\` |"
            else
                echo "| Utfall | **full acceptance-klass** |"
                echo "| Urval | – |"
            fi
            echo "| Skäl | ${skal} |"
        } >> "${GITHUB_STEP_SUMMARY}"
    fi
    exit 0
}

# --- (1) Ingenting utanför D0-klassen ----------------------------------------
# Ren docs-diff. Sviten hoppas ändå av `should_skip_tests`, så utfallet är utan
# konsekvens — men det uttrycks som full klass, aldrig som ett tomt urval med
# annan betydelse. Tomt betyder EN sak i hela mekaniken.
if [[ -z "${RAA// /}" ]]; then
    skal="inga filer utanför D0-klassen — inget att välja bland (full klass)."
    emit
fi

# --- (2) Varje post måste vara en valbar spec-fil ----------------------------
read -r -a poster <<< "${RAA}"

for post in "${poster[@]}"; do
    if [[ "${post}" == *".."* ]]; then
        urval=()
        skal="posten '${post}' innehåller '..' — avvisas oläst (full klass, fail-closed)."
        emit
    fi
    if [[ ! "${post}" =~ ${SPEC_MONSTER} ]]; then
        urval=()
        skal="posten '${post}' är inte en acceptance-spec-fil — diffen rör mer än klassen (full klass)."
        emit
    fi
    # Finns den inte på disk kan Playwright inte köra den, och ett urval som
    # pekar på en frånvarande fil hade fällt jobbet på fel grund. Raderade och
    # bortflyttade filer når normalt inte hit (ACMR utelämnar D), men beslutet
    # ska vila på disken och inte på den antagna semantiken.
    if [[ ! -f "${post}" ]]; then
        urval=()
        skal="posten '${post}' finns inte på disk — urvalet vore obetrott (full klass, fail-closed)."
        emit
    fi
    urval+=("${post}")
done

skal="varje ändrad fil utanför D0-klassen är en acceptance-spec (${#urval[@]} st) — klass-lokal diff, urval tillämpas."
emit
