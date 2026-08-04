#!/usr/bin/env bash
# scripts/test-deny-grind-genom-pipe.sh — tvåsidigt bevis för L440-hooken.
#
# TVÅSIDIGT: pipade grindar ska NEKAS, allt annat ska SLÄPPAS. Sida 2 är den
# viktigare halvan här: hooken kör mot VARJE Bash-kommando, så ett falsklarm
# kostar friktion i varje pass. Husregeln (nightly-watchdog.yml:s eget huvud)
# är att ett falsklarm är värre än ingen vakt.
#
# Fallen på sida 1 är de FAKTISKA kommandoformerna ur de sju bokförda
# instanserna, inte påhittade exempel.
#
# Körs: bash scripts/test-deny-grind-genom-pipe.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="${SCRIPT_DIR}/deny-grind-genom-pipe.sh"
POLICY="${SCRIPT_DIR}/../.grind-exitkod-policy.conf"

ANTAL=0
FEL=0

kor() {
    local cmd="$1" ut
    ut="$(jq -nc --arg c "${cmd}" '{tool_name:"Bash",tool_input:{command:$c}}' \
        | GRIND_POLICY="${POLICY}" bash "${HOOK}" 2>/dev/null)"
    if printf '%s' "${ut}" | jq -e '.hookSpecificOutput.permissionDecision == "deny"' >/dev/null 2>&1; then
        printf 'NEKA'
    else
        printf 'SLAPP'
    fi
}

forvanta() {
    local vantat="$1" desc="$2" cmd="$3"
    ANTAL=$((ANTAL + 1))
    local faktiskt
    faktiskt="$(kor "${cmd}")"
    if [[ "${faktiskt}" == "${vantat}" ]]; then
        printf '  ✅ %-54s [%s]\n' "${desc}" "${faktiskt}"
    else
        printf '  ❌ %-54s [fick %s, väntade %s]\n' "${desc}" "${faktiskt}" "${vantat}"
        FEL=$((FEL + 1))
    fi
}

echo "═══ L440-hooken — tvåsidigt bevis ═══"
echo
echo "SIDA 1 — de SJU faktiska instanserna ska NEKAS"

forvanta NEKA "S91 instans 1: markdownlint-cli2 | tail -1" \
    'npx markdownlint-cli2 "**/*.md" | tail -1'
forvanta NEKA "S94 (L441): check:docs | tail" \
    'npm run check:docs | tail -5'
forvanta NEKA "S93 #662: pipe:ad grind svalde exitkoden" \
    'npx markdownlint-cli2 tasks/todo.md | grep MD012'
forvanta NEKA "testsvit genom pipe" \
    'bash scripts/test-deny-resend-send.sh | tail -1'
forvanta NEKA "check-skript genom pipe" \
    'bash scripts/check-lifecycle.sh | head -3'
forvanta NEKA "shellcheck genom pipe" \
    'shellcheck scripts/*.sh | head -20'
forvanta NEKA "vale genom pipe" \
    'vale CLAUDE.md | tail -2'
forvanta NEKA "grind på egen rad i ett flerradigt block" \
    'cd /repo
npx actionlint .github/workflows/ci.yml | tail -3
echo klart'

echo
echo "SIDA 2 — legitima former ska SLÄPPAS (den viktigare halvan)"

forvanta SLAPP "OMDIRIGERING bevarar exitkoden — S97:s egen form" \
    'bash scripts/check-lifecycle.sh > /tmp/lc.txt 2>&1; echo "EXIT=$?"'
forvanta SLAPP "if-form: exitkoden ÄR villkoret" \
    'if bash scripts/check-lifecycle.sh; then echo ok; else echo stanna; fi'
forvanta SLAPP "|| KOD=\$? — den rekommenderade formen" \
    'bash scripts/check-backlog-closure.sh || KOD=$?'
# shellcheck disable=SC2016
# Enkelfnuttarna är avsikten: strängen är ett TESTFALL som skickas till hooken,
# inte kod som ska expandera här. Expanderade den vore testet meningslöst.
forvanta SLAPP "PIPESTATUS nämnd ⇒ skribenten är medveten" \
    'npx markdownlint-cli2 . | tail -1; echo "${PIPESTATUS[0]}"'
forvanta SLAPP "grind naket, ingen pipe" \
    'bash scripts/check-pausade-sessioner.sh'
forvanta SLAPP "vanlig pipe utan grind" \
    'git log --oneline -20 | grep S97'
forvanta SLAPP "gh-anrop genom jq — ingen grind inblandad" \
    'gh pr view 707 --json state | jq -r .state'
forvanta SLAPP "grind EFTER pipen äger sin egen exitkod" \
    'cat filer.txt | xargs shellcheck'
forvanta SLAPP "ls genom pipe" \
    'ls scripts/ | grep check'
forvanta SLAPP "while-loop med grind i villkoret" \
    'while bash scripts/check-lifecycle.sh; do sleep 1; done'

# ─── KOMMANDO-POSITION (S97 2026-08-04) ────────────────────────────────────
# Fallen nedan NÄMNER en grind men KÖR den aldrig — de läser dess källkod.
# Det första är en MÄTT falsk positiv: hooken fällde orkestrerarens `grep` mot
# hookens egen kod, och Marcus fick prompten. Under `ask` var det friktion;
# under `deny` hade det blivit en vägg mot en helt ofarlig läsning. Därför är
# dessa fall villkoret för att `deny` alls är försvarbart — faller något av
# dem, ska hooken tillbaka till `ask` innan den släpps lös.
forvanta SLAPP "MÄTT FALSK POSITIV: grep läser grindens källkod" \
    'grep -n "pipe-tecken" scripts/check-thread-index.sh | head -5'
forvanta SLAPP "cat av ett grind-skript" \
    'cat scripts/check-lifecycle.sh | wc -l'
# shellcheck disable=SC2016
# Samma skäl som PIPESTATUS-fallet ovan: strängen är ett TESTFALL som skickas
# till hooken, inte kod som ska expandera här.
forvanta SLAPP "wc med grind som filargument" \
    'wc -l scripts/check-backlog-closure.sh | awk "{print \$1}"'
forvanta SLAPP "rg som söker i grind-skript" \
    'rg "exit 1" scripts/check-lifecycle.sh | head -3'

# ─── pipefail BEVARAR EXITKODEN ────────────────────────────────────────────
# POSIX-världens standardsvar på exakt den fälla L440 beskriver. Att neka den
# formen vore att neka den korrekta lösningen.
forvanta SLAPP "set -o pipefail — pipen returnerar första icke-nollan" \
    'set -o pipefail; bash scripts/check-lifecycle.sh | tail -1'

echo
if [[ "${FEL}" -eq 0 ]]; then
    echo "✅ ${ANTAL}/${ANTAL} gröna."
    exit 0
fi
echo "❌ ${FEL} av ${ANTAL} röda."
exit 1
