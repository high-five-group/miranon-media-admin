#!/usr/bin/env bash
# backlog-cli.sh — backlog-CLI:t utan gren-skanningens kostnad, UTOM där den skyddar.
#
# ═══ VARFÖR WRAPPERN FINNS ═══
#
# `check_active_branches: true` (TASK-93) läser andra aktiva grenar innan CLI:t
# allokerar ett kort-ID, och hoppar över nummer som redan är tagna där. Det
# skyddar EXAKT EN sak: ID-allokeringen i `task create`. Varje annat anrop —
# `list`, `view`, `edit`, `board` — allokerar aldrig ett ID och betalar ändå
# hela notan.
#
# Notan är mätt, inte uppskattad (2026-08-17, denna maskin, load avg 4,68,
# 43 git-refs varav 24 remote; tre körningar per punkt):
#
#     task list --json   7,83 s  ->  2,11 s   (3,7x)
#     task view          8,94 s  ->  2,76 s   (3,2x)
#
# Under fleet-last är utfallet värre än en multiplikator: TASK-238:s grind
# betalade 164,60 s i en enda körning, och S102:s orkestrator-edit dog mot ett
# 2-minuterstak medan en parallell agents CLI-anrop malde. Kostnaden växer med
# antalet grenar, och en fleet av agenter PRODUCERAR grenar.
#
# ═══ VAD WRAPPERN GÖR ═══
#
# Allokerande anrop (`create` i argumenten) skickas igenom ORÖRDA — full
# gren-skanning, TASK-93-skyddet exakt som förut. Allt annat körs mot en
# ISOLERAD projektrot: en temporär katalog med en egen `backlog.config.yml`
# (`check_active_branches: false`) och en symlänk till repots riktiga
# `backlog/`-katalog, utpekad med CLI:ts `BACKLOG_CWD`.
#
# VERIFIERAT LIVE 2026-08-17: med den formen läser `config get
# checkActiveBranches` "false", `task list --json` ger fortfarande alla 502
# riktiga kort, och en `task edit` SKRIVER igenom symlänken till den riktiga
# kortfilen (prövat mot ett kastbart substrat, aldrig mot repots kort).
#
# ═══ VARFÖR ISOLERING OCH INTE ROOT_CONFIG I REPO-ROTEN ═══
#
# TASK-238:s grind använde interimsformen: skriv `backlog.config.yml` i
# PROJEKTROTEN, kör, ta bort den igen. Den fungerar för EN process men är fel
# form för en fleet — sökvägen är FAST och DELAD, så två samtidiga anrop i
# samma träd trampar på varandra. Grinden löste det genom att vägra köra om
# filen redan fanns (fail-closed), vilket är rätt för en grind och oanvändbart
# för ett vardagskommando.
#
# BACKLOG_CWD-formen har ingen delad muterbar fil alls: varje anrop får sin egen
# temporära rot och städar den själv. Repots `backlog/config.yml` (den
# INTERAKTIVA TASK-93-flaggan) rörs ALDRIG — varken läst-och-återställd eller
# skriven. `backlog config set` används heller aldrig: den är MÄTT förlustfull
# vid round-trip (omserialiserar hela config.yml trots identiskt värde).
#
# ═══ FAIL-SAFE-RIKTNINGEN ═══
#
# Träffas `create` var som helst i argumenten går anropet igenom orört — även
# om ordet råkade vara ett VÄRDE (`task edit 5 --title create`). Följden är ett
# långsammare anrop, aldrig ett oskyddat. Motsatt default hade kunnat stänga av
# kollisionsskyddet för en riktig allokering, och det är den dyra riktningen.
#
# Fullt beslut: ADR-117. Kollisionsskyddets historik: CLAUDE.md § Kortnummer.

set -uo pipefail

ROT="$(cd "$(dirname "$0")/.." && pwd)"
BACKLOG_CMD="${BACKLOG_CMD:-${ROT}/node_modules/.bin/backlog}"
KONFIG="${BACKLOG_CONFIG_YML_SOKVAG:-${ROT}/backlog/config.yml}"

if [[ ! -x "${BACKLOG_CMD}" ]]; then
    echo "❌ backlog-binären hittas inte: ${BACKLOG_CMD}" >&2
    # Kommandonamnen citeras med apostrofer, ALDRIG med backticks: i dubbla
    # citattecken hade backticks kört dem som kommandosubstitution — alltså
    # exakt den npx-form raden varnar för.
    echo "   Kör npm ci först. 'npx backlog' är ALDRIG rätt form — paketet heter" >&2
    echo "   backlog.md medan 'backlog' är ett annat paket (namnkollision)." >&2
    exit 2
fi

# ── Allokerande anrop går igenom orörda ─────────────────────────────────────
for arg in "$@"; do
    if [[ "${arg}" == "create" ]]; then
        exec "${BACKLOG_CMD}" "$@"
    fi
done

if [[ ! -f "${KONFIG}" ]]; then
    echo "❌ ${KONFIG} hittas inte — wrappern vägrar gissa CLI:ts inställningar" >&2
    exit 2
fi

# ── Isolerad projektrot: egen config, symlänk till de riktiga korten ────────
ISO="$(mktemp -d)" || { echo "❌ kunde inte skapa temporär katalog" >&2; exit 2; }
trap 'rm -rf "${ISO}"' EXIT

ln -s "${ROT}/backlog" "${ISO}/backlog" || {
    echo "❌ kunde inte symlänka ${ROT}/backlog" >&2
    exit 2
}

# Kopia av den RIKTIGA configen med endast flaggan bytt — varje annan
# inställning ärvs exakt, utan att förlita sig på att CLI:ts defaults råkar
# matcha projektets.
if grep -q '^check_active_branches:' "${KONFIG}"; then
    sed -E 's/^check_active_branches:.*/check_active_branches: false/' \
        "${KONFIG}" > "${ISO}/backlog.config.yml"
else
    cp "${KONFIG}" "${ISO}/backlog.config.yml"
    printf 'check_active_branches: false\n' >> "${ISO}/backlog.config.yml"
fi

# ── Sökvägarna i utdatan pekas tillbaka på det RIKTIGA trädet ───────────────
#
# CLI:t skriver ut den sökväg det löste igenom (`File: …`), och det är
# isolerings-katalogens — en katalog som är BORTA så fort anropet returnerat.
# En läsare som kopierar den får en död sökväg, och en agent som försöker öppna
# kortet där hittar ingenting. Utdatan pekas därför tillbaka på ${ROT}.
#
# Bara när stdout INTE är en terminal. CLI:t har interaktiva lägen (`task list`
# utan --plain, `board`, `browser`) som måste äga terminalen själva; att buffra
# dem genom en fil hade brutit dem. Interaktivt bryr sig dessutom ingen om
# sökvägsraden.
#
# Exitkoden fångas SEPARAT och returneras oförvanskad — en pipe hade gett sed:s
# kod i stället för CLI:ts, vilket är exakt L440-felet.
if [[ -t 1 ]]; then
    BACKLOG_CWD="${ISO}" "${BACKLOG_CMD}" "$@"
    exit $?
fi

UTDATA="${ISO}/.utdata"
BACKLOG_CWD="${ISO}" "${BACKLOG_CMD}" "$@" > "${UTDATA}"
KOD=$?
sed "s|${ISO}/backlog|${ROT}/backlog|g" "${UTDATA}"
exit "${KOD}"
