---
id: TASK-158.1
title: 'Skiva: ADR-099 — rullande fönstret för sessionsdok-roten'
status: Done
assignee: []
created_date: '2026-08-07 12:25'
updated_date: '2026-08-09 08:09'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-158
ordinal: 272000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: beslutet som styr hela arbetsenheten finns publicerat och citerbart — en läsare av ADR-041 ser öppet att fas-avslut-bindningen är riven och var efterträdaren bor; en läsare av ADR-099 ser fönsterregeln, dess konfig-hemvist och rivningens motiv (Fas 6-längden falsifierade premissen; synk-föroreningen per ADR-048). Täcker användarberättelser: 8 (grund för 3, 5)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: ADR-041, ADR-023 och ADR-048 lästa i sin helhet FÖRE författande; avvikelse mot PRD:ns premisser → stanna och flagga
- [x] #2 ADR-099 kodifierar fönsterregeln (~10 senast stängda + samtliga paused/active i roten; talet pekas ut som konfig-värde, inte hårdkodat i prosa)
- [x] #3 Fas-avslut-bindningen (ADR-041) rivs ÖPPET med amenderings-block i ADR-041 + kvittens-referens till S99 Del 5 — aldrig tyst
- [x] #4 ADR-index/README-räkningen stämmer efter mintningen
- [x] #5 PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
[TASK-169, backlog-städet, 2026-08-09] DoD#5 (serie-ordningen ADR→migration→grind bindande) GENUINT UTAN BELÄGG ännu och lämnas OBOCKAD med avsikt: TASK-158.4 (drift-grinden i nattnätet) är fortfarande status To Do — grinden som skulle bevisa ordningens sista led existerar inte än. Detta är strukturellt annorlunda än övriga rutor i denna städ-omgång: det är inte en glömd bock utan en väntande sibling-leverans. Flippar INTE status (kortets övriga AC/DoD är fullt bevisade och kortet är funktionellt klart) — se slutrapport för task-169 för fullständig motivering av varför jag inte heller flippar status. Kortet kommer fortsätta trigga check-backlog-closure.sh invariant 2 tills antingen (a) TASK-158.4 landar och boxen kan bockas mot verkligt belägg, eller (b) Marcus/orkestreraren fattar ett explicit policybeslut om hur denna klass (Done-med-dokumenterat-undantag) ska hanteras av grinden.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängning i S99-resume 1 (2026-08-07): #903 mergad 8f62e69b, per-jobb-grön (D0-gatad Test suite-skip legitim). ADR-099 landad med disk-verifierat reserverat nummer; ADR-041 beslut 6 rivet öppet med Updates-block + Del 5-kvittens; räknings-grinden 99==99. Agentens premiss-korrektion bokförd: rotens faktiska breakdown 77 closed/3 active/3 paused + 3 dok utan lifecycle-fält (uppdragets '4 paused' var fel). lychee självfångade en felaktig ADR-länk före push — grinden bevisad i båda riktningar.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → migration → grind är bindande: ADR-099 landad före migrations- och grind-skivorna exekveras
<!-- DOD:END -->
