---
id: TASK-157.2
title: 'Skiva: register-migrationen — alla feta rader tunnas, narrativ till kortfiler'
status: Done
assignee: []
created_date: '2026-08-07 11:33'
updated_date: '2026-08-07 15:28'
labels:
  - ready-for-agent
dependencies:
  - TASK-157.1
parent_task_id: TASK-157
ordinal: 268000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: registret läses i ett svep långt under Read-taket, varje tråds narrativ nås via dess kort, och forensisk läsbarhet består — inget raderat. Täcker användarberättelser: 1, 2, 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: ADR-098:s radform + radlängds-tak lästa på main; registret ommätt; lista över rader som överskrider taket byggd mekaniskt före någon redigering
- [x] #2 Varje fet rad tunnad till ADR-098-formen; narrativ flyttat till trådens kortfil (kort fött där det saknades); besläktad-deklarationer flyttade per ADR-098:s hemvist-beslut; INGET innehåll raderat — mekanisk innehålls-bevarande-kontroll redovisad rad för rad i slutrapporten
- [x] #3 check-thread-index.sh:s befintliga invarianter gröna efter migrationen; registrets nya storlek redovisad (rader + KB); docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Mekanisk migration, TASK-157.2. 87 av 132 trådrader (byte-mätt, C/POSIX-
locale-konsistent med ADR-098:s ${#line}-metod) tunnades till ADR-098-formen;
45 var redan tunna, orörda. 65 nya trådkort föddes, 22 befintliga fick
narrativet flyttat in (0 dedup-skip — inget fanns redan verbatim). Registret:
221 337 → 84 184 byte (269 rader oförändrat, 132 trådrader), längsta rad nu
500 byte (T19, redan tunn innan migrationen — ingen migrerad rad över taket).

Mekanisk innehålls-bevarande-kontroll (script, körd rad för rad): samtliga
87 migrerade raders fulla ursprungliga Titel- (där trunkerad) och Ingång-
celler återfunna i respektive kortfil — 81/87 byte-exakt, 6/87 (T100/T110/
T111/T112/T126/T130, Titel-cellen) matchar efter att emfas-markörer (*/_)
normaliserats bort på båda sidor: `npx markdownlint-cli2 --fix` normaliserade
dessa filers redan-etablerade MD049-stil (asterisk) mekaniskt efter min
skripts skrivning — själva orden är oförändrade, bara */_ skiljer.

Tre verkliga buggar hittade och rättade under bygget (redovisas som
premiss-avvikelser i slutrapporten): (1) dubbla backticks runt tillstånd i
raden, (2) obalanserad "(" i en trunkerad titel som lurade
check-thread-index.sh:s Inv 3-regex att sluka hela raden (7 rader drabbade,
grinden fällde EXIT=1 — rättat med paren/brackets-balansering), (3) rubrik-
konstruktionen strippade backticks som skyddade tekniska termer (`aria`,
`VITE`, `chunk<T>`) från Vale/markdownlint, vilket exponerade dem för
Vale.Terms-fel först när de flyttade ur tabellcellen till löpande text.

Grindar: check-thread-index.sh EXIT=0, check-lifecycle.sh EXIT=0, check:docs
EXIT=0 (13/13 gröna), typecheck EXIT=0, biome check EXIT=0. build/test:api ej
körda — ren docs-diff (tasks/threads/* + ett backlog-kort), L147 rörd-fil-
klass = check:docs.

Stängning i S99-resume 1 (2026-08-07): #910 mergad d232928b, per-jobb-grön. Registret 221337→84184 byte, 0 rader >500 byte, 65 nya + 22 kompletterade kort, inget raderat (mekaniskt bevisat 87/87). Orkestrerar-löst merge-konflikt mot #909: T133 räddad till tunn radform (260 byte) + kortfil med ordagrann cell-flytt; GitHub släppte armeringen vid konflikten — omarmerad 14:46:06Z. Byte-mätmetoden (inte tecken) bekräftad som ADR-098:s bindande; O(n²)-hypotesen stödd indirekt (grinden 11,3 s post-migration mot >2 min före).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
