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
# D0-undantag och fäller om någon har en analyserbar filändelse (JS/TS-
# familjen) utan att stå deklarerad i undantagslistan nedan, med skäl.
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
# ANALYSERBAR = filändelse i JS/TS-familjen (`.js .mjs .cjs .ts .tsx .jsx`)
# — de ändelser `javascript-typescript`-språket i codeql.yml:s matris
# extraherar. En `.py`/`.go`-fil under samma sökväg vore INTE analyserbar
# av VÅR CodeQL-konfiguration (vi kör bara javascript-typescript + actions),
# så den ligger utanför grindens scope med avsikt.
#
# ═══ UNDANTAG ═══
#
# En rad per fil i policy-conf:en, format `<sökväg>:::<skäl>`. Skälet ska
# vara VERIFIERAT (körs filen av ett npm-skript eller en workflow hör den
# INTE hemma i en dokumentkatalog — flytta den, undanta den inte) — de åtta
# ursprungliga posterna verifierades 2026-09-19 mot `package.json` och
# `.github/workflows/*.yml` (`grep`, noll träffar för samtliga åtta) samt
# filernas egna källkodskommentarer (se policy-conf:en för detaljer per
# fil).
#
# Ett undantag som inte längre behövs FÄLLER också, av samma skäl som
# check-listparitet.sh: annars maskerar det nästa drift på samma post.
#
# INGEN `mapfile`/`declare -A` — macOS levererar bash 3.2, som saknar
# båda (samma fälla check-listparitet.sh dokumenterar i sin `falt()`-
# kommentar). Set-medlemskap löses med `grep -qxF` mot en radseparerad
# sträng i stället för en associativ array.
#
# Exit 0 = inga otillåtna filer (eller samtliga är deklarerade undantag,
#          och inga obehövliga undantag kvarligger).
# Exit 1 = otillåten fil funnen ODEKLARERAD, eller obehövligt undantag.
# Exit 2 = anropsfel — grinden kunde inte läsa det den skulle pröva.
#
# Config: .codeql-d0-kodfri-policy.conf
# Källa: TASK-464.2, review runda 1 fynd 1 (warning).

set -uo pipefail

POLICY_FIL="${CODEQL_D0_KODFRI_POLICY:-.codeql-d0-kodfri-policy.conf}"
CODEQL_YML="${CODEQL_D0_KODFRI_WORKFLOW:-.github/workflows/codeql.yml}"
START_MARK="# paritet:start klassning-codeql-d0"
SLUT_MARK="# paritet:slut klassning-codeql-d0"
ANALYSERBAR_ERE='\.(m?js|cjs|tsx?|jsx)$'

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
TRAFFAR=""
if [[ "${#GLOB_ARGS[@]}" -gt 0 ]]; then
    TRAFFAR="$(git ls-files -- "${GLOB_ARGS[@]}" 2>/dev/null | grep -E "${ANALYSERBAR_ERE}" || true)"
fi

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
    echo "❌ ${fil}: analyserbar (JS/TS-familjen) och täckt av CodeQL:s D0-undantag, men odeklarerad" >&2
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
        echo "   D0 + analyserbar ändelse). Ta bort raden ur ${POLICY_FIL}." >&2
        antal_obehovliga=$((antal_obehovliga + 1))
        EXIT_CODE=1
    fi
done <<< "${UNDANTAGS_FILER}"

echo ""
if [[ "${EXIT_CODE}" -eq 0 ]]; then
    echo "✅ codeql-d0-kodfri: ${antal_traffar} analyserbara filer under D0, ${antal_deklarerade} deklarerade undantag, 0 odeklarerade."
else
    echo "${antal_odeklarerade} odeklarerad(e), ${antal_obehovliga} obehövlig(a) undantag."
fi

exit "${EXIT_CODE}"
