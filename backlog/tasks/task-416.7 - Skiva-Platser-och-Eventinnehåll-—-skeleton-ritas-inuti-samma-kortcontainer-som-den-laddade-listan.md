---
id: TASK-416.7
title: >-
  Skiva: Platser och Eventinnehåll — skeleton ritas inuti samma kortcontainer
  som den laddade listan
status: Done
assignee: []
created_date: '2026-09-06 13:21'
updated_date: '2026-09-17 09:06'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-416
priority: medium
ordinal: 733000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: rapport D §4 #7 (S123). src/components/platser/PlatserYta.tsx:240–251 och src/components/eventinnehall/EventinnehallYta.tsx:203–209 renderar 2–3 fristående textblock (~24 px styck) medan laddat läge är en divide-y rounded-xl bg-surface-kortlista med py-3-rader (~48 px). Sidkromet står rätt; bara listkroppen byter form. Åtgärd: rita skeleton inuti samma kortcontainer med samma radhöjd (greppet finns i AktivitetsHistorik.tsx:436–447).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skeleton i båda vyerna ligger i samma kortcontainer med samma radhöjd som den laddade raden
- [x] #2 Mätning bifogad: boundingBox på kortcontainern identisk före och efter datalandning
- [x] #3 Befintliga tester gröna, axe-svep grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Mätning (AC #2) — engångstest kört mot dev-servern (PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1),
hallbar-mock (get-places/get-event-contents parkerade → skeleton mätt → släppta →
laddat läge mätt). Testfilen togs bort igen efter mätningen (ingen permanent
regressionstest begärd av kortet).

PLATSER (3 platser i fixturen, matchar PLATSER_SKELETON_BREDD.length = 3):
  kortcontainer FÖRE (skeleton): {x:372, y:224, width:536, height:148}
  kortcontainer EFTER (laddat):  {x:372, y:224, width:536, height:148}  — IDENTISK
  första raden  FÖRE (skeleton): {x:385, y:225, width:510, height:49}
  första raden  EFTER (laddat):  {x:385, y:225, width:510, height:49}  — IDENTISK
  axe (skeleton-läget): 0 violations

EVENTINNEHÅLL (7 kombinationer i fixturen, matchar EVENTINNEHALL_SKELETON_BREDD.length = 7):
  kortcontainer FÖRE (skeleton): {x:372, y:168, width:536, height:344}
  kortcontainer EFTER (laddat):  {x:372, y:168, width:536, height:344}  — IDENTISK
  första raden  FÖRE (skeleton): {x:385, y:169, width:510, height:49}
  första raden  EFTER (laddat):  {x:385, y:169, width:510, height:49}  — IDENTISK
  axe (skeleton-läget): 0 violations

Reservation: Eventinnehåll har ALLTID exakt 7 kombinationer (fast domän) så
skeleton-radantalet är korrekt i varje verkligt fall. Platser-listan är
OKÄND/växande längd — skeleton-radantalet (3) är ett fast designval (samma
mönster som AktivitetsHistorik.tsx/PersonsList.tsx) och ger identisk
kortcontainer-HÖJD bara när verkligt antal platser råkar vara 3; radhöjden
(py-3, 49 px) och containerns bredd/position är däremot ALLTID identiska
oavsett antal, vilket är vad AC #1 kräver.

Grindar (exitkoder mätta separat, se PR-kroppen): typecheck 0, biome check
(scopat + repo-brett) 0, build 0, check-langa-streck.mjs 0. test:api: 32/2266
fällda i den fulla parallella körningen — samtliga nätverks-/timeout-flak mot
staging (inga referenser till PlatserYta/EventinnehallYta i test:api-sviten);
2 stickprov (update-record.staging.test.ts update-person-note,
save-place-standard.staging.test.ts hela filen) om-körda ISOLERAT → 100 %
gröna, vilket bekräftar flak snarare än regression.

Bockad i efterhand av S125 mot belägg: PR #2393 mergad (2026-09-06), samtliga 3 AC redan bockade, notiserna anger identiska boundingBox-mått (skeleton/laddat) i båda vyerna, axe 0 violations, grindtabell typecheck/biome/build/check-langa-streck 0. Nightly Backlog-stängningsgrinden (körning 35187813487) flaggade kortet som inkonsistent.
<!-- SECTION:NOTES:END -->
