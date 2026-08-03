---
id: TASK-129
title: >-
  Fynd: ADR-091:s CSP-rivning pekar på rad 120–134 men nonce-designen bär 27
  förekomster över fem sektioner — plus en stale admin-domän utanför rivningens
  scope
status: To Do
assignee: []
created_date: '2026-08-02 16:26'
updated_date: '2026-08-03 09:43'
labels:
  - ready-for-human
dependencies: []
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
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KLASSAD ready-for-human / medium (orkestreraren, 2026-08-03, på Marcus delegation). SKÄL: kortet bär två åtgärdsvägar som utesluter varandra och valet är ett ADR-beslut — antingen amenderas ADR-091 punkt 4 så intervallet blir rubrikbaserat och täcker hela ytan, eller så bär Grind 0/Fas 7:s CSP-skiva ett explicit AC om samma sak. Att välja åt Marcus vore att besluta hur en ADR:s räckvidd ska läsas. NOT: kortets symptom 2 (rad 461, admin.miranon.se mot ADR-091:s admin.miranon.dev) är mekaniskt trivialt och skulle kunna brytas ut som eget ready-for-agent-kort om Marcus vill ha den delen gjord utan att avgöra den större frågan.
<!-- SECTION:NOTES:END -->
