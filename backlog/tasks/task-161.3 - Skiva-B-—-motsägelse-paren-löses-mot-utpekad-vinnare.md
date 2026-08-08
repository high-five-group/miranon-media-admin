---
id: TASK-161.3
title: 'Skiva: B — motsägelse-paren löses mot utpekad vinnare'
status: To Do
assignee: []
created_date: '2026-08-07 19:04'
updated_date: '2026-08-08 07:04'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.2
modified_files:
  - CLAUDE.md
  - docs/byggplan.md
  - docs/reference/airtable-interaction.md
parent_task_id: TASK-161
ordinal: 293000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: två styrande ytor kan inte längre säga olika saker om samma kunskapsklass — varje f.d. par har EN källa och pekare. Täcker användarberättelse: 3
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga elva Ö-par ur Explore-kartan lösta: vinnaren är den yta ADR-100:s domäntabell pekar ut (fas-status: byggplan §2 vinner, CLAUDE.md-pekaren rättas; operations-registret: SECURITY-SPEC-formen vinner, airtable-interaction-tabellen blir pekare; sanningshierarkins tre versioner: ADR-100 är källan, hub-§0 och CLAUDE.md-parentesen blir pekare; kvalitetsribban: CLAUDE.md-tabellen förblir bärare tills KVALITETSDEFINITIONER fylls — pekaren dit får öppen deferral-markering; övriga par per kartans facit)
- [ ] #2 Förloraren i varje par ELIMINERAS eller blir explicit karta med pekare — aldrig en kvarlämnad andra sanning; hub-sidans Ö8-rader lämnas till hub-skivan
- [x] #3 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-DIVERGENS (ADR-086), bokförd öppet: uppdragets "Explore-kartan" (S99
uppdrag 9-passets fil:rad-facit för de elva Ö-paren) existerar INTE som fil på
disk — uttömmande sökning (grep across docs/, tasks/, backlog/) gav noll
träffar, och tasks/sessions/2026-08-07-session-99.md § Del 10 är en narrativ
SAMMANFATTNING utan fil:rad-detaljer, inte kartan själv. Byggd endast på de 4
explicit specade paren i AC #1 + en egen forensisk skanning (grep +
general-purpose-agent, konservativ/hög-precision) mot ADR-100:s domäntabell
som arbiter.

FEM par lösta (disk-verifierade):
1. fas-status — CLAUDE.md pekade §4 (fel sektion, "Per-fas-prompter"); rättat
   till §2 ("Fas-tabell", den faktiska status/ordning-källan).
2. operations-registret — airtable-interaction.md §7:s tabell explicit
   omramad som spegling/pekare mot field-allowlists.ts, med citat av
   SECURITY-SPEC §6.1:s "enda sanningskällan"-formulering.
3. sanningshierarkins tre versioner — CLAUDE.md:s parentes (dubblerad kopia
   av ADR-100 §1:s domäntabell) eliminerad, ren pekare kvar.
4. kvalitetsribban — CLAUDE.md-tabellen behållen som bärare + öppen
   deferral-markering (KVALITETSDEFINITIONER-11-REACT.md §3-§5 verifierat
   TBD).
5. (EGET FYND, ej i AC:s namngivna 4) ADR-antal — byggplan.md rad 16 hade en
   ogrindad kopia av README.md:s CI-grindade ADR-räkningstoken
   (check-adr-count.sh kollar ENDAST README.md); bytt till pekare.

ÖVERVÄGDA OCH AVFÄRDADE kandidater (registrerat, inte tyst förkastat):
- byggplan.md:15 "Auktoritativ källa för fas-sekvens" → docs/archive/
  byggplan-direktiv.md §5: gränsfall, INTE en tvåyte-motsägelse (byggplan.md
  är internt konsistent) utan snarare en enskild-doks hygien-lucka (saknar
  ADR-100 §4:s frys-banderoll). Ej löst här — hör varken till mitt Ö-par-scope
  eller till 161.8:s explicit namngivna tre dok.
- docs/specs/BYGGPLAN-LÄTTLÄST-v3.md (stale status, 2026-06-25) — EXPLICIT
  161.8:s scope (PRD:n namnger den bland de tre frys/återuppliva-doken). Rörd
  INTE.
- CLAUDE.md/CONTRIBUTING.md DoD-kommandolista (4 rader dubblerade) — svag
  kandidat, redan korrekt attribuerad ("per CONTRIBUTING.md"), låg drift-risk
  (npm-scriptnamn), och matchar handlingsregel-undantaget C-omformningarna
  redan använder (i-ögonblicket-nytta > pekare-kostnad). Avfärdad.

ÖPPET GAP: "samtliga elva" i AC #1 kan INTE verifieras uppfyllt — 5 av
(11 - 1 Ö8-till-161.7 =) 10 par i mitt scope är lösta med hög konfidens; upp
till 5 par kvarstår ospårade utan den försvunna kartan. AC #1 + #2 lämnas
DÄRFÖR AVBOCKADE (ej uppfyllda enligt bokstaven). Rekommendation till
orkestreraren: antingen (a) Marcus/orkestreraren har den ursprungliga
Explore-kartan i en yta jag inte sökt igenom och kan posta den, eller (b)
161.10 (QA — ände-till-ände) gör en ny, fullständig skanning som facit.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
