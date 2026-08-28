---
id: TASK-309.34
title: >-
  CI-täckning för bilagans sidantal och geometri — HÖJDANPASSNINGEN har noll
  testtäckning
status: To Do
assignee: []
created_date: '2026-08-28 02:59'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 605000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FAKTA (källmärkta, verifierade 2026-08-28):

- Höjdanpassningen (`supabase/functions/_shared/mall-render.ts`
  § HÖJDANPASSNINGEN, `raknaSidor()` rad ~313, `SKALTRAPPA = [1, 0.88, 0.8]`
  rad ~300, PR #2028, merge-SHA `a620b3f4`) har NOLL testtäckning i `tests/`
  — `grep -rn "raknaSidor|SKALTRAPPA" tests/` ger noll träffar.
- `DOCRAPTOR_API_KEY` förekommer INTE i `.github/workflows/`
  (`grep -rn DOCRAPTOR_API_KEY .github/workflows/` → inga träffar) — ingen
  CI-grind renderar bilagan i dag.
- Review-agenten flaggade avsaknaden två gånger: PR #2020 och PR #2028
  (läs respektive PR-kropps Riskbedömnings-sektion för exakt ordalydelse).

GÖR — TVÅ SKIVOR:

(i) ENHETSTEST AV TRAPP-LOGIKEN MED STUBBAD RENDERARE. Kräver ingen
    `DOCRAPTOR_API_KEY` — kan byggas nu, av en agent. Testa `raknaSidor()`
    mot syntetiska PDF-byte-strömmar (känt `/Count N`, inklusive
    komprimerade objektströmmar per funktionens egen kommentar) och
    trappans beslutslogik (1 → 0,88 → 0,8, golv som loggar) mot en stubbad
    renderare som returnerar kontrollerat sidantal per anrop. Wira som
    gatekeeper-svit i CI (samma klass som repots ~15 övriga
    gatekeeper-testsviter, `ci.yml`s "Test gatekeeper script suites"-steg).

(ii) RIKTIG RENDER-GRIND MOT DOCRAPTOR. Kräver att Marcus lägger
    `DOCRAPTOR_API_KEY` som GitHub-secret FÖRST — MARCUS-MOMENT, bokförs som
    sådant och blockerar denna skiva tills det är gjort. När nyckeln finns:
    en CI-grind som faktiskt renderar bilagan (DocRaptor test-läge,
    vattenstämplad) och verifierar sidantal/geometri mot förlagan.
    Överväg path-filter (`docs/mallar/bilagor/**` eller
    `supabase/functions/_shared/mall*`) så grinden bara körs vid relevanta
    ändringar — DocRaptor debiterar per dokument, kostnaden ska inte betalas
    av varje PR oavsett innehåll.

AVGRÄNSNING: detta kort bygger INGEN ny render-logik — bara test/CI-täckning
för den logik PR #2028 redan landade.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Enhetstest av raknaSidor()/SKALTRAPPA-trappan med stubbad renderare, ingen DOCRAPTOR_API_KEY krävd, wirad som gatekeeper-svit i CI
- [ ] #2 Riktig DocRaptor-render-grind dokumenterad som Marcus-moment (DOCRAPTOR_API_KEY som GitHub-secret) — bokfört, byggs bara efter att nyckeln finns
- [ ] #3 Render-grinden (när byggd) path-filtrerad mot docs/mallar/bilagor/** och supabase/functions/_shared/mall* av kostnadsskäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
