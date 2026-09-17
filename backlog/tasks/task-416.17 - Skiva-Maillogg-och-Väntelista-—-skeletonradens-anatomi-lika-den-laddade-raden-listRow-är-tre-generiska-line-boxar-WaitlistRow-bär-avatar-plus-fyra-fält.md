---
id: TASK-416.17
title: >-
  Skiva: Maillogg och Väntelista — skeletonradens anatomi lika den laddade raden
  (listRow är tre generiska line-boxar, WaitlistRow bär avatar plus fyra fält)
status: Done
assignee: []
created_date: '2026-09-06 14:45'
updated_date: '2026-09-17 09:06'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-416
priority: medium
ordinal: 744000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: review-agentens utlåtande på PR #2397 (TASK-416.9, S123, 2026-09-06), info-fynd som orkestreraren registrerar durabelt (ADR-053). Efter gap-6-fixen kvarstår 108 px (Maillogg) och 225 px (Väntelista) skift vid SAMMA radantal (3 mot 3) — alltså inte listlängd utan radanatomi: Skeleton-primitivens listRow är ett generiskt block h-[3lh], medan MailLogRow (namn + upp till fyra Field-rader) och WaitlistRow (InitialAvatar + namn + dl med pl-12 och fyra Field-rader) är väsentligt högre. Rapport D bedömde dem som nästan lika; mätt i pixlar var det fel. Åtgärd: ge skeletonraden i src/components/maillog/MailLog.tsx och src/components/waitlist/Waitlist.tsx exakt den laddade radens anatomi (avatar-cirkel som skeleton där avataren finns, samma padding/typografi/gap, fyra fältrader) — antingen lokalt i respektive fil eller som en ny, dokumenterad Skeleton-variant om samma anatomi återkommer på fler ställen (avgör mot faktisk användning, bygg ingen abstraktion utan minst två konsumenter). Beroende: TASK-416.9 landad. Mät: boundingBox på första raden identisk före/efter datalandning, toEqual.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skeletonradens höjd och inre struktur i Maillogg och Väntelista är identisk med den laddade radens (DOM-mätt, ±0 px)
- [x] #2 Mätning bifogad: boundingBox på rubrik och första listraden identiska före och efter datalandning i båda vyerna
- [x] #3 Befintliga acceptance-tester för Maillogg och Väntelista gröna, axe-svep grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MÄTNING (Playwright, acceptance-projektet, viewport 1280×720):

Ny anatomi (MailLogSkeletonRow/WaitlistSkeletonRow), håll-bar mock, boundingBox toEqual:
- Maillogg: rubrik OCH första listraden identiska (x/y/bredd/höjd, ±0 px) före/efter datalandning — 2/2 passed.
- Väntelista: samma, 2/2 passed.

Falsifiering (tvåsidigt bevis — gammal generisk `Skeleton variant="listRow"` (h-[3lh]) i samma testrigg):
- Maillogg: skeleton-rad 72 px mot riktig rad 131 px (diff 59 px/rad) → testet FALLER (toEqual).
- Väntelista: skeleton-rad 72 px mot riktig rad 147 px (diff 75 px/rad) → testet FALLER (toEqual).

Kortets ursprungstal (108 px / 225 px, review-fynd PR #2397) avsåg troligen ackumulerat Y-skift över hela listan (3 rader + gap), inte per-rad-höjdskillnaden ovan — inte omprövat mot review-agentens råmätning, bokfört som avvikelse.

Rubrik-fix: skeleton-titelns bredd-override (w-28/w-32) togs bort — Skeleton-primitivens default `w-full` matchar det riktiga `<h1>`s stretch-till-fullbredd i flex-col-föräldern (align-items: stretch). Utan denna ändring hade `toEqual` fällt på bredd trots identisk höjd/position.

Testfiler: tests/acceptance/mer-maillogg-laddlage.acceptance.test.ts, tests/acceptance/mer-vantelista-laddlage.acceptance.test.ts.

PREMISS-PASS SLUTFÖRT — 108/225 px EXAKT REPRODUCERADE (engångsdiagnos, ej committad, samma metodik som review-agentens PR #2397: total sektionshöjd pending vs laddat, skift = laddat − pending):

- Väntelista, baseline (origin/main, tre rader, alla fyra fält): pending=427 laddat=652 skift=225 — EXAKT match mot PR #2397:s tabell.
- Maillogg, baseline (origin/main, tre rader, filterSnapshot=null dvs 3 av 4 fält): pending=427 laddat=535 skift=108 — EXAKT match. (Med alla fyra fält ifyllda blev laddat=604, skift=177 — review använde alltså sannolikt en rad UTAN Segment/filter.)

Efter fixen (samma diagnos, samma data):
- Väntelista: pending=652 laddat=652 skift=0 — perfekt.
- Maillogg (3 av 4 fält, samma dataset som ovan): pending=604 laddat=535 skift=−69 — skelettet är NU 69 px FÖR HÖGT för en rad utan Segment/filter, eftersom MailLogSkeletonRow reserverar plats för alla fyra fält (MAX-anatomin, per uppdragets "upp till fyra Field-rader"). Med alla fyra fält ifyllda (så som den committade acceptance-mätningen testar) är skiftet exakt 0 — se AC #2.

Bokfört avvägning: en skeleton som renderas FÖRE data kan inte veta om en specifik rad kommer sakna Segment/filter. Vald väg (MAX-anatomi, fyra platshållarrader) ger EXAKT 0 px för den vanliga fullständiga raden och ett litet ÖVER-skott (~69 px, motsatt riktning mot tidigare UNDER-skott på 100+ px) för rader utan Segment/filter — en väsentlig förbättring men inte en universell 0-px-garanti för varje möjlig fältkombination. Ingen ytterligare åtgärd vidtagen i denna skiva (utanför scope: att göra skeletonen fält-count-medveten kräver antingen förhandskunskap om datan eller en explicit designavvägning som inte efterfrågats).

RUNDA 2 (review-fynd PR #2408, orkestreraren på Marcus mandat): Field
(MailLog.tsx/Waitlist.tsx, identisk struktur i båda) staplar dt ovanpå dd
under sm: (flex-col, TVÅ line-boxar) och radar dem sida vid sida däröver
(sm:flex-row, EN line-box) — den ursprungliga platshållaren (en Skeleton-rad
per fält) matchade bara desktop-formen. Mobilviewporten 375×812 (samma
bredd som tests/visual/maillogg-visual.spec.ts:s etablerade visual-mobile-
projekt) var omätt och FÖLL:

Falsifiering (mätt, engångsdiagnos, ej committad), viewport 375×812, 3 rader:
- Maillogg: skeleton-rad 131 px (oförändrad — matchade INTE viewport) mot
  riktig rad 223 px (dt/dd staplade per fält) → toEqual FALLER.
- Väntelista: motsvarande mönster (avatar+namn oförändrat, fältraderna
  fördubblas).

Fix: ny FieldSkeleton-komponent (lokal i respektive fil, samma responsiva
klasser flex flex-col gap-0.5 sm:flex-row sm:gap-2 som Field, med TVÅ
Skeleton-block dt-/dd-motsvarighet) ersätter den enda Skeleton-raden per
fält i MailLogSkeletonRow/WaitlistSkeletonRow.

Efter fix, samma mätning:
- Maillogg mobil: skeleton 223 px = riktig rad 223 px → 0 px, toEqual passerar.
- Väntelista mobil: skeleton 239 px = riktig rad 239 px → 0 px, toEqual passerar.
- Desktop (1280×720, tidigare committerad mätning): oförändrat 0 px — FieldSkeleton
  degraderar korrekt till en line-box vid sm: och uppåt.

Nya committade tester: en "(mobil 375×812)"-variant tillagd i BÅDA
mer-maillogg-laddlage.acceptance.test.ts och mer-vantelista-laddlage.
acceptance.test.ts (samma håll-bar-mock-mönster, ny viewport).

MAX-anatomin bokförd som TYPRADEN framåt (inte bara ett defensivt
över-antagande): supabase/functions/send-email/index.ts rad 234 sätter
filterSnapshot OVILLKORAT (`segmentIds: ${...}`) för varje utskick — varje
Utskickslogg-rad skapad via send-email har alltså alla fyra fält. Endast
historiska/äldre poster (om sådana finns, före detta fält infördes) kan
sakna Segment/filter.

Grindar efter fix (exitkoder mätta separat): typecheck 0, biome check 0,
build 0, check-langa-streck.mjs 0 (323 filer), maillogg/väntelista-
acceptance + de fyra laddlage-testerna (2 desktop + 2 mobil) 25/25 gröna
inkl. samtliga axe-svep.

Bockad i efterhand av S125 mot belägg: PR #2408 mergad (2026-09-06), samtliga 3 AC redan bockade, notiserna anger grindtabell efter fix (typecheck 0, biome 0, build 0, check-langa-streck 0, 25/25 acceptance inkl axe). Nightly Backlog-stängningsgrinden (körning 35187813487) flaggade kortet som inkonsistent.
<!-- SECTION:NOTES:END -->
