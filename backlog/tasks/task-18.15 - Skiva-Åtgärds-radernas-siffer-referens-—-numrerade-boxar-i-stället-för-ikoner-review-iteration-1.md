---
id: TASK-18.15
title: >-
  Skiva: Åtgärds-radernas siffer-referens — numrerade boxar i stället för ikoner
  (review-iteration 1)
status: To Do
assignee: []
created_date: '2026-07-22 09:09'
updated_date: '2026-07-24 14:23'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.3
parent_task_id: TASK-18
priority: medium
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg 1 (2026-07-22), fundering lyft till beslut: ersätt åtgärds-radernas ledande lucide-ikoner (Atgarder.tsx: Plus/Mail/BadgeCheck/Printer — kuvert-grammatiken ur 18.3/S73-facit) med RADNUMMER inboxade i en grå ruta med samma hörnradie som kortets ytterram. Motiv: referentbarhet — 'gå till åtgärd 4' i instruktioner och manualer (Gunilla-principen: numrerade steg är entydiga). Detta är en FACIT-REVIDERING mot S73-facitets kuvert-grammatik och rivs i så fall öppet (18.3-precedenten för regelrivning). Beslutsrymd före bygge: nummer ensamt, nummer + ikon, eller avslag. Check-in-kortet och rad-chevronerna berörs ej.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus-beslut bokfört (nummer ensamt / nummer+ikon / avslag) med öppen facit-reviderings-not
- [ ] #2 Vid bifall: åtgärds-raderna renderar numrerade boxar per beslut; AT-paritet (radnamn + aria-disabled-interimen oförändrade) och berörda e2e uppdaterade i samma skiva
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PROTOTYP-FACIT S83 (konvergens-pass 2, Marcus-låst 2026-07-24). BESLUT: NUMMER ENSAMT (ikonerna utgår ur åtgärds-raderna) — FACIT-REVIDERING AV S73-K47 RIVS ÖPPET för de LEDANDE ikonerna i Åtgärds-gruppen (kuvert-grammatiken består i övriga ytor; check-in-kortets UserCheck orörd). Beslutsprocess synlig: grå ruta → Marcus-fångst hover-kollision (rutans bg == hover-plattans bg-emphasized) → VIT ruta → mörk grå prövad och förkastad ('hemskt') → VIT LÅST. Bilagor: tasks/sessions/bilagor/s83-numrerade-boxar-konvergens/ (k01 skarp baseline, k03 låst form, k03-hover). Prototyp-SHA (aldrig mergad branch proto/s83-18-15-numrerade-boxar): eda160f.

BYGGKRAV (låsta):
1. NUMRUTA ersätter ledande ikonen i Åtgärds-gruppens SEX rader; numren 1–6 i befintlig frekvensordning (ordningen ändras ej).
2. Rutans form: 24x24 (size-6), rounded-lg, bg-surface (VIT — får ALDRIG dela färg med radens hover-platta bg-emphasized; hover-kollisionen är beslutsgrundad), siffra text-caption font-semibold text-text-secondary, centrerad.
3. AT-PARITET (AC 2): numret är aria-hidden dekor; radNAMNEN, aria-disabled-interimen, chevronerna och hover-plattan OFÖRÄNDRADE. Check-in-kortet berörs EJ.
4. Rivningsnot i koden där kuvert-grammatiken (K47) refereras: ledande ikoner ersatta av radnummer per 18.15-beslutet (referentbarhet, Gunilla-principen: 'gå till åtgärd 4').
5. Berörda e2e uppdateras i samma skiva (radnamns-selektorer består — bara visuellt byte).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren godkänd (per skiva med UI-yta; L220)
- [ ] #6 Renderad verifiering (computed-style/skärmdump) per berörd punkt före granskning (L245/L246)
<!-- DOD:END -->
