---
id: TASK-218.1
title: 'Skiva: Startvärmningsmotorn — warmup-modul med äkta förloppsräkning'
status: In Progress
assignee: []
created_date: '2026-08-15 08:46'
updated_date: '2026-08-15 09:27'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-218
ordinal: 415000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: efter auth-resolution vid kall/stale cache startar motorn en hämtning per datamängd ur det definierade warmup-setet, rapporterar löpande förlopp (klara/totalt) till konsumenten, seedar varje svar till både hem-kortens poll-nyckelfamilj och listornas nyckelfamilj (hämta-en-gång-dela, ADR-112), och avslutar med släpp-besked — direkt vid offline (online-gate), vid fylld räkning, eller vid hård timeout ~8–10 s med delresultat. Payload-identiteten mellan nyckelfamiljerna verifieras vid bygget; spricker den → öppen fallback till dubbelhämtning, bokförd i notes. Täcker användarberättelser: 5, 8 (PRD TASK-218).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Motorn exponerar förlopp (klara/totalt) bundet till faktiska query-avslut — aldrig en fejkad animation
- [x] #2 Offline vid start ⇒ direkt-släpp utan startade hämtningar; hård timeout ⇒ släpp med delresultat
- [x] #3 En hämtning per datamängd seedas till båda cache-nyckelfamiljerna; ADR-017:s poll-scope orört; payload-identitet verifierad eller öppen fallback bokförd
- [x] #4 Hermetiska tester (räkning, timeout, offline-gate, seed-delning) gröna utan staging-beroende
- [x] #5 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verifierat/utfört (bygg-agent, gren docs/task-218-1-warmup-motorn):

PREMISS-PASS: PR #1324 (PRD-landning) landad på main (f3bce1e4) och PR #1326
(to-issues-splitten, TASK-218.1s kortfil) landad på main (18e4298a) INNAN bygget
startade — verifierat via `gh pr view`/`git fetch` (väntade ~1 min på #1326:s
merge-queue-passage). ADR-112 + ADR-113 fanns redan på main via #1324.

PAYLOAD-IDENTITET (AC #3) — VERIFIERAD STATISKT, ingen öppen fallback behövs:
`src/components/events/EventsList.tsx:197` och `src/components/hem/
useDashboardData.ts:71` anropar BÅDA `dataSource.fetchEvents()` utan argument;
`src/components/registrations/AnmalningarList.tsx:50` och `useDashboardData.ts:60`
anropar BÅDA `dataSource.fetchRegistrations()` utan argument. Ingen av de fyra
anropsplatserna skickar ett filter — payloaden kan inte divergera (samma
nollställda signatur). Modulen hämtar därför EN gång mot list-nyckelfamiljen
(`events.list`/`registrations.all`) och seedar `dashboard.events`/
`dashboard.registrations` via setQueryData — ADR-017:s poll-scope orört.

AVVIKELSE FRÅN UPPDRAGETS KONTRAKT-SKISS ("starta(qc)"): `starta()` tar TVÅ
argument — `starta(qc, { dataSource })`, dataSource OBLIGATORISK — inte en
statisk modul-import av singletonen (research-passets skiss, med router.ts som
precedent). Orsak, mätt konkret vid `npm run typecheck`: `src/data/dataSource.ts`
→ `AirtableAdapter` → `supabase-client.ts` → `src/env.ts` läser `import.meta.env`;
`tests/`-projektets `tsconfig.tests.json` sätter `"types": ["node"]` (TASK-201.3-
precedent, ingen vite/client) — en hermetisk test som importerade
startvarmningen.ts hade transitivt fällt TS2339 på `src/env.ts`. Lösningen speglar
`src/data/activityLog/recordActivity.ts`s etablerade DI-mönster i stället. Den
statiska dataSource-importen bor kvar hos ANROPAREN (TASK-218.3s InnerApp-
integration), en nivå uppåt — samma "kör före router-context"-verklighet, bara
inte inuti denna ren-modul. Fullt resonemang i modulens filhuvud.

KÄND KOPPLINGSRISK, bokförd öppet: `HEM_SENASTE_AKTIVITET_LIMIT = 4` i
startvarmningen.ts är hårdkodat och SPEGLAR (importerar inte) `SenasteAktivitet.tsx`
rad 88 (`ANTAL_RADER`). `limit` är del av query-nyckeln — ändras ANTAL_RADER utan
att detta tal följer med, seedar warmup en nyckel Hem-kortet inte läser. Inget
test här fångar den driften (skulle kräva att modulen kände till UI-komponentens
konstant — exakt kopplingen som flaggas).

RÖTT-FÖRST-BEVIS (två riktningar, körda och återställda): (1) inverterad
online-gate → testet "offline vid start" fällde korrekt (förväntade 'offline',
fick 'klar'); (2) avstängd setQueryData(dashboard.events, ...) → testet "hämtas
EN gång... BÅDA nyckelfamiljerna" fällde korrekt (förväntade sentinel, fick
undefined). Källkoden återställd bit-identiskt, hela testfilen grön igen efteråt
(8/8).

DoD-kvartetten, mätt (denna gren, denna commit):
- npm run typecheck → exit 0
- npx @biomejs/biome check . → exit 0 (0 fel; 6 warnings/42 infos, pre-existing i
  andra filer, orörda av denna skiva)
- PLAYWRIGHT_NO_WEB_SERVER=1 playwright test --project=api-pure --project=api-staging
  (npm run test:api) → 758 passed, exit 0
- npm run build → exit 0

Hermetiska tester (AC #4), tests/api/startvarmningen.test.ts, api-pure (ingen
staging): 8/8 gröna — online-gate, äkta settled-räkning (monoton 0→7),
avprenumerering, hämta-en-gång-dela (dual + enkel nyckelfamilj + varm-cache
no-network), hård timeout med hängande hämtning, slutlöfte kastar aldrig
(avvisad hämtning).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Startvärmningsmotorn byggd som ren modul (src/data/warmup/startvarmningen.ts):
starta(qc, {dataSource}) → förloppsprenumeration {klara,totalt} + slutlöfte
{utfall: klar|offline|timeout}. Online-gate FÖRE start, hård timeout 9s
(mittpunkt 8-10s), batchad sekvensering (2 åt gången, Airtable-taket),
hämta-en-gång-dela för events/registrations (payload-identitet verifierad
statiskt, ingen fallback behövd), enkel seedning för waitlist/intresserade/
maillog/segment/activityLog. 8 hermetiska tester (tests/api/startvarmningen.test.ts,
api-pure) — alla fyra AC-fokusområden (räkning/timeout/offline/seed-delning)
gröna, två röd-först-bevis körda. DoD-kvartetten grön. PR öppnad och armerad
mot main; CI-verifiering och Done-flipp ägs av orkestreraren.
<!-- SECTION:FINAL_SUMMARY:END -->
