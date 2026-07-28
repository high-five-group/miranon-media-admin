---
id: TASK-68
title: 'Skiva: Kontraktsvakten till alla sju fixturhandlers'
status: To Do
assignee: []
created_date: '2026-07-28 14:07'
labels:
  - ready-for-agent
dependencies: []
ordinal: 141000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Kontraktsvakten bevakar i dag TRE av fixturvärldens SJU handlers. Denna skiva stänger gapet.

BELÄGG (docs/research/kontraktsdrift-skyddet-2026-07-28.md): kontraktsfall.ts rad 49-108 bär get-events, get-registrations och get-event-notes. handlers.ts rad 77-100 registrerar dessutom get-event, get-event-formats, get-persons och get-person. De fyra obevakade bär fyra scheman som ingen vakt någonsin rör: EventFormatSchema, PersonSchema, PersonDetailSchema, PersonHistoryEntrySchema.

VARFÖR NU — DEFEKTEN LIGGER I GAPET: TASK-52 är live-verifierad och lever i produktion. Airtables 'Motivering (text)' är ett lookup och returnerar en ARRAY; PersonDetail.schema.ts:44 kräver z.string().nullable(); zod fäller och persondetaljen visar felvy för varje person med motivering. fixture-data.ts rad 959-965 dokumenterar divergensen medvetet. Vakten hade fällt den FÖRSTA NATTEN om get-person stått i KONTRAKTSFALL. Urvalet valdes på anropsvolym (kontraktsfall.ts rad 14-35 säger 'Svansen är obevakad') — men risken följer inte volym.

OMFATTNING: lägg till kontraktsfall för get-event, get-event-formats, get-persons och get-person. Formen finns redan — detta är fyra nya poster i en befintlig lista plus fyra GET i nattjobbet, alltså sekunder.

FÖRVÄNTAT: vakten larmar på get-person motivering redan vid första körningen mot staging. DET ÄR RÄTT UTFALL, inte ett fel i skivan. Larmet ska INTE tystas och fixturen ska INTE lappas för att tysta det — kontraktsjamforelse.ts skriver själv 'Lappa ALDRIG fixturen bara för att larmet ska tystna'. Rapportera larmet; TASK-52 äger åtgärden.

ATT VETA: vakten är icke-blockerande och kör endast nattligt (nightly.yml). Den kan strukturellt inte fälla en PR. Lägg den ALDRIG i ci-suite.yml — den är delad mellan natt och presubmit.

AVGRÄNSNING: felkontrakten (404/400) är TASK-69, inte denna skiva. Här bevakas 200-formen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 get-event, get-event-formats, get-persons och get-person har var sitt kontraktsfall med rätt schema, kuvertnyckel och fixturkälla
- [ ] #2 Vakten körd skarpt mot staging; utfallet per endpoint redovisat i PR:n
- [ ] #3 Ett larm som uppstår rapporteras med endpoint och avvikelseklass — varken fixtur eller schema lappas för att tysta det
- [ ] #4 Vakten är fortsatt enbart nattlig och icke-blockerande; ci-suite.yml orörd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
