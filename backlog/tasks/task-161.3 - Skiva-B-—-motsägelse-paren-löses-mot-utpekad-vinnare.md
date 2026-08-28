---
id: TASK-161.3
title: 'Skiva: B — motsägelse-paren löses mot utpekad vinnare'
status: Done
assignee: []
created_date: '2026-08-07 19:04'
updated_date: '2026-08-08 07:38'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.2
modified_files:
  - CLAUDE.md
  - docs/byggplan.md
  - docs/reference/airtable-interaction.md
  - docs/reference/data-model.md
  - docs/reference/hur-systemet-funkar.md
parent_task_id: TASK-161
ordinal: 293000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: två styrande ytor kan inte längre säga olika saker om samma kunskapsklass — varje f.d. par har EN källa och pekare. Täcker användarberättelse: 3
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga elva Ö-par ur Explore-kartan lösta: vinnaren är den yta ADR-100:s domäntabell pekar ut (fas-status: byggplan §2 vinner, CLAUDE.md-pekaren rättas; operations-registret: SECURITY-SPEC-formen vinner, airtable-interaction-tabellen blir pekare; sanningshierarkins tre versioner: ADR-100 är källan, hub-§0 och CLAUDE.md-parentesen blir pekare; kvalitetsribban: CLAUDE.md-tabellen förblir bärare tills KVALITETSDEFINITIONER fylls — pekaren dit får öppen deferral-markering; övriga par per kartans facit)
- [x] #2 Förloraren i varje par ELIMINERAS eller blir explicit karta med pekare — aldrig en kvarlämnad andra sanning; hub-sidans Ö8-rader lämnas till hub-skivan
- [x] #3 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-DIVERGENS (ADR-086), bokförd öppet: uppdragets "Explore-kartan" (S99
uppdrag 9-passets fil:rad-facit för de elva Ö-paren) existerar INTE som fil på
disk — uttömmande sökning (grep across docs/, tasks/, backlog/) gav noll
träffar, och tasks/sessions/archive/2026-08/2026-08-07-session-99.md § Del 10 är en narrativ
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

KOMPLETTERANDE PASS (samtliga elva Ö-par, S99 uppdrag 9-kartan):
Kartan återfunnen + landad PR #976 (docs/research/styrande-docs-audit-substrat-2026-08-07.md,
§4 Ö1–Ö11) — vid detta passets start OPEN/CI IN_PROGRESS (ej mergad), läst via
`git show origin/docs/s99-explore-substratet:...` (449 rader, uppdragets egen fallback-instruktion)
i stället för gissad. #976 mergade till origin/main under passets gång (07:23:43Z) — ny gren
tagen om från färsk origin/main (eede74f1) innan push; ingen konflikt (nya main-commits rörde
inte byggplan.md/data-model.md/hur-systemet-funkar.md).

| Par | Utfall | Belägg |
|---|---|---|
| Ö1 fas-status §2/§4 | löst-tidigare (#972) | CLAUDE.md:621 pekar §2, matchar README.md:14 |
| Ö2 fas-sekvensens ägare | löst-nu | byggplan.md:15 omskrivet — "proveniens" (arkiverat direktiv, historiskt) separerad från "auktoritativ källa i dag" (byggplan.md §2), matchar tre-lager-tabellen (rad 63: Plan=byggplan.md äger "sekvens") |
| Ö3 ADR-antal 100/10 | löst-tidigare (#972) | byggplan.md:16 pekare-form mot README.md:s CI-grindade tal (102==102 verifierat denna körning) |
| Ö4 EF-antal 11/28 | redan-upplöst (161.2 #965) | airtable-interaction.md:111 "28 funktioner...Denna katalog dokumenterar 11" — internt konsistent, öppet gap bokfört, ingen motsägelse kvar |
| Ö5 operations-register 3/13 | löst-tidigare (#972) | airtable-interaction.md:298 "Sanningskällan är koden, inte tabellen" pekar SECURITY-SPEC §6.1; tabellen bär 13 rader |
| Ö6 två/fyra glossarier | löst-nu (delvis) + överlämnad-161.8 (delvis) | hur-systemet-funkar.md: explicit-map-notis tillagd ovanför Ordlista-tabellen (nybörjar-primer, pekar ORDLISTA.md:11-15 + hub SYSTEMET.md §0). BYGGPLAN-LÄTTLÄST-v3.md:577 (tredje termdefinitionen "DoD") EJ rörd — filen är EXPLICIT 161.8 AC#3:s scope (frys/uppdaterings-klassning av hela filen); en punktredigering här hade riskerat kollidera med den kommande klassningen. SYSTEMET.md §0 (fjärde termytan) är hub-repot, utanför denna spokes/skivas scope — redan korrekt pekad FRÅN ORDLISTA.md:14 |
| Ö7 kvalitetsribba-pekare till tom sektion | löst-tidigare (#972) | CLAUDE.md:634 bär öppen deferral-markering |
| Ö8 hub/spoke-dubbletter | löst-tidigare (161.7 #968) | CLAUDE.md:32-33 pekar hub i stället för att kopiera (verifierat mot hub-CLAUDE.md:145/148/152/155) |
| Ö9 data-model.md fyra auktoritetsrader | löst-nu | rad 91 + 363: "Källa: X" → "Proveniens: extraherat ur X — research-underlag, ej en parallell sanningskälla"; rad 384: "Live är auktoritativ" → "Verifieras mot Airtable-live...Airtable äger ursprunget, detta dokument förblir bäraren" — ADR-100 §2:s undantag (data-model.md utpekad enda bärare för domän 5). Ingen sakdata ändrad, endast auktoritetsspråket i de tre interna käll-raderna |
| Ö10 governing-listan skiljer ej karta/källa | överlämnad-161.4 | pekar-sidan finns redan fristående (segment-arkitektur.md:9: "detta dok binder dem, fryser dem inte. Vid konflikt gäller ADR:erna") — ingen ytterligare textfix möjlig utan mekanismen. Överlämnas till 161.4: inför `Äger:/Kartlägger:/Vid konflikt vinner:`-raden (ADR-100 § Updates 2026-08-08 del B) i de 14 governing-doken (inkl. segment-arkitektur.md), så listan mekaniskt skiljer kartor från källor. Rörde INTE .frontmatter-policy.conf, mintade inga ägar-deklarationer (uppdragets explicita instruktion) |
| Ö11 schema_reference.md ogrindad frys-standard | överlämnad-161.4 | pekar-sidan finns redan fristående och KORREKT — schema_reference.md:1-14 bär redan alla tre ADR-100 §4-element (frusen-markör "Frusen ögonblicksbild", frysdatum mars 2026/2026-08-01, pekare till data-model.md som AUKTORITATIV). Residualen är rent mekanisk. Överlämnas till 161.4: lägg filen till FRONTMATTER_GOVERNING_DOCS (.frontmatter-policy.conf) + ge den frontmatter, så standarden den redan exemplifierar också grindas. Rörde INTE .frontmatter-policy.conf (uppdragets explicita instruktion) |

Rört utanför de elva paren: inget. Samtliga tre filändringar (docs/byggplan.md, docs/reference/data-model.md,
docs/reference/hur-systemet-funkar.md) mappar direkt till Ö2/Ö9/Ö6. data-model.md:s `updated:`-fält
bumpat 2026-08-01→2026-08-08 (Check 2, matchar dagens commit).

Grind: npm run check:docs → EXIT=0, 14/14 gröna (lychee 0 errors/1756 OK, markdownlint 0 issues,
frontmatter 14/14 5-checks, ADR-räkning 102==102, lesson-numrering OK). Körd två gånger: en gång
före ombasering till färsk origin/main, en gång efter — båda gröna. Övriga DoD-kommandon
(typecheck/biome/build/test:api) ej körda: samtliga tre ändrade filer är markdown (L147 — rörd
fil-klass = docs, check:docs är den faktiska CI-grinden för den klassen).

Modell-identitet (denna agent): "You are powered by the model named Sonnet 5. The exact model ID
is claude-sonnet-5" (systemprompt, verbatim).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 3 (2026-08-08) i TVÅ pass. Pass 1 (PR #972, merge de69c0eb): fem par lösta med disk-verifikat (Ö1 fas-status §4→§2, Ö3 ADR-antal→pekare [eget fynd], Ö5 operations-registret→SECURITY-SPEC-pekare, Ö7 kvalitetsribba-deferral, sanningshierarki-parentesen eliminerad) — AC1/AC2 lämnades ÖPPNA eftersom Explore-kartan saknades som fil (två agenter träffade samma vägg). Kartan ÅTERFANNS i s99-resume-2:s sessions-transkript och landades som frusen artefakt (docs/research/styrande-docs-audit-substrat-2026-08-07.md, PR #976) på Marcus order. Pass 2 (PR #978, merge 0a313d21, per-jobb-grön): samtliga elva par redovisade mot kartan — Ö2/Ö6/Ö9 lösta nu, Ö4 verifierad redan-upplöst av 161.2, Ö8 av 161.7, Ö10/Ö11 EXPLICIT överlämnade till 161.4 (lösningen ÄR ägar-deklarationerna/grind-listan); per-par-tabell i kortets notes. Lesson-kandidat: refererat underlag ska landa som filartefakt i samma landning som specen.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
