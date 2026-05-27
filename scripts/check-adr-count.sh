#!/usr/bin/env bash
# scripts/check-adr-count.sh — konsistens-grind (ADR-039).
#
# Hävdar att ADR-fil-antalet i docs/decisions/ matchar README:s kanoniska
# levande räkning.
#
# Bakgrund: README:s ADR-räkning driftade tyst (28 → faktiskt 38) eftersom
# den enda vakten (phase-end-verify.sh) bara körs vid fas-avslut medan
# ADR:er tillkommer varje session (Session 8 K0a-diagnos: kadens-missmatch).
# Denna grind flyttar kontrollen till per-push-kadens (ADR-039 § kadens-
# principen).
#
# Nycklar mot SAMMA kanoniska README-token ("[0-9]+ arkitekturbeslut") som
# phase-end-verify.sh head -1:ar — de två grindarna får aldrig säga emot
# varandra. Grinden hävdar dessutom att tokenet förekommer på EXAKT en rad
# (annars är phase-end-verify:s head -1 icke-deterministisk).
#
# Exit 0 om antal matchar. Exit 1 vid drift / icke-unik token / saknad fil.
#
# Output (K11.5 11/10-disciplin): ❌ + faktiskt vs förväntat + actionable fix.
#
# Källa: docs/decisions/ADR-039-konsistens-grindar-kadens.md
# Etablerad: Session 8 K0b (2026-05-27)

set -euo pipefail

README="README.md"
DECISIONS_DIR="docs/decisions"
TOKEN="[0-9]+ arkitekturbeslut"

if [[ ! -f "${README}" ]]; then
    echo "❌ ${README} saknas — körs grinden från repo-roten?"
    exit 1
fi
if [[ ! -d "${DECISIONS_DIR}" ]]; then
    echo "❌ ${DECISIONS_DIR}/ saknas — körs grinden från repo-roten?"
    exit 1
fi

# ADR-fil-antal — samma metod som phase-end-verify.sh (find … wc -l).
adr_count=$(find "${DECISIONS_DIR}" -name 'ADR-*.md' | wc -l | tr -d ' ')

# README kanonisk token måste finnas på EXAKT 1 rad.
token_lines=$(grep -cE "${TOKEN}" "${README}" || true)
if [[ "${token_lines}" -ne 1 ]]; then
    echo "❌ README.md: token '<N> arkitekturbeslut' hittades på ${token_lines} rad(er) (förväntat: exakt 1)."
    echo "   phase-end-verify.sh head -1:ar denna token; fler/färre än 1 gör räkningen icke-deterministisk."
    echo "   Fix: håll exakt EN kanonisk levande-räknings-rad med mönstret '<N> arkitekturbeslut'."
    exit 1
fi

readme_count=$(grep -oE "${TOKEN}" "${README}" | grep -oE "^[0-9]+")

if [[ "${adr_count}" != "${readme_count}" ]]; then
    echo "❌ ADR-räknings-drift: ${DECISIONS_DIR}/ har ${adr_count} ADR-filer, README anger ${readme_count}."
    echo "   Fix: uppdatera README:s kanoniska rad '<N> arkitekturbeslut' till ${adr_count}."
    exit 1
fi

echo "✅ ADR-räkning konsistent: ${adr_count} ADR-filer == README (${readme_count})."
exit 0
