---
id: TASK-161.4
title: 'Skiva: ägar-deklarationer + governing-listans komplettering'
status: Done
assignee: []
created_date: '2026-08-07 19:05'
updated_date: '2026-08-08 08:39'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.1
  - TASK-161.3
parent_task_id: TASK-161
ordinal: 294000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: governing-listan skiljer källor från kartor, varje styrande dok deklarerar sitt ägarskap, och tre styrande-i-praktiken-filer bär nu samma kadensgrind som de fjorton. Täcker användarberättelser: 4, 7 delvis.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Varje dok i FRONTMATTER_GOVERNING_DOCS bär ägar-deklarationen per amenderingens form (161.1); data-model.md:s fyra spridda auktoritets-anspråk konsolideras till EN deklaration (innehållet i övrigt orört — bas-maximerings-spårets yta)
- [x] #2 Governing-listan kompletterad: CONTRIBUTING.md + README.md + DESIGN-SYSTEM-SPEC.md in i .frontmatter-policy.conf med frontmatter satt (updated == git-datum, review_by framåt); frontmatter-grindens testsvit utökad för nya poster; schema_reference får INTE grind (frusen, banderoll)
- [x] #3 Docs-grindarna gröna lokalt (inkl. check-frontmatter mot utökade listan); PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ägar-deklarationsraden (Äger/Kartlägger/Vid konflikt vinner, ADR-100 §
Updates 2026-08-08) installerad på samtliga 17 poster i
FRONTMATTER_GOVERNING_DOCS — de 14 befintliga + CONTRIBUTING.md, README.md,
docs/specs/DESIGN-SYSTEM-SPEC.md (nya, med YAML-frontmatter tillagd:
owner marcus803, updated 2026-08-08, review_by 2027-02-08, status stable).

data-model.md (AC1): fyra spridda auktoritets-anspråk (Primär-version-
callouten "Detta är källsanningen...", rad 30 "AUKTORITATIV", rad 34
"Sanningskälla:"-bullet, rad 35 "primär källa för fält-IDs") konsoliderade
till EN deklaration i callouten; de tre andra pekar nu dit i stället för
att självständigt hävda auktoritet. Sakinnehåll orört (bas-maximerings-
spårets yta) — endast öppningsstyckets auktoritetsspråk ändrat.

Ö10 STÄNGD: governing-listan skiljer nu mekaniskt kartor (t.ex.
segment-arkitektur.md "Äger: Inget eget sak-beslut", systemet.md "Äger:
Inget – ren karta") från källor (t.ex. data-model.md, airtable-
constraints.md) via den tredelade raden.

Ö11 STÄNGD SOM DESIGNAT — bokfört explicit så residualen inte ser tappad
ut: schema_reference.md lades AVSIKTLIGT INTE till FRONTMATTER_GOVERNING_
DOCS. Filen bär redan alla tre ADR-100 §4-frys-element (verifierad av
#978/161.3) och förblir frusen-med-banderoll, ej grindad — kortets egen
bokstav ("schema_reference får INTE grind"). Ö11:s "residual" var alltid
att BEKRÄFTA detta val, inte att åtgärda en lucka.

MD028 (blank line inside blockquote) fälldes av markdownlint på 5 filer
där den nya deklarationsraden hamnade direkt intill en befintlig
blockquote-paragraf (segment-arkitektur.md, systemet.md, KVALITETSDEFINI-
TIONER-11-REACT.md, README.md, tasks/lessons.md) — fixat genom att slå
ihop till EN blockquote (bar '>'-rad i stället för tom rad), ingen
sakändring.

`updated:`-fält manuellt bumpat till 2026-08-08 på de 6 filer vars fält
låg kvar på ett äldre datum (BYGGPLAN-LÄTTLÄST-v3.md, KVALITETSDEFINI-
TIONER-11-REACT.md, SECURITY-SPEC.md, airtable-constraints.md,
systemet.md, segment-arkitektur.md) — gjort explicit i stället för att
förlita mig på pre-commit-hookens auto-bump, per worktree-hooksPath-
caveatet i CLAUDE.md § Worktree-isoleringens gräns.

ci.yml:573-578-kommentaren (TASK-161.2-räkningen "14 styrande docs")
synkad till "17" + TASK-161.4-attribution. CLAUDE.md:85:s "14
dokumentations-grindar" är EN ANNAN räkning (check-docs.sh:s egna
run_gate-antal, inte FRONTMATTER_GOVERNING_DOCS-listans längd) —
verifierad via git blame mot TASK-161.2:s commit 10dea967, som
räknade om BÅDA talen samma dag av ren tidsmässig slump (båda var 14 då).
Ingen ändring där: growing 14→17 lägger inte till en ny grind, bara fler
poster i en befintlig grinds indata.

Frontmatter-testsviten (scripts/test-check-frontmatter.sh) utökad
TVÅSIDIGT: write_all_valid() bär nu alla 17; T1/T12 uppdaterade till "alla
17"; NY T14 bevisar att de tre NYA posterna valideras oberoende (tre
samtidiga, distinkta fel — Check 1 på CONTRIBUTING.md, Check 4 på
README.md, Check 3 på DESIGN-SYSTEM-SPEC.md — i EN körning). 15/15 PASS
lokalt.

Grindar körda och gröna: check:docs 14/14 (EXIT=0), check-frontmatter.sh
mot skarpa repot (17/17, EXIT=0), test-check-frontmatter.sh (15/15 PASS,
EXIT=0), actionlint -ignore-flaggan (EXIT=0, ci.yml-kommentar rörd),
shellcheck -x på .frontmatter-policy.conf + de två check-frontmatter-
skripten (EXIT=0), yamllint på ci.yml (EXIT=0), typecheck (EXIT=0), biome
check (EXIT=0, endast pre-existerande varningar i orörd kod), build
(EXIT=0), test:api (465 passed, EXIT=0).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 3 (2026-08-08): PR #982 mergad 720e8801, per-jobb-grön (gh pr checks: 0 fail/pending). Governing-listan 14→17 (CONTRIBUTING, README, DESIGN-SYSTEM-SPEC med ny frontmatter + grind); ägar-deklarationen (ADR-100-formen) installerad på samtliga 17; data-model.md:s FYRA faktiska kvarvarande auktoritets-anspråk konsoliderade till EN deklaration — agenten upptäckte att kartans Ö9-rader redan omformats av 161.3 och identifierade de verkliga anspråken mot dagens disk i stället för den frusna kartan. Ö10 STÄNGD (deklarationens Äger-fält skiljer mekaniskt kartor från källor) · Ö11 STÄNGD SOM DESIGNAT (schema_reference avsiktligt UTAN grind, frusen med banderoll — bokfört explicit). Testsviten tvåsidigt utökad: T14 bevisar tre samtidiga distinkta fel i de tre nya posterna; 15/15 PASS. ci.yml-kommentaren synkad 14→17; CLAUDE.md:85:s '14' verifierad vara ANNAN räkning (git blame) och korrekt orörd. Fullt DoD grönt inkl. test:api 465/465. Lesson-kandidat bokförd: Read med bar absolut-path läste delade checkouten i stället för agent-worktreen — fångad före edit.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
