---
id: TASK-141
title: 'Bygg barn-manifestet — glest, additivt, femte invariant (ADR-095 beslut 4)'
status: Done
assignee: []
created_date: '2026-08-04 22:54'
updated_date: '2026-08-05 01:19'
labels:
  - ready-for-agent
dependencies:
  - TASK-140
priority: medium
ordinal: 226000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ADR-095 beslut 4 (steg 2 av 2 i relationsmodellens mekanisering). BEROENDE: task-140 måste landa FÖRST — båda utökar `scripts/check-thread-index.sh` och parallellt arbete kolliderar. Ordningen är beslutad i ADR-095 § Uppföljning, inte vald av bekvämlighet.

Detta kort finns eftersom ADR:ns Uppföljning pekade på "egna arbets-kort" som aldrig skapades vid mintningen (S97, 2026-08-05).

BAKGRUND, källmärkt:
`barn` finns inte som mekanism idag — det uttrycks i TRE ad hoc-former (formell to-issues-hierarki, lös radprosa, tvärsnittsproduktion spridd över andra trådars PRD-träd). T119:s optionsrymd prövade tre platser; Option C valdes och bekräftades oberoende av nio branschsystem: `docs/research/barn-falt-tradregister-designbeslut-2026-08-04.md` § C, och `relationsarkitektur-dokumentationssystem-2026-08-04.md`.

`barn` är en ASYMMETRISK relation. Deklareras i EN riktning: tråden pekar på sina kort och barn-trådar. "Vem är förälder till X" HÄRLEDS mekaniskt vid behov och speglas ALDRIG för hand. Det är beslut 2:s bärande regel — ingen människa håller två fritextlistor i synk som primär mekanism.

FORM (Option C): separat manifest, additivt och glest — bara trådar med FAKTISKA barn får en post. Rör ingen av de befintliga trådraderna och inte pipe-antals-invarianten. Fungerar identiskt oavsett om tråden har en kortfil eller ej, vilket löser T95-fallet utan specialfall.

AVGRÄNSNING — LÄS DENNA FÖRE BYGGE:
Den SEMANTISKA frågan "vad räknas som barn" är ÖPPEN och Marcus, inte byggarens. ADR-095 § Avgränsningar bär mätningen: T69/T95 är entydiga raka PRD-skivor, men T85 bär tre spinoff-kort (TASK-49–51) som aldrig var skivor, och T86 bär 15+ kort varav flera egentligen är ANDRA trådars produkter. Migrering av befintlig text är alltså INGEN sed-körning. Detta kort bygger MEKANISMEN och en tom eller minimal manifest-fil — det MIGRERAR inte befintliga former. Gissa inte semantiken.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Manifest-formen additiv och gles — bara trådar med faktiska barn får post
- [x] #2 Ingen befintlig trådrad ändrad; pipe-antals-invarianten orörd
- [x] #3 check-thread-index.sh utökad med en femte invariant (manifest → giltiga tråd-/kort-ID:n, båda riktningar) i samma stil som befintliga inv. 3/4
- [x] #4 barn deklareras i EN riktning; ingen kod kräver eller skriver en spegelpost
- [x] #5 Tvåsidigt bevis: invarianten SLÄPPER ett giltigt manifest och FÄLLER ett som pekar på icke-existerande ID
- [x] #6 Ingen migrering av befintliga barn-former — semantiken är Marcus beslut, öppet avgränsad i ADR-095
- [x] #7 shellcheck 0; check-thread-index.sh grön mot nuvarande register
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat i PR #750 (main 378ae781). barn-manifestet enligt ADR-095 beslut 4, Option C: tasks/threads/barn.md additivt och glest med NOLL datarader — mekanismen byggd, migreringen medvetet EJ gjord (den semantiska frågan vad som räknas som barn är Marcus beslut, öppet avgränsad i ADR-095). ASYMMETRISK relation: deklareras i EN riktning, invarianten skriver ingen fil alls så spegling är strukturellt omöjlig. Testsviten 17 -> 24 fall. Två fel i ADR-095 fångade och rapporterade i stället för att byggas mot: stale ordinaltal ('femte invariant' blev Inv 6 när TASK-140 landade först) och den tvetydiga frasen 'båda riktningar' som kunde ha lett till precis den spegling beslut 2 förbjuder — båda rättade i PR #751.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
