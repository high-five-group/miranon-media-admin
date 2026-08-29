---
id: TASK-338.3
title: >-
  Skiva: klienten — domän, adapter, RackviddBadge och RackviddsDialog med tre
  axlar och sammanfattningsrad
status: To Do
assignee: []
created_date: '2026-08-29 08:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-338.2
parent_task_id: TASK-338
ordinal: 613000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan väljer Lotta i uppladdningsdialogen 'Bara detta event' eller 'Delat dokument — gäller flera event'; under det senare tre valfria Select: Familj ('Alla familjer'), Steg (bara för nivåbärande familj, 'Alla steg') och Plats ('Alla platser', listan ur samma läsväg som Mer → Platser, usePlacesList). En sammanfattningsrad uppdateras live i klartext: 'Gäller: alla event' · 'Gäller: RIM-event i Rönninge' · 'Gäller: alla event i Rönninge' · 'Gäller: RIM-event, Nivå 1, i Rönninge'. Listan visar räckvidden som badge komponerad ur axlarna: 'Alla event' · 'RIM · Nivå 1' · 'Rönninge' · 'RIM · Rönninge' · 'RIM · Nivå 1 · Rönninge'. AttachmentScope blir EVENT | GEMENSAM (adaptern mappar legacy defensivt), Attachment-modellen får plats {id, namn} | null. Husets primitiver (RadioGroup/Select), hideLabel-mönstret, fokusordningen och 44 px-golvet behålls; ingen HTML/matchning i klienten. Ytan bor i facit-manifestet tasks/sessions/bilagor/s108-dokumentytan/facit.json (ostämplat) — ändringarna är avsiktliga per PRD:n, ny baslinje efter Marcus godkännande. Täcker användarberättelser: 1, 4, 5, 6, 7, 11, 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dialogen: två radioval + tre valfria Select med defaults; sammanfattningsraden speglar valet live i de fyra formerna ovan; 'Bara detta event' inaktiverat i räckviddsläget (som i dag); tangentbordsvandring och axe-svep gröna i dokument-rackviddsval.acceptance.test.ts
- [ ] #2 RackviddBadge renderar de fem texterna ur axlarna (enhetstest per form); event-egna får 'Detta event' som i dag; badgen syns i eventläget, räckviddsläget och Åtgärds-sidans bilageväljare
- [ ] #3 Domän + adapter: AttachmentScope EVENT|GEMENSAM, plats i modellen, legacy-mappning på läsvägen testad; typecheck 0 fel; attachment-layer-independence.test.ts grön
- [ ] #4 Ytan 'Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren' är identisk med facit tasks/sessions/bilagor/s108-dokumentytan/facit.json utom PRD:ns avsiktliga ändringar (tre axlar, sammanfattningsrad, nya badge-former) — avvikelser bokförda i Implementation Notes; aria-/visual-snapshots regenererade via spec-filernas egen mekanism
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
- [ ] #7 Facit-granskning mot tasks/sessions/bilagor/s108-dokumentytan/facit.json ytan 'Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren': avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje tas först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->
