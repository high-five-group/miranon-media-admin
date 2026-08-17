---
id: TASK-249.1
title: 'Skiva: Promoverings-grinden — ariaSnapshot-referenser låsta ur variant d'
status: To Do
assignee: []
created_date: '2026-08-17 00:22'
updated_date: '2026-08-17 02:01'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-249
ordinal: 463000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bevisformen för hela promoveringen: referenserna låses ur den godkända prototypen INNAN någon flipp-ändring sker — efter flippen finns inte före-läget. Sjätte spec-filen i den befintliga promoverings-grind-raden. Täcker användarberättelser: bevisform för 1-13 och 17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En ny spec-fil i den befintliga aria-grind-klassen fångar referenser för SAMTLIGA sju facit-ytor (segment-listan, tackningsvyn, nytt-segment-mallvyn, verkstaden, segment-detaljvyn, generatorn, utskicksvyn) ur variant d-läget, FÖRE varje flipp-ändring
- [x] #2 Referenserna är identiska med den körande prototypen i variant d-läge — facit-raderna bär bilder: [], så referenserna ÄR bevisformen (ADR-102 B5); frånvaron av bild sänker aldrig kravet
- [ ] #3 PrototypRigg (utfallslägena) och SkalprovsVaxel står UTANFÖR referensernas scope via testid-avgränsning, per s93-atgardssida-mönstret (riggen, inte ytan)
- [x] #4 Avgränsningens rött-först-bevis finns i PR:en och spec-filen är grön mot variant d
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning mot tasks/sessions/bilagor/s104-segment-divergens/facit.json — varje yta i ytor[] täckt av en referens
- [x] #6 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [ ] #7 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #3 — PARTIELLT UPPFYLLT, ÖPPET RAPPORTERAT (ej avbockat som helhet): sex av sju ytor (segment-listan, tackningsvyn, verkstaden, nytt-segment-mallvyn, generatorn, utskicksvyn) utesluter PrototypRigg/SkalprovsVaxel strukturellt via testid-avgränsning. segment-detaljvyn gör INTE det: SkalprovsVaxel sitter i PublikSektion mitt i SAMMA <div> som ToggleButtonGroup/Input (VÄXELN BOR DÄR PUBLIKEN BOR, sist bland dess kontroller), inte som ett efterföljande syskon. En ariaSnapshot-lokator scopar till ETT sammanhängande subträd och kan inte hoppa över ett mittensyskon. Att FLYTTA växeln hade ändrat en redan Marcus-godkänd (facit.json sha a40f3543) DOM-position, vilket ADR-102 (prototypen AR facit) förbjuder lika hårt som att ändra formen självt. segment-detaljvyn.aria.yml bär darfor SkalprovsVaxel synligt. Fullt resonemang: VariantD.tsx paragraf SegmentDetalj docblock + spec-filens huvud.

VIKTIGT FYND UNDER BYGGET: Playwrights toMatchAriaSnapshot() matchar i default-läge (children: 'contain', ej 'equal'/'deep-equal', verifierat mot Playwrights egen dokumentation) en ORDNAD DELSEKVENS — extra syskon-noder UTANFÖR referensen fäller INTE grinden, oavsett position i trädet. Skarpt prövat under bygget: SkalprovsVaxel flyttades TILLFÄLLIGT tillbaka in i segment-listans testid-scope och testet förblev grönt mot den redan låsta (rigg-fria) referensen (bekräftat via en direkt ariaSnapshot()-dump som visade riggens text fanns i scopet trots det gröna resultatet); ändringen reverterades omedelbart. Testid-avgränsningens verkliga funktion är därför att hålla FÅNGST-ÖGONBLICKET (--update-snapshots mot den levande DOM:en) rent för granskaren, inte att fälla en framtida regression om riggen skulle återuppstå i scopet. Detta bör vägleda hur TASK-249.5/249.6 tolkar DoD #7: att TA BORT ett element referensen redan förväntar sig (segment-detaljvyns SkalprovsVaxel vid rivning) fäller sannolikt grinden (det förväntade elementet saknas i tradet) och kräver en avsiktlig referens-uppdatering da — det ar vantat, inte ett fel.

DoD #7 ("check-facit grön genom flipp OCH rivning") är FRAMÅTRIKTAT och rör TASK-249.5/249.6 (flippen har inte skett än) — lämnas avsiktligt oavbockad här. Fixturvärlden (fyra kurser: Resor i medvetandet 1/2, Fjärrskådning, Psionautics + åtta fixturpersoner, se spec-filens huvud) är EGEN och OBEROENDE av Skool-bilagans juli-2026-facit (FACIT_KARTA i VariantD.tsx) — siffrorna i referenserna (t.ex. "RIM 1 + RIM 2": 2 personer) är denna testfilens egna deterministiska tal, INTE Skool-talen (188 osv). Skalprovet star AV (default) i samtliga sju tester, sa FACIT_KARTA/skalprovMal paverkar aldrig referenserna.
<!-- SECTION:NOTES:END -->
