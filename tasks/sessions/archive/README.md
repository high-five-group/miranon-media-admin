# Sessions-arkiv

Arkiverade sessionsdokument, ordnade per månad (`YYYY-MM/`). Arkiverade
sessionsdok är immutabla (ADR-023) — de redigeras inte, även när paths
de citerar flyttas; pathcitat läses som historisk relation.

Sedan `TASK-158.3` (2026-08-07) fylls katalogen löpande av
[ADR-099](../../../docs/decisions/ADR-099-sessionsdok-rotens-rullande-fonster.md)s
rullande fönster — `scripts/arkivera-sessionsdok.sh` flyttar hit closed-dok
äldre än rotens N senast stängda (idempotent, atomisk länk-omskrivning i
samma körning), inte bara vid fas-avslut som tidigare (`ADR-023`/`ADR-041`
beslut 6, rivet öppet av `ADR-099`). Skriptets första skarpa körning
(samma skiva) flyttade 67 äldre stängda dok hit i en enda commit.

Frontmatter-frister (`review_by`) i arkiverade dok är VILANDE: ingen grind
läser dem — frontmatter-grinden (ADR-030) bevakar endast filerna i
`.frontmatter-policy.conf` — och de rättas inte i efterhand (immutabiliteten
ovan). En passerad eller avvikande frist i arkivet läses som historiskt
artefakt-värde, aldrig som skuld. Belagt 2026-08-14 (S103): en 82 dagar
passerad frist hade aldrig fällt något, eftersom ingen mekanism tittar.

Denna katalog ligger medvetet UTANFÖR claude.ai-projektkunskapens synk
(ADR-048). Chat når innehållet via Code mot lokal disk/git.
