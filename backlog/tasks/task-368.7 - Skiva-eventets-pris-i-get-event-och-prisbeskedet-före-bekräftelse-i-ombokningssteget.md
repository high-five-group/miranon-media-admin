---
id: TASK-368.7
title: >-
  Skiva: eventets pris i get-event och prisbeskedet före bekräftelse i
  ombokningssteget
status: To Do
assignee: []
created_date: '2026-09-03 12:43'
updated_date: '2026-09-03 15:45'
labels:
  - ready-for-agent
dependencies:
  - TASK-368.5
parent_task_id: TASK-368
ordinal: 682000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: när Lotta väljer ett event i ombokningssteget ser hon redan innan hon bekräftar vad det nya eventet kostar och vad mellanskillnaden blir ('Nya eventet kostar X kr, Y kr blir att återbetala' / 'saknas Y kr' / 'samma pris'), samma ordalydelse som kvittot efter bekräftelse (368.5). Bakgrund: 368.5 (PR #2267) kunde inte visa beskedet före bekräftelse eftersom get-event/get-events inte returnerar eventets pris (disk-verifierat av byggaren mot supabase/functions/_shared/event-map.ts § mapEventBas och src/domain/schemas/Event.schema.ts) och rebook-registration saknar torrkörningsläge. Lösningen är additiv: eventets pris exponeras i event-mappningen (läs fältets form i docs/reference/data-model.md först; skriv aldrig mot fältet), schema + typ utökas, och ombokningssteget räknar mellanskillnaden klient-sidigt ur pris minus den aktuella anmälans aktiva inbetalningssumma (samma tal som serverns prisskillnad, verifiera mot _shared/rebook-registration.ts så de två aldrig kan skilja sig i tecken). Täcker användarberättelse 13 (PRD TASK-368). Stänger 368.5 AC #3:s öppna halva.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 get-event och get-events bär eventets pris (null när pris saknas); Event-schemat, typen och EF-allowlisten är utökade; API-test prövar fältet mot staging
- [x] #2 Ombokningssteget visar prisbeskedet före bekräftelse med exakt samma ordalydelse och tre grenar som kvittot efter bekräftelse; klientens och serverns prisskillnad kan inte skilja sig i tecken (test)
- [ ] #3 Acceptanstestet för ombokning (tests/acceptance/anmalan-ombokning.acceptance.test.ts) utökas med prisbeskedet före bekräftelse i alla tre grenar; axe noll överträdelser
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Facit-granskning mot tasks/sessions/bilagor/s83-anmalningsvyn-konvergens/ (ADR-102 R3): amenderingsfilen för ombokningssteget uppdateras med prisbeskedet, aldrig ett nytt manifest
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation Notes (TASK-368.7)

### Premiss-pass (ADR-086) — divergenser

1. **Uppdragets "EF-allowlisten (`_shared/field-allowlists.ts` om priset måste
   tillåtas där)" — EJ TILLÄMPLIGT, verifierat.** Allowlisten gäller SKRIVNING
   (`OperationDef.allowedFields` = "fältnamn som operationen får sätta",
   deny-by-default). `Pris (kr)` läses bara; ingen operation rörs. Kortets AC #1
   säger "EF-allowlisten är utökad" — den delen är alltså inte uppfyllbar och
   heller inte nödvändig.

2. **`Eventplanering.Pris (kr)` är per-event-OVERRIDE, inte primärkällan.**
   `data-model.md` rad 805: "Tomt = Eventinnehållets standard gäller (härleds i
   KOD)". Mätt mot staging (`apphjj8Q7lkXCMsL4`, MCP, 2026-09-03): **3 av 45**
   Eventplanering-rader bär ett eget `Pris (kr)`. Ett `pris` som bara läste
   nivå 2 hade alltså varit `null` för nästan varje event — skivan hade blivit
   verkningslös. Därför gör alla tre läs-EF:erna Eventinnehåll-uppslaget.

3. **Uppdragets "hitta var den summan redan finns i detaljsidans data" — den
   finns, men BAKOM `betalningarPa()`.** `RegistrationDetail` bär ingen
   inbetalningssumma (schemat disk-läst). Enda källan som är sant identisk med
   serverns tal är `Inbetalningslista.spegel.summaPostgres`
   (`hamta-inbetalningar` räknar den med SAMMA uttryck som `harledBetalning`),
   och den hämtningen är flaggad. Basens `Summa inbetalt (kr)` hade varit
   oflaggad men är en spegel som får släpa (ADR-128 beslut 6) — att bygga just
   den axel AC #2 handlar om på ett tal som får avvika hade varit att lova en
   garanti vi inte har.

4. **#2267 (368.5) hade LANDAT vid pushtillfället** (`0fed8d7a` på main), så
   grenen är rebasad på `origin/main` och PR-diffen bär bara denna skiva.

### AC-status, mätt

- **AC #1 — EJ BOCKAD.** `pris` bärs av get-event/get-events (+ update-event,
  se nedan), Event-schemat och typen är utökade, och API-testet finns
  (`tests/api/get-event.staging.test.ts`, tre nya fall). Men: **staging-EF:erna
  är inte deployade**, så testet är RÖTT — 12 passade, 3 fällda, med rätt skäl
  (`get-events utelämnade 'pris' för en rad`). Det är ett tvåsidigt bevis att
  grinden biter, men inte att fältet når fram. Allowlist-delen är ej tillämplig
  (punkt 1 ovan). Bockas när EF:erna deployats till staging.
- **AC #2 — BOCKAD.** Prisbeskedet före bekräftelsen byggs av `prisbesked`,
  samma funktion och samma tre grenar som kvittot. Teckenpariteten är bevisad
  starkare än AC:t kräver: `tests/api/ombokning-prisparitet.test.ts` kör 17
  indata-par genom BÅDA formlerna och kräver samma TAL, samma TECKEN, samma
  summa-led och samma renderade MENING (117 fall gröna tillsammans med
  `event-map.test.ts`).
- **AC #3 — EJ BOCKAD, delvis.** Acceptansfilen är utökad (19/19 gröna, axe 0
  överträdelser) och fixturvärldens event-mockar bär `pris`. De TRE GRENARNA
  kan dock inte visas i klassen: `playwright.config.ts` sätter
  `VITE_FEATURE_BETALNINGAR: 'av'` för hela acceptance-webServern (delad med
  visual/webblasarbeteende/manifest-screenshots), och fixturvärlden bär inga
  betalnings-EF-mockar — flaggflippen är `TASK-346.6/346.7`s arbete. Det nya
  fallet låser i stället det som ÄR observerbart: att steget inte gissar ett
  tal, och inte påstår "priset är inte satt" om ett event som ÄR prissatt.

### Beslut som inte stod i uppdraget

- **`update-event` ingår** trots att AC #1 bara nämner get-event/get-events.
  `useUpdateEvent` MERGE-cachar svaret (`{ ...prev, ...updated }`), så ett
  `pris: null` därifrån hade skrivit över ett korrekt uppslaget pris i
  detaljcachen så fort Lotta redigerat eventet.
- **De rena text-/talfunktionerna flyttades till `ombokning-pris.ts`.** Mätt
  skäl: `ombokning-kvitto.ts` augmenterar `@tanstack/react-router`, och ett
  testimport under `tsconfig.tests.json` fäller `TS2664: Invalid module name in
  augmentation`. Komponenterna importerar typen därifrån och bär därmed
  augmenteringen vidare (verifierat: typecheck fäller annars).
- **Uppslagets urval och indexering bor i `event-map.ts` (rent), I/O:t i
  `eventpris.ts` (Deno).** Utan snittet hade uppslagslogiken bara kunnat
  bevisas mot en deployad staging-EF, alltså inte i den PR som skriver den.

### Öppen skuld (orkestreraren)

**Staging-deploy av `get-event`, `get-events` och `update-event`.** ADR-050
§ Konsekvenser: ingen deploy-automatik; ingen workflow deployar EF till staging
(disk-verifierat). `ci.yml` skickar `run_staging: false` villkorslöst, så
PR-ytan påverkas inte — skulden träffar `post-merge`/`nightly`. Ej utförd av
byggagenten med avsikt: skarp operation mot delad miljö med sticky
`supabase link`-tillstånd.

### Grindar (exitkoder, mätta 2026-09-03)

`npm run typecheck` 0 (om efter rebase) · `npx @biomejs/biome check .` 0 ·
`npm run build` 0 · `node scripts/check-langa-streck.mjs` 0 (312 filer) ·
`npm run check:docs` 0 (14 gröna) · `bash scripts/check-facit.sh` 0 ·
api-pure 1654 passed · acceptance ombokning+avbokning 28 passed (om efter
rebase) · anmalan-detalj + avbokning 16 passed · `get-event.staging` 12
passed / 3 failed (deploy-skulden ovan).
<!-- SECTION:NOTES:END -->
