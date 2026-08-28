#!/usr/bin/env bash
# scripts/test-deny-frammande-huvudkatalog.sh — tvåsidigt bevis för
# katalogägarskaps-mekanismen (T119 arbetslista (a) + T120, S97).
#
# TVÅSIDIGT betyder att BÅDA riktningarna prövas: planterade överträdelser
# ska NEKAS, och legitima kommandon ska SLÄPPAS. Ett test som bara visar att
# spärren fäller bevisar inte att den är användbar — det bevisar bara att den
# är en svepande blockering. Samma form som scripts/test-deny-resend-send.sh.
#
# Riggen bygger ett ÄKTA temporärt git-repo med en ÄKTA worktree, eftersom
# hela mekanismen vilar på hur git delar .git/ mellan huvudträd och worktrees
# (se .katalogagarskap-policy.conf § VARFÖR LAPPEN BOR I --git-common-dir).
# En mockad katalogstruktur hade prövat mocken, inte mekanismen.
#
# TÄCKER TRE SKRIPT (T120 delade upp mekanismen i tre delar):
#   - scripts/katalogagarskap-markor.sh   (SessionStart-rapport + --slapp)
#   - scripts/deny-frammande-huvudkatalog.sh (PreToolUse: prövning + tagande)
#   - scripts/katalogagarskap-slapp.sh    (SessionEnd-släpp)
#
# CI-PORTABILITET, MEDVETET: SIDA 5:s pid-derivations-tester (finn_cli_pid)
#   använder en TEMPORÄR policy-override (`policy_med_cli_monster`) i stället
#   för default-policyns `KATALOG_CLI_PROCESSNAMN=("claude")`. Skälet: denna
#   testriggens EGEN processkedja råkar innehålla en process vid namn
#   "Claude" när den körs i detta projekts VS Code-integrerade terminal
#   (mätt 2026-08-04), men INTE i CI (GitHub Actions har ingen sådan
#   process). Ett test som antog default-mönstrets träff hade alltså gett
#   OLIKA resultat lokalt kontra i CI — en tyst flake. Override:en gör
#   testet deterministiskt i BÅDA miljöerna genom att styra mönstret
#   explicit ("bash" — garanterat en förfader till varje skal; ett
#   omöjligt-mönster för negativa fallet) i stället för att förlita sig på
#   den omgivande maskinens processträd.
#
# INGEN TYSTNADS-MEKANIK HÄR, MEDVETET: ett tidsbaserat övertagande av en
#   LEVANDE men tyst ägare byggdes och FÖRKASTADES samma dag (Marcus:
#   "det kan ju bara vara så att jag behöver gå och bajsa..."). Se
#   deny-frammande-huvudkatalog.sh § ÄGARSKAP-TAGANDE, "FÖRKASTAT", och
#   ADR-090 § Update. En levande ägare nekar ALLTID (SIDA 4), oavsett tystnad.
#
# Körs: bash scripts/test-deny-frammande-huvudkatalog.sh
# Exit 0 = alla fall gröna. Exit 1 = minst ett fall rött.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="${SCRIPT_DIR}/deny-frammande-huvudkatalog.sh"
MARKOR_HOOK="${SCRIPT_DIR}/katalogagarskap-markor.sh"
SLAPP_HOOK="${SCRIPT_DIR}/katalogagarskap-slapp.sh"
POLICY="${SCRIPT_DIR}/../.katalogagarskap-policy.conf"

ANTAL=0
FEL=0

TMPROT="$(mktemp -d)"
# Kanoniserad DIREKT: macOS symlinkar /var -> /private/var, och `git
# rev-parse` löser upp symlinken internt. Utan detta skulle hookens EGET
# beräknade `huvudkatalog`-fält (/private/var/...) aldrig strängmatcha mot
# testriggens råa ${HUVUD} (/var/...) — fångat live 2026-08-04 (T120).
TMPROT="$(cd "${TMPROT}" && pwd -P)"
LEVANDE_PID=""
trap 'kill "${LEVANDE_PID}" 2>/dev/null; rm -rf "${TMPROT}"' EXIT

HUVUD="${TMPROT}/huvudrepo"
WT="${TMPROT}/worktree-b"
HOOK_LOGG="${TMPROT}/hook-fallningar.jsonl"

mkdir -p "${HUVUD}"
git -C "${HUVUD}" init -q -b main
git -C "${HUVUD}" config user.email "test@example.invalid"
git -C "${HUVUD}" config user.name "Testrigg"
echo "start" > "${HUVUD}/fil.txt"
git -C "${HUVUD}" add fil.txt
git -C "${HUVUD}" commit -q -m "init"
git -C "${HUVUD}" worktree add -q -b gren-b "${WT}"

COMMON_DIR="$(git -C "${HUVUD}" rev-parse --path-format=absolute --git-common-dir)"
# Deklareras före `source` så shellcheck ser dem som tilldelade (SC2154) —
# policyfilen är den som fyller dem, men verktyget kan inte följa dit.
KATALOG_MARKOR_FILNAMN=""
KATALOG_STALE_TIMMAR=""
# shellcheck source=/dev/null
source "${POLICY}"
MARKOR="${COMMON_DIR}/${KATALOG_MARKOR_FILNAMN}"

AGARE_SID="session-agaren-1111"
FRAMLING_SID="session-framlingen-2222"
TREDJE_SID="session-tredje-3333"

# ── PID-fixturer: äkta processer. ──────────────────────────────────────────
lstart_for() {
    local pid="$1" v
    v="$(ps -o lstart= -p "${pid}" 2>/dev/null)"
    v="${v#"${v%%[![:space:]]*}"}"
    v="${v%"${v##*[![:space:]]}"}"
    printf '%s' "${v}"
}

sleep 600 &
LEVANDE_PID=$!
LEVANDE_START="$(lstart_for "${LEVANDE_PID}")"

sleep 1 &
DOD_PID=$!
wait "${DOD_PID}" 2>/dev/null
# DOD_PID är nu garanterat inte körande (väntad in). Kortlivat fönster för
# PID-återanvändning av OS:et innan hooken prövar den — samma accepterade
# risk som produktionsmekanismen själv bär, se skriptets § LIVENESS-PRÖVNING.
DOD_START="spelar-ingen-roll-processen-kor-inte"

satt_markor() {
    local sid="$1" epoch="${2:-}" iso
    if [[ -z "${epoch}" ]]; then
        epoch="$(date +%s)" || return 1
    fi
    iso="$(date -u +%Y-%m-%dT%H:%M:%SZ)" || return 1
    jq -n --arg sid "${sid}" --arg huvud "${HUVUD}" \
        --arg iso "${iso}" --argjson epoch "${epoch}" \
        '{session_id: $sid, huvudkatalog: $huvud, satt_vid: $iso, satt_vid_epoch: $epoch}' \
        > "${MARKOR}"
}

# satt_markor_pid <sid> <pid> <pidstart>
satt_markor_pid() {
    local sid="$1" pid="$2" pidstart="$3" nu iso
    nu="$(date +%s)"
    iso="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    jq -n --arg sid "${sid}" --arg huvud "${HUVUD}" \
        --arg iso "${iso}" --argjson epoch "${nu}" \
        --argjson pid "${pid}" --arg pidstart "${pidstart}" \
        '{session_id: $sid, huvudkatalog: $huvud, satt_vid: $iso, satt_vid_epoch: $epoch,
          agare_pid: $pid, agare_pid_starttid: $pidstart}' \
        > "${MARKOR}"
}

# policy_med_cli_monster <monster> <utfil> — se § CI-PORTABILITET.
policy_med_cli_monster() {
    local monster="$1" ut="$2"
    cat "${POLICY}" > "${ut}"
    printf '\nKATALOG_CLI_PROCESSNAMN=("%s")\n' "${monster}" >> "${ut}"
}

# stad_arbetstrad — nollställer HUVUD:s arbetsträd + operationsmarkörer.
stad_arbetstrad() {
    git -C "${HUVUD}" reset --hard -q 2>/dev/null
    git -C "${HUVUD}" clean -fdq 2>/dev/null
    rm -f "${COMMON_DIR}/MERGE_HEAD" "${COMMON_DIR}/CHERRY_PICK_HEAD" 2>/dev/null
    rm -rf "${COMMON_DIR}/rebase-merge" "${COMMON_DIR}/rebase-apply" 2>/dev/null
}

falt() {
    # falt <jq-uttryck> — läser ett fält ur MARKOR, tom sträng om saknas/trasig.
    jq -r "$1 // empty" "${MARKOR}" 2>/dev/null
}

# kor <cwd> <session_id> <kommando> [policy] → hookens stdout
kor() {
    local cwd="$1" sid="$2" cmd="$3" pol="${4:-${POLICY}}"
    jq -nc --arg cwd "${cwd}" --arg sid "${sid}" --arg cmd "${cmd}" \
        '{tool_name: "Bash", session_id: $sid, cwd: $cwd, tool_input: {command: $cmd}}' \
        | KATALOG_POLICY="${pol}" HOOK_LOGG="${HOOK_LOGG}" bash "${HOOK}" 2>/dev/null
}

# beslut <hook-stdout> → "NEKA" eller "SLAPP"
beslut() {
    if printf '%s' "$1" | jq -e '.hookSpecificOutput.permissionDecision == "deny"' >/dev/null 2>&1; then
        printf 'NEKA'
    else
        printf 'SLAPP'
    fi
}

# har_varning <hook-stdout> — sant om ett allow-svar bär en additionalContext.
har_varning() {
    printf '%s' "$1" | jq -e \
        '.hookSpecificOutput.permissionDecision == "allow" and ((.hookSpecificOutput.additionalContext // "") | length > 0)' \
        >/dev/null 2>&1
}

# forvanta <NEKA|SLAPP> <beskrivning> <cwd> <sid> <kommando> [policy]
forvanta() {
    local vantat="$1" desc="$2" cwd="$3" sid="$4" cmd="$5" pol="${6:-${POLICY}}"
    ANTAL=$((ANTAL + 1))
    local ut faktiskt
    ut="$(kor "${cwd}" "${sid}" "${cmd}" "${pol}")"
    faktiskt="$(beslut "${ut}")"
    if [[ "${faktiskt}" = "${vantat}" ]]; then
        printf '  ✅ %-58s [%s]\n' "${desc}" "${faktiskt}"
    else
        printf '  ❌ %-58s [fick %s, väntade %s]\n' "${desc}" "${faktiskt}" "${vantat}"
        FEL=$((FEL + 1))
    fi
}

# pastar <beskrivning> <villkor 0|1>
pastar() {
    local desc="$1" ok="$2"
    ANTAL=$((ANTAL + 1))
    if [[ "${ok}" -eq 0 ]]; then
        printf '  ✅ %-58s\n' "${desc}"
    else
        printf '  ❌ %-58s\n' "${desc}"
        FEL=$((FEL + 1))
    fi
}

echo "═══ Katalogägarskaps-mekanismen (T119 + T120) — tvåsidigt bevis ═══"
echo
echo "Rigg: huvudrepo ${HUVUD}"
echo "      worktree  ${WT}"
echo "      lapp      ${MARKOR}"
echo "      pid-fixtur levande=${LEVANDE_PID} död=${DOD_PID}"
echo

# ═══ SIDA 1 — S96:s FAKTISKA regressionsfall (lapp i ÄLDRE form, utan pid)
#     ska NEKAS ═══
echo "SIDA 1 — planterade överträdelser (äldre lappform, ägarlapp: ${AGARE_SID})"
satt_markor "${AGARE_SID}"

forvanta NEKA "S96:s faktiska fel 1: ff-merge i huvudkatalogen" \
    "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main"
forvanta NEKA "S96:s faktiska fel 2: gren skapad i huvudkatalogen" \
    "${HUVUD}" "${FRAMLING_SID}" "git switch -c docs/t116-konvergens-kadens"
forvanta NEKA "commit i huvudkatalogen" \
    "${HUVUD}" "${FRAMLING_SID}" "git commit -m 'test'"
forvanta NEKA "git -C <huvudkatalog> från en worktree" \
    "${WT}" "${FRAMLING_SID}" "git -C ${HUVUD} merge --ff-only origin/main"
forvanta NEKA "cd <huvudkatalog> && git från en worktree" \
    "${WT}" "${FRAMLING_SID}" "cd ${HUVUD} && git reset --hard origin/main"
forvanta NEKA "skrivning gömd som andra led i en kedja" \
    "${HUVUD}" "${FRAMLING_SID}" "git status && git rebase origin/main"
forvanta NEKA "git -c före underkommandot maskerar inte skrivningen" \
    "${HUVUD}" "${FRAMLING_SID}" "git -c core.editor=true commit --amend"
forvanta NEKA "worktree add är en skrivning" \
    "${HUVUD}" "${FRAMLING_SID}" "git worktree add ../nytt"

# ── SIDA 2 — legitima kommandon ska SLÄPPAS ────────────────────────────────
echo
echo "SIDA 2 — legitima kommandon"

forvanta SLAPP "ÄGAREN får skriva i sin egen huvudkatalog" \
    "${HUVUD}" "${AGARE_SID}" "git merge --ff-only origin/main"
forvanta SLAPP "främling arbetar i SIN EGEN worktree" \
    "${WT}" "${FRAMLING_SID}" "git commit -m 'arbete i egen worktree'"
forvanta SLAPP "ren läsning i huvudkatalogen" \
    "${HUVUD}" "${FRAMLING_SID}" "git status --short"
forvanta SLAPP "git log är ingen skrivning" \
    "${HUVUD}" "${FRAMLING_SID}" "git log --oneline -5"
forvanta SLAPP "git fetch är medvetet undantagen (additiv på refs)" \
    "${HUVUD}" "${FRAMLING_SID}" "git fetch origin"
forvanta SLAPP "git worktree list är en läsning" \
    "${HUVUD}" "${FRAMLING_SID}" "git worktree list"
forvanta SLAPP "icke-git-kommando i huvudkatalogen" \
    "${HUVUD}" "${FRAMLING_SID}" "npm run build"
forvanta SLAPP "ordet 'git' i ett annat sammanhang" \
    "${HUVUD}" "${FRAMLING_SID}" "echo 'legitimate merge of two datasets'"

# ── SIDA 3 — fail-open och gränsfall ───────────────────────────────────────
echo
echo "SIDA 3 — fail-open och gränsfall"

echo "{ trasig json" > "${MARKOR}"
forvanta SLAPP "oläsbar lapp failar ÖPPET (medvetet, se skripthuvudet)" \
    "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main"

satt_markor "${AGARE_SID}"
ANTAL=$((ANTAL + 1))
UT_STALE="$(kor "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main")"
if printf '%s' "${UT_STALE}" | jq -e '.hookSpecificOutput.permissionDecisionReason | contains("stale") | not' >/dev/null 2>&1; then
    printf '  ✅ %-58s [%s]\n' "färsk lapp nämner INTE stale" "NEKA"
else
    printf '  ❌ %-58s\n' "färsk lapp nämner INTE stale"
    FEL=$((FEL + 1))
fi

NU="$(date +%s)"
satt_markor "${AGARE_SID}" "$(( NU - KATALOG_STALE_TIMMAR * 3600 - 60 ))"
ANTAL=$((ANTAL + 1))
UT_GAMMAL="$(kor "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main")"
if printf '%s' "${UT_GAMMAL}" | jq -e '.hookSpecificOutput.permissionDecisionReason | contains("stale-tröskeln")' >/dev/null 2>&1; then
    printf '  ✅ %-58s [%s]\n' "gammal lapp (ingen pid) fäller MEN flaggar stale" "NEKA"
else
    printf '  ❌ %-58s\n' "gammal lapp (ingen pid) fäller MEN flaggar stale"
    FEL=$((FEL + 1))
fi

# ═══ SIDA 4 — PID-LIVENESS (T120, § LIVENESS-PRÖVNING) ═══
echo
echo "SIDA 4 — PID-liveness"

satt_markor_pid "${AGARE_SID}" "${LEVANDE_PID}" "${LEVANDE_START}"
forvanta NEKA "levande pid ⇒ nekar ALLTID (ingen tystnads-väg finns)" \
    "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main"

satt_markor_pid "${AGARE_SID}" "${DOD_PID}" "${DOD_START}"
forvanta SLAPP "död pid ⇒ släpper (huvudkat.-session tar över)" \
    "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main"
# SC2312-säkert i HELA denna sida: varje kommandosubstitution extraheras
# till en egen variabel FÖRE `[[ ]]`-testet, aldrig nästlad inuti det —
# annars flaggar den strikta lintern (--enable=all) att substitutionens
# EGEN exitkod maskeras, även när den bara används för sitt stdout i en
# strängjämförelse.
VAL="$(falt '.session_id')"
if [[ "${VAL}" = "${FRAMLING_SID}" ]]; then OK=0; else OK=1; fi
pastar "död pid: lappen finns kvar men bytt ägare (ÖVERTAGEN, inte bara raderad)" "${OK}"

satt_markor_pid "${AGARE_SID}" "${LEVANDE_PID}" "ett-helt-annat-tidsstampel-som-inte-matchar"
forvanta SLAPP "pid återanvänd (samma pid, ANNAN starttid) ⇒ släpper" \
    "${HUVUD}" "${FRAMLING_SID}" "git merge --ff-only origin/main"
VAL="$(falt '.session_id')"
if [[ "${VAL}" = "${FRAMLING_SID}" ]]; then OK=0; else OK=1; fi
pastar "återanvänd pid: lappen tagen över av den nya sessionen" "${OK}"

echo "  (gammal lappform utan pid ⇒ redan bevisat i SIDA 1+3 — samma väg)"

# ═══ SIDA 5 — ÄGARSKAP-TAGANDE: TAS vid SKRIVNING, inte vid ankomst ═══
echo
echo "SIDA 5 — ägarskap-tagande (T120, andra designtillägget)"

rm -f "${MARKOR}"
forvanta SLAPP "läsande git-kommando utan lapp ⇒ ingen lapp skapas" \
    "${HUVUD}" "${FRAMLING_SID}" "git status --short"
if [[ ! -f "${MARKOR}" ]]; then OK=0; else OK=1; fi
pastar "... verifierat: ingen lapp skapades" "${OK}"

rm -f "${MARKOR}"
forvanta SLAPP "skrivande git-kommando UTAN lapp, huvudkat.-session ⇒ lappen TAS" \
    "${HUVUD}" "${TREDJE_SID}" "git commit -m 'första skrivningen'"
VAL="$(falt '.session_id')"
VAL2="$(falt '.huvudkatalog')"
if [[ "${VAL}" = "${TREDJE_SID}" && "${VAL2}" = "${HUVUD}" ]]; then OK=0; else OK=1; fi
pastar "... verifierat: lappen finns nu, rätt session_id + huvudkatalog" "${OK}"

rm -f "${MARKOR}"
forvanta SLAPP "skrivande kommando UTAN lapp, kommandot bara PEKAR (worktree) ⇒ inget tas" \
    "${WT}" "${FRAMLING_SID}" "git -C ${HUVUD} commit -m 'pekar dit'"
if [[ ! -f "${MARKOR}" ]]; then OK=0; else OK=1; fi
pastar "... verifierat: fortfarande ingen lapp (pekande session tar inte hemvist)" "${OK}"

satt_markor_pid "${AGARE_SID}" "${LEVANDE_PID}" "${LEVANDE_START}"
forvanta SLAPP "skrivande kommando med EGEN lapp ⇒ släpps, ORÖRD (ingen tystnads-klocka)" \
    "${HUVUD}" "${AGARE_SID}" "git commit -m 'ännu en skrivning'"
VAL="$(falt '.session_id')"
if [[ "${VAL}" = "${AGARE_SID}" ]]; then OK=0; else OK=1; fi
pastar "... verifierat: lappen är fortfarande min (session_id oförändrad)" "${OK}"

satt_markor_pid "${AGARE_SID}" "${DOD_PID}" "${DOD_START}"
forvanta SLAPP "huvudkat.-session + FRÄMMANDE DÖD lapp ⇒ TAS ÖVER" \
    "${HUVUD}" "${TREDJE_SID}" "git commit -m 'tar över'"
VAL="$(falt '.session_id')"
if [[ "${VAL}" = "${TREDJE_SID}" ]]; then OK=0; else OK=1; fi
pastar "... verifierat: ny ägare registrerad (${TREDJE_SID})" "${OK}"

satt_markor_pid "${AGARE_SID}" "${DOD_PID}" "${DOD_START}"
forvanta SLAPP "PEKANDE worktree-session + FRÄMMANDE DÖD lapp ⇒ rivs, INGEN ny ägare" \
    "${WT}" "${FRAMLING_SID}" "git -C ${HUVUD} commit -m 'pekar mot en död lapp'"
if [[ ! -f "${MARKOR}" ]]; then OK=0; else OK=1; fi
pastar "... verifierat: lappen är helt borta (ingen tog över den)" "${OK}"

# CI-portabel prövning av finn_cli_pid, se § CI-PORTABILITET överst.
rm -f "${MARKOR}"
policy_med_cli_monster "bash" "${TMPROT}/policy-traff.conf"
forvanta SLAPP "PID-derivering: CLI-mönstret TRÄFFAR (garanterat, 'bash')" \
    "${HUVUD}" "${TREDJE_SID}" "git commit -m 'pid-derivering trff'" \
    "${TMPROT}/policy-traff.conf"
VAL="$(falt '.agare_pid')"
if [[ "${VAL}" != "" ]]; then OK=0; else OK=1; fi
pastar "... verifierat: agare_pid ÄR satt (icke-null) när mönstret träffar" "${OK}"

rm -f "${MARKOR}"
policy_med_cli_monster "xyz-finns-garanterat-inte-nagonstans-zzz" "${TMPROT}/policy-ejtraff.conf"
forvanta SLAPP "PID-derivering: CLI-mönstret TRÄFFAR EJ (garanterat omöjligt)" \
    "${HUVUD}" "${TREDJE_SID}" "git commit -m 'pid-derivering ej trff'" \
    "${TMPROT}/policy-ejtraff.conf"
VAL="$(falt '.agare_pid')"
if [[ "${VAL}" = "" ]]; then OK=0; else OK=1; fi
pastar "... verifierat: agare_pid är null (fail-open) när inget mönster träffar" "${OK}"

# ═══ SIDA 6 — VARNING VID SMUTSIGT ARBETSTRÄD (Marcus-fångst, sista
#     tillägget: en död process kan lämna ocommittat arbete kvar på disk) ═══
echo
echo "SIDA 6 — varning vid smutsigt arbetsträd (dödfall-övertagande)"

stad_arbetstrad

satt_markor_pid "${AGARE_SID}" "${DOD_PID}" "${DOD_START}"
UT="$(kor "${HUVUD}" "${TREDJE_SID}" "git commit -m 'ren overtagning'")"
BSL="$(beslut "${UT}")"
if [[ "${BSL}" = "SLAPP" ]] && ! har_varning "${UT}"; then OK=0; else OK=1; fi
pastar "död ägare + RENT träd ⇒ övertas TYST (ingen varning)" "${OK}"
stad_arbetstrad

echo "ändring" >> "${HUVUD}/fil.txt"
satt_markor_pid "${AGARE_SID}" "${DOD_PID}" "${DOD_START}"
UT="$(kor "${HUVUD}" "${TREDJE_SID}" "git commit -m 'overtagning modifierad fil'")"
BSL="$(beslut "${UT}")"
if [[ "${BSL}" = "SLAPP" ]] && har_varning "${UT}"; then OK=0; else OK=1; fi
pastar "död ägare + MODIFIERAD spårad fil ⇒ övertas MED varning" "${OK}"
stad_arbetstrad

echo "ändring" >> "${HUVUD}/fil.txt"
git -C "${HUVUD}" add fil.txt
satt_markor_pid "${AGARE_SID}" "${DOD_PID}" "${DOD_START}"
UT="$(kor "${HUVUD}" "${TREDJE_SID}" "git commit -m 'overtagning staged'")"
BSL="$(beslut "${UT}")"
if [[ "${BSL}" = "SLAPP" ]] && har_varning "${UT}"; then OK=0; else OK=1; fi
pastar "död ägare + STAGED ändring ⇒ övertas MED varning" "${OK}"
stad_arbetstrad

touch "${COMMON_DIR}/MERGE_HEAD"
satt_markor_pid "${AGARE_SID}" "${DOD_PID}" "${DOD_START}"
UT="$(kor "${HUVUD}" "${TREDJE_SID}" "git commit -m 'overtagning pagaende merge'")"
BSL="$(beslut "${UT}")"
if [[ "${BSL}" = "SLAPP" ]] && har_varning "${UT}"; then OK=0; else OK=1; fi
pastar "död ägare + PÅGÅENDE merge (MERGE_HEAD) ⇒ övertas MED varning" "${OK}"
stad_arbetstrad

echo "otrackat innehåll" > "${HUVUD}/otrackad-fil.txt"
satt_markor_pid "${AGARE_SID}" "${DOD_PID}" "${DOD_START}"
UT="$(kor "${HUVUD}" "${TREDJE_SID}" "git commit -m 'overtagning otrackad'")"
BSL="$(beslut "${UT}")"
if [[ "${BSL}" = "SLAPP" ]] && ! har_varning "${UT}"; then OK=0; else OK=1; fi
pastar "död ägare + ENDAST otrackad fil ⇒ övertas TYST (otrackade räknas inte)" "${OK}"
stad_arbetstrad

# ═══ SIDA 7 — --slapp-läge (katalogagarskap-markor.sh, T120 tredje
#     designtillägget) ═══
echo
echo "SIDA 7 — --slapp-läge"

# kor_markor_slapp <cwd> <sid> → stdout+stderr på stdout.
# VARFÖR EXITKODEN INTE SÄTTS SOM SIDOEFFEKT HÄR: `VAR="$(fn ...)"` kör `fn`
# i en SUBSHELL — en global tilldelning DÄRINNE (t.ex. `SLAPP_EXIT=$?`) syns
# aldrig i föräldraskalet. Fångat live (T120): felet var bokstavligen
# "SLAPP_EXIT: unbound variable" under `set -u`. Rätt form: läs `$?` direkt
# i ANROPARENS skal, precis efter kommandosubstitutionen — bash sätter `$?`
# till substitutionens exitkod där, inget separat globalt tillstånd behövs.
kor_markor_slapp() {
    local cwd="$1" sid="$2"
    jq -nc --arg cwd "${cwd}" --arg sid "${sid}" \
        '{session_id: $sid, cwd: $cwd, hook_event_name: "SessionStart"}' \
        | KATALOG_POLICY="${POLICY}" bash "${MARKOR_HOOK}" --slapp 2>&1
}

satt_markor "${AGARE_SID}"
ANTAL=$((ANTAL + 1))
SLAPP_UT="$(kor_markor_slapp "${HUVUD}" "${AGARE_SID}")"
SLAPP_EXIT=$?
if [[ "${SLAPP_EXIT}" -eq 0 && ! -f "${MARKOR}" ]]; then
    printf '  ✅ %-58s [%s]\n' "--slapp med EGEN lapp ⇒ lappen borta, exit 0" "SLAPP"
else
    if [[ -f "${MARKOR}" ]]; then KVAR="ja"; else KVAR="nej"; fi
    printf '  ❌ %-58s [exit=%s, kvarvarande=%s]\n' "--slapp med EGEN lapp ⇒ lappen borta, exit 0" "${SLAPP_EXIT}" "${KVAR}"
    FEL=$((FEL + 1))
fi

satt_markor "${AGARE_SID}"
ANTAL=$((ANTAL + 1))
SLAPP_UT="$(kor_markor_slapp "${HUVUD}" "${FRAMLING_SID}")"
SLAPP_EXIT=$?
AGARE_EFTER_SLAPP="$(falt '.session_id')"
NAMNS_FEL=0
printf '%s' "${SLAPP_UT}" | grep -qi "ANNAN session" || NAMNS_FEL=1
if [[ "${SLAPP_EXIT}" -ne 0 && -f "${MARKOR}" && "${AGARE_EFTER_SLAPP}" = "${AGARE_SID}" && "${NAMNS_FEL}" -eq 0 ]]; then
    printf '  ✅ %-58s [%s]\n' "--slapp med FRÄMMANDE lapp ⇒ ORÖRD, tydligt fel, exit≠0" "ORÖRD"
else
    printf '  ❌ %-58s [exit=%s]\n' "--slapp med FRÄMMANDE lapp ⇒ ORÖRD, tydligt fel, exit≠0" "${SLAPP_EXIT}"
    FEL=$((FEL + 1))
fi

rm -f "${MARKOR}"
ANTAL=$((ANTAL + 1))
kor_markor_slapp "${HUVUD}" "${AGARE_SID}" >/dev/null 2>&1
SLAPP_EXIT=$?
if [[ "${SLAPP_EXIT}" -eq 0 && ! -f "${MARKOR}" ]]; then
    printf '  ✅ %-58s [%s]\n' "--slapp utan NÅGON lapp ⇒ no-op, exit 0" "NO-OP"
else
    printf '  ❌ %-58s\n' "--slapp utan NÅGON lapp ⇒ no-op, exit 0"
    FEL=$((FEL + 1))
fi

# ═══ SIDA 8 — SessionEnd-släpp (scripts/katalogagarskap-slapp.sh) ═══
echo
echo "SIDA 8 — SessionEnd-släpp"

kor_sessionend() {
    local cwd="$1" sid="$2"
    jq -nc --arg cwd "${cwd}" --arg sid "${sid}" \
        '{session_id: $sid, cwd: $cwd, reason: "clear"}' \
        | KATALOG_POLICY="${POLICY}" bash "${SLAPP_HOOK}" >/dev/null 2>&1
}

satt_markor "${AGARE_SID}"
kor_sessionend "${HUVUD}" "${AGARE_SID}"
if [[ ! -f "${MARKOR}" ]]; then OK=0; else OK=1; fi
pastar "SessionEnd, matchande session_id ⇒ lappen borta" "${OK}"

satt_markor "${AGARE_SID}"
kor_sessionend "${HUVUD}" "${FRAMLING_SID}"
VAL="$(falt '.session_id')"
if [[ -f "${MARKOR}" && "${VAL}" = "${AGARE_SID}" ]]; then OK=0; else OK=1; fi
pastar "SessionEnd, ANNAN session_id ⇒ lappen ORÖRD" "${OK}"

# ═══ SIDA 9 — markör-hooken (SessionStart): RAPPORTERAR, SKRIVER ALDRIG ═══
echo
echo "SIDA 9 — markör-hooken (SessionStart) skriver ALDRIG (T120, kärnan i ändringen)"

kor_markor() {
    local cwd="$1" sid="$2"
    jq -nc --arg cwd "${cwd}" --arg sid "${sid}" \
        '{session_id: $sid, cwd: $cwd, hook_event_name: "SessionStart"}' \
        | KATALOG_POLICY="${POLICY}" bash "${MARKOR_HOOK}" >/dev/null 2>&1
}

rm -f "${MARKOR}"
kor_markor "${HUVUD}" "${FRAMLING_SID}"
if [[ ! -f "${MARKOR}" ]]; then OK=0; else OK=1; fi
pastar "SessionStart i huvudkatalogen, INGEN lapp fanns ⇒ INGEN lapp skapas" "${OK}"

rm -f "${MARKOR}"
kor_markor "${WT}" "${FRAMLING_SID}"
if [[ ! -f "${MARKOR}" ]]; then OK=0; else OK=1; fi
pastar "SessionStart i en worktree ⇒ fortsatt ingen lapp (redan garanterat ovan)" "${OK}"

satt_markor "${AGARE_SID}"
kor_markor "${HUVUD}" "${FRAMLING_SID}"
VAL="$(falt '.session_id')"
if [[ "${VAL}" = "${AGARE_SID}" ]]; then OK=0; else OK=1; fi
pastar "SessionStart möter FRÄMMANDE lapp ⇒ lämnas ORÖRD (stjäl aldrig)" "${OK}"

# ═══ SIDA 9b — RAPPORTENS INNEHÅLL: bär BÅDA vägarna handlingsregeln? ═══
#
#   SIDA 9 ovan prövar bara att hooken inte SKRIVER. Att den RAPPORTERAR
#   rätt sak prövades aldrig — och i den luckan levde en skarp bugg
#   (S93, 2026-08-05): stale-grenens text nämnde `rm` som enda handling och
#   saknade worktree-regeln som normalgrenen bar. En resume-session mötte en
#   LEVANDE ägare vars lapp råkade vara >1 h gammal, fick stale-grenen, och
#   STOPPADE för att fråga Marcus i stället för att ta en worktree.
#   Se scripts/katalogagarskap-markor.sh § EN REGEL, EN STRÄNG.
echo
echo "SIDA 9b — rapportens innehåll (S93-buggen: stale-grenen tappade regeln)"

# Som kor_markor, men returnerar hookens stdout i stället för att kasta den.
markor_rapport() {
    local cwd="$1" sid="$2"
    jq -nc --arg cwd "${cwd}" --arg sid "${sid}" \
        '{session_id: $sid, cwd: $cwd, hook_event_name: "SessionStart"}' \
        | KATALOG_POLICY="${POLICY}" bash "${MARKOR_HOOK}" 2>/dev/null
}

# rapport_text <hook-stdout> → additionalContext-strängen (tom om ingen)
rapport_text() {
    printf '%s' "$1" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null
}

NU_9B="$(date +%s)"

# (a) FÄRSK främmande lapp — normalgrenen. Bar regeln redan före fixen.
satt_markor "${AGARE_SID}" "${NU_9B}"
UT_9B_FARSK="$(markor_rapport "${HUVUD}" "${FRAMLING_SID}")"
TXT_9B_FARSK="$(rapport_text "${UT_9B_FARSK}")"
case "${TXT_9B_FARSK}" in *worktree*) OK=0 ;; *) OK=1 ;; esac
pastar "färsk lapp ⇒ rapporten nämner worktree-vägen" "${OK}"

# (b) GAMMAL främmande lapp — stale-grenen. DETTA var buggen: föll före fixen.
satt_markor "${AGARE_SID}" "$(( NU_9B - KATALOG_STALE_TIMMAR * 3600 - 60 ))"
UT_9B_GAMMAL="$(markor_rapport "${HUVUD}" "${FRAMLING_SID}")"
TXT_9B_GAMMAL="$(rapport_text "${UT_9B_GAMMAL}")"
case "${TXT_9B_GAMMAL}" in *worktree*) OK=0 ;; *) OK=1 ;; esac
pastar "GAMMAL lapp ⇒ rapporten nämner worktree-vägen (S93-regressionen)" "${OK}"

# (c) Stale-grenen får inte lämna `rm` som enda handlingsalternativ — det var
#     just den inramningen som gjorde situationen till en död/levande-fråga.
case "${TXT_9B_GAMMAL}" in
    *"ADR-090 beslut 2"*) OK=0 ;;
    *) OK=1 ;;
esac
pastar "GAMMAL lapp ⇒ rapporten citerar ADR-090 beslut 2, inte bara rm" "${OK}"

# (d) Regeln ska komma ur EN delad sträng: samma nyckelmening i BÅDA vägarna.
#     Divergerar de igen är det exakt återfallet fixen finns för att hindra.
REGEL_NYCKEL="den senare arbetar i en egen worktree"
if [[ "${TXT_9B_FARSK}" == *"${REGEL_NYCKEL}"* && "${TXT_9B_GAMMAL}" == *"${REGEL_NYCKEL}"* ]]; then
    OK=0
else
    OK=1
fi
pastar "båda rapportvägarna bär IDENTISK regel-mening (delad källa)" "${OK}"

# (e) Regeln ska säga att detta INTE eskaleras — det var felbeteendet.
case "${TXT_9B_GAMMAL}" in
    *"inte en eskalering till Marcus"*) OK=0 ;;
    *) OK=1 ;;
esac
pastar "GAMMAL lapp ⇒ rapporten säger uttryckligen att det ej eskaleras" "${OK}"

# (f) Kontraktet i skripthuvudet: additionalContext bär PÅSTÅENDEN, aldrig
#     imperativ (injektionsförsvaret). Deny-textens versala "ARBETA I DIN EGEN
#     WORKTREE" hör hemma i permissionDecisionReason — inte här.
case "${TXT_9B_GAMMAL}" in
    *"ARBETA I DIN EGEN WORKTREE"*) OK=1 ;;
    *) OK=0 ;;
esac
pastar "rapporten är deklarativ — ingen imperativ deny-formulering" "${OK}"

# ═══ SIDA 10 — fällnings-logg (T120, observerbarhet) ═══
echo
echo "SIDA 10 — fällnings-logg"

rm -f "${HOOK_LOGG}"
satt_markor_pid "${AGARE_SID}" "${LEVANDE_PID}" "${LEVANDE_START}"
kor "${HUVUD}" "${FRAMLING_SID}" "git commit -m 'ska loggas'" >/dev/null
ANTAL=$((ANTAL + 1))
if [[ -f "${HOOK_LOGG}" ]] && tail -1 "${HOOK_LOGG}" | jq -e \
    '.hook == "deny-frammande-huvudkatalog" and (.skal_nyckel | length > 0) and (.ts | length > 0) and (.kommando | length > 0)' \
    >/dev/null 2>&1; then
    printf '  ✅ %-58s [%s]\n' "en NEKANDE lägger till en fällnings-rad med rätt fält" "LOGGAD"
else
    printf '  ❌ %-58s\n' "en NEKANDE lägger till en fällnings-rad med rätt fält"
    FEL=$((FEL + 1))
fi

RADER_FORE="$(wc -l < "${HOOK_LOGG}" 2>/dev/null || echo 0)"
kor "${HUVUD}" "${AGARE_SID}" "git status --short" >/dev/null
RADER_EFTER="$(wc -l < "${HOOK_LOGG}" 2>/dev/null || echo 0)"
if [[ "${RADER_FORE}" -eq "${RADER_EFTER}" ]]; then OK=0; else OK=1; fi
pastar "ett SLÄPP loggar INTE en ny rad" "${OK}"

# ═══ SIDA 11 — MÅLSTYRD KLASSNING (TASK-322) ═══
#
#   VARFÖR EN EGEN RIGG: riggen överst lägger worktreen BREDVID huvudrepot
#   (${TMPROT}/worktree-b). Produktionen gör tvärtom — Claude Code lägger
#   worktrees i <huvudkatalog>/.claude/worktrees/<namn>, alltså UNDER
#   huvudkatalogen. Den skillnaden är inte kosmetisk: den gamla väg 2 matchade
#   huvudkatalogens sökväg som DELSTRÄNG, och varje worktree-sökväg BÄR den
#   som prefix. Hela den falska-positiv-klassen var därför strukturellt
#   osynlig för riggen ovan — den kunde inte uppstå där. En testrigg som inte
#   speglar produktionens topologi bevisar mekanismen i fel värld.
#
#   TVÅSIDIGT genomgående: varje falsk positiv som ska SLÄPPAS paras med den
#   äkta skrivning mot samma yta som fortfarande ska NEKAS. Annars vore ett
#   grönt facit förenligt med en hook som slutat fälla över huvud taget.
echo
echo "SIDA 11 — målstyrd klassning (TASK-322)"

P_HUVUD="${TMPROT}/prod-topologi/huvudrepo"
mkdir -p "${P_HUVUD}"
git -C "${P_HUVUD}" init -q -b main
git -C "${P_HUVUD}" config user.email "test@example.invalid"
git -C "${P_HUVUD}" config user.name "Testrigg"
echo "start" > "${P_HUVUD}/fil.txt"
git -C "${P_HUVUD}" add fil.txt
git -C "${P_HUVUD}" commit -q -m "init"
# PRODUKTIONENS topologi: worktreen UNDER huvudkatalogen.
P_WT="${P_HUVUD}/.claude/worktrees/agent-x"
git -C "${P_HUVUD}" worktree add -q -b gren-x "${P_WT}"
P_COMMON="$(git -C "${P_HUVUD}" rev-parse --path-format=absolute --git-common-dir)"
P_MARKOR="${P_COMMON}/${KATALOG_MARKOR_FILNAMN}"

# Främmande + BEVISLIGEN LEVANDE ägare ⇒ varje TRÄFF nekar. Allt som släpps
# nedan släpps därför för att klassningen inte träffade — aldrig för att
# ägarprövningen råkade ge vika.
# SC2312-säkert: substitutionerna extraheras FÖRE anropet, aldrig nästlade
# i argumentlistan (samma form som SIDA 4 redan följer).
NU_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
NU_EPOCH="$(date +%s)"
jq -n --arg sid "${AGARE_SID}" --arg huvud "${P_HUVUD}" \
    --arg iso "${NU_ISO}" --argjson epoch "${NU_EPOCH}" \
    --argjson pid "${LEVANDE_PID}" --arg pidstart "${LEVANDE_START}" \
    '{session_id: $sid, huvudkatalog: $huvud, satt_vid: $iso, satt_vid_epoch: $epoch,
      agare_pid: $pid, agare_pid_starttid: $pidstart}' > "${P_MARKOR}"

echo "  (rigg: worktree UNDER huvudkatalogen, som i produktion)"

# ── 11a. Instansklass "cd + git-checkout" — kortets första instans ────────
forvanta SLAPP "cd <worktree> && git checkout, cwd=HUVUDKATALOGEN" \
    "${P_HUVUD}" "${FRAMLING_SID}" "cd ${P_WT} && git checkout -b ny-gren"
forvanta SLAPP "git -C <worktree> checkout, cwd=HUVUDKATALOGEN" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git -C ${P_WT} checkout -b ny-gren"
forvanta NEKA "MOTPROV: cd <huvudkatalog> && git checkout, cwd=worktree" \
    "${P_WT}" "${FRAMLING_SID}" "cd ${P_HUVUD} && git checkout -b ny-gren"
forvanta NEKA "MOTPROV: git -C <huvudkatalog> checkout, cwd=worktree" \
    "${P_WT}" "${FRAMLING_SID}" "git -C ${P_HUVUD} checkout -b ny-gren"

# ── 11b. Instansklass "branch --merged" — läsning kontra skrivning ────────
forvanta SLAPP "git branch --merged är en LÄSNING" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch --merged"
forvanta SLAPP "git branch --merged <commit> (värdet är inte ett grennamn)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch --merged main"
forvanta SLAPP "git branch --list" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch --list"
forvanta SLAPP "git branch --list <mönster> (absolut läsflagga slår positionell)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch --list 'feat/*'"
forvanta SLAPP "git branch --show-current" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch --show-current"
forvanta SLAPP "git branch -a (ren listning)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch -a"
forvanta SLAPP "git branch utan argument (listar)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch"
forvanta SLAPP "git branch -a genom pipe (kortets live-instans)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch -a | wc -l"
forvanta SLAPP "git tag --list" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git tag --list"
forvanta SLAPP "git stash list" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git stash list"
forvanta SLAPP "git stash show" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git stash show"
forvanta NEKA "MOTPROV: git branch -d <gren> är en SKRIVNING" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch -d gammal-gren"
forvanta NEKA "MOTPROV: git branch -D <gren>" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch -D gammal-gren"
forvanta NEKA "MOTPROV: git branch <nytt-namn> (positionellt = skapa)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch helt-ny-gren"
forvanta NEKA "MOTPROV: git branch -m gammal ny (byt namn)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch -m gammal ny"
forvanta NEKA "MOTPROV: git branch -u origin/main (sätter upstream)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch -u origin/main"
forvanta NEKA "MOTPROV: git tag -d <tagg>" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git tag -d v1.0.0"
forvanta NEKA "MOTPROV: git tag <namn> (positionellt = skapa)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git tag v2.0.0"
forvanta NEKA "MOTPROV: git stash (bart = push, en SKRIVNING)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git stash"
forvanta NEKA "MOTPROV: git stash pop" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git stash pop"

# ── 11b-bis. STAPLADE korta flaggor — Codex CLI:s approval-bypass ────────
#   `git branch -vd gammal` raderar en gren utan att bära ett ensamt `-d`.
#   OpenAI Codex CLI PR #10258 listar "grouped short-flag delete forms" som
#   en faktisk auto-approval-bypass; deras `short_flag_group_contains(arg,
#   'd')` är precedenten för vår `_kort_grupp_har_skrivflagga`. Belägg:
#   docs/research/git-las-skriv-klassning-och-malkatalog-2026-08-28.md
#   § Delfråga 3.1.
forvanta NEKA "STAPLAD: git branch -vd <gren> (d gömd i grupp)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch -vd gammal-gren"
forvanta NEKA "STAPLAD: git branch -dv <gren> (omvänd ordning)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch -dv gammal-gren"
forvanta NEKA "STAPLAD: git branch -Dq <gren> (versalt D i grupp)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch -Dq gammal-gren"
forvanta NEKA "LIKHETSFORM: git branch --delete=<gren>" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch --delete=gammal-gren"
forvanta NEKA "GLOBAL FLAGGA FÖRE: git -c color.ui=false branch -d <gren>" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git -c color.ui=false branch -d gammal"
forvanta SLAPP "MOTPROV: git branch -av (grupp UTAN skrivtecken)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch -av"
forvanta SLAPP "MOTPROV: git branch -vv (grupp UTAN skrivtecken)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch -vv"
forvanta SLAPP "MOTPROV: git branch --sort=refname (läsflagga med värde)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git branch --sort=refname"
forvanta SLAPP "MOTPROV: git tag -n5 (siffra i kort-grupp)" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git tag -n5"

# ── 11c. Instansklass "worktree remove + prune" ───────────────────────────
#   STÄLLNINGSTAGANDE (skriptets § WORKTREE-OPERATIONER): ADR-090 beslut 2
#   skyddar huvudträdets ARBETSTRÄD och index — inte worktree-REGISTRET. En
#   session som tar bort sin EGEN worktree rör inte ägarens arbete.
forvanta SLAPP "git worktree remove <EGEN worktree>, cwd=worktree" \
    "${P_WT}" "${FRAMLING_SID}" "git worktree remove ${P_WT}"
forvanta SLAPP "git worktree prune från egen worktree" \
    "${P_WT}" "${FRAMLING_SID}" "git worktree prune"
forvanta SLAPP "git worktree remove + prune i samma kedja, cwd=worktree" \
    "${P_WT}" "${FRAMLING_SID}" "git worktree remove ${P_WT} && git worktree prune"
forvanta SLAPP "git worktree list är fortsatt en läsning" \
    "${P_WT}" "${FRAMLING_SID}" "git worktree list"
forvanta NEKA "MOTPROV: worktree-operation KÖRD I huvudkatalogen" \
    "${P_HUVUD}" "${FRAMLING_SID}" "git worktree prune"
forvanta NEKA "MOTPROV: git -C <huvudkatalog> worktree add" \
    "${P_WT}" "${FRAMLING_SID}" "git -C ${P_HUVUD} worktree add ../ny"

# ── 11d. Klass (c)/(d): worktree-sökvägen BÄR huvudkatalogens som prefix ──
forvanta SLAPP "git commit i EGEN worktree (sökvägen prefixas av huvudkat.)" \
    "${P_WT}" "${FRAMLING_SID}" "git -C ${P_WT} commit -m 'arbete'"
forvanta SLAPP "cd <egen worktree> && git commit, cwd=worktree" \
    "${P_WT}" "${FRAMLING_SID}" "cd ${P_WT} && git commit -m 'arbete'"
forvanta SLAPP "heredoc vars TEXT bär git-ord + worktree-sökväg" \
    "${P_WT}" "${FRAMLING_SID}" "cat > ${P_WT}/f.sh <<'EOF'
git -C \"\$HUVUD\" add fil.txt
EOF"
forvanta NEKA "MOTPROV: samma form men mot HUVUDKATALOGEN" \
    "${P_WT}" "${FRAMLING_SID}" "git -C ${P_HUVUD} commit -m 'arbete'"

# ── 11e. Instansklass "/private/tmp-arbetskatalog" ────────────────────────
#   macOS symlänkar /tmp -> /private/tmp, så `git rev-parse` svarar
#   /private/tmp/... medan cwd och kommandot bär /tmp/.... Målupplösningen
#   normaliserar med `cd … && pwd -P` och blir därför symlänk-okänslig.
#   PORTABELT: på Linux (CI) finns ingen sådan symlänk — testet är då en
#   trivial identitet, men bevisar fortfarande att vägen inte kraschar.
S_ROT="$(mktemp -d /tmp/t322-symlank-XXXXXX 2>/dev/null || mktemp -d)"
S_HUVUD="${S_ROT}/huvudrepo"
mkdir -p "${S_HUVUD}"
git -C "${S_HUVUD}" init -q -b main
git -C "${S_HUVUD}" config user.email "test@example.invalid"
git -C "${S_HUVUD}" config user.name "Testrigg"
echo "start" > "${S_HUVUD}/fil.txt"
git -C "${S_HUVUD}" add fil.txt
git -C "${S_HUVUD}" commit -q -m "init"
S_WT="${S_HUVUD}/.claude/worktrees/agent-y"
git -C "${S_HUVUD}" worktree add -q -b gren-y "${S_WT}"
S_COMMON="$(git -C "${S_HUVUD}" rev-parse --path-format=absolute --git-common-dir)"
S_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
S_EPOCH="$(date +%s)"
jq -n --arg sid "${AGARE_SID}" --arg huvud "${S_HUVUD}" \
    --arg iso "${S_ISO}" --argjson epoch "${S_EPOCH}" \
    --argjson pid "${LEVANDE_PID}" --arg pidstart "${LEVANDE_START}" \
    '{session_id: $sid, huvudkatalog: $huvud, satt_vid: $iso, satt_vid_epoch: $epoch,
      agare_pid: $pid, agare_pid_starttid: $pidstart}' \
    > "${S_COMMON}/${KATALOG_MARKOR_FILNAMN}"

forvanta SLAPP "arbete i egen worktree under /tmp-sökväg" \
    "${S_WT}" "${FRAMLING_SID}" "git commit -m 'arbete'"
forvanta SLAPP "cd <worktree> && git checkout, /tmp-sökväg, cwd=huvudkat." \
    "${S_HUVUD}" "${FRAMLING_SID}" "cd ${S_WT} && git checkout -b ny"
forvanta NEKA "MOTPROV: skrivning mot huvudkatalogen via /tmp-sökväg" \
    "${S_WT}" "${FRAMLING_SID}" "git -C ${S_HUVUD} reset --hard"
rm -rf "${S_ROT}"

# ── 11f. Reservvägen: målet går INTE att upplösa ──────────────────────────
#   En oexpanderad variabel i sökvägen gör målet okänt. Då — och bara då —
#   faller klassningen tillbaka på textmönstret, som nu matchar
#   huvudkatalogen som HEL sökväg.
forvanta NEKA "oupplösligt mål + huvudkatalogen nämnd som HEL sökväg" \
    "${P_WT}" "${FRAMLING_SID}" "git -C \"\${OKAND}\" reset --hard ${P_HUVUD}"
forvanta SLAPP "oupplösligt mål + bara en UNDERKATALOG nämnd (worktree)" \
    "${P_WT}" "${FRAMLING_SID}" "git -C \"\${OKAND}\" reset --hard ${P_WT}"
forvanta SLAPP "obefintlig målkatalog under huvudkat. ⇒ ingen träff" \
    "${P_WT}" "${FRAMLING_SID}" "git -C ${P_HUVUD}/finns-inte-alls commit -m x"

# ═══ SIDA 12 — GIT-DIR, MILJÖPREFIX OCH SUBSHELL (TASK-322 runda 2) ═══
#
#   VARFÖR DENNA SIDA FINNS: granskningen av PR #2044 fann en
#   SÄKERHETSREGRESSION som runda 1 införde. Den nya reservvägens regel "en
#   träff följd av / är en underkatalog och räknas inte" — avsedd för
#   worktree-sökvägar — exkluderade lika blint huvudkatalogens EGEN
#   `.git`-katalog. Följden: `git --git-dir=<HUVUD>/.git commit` SLÄPPTES
#   från en främmande session med levande ägare, där origin/main NEKADE.
#   Skarpt bevisat verkningsfullt: en `GIT_DIR=<HUVUD>/.git git reset --hard
#   HEAD~1` från en främmande worktree flyttade faktiskt huvudkatalogens
#   branch-ref bakåt.
#
#   Två KVARSTÅENDE hål av samma klass (pre-existing, alltså inte införda av
#   runda 1 men heller inte stängda av den) stängs här samtidigt:
#     - `GIT_DIR=… git …` — inline miljöprefix gjorde att segmentets första
#       ord inte var `git`, så klassningen hoppade över det HELT.
#     - `(cd <HUVUD>; git push)` — `;`-segmenteringen lämnade `push)` med ett
#       hopklistrat `)`, som aldrig matchar `push` i skrivlistan.
#
#   Sidan är tvåsidig i FYRA riktningar, inte två: skrivningar mot
#   huvudträdet nekas · samma former som LÄSNINGAR släpps · ÄGAREN själv
#   släpps genom alla former · en WORKTREES egen git-dir släpps (den är inte
#   huvudträdet). Utan de tre sista vore ett grönt facit förenligt med en
#   hook som helt enkelt nekar allt som nämner en sökväg.
echo
echo "SIDA 12 — git-dir, miljöprefix och subshell (TASK-322 runda 2)"

P_GITDIR="${P_COMMON}"
P_WT_GITDIR="${P_COMMON}/worktrees/agent-x"

# ── 12a. De sju elaka formerna: SKRIVNINGAR mot huvudträdet ⇒ NEKA ────────
forvanta NEKA "git --git-dir=<H>/.git commit (REGRESSIONEN)" \
    "${P_WT}" "${FRAMLING_SID}" "git --git-dir=${P_GITDIR} commit -m x"
forvanta NEKA "git --git-dir <H>/.git commit (särskrivet värde)" \
    "${P_WT}" "${FRAMLING_SID}" "git --git-dir ${P_GITDIR} commit -m x"
forvanta NEKA "GIT_DIR=<H>/.git git reset --hard (miljöprefix)" \
    "${P_WT}" "${FRAMLING_SID}" "GIT_DIR=${P_GITDIR} git reset --hard"
forvanta NEKA "GIT_WORK_TREE=<H> git checkout -f" \
    "${P_WT}" "${FRAMLING_SID}" "GIT_WORK_TREE=${P_HUVUD} git checkout -f"
forvanta NEKA "GIT_DIR + GIT_WORK_TREE i kombination" \
    "${P_WT}" "${FRAMLING_SID}" "GIT_DIR=${P_GITDIR} GIT_WORK_TREE=${P_HUVUD} git commit -m x"
forvanta NEKA "env GIT_DIR=<H>/.git git commit (env-omslag)" \
    "${P_WT}" "${FRAMLING_SID}" "env GIT_DIR=${P_GITDIR} git commit -m x"
forvanta NEKA "(cd <H>; git push) — subshell med semikolon" \
    "${P_WT}" "${FRAMLING_SID}" "(cd ${P_HUVUD}; git push)"
forvanta NEKA "(cd <H> && git commit) — subshell med &&" \
    "${P_WT}" "${FRAMLING_SID}" "(cd ${P_HUVUD} && git commit -m x)"
forvanta NEKA "( git -C <H> branch -d x ) — subshell med mellanrum" \
    "${P_WT}" "${FRAMLING_SID}" "( git -C ${P_HUVUD} branch -d x )"

# ── 12b. Samma former som LÄSNINGAR ⇒ SLÄPP (AC #2 håller genom git-dir) ──
forvanta SLAPP "git --git-dir=<H>/.git log" \
    "${P_WT}" "${FRAMLING_SID}" "git --git-dir=${P_GITDIR} log --oneline"
forvanta SLAPP "GIT_DIR=<H>/.git git status" \
    "${P_WT}" "${FRAMLING_SID}" "GIT_DIR=${P_GITDIR} git status --short"
forvanta SLAPP "git --git-dir=<H>/.git branch --merged" \
    "${P_WT}" "${FRAMLING_SID}" "git --git-dir=${P_GITDIR} branch --merged"
forvanta SLAPP "(cd <H>; git status) — subshell, ren läsning" \
    "${P_WT}" "${FRAMLING_SID}" "(cd ${P_HUVUD}; git status --short)"

# ── 12c. ÄGAREN själv släpps genom varje form ────────────────────────────
forvanta SLAPP "ÄGAREN: --git-dir= commit" \
    "${P_HUVUD}" "${AGARE_SID}" "git --git-dir=${P_GITDIR} commit -m x"
forvanta SLAPP "ÄGAREN: GIT_DIR= reset --hard" \
    "${P_HUVUD}" "${AGARE_SID}" "GIT_DIR=${P_GITDIR} git reset --hard"
forvanta SLAPP "ÄGAREN: (cd <H>; git push)" \
    "${P_HUVUD}" "${AGARE_SID}" "(cd ${P_HUVUD}; git push)"

# ── 12d. En WORKTREES egen git-dir är INTE huvudträdet ⇒ SLÄPP ───────────
#   <COMMON>/worktrees/<namn> bär worktreens egen HEAD och index. En
#   skrivning dit rör inte huvudträdets refs, och ska därför inte fällas.
forvanta SLAPP "--git-dir=<COMMON>/worktrees/agent-x commit" \
    "${P_WT}" "${FRAMLING_SID}" "git --git-dir=${P_WT_GITDIR} commit -m x"
forvanta SLAPP "GIT_DIR=<COMMON>/worktrees/agent-x reset" \
    "${P_WT}" "${FRAMLING_SID}" "GIT_DIR=${P_WT_GITDIR} git reset --hard"
forvanta SLAPP "(cd <egen worktree>; git commit)" \
    "${P_WT}" "${FRAMLING_SID}" "(cd ${P_WT}; git commit -m x)"
forvanta SLAPP "( git -C <egen worktree> branch -d x )" \
    "${P_WT}" "${FRAMLING_SID}" "( git -C ${P_WT} branch -d x )"

# ── 12e. Avslagstexten visar den GIT-UPPLÖSTA toppnivån ──────────────────
#   `git -C ..` från en worktree UNDER huvudkatalogen landar via gits
#   uppåtgående sökning på repo-roten. Att skriva ut mellansteget
#   (`…/.claude/worktrees`, som inte ens är en repo-rot) förvirrar den som
#   läser avslaget för att felsöka.
ANTAL=$((ANTAL + 1))
UT_12E="$(kor "${P_WT}" "${FRAMLING_SID}" "git -C .. branch -d x")"
SKAL_12E="$(printf '%s' "${UT_12E}" | jq -r '.hookSpecificOutput.permissionDecisionReason // empty' 2>/dev/null)"
if [[ "${SKAL_12E}" == *"${P_HUVUD}"* && "${SKAL_12E}" != *".claude/worktrees)"* ]]; then
    printf '  ✅ %-58s [%s]\n' "relativt -C: texten visar repo-roten, ej mellansteget" "NEKA"
else
    printf '  ❌ %-58s\n' "relativt -C: texten visar repo-roten, ej mellansteget"
    FEL=$((FEL + 1))
fi

# ── 12f. git-dir-träffens skäl namnger den delade git-katalogen ──────────
ANTAL=$((ANTAL + 1))
UT_12F="$(kor "${P_WT}" "${FRAMLING_SID}" "git --git-dir=${P_GITDIR} commit -m x")"
SKAL_12F="$(printf '%s' "${UT_12F}" | jq -r '.hookSpecificOutput.permissionDecisionReason // empty' 2>/dev/null)"
case "${SKAL_12F}" in
    *"git-katalogen"*"${P_GITDIR}"*) OK=0 ;;
    *) OK=1 ;;
esac
pastar "git-dir-träffens skäl namnger den delade git-katalogen" "${OK}"

echo
if [[ "${FEL}" -eq 0 ]]; then
    echo "✅ ${ANTAL}/${ANTAL} gröna."
    exit 0
fi
echo "❌ ${FEL} av ${ANTAL} röda."
exit 1
