---
id: TASK-309.31
title: >-
  check-facit varnar (fäller inte) när en stämplad yta saknar referenser-nyckel
  — tystnaden som byggd in (ADR-102 invariant d)
status: To Do
assignee: []
created_date: '2026-08-26 05:06'
updated_date: '2026-08-28 03:13'
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
BYGGT 2026-08-28 (S108 resume 13). Mätt per AC:

AC #1 — check-facit.sh skriver nu en WARN-rad per stämplad yta utan "referenser" på stderr (manifest · ytan "<namn>" — saknar nyckeln "referenser") plus summeringsraden "24 av 28 stämplade ytor saknar innehållslås". Mätt mot repots verkliga bilage-katalog: exit 0 FÖRE och EFTER ändringen, 24 namngivna ytor. Talet korsvaliderat tre vägar: grindens egen slutrad (24), ett oberoende node-svep över alla 15 manifest (15 manifest / 30 ytor / 28 stämplade / 24 utan nyckeln / 11 låsta referenser), och research § 2:s lista — identisk mängd, post för post.

AC #2 — scripts/test-check-facit.sh gick 32 → 36 fall (64 assertions, exit 0). T33 stämplad yta UTAN nyckeln → WARN + räkningen "1 av 1"; T34 stämplad yta MED nyckeln → ingen WARN; T35 omkopplaren av → ingen WARN; T36 OGODKÄND yta utan nyckeln → ingen WARN (stämpel-gränsen). Ny hjälpare check_utdata_saknas (negativ assertion). CI-wiringen fanns redan och är verifierad på plats: .github/workflows/ci.yml rad 1309, steget "Test gatekeeper script suites".

Att de nya fallen BITER är mätt med tre mutationer, inte antaget: skriv_odeklarerade som no-op → T33 röd (3 assertions); omkopplaren ignorerad → T35 röd; stämpel-gränsen borttagen → T36 röd. Skriptet återställt och byte-identiskt med pre-mutation efteråt (diff -q).

AC #3 — ADR-102 § Updates bär den nya posten "2026-08-28 — Täckningsluckan i invariant (d) NAMNGES, men fäller inte (TASK-309.31)" med V1–V5: vad som ändrades mekaniskt, fyra skäl mot fällning (citerar research § 4:s rekommendation ordagrant + Percy-citatet), TASK-288 som enda vägen till fällning, beviset, konsekvenserna.

DIVERGENS mot kortets AC #3-ordalydelse (ADR-086): kortet skrevs 2026-08-26 och föreskrev det datumet i ADR-posten. Bygget utfördes 2026-08-28 och uppdraget föreskrev 2026-08-28. Posten är daterad 2026-08-28 — ett datum som ljuger om när beslutet bokfördes vore värre än en avvikelse mot en två dagar gammal förväntan.

AC #4 — .facit-policy.conf bär FACIT_VARNA_ODEKLARERAD_REFERENS="1"; skriptet defaultar till 1 när nyckeln saknas (tystnad får aldrig uppstå av ett glömt värde). Ingen projektspecifik lista finns i skriptet — de 24 ytorna härleds live ur manifesten vid varje körning. Config-drivningen är BEVISAD, inte påstådd: T35 + mutation 2.

Grindar (exitkod läst naket, aldrig genom pipe): bash scripts/test-check-facit.sh → 0 (64/0) · bash scripts/check-facit.sh → 0 · shellcheck --severity=style --enable=all (CI:s exakta flaggor) på check-facit.sh + test-check-facit.sh + .facit-policy.conf → 0 · npx @biomejs/biome check . → 0 · npm run check:docs → 0 (14 gröna; WARN-raderna syns i dess utdata — beviset att tystnaden bröts i den verkliga pipelinen).

SIDOFYND (ej åtgärdat, ej blockerande): ADR-104-hooken deny-facit-godkand-skrivning.sh fällde ett Bash-heredoc som skulle skriva ADR-texten, därför att texten nämnde stämplingsskriptets filnamn efter ett backtick — vilket hooken läste som kommando-position. Falsk-positiv i Kanal A:s kommando-positions-matchning när målet är en heredoc-kropp. Kringgicks INTE: ADR-texten skrevs via Edit-verktyget i stället, och formuleringen bär nu "stämplingsskriptet" i prosa.

LANDNING: PR #2032, gren feat/task-309-31-facit-tackningsvarning. Ej armerad — orkestreraren granskar diffen och armerar i sitt svep.
<!-- SECTION:NOTES:END -->
