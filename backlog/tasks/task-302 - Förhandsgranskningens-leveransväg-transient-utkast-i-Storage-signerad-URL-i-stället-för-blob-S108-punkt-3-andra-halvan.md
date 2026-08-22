---
id: TASK-302
title: >-
  Förhandsgranskningens leveransväg: transient utkast i Storage + signerad URL i
  stället för blob: (S108 punkt 3, andra halvan)
status: To Do
assignee: []
created_date: '2026-08-22 21:16'
labels:
  - prd
dependencies: []
priority: high
ordinal: 552000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PRD-kort (förälder). Skivorna är barnen. Beslut: orkestreraren på Marcus mandat (*"Du har mandat att besluta ingången här"*, S108 resume 7, 2026-08-22). Styrande ADR: `ADR-124` (mintas i samma resume). Sessionsdok: `tasks/sessions/2026-08-20-session-108.md` Del 10–11.

## Problemet, mätt (inte antaget)

Samma 174 KB-PDF scrollar PERFEKT i Chrome när den serveras av nätverkstjänsten (`http://`), och LAGGIGT via varje klient-sidig leverans — `blob:` (dagens väg), Service Worker ur Cache API med 206/Range, SW-passthrough av ett nätverkssvar, och båda med `noopener` (Marcus headed A/B i riktig Chrome 151, sex armar, scratchpad-riggen `sw-range-rigg/matning.md`; Del 10 § B punkt 3 + Del 11). Range-stöd är INTE förklaringen (referensservern saknar det). Innehållet är friat av två oberoende agent-pass. Slutsats: leveransen måste vara en riktig URL serverad av nätverkstjänsten ⇒ server-sidig.

## Vägvalet (research: `docs/research/pdf-forhandsgranskning-serverlosning-natverkstjanst-2026-08-22.md`)

1. **Transient objekt i Supabase Storage + kort signerad URL — VALT.** Enda kandidaten med förkravet mätt i VÅR miljö (`accept-ranges: bytes`, 206 på riktig signerad URL, Del 10 § C). Samma mönster som klass A redan använder (`get-attachment-download-url`, `SIGNED_DOWNLOAD_URL_TTL_SECONDS = 300`).
2. DocRaptor hosted documents — förkastat: publik, oautentiserad extern URL med persondata (`T171`-klassen) + nytt betalt tillägg.
3. EF som GET-svarar — förkastat: motstridigt källäge om Kong-omskrivning av `application/pdf`, egen token-mekanism utan precedent, ~10 s tom flik.

## Kontraktsbrottet, öppet — AC #3 (`TASK-146.5`) amenderas, rivs inte

`generate-event-attachment/index.ts` rad 64–68 och `preview-receipt/index.ts` rad 10–30 förbjuder i dag ALL Storage-skrivning i förhandsvisningen och avvisar uttryckligen *"sidoeffekter som sedan städas"*. Premissen var att bytes till klienten räcker — den föll med mätningen ovan. Ny formulering (in i båda filhuvudena, verbatim): **"Förhandsvisningen har noll KONSUMENT-SYNLIGA sidoeffekter: ingen Bilagor-rad, inget allokerat kvittonummer, inget mail. Den skriver ett TRANSIENT utkast under `utkast/<eventId>/<typ>.pdf` i bucket `bilagor` — aldrig listat i appen, överskrivet per event och typ (`upsert`), borttaget vid skarp generering — för att Chromes PDF-visare bara scrollar jämnt på en URL serverad av nätverkstjänsten (ADR-124)."**

## Designbeslut som BINDER skivorna

- Sökväg `utkast/<eventId>/<typ>.pdf`, `typ` ∈ `bilaga` | `kvitto` | `deltagarinformation`; `upsert: true` ⇒ högst EN transient fil per event och typ — mängden växer med events, inte med antal förhandsgranskningar. Ingen cron behövs för att hålla den bunden.
- Signerad URL med `SIGNED_DOWNLOAD_URL_TTL_SECONDS` (300 s) — samma konstant som klass A, ingen ny.
- Bucket `bilagor` är privat (klass A går redan via signerad URL) — utkastet ärver det. Persondata i kvitto-utkastet exponeras bara via den signerade, kortlivade URL:en; bokförs i `T171`.
- Städning: (a) skarp generering för event E tar bort `utkast/<E>/` (utkastet är ersatt); (b) staging: target i `.purge-staging-policy.json` så testutkast inte ackumuleras; (c) prod: bunden mängd per konstruktion, ingen tidsstyrd städning i denna enhet — bokförs som känd rest i ADR-124.
- Klienten slutar bygga `blob:` för klass B/C; `hamtaDokumentUrl` returnerar Storage-URL:en för alla tre klasser. `DocumentPreviewSchema` går från `{ pdfBase64 }` till `{ url, utgar }`.
- `window.open` sker i användarens klick (dagens mönster) — URL:en är cross-origin (supabase.co), så appens Service Worker (`src/sw.ts` `NavigationRoute`) rör den aldrig. Det är MÄTT att en SW-fångad leverans laggar — lägg aldrig utkast-URL:en under appens origin.
- Prod-EF-deploy är Marcus moment via `scripts/fas4-prod-deploy.sh` (CLAUDE.md § Prod-EF-deploy) — ingår inte i skivorna.

## Acceptans för HELA enheten

Marcus öppnar en förhandsgranskning i prototypen (bilaga) och i Dokument-ytan (kvitto, klass C) från staging och bedömer scrollen som likvärdig med `http://`-referensen (arm A). Det är kriteriet ur handoffen — mekaniska bevis räcker inte.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
