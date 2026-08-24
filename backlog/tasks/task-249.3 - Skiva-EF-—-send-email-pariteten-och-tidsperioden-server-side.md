---
id: TASK-249.3
title: 'Skiva: EF — send-email-pariteten och tidsperioden server-side'
status: Done
assignee: []
created_date: '2026-08-17 00:29'
updated_date: '2026-08-24 13:07'
labels:
  - ready-for-agent
dependencies:
  - TASK-249.2
parent_task_id: TASK-249
ordinal: 465000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EF-krav 4 (send-email-halvan) och 5 samt 2 ur facitets pass-nivå: utskicksvägen delar motorns regelspråk och perioden blir verkställbar. Täcker användarberättelser: 12, 13, 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 send-email löser mottagare ur SAMMA motor med AND-stödet: en regel med konjunkt-grupper ger identisk mottagarmängd som compute-segment (T50 lager b — servern äger sanningen om vilka som nås)
- [x] #2 Villkorets tidsperiod verkställs server-side: deltagandets datum följer med i källfrågan och tidsfönstret filtrerar medlemskapet; api-testfall med datumspann, tomt spann och spann utan träffar
- [x] #3 Räkne-ärligheten flyttar till servern: antalet som visas ÄR det tidsfiltrerade antalet — klientens öppna markering om ofiltrerad räkning behövs inte längre
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [ ] #6 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
EF-motorn (segment-membership.ts) och I/O-vägen (segment-resolution.ts)
utökade additivt (Par.period?, AttendanceRow.datum obligatoriskt) — noll
breaking change. AC#1 (send-email-pariteten): INGEN produktionskod behövde
ändras — resolveSegmentMembers/send-email anropade redan computeMembership,
samma motor som resolveRuleMembers/compute-segment (TASK-249.2 lämnade den
avsiktligt orörd av precis det skälet). Beviset är två nya pure-tester i
tests/api/segment-membership.test.ts som explicit jämför computeMembership
mot computeMembershipVia(...).map(h=>h.personId) för AND- och period-regler.

AC#2/#3 (tidsperioden server-side): 'Event startdatum' (fldExIP1zw5o6ib63,
live-verifierat via describe_table+list_records på staging 2026-08-17) lagd
till SOURCE_FIELDS i segment-resolution.ts — returnerar bar ISO-datum, till
skillnad från systerfältet 'Deltog datum' som (Airtable-egenhet, formelfält)
serialiseras med tidsstämpel. AttendanceRow.datum är nu obligatoriskt;
toAttendanceRow hoppar rader utan giltigt ISO-datum (fail-closed, samma
disciplin som person/kurs). parsePar validerar ett valfritt par.period
{start,end} (ISO, start<=end, annars 400) — symmetriskt i BÅDE include och
exclude. 13 nya pure-tester täcker de tre AC#2-namngivna fallen
(datumspann/tomt spann/spann utan träffar) plus gräns-, AND-grupp- och
exclude-symmetri-fall, samt 9 malformed-period-parse-fall. NEGATIV KONTROLL
körd och riven igen (harPar temporärt tvingad 'true'): 6 period-beroende
tester föll korrekt, 0 falska positiva.

LIVE staging-bevis: compute-segment + send-email (EF:erna) OMDEPLOYADE till
pqtshyierkdgwdnxuirz (delar samma _shared-moduler). 4 nya
compute-segment.staging.test.ts-tester mot verklig Airtable-data (RIM1 på
staging: en person 2025-08-10, en annan 2026-01-15) — period-snävning
strukturellt bevisad (delmängd, ej hårdkodad identitet), tomt-år-2000-fall
→ 0 utan fel, ogiltig period → 400. send-email.staging.test.ts (orörd,
6 tester) körd om mot den omdeployade EF:en — grönt, ingen regression.
compute-segment 401-probe: curl utan token → 401 (verifierat). send-email-EF:ens
401-probe kunde INTE köras via curl (mail-lås-hooken deny-resend-send.sh
matchar send-email-endpointens URL-mönster oavsett auth-läge, per design) —
verifierad i stället via den sanktionerade Playwright-vägen
(send-email.staging.test.ts AUTH-testet, grönt).

SCOPE-BESLUT, öppet bokfört: VariantD.tsx (frozen facit, ariaSnapshot-
referenser LÅSTA av TASK-249.1/PR#1480) rördes INTE. Rad ~3470 ("Tidsperioden
räknas av servern - antalet är ännu utan den.") är nu SAKLIGT INAKTUELL
(servern filtrerar nu på riktigt) men textborttagningen hör till 249.5
(flippen) — att ändra prototypens rendrade text nu hade brutit den redan
låsta ariaSnapshot-referensen, tvärtemot ADR-102/103:s promoveringskontrakt.
Flaggat som handoff-punkt för 249.5.

DoD #5/#6 (ariaSnapshot/check-facit) rör INTE denna skiva — samma
boilerplate-mönster tre syskonskivor (249.1/.2/.4) redan bokfört; flipp/
rivning har inte skett än. Lämnade omarkerade, ej gissat klara.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Byggd och landad i natt-orkestreringen S104 2026-08-17 (resume 5). PR: se kortets notes/kommentarer; CI grön per jobb + merge-kö-verifikat. Stängd av orkestreraren efter landnings-verifiering mot origin/main.

S112 bokföringspass (2026-08-24): PR #1492 MERGED, CI SUCCESS (verifierad gh pr view). DoD #5/#6 N/A per kortets egen notering (boilerplate, samma skäl som 249.2/.4) — lämnas orörda.
<!-- SECTION:FINAL_SUMMARY:END -->
