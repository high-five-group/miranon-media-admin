---
id: TASK-129
title: >-
  Fynd: ADR-091:s CSP-rivning pekar på rad 120–134 men nonce-designen bär 27
  förekomster över fem sektioner — plus en stale admin-domän utanför rivningens
  scope
status: Done
assignee: []
created_date: '2026-08-02 16:26'
updated_date: '2026-08-04 11:01'
labels:
  - ready-for-human
dependencies: []
modified_files:
  - docs/decisions/ADR-091-hosting-deploy-vercel-pro.md
priority: medium
ordinal: 215000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Funnet under granskningen av TASK-127.1 (S96-natten 2026-08-02), vid läsning av SECURITY-SPEC.md på gren docs/task-127.1-adr-invite-auth.

INTE ett fynd om glömd rivning. ADR-091 punkt 4 registrerade rivningen öppet och sköt rättelsen: 'SECURITY-SPEC:s hosting-/CSP-avsnitt (rad 120–134) är härmed superseded och rättas mot denna ADR + R1 i samband med Grind 0-exekveringen eller Fas 7:s CSP-skiva — öppen rivning, inte tyst.' Deferralen är alltså korrekt bokförd.

SYMPTOM 1 — radintervallet underskattar ytan. Den falsifierade nonce-designen bär 27 förekomster av 'nonce' fördelade över minst fem rubriker: '## 1. Content Security Policy (CSP Level 3)' (rad 16), '### Nonce-baserad strikt CSP' (rad 31), '### Vite-plugin för CSP-nonce' (rad 58, med komplett plugin-kod), '#### CSP-direktiv för Trusted Types' (rad 223) och '### CSP och headers' i §9 Säkerhetschecklista (rad 822, kryssrutan 'CSP Level 3 implementerad med nonce per request'). Rad 120–134 täcker en bråkdel. Den som exekverar mot bokstaven rättar hosting-stycket och lämnar hela designen, plugin-koden och Fas 7-checklistan stående — och checklistan är just det instrument Grind 0/Fas 7 ska använda.

SYMPTOM 2 — utanför rivningens scope helt. SECURITY-SPEC rad 461 bär 'Access-Control-Allow-Origin': 'https://admin.miranon.se'. ADR-091 punkt 2 beslutade origin admin.miranon.dev. Domänfelet är inte CSP-mönstret och täcks inte av punkt 4:s deferral. Ursprungligen sett av TASK-127.1:s bygg-agent, som korrekt lämnade det orört som utanför sin skivas scope (AC#2 gällde enbart passkey-avsnittet).

AVGRÄNSNING — de flesta 'miranon.se' i repot är LEGITIMA. Den publika sajten heter miranon.se och Airtable-fältet heter bokstavligen 'Publicerad på miranon.se' (19 filer totalt). Endast admin.-subdomänen är stale. En svepande sök-ersätt vore fel.

RÖRLIGT RADINTERVALL: TASK-127.1:s landning ändrade SECURITY-SPEC med 26+/51- rader, så ADR-091:s '120–134' pekar redan på annat innehåll än när det skrevs. Radnummer i ADR:er åldras — värt att ersätta med rubriknamn vid rättelsen.

ÅTGÄRDSRIKTNING (ej beslutad): antingen amendera ADR-091 punkt 4 så intervallet blir rubrikbaserat och täcker hela ytan, eller låt Grind 0/Fas 7:s CSP-skiva bära ett explicit AC om att SAMTLIGA nonce-bärande sektioner + §9-checklistan rättas till hash/'self'-formen. Domänfelet (symptom 2) kan rättas fristående när som helst.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KLASSAD ready-for-human / medium (orkestreraren, 2026-08-03, på Marcus delegation). SKÄL: kortet bär två åtgärdsvägar som utesluter varandra och valet är ett ADR-beslut — antingen amenderas ADR-091 punkt 4 så intervallet blir rubrikbaserat och täcker hela ytan, eller så bär Grind 0/Fas 7:s CSP-skiva ett explicit AC om samma sak. Att välja åt Marcus vore att besluta hur en ADR:s räckvidd ska läsas. NOT: kortets symptom 2 (rad 461, admin.miranon.se mot ADR-091:s admin.miranon.dev) är mekaniskt trivialt och skulle kunna brytas ut som eget ready-for-agent-kort om Marcus vill ha den delen gjord utan att avgöra den större frågan.

LÖST via ÅTGÄRDSVÄG A, beslutad av Marcus 2026-08-04 i S96-sessionen (chattkvittens; bokförd i sessionsdok Del 10 av orkestreraren). ADR-091 amenderad (Updates-block "2026-08-04 (S96) — Punkt 4 blir rubrikbaserat, inte radintervall-baserat"): punkt 4:s rivnings-scope läser nu SAMTLIGA nonce-bärande rubriker i SECURITY-SPEC.md i stället för radintervallet 120–134 (som redan pekade fel, mätt: TASK-127.1:s commit 6fbb6290 ändrade filen 26+/51- EFTER att ADR-091 mintades samma dag). SECURITY-SPEC.md självt är INTE rört av detta kort — rivningen exekveras alltjämt vid Grind 0/Fas 7 per ursprungspunkt 4. Symptom 2 (rad 461, admin.miranon.se) utbrutet som eget ready-for-agent/low-kort: TASK-136.

PREMISS-PASS (ADR-086): kortets radnummer och rubrik-citat (rad 16/31/58/223/822, rad 461) verifierade EXAKT mot dagens HEAD — samtliga träffar. DIVERGENS funnen och rapporterad, ej byggd vidare på: kortets 'nonce'-räkning ('27 förekomster... över fem rubriker') mätte 40 case-insensitive / 36 case-sensitive-lowercase / 30 rader vid omräkning 2026-08-04 (grep -o -i 'nonce' resp. grep -c -i) — sannolikt filändringar mellan fyndet och denna åtgärd. Räkningen är INTE bindande för amenderingen (som är rubrik- inte räknebaserad per uppdraget), så divergensen påverkar inte lösningen. Samma mönster på AVGRÄNSNING-stycket: '19 filer totalt' för frasen 'Publicerad på miranon.se' mätte 14 filer 2026-08-04 (bokfört på TASK-136 i stället, eftersom den frasen hör till det utbrutna kortets avgränsning, inte detta korts amendering).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Väg A utförd (Marcus-beslut 2026-08-04, S96 Del 10) av bygg-agent: ADR-091 fick Updates-block 2026-08-04 som gör punkt 4:s rivnings-scope RUBRIKBASERAT över samtliga nonce-bärande SECURITY-SPEC-sektioner + §9-checklistan (radintervallet 120–134 pekade redan fel). Symptom 2 (admin.miranon.se rad 461) utbrutet som TASK-136 (ready-for-agent/low). Leverans: PR #687, merge 7ee83f76, checks 7 pass + 1 skipping (läst via gh pr checks — DoD #3 bockad mot faktiskt utfall). Premiss-divergenser (nonce-räkningen 27→40, filräkningen 19→14) bokförda i Implementation Notes, ej ärvda. SECURITY-SPEC självt orört per deferralen — rättelsen exekveras vid Grind 0/Fas 7.
<!-- SECTION:FINAL_SUMMARY:END -->
