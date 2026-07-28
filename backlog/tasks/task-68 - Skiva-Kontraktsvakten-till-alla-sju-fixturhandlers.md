---
id: TASK-68
title: 'Skiva: Kontraktsvakten till alla sju fixturhandlers'
status: Done
assignee: []
created_date: '2026-07-28 14:07'
updated_date: '2026-07-28 14:42'
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
- [x] #1 get-event, get-event-formats, get-persons och get-person har var sitt kontraktsfall med rätt schema, kuvertnyckel och fixturkälla
- [x] #2 Vakten körd skarpt mot staging; utfallet per endpoint redovisat i PR:n
- [x] #3 Ett larm som uppstår rapporteras med endpoint och avvikelseklass — varken fixtur eller schema lappas för att tysta det
- [x] #4 Vakten är fortsatt enbart nattlig och icke-blockerande; ci-suite.yml orörd
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Kontraktsvakten täcker nu SJU av sju fixturhandlers (PR #346, CI grön per jobb — samtliga åtta jobb inkl. staging och acceptance). Fyra nya fall: get-event, get-event-formats, get-persons, get-person, alla med schemaobjekt importerade ur src/domain/schemas-barreln.

AVVIKELSE MOT KORTETS ANTAGANDE, godkänd av orkestreraren: kortet skrev 'fyra nya poster i en befintlig lista', men två av fyra svarar med ett OBJEKT, inte en lista ({ event }, { person }). Jämförelsekärnan krävde Array.isArray och hade gett KUVERT-falsklarm varje natt om vaktens egen form. Agenten byggde minsta möjliga åtgärd — enkelpost -> ettpostslista -> exakt samma jämförelse, ~20 rader — i stället för att stanna, och flaggade den öppet.

DET FÖRVÄNTADE TASK-52-LARMET UTEBLEV, OCH DET ÄR ETT FYND: ankaret ZZ-History Person 01 har motivering: null i staging, så typjämförelsen hoppar över nyckeln (null-blindheten, H6 i kartläggningen). Fallet är alltså blint för just motivering. Defekten finns i staging (2 av 28 prövade personer returnerar array) men de två raderna är seed:review-granskningsdata, transienta per konstruktion — att ankra där hade återinfört purge-racet TASK-61 avskaffade. Att stänga blindheten kräver permanent staging-data med ifylld motivering: registrerat, ej förkastat, utanför denna skiva.

ATT VAKTEN SKULLE FÄLLA ÄR ÄNDÅ BEVISAT: TASK-52:s exakta form (motivering: ['Det är dags', null]) spelas upp i api-pure och ger SCHEMA-STAGING + TYPDIVERGENS vid VARJE PR, utan staging.

FAKTARÄTTELSE UR SKIVAN: Motivering (text) (fld4ENxbma679wvcC) är INTE ett lookup som kortet och kartläggningen påstod, utan en FORMULA över rollupen fldIuuv4orI0DyLro. Verifierat av orkestreraren direkt mot staging-schemat. Symptomet oförändrat, åtgärden påverkas — värdet sätts på en länkad Anmälan, inte på personen. Rättat i TASK-52 och i research-doket.

ÖPPET, EJ ÅTGÄRDAT: pariteten kontraktsfall <-> handlers är en konvention, ingen grind. Att mekanisera den är billigt men skulle flytta en nattlig vakt in i presubmits beslutsrymd — policyval, utskrivet i koden.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
