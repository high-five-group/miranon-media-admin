---
id: TASK-287
title: >-
  Fynd: B3-spärren skyddar inte S109:s facit-ytor — FACIT_PROTO_MARKORER saknar
  markörer för notis-familjen
status: To Do
assignee: []
created_date: '2026-08-21 12:57'
updated_date: '2026-08-21 15:01'
labels:
  - ready-for-agent
dependencies:
  - TASK-285.2
  - TASK-285.3
ordinal: 529000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TVÅ bygg-agenter fann detta oberoende av varandra under S109 våg 1 (TASK-285.1 och TASK-285.3), var och en utan att känna till den andras rapport.

FAKTISKT TILLSTÅND, mätt av orkestreraren 2026-08-21 mot .facit-policy.conf och scripts/check-facit.sh:

FACIT_PROTO_MARKORER innehåller FEM markörer, samtliga från tidigare prototyp-pass: isHallplatsVariant, protoAktiv, 'Åtgärds-sidan UTAN event — tomt läge', 'V1 Lugna morgonen (ro)', '[PROTOTYPE, TASK-241.1] Sändytans overlay — KONVERGENSVARV 2.'

INGEN av dem hör till S109:s två ogodkända ytor (s109-uppdateringsnotis-konvergens och s109-meddelandefamiljen-konvergens, båda godkand: null). Deras substrat i src/ — ?variant-grenen i AppUpdateBanner, prototypAktiv, /dev/notis-prototyp-routen, MessageBoxPrototyp, AppErrorPrototyp — har alltså NOLL markörer som vaktar det.

TVÅ SEPARERBARA DEFEKTER:

(1) Markörerna saknas för S109:s ytor. ADR-102 B3 (rivning först efter godkännande) är därmed overksam för exakt de ytor som står närmast rivning (285.11).

(2) Grindens egen framgångsrad ÖVERKLAGAR. scripts/check-facit.sh rad 168 skriver 'N ogodkända (prototyp-substratet skyddat)' villkorslöst så snart markör-loopen passerar. Loopen körs bara om BÅDE ogodkända-listan och markör-listan är icke-tomma (rad 136), och den prövar enbart att varje markör i den GLOBALA listan finns kvar i src/. Det finns ingen koppling manifest→markör. En yta utan markörer ger alltså grön rad med ordet 'skyddat' i, utan att något skyddas. Det är ADR-083-klassen (prosa som påstår mekanism), här i grindens egen utdata.

VARFÖR DET INTE ÅTGÄRDADES DIREKT: TASK-285.2 och 285.3 arbetade fortfarande på prototyp-filerna när fyndet gjordes. En markör-sträng tillagd mitt i det hade kunnat fällas av en legitim omdöpning och gett falskt rött. Båda agenterna avstod korrekt från att fixa i eget scope och rapporterade i stället.

KANDIDAT-MARKÖR SOM REDAN FINNS I KODEN: TASK-285.1 lade kommentaren '[PROTOTYPE — KONVERGENS, S109]' i AppUpdateBanner.tsx. Verifiera formen mot vad 285.2/285.3 faktiskt lämnade innan den skrivs in.

MÅSTE LANDA FÖRE TASK-285.11 (rivningen). Efter våg 1, före stämplingen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 FACIT_PROTO_MARKORER bär minst en markör per ogodkänd S109-yta, och varje markör är disk-verifierad att finnas i FACIT_PROTO_SOKVAG vid landningen
- [x] #2 Tvåsidigt bevis: markören tas temporärt bort ur src/ (eller döps om) och check-facit.sh fäller RÖTT med rätt yta namngiven, återställs, blir grön igen
- [x] #3 check-facit.sh:s framgångsrad påstår inte längre skydd som inte prövats — antingen kopplas manifest till markör, eller så formuleras raden om så den bara påstår vad loopen faktiskt kontrollerade
- [x] #4 ADR-102 eller .facit-policy.conf bär en nedskriven regel om NÄR en markör ska registreras (vid konvergensens facit-låsning, inte vid rivningen) så nästa pass inte upprepar luckan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
