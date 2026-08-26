---
id: TASK-309.27
title: >-
  Fynd: bekräftelsebilagans mall — den blå ramen är inte vertikalt centrerad på
  sidan och loggan kolliderar med ramens överkant
status: To Do
assignee: []
created_date: '2026-08-26 03:06'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 593000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-röktest 2026-08-26 (S108 resume 11), skarp PDF utan vattenstämpel, ordagrant: 'Loggan ligger i överkant nästan PÅ den blåa ramen OCH den blåa ramen är inte helt centrerad på pappret, så om du flyttar upp den blåa ramen lite så den är centrerad så löser det nog båda problemen.'

VAR: förlagan docs/mallar/bilagor/bekraftelsebilaga.html (Marcus-granskad, ADR-125 § mallarnas hemvist: förlagan orörd under docs, byte-identisk kopia i EF-lagret supabase/functions/_shared/mallar/bekraftelsebilaga.html.ts skriven av synk-skriptet och vakad av CI-paritetsgrinden — hitta skriptet via grep 'paritet'/'mall' i scripts/ och package.json; 'mall:granska' = scripts/render-bilage-mall.mjs renderar lokalt). Delad CSS: bilaga-delad.css.ts. Renderaren är DocRaptor (Prince) — mät i DocRaptor-test-läge (staging, gratis, vattenstämplad), inte i webbläsaren: Prince bryter sidor annorlunda (S108 Del 11 § D).

GÖR: (1) Mät nuläget: sidans höjd (A4 = 297 mm), ramens top/bottom-marginal, loggans bounding box mot ramens överkant — i den renderade PDF:en (pdf-lib/pdfjs-mätning eller Prince-box-utdata), tal före/efter. (2) Flytta ramen så att den är vertikalt centrerad (lika marginal upp/ned) och loggan får luft till ramens överkant — Marcus hypotes är att EN justering (ramen upp) löser båda; verifiera, och om loggan behöver egen justering: gör den minimal och bokför. (3) Ändra FÖRLAGAN, kör synk-skriptet, paritetsgrinden grön. (4) Kontrollera att deltagarinformations-mallen (samma delade CSS?) inte påverkas negativt — rendera båda. (5) Rendera bekräftelsebilagan i staging (vattenstämplad) för Marcus granskning: lägg PDF:en/bilden i PR:en eller i sessionens bilage-katalog och säg var. Marcus godkänner formen i klartext innan armering (HITL — mallen är hans granskade förlaga).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Före/efter-mätning i den DocRaptor-renderade PDF:en: ramens övre och nedre marginal lika (±1 mm), loggans avstånd till ramens överkant angivet i mm — tal i PR:en
- [ ] #2 Förlagan ändrad, EF-kopian synkad via skriptet, paritetsgrinden grön; ingen handredigering av kopian
- [ ] #3 Deltagarinformations-mallen renderad och opåverkad (eller medvetet justerad, bokfört)
- [ ] #4 Marcus har granskat den staging-renderade PDF:en och godkänt formen i klartext FÖRE armering (HITL)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
