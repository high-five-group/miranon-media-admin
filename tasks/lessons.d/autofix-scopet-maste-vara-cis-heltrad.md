# Autofix-scopet måste vara CI:s helträd, inte de filer du minns att du rörde

**[UNIVERSAL]-kandidat** · S106 (2026-08-15), miranon-media-admin

**Mätt, två CI-fällningar i SAMMA session (båda `Biome check` i Lint-jobbet,
PR `#1328` resp. `#1335`):** lokala passet körde
`biome check --write <de ändrade filerna>` — CI kör `biome check .`.
Fällning 1: `facit.json` (en fil jag skrev via Write och aldrig tänkte på som
"kod"). Fällning 2: import-ordningen i två filer vars importer ompekats via
`sed` (inte via Edit — så de fanns inte i min mentala "ändrade filer"-lista).

**Mönstret:** fil-scopad autofix fixar det du MINNS att du rört; verktyg som
skriver filer utanför Edit-flödet (Write av JSON, sed-ompekningar,
skript-genererade filer) lämnar spår som bara helträdet ser. Kostnaden är en
hel CI-cykel + konsumerad merge-armering per miss (utsparkningen är tyst,
`autoMergeRequest` ser ut som aldrig-armerad).

**Regeln:** före varje push: `npx @biomejs/biome check .` (exakt CI:s form,
utan filargument) — autofix-varvet får gärna vara fil-scopat för tempo, men
GRINDEN före push är alltid helträdet. Detta är instans-belägget för
konstitutionens "verifiera med de exakta kommandon CI kör" applicerat på
AUTOFIX-scopet, inte bara på verifierings-scopet.
