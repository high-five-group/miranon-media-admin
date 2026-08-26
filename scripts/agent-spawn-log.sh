#!/usr/bin/env bash
#
# agent-spawn-log.sh — skriver EN JSONL-rad per subagent-spawn till
# `.claude/agent-spawn-log.jsonl`. Anropas av den icke-blockerande
# `PreToolUse`-hooken på matcher `Agent` i `.claude/settings.json`; hookens
# payload kommer som JSON på stdin.
#
# Läsaren av samma logg är scripts/agent-spawn-metrics.mjs (`npm run
# metrics:agents`). Skrivare och läsare hör ihop — ändras fältformen här måste
# den ändras där.
#
# --- VAD DEN RÄTTAR (S91, restlistans A7:2) -------------------------------
#
# Föregångaren var ett jq-uttryck inline i settings.json som loggade
# `isolation: (.tool_input.isolation // null)`. Det fältet är ANROPETS
# parameter, och den är satt bara när anroparen skickar den explicit.
# Isoleringen kommer i praktiken ur agentdefinitionens frontmatter —
# `.claude/agents/<typ>.md` bär `isolation: worktree`. Följden: varje
# `bygg-agent`-rad bar `"isolation": null` trots att samtliga körde i egen
# worktree. Mätaren rapporterade FRÅNVARO AV ISOLERING DÄR ISOLERING FANNS,
# alltså fel åt det farliga hållet: den som läser loggen för att svara "körde
# agenterna isolerat?" fick fel svar.
#
# --- UPPLÖSNINGSREGELN ----------------------------------------------------
#
#   1. `tool_input.isolation` satt  → `isolation` = det värdet, källa `param`
#   2. annars frontmatter-`isolation:` i `.claude/agents/<typ>.md`
#                                    → `isolation` = det värdet, källa `frontmatter`
#   3. annars                        → `isolation` = null, källa null
#
# Ordningen är ofarlig i praktiken trots att precedensen mellan de två är
# OMÄTT (ADR-082-passet § "Vad jag inte kunde belägga"): schemats enum är
# `"worktree" | "remote"` och saknar `none`, så ett anrop kan inte uttrycka
# "ingen isolering". Båda källorna kan därmed bara LÄGGA TILL isolering, och
# frågan mätaren finns för — isolerad eller ej — blir entydig oavsett vilken
# som vinner. Bara MODEN kan i teorin bli fel, och enbart i det ohörda fallet
# param=remote mot frontmatter=worktree.
#
# Värdet loggas RÅTT, utan enum-validering. En framtida isoleringsmod ska synas
# i loggen som det den är i stället för att tyst falla till null.
#
# --- FÄLTBRYTNING I SERIEN ------------------------------------------------
#
# `isolation_kalla` är nytt från och med denna commit. Rader före brytpunkten
# saknar fältet OCH bär `isolation: null` även för typade agenter — det är
# korrekt historik, inte data att laga. agent-spawn-metrics.mjs behåller därför
# sin frontmatter-slagning som LEGACY-väg för de raderna.
#
# `isolation_kalla` väljs framför att spegla spawn-parametern i ett eget fält.
# De två är informationsekvivalenta (givet `isolation` går det ena att härleda
# ur det andra), men källan svarar direkt på den stående frågan i ADR-082-passets
# steg 2: räcker de typade agenterna, eller hänger isoleringen på att anroparen
# kom ihåg parametern? Ett fält som besvarar frågan slår ett fält läsaren måste
# räkna på.
#
# --- FORMVAL: SKRIPT, INTE INLINE jq --------------------------------------
#
# Uppslaget kräver att en fil vars NAMN först är känt efter att stdin tolkats
# läses. jq har ingen fil-läsande builtin (`--rawfile`/`--slurpfile` binder
# namnet vid anropet), så one-linern hade behövt bli en flerstegs-shell-kedja
# dubbelescapad inuti en JSON-sträng. Repot har redan båda formerna och
# skiljelinjen är testbarhet: `.githooks/pre-commit` är ett skript med
# `scripts/test-pre-commit-hook.sh` bredvid sig, medan de kvarvarande inline-
# hookarna är envisa ettradare utan filsystemsberoende. Ett skript i `scripts/`
# får dessutom två saker en JSON-sträng aldrig kan få: CI:s shellcheck-strict
# (`scripts/*.sh` ingår i scopet) och en egen testsvit.
#
# KONFIG-DRIVEN, INTE HÅRDKODAD: ingen `.conf` behövs, eftersom skriptet inte
# bär ett enda projekt-specifikt värde — `.claude/agents/`, frontmatter-nyckeln
# `isolation` och `CLAUDE_PROJECT_DIR` är alla Claude Code-konventioner.
# Datakällan ÄR konfigurationen; läggs en ny agenttyp till behöver skriptet
# inte röras. Samma princip som agent-spawn-metrics.mjs.
#
# --- FÅR ALDRIG BLOCKERA EN SPAWN ------------------------------------------
#
# En trasig mätare får kosta en saknad loggrad, aldrig en utebliven agent.
# Tre lager: `exec 1>&2` (se nedan), fallback på varje fallerbart steg med
# ovillkorlig `exit 0`, och hookens egna `2>/dev/null || true` + `timeout: 5`.
#
# Användning: bash scripts/agent-spawn-log.sh < payload.json
# Exit: ALLTID 0.
#
# Etablerad: Session 91 (restlistans A7:2, ur arbetsflödes-granskningen
# 2026-07-28). Beställd av ADR-082-passet steg 2
# (docs/research/hook-mekanisering-worktree-isolering-2026-07-28.md).

set -uo pipefail

# Hookens STDOUT tolkas av Claude Code: JSON med `hookSpecificOutput` där kan
# neka anropet. Ingen rad i detta skript får därför nå fd 1. `exec 1>&2` gör
# det strukturellt omöjligt i stället för att lita på granskning — en framtida
# felsöknings-echo kan då inte förvandla mätaren till en spärr. Explicita
# fil-omdirigeringar (`>> "${LOGG}"`) berörs inte.
exec 1>&2

ROT="${CLAUDE_PROJECT_DIR:-.}"
LOGG="${ROT}/.claude/agent-spawn-log.jsonl"
AGENTKATALOG="${ROT}/.claude/agents"

# SCRIPT_DIR (BASH_SOURCE-baserad, INTE ROT/CLAUDE_PROJECT_DIR) enbart för
# att hitta jq-guard.sh i DENNA egna worktree — ROT ovan pekar medvetet mot
# den DELADE huvudkatalogen (§ ovan: .claude/agents är huvudkatalogs-
# förankrat), vilket är fel plats att leta efter ett skript som ska köras
# ur den worktree som faktiskt äger denna process.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh" || exit 0

# jq saknas eller är för gammal (TASK-312) → ingen rad, ingen spärr.
jq_version_ok > /dev/null 2>&1 || exit 0

INDATA="$(cat)"
[[ -n "${INDATA}" ]] || exit 0

TYP="$(jq -r '.tool_input.subagent_type // ""' <<< "${INDATA}" 2> /dev/null || true)"
ISO="$(jq -r '.tool_input.isolation // ""' <<< "${INDATA}" 2> /dev/null || true)"
KALLA=""

if [[ -n "${ISO}" ]]; then
    KALLA="param"
elif [[ "${TYP}" =~ ^[A-Za-z0-9_-]+$ ]]; then
    # Teckenklassen är en sökvägs-spärr, inte kosmetik: `subagent_type` kommer
    # ur modellens anrop, och ett namn med `/` eller `..` hade pekat uppslaget
    # utanför agentkatalogen. Inbyggda typer (Explore, general-purpose, Plan)
    # har ingen fil — det är ett giltigt utfall, inte ett fel.
    AGENTFIL="${AGENTKATALOG}/${TYP}.md"
    if [[ -f "${AGENTFIL}" ]]; then
        # Läser ENDAST frontmatter-blocket (fil-inledande `---` till nästa
        # `---`) och endast en nyckel i kolumn 0 — samma snitt som
        # agent-spawn-metrics.mjs gör med /^---\n...\n---/ + /^isolation:/m.
        # Ett `isolation:` i brödtexten (denna kommentar hade räckt) får inte
        # räknas.
        ISO="$(awk '
            NR == 1 && $0 != "---" { exit }
            NR == 1 { next }
            $0 == "---" { exit }
            /^isolation:[[:space:]]*[^[:space:]]/ {
                sub(/^isolation:[[:space:]]*/, "")
                sub(/[[:space:]].*$/, "")
                print
                exit
            }
        ' "${AGENTFIL}" 2> /dev/null || true)"
        # `isolation: "worktree"` är lika giltig YAML som den ociterade formen.
        # Trimningen görs i bash i stället för i awk-regexen — ett citattecken
        # inuti awk-programmets shell-citat kostar mer läsbarhet än det ger.
        ISO="${ISO%\"}"
        ISO="${ISO#\"}"
        ISO="${ISO%\'}"
        ISO="${ISO#\'}"
        if [[ -n "${ISO}" ]]; then
            KALLA="frontmatter"
        fi
    fi
fi

mkdir -p "${ROT}/.claude" 2> /dev/null || exit 0

# Fältordningen är föregångarens, med `isolation_kalla` insatt direkt efter
# `isolation` — serien ska gå att läsa som en serie.
jq -c \
    --arg iso "${ISO}" \
    --arg kalla "${KALLA}" \
    '{
        ts: (now | todate),
        session: ((.session_id // "")[0:8]),
        type: (.tool_input.subagent_type // "okänd"),
        isolation: (if $iso == "" then null else $iso end),
        isolation_kalla: (if $kalla == "" then null else $kalla end),
        bg: (.tool_input.run_in_background // false),
        fran_worktree: ((.cwd // "") | test("/\\.claude/worktrees/"))
    }' <<< "${INDATA}" >> "${LOGG}" 2> /dev/null || true

exit 0
