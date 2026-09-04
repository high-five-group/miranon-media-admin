---
id: TASK-309.34
title: >-
  CI-täckning för bilagans sidantal och geometri — HÖJDANPASSNINGEN har noll
  testtäckning
status: To Do
assignee: []
created_date: '2026-08-28 02:59'
updated_date: '2026-08-28 04:44'
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
- RÄTTELSE (2026-08-28, review-runda 1 på PR #2036, ADR-086): kortets
  ursprungliga FAKTA-lista påstod "Review-agenten flaggade avsaknaden två
  gånger: PR #2020 och PR #2028". Det var FALSKT — påståendet kom obelagt ur
  uppdragshandoffen och prövades aldrig innan det skrevs. Verifierat:
  `gh pr view 2020 --json body,reviews,comments` och samma för 2028 ger
  `comments: []`, `reviews: []`, och ingen av kropparna innehåller strängen
  "review-grinden" eller "Riskbedömning"
  (`gh pr view 2020 --json body --jq '.body | test("review-grinden")'` →
  `false`; samma för 2028). Den enda dokumenterade granskningen kopplad till
  #2020 (citerad i #2024:s kropp) gällde sid-padding/mätmetod, inte
  testtäckning — och SKALTRAPPA/raknaSidor fanns inte ens vid tidpunkten för
  #2020 (den funktionen landade först i #2028). Testtäckningsluckan är
  alltså mätt av en agent (grep-resultaten ovan), inte flaggad av
  review-grinden.

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
- [x] #1 Enhetstest av raknaSidor()/SKALTRAPPA-trappan med stubbad renderare, ingen DOCRAPTOR_API_KEY krävd, wirad som gatekeeper-svit i CI
- [ ] #2 Riktig DocRaptor-render-grind dokumenterad som Marcus-moment (DOCRAPTOR_API_KEY som GitHub-secret) — bokfört, byggs bara efter att nyckeln finns
- [ ] #3 Render-grinden (när byggd) path-filtrerad mot docs/mallar/bilagor/** och supabase/functions/_shared/mall* av kostnadsskäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KÄLL-ATTRIBUTIONEN RÄTTAD 2026-08-28 (review-runda 1 på PR #2036, ADR-086).

Ursprunglig FAKTA-rad påstod "Review-agenten flaggade avsaknaden två gånger:
PR #2020 och PR #2028" — obelagt påstående ur uppdragshandoffen, aldrig
prövat innan det skrevs i kortet. Granskaren i review-runda 1 falsifierade
det och orkestreraren beordrade rättelse. Egen verifiering, körd innan
denna redigering:

- `gh pr view 2020 --json body,reviews,comments` → `reviews: []`,
  `comments: []`
- `gh pr view 2028 --json body,reviews,comments` → `reviews: []`,
  `comments: []`
- `gh pr view 2020 --json body --jq '.body | test("review-grinden")'` →
  `false`
- `gh pr view 2028 --json body --jq '.body | test("review-grinden")'` →
  `false`
- Ingen av kropparna innehåller "Riskbedömning" heller (grep, tomt resultat
  båda gångerna).

Slutsats: ingen Riskbedömnings-sektion existerar i #2020 eller #2028 —
review-grinden granskade aldrig dessa PR:er. Sakbehovet (testtäckningsluckan)
kvarstår oförändrat, källmärkt direkt via grep i stället för via ett
obelagt review-påstående.

AC #1 bockad 2026-08-28 K-sista S108. Levererat i PR #2054 (i kön — INTE MERGED när denna kortbokföring kördes, gh pr view 2054: state OPEN, mergeStateStatus CLEAN, autoMergeRequest null) som api-pure-test tests/api/hojdanpassning.test.ts (25 fall) — INTE gatekeeper-svit-formen AC:t nämner: fel yta för EF-kod, samma val som TASK-309.22 (review-runda 1 på #2054, acProvning #1 felställd). AC #2/#3 = skiva (ii), kräver DOCRAPTOR_API_KEY som GitHub-secret (Marcus).

RÄTTELSE (samma pass, PR #2054 MERGED strax därefter): b370e6cb6cb0948c931a42cb919524878ea57a0f, mergedAt 2026-08-28T04:42:59Z — verifierat via gh pr view. Var OPEN vid den ursprungliga kortbokföringsraden ovan (skrevs 'i kön' per instruktion); origin/main rörde sig under passet.
<!-- SECTION:NOTES:END -->
