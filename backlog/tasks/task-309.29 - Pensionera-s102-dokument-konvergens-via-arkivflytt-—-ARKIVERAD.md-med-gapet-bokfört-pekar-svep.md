---
id: TASK-309.29
title: >-
  Pensionera s102-dokument-konvergens via arkivflytt — ARKIVERAD.md med gapet
  bokfört, pekar-svep
status: To Do
assignee: []
created_date: '2026-08-26 04:57'
updated_date: '2026-08-28 03:10'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 595000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beslut (orkestreraren på Marcus mandat i klartext 2026-08-26, S108 resume 11): TASK-309.21 AC #1 = PENSIONERA, inte omstämpla. Underlag: docs/research/facit-pensionering-s102-2026-08-26.md (PR #1991) — --ersatt är omstämpling av SAMMA manifest (byter bara godkand), aldrig en pensioneringsmekanism; s102:s kärnbeskrivna funktion (dialog-Visa) är riven ur koden (DokumentYta.tsx docblock rad ~75–87, TASK-273.4); kanonisk form = ARKIVFLYTT (tasks/lessons.d/superseded-facit-arkivflyttas-aldrig-raderas.md, prejudikat s55-hem-konvergens → tasks/sessions/archive/bilagor/, TASK-243.1 PR #1426). Under ADR-baren: formen är redan mekaniserad via FACIT_BILAGE_ROT (arkivet ligger utanför grindens svep).

GÖR (research-filens § 1, steg 1–4): (1) git mv tasks/sessions/bilagor/s102-dokument-konvergens tasks/sessions/archive/bilagor/s102-dokument-konvergens — hooken deny-facit-godkand-skrivning.sh matchar inte en filsystemsflytt (verifierat i research § 1), men rör ALDRIG godkand-fältet. (2) Skriv ARKIVERAD.md i samma form som s55:s: superseded av s108-generering + s108-dokumentytan, Marcus vägval (mandat 2026-08-26), OCH GAPET explicit: ingen av de tre manifesten visar ett valt events fullt filtrerbara dokumentlista med dagens ikonpar-Visa-beteende (research § 5) — uppföljning i TASK-309.32. (3) Pekar-svep i LEVANDE filer (inte historiska sessionsdok/kort): .facit-policy.conf ~151, src/components/dokument/DokumentYta.tsx rad 6/86/134/419, tests/e2e/mer-index.staging.test.ts:47, tests/visual/dokument-visual.spec.ts:10, docs/decisions/ADR-102 rad ~328 — uppdatera sökvägar/kommentarer till arkivet; grep-verifiera att inga programmatiska referenser finns. (4) De tre AMENDERING-filerna i katalogen flyttar MED och förblir orörda (frusna, som s55:s). Efteråt: bash scripts/check-facit.sh exit 0 och dokumentationsgrindarna exit 0 (fånga exitkoderna). TASK-309.21 AC #1 och #2 (s102-delen) bockas i denna skiva med hänvisning; s106/s111:s omstämplingar är Marcus (--ersatt), kvar öppna.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Katalogen ligger under tasks/sessions/archive/bilagor/s102-dokument-konvergens med ORÖRT manifest (godkand-blocket byte-identiskt före/efter — diff-bevis), alla bilder och de tre AMENDERING-filerna
- [x] #2 ARKIVERAD.md finns i s55-formen och bokför både efterträdarna och GAPET (valt events fulla lista + ikonpar-Visa) med pekare till TASK-309.32
- [x] #3 Pekar-svepet: inga levande filer refererar den gamla sökvägen (grep-bevis i PR:en); historiska sessionsdok/kort orörda
- [x] #4 scripts/check-facit.sh exit 0 och dokumentationsgrindarna exit 0 efter flytten; TASK-309.21 AC #1 + #2 (s102) bockade med hänvisning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UTFÖRT 2026-08-28 (gren docs/task-309-29-pensionera-s102-facit).

AC #1 — ARKIVFLYTT UTFÖRD. 'git mv tasks/sessions/bilagor/s102-dokument-konvergens tasks/sessions/archive/bilagor/s102-dokument-konvergens', exit 0. Alla NIO filer registrerade av git som rena renames (git status: 9x 'R'): facit.json, de tre AMENDERING-filerna, de fem PNG:erna. MANIFESTET ORÖRT — starkare bevis än godkand-blocket ensamt: sha256 på hela facit.json är byte-identisk före/efter (725a963a5bc999a6a242bdaabe7dd2a71100d5d0be3242f602bad2ea801ea695), liksom alla tre AMENDERING-filer (b48d95dc.../24d76a40.../83a16bc6...). Ingen Edit/Write rörde manifestet; hooken deny-facit-godkand-skrivning.sh fällde inget (git mv matchar ingen av dess två kanaler, som utredningen § 1 förutsade).

AC #2 — ARKIVERAD.md skriven i s55-formen (tasks/sessions/archive/bilagor/s102-dokument-konvergens/ARKIVERAD.md, 93 rader). Bär: efterträdarna (s108-generering + s108-dokumentytan, TASK-309.10, PR #1961 MERGED 2026-08-24 — verifierat med gh pr view), Marcus mandat med verbatim-citat, formen (arkivflytt, s55-prejudikatet), varför inte --ersatt, GAPET i eget avsnitt (valt events fulla filtrerbara lista + dagens ikonpar-Visa saknas i alla tre manifesten) med pekare till TASK-309.32, tabell över de tre AMENDERING-filernas öden, och de två OBEROENDE s106/s111-amenderingarna som kvarstår hos Marcus. TILLÄGG UTÖVER KORTETS KRAV, mätt under passet: båda efterträdarna bär 'godkand: null' (2026-08-28) — dokument-ytan saknar just nu VARJE stämplat facit. Det står explicit i ARKIVERAD.md i stället för att låta texten antyda en täckning som inte finns.

AC #3 — PEKAR-SVEP. Levande filer uppdaterade (fil:rad efter ändring): src/components/dokument/DokumentYta.tsx 5-16 (manifest-pekaren skriven om från 'är den auktoritativa formbeskrivningen' till PENSIONERAT + arkivsökväg + efterträdare + gap), 93 (AMENDERING-visa-till-ikonpar), 152-153 (AMENDERING-rackviddsval), 435-437 (JSX-kommentar, AMENDERING-sidram); tests/e2e/mer-index.staging.test.ts 47-49; tests/visual/dokument-visual.spec.ts 10-13; .facit-policy.conf 178-188 (ny PENSIONERAT-not efter TASK-147.6-stycket, historiken orörd — samma form som s55-hem-konvergens-noten i samma fil). grep 'tasks/sessions/bilagor/s102-dokument-konvergens' ger 0 träffar i levande kod/test/config. MEDVETET ORÖRDA (historik, bokfört öppet): backlog/tasks/* (11 kort), tasks/sessions/2026-08-{10,17,20,22}-*.md, tasks/todo.md 1047/1063 (historisk S102-handoff), tasks/lessons.d/headless-bundlad-chromium-renderar-inte-pdf.md, docs/decisions/ADR-102 rad 328 (historisk mätning av var fem AMENDERING-filer LÅG när regeln skrevs — nämner katalognamn, ingen sökväg), docs/research/{forhandsgranskning-dokumentgenerering-branschmonster-2026-08-22, facit-pensionering-s102-2026-08-26}.md (daterade ögonblicksbilder). ÖVERVÄGD OCH AVVISAD: tasks/sessions/bilagor/s108-dokumentytan/facit.json rad 23 bär den gamla sökvägen i sitt not-fält — INTE ändrad, eftersom (a) det är ett facit-manifest som väntar Marcus stämpling och dess innehåll är precis vad han ska godkänna, (b) omnämnandet är en daterad observation ('Det stämplade facitet i ... (marcus, 2026-08-16, sha cc1d7c53) visar...'), inte en aktiv pekare, (c) det är en JSON-sträng, ingen markdown-länk, så länk-grinden berörs inte. Flaggat till orkestreraren i slutrapporten.

AC #4 — GRINDAR MÄTTA, exitkoder lästa nakna (aldrig genom pipe): bash scripts/check-facit.sh exit 0 (FÖRE flytten också exit 0 — baslinje sparad). Grindens egen utdata bevisar att pensioneringen SYNS: '15 manifest, 30 ytor deklarerade' → '14 manifest, 29 ytor', innehållslåsraden '24 stämplade ytor saknar referenser' → '23', och raden 's102-dokument-konvergens/facit.json ... supabase/functions/_shared/receipt-pdf.ts — riven efter stämpeln cc1d7c53' är BORTA ur invariant (b)-listan. Ett pensionerat pass räknas alltså inte längre som stämplat-men-avvikande. npm run check:docs exit 0, slutrad verbatim: 'check:docs grönt — samtliga 14 dokumentations-grindar körda.' Övriga: npm run typecheck exit 0, npx @biomejs/biome check . exit 0, npm run build exit 0, node scripts/check-langa-streck.mjs exit 0 (261 filer skannade, 0 ofångade — obligatorisk eftersom diffen rör src/), npx markdownlint-cli2 exit 0. TASK-309.21 AC #1 + #2 bockade med hänvisning (se det kortets notes för per-fil-redovisningen och för vad som kvarstår hos Marcus).

RADNUMMER-KORRIGERING (mätt om med grep/sed EFTER notes-skrivningen, ADR-086-disciplinen tillämpad på min egen rapport): AC #3-stycket ovan angav tre intervall ur minnet. FAKTISKA, disk-mätta intervall i den pushade diffen — src/components/dokument/DokumentYta.tsx 5-16 (rätt), 92-95 (AMENDERING-visa-till-ikonpar; ovan stod '93'), 153-155 (AMENDERING-rackviddsval; ovan stod '152-153'), 436-441 (JSX-kommentaren; ovan stod '435-437'); tests/e2e/mer-index.staging.test.ts 47-49 (rätt); tests/visual/dokument-visual.spec.ts 9-12 (ovan stod '10-13'); .facit-policy.conf 178-187 (ovan stod '178-188'). Innehållet i ändringarna är oförändrat — bara adresserna var en rad fel.
<!-- SECTION:NOTES:END -->
