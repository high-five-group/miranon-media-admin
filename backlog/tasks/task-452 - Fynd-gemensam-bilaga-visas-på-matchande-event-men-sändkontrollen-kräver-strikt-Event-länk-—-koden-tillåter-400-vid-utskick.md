---
id: TASK-452
title: >-
  Fynd: gemensam bilaga visas på matchande event men sändkontrollen kräver
  strikt Event-länk — koden tillåter 400 vid utskick
status: To Do
assignee: []
created_date: '2026-09-18 10:41'
labels:
  - fynd
  - ready-for-agent
dependencies: []
references:
  - docs/research/utskicksytan-karta-och-historik-2026-09-18.md
priority: high
ordinal: 793000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`get-event-attachments` visar gemensamma bilagor (Räckvidd = Gemensam, ADR-125) på varje event de matchar via `matcharEvent`. `resolveAttachments` i `supabase/functions/send-action-email/index.ts:304–305` har ingen Gemensam-gren: `linkedIds(record.fields['Event']).includes(eventId)` annars 400 "does not belong to event". En gemensam bilaga vald på ett annat event än ursprungseventet — eller en genuint event-lös gemensam bilaga (som `delete-attachment/index.ts:202` räknar med) — fälls därför vid sändning. Inget test täcker skarven (enda träffen i send-action-email.test.ts:1209 gäller en annan regression). Om det HÄNDER i prod är en hypotes: det beror på datan.

Hittat av S127 (P2 + orkestrerarens stickprov). Bär direkt på bilagor i svepet: en gemensam bilaga är den naturliga bulk-bilagan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Staging-prov: gemensam bilaga bifogad på icke-ursprungsevent via åtgärdssidan — utfallet (200 eller 400) dokumenterat med request-id
- [ ] #2 Om 400: rött-först-test, sedan sändkontrollen använder samma räckviddsmatchning som get-event-attachments (_shared/rackvidd-matchning.ts) — fail-closed behålls för bilagor som INTE matchar
- [ ] #3 Om 200: kortet stängs med förklaringen varför koden ändå släpper, och ett test som låser beteendet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
