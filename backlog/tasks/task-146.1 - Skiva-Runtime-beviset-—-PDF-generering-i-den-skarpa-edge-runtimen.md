---
id: TASK-146.1
title: 'Skiva: Runtime-beviset — PDF-generering i den skarpa edge-runtimen'
status: To Do
assignee: []
created_date: '2026-08-07 09:04'
updated_date: '2026-08-07 10:17'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-146
ordinal: 240000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Innan något byggs ovanpå antagandet att vi kan generera PDF:er inom plattformen ska antagandet stängas skarpt. Research-passet mätte biblioteket under Node som MEDVETEN PROXY eftersom Deno saknades i den körmiljön, och redovisade öppet att beteendet i den skarpa runtimen är overifierat. Denna skiva finns enbart för att stänga den luckan — den är grind mot resten av kortet, inte en byggsten.

Känd öppen risk att hålla utkik efter: ett avbrytande fel i runtimen ('cancelled by supervisor') är rapporterat i plattformens egen diskussionsyta utan känd rotorsak.

Täcker användarberättelser: 9
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En minimal edge-funktion genererar en PDF i den RIKTIGA Supabase-runtimen — inte under Node
- [x] #2 Svenska tecken (å ä ö Å Ä Ö) återges korrekt med bibliotekets inbyggda typsnitt, verifierat i den genererade filen
- [x] #3 Minnesåtgång, CPU-tid och kallstart mätta och bokförda mot plattformens tak
- [x] #4 Utfallet bokfört som BEVIS eller som FALSIFIERING — faller det, stoppas kortets övriga arkitektur och alternativet omprövas
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RUNTIME-BEVIS (ej falsifiering) — mätt skarpt mot staging (pqtshyierkdgwdnxuirz),
2026-08-07. Edge-funktion supabase/functions/test-pdf-generation/ (verify_jwt=true,
requireUser, STAGING-ONLY — medvetet UTELÄMNAD ur .prod-functions-allowlist.conf,
samma mönster som test-auth/test-invite-completion) deployad manuellt via
`supabase functions deploy test-pdf-generation --project-ref pqtshyierkdgwdnxuirz`
(ADR-050: ingen deploy-automatik).

AC #1 — runtime bekräftad LIVE: svaret bär `runtime.deno = "supabase-edge-runtime-1.74.2
(compatible with Deno v2.1.4)"` — genuint Deno-baserad Edge Runtime, aldrig Node.

AC #2 — svensk text (å/ä/ö/Å/Ä/Ö + em-dash) verifierad TVÅ oberoende vägar mot den
FAKTISKA genererade filen: (a) `pdftotext -layout` (poppler, samma metod som
research-passet) på den riktiga base64-avkodade PDF:en gav ORD-EXAKT extraktion;
(b) automatiserat test (tests/api/test-pdf-generation.staging.test.ts) inflaterar
FlateDecode-komprimerade content-streams med node:zlib (inbyggt, ingen ny
dependency) och verifierar den exakta WinAnsi-hex-bytesekvensen. NEGATIV KONTROLL
körd och reverterad: en medvetet fel encoding-byte (0x99 i st f 0x97 för em-dash)
fick testet att falla med tydlig diff — bevisar att gaten diskriminerar, inte
vacuously passerar.

AC #3 — mätvärden (skarpt, 2026-08-07):
- Minne: Deno.memoryUsage() ÄR anropbart i Edge Runtime. heapUsed före ~11,2-11,3 MB,
  efter ~14,0 MB PDF-generering — delta ~2,8 MB, långt under 256 MB-taket. `rss`
  returnerar KONSEKVENT 0 (plattformsbegränsning, ej populerat i denna sandlådemodell —
  dokumenterat i kod/test, inte gissat).
- CPU-tid: Edge Runtime exponerar ingen äkta CPU-tids-API till funktionskod (taket
  verkställs av supervisorn utanför sandlådan). Wall-clock-proxy runt
  PDFDocument.create()→save(): ~17,8-19,0 ms över 6 mätta anrop — långt under 2s-taket.
- Kallstart: externt mätt (round-trip, JWT redan hämtad). Första anropet efter
  fresh deploy: 1180 ms. Fyra påföljande varma anrop: 290/293/312/316 ms. Delta
  ~870-890 ms tillskrivs isolate-kallstart, inte generation (generationMs stabil
  ~18ms oavsett kallt/varmt).
- "cancelled by supervisor"-risken (kortets kända öppna risk) INTRÄFFADE INTE i
  något av ~9 skarpa anrop under detta bygge.

AC #4 — BEVIS, inte falsifiering. Antagandet håller.

DoD #6 och #7 lämnade OKRYSSADE (ej tyst avbockade) — EJ TILLÄMPLIGA på denna
skiva: TASK-146.1 rör varken UI-lagret (src/) eller DataSourceAdapter-kontraktet
(inga adapter-metoder lades till — det är TASK-146.4), och rör inte basens
data/schema alls (inga fält/tabeller skapade eller ändrade — Bilagor-tabellen är
TASK-146.2). Post #8 (väggkatalogen) ÄR tillämplig och landad: P28+P29 i
docs/reference/airtable-constraints.md § G, plus uppdaterad räkning i CLAUDE.md
(27→29 poster, A–F→A–G).

DoD #3 (CI grön per jobb) lämnas okryssad — orkestrerarens ansvar efter push,
per uppdragets instruktion.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 PDF-biblioteket skarpt verifierat mot den riktiga edge-runtimen (ej Node-proxy) INNAN övrig arkitektur byggs ovanpå
- [ ] #6 Lager-oberoendet mekaniskt fällt: noll direkta lagrings-anrop i UI-lagret + port-paritet i BÅDA adaptrarna
- [ ] #7 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [x] #8 Väggkatalogens två attachment-poster landade
<!-- DOD:END -->
