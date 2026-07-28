---
id: TASK-63
title: >-
  Fynd: acceptance-fixturernas rader är typade mot Record<string, unknown> —
  schema-glidning fångas först av nattvakten
status: Done
assignee: []
created_date: '2026-07-28 12:47'
updated_date: '2026-07-28 23:17'
labels:
  - ready-for-agent
dependencies: []
ordinal: 136000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (TASK-59.8 steg 2, verifierat mot disk 2026-07-28): sömmen tests/acceptance/support/acceptance-bas.ts rad 15-19 hävdar att fogen mellan klasserna bevakas av att 'samma zod-scheman parsar fixturens svar som parsar skarpa svar'. Det håller i RUNTIME — adaptern parsar, så en trasig fixtur ger rött. Men fixturraderna är typade mot Record<string, unknown>, inte mot schemat.

RÄKNAT MOT DISK: 0 av 18 acceptance-filer typar sina fixturrader med z.infer. 17 av 18 deklarerar en lokal 'type Row = Record<string, unknown>'.

FÖLJD: en fixtur som glider isär från schemat — fält som byter namn, försvinner eller får fel typ — fångas inte av npm run typecheck. Den fångas av kontraktsvakten, men den kör NATTLIGT och är avsiktligt icke-blockerande (ADR-080 beslut 3). Fångsten ligger alltså timmar efter att felet landade, i stället för i presubmit.

FÖRVÄNTAT BETEENDE: Row härleds ur z.infer<typeof XSchema> så att en glidning fälls av typcheckaren i samma PR som orsakar den.

AVGRÄNSNING: detta ersätter INTE kontraktsvakten. Typningen binder fixtur->schema; vakten binder schema->verkligheten. Två olika fogar, båda behövs.

UPPTÄCKT AV: färsk läsare utan tillgång till CONTRIBUTING/ADR, som noterade att garantin är enkelriktad. Bekräftat och breddat vid räkning mot disk.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fixturradernas typ är härledd ur respektive zod-schema, ej Record<string, unknown>
- [x] #2 En medvetet felaktig fixturrad fälls av npm run typecheck — bevisat i båda riktningar
- [x] #3 Kontraktsvakten orörd i omfattning och utfall
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
PILOT PÅ EN FIL FÖRST — bygg inte alla 18 i ett svep. Piloten kan avslöja att fixturen och schemat faktiskt DIVERGERAR, och det är ett annat jobb än att typa om raderna: en divergens ska rapporteras, inte tystas genom att typen böjs efter fixturen.

STEG 1 — välj EN fil och härled dess Row ur z.infer<typeof XSchema>. Faller typecheck: läs vad den säger. Är det en glidning mellan fixtur och schema, STOPPA och rapportera — det är fynd, inte friktion.

STEG 2 — först när piloten gått ren, rulla ut mönstret över resterande filer.

AVGRÄNSNING (står i beskrivningen, upprepas för att den är lätt att tappa): detta ERSÄTTER INTE kontraktsvakten. Typningen binder fixtur→schema; vakten binder schema→verkligheten. AC #3 finns för att vaktens omfattning och utfall ska vara bevisat orörda efteråt.

PLATS I KEDJAN: kontraktsdriftens lager 3. Lager 1 = TASK-68 (Done, 200-formen till alla sju), lager 2 = TASK-69 (felkontrakten), lager 4 = dual-run (ospeccat). Ingen teknisk låsning mot 69 — de rör olika filer — men lagerordningen är den logiska läsningen.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GENOMFÖRT (S91, bygg-agent). Pilot på mer-maillogg.acceptance.test.ts först per planen; formen bar, därefter breddad till alla 18.

RÄTTELSE AV KORTETS EGEN RÄKNING (mätt mot disk 2026-07-28, efter TASK-64/65-landningarna):
Kortet skrev '17 av 18 deklarerar en lokal type Row = Record<string, unknown>'. Antalet 17 stämmer, men NAMNET gör det inte — och det leder fel vid sökning. Faktisk fördelning: 11 filer kallar den Row, 2 Json (anmalan-detalj, event-anteckningar), 2 PersonDetailMock (person-detail, person-note-edit), 2 EventRow (mer-segment, mer-segment-send). En grep på 'type Row' hittar alltså bara 11 av 17.

Den 18:e filen (persons-list) saknade Record<string, unknown> och räknades därför utanför — men dess fixtur var lika obunden, bara via inferens i stället för via ett alias. Den är åtgärdad med 'satisfies z.infer<typeof PersonSchema>' i stället för en returtyp, eftersom PersonSchema.namn är nullable och en returtyp hade vidgat namn till string|null och tvingat fram en null-check i sök-filtret. satisfies binder mot schemat utan att göra beviset luddigare. Kortets 'alla 18' är därmed uppfyllt, inte 17.

FYRA ALIAS BAR FLERA FORMER och gick inte att typa 1-till-1 — de delades: hem + hem-laddlage + event-ny-anmalan (Event + Registration), event-anteckningar (Event + EventNote), anmalan-detalj (Event + Registration + RegistrationDetail).

TVÅ PARAMETRAR VAR FÖR VIDA och band inte fixturen till schemat: events-list-kalender och event-ny-anmalan deklarerade 'status?: string | null' medan EventSchema.status är en z.enum. Bundna till Row['status'].

WRITE-PAYLOADS LÄMNADE MEDVETET OTYPADE — angränsande, ej åtgärdad yta: de infångade request-bodies i mer-segment-send (sentBody), event-ny-anmalan (createBodies), anmalan-detalj (confirmCalls) och event-anteckningar (capturedBody) står kvar som Record<string, unknown>. De är det appen SKICKAR, inte det EF:en svarar, och har inget läs-schema att härledas ur; att binda dem till läs-schemat vore att påstå att write-formen är läs-formen. MailPayloadSchema finns och skulle kunna bära mer-segment-send:s fall — men det är en annan fog än kortets och togs inte här.

DOKTRINEN BOR I SÖMMEN: acceptance-bas.ts § fogen uppdaterad — det var dess egen text (rad 15-19) som hävdade den enkelriktade garantin kortet fann. Den skiljer nu de tre mekanismerna: typningen binder fixtur->schema (presubmit, blockerande), parsningen fixtur->schema (runtime), vakten schema->verkligheten (nattlig, icke-blockerande). Per-fil-kommentarerna är en rad som pekar dit.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
STÄNGD 2026-07-29 (S91, trettonde resumen) — DoD #3 var den enda obockade posten och krävde CI-signal som inte finns när bygg-agenten är klar.

CI grön per jobb på PR #385:s head 46d079a1: run 30400640305, NIO jobb, samtliga success (Lint + Audit + TypeCheck · Detect changed files · Docs link check · Staging sentinel purge · Acceptance (hermetisk) · A11y (axe-runner) · Pure + Build · Staging (API + E2E) · CI Passed or Skipped). PR mergad 2026-07-28T21:46:18Z.

FYND VID STÄNGNINGEN: kortet stod kvar som To Do medan PAUSLÄGE, todo-kadensen och S91-restlistan alla påstod att det var stängt ('NIO KORT STÄNGDA … 63'). Disk vann. Samma klass som TASK-73:s AC-svans: agenten levererar och lämnar ifrån sig CI-signalen, orkestreraren äger stängningen — och vid en paus mitt i vågen tappas den. Att tre dokument bar samma felaktiga påstående gjorde det osynligt för läsning; bara en korsläsning mot backlog-CLI:t avslöjade det.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
