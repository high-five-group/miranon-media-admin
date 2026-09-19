---
id: TASK-479
title: >-
  PRD: CI-hygien — SE-våg 1b (aktuell karta + CI-avsnittet ur CLAUDE.md, ägare
  för rött efter landning, replik-identitet)
status: To Do
assignee: []
created_date: '2026-09-19 10:52'
labels: []
dependencies: []
priority: high
ordinal: 830000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Djupgranskningen av CI (S126, 2026-09-17) lämnade arton åtgärder utan kort. Tre av dem hör till första vågen men handlar inte om minuter: ingen fil ger en aktuell karta över CI-arkitekturen och varje färsk agent laddar ett mycket stort CI-avsnitt den sällan behöver (ca 1 589 agentstarter på 51 dagar); rött efter landning saknar tidsregel och namngiven ägare (16 larm stod obesvarade i 10–11 dygn; 2026-09-19 stod tre röda efterkontroller på main samtidigt, alla på samma ärvda testfel); och bevis-workflowens kopia av paraplyets logik är handhållen och kan glida utan att något märks.

### Lösning

Marcus och varje agent kan läsa EN aktuell karta över CI-besluten, och den alltid-laddade filen bär bara det som gäller i stunden. Ett rött efter landning har en ägare och en tidsgräns, och svepet säger till. En grön bevis-körning bevisar fortfarande dagens logik, eftersom kopian inte kan avvika.

### Användarberättelser

1. Som ägare vill jag ha en alltid aktuell karta över CI- och grindvaktsarkitekturen, så att jag kan förstå helheten utan att läsa tusentals rader.
2. Som agent vill jag att den alltid-laddade filen bara bär det jag behöver i stunden, så att varje uppdrag kostar mindre kontext och färre regler läses fel.
3. Som orkestrerare vill jag att CI-reglerna jag behöver i armerings- och landningsögonblicket fortfarande når mig, så att flytten inte tar bort ett skydd som bara fungerade för att texten var laddad.
4. Som ägare vill jag att ett rött efter landning har en namngiven ägare och en tidsregel, så att inget larm står obesvarat i dagar.
5. Som orkestrerare vill jag att svepet rapporterar nattens och efterkontrollens rött, så att jag inte behöver leta efter det.
6. Som ägare vill jag att bevis-workflowens kopia av paraplyets logik inte kan glida, så att ett gammalt grönt bevis fortfarande betyder något.

### Implementationsbeslut

SE13 och SE21 byggs i SAMMA skiva: kartan måste finnas innan CI-avsnittet kan peka på den (åtgärdsplanens eget beroende). Kartan är pekare, aldrig kopia (ADR-100 § 2). Flytten ur den alltid-laddade filen prövas regel för regel mot frågan 'gäller den i ett ögonblick där ingen annan fil är laddad?' — sådana regler STANNAR (filens egna 'Varför raden står här'-stycken är facit). PR:en lämnas som UTKAST; Marcus läser före armering, eftersom den rör konstitutionen. SE16: tidsregel och ägare för rött efter landning, och svepet utökas att rapportera nattens och efterkontrollens rött (förutsättningen N2 är landad). SE18: byte-identitet mellan paraplyets logik och dess replik, mekaniskt prövad.

### Testbeslut

Befintliga skarvar: gatekeeper-svit per ändrat skript (wirad i ci.yml), strukturvakterna (check-listparitet, check-aggregator-needs, gate-proof) och dokumentgrindarna (npm run check:docs). För SE13+SE21 finns ingen testskarv för 'rätt regel stannade' — därför Marcus läsning före armering. För SE16 bevisas svepets nya rapportering tvåsidigt i dess befintliga testsvit.

### Utanför omfattningen

SE-våg 2 (produktskyddet), 3 (SE17, SE19) och 4 (återanvändning över repon) — egna PRD-kort vid respektive vågstart. Minutbudgeten (TASK-464). Efterkontroll på klocka (research-pass).

### Estimat

Tre skivor + QA. SE13+SE21: medel (läsning dominerar). SE16: liten–medel. SE18: liten.

### ADR-koppling

ADR-100 (sanningshierarkin — karta, aldrig kopia), ADR-083 (prosa som påstår mekanism), ADR-097 § (d) (avvisade att flytta regler TILL en alltid-laddad yta — samma budget-resonemang, omvänd riktning), ADR-077 (nattnätet), ADR-133 (mintas i TASK-464.3).

### Ytterligare anteckningar

Grillad ordning för hela SE-högen: S126 Del 17 beslut 10. Rättelse i samma pass: SE21 lades först i våg 1 och SE13 i våg 3; åtgärdsplanen säger att SE21 pekar på SE13:s karta, så de hör ihop.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
