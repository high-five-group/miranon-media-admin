---
id: TASK-309.28
title: >-
  Fynd: agenda-dialogens knappar '+ Lägg till punkt' och '+ Lägg till
  meditation' ska vänsterställas, inte centreras
status: Done
assignee: []
created_date: '2026-08-26 03:26'
updated_date: '2026-08-28 03:17'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 594000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-röktest 2026-08-26 (S108 resume 11), ordagrant: 'En annan sak jag fick se är att "+lägg till punkt" och "+lägg till meditation" behöver vänsterställas centrerat. Just nu ligger knappar med center, center, vilket jag inte gillar. Detta är alltså knapparna inuti "agenda-modalen".'

Tolkning (bekräfta mot koden och mot Marcus formulering, ändra inte mer än detta): knapparna ligger i dag horisontellt centrerade i dialogen; de ska stå vänsterställda i samma vänsterkant som agendaraderna ovanför (samma indrag/linje som radernas text), i sin befintliga inbördes ordning. Ingen annan form i dialogen ändras.

VAR: block-dialogens agenda-läge i genereringsvyn — src/components/dokument/ (BlockDialog / agenda-editorn; grep 'Lägg till punkt' och 'Lägg till meditation'). Läs kommentarerna i komponenten först: flera formval där är Marcus-beställda (prototyp-konvergensen, S108 Del 3–13) och får inte rivas i förbifarten.

FACIT: block-dialogens agenda-läge är en av s108-genererings ytor (facit.json 'block-dialog × 4 lägen' — verifiera vilken bild som avbildar agenda-läget). Manifestet är OSTÄMPLAT: ta om den berörda bilden/bilderna (desktop + mobil om båda finns) med skiva 9:s metod (docs/reference/prototyp-verifiering-runbook.md § Bildtagningens två fällor), uppdatera not-fältet, rör ALDRIG godkand.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Knapparna '+ Lägg till punkt' och '+ Lägg till meditation' är vänsterställda i linje med agendaradernas vänsterkant, i desktop och 375 px — bounding-box-mätning mot radernas x-position i PR:en
- [x] #2 Ingen annan form i dialogen ändrad (ariaSnapshot-paret för block-dialogen oförändrat utöver knappraden)
- [x] #3 Berörda facit-bilder i s108-generering omtagna med skiva 9:s metod; not-fältet uppdaterat; godkand orört; dokumentationsgrindarna exit 0
- [x] #4 Tabordning och knapparnas tillgängliga namn oförändrade; axe grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Stängningssvansen (S108 resume 13): kortet saknade Implementation Notes/Final Summary — skriven ur PR #1994:s beskrivning + diff (gh pr view/diff). Verifierat: gh pr view 1994 — MERGED 2026-08-26T04:43:03Z, merge-SHA 63757d7ae04b688cd35f09f8d1b1667f6a95c77f. gh pr diff 1994 --name-only: BlockDialog.tsx, facit-block-dialog-agenda-{desktop,mobil}.png, s108-generering/facit.json, kortfilen (+20/-11, 5 filer) — inga orelaterade filer. gh pr checks 1994: samtliga körda jobb pass. Landning: PR #1994 (<https://github.com/high-five-group/miranon-media-admin/pull/1994>).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Agenda-dialogens knappar '+ Lägg till punkt'/'+ Lägg till meditation' vänsterställda i stället för centrerade (PR #1994). Rotorsak: BlockDialog.tsx § AgendaEditor bar w-full justify-center (ärvt från Button-basklasserna) → ikon+text centrerades i den fullbredda knappen. Fix: justify-start pl-0 (samma mönster som AnmalningRadResolution.tsx/AnmalningarSida.tsx). Mätning (AC #1, engångs-Playwright-spec, raderad efter passet): knapp-ikon-x mot agendaradernas text-x — desktop 1px diff, 375px 1px diff (diffen är knappens egen border). Facit omtaget: facit-block-dialog-agenda-{desktop,mobil}.png i s108-generering/, not-fält uppdaterat, godkand orört (null). Grindar (PR-kroppen): check:docs 14/14, typecheck 0, biome 0 (inga nya fel), build 0, check-langa-streck 0, test:api:pure 756/756 (3 körningar), test:api:staging 1196/1197 (en orelaterad flake i get-persons-register.staging.test.ts under hög samtidig CI-last, ingen koppling till BlockDialog/agenda), promoverings-grinden 12/12 (ariaSnapshot-paret oförändrat), mer-eventinnehall+mer-platser 6/6 inkl axe 0 violations, tabordning/tillgängliga namn oförändrade, axe 0 violations.
<!-- SECTION:FINAL_SUMMARY:END -->
