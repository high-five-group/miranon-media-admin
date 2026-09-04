---
id: TASK-368.1
title: >-
  Skiva: Räknarfixen i basen — Är aktiv exkluderar Inställt, Antal anmälningar
  räknar bara aktiva (utför TASK-213.8 och 213.9)
status: Done
assignee: []
created_date: '2026-09-03 07:56'
updated_date: '2026-09-03 08:54'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-368
ordinal: 667000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: när Lotta avbokar en person (i appen eller i basen) sjunker eventets Antal anmälningar med ett, Platser kvar stiger med ett och ett event som var Fullt blir öppet igen. Inställda anmälningar räknas heller inte. Ingenting i appen ändras i denna skiva; det är basen som rättas, i staging först och i prod efter Marcus GO (fälttypsbyte i en delad bas, ADR-063: resolution i basen, aldrig lappa i appen). HITL på grund av prod-bytet och inventeringen. Täcker användarberättelser: 11, 20.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Staging-basen: Är aktiv (1/0) ger 0 för både Avbokad/Ombokad och Inställt; Antal anmälningar på Eventplanering är en rollup över Är aktiv och räknar bara aktiva; Platser kvar, beläggning och fullbokat-triggern (A6) läser det nya värdet — verifierat med schemaläsning och en granskningsfixtur (seed:review) där en avbokning frigör en plats
- [x] #2 Inventering FÖRE bytet: alla vyer, interfaces och automationer i prod-basen som läser Antal anmälningar/Är aktiv listade via claude.ai-Airtable-connectorn, med bedömning per post om bytet påverkar dem
- [x] #3 Prod-basen bytt EFTER Marcus GO i klartext (STOPPA-OCH-FRÅGA med inventeringen som underlag), samma schemaläsning efteråt; TASK-213.8 och 213.9 stängs med hänvisning hit
- [x] #4 docs/reference/data-model.md § Kända fällor post 27 och fälten uppdaterade; schema_reference.md-raden för Antal anmälningar markerad som ändrad med datum
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
App-halva + docs (denna PR, worktree-agent 2026-09-03, AC #4 GJORT): tre JS-predikat (Deltagare.tsx:177/Gruppdynamik.tsx:50/AtgardsSida.tsx:3179+3225, alla identiska 'arAktiv') konsoliderade till en delad arAktivAnmalan (src/lib/aktiv-anmalan.ts, egen refaktoreringscommit UTAN beteendeändring, sedan en fix-commit som utökar predikatet till att exkludera Status=Inställt utöver Avbokad/Ombokad). tests/api/aktiv-anmalan.test.ts (7 fall, alla sex RegistrationStatus-värden pinnade) — bidirektionellt bevisat: fälldes mot den gamla implementationen (Inställt-fallet), grönt mot den nya. hallplats-steg-prototyp.ts och EventCheckin.tsx MEDVETET lämnade orörda — bär egna, andra semantiker (steg-modell resp. dörrlista), replikerar inte Är aktiv-binären. docs/reference/data-model.md § Kända fällor post 27 markerad ÅTGÄRDAD + ny sektion 'Fält tillagda 2026-09-03' med staging-mätserien (fixtur ZZ-GRANSKNING-S115) och båda fält-ID:na (staging fld1LGJ6HVCLDJhFC, prod fldO9pTic9Mm8G6P4, prod-ID:t mottaget av orkestreraren mitt i denna sessions arbete); schema_reference.md fick daterade noter (rad ~122/126-127/215), historiken oskriven. DoD: npm run test:api (1872 passed, 1 unrelated staging-flake i generate-event-attachment.staging.test.ts — grön isolerat, orört av denna diff), npm run typecheck (0 fel), npx biome check . (0 fel), npm run build (grön), npm run check:docs (14/14 gröna), node scripts/check-langa-streck.mjs (0 ofångade). AC #1-3 (bas-mutationen) bockas av orkestreraren.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-09-03 08:54
---
Bas-halvan utförd av orkestreraren via claude.ai-Airtable-connectorn 2026-09-03 (S115 Del 4), utan fälttypsbyte: (1) Är aktiv-formeln exkluderar Inställt, (2) nytt rollup-fält Antal aktiva anmälningar = SUM över Är aktiv, (3) Antal anmälda = {Antal aktiva anmälningar} + {Manuella platser}; följdfälten och A6 följer automatiskt. Inventering: interfaces Verksamhetspuls och Eventmanager visar fälten (count-fältet lämnat orört för deras summering); inget av skripten A1/A3/A9/A10/A11 läser de berörda fälten; A6 triggar på Anmäld beläggning = 1 och fyrar efter fixen på aktiv fyllnad. Staging-bevis (kortlivad fixtur ZZ-GRANSKNING-S115, 1 avbokad + 1 inställd): Antal anmälningar 4→4, aktiva 4→2, anmälda 4→2, Platser kvar 16→18, beläggning 20→10 %. Prod (Marcus GO i klartext: 'Du har GO på fältbytet i prodbasen sedan'): Psionautics 88 anmälningar / 79 aktiva, Platser kvar 0→9, beläggning 100→90 %; Varberg RIM (inställt) 2 / 0 aktiva; de två Inställt-anmälningarna Är aktiv 1→0. App-halvan: PR #2232 (573a734d), landad. Rollback (formeltext verbatim, mätt före ändring, identisk i staging och prod): Är aktiv (1/0) fld4j7PeckDViTdIB = IF({fldWr5cCPNx9HEKtL}="Avbokad/Ombokad", 0, 1); Antal anmälda fldTQkYOz9O2BGEIZ = {fldU5MCQmagdHtz4G} + {fld8pUb6x2G3YIovs}. Återställ = sätt tillbaka de två formlerna och radera rollup-fältet Antal aktiva anmälningar (staging fld1LGJ6HVCLDJhFC, prod fldO9pTic9Mm8G6P4). Antal anmälningar (count, fldU5MCQmagdHtz4G) rördes aldrig.
---
<!-- COMMENTS:END -->
