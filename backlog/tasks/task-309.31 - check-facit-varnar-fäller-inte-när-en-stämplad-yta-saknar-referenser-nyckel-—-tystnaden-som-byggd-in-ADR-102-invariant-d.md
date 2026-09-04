---
id: TASK-309.31
title: >-
  check-facit varnar (fäller inte) när en stämplad yta saknar referenser-nyckel
  — tystnaden som byggd in (ADR-102 invariant d)
status: Done
assignee: []
created_date: '2026-08-26 05:06'
updated_date: '2026-08-28 04:40'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 597000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beslut (orkestreraren på Marcus mandat 2026-08-26): TASK-309.21 AC #4 = VARNA, fäll inte. Underlag: docs/research/facit-pensionering-s102-2026-08-26.md § 2 + § 4 (PR #1991): 24 av 28 stämplade ytor (15 manifest) saknar referenser-nyckel och står därmed utanför innehållslåset (scripts/check-facit.sh invariant d) — s102-instansen visade att ett sådant facit kan vara tre generationer gammalt utan att någon grind säger något. Att FÄLLA retroaktivt hade gjort 24 ytor röda på en gång (TASK-288:s backfill av referenser är INTE utförd — kortet står To Do); att tiga är det som redan kostat. Branschmönster (research § 4): snapshot-verktyg accepterar baselines utan källreferens men rapporterar täckning — därför varning med räkning, inte fällning.

GÖR: check-facit.sh (invariant d) skriver en WARN-rad per stämplad yta utan referenser (manifest · yta), plus en summeringsrad (N av M stämplade ytor saknar innehållslås); exit-koden oförändrad (0) så inga PR:er fälls; testsviten för check-facit (scripts/test-check-facit*.sh — hitta den) får två fall: yta med referenser → ingen WARN; stämplad yta utan → WARN + rätt räkning. Konfig-driven per repots grindvakts-konvention (.facit-policy.conf bär ev. tröskel/omkopplare, skriptet bär logiken). ADR-102 § Updates: daterat tillägg som bokför beslutet varna-inte-fäll och pekar på TASK-288 som vägen till fällning senare. Koppling: TASK-309.32 deklarerar referenser för de nya ytorna — visa i PR:en att räkningen sjunker när den landat.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 check-facit.sh varnar per stämplad yta utan referenser + summeringsrad; exit 0 oförändrat; verifierat mot dagens 24 (talet i utdatan matchar research § 2)
- [x] #2 Testsviten bär båda riktningarna (med/utan referenser) och är CI-wirad
- [x] #3 ADR-102 § Updates bär beslutet (varna, inte fäll; TASK-288 som väg till fällning) daterat 2026-08-26; TASK-309.21 AC #4 bockat med hänvisning
- [x] #4 Konfig-driven: ingen projektspecifik lista hårdkodad i skriptet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererat i PR #2032 (MERGED 90edf82b, 2026-08-28). scripts/check-facit.sh invariant (d) namnger nu varje stämplad yta som saknar nyckeln "referenser" på stderr, plus en summeringsrad (24 av 28 stämplade ytor saknar innehållslås, mätt) — exitkoden är oförändrad 0 i alla lägen, beslutet är VARNA, aldrig fälla. Konfig-driven via ny nyckel FACIT_VARNA_ODEKLARERAD_REFERENS i .facit-policy.conf (skriptet härleder mängden ur manifesten, ingen hårdkodad lista). Testsviten scripts/test-check-facit.sh 32 -> 36 fall (64 assertions), tre nya gränser mutationstestade (no-op, omkopplare, stämpelgräns) — samtliga röda vid mutation. ADR-102 § Updates 2026-08-28 'Täckningsluckan i invariant (d) NAMNGES, men fäller inte (TASK-309.31)' bär beslutet med fyra skäl (Percy/Chromatic/BackstopJS-precedent, TASK-288 som väg till fällning). TASK-309.21 AC #4 bockad med hänvisning i samma PR.
<!-- SECTION:NOTES:END -->
