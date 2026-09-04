---
id: TASK-391
title: >-
  Fynd: nolläget 'Inget kvar att betala' på personkortet (och syskonytorna)
  förutsätter en skuld — byt till 'Inget att betala' där ingen öppen
  betalningsrad finns
status: To Do
assignee: []
created_date: '2026-09-04 10:11'
updated_date: '2026-09-04 10:40'
labels:
  - ready-for-agent
dependencies: []
ordinal: 688000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (Marcus 2026-09-04, S120 Del 1, verbatim i sessionsdoket): på personkortet, t.ex. Camilla Fransson, står det under Betalningar 'Inget kvar att betala' — fel formulering för någon som inte har en öppen stående betalning; bör vara 'Inget att betala'. FORENSIK (disk 2026-09-04): strängen är husets gemensamma NOLLÄGES-MENING för 'ingen öppen betalningsrad finns' på fyra ytor — src/components/betalningar/PersonBetalningar.tsx rad ~94 (oversikt.rader.length === 0), AnmalansBetalningar.tsx rad ~89 (saknas === null), AvbokningsBetallage.tsx rad ~130 (samma), PanelBetalningar.tsx rad ~100 (rad === null; 'Allt betalt' vid känt fullbetalt pris). Frånvaron av en öppen rad är per koden TVETYDIG (aldrig haft pris / helt betald) och får inte påstås vara 'allt betalt' — det är därför nolläget är en egen mening. Formuleringen 'Inget kvar att betala' valdes av Marcus själv 2026-09-01 i två andra kontexter: (a) inkorgens härledning när en registrerad inbetalning täcker hela priset (inkorg-harledningar.ts rad ~456, Marcus: "'500 kr täcker hela priset' tycker jag är otydlig. kanske 'Inget kvar att betala' är tydligare?") och (b) PanelBetalningar där 'Inget öppet belopp enligt basen' byttes (Marcus: "'enligt basen' är tekniksvenska - får inte nå Lotta"). ORKESTRERARENS BEDÖMNING: Marcus fynd håller för alla fyra nollägen — 'kvar' förutsätter att något funnits att betala, medan nolläget just INTE vet det; 'Inget att betala' är neutralt och täcker båda fallen. Inkorgens härledning (a) behåller 'Inget kvar att betala.' — där HAR en inbetalning just gjorts och 'kvar' är exakt. PanelBetalningars 'Allt betalt' (känt pris, fullt betalt) orörd. Detta är en REVISION av 2026-09-01-formuleringen på nollägena, öppet bokförd, inte en tyst ändring. Källor: S120 sessionsdok Del 1 · TASK-346.7 (personkortets sektion) · komponenternas docblocks § rad === null.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 De fyra nollägena (PersonBetalningar, AnmalansBetalningar, AvbokningsBetallage, PanelBetalningar rad === null) lyder 'Inget att betala.' resp. 'Inget att betala' i samma interpunktionsform som i dag; inkorg-harledningar.ts heltäcknings-grenen och PanelBetalningars 'Allt betalt' oförändrade.
- [x] #2 Docblock-kommentarerna som citerar nolläges-meningen ordagrant (AvbokningsBetallage rad ~50, PanelBetalningar rad ~60–62, AnmalansBetalningar ~rad 84) uppdaterade så koden inte påstår en sträng som inte finns; Marcus 2026-09-01-citaten står kvar som historik med datum för revisionen.
- [x] #3 Acceptance-/enhetstester som asserterar den gamla strängen uppdaterade (grep 'Inget kvar att betala' i tests/ ger bara träffar för inkorgens heltäckning); rörda sviter gröna.
- [x] #4 Om facit s103-persondetalj-konvergens eller s83-anmalningsvyn-konvergens bär strängen i sitt manifest eller sina amenderingar: en kort amenderings-not i respektive bilaga; annars bokförs det i detta korts notes att faciten inte nämner strängen (grep-bevis).
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #4 utfört 2026-09-04 (S120, TASK-391-byggagenten). Exakt kommandot ur kortet: grep -rn 'Inget kvar' tasks/sessions/bilagor/ — TVÅ träffar, inte de två namngivna dirs 1:1: s103-persondetalj-konvergens/AMENDERING-2026-09-01-just-nu-utan-guld-och-betalningssektionens-nya-form.md:174 (bär strängen — amenderings-not skriven: AMENDERING-2026-09-04-nollage-inget-att-betala.md i samma katalog) och s93-atgardssida-promovering/AMENDERING-2026-09-01-pricka-av-vertikalen-riven.md:174 (bär SAMMA citat men den bilagan namngavs INTE av kortet — lämnad orörd, flaggad i slutrapporten för orkestreraren). s83-anmalningsvyn-konvergens/ gav NOLL träffar — dess amenderingar rör avbokning/ombokning (AMENDERING-2026-09-03-avbokningssteget.md, AMENDERING-2026-09-03-ombokningssteget.md), ingen nämner betalnings-nolläget. Grep-bevis bokfört enligt AC #4:s andra gren (facit nämner inte strängen).
<!-- SECTION:NOTES:END -->
