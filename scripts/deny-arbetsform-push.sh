#!/usr/bin/env bash
# scripts/deny-arbetsform-push.sh — ADR-097 § Beslut del 2, "(a) Spärr vid
# handlingen".
#
# VARFÖR SKRIPTET FINNS: `T126` mätte att iterations-kadensens regel
#   (`prototype`-skillen § 5 — lokal commit per varv, EN push när Marcus
#   säger klart) fanns skriven, färsk och mätunderbyggd, och ändå aldrig
#   lästes andra gången — sessionen kom in via `session-resume`, en väg som
#   aldrig laddar den skillen. `ADR-097` mekaniserar principen "arbetsformens
#   regler bärs av TILLSTÅND som mekanismer läser, inte av prosa i
#   startdörrar": en otrackad, per-arbetsträd tillståndsfil
#   (scripts/arbetsform-tillstand.sh sätter/rensar/läser den) sätts när ett
#   push-förbjudande läge inleds, och DENNA hook läser den vid varje
#   `git push`-försök — level-triggered och väg-oberoende, oavsett vilken
#   dörr sessionen kom in genom.
#
# VAD DEN PRÖVAR OCH GÖR: matchar `tool_input.command` mot git push-former
#   (direkta, `&&`/`;`/`|`-kedjade, `$(...)`/backtick-inbäddade — se
#   § MÖNSTER-MATCHNING nedan), och nekar BARA när tillståndsfilen (funnen i
#   ARBETSTRÄDETS ROT, se § VARFÖR cwd OCH INTE CLAUDE_PROJECT_DIR nedan)
#   bär en arbetsform som står i policyns ARBETSFORM_PUSH_FORBJUDNA-lista.
#
# ═══ PREMISS-PASSET (ADR-086, TASK-149.3 AC 1) — MÄTT DIVERGENS ═══
#
#   Uppdraget bad om ett skript "som körs via ${CLAUDE_PROJECT_DIR:-.}" —
#   samma mönster deny-grind-genom-pipe.sh/deny-subagent-vantan.sh använder
#   för att hitta SIG SJÄLVA (`SCRIPT_DIR` härlett ur `BASH_SOURCE[0]`, som i
#   sin tur kom från settings.json:s `${CLAUDE_PROJECT_DIR:-.}/scripts/...`).
#   Det mönstret är KORREKT för att hitta SKRIPTFILEN — men fel för att hitta
#   TILLSTÅNDSFILEN, och skillnaden är mätt, inte antagen:
#
#   Minimaltest (byggsessionen, 2026-08-07): en redan LADDAD, redan aktiv
#   hook (deny-grind-genom-pipe.sh) triggades från DENNA worktree-isolerade
#   agentsession med ett harmlöst, nekat kommando (`shellcheck --version |
#   head -1`). Dess fällnings-logg — skriven till
#   `${SCRIPT_DIR}/../.claude/hook-fallningar.jsonl`, dvs.
#   `${CLAUDE_PROJECT_DIR:-.}/.claude/hook-fallningar.jsonl` — landade i
#   HUVUDKATALOGENS `.claude/`, INTE i denna agents egen worktree
#   (`/Users/.../.claude/worktrees/agent-a51b402a11bf7d0cd/.claude/` förblev
#   tom). `${CLAUDE_PROJECT_DIR:-.}` resolvar alltså till HUVUDKATALOGEN
#   oavsett vilket arbetsträd den anropande agenten faktiskt sitter i — INTE
#   per-arbetsträd, tvärtemot vad uppdragets ordalydelse antog.
#
#   En "per-arbetsträd" tillståndsfil funnen via `${CLAUDE_PROJECT_DIR:-.}`
#   hade alltså ALDRIG synts för en worktree-isolerad agents egna push-försök
#   — mekanismen hade varit trasig för exakt den målgrupp (bygg-agenter i
#   egna worktrees) ADR-097 § Beslut del 2 uttryckligen räknar in.
#
#   RÄTT FÄLT, redan etablerat i repot: hook-JSON:ets `cwd`-fält (dokumenterat
#   "Current working directory when the hook is invoked" — PER ANROP, till
#   skillnad från den statiska `CLAUDE_PROJECT_DIR`-miljövariabeln) är exakt
#   det fält scripts/deny-frammande-huvudkatalog.sh redan läser och `cd`:ar
#   till (rad ~452–457) INNAN den kör `git rev-parse` för att avgöra vilket
#   träd sessionen faktiskt står i — och scripts/agent-spawn-log.sh klassar
#   redan `.cwd`-mönstret `/\.claude/worktrees/` för att skilja
#   worktree-sessioner från huvudkatalogs-sessioner. Denna hook återanvänder
#   SAMMA, redan produktionsbevisade mönster: läs `.cwd`, `cd` dit, kör
#   `git rev-parse --show-toplevel` för att hitta ARBETSTRÄDETS ROT —
#   INTE `${CLAUDE_PROJECT_DIR:-.}`.
#
#   Ytterligare bevis, samma pass: en kastbar test-worktree skapades
#   (`git worktree add`), en otrackad markörfil skrevs i dess rot, och
#   `git -C <kastbar-worktree> rev-parse --show-toplevel` gav den worktreens
#   EGEN rot (skild från huvudkatalogen OCH från byggagentens egen
#   worktree) — filen lästes korrekt DÄRIFRÅN och existerade INTE i
#   huvudkatalogen. Worktreen städades (`git worktree remove --force`)
#   efter provet.
#
#   Konsekvens för DENNA hook: `${CLAUDE_PROJECT_DIR:-.}` används ENDAST för
#   att hitta skriptets EGEN policyfil (samma roll som i alla syskonhookar —
#   en stabil, delad, huvudkatalogs-förankrad config är RÄTT för det). Varje
#   sökväg som rör TILLSTÅNDSFILEN går via `HOOK_CWD` (`.cwd`) →
#   `git rev-parse --show-toplevel`, se § ARBETSTRÄDETS ROT nedan.
#
#   Detta ÄR en divergens mot uppdragets ordalydelse (ADR-086), men INTE en
#   blockerande sådan: den korrekta mekanismen har redan etablerad,
#   produktionsbevisad precedens i SAMMA repo (deny-frammande-huvudkatalog.sh),
#   och kräver inget Marcus-vägval — bokförd öppet här och i slutrapporten,
#   inte tyst ersatt.
#
# ═══ ARBETSTRÄDETS ROT ═══
#
#   scripts/arbetsform-tillstand.sh (sättaren/läsaren, körd som VANLIGT
#   Bash-anrop av en agent/skill — INTE som hook) löser sin egen
#   arbetsträdes-rot via `git rev-parse --show-toplevel` körd från sitt eget
#   `pwd` (en agents Bash-anrop har inget `CLAUDE_PROJECT_DIR` satt i sin
#   miljö — verifierat: `printenv CLAUDE_PROJECT_DIR` gav exit 1 i denna
#   byggsessions egna Bash-anrop — så den vanliga `pwd`/`git rev-parse`-vägen
#   är den ENDA som fungerar där också). BÅDA sidor (sättare + hook) landar
#   därmed på SAMMA sökväg för SAMMA session, via SAMMA mekanism
#   (`git rev-parse --show-toplevel`, skild bara i VILKEN katalog kommandot
#   körs FRÅN) — konsekvent utan att någon sida behöver känna till den andra.
#
# ═══ MÖNSTER-MATCHNING — git push-former ═══
#
#   Modell: scripts/deny-grind-genom-pipe.sh:s princip (KOMMANDO-POSITION,
#   inte argument-position — `echo "git push"` nämner men kör aldrig push)
#   + scripts/deny-frammande-huvudkatalog.sh:s segmenterings-/
#   flagg-hoppnings-motor (`sudo`, `-C <path>`, `-c <k=v>`, `--git-dir <path>`
#   m.fl. hoppas över innan subkommandot avläses).
#
#   UTÖKAT härifrån, eftersom `git push` inte behöver stå intill en pipe för
#   att vara farligt: kommandosträngen delas INTE bara på `;`/`&`/`|`
#   (deny-frammande-huvudkatalog.sh:s bas) utan ÄVEN på varje
#   kommandosubstitutions-ÖPPNING (`$(` och backtick) — en substitution KÖR
#   sitt innehåll även inbäddad i en sträng (`OUT=$(git push origin main)`,
#   `echo "$(git push)"`), så innehållet måste prövas som ett EGET segment.
#   Detta är approximativt (ingen fullständig shell-parser byggs — samma
#   medvetna grovhet som deny-frammande-huvudkatalog.sh § SCOPE-GRÄNSER: en
#   `git push` gömd i en heredoc-BODY som skrivs till en FIL utan att
#   exekveras fångas inte, och en relativ path-omväg fångas inte). Varje
#   segment prövas oberoende, inte bara det sista (till skillnad från
#   deny-grind-genom-pipe.sh, som bara behöver det sista ledet FÖRE en pipe
#   — en push kan stå var som helst i en kedja).
#
# ═══ FAIL-OPEN vs FAIL-CLOSED, MEN SCOPAT (spegling av
#      deny-subagent-vantan.sh § F5/F6) ═══
#
#   Uppdraget pekar uttryckligen ut F5/F6-distinktionen (INTE F1–F4) som
#   förebild — och det är en medveten skillnad, inte en försummelse:
#
#   OPARSBAR HOOK-INDATA (jq saknas, tom stdin, `tool_name`/`tool_input`
#   går inte att läsa) → FAIL-OPEN (exit 0), INTE fail-closed. Skälet är
#   damage-klassen: en missad push under iteration kostar 10–30 minuters
#   mutex-kö (T116/T126, mätt) — ALLVARLIGT men ÅTERSTÄLLBART, samma klass
#   deny-grind-genom-pipe.sh redan är fail-open för ("En trasig hook som
#   nekar allt vore värre" — att neka VARJE Bash-kommando i HELA repot
#   närhelst jq råkar saknas vore en oproportionerlig blast-radie för en
#   återställbar skada). Detta AVVIKER MEDVETET från deny-subagent-vantan.sh
#   F1–F4 (som fail-closar även här, eftersom DEN skadan — en subagent
#   parkerad strukturellt, ~700k tokens — är i en allvarligare klass).
#
#   SCOPAT FAIL-CLOSED (spegling av F5/F6): väl inne i "detta ÄR ett
#   git push-försök"-grenen (kommandot har redan matchat mönstret ovan) är
#   blast-radien begränsad till PUSH-FÖRSÖK specifikt, inte hela repots
#   Bash-yta. Därför NEKAS (exit 2):
#     - tillståndsfilen EXISTERAR men går inte att tolka som JSON, eller
#       saknar ett icke-tomt `arbetsform`-fält ("korrupt fil") — kan inte
#       avgöra om push är säkert, och vi vet redan att detta ÄR ett
#       push-försök.
#     - policyfilen saknas/är otolkbar/har en TOM ARBETSFORM_PUSH_FORBJUDNA
#       OCH tillståndsfilen bär ett icke-tomt `arbetsform`-värde — samma
#       princip som deny-subagent-vantan.sh: "ett tomt regelverk är inte
#       'inget att neka', det är ett trasigt lås."
#   FRÅNVARO av tillståndsfil vinner ALLTID över ett trasigt policy-läge
#   (§ F6 i testsviten) — "kan inte avgöra om det ska nekas" uppstår bara
#   när det FINNS något att avgöra.
#
# INPUT: PreToolUse hook-JSON på stdin — `tool_name`, `tool_input.command`,
#   `cwd` (samtliga verifierade ordagrant mot code.claude.com/docs/en/hooks.md
#   i premiss-passet ovan, 2026-08-07).
#
# Testsvit: scripts/test-deny-arbetsform-push.sh (tvåsidigt bevis: D
#   fäller/A släpper/F fail-closed-scopat, samma familjeform som
#   scripts/test-deny-subagent-vantan.sh).
#
# SKARPBEVIS ÄR EN ÖPPEN SKULD (CLAUDE.md § "En ny hook kan ALDRIG
#   skarpbevisas i sessionen som byggde den"): registreras i
#   .claude/settings.json i SAMMA session som bygger den, och tas därför
#   INTE i bruk förrän nästa session. Logiken är bevisad tvåsidigt i
#   byggsessionen (testsvit + manuell körning mot verkligt tillstånd, inkl.
#   den kastbara test-worktreen ovan). Betalas nästa session med samma
#   differentialmätning som deny-subagent-vantan.sh:s skuld: provocera en
#   REDAN laddad hook (t.ex. deny-grind-genom-pipe.sh) parallellt för att
#   skilja "fel logik här" från "ej laddad än".
#
# Källa: ADR-097-arbetsformens-tillstandsbarare.md § Beslut del 2 ·
#        tasks/threads/T126-arbetsformens-leveransvag.md ·
#        scripts/deny-frammande-huvudkatalog.sh (cwd-mönstret) ·
#        scripts/deny-grind-genom-pipe.sh (kommando-position-mönstret) ·
#        scripts/deny-subagent-vantan.sh (F5/F6-scopningsmönstret) ·
#        scripts/arbetsform-tillstand.sh (sättare/läsare) ·
#        code.claude.com/docs/en/hooks.md
# Etablerad: TASK-149.3, 2026-08-07

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARBETSFORM_POLICY="${ARBETSFORM_POLICY:-${SCRIPT_DIR}/../.arbetsform-push-policy.conf}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

# neka <skäl> — stderr (det agenten ser) + exit 2, den enda väg som
# garanterat blockerar oavsett vad stdout innehåller (samma kontrakt som
# scripts/deny-subagent-vantan.sh, se § FAIL-OPEN vs FAIL-CLOSED ovan).
neka() {
    printf 'ARBETSFORMENS TILLSTÅNDSBÄRARE (ADR-097, TASK-149.3): %s\n' "$1" >&2
    exit 2
}

# ── Steg 1: tolka hook-indatan. Oparsbart → FAIL-OPEN (exit 0), se
# § FAIL-OPEN vs FAIL-CLOSED ovan — denna gren är AVSIKTLIGT INTE scopad,
# till skillnad från deny-subagent-vantan.sh:s motsvarande gren, eftersom
# damage-klassen här är återställbar snarare än allvarlig.
jq_version_ok > /dev/null 2>&1 || exit 0

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || exit 0

TOOL_NAME="$(printf '%s' "${INPUT}" | jq -r '.tool_name // empty' 2> /dev/null)"
[[ "${TOOL_NAME}" = "Bash" ]] || exit 0

COMMAND="$(printf '%s' "${INPUT}" | jq -r '.tool_input.command // empty' 2> /dev/null)"
[[ -n "${COMMAND}" ]] || exit 0

# ── Steg 2: matchar kommandot en git push-form? § MÖNSTER-MATCHNING ovan.
# Absolut MAJORITETEN av alla Bash-anrop slutar här (exit 0) — detta MÅSTE
# vara friktionsfritt.

# _ar_push_segment <segment> — kommando-position, inte argument-position.
# Hoppar sudo-prefix + globala git-flaggor med värde innan subkommandot
# avläses (samma motor som deny-frammande-huvudkatalog.sh:s _prova_segment).
_ar_push_segment() {
    local seg="$1"
    # shellcheck disable=SC2086
    set -- ${seg}
    [[ "${1:-}" = "sudo" ]] && shift
    case "${1:-}" in
        git | */git) shift ;;
        *) return 1 ;;
    esac
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -C | -c) shift 2 2> /dev/null || return 1 ;;
            --git-dir | --work-tree | --namespace | --exec-path) shift 2 2> /dev/null || return 1 ;;
            --*=*) shift ;;
            -*) shift ;;
            *) break ;;
        esac
    done
    [[ "${1:-}" = "push" ]]
}

# ar_git_push <command> — delar på ;/&/| (deny-frammande-huvudkatalog.sh:s
# bas) OCH på varje $(/backtick-öppning (utökningen, se § MÖNSTER-MATCHNING).
# `sed` körs FÖRE `tr` så en redan utbytt $( inte stör tr:s teckenklass.
ar_git_push() {
    local cmd="$1" segmenterade segment
    # shellcheck disable=SC2016
    # Enkelfnuttarna i sed-uttrycket ÄR avsikten: $( ska matchas som BOKSTAV,
    # inte expanderas av det egna skalet innan sed ens ser det.
    # shellcheck disable=SC2020
    # tr:s ersättningsset ';|&' -> '\n\n\n' är MEDVETET tre identiska tecken —
    # varje separator-TECKEN ska var för sig bli en radbrytning (teckenvis
    # ersättning, samma avsikt som deny-frammande-huvudkatalog.sh:s
    # motsvarande rad).
    segmenterade="$(printf '%s\n' "${cmd}" | sed -e 's/\$(/\n/g' -e 's/`/\n/g' | tr ';|&' '\n\n\n')" || return 1
    while IFS= read -r segment; do
        [[ -n "${segment//[[:space:]]/}" ]] || continue
        _ar_push_segment "${segment}" && return 0
    done <<< "${segmenterade}"
    return 1
}

ar_git_push "${COMMAND}" || exit 0

# ── Från denna punkt: bekräftat push-försök. Resten av hooken är SCOPAD
# till detta — se § FAIL-OPEN vs FAIL-CLOSED, MEN SCOPAT ovan.

# ── Steg 3: arbetsträdets rot via cwd, INTE ${CLAUDE_PROJECT_DIR:-.} — se
# § PREMISS-PASSET + § ARBETSTRÄDETS ROT ovan för den mätta divergensen.
HOOK_CWD="$(printf '%s' "${INPUT}" | jq -r '.cwd // empty' 2> /dev/null)"
[[ -n "${HOOK_CWD}" && -d "${HOOK_CWD}" ]] || exit 0
ARBETSTRAD_ROT="$(cd "${HOOK_CWD}" 2> /dev/null && git rev-parse --show-toplevel 2> /dev/null)"
[[ -n "${ARBETSTRAD_ROT}" ]] || exit 0

# ── Steg 4: läs policyn, BEST-EFFORT. En SAKNAD/TRASIG policy FÅR INTE
# hindra frånvaro-regeln (steg 5) från att vinna — annars skulle ett
# trasigt policy-läge kunna neka en VANLIG push utan någon aktiv
# tillståndsfil alls, vilket bryter AC 3:s uttryckliga "frånvaro av fil =
# släpp igenom" (fångat av testsviten F9/F10, se § SCOPAT FAIL-CLOSED
# ovan). FILNAMN faller tillbaka på ett INBYGGT default (samma värde
# policyns egen default har) om policyn saknas eller inte definierar det —
# så "var ska jag LETA" aldrig beror på en trasig policy, bara "vad
# betyder det jag HITTAR" gör.
ARBETSFORM_PUSH_FORBJUDNA=()
POLICY_LADDAD="false"
if [[ -f "${ARBETSFORM_POLICY}" ]]; then
    # shellcheck source=/dev/null
    if source "${ARBETSFORM_POLICY}" 2> /dev/null; then
        POLICY_LADDAD="true"
    fi
fi
FILNAMN="${ARBETSFORM_TILLSTAND_FILNAMN:-.claude/arbetsform-tillstand.json}"
TILLSTANDSFIL="${ARBETSTRAD_ROT}/${FILNAMN}"

# ── Steg 5: frånvaro av fil = släpp igenom. Detta är AC 3:s uttryckliga
# krav och VINNER ALLTID — oavsett policyns skick, se § F6/F10 i
# testsviten.
[[ -f "${TILLSTANDSFIL}" ]] || exit 0

# ── Från denna punkt: tillståndsfilen EXISTERAR. Policy-relaterat
# fail-closed gäller HÄRIFRÅN — scopat till "en aktiv tillståndsfil
# finns", inte till "ett push-försök skedde" (den bredare scopningen från
# steg 2). Se § F9 i testsviten.
[[ "${POLICY_LADDAD}" = "true" ]] || neka "policyfilen ${ARBETSFORM_POLICY} saknas eller gick inte att läsa (syntaxfel?), men tillståndsfilen ${TILLSTANDSFIL} EXISTERAR — kan inte avgöra vilka arbetsformer som förbjuder push (fail-closed, scopat till en aktiv tillståndsfil). Detta är hookens eget fel, inte ditt."

# ── Steg 6: läs arbetsform ur tillståndsfilen. Korrupt/otolkbar/tomt fält
# → NEKA (fail-closed, scopat — vi vet redan att detta är ett push-försök
# MOT en existerande tillståndsfil).
ARBETSFORM="$(jq -r '.arbetsform // empty' < "${TILLSTANDSFIL}" 2> /dev/null)"
[[ -n "${ARBETSFORM}" ]] || neka "tillståndsfilen ${TILLSTANDSFIL} finns men går inte att tolka, eller saknar ett arbetsform-fält (korrupt fil, fail-closed enligt AC 3). Kan inte avgöra om push är säkert under ett push-försök. Rensa tillståndsfilen om den är kvarlämnad: bash scripts/arbetsform-tillstand.sh rensa. Detta är annars hookens eget fel, inte ditt."
# Egna kommandosubstitutioner (inte inbäddade i neka-anropet nedan) — SC2312
# undviks genom att fånga varje jq-utfall i en egen variabel FÖRST, samma
# disciplin som scripts/deny-frammande-huvudkatalog.sh:s § kommandosubstitution.
SATT_VID="$(jq -r '.satt_vid // "okänt"' < "${TILLSTANDSFIL}" 2> /dev/null)"
SATTARE="$(jq -r '.sattare // "okänd"' < "${TILLSTANDSFIL}" 2> /dev/null)"

# ── Steg 7: TOM policy-lista, men ett arbetsform-värde FINNS → trasigt lås,
# NEKA (samma princip som deny-subagent-vantan.sh F7).
[[ "${#ARBETSFORM_PUSH_FORBJUDNA[@]}" -gt 0 ]] || neka "policyn ${ARBETSFORM_POLICY} definierar noll förbjudna arbetsformer, men tillståndsfilen bär arbetsform '${ARBETSFORM}' — ett tomt regelverk är inte 'inget att neka', det är ett trasigt lås (fail-closed, scopat till push-försök). Detta är hookens eget fel, inte ditt."

# ── Steg 8: är den aktiva arbetsformen push-förbjudande?
for forbjuden in "${ARBETSFORM_PUSH_FORBJUDNA[@]:-}"; do
    [[ -n "${forbjuden}" ]] || continue
    if [[ "${ARBETSFORM}" == "${forbjuden}" ]]; then
        neka "push nekad — arbetsformen '${ARBETSFORM}' är aktiv (satt ${SATT_VID} av ${SATTARE}). UNDER ITERATION: lokal commit per varv, ALDRIG push (T116/T126, mätt: 10–30 min mutex-kö per varv för sekunders arbete). PUSH GÖRS EN GÅNG, när Marcus säger klart. Är iterationen FAKTISKT klar men tillståndsfilen inte rensad: bash scripts/arbetsform-tillstand.sh rensa — kör sedan push igen."
    fi
done

# Arbetsformen är satt men står INTE i förbjudna-listan (t.ex. en framtida
# icke-blockerande arbetsform) — släpp igenom.
exit 0
