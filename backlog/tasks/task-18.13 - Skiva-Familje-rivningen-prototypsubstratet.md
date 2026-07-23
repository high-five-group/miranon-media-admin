---
id: TASK-18.13
title: 'Skiva: Familje-rivningen (prototypsubstratet)'
status: Done
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-23 14:59'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.1
  - TASK-17.2
  - TASK-17.3
  - TASK-17.4
  - TASK-17.5
  - TASK-18.1
  - TASK-18.2
  - TASK-18.3
  - TASK-18.4
  - TASK-18.5
  - TASK-18.6
  - TASK-18.7
  - TASK-18.8
  - TASK-18.9
  - TASK-18.10
  - TASK-18.11
  - TASK-18.12
  - TASK-19.1
  - TASK-19.2
  - TASK-19.3
  - TASK-19.4
parent_task_id: TASK-18
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
När hela familjen är byggd och granskad rivs event-familjens konvergens-substrat: de fyra prototypsidorna (`src/components/events/prototype/*.tsx` — EventsList/EventDetail/SkapaEvent/ManuellAnmalan-Prototype), demo-datat och routernas `?variant=`-prototypgrenar (event/index · event/$eventId/index · event/skapa · event/$eventId/ny-anmalan). Faciten bärs vidare av bilagorna och git-historiken (throwaway-kontraktets klausuler iv och v — prototypkod absorberas aldrig, riven vid skarpa byggets slut).

**VÄXLAREN BEHÅLLS OCH FÅR EGET HEM (ADR-074 beslut 4 + Marcus-beslut B 2026-07-23).** `src/components/dev/PrototypeSwitcher.tsx` är en STÅENDE delad dev-komponent — ombyggd i S76 (TASK-29, ikon-railen) till permanent verktyg. Efter rivningen har den noll konsumenter och dess enda verifiering red på de `?variant=`-grenar som rivs; därför monteras den på en egen minimal dev-route `/dev/prototyper` (ADR-044-mönstret) så verktyget är levande och testbart mellan prototyp-passen.

**SCOPE-KORRIGERING 2 (2026-07-23, Marcus-beslut A): de tre 'döda ytorna' rivs INTE i denna skiva.** Disk-verifieringen vid implementationen (typecheck fällde rivningen) visade att de har LEVANDE konsumenter, tvärtemot kortets tidigare noter: (a) `/event/$eventId/narvaro` är målet för 'Gå till check-in' i Atgarder.tsx — ett öppet avgjort BELAGT-INTERIM-mål i task-18.3 tills check-in-sidan föds; (b) `/event/$eventId/anmalda` + EventRegistrations är länkmål för VARJE rad i AnmalningarList (Mer-vyn, Hems CTA); (c) AddRegistrationModal lever eller dör med (b). Rivning nu hade brutit två levande vägar eller tvingat in obeslutade UX-ändringar i en kontraktsstädning. De rivs när sina ersättare finns — anmälda-ytan när task-18.17 (per-anmälan-detaljvyn) kan ta över AnmalningarLists länkmål, närvaro-ytan när check-in-sidan föds.

Inga skarpa ytor rörs. Täcker inga användarberättelser — kontraktsstädning.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Prototyp-instanserna (fyra komponenter + demo-datat) och routernas ?variant=-prototypgrenar borta; appen bygger grönt utan DEV-prototyp-grenar
- [x] #2 PrototypeSwitcher.tsx BEHÅLLS (ADR-074 beslut 4) och monteras på egen minimal dev-route /dev/prototyper (Marcus-beslut B) — railen renderar, varianter stegbara, URL-kontraktet speglat
- [x] #3 Skarpa flödena opåverkade: e2e-sviterna över event-familjen gröna efter rivningen
- [x] #4 De tre levande ytorna (narvaro-routen + anmalda-routen/EventRegistrations + AddRegistrationModal) ORÖRDA per Marcus-beslut A — rivningen gated på ersättarna (18.17 respektive check-in-sidan)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FLAGGAT ur S75 batch 3 (task-18.4:s leverans): /event/$eventId/anmalda-routen + EventRegistrations.tsx + tests/e2e/event-anmalda.staging.test.ts är nu OÅTKOMLIGA från eventsidan — 18.4 rev interim-länken när arbetskön tog över ytan (samma mönster som 18.8 lämnade den gamla betalnings-vyn). Testerna passerar fortfarande eftersom de navigerar direkt till routen, så inget är rött; ytan är bara död. Rivningen hör till detta kort — flaggat så den inte glöms.

UTÖKAD RIVNINGSYTA ur S75 batch 4 (18.9:s leverans): standalone-närvaron är nu SUPERSEDERAD av det inline-registret men behållen per RIV INGENTING. Filerna: src/routes/_authenticated/event/$eventId/narvaro.tsx + EventAttendance.tsx + tests/e2e/event-narvaro.staging.test.ts. EventAttendance.tsx räknar dessutom fortfarande närvaro klient-side ur status medan registret nu binder basens Närvaropoäng (narvaropoang) — källinkonsistens som försvinner när standalone rivs. Lägg dessa i rivningens filuppsättning (utöver anmalda-vyn 18.4 flaggade).

UTÖKAD RIVNINGSYTA ur S75 batch 6 (18.12:s leverans): create-registration har nu TVÅ konsumenter med olika fält-omfång — den skarpa manuell-anmälan-sidan (ManuellAnmalanForm, 6 fält inkl. Antal platser + Notering) och den GAMLA AddRegistrationModal (/anmalda, 4 fält). Skillnaden är ofarlig men försvinner först när AddRegistrationModal rivs. Lägg modalen i rivningens filuppsättning (utöver anmalda-vyn + standalone-närvaron som redan flaggats).

SCOPE-KORRIGERING (2026-07-23, S75 Del 13 — Marcus-beordrad efter S76-läsning): kortets ursprungliga Description + AC #1 sa 'riv prototyp-växlaren'/'växlaren borta'. Det KONFLIKTAR med ADR-074 (rad 110–112 + beslut 4): 'PrototypeSwitcher är stående delad dev-komponent och består'. Konflikten är äkta, inte språklig. Rotorsak: kortet skrevs 2026-07-21, FÖRE S76; i S76 byggdes växlaren OM (T80-grillning → ADR-074 → TASK-29, ikon-railen genom sex Marcus-granskningsvågor) från slit-och-släng till PERMANENT delad dev-verktygsyta för kommande familjer/produkter. ADR-074 är nyare + styrande + adresserar 18.13 explicit → ADR:n vinner. Description + AC #1 omskrivna: 18.13 river de fyra prototyp-INSTANSERNA + demo-data + routernas ?variant=-grenar + de döda supersederade ytorna; PrototypeSwitcher.tsx BEHÅLLS.

DISK-VERIFIERAT rivnings-inventarium: (a) src/components/events/prototype/{EventsList,EventDetail,SkapaEvent,ManuellAnmalan}Prototype.tsx · (b) routernas prototypgrenar i event/index.tsx, event/$eventId/index.tsx, event/skapa.tsx, event/$eventId/ny-anmalan.tsx · (c) döda ytor: /event/$eventId/anmalda + EventRegistrations.tsx + event-anmalda e2e · standalone-närvaron (narvaro.tsx + EventAttendance.tsx + event-narvaro e2e) · AddRegistrationModal. BEHÅLLS: src/components/dev/PrototypeSwitcher.tsx.

ÖPPEN FÖLJDFRÅGA (Marcus vill resonera senare — EJ beslutad): efter rivningen har PrototypeSwitcher INGA konsumenter kvar i event-familjen (idag monteras den av instanserna + de fyra routerna). Alternativ A: låt den stå oanvänd (ren ADR-074-läsning, verktyget vilar tills nästa prototyp-pass). Alternativ B: ge den ett hem nu (t.ex. en /dev-route som monterar den) så den är levande/testbar. Code-gissning A, men Marcus beslutar. Detta avgör om rivningen får lämna en oanvänd-men-behållen komponent (kan kräva biome/dead-code-hantering) eller om ett litet /dev-mount ingår i 18.13:s scope.

LEVERANS (S75 femte resumen, 2026-07-23). RIVET: fyra prototypkomponenter + DEMO_EVENTS-datat (bodde i EventsListPrototype) + ?variant=-grenarna i alla fyra routerna; barrel-exporterna orörda (prototyperna exporterades aldrig därifrån). NYTT: src/routes/dev/prototyper.tsx — minimal ADR-044-grindad yta som monterar railen med två attrapp-varianter + en ensam-variant-form (växlaren BYTER FORM vid den gränsen: en variant ⇒ prototyp-ikon, flera ⇒ bokstavsknappar) och speglar ?variant=/?data= i en utskriven ruta så persistens- eller alias-regressioner är läsbara utan devtools. Renderings-verifierat mot dev-servern: rubrik + rail monterad, variant A stegbar (URL blir ?variant=A och rutan följer), noll sidfel.

FYNDET SOM STOPPADE RIVNINGEN (varför scope-korrigering 2 finns): typecheck fällde borttagningen av de tre 'döda' ytorna med tre TS-fel — Atgarder.tsx:79/110 (check-in-ingångens union-typ + länken) och AnmalningarList.tsx:130-131. Ytorna är alltså LEVANDE konsumenter, inte döda. Kortets tidigare noter var byggda ur eventsidans perspektiv ('oåtkomliga FRÅN eventsidan') vilket är sant men inte hela bilden. STOPPA-fråga ställd till Marcus → beslut A: låt dem stå, riv när ersättarna finns. Filerna återställdes orörda och e2e-sviterna för anmalda + narvaro står kvar gröna.

GRINDAR: typecheck 0 · biome 0 · build grön · test:api 375 passed · test:a11y 65 passed · e2e event-familjen 97/97 passed (inkl. event-anmalda + event-narvaro, dvs. de bevarade ytorna). TVÅ FLAKES i fullsvit, BÅDA GRÖNA ENSAMMA och orörda av denna ändring: tests/api/send-email.staging.ts (RESOLUTION LIVE-fallet) + tests/a11y/patterns/Listbox.spec.ts — samma isolerings-klass som TASK-34.

DoD #6 EJ TILLÄMPLIG som facit-avprickning: skivan rör inga facit-punkter (skarpa vyerna är oförändrade — e2e-sviterna ÄR beviset för det) och den enda nya ytan är dev-intern utan facit-bilaga. DoD #7 vakuöst uppfylld: inga bas-ändringar.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Familje-rivningen levererad (PR #98, merge-commit 3266d8a; PR-CI run 30017534176 GRÖN PER JOBB 6/6 inkl. Test + Build). RIVET: fyra prototypkomponenter + DEMO_EVENTS-datat + ?variant=-grenarna i alla fyra event-routerna — throwaway-kontraktets klausul iv/v verkställd; faciten lever i bilagorna (s72/s73-konvergens) + git-historiken. NYTT (Marcus-beslut B på kortets A/B-fråga): src/routes/dev/prototyper.tsx ger PrototypeSwitcher hemvist — ADR-074 beslut 4 gör den till stående verktyg, men efter rivningen hade den noll konsumenter OCH noll testtäckning (verifieringen red på de rivna ?variant=-grenarna). Ytan är minimal + ADR-044-grindad: två attrapp-varianter + ensam-variant-formen (railen byter form vid den gränsen) och ?variant=/?data= utskrivna. Renderings-verifierat: rail monterad, variant A stegbar (URL + ruta följer), noll sidfel. SCOPE-KORRIGERING PÅ MARCUS-BESLUT A: de tre 'döda ytorna' står KVAR — typecheck fällde deras borttagning och avslöjade levande konsumenter (narvaro-routen = check-in-ingångens BELAGT-INTERIM-mål från 18.3 · anmalda-routen = AnmalningarLists länkmål per rad · AddRegistrationModal = anmälda-vyns) tvärtemot kortets eventsidan-centrerade noter; rivningen är gated på ersättarna (18.17 respektive check-in-sidan). DESIGN-REVIEW GODKÄND av Marcus 2026-07-23 ('Det blir väl bra så länge. Kvitterar.') — DoD #5. DoD #6 EJ TILLÄMPLIG SOM FACIT-AVPRICKNING och bockad med motiv: skivan rör inga facit-punkter (de skarpa vyerna är oförändrade — e2e 97/97 över event-familjen ÄR beviset, inkl. sviterna för de bevarade ytorna) och den enda nya ytan är dev-intern utan facit-bilaga; renderad verifiering av dev-ytan gjord ändå (skärmdump + DOM-mätning). Grindar: typecheck 0 · biome 0 · build grön · api 375 · a11y 65. Två flakes i fullsvit, båda gröna ensamma och orörda av ändringen (send-email.staging + patterns/Listbox) — TASK-34:s isolerings-klass. Alla AC + DoD gröna.
<!-- SECTION:FINAL_SUMMARY:END -->
