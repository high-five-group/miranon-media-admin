---
id: TASK-161
title: >-
  PRD: Styrande-docs-auditen — drift, motsägelser, pekar-form och
  återfalls-skydd
status: To Do
assignee: []
created_date: '2026-08-07 19:01'
labels: []
dependencies: []
ordinal: 290000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Styrande-docs-auditen (S99 uppdrag 9, Explore-kartan 2026-08-07) fann att den styrande dokumentytan bär mätt drift och strukturell driftrisk: 8 instanser där prosa motsäger disk (Edge Function-antal 11 mot 28 på disk; operations-registret 3 mot 13; byggplanens auktoritets-pekare till en fil som inte finns + ADR-räkning 10 mot 100; fem av sju design-token-exempel existerar inte i koden; ofullständig D0-glob-kopia; stale radreferenser; README-badges mot fel GitHub-org; stale tillståndsrader), 11 motsägelse-par mellan styrande ytor, och en auto-laddad yta på ~57 300 tecken per session där handlingsregeln utgör ~10–20 procent av storsektionernas tecken. Rotorsaken har tre ansikten: kopior är gratis att föda och ingen mekanism ser födseln; de facto-frusna dok påstår sig leva; ägarskapet är otydligt deklarerat. Grillningen (S99 Del 10) kvitterade rotorsaks-paketet: elimination som default, review_by-bumpens innebörd definieras (förfallo-grinden finns redan i frontmatter-grindens Check 3), ägar-deklaration per styrande dok.

### Lösning

Fyra åtgärdsnivåer i ett paket: (A) all mätt drift rättas; (B) motsägelse-paren löses mot EN utpekad vinnare per sanningshierarkin; (C) auto-load-ytans två största sektioner omformas selektivt till handlingsregel + pekare, med i-ögonblicket-kriteriet ("regeln gäller i ett ögonblick där ingen slår upp en ADR") som sträng prövsten — handlingsregeln bevaras ordagrant, endast underlag flyttar till sin redan utpekade hemvist; (D) återfalls-skyddet: ADR-100 amenderas öppet med review-bump-innebörden (mini-audit per dok vid bump) och ägar-deklarationens form, governing-listan kompletteras, hubben får samma standard (centraliserings-KOMPATIBELT per T137), och spoke-lessons volym-splittas per ADR-085:s redan fattade formbeslut.

### Användarberättelser

1. Som agent som läser ett styrande dok vill jag att varje faktapåstående stämmer mot disk, så att jag aldrig designar mot en driftad kopia.
2. Som agent i ett handlingsögonblick vill jag att handlingsregeln står kvar i den auto-laddade ytan, så att pekar-omformningen aldrig kostar en miss i stunden.
3. Som läsare av två styrande ytor vill jag att de säger samma sak eller att den ena deklarerar sig som karta, så att en motsägelse alltid har en utpekad vinnare.
4. Som granskare vill jag att varje styrande dok bär en ägar-deklaration (äger X, kartlägger Y, vid konflikt vinner Z), så att governing-listan skiljer källor från kartor.
5. Som den som bumpar review_by vill jag veta vad bumpen KRÄVER (mini-audit: drift-koll mot ägd yta + pekar-integritet + ägar-deklarationens giltighet), så att kadensgrinden garanterar granskning och inte bara ett datum.
6. Som session vill jag att auto-load-ytan är liten och regel-tät, så att kontextkostnaden per session sjunker utan att styrkan försvinner.
7. Som hub-användare vill jag att hubbens styrande docs bär samma frontmatter-standard och kadens som spokens, så att hub och spoke inte har olika sanningsdiscipliner.
8. Som framtida centraliserings-design (T137) vill jag att hub-grinden byggs som universellt skript + per-repo-konfig, så att flytten till central tjänst inte kräver ombyggnad.
9. Som lärdomsanvändare vill jag att spoke-lessons bär ADR-085:s volymform, så att filen inte är en 794 000-teckens monolit som ingen konsulterar.
10. Som beslutare vill jag att de facto-frusna dok antingen fryses med banderoll eller återupplivas — aldrig lämnas i mellanläget.
11. Som ny kopia på väg att födas vill jag dö i granskningen — karta-inte-kopia som explicit kriterium i self-review och transparens-rapport.

### Implementationsbeslut

- Elimination är default; mekanisk parning (listparitet-mönstret) reserveras för kopior som måste finnas i-ögonblicket. Ingen ny semantisk grind (ADR-083 beslut 3 + ADR-100 §6 står).
- ADR-100 amenderas ÖPPET (additivt) med: review-bumpens mini-audit-innebörd + ägar-deklarationens form. Ingen ny ADR — amenderingen operationaliserar §2/§3.
- C-omformningen: handlingsregeln ordagrant bevarad i CLAUDE.md; underlag flyttar till sin redan utpekade hemvist (runbook, ADR, research-fil, CONTRIBUTING); de åtta befintliga "varför raden står här"-blocken är medvetna val och RÖRS INTE utan explicit prövning mot i-ögonblicket-kriteriet.
- Governing-listan kompletteras: CONTRIBUTING.md, README.md, DESIGN-SYSTEM-SPEC.md in i FRONTMATTER_GOVERNING_DOCS (frontmatter sätts på dem i samma skiva). schema_reference förblir frusen (banderoll, inte grind). bygg-agent.md ägs av T134-spåret — rörs inte här.
- Hub-skivan: frontmatter + review_by-kadens + grind på hubbens styrande docs. Hubben har NOLL CI-workflows (mätt 2026-08-07) — enforcement-ytan väljs i premiss-passet (hub-CI mintas eller pre-commit-hook). Designvillkor: centraliserings-KOMPATIBELT — universell skriptlogik + per-repo-policy-conf (Lesson #6, T137). Ö8-dubbletterna (fem hub/spoke-dubblerade rader) och hubbens stale updated-fält rättas i samma skiva.
- Frys/återuppliva per dok mot ägar-deklarationens facit: airtable-interaction.md (stämplad mot vårcommit, 28 EF på disk) · hur-systemet-funkar.md-tvillingen (deklarerad synk-ägare med riktning eller kapad) · BYGGPLAN-LÄTTLÄST-v3.md. Aldrig mellanläge.
- Volym-spliten: ADR-085:s form appliceras på tasks/lessons.md (precedent-tillämpning, inget nytt beslut); de två stale-raderna i filhuvudet rättas i samma skiva (A-skivan rör INTE lessons.md).
- Lessons-lagrets utnyttjande-mekanik (obligatorisk befordran + closure-metrik) är EGET spår efter Marcus läst docs/research/lardomslager-branschpraxis-2026-08-07.md — ingår inte här.
- Skiv-sekvensen serialiserar fil-överlapp: drift-rättningar före motsägelse-lösningar före deklarations-utrullning före C-omformningarna (samma filer — parallella redigeringar ger DIRTY-kaskader i kön).

### Testbeslut

Docs-grindarna (check:docs, 13 grindar) bär varje skiva lokalt före push. Frontmatter-grindens befintliga testsvit utökas där listan växer. Hub-grinden får tvåsidig testsvit i deny-/check-familjens form i hubben. C-omformningarna bevisas med diff-granskning mot regeln "handlingsregeln ordagrant bevarad" + lychee på flyttade pekare. Volym-spliten bevisas mot ADR-085:s form + lesson-numrerings-grinden grön. Inga nya semantiska grindar.

### Utanför omfattningen

- Lessons-lagrets utnyttjande-mekanik (eget spår, research-rapporten är substrat).
- Central CI/grind-tjänsten (T137 — kräver egen research, byggs inte nu).
- Hub-CLAUDE.md:s INNEHÅLLS-omformning utöver Ö8 + stale-fält (hubbens konstitution ägs av hub-arbete i egen ordning).
- bygg-agent.md (T134-spåret).
- Omstrukturering av data-model.md:s inre form (dess ägar-deklaration rättas; innehållet ägs av bas-maximerings-spåret).

### Estimat

10 skivor: amenderingen (S) · A-drift (M) · B-motsägelser (M) · ägar-deklarationer (M) · C merge-queue (M) · C ci-parity (S) · hub-standarderna (M) · frys-besluten (S) · volym-spliten (M) · QA (S).

### ADR-koppling

ADR-100 (måttstocken — amenderas öppet i skiva 1). ADR-085 (volymformen — tillämpas). ADR-083 (ingen semantisk grindning — står). ADR-098 (tunna radformen). Lesson #6 (config-driven grind-logik). T137 (centraliserings-visionen — designvillkor, inte leverans).

### Ytterligare anteckningar

Substrat: Explore-kartan (S99, agent-pass 2026-08-07, fil:rad-belagd) + research-passet docs/research/lardomslager-branschpraxis-2026-08-07.md + grillningens fyra kvitterade frågor och rotorsaks-paketet (S99 Del 10). Kartan bär vinnar-facit för Ö-paren och den exakta drift-listan — exekverande agenter får fil:rad-referenserna ur Del 10/kartan, inte ur denna PRD (kartan är källan).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
