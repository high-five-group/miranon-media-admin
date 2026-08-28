---
id: TASK-309.20
title: >-
  Dokumentytan vid 375 px: filnamn trunkeras och ikonknappar ligger över
  räckviddsbadgen
status: Done
assignee: []
created_date: '2026-08-24 17:54'
updated_date: '2026-08-28 03:14'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 586000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Avtäckt av skiva 9-agenten 2026-08-24 under facit-tagningen, bokförd i manifestens not-fält.

Två formdefekter i mobil vyport (375 px):

  1. Event-mallade radens filnamn trunkeras till 'Bekr…' — så kort att raden inte
     längre säger vilket dokument det är.
  2. I räckviddsläget ligger ikonknapparna DELVIS ÖVER räckviddsbadgen.

URSPRUNGET ÄR MÄTT och ligger UTANFÖR skiva 7: TASK-273.4, commit b881fe64 (2026-08-17) — alltså efter s102-stämpeln och före promoveringen. Detta är alltså inte en regression ur bilagespåret; det är en pre-existing defekt som facit nu fryser.

DÄRFÖR ÄR DEN BRÅDSKANDE PÅ ETT SÄRSKILT SÄTT: skiva 9:s facit-manifest avbildar ytan som den ÄR, inklusive dessa två defekter. Stämplar Marcus manifestet blir defekterna en del av det låsta facit, och en framtida fix kommer att FÄLLA grinden och kräva en amendering. Att laga före stämpling är billigare än att laga efter.

Agenten bokförde observationen i manifestens not-fält i stället för att tyst laga — rätt, eftersom en formändring på en yta Marcus just granskat är hans beslut (ADR-103 B2 steg 4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Filnamnet på Event-mallade rader är läsbart vid 375 px — trunkeringen ger tillräckligt med tecken för att skilja dokumenten åt
- [x] #2 Ikonknapparna ockluderar inte räckviddsbadgen i räckviddsläget vid 375 px
- [x] #3 Avgjort och bokfört: lagas FÖRE Marcus stämplar skiva 9:s facit (billigare), eller efter med amendering (ADR-102 klass c)
- [x] #4 Regressionsskydd: den mobila vyporten bär facit för båda lägena efter fixen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Marcus GO i klartext 2026-08-26 ("GO 309.20"), efter orkestrerarens rekommendation
att laga FÖRE facit-stämplingen (billigare än amendering efteråt). Beslutet
avgör AC #3: vägen är "lagas FÖRE Marcus stämplar skiva 9:s facit" — bekräftat
genomfört i denna skiva (TASK-309.20), samma PR som koden.

Fix, mätt (Playwright mot hermetisk fixturvärld, visual-mobile 375x812@2x):
- Defekt 2 (badge ockluderad av ikonknappar i räckviddsläget): RackviddBadge.tsx
  + DokumentYta.tsx (TACKNING_KLASS + badge-radens wrapper) fick min-w-0/truncate
  i stället för shrink-0. Badge x=62 w=103 mot knapp x=131 (34px overlap) -> ingen
  overlap efter fix.
- Defekt 1 (Event-mallad rads filnamn trunkerat till "Bekr..."): DokumentRadSkal
  fick flex-wrap + namnkolumnens golv min-w-[12ch] i stallet for min-w-0 - vid
  375px med 4 ikonknappar (182px) wrappar knapparna till egen rad, namnet far
  full radbredd. "Bekräftelsebilaga.pdf" (21 tecken) fullt synligt efter fix
  (var truncated till ~7 tecken fore, ground truth-facit visade "Bekr...").

De två mobila facit-bilderna i s108-dokumentytan/ omtagna med samma
rigg/metod (AC #4). facit.json "not"-falt uppdaterat, "godkand" ororg.

OBS: syskonkatalogen s108-generering/facit-dokumentlista-inaktuell-rad-mobil.png
visar defekt 1 konkret men ar INTE omtagen av denna skiva - utanfor AC #4:s
uttryckliga scope (bara s108-dokumentytan namndes). Flaggat i Final Summary.

TILLÄGG 2026-08-26 (orkestrerarorder, samma PR #1977 efter första pushen):
s108-generering/facit-dokumentlista-inaktuell-rad-mobil.png — bilden som
ovanstående OBS flaggade som konkret visande defekt 1 men utanför AC #4:s
scope — är NU OMTAGEN på orkestrerarens explicita tilläggsorder, eftersom
Marcus stämplar BÅDA manifesten samtidigt och den annars hade frusit
defekten. Samma rigg/metod som skiva 9 (STALE-kallhash-mock, samma som
tests/acceptance/dokument-event-mallad-inaktuell.acceptance.test.ts).
Verifierat ändrad: git diff --stat visar binärt diff, sha256 skiljer sig,
750×1826 → 750×1882 px. facit.json (s108-generering) "not"-fält uppdaterat
på samma sätt som s108-dokumentytans; "godkand" orört (null). check:docs
kört på nytt efter ändringen: exit 0, 14/14 gröna. Ingen ny AC bockas för
detta — kortets AC #4 nämnde bara s108-dokumentytan; denna omtagning är
bokförd här som orkestrerarens explicita tilläggsbeslut, inte en
scope-utvidgning jag gjorde på eget bevåg.

Stängningssvansen (S108 resume 13): DoD verifierad — #1 AC 4/4 avbockade (redan). #2 lokala grindar gröna per kortets egna Implementation Notes (Playwright visual-mobile). #3 diff path-scopad, verifierat via gh pr diff 1977 --name-only: DokumentYta.tsx, RackviddBadge.tsx, facit-bilder+facit.json (s108-dokumentytan + s108-generering) samt kortfilen — inga orelaterade filer. gh pr checks 1977: samtliga körda jobb pass (staging/A11y skippade per D0/D1-klassning, ej fel). Landning: PR #1977 (<https://github.com/high-five-group/miranon-media-admin/pull/1977>), merge-SHA a2f68b71082d3731f9416640ee79015f7d9a348c, mergad 2026-08-26T03:53:05Z.
<!-- SECTION:NOTES:END -->
