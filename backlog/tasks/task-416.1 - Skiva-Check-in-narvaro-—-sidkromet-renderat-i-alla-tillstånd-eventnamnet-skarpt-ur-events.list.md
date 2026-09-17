---
id: TASK-416.1
title: >-
  Skiva: Check-in (narvaro) — sidkromet renderat i alla tillstånd, eventnamnet
  skarpt ur events.list
status: Done
assignee: []
created_date: '2026-09-06 13:19'
updated_date: '2026-09-17 09:05'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-416
priority: high
ordinal: 727000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: rapport D §4 #2 (S123). src/components/events/EventCheckin.tsx:1210–1221 renderar laddläget som en textrad + tre kort, medan laddat läge (rad 920+) har SidRam (948), h1 Check-in + eventnamn/datum (954–961), FramstegskortD (962), sessionsval, sökfält och meta-rad. isPending = event || attendance || registrations (rad 211) och attendance värms inte, så laddläget nås varje gång. Innehållet landar ~250–320 px längre ned än skeletonet. Åtgärd: bryt ut sidkromet till en hjälpare som renderas i alla grenar (mönstret i EventDetail.tsx/PersonDetail.tsx), rendera eventnamn och datum skarpt via placeholderData ur den värmda events.list-cachen (samma trick som EventDetail.tsx:76–78), och lägg skeleton enbart i listkroppen med samma radgeometri som den laddade raden. Mät före/efter: boundingBox på h1 och första listraden under laddning och efter data ska vara identiska (tests/support/mat-cls.ts eller boundingBox-toEqual som i tests/e2e/events-list.staging.test.ts:486–535). Fixturvärlden saknar handler för get-attendance (tests/support/fixturvarld/handlers.ts) — lägg till om mätningen görs hermetiskt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sidkromet (SidRam, h1, eventnamn/datum, framstegskort, sökfält) renderas identiskt i isPending-, isError- och laddat läge; bara listkroppen växlar
- [x] #2 Eventnamn och datum visas skarpt under laddning via placeholderData ur events.list
- [x] #3 Mätning bifogad: boundingBox på h1 och första listraden är identiska före och efter datalandning (toEqual)
- [x] #4 Befintliga e2e/acceptance för check-in gröna, axe-svep grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementerat: EventCheckin.tsx delar upp useDorrData i useDorrEvent (endast eventet, med placeholderData ur events.list, ADR-078) + VariantD (attendance/registrations lokalt, styr bara listkroppen). EventCheckin gaterar bara på eventet (isPending/isError/null) — SidRam+h1 renderas alltid; attendance/registrations-laddning påverkar aldrig chrome. FramstegskortD fick isPending-prop (skeleton för kvar-text + räknarplatta, samma osynlig-mät-text-knep som kvar-texten för att undvika en 1px items-baseline-glidning — mätt i tre varv, se kod-kommentarer). Listkroppen (ARBETSLISTAN) får tre grenar: isListPending (skeleton-rader, exakt DorrRadD-geometri: -mx-4 flex min-h-16 items-center gap-3 px-4 py-2.5, avatar size-9, kryssruta-reservation size-11, INGET gap mellan textrader), isListError (MessageBox), annars befintlig attGora/ul.

Ny handler tests/support/fixturvarld/handlers.ts: get-attendance (tom lista, ATTENDANCE_RESPONSE i fixture-data.ts) — saknades helt tidigare.

Ny mätning: tests/acceptance/event-checkin-laddlage.acceptance.test.ts (hallbarMock-mönstret från hem-laddlage.acceptance.test.ts). Mätta tal (2026-09-06, 1280x720, Chromium): h1 boundingBox {x:376,y:128,width:528,height:36} identisk under laddning och efter datalandning. Första listraden boundingBox {x:361,y:380,width:558,height:65} identisk under laddning (skelettrad) och efter (riktig li). Krävde TVÅ anmälda i fixturen (inte en) — divide-y sätter border-bottom-width på alla rader UTOM den sista; med en enda rad är den både först och sist (ingen border), medan skelettets tre fasta rader alltid gör första raden till en icke-sista (med border) — en en-rads-fixtur hade jämfört en border-lös rad mot en border-bärande.

Regressionskontroll: event-checkin-dorrlistan.acceptance.test.ts 6/6 grönt (2 körningar), dorrlista-promoverings-grind.spec.ts (visual-desktop+mobile) 30/30 grönt inkl axe — loaded-state-DOM ORÖRD (facit intakt).

Review-runda 4, INFO (bokfört, inte rättat): asymmetri mellan de två fel-platshållarna. h1-radens eventnamn/datum-platshållare (VariantD, "text-body"-slotten) är aria-hidden utan eget sr-only-besked; FramstegskortD:s isError-gren fick ett sr-only-besked ("Framsteg kunde inte hämtas") i review-runda 3. Skälet är inte en glömska utan ADR-113:s "en kanal räcker": h1-radens fel är samma fel som isListError redan annonserar via listkroppens MessageBox (role="alert") i SAMMA render — en andra kanal där hade dubblerat annonseringen. FramstegskortD är däremot en egen landmärkes-region (aria-label="Framsteg") som en skärmläsare kan navigera till DIREKT, förbi den lineära lässekvensen som annars skulle nå MessageBox — utan sin egen sr-only-text hade den regionen annonserats tom just vid en sådan direktnavigering. Samma "en kanal räcker"-princip ger alltså två olika svar beroende på om ytan är en egen landmärkes-region eller inte.

Bockad i efterhand av S125 mot belägg: PR #2401 mergad (2026-09-06), samtliga 4 AC redan bockade, Implementation Notes beskriver fullständig implementation, regressionskontroll grönt (event-checkin-dorrlistan 6/6, dorrlista-promoverings-grind 30/30 inkl axe) och review-runda 4. Nightly Backlog-stängningsgrinden (körning 35187813487) flaggade kortet som inkonsistent.
<!-- SECTION:NOTES:END -->
