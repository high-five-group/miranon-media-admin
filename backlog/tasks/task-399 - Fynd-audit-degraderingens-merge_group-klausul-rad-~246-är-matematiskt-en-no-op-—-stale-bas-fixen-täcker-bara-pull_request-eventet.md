---
id: TASK-399
title: >-
  Fynd: audit-degraderingens merge_group-klausul (rad ~246) är matematiskt en
  no-op — stale-bas-fixen täcker bara pull_request-eventet
status: To Do
assignee: []
created_date: '2026-09-04 12:59'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 693000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningsfynd (info, auto-fix) på PR #2316 runda 2, 2026-09-04 (`scripts/audit-ci-med-degradering.sh:246`).

`scripts/audit-ci-med-degradering.sh`s stale-bas-fix (TASK-395) härleder en 'effektiv bas' ur merge-commitens föräldrar för att kompensera att `github.event.pull_request.base.sha`/`merge_group.base_sha` kan vara stale mot vad som faktiskt mergades (mätt run 33869798369, se lessons-fragment i samma stängningsbatch). `pull_request`-grenen (p2 == HEAD_SHA ⇒ effektiv_bas = p1) gör verkligt arbete. `merge_group`-grenen (rad 246: `elif [[ "${p1}" == "${BAS_SHA}" ]]; then effektiv_bas="${p1}"`) kan ALDRIG ge ett annat värde än ${BAS_SHA} — villkoret FÖR att grenen slår till är att p1 redan är identiskt med BAS_SHA, så tilldelningen är matematiskt ett no-op oavsett om grenen matchar eller faller igenom till fallback ('eventets-bas'). Review-agentens egen formulering (PR #2316 runda 2, fynd 3, verifierat genom kodläsning): 'grenen sätter effektiv_bas=p1 ENDAST när p1 redan är identiskt med BAS_SHA ... så effektiv_bas blir bit-för-bit samma värde oavsett om klausulen matchar eller faller igenom till fallback'.

Konsekvens (orkestrerarens fail-closed-analys, ej independent verifierad av review-agenten i runda 2 — bokförs som en del av AC #1 nedan): i en köad merge_group-post med `grouping_strategy: ALLGREEN` och `max_entries_to_merge: 3` (CLAUDE.md § Review-grinden) kan `merge_group.base_sha` vara stale mot den faktiska basen posten mergas mot om lockfile-ändrande poster ligger FÖRE i gruppen. Utan en fungerande stale-bas-fix för merge_group jämförs ${package.json,package-lock.json}-diffen mot fel bas — vid ett nätverksfel (audit-ci klassat som nätverksklass) faller degraderingen fail-closed (exit 1) i stället för att degradera, vilket sparkar posten ur kön och konsumerar armeringen (CLAUDE.md § Landning, fjärde läget).

Källa: PR #2316 Riskbedömnings-sektion runda 2 fynd 3; `scripts/audit-ci-med-degradering.sh` rad 246 (verifierat på gren `ci/audit-eget-jobb-degradering`, PR #2316 ännu ej mergad vid stängningsbatch-tillfället).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mät på en verklig merge_group-körning med minst två poster i gruppen vad merge_group.base_sha faktiskt är relativt kö-merge-commitens första förälder (gh api .../runs/<id> för eventets base_sha + git cat-file commit <head_sha> för merge-commitens föräldrar)
- [ ] #2 Om de skiljer sig: lägg till klausulen HEAD == AUDIT_HEAD_SHA (merge_group.head_sha) och två föräldrar ⇒ effektiv_bas = p1, tvåsidigt testad i scripts/test-audit-degradering.sh (röd/grön-par som bevisar klausulen faktiskt gör skillnad, inte bara syntaktiskt närvarande)
- [ ] #3 Om de är lika: bokför i ci.yml:s kommentar vid raden att klausulen är redundant-men-harmlös (dokumenterar avsikten utan att vara skadlig) och ta bort den för att inte vilseleda framtida läsning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
