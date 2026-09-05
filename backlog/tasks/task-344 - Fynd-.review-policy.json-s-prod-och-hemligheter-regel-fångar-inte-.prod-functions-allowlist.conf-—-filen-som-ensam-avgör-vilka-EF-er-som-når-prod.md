---
id: TASK-344
title: >-
  Fynd: .review-policy.json:s prod-och-hemligheter-regel fångar inte
  .prod-functions-allowlist.conf — filen som ensam avgör vilka EF:er som når
  prod
status: Done
assignee: []
created_date: '2026-08-29 16:34'
updated_date: '2026-09-04 13:30'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 630000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningsfynd (info/ask-user) på PR #2117 runda 2, 2026-08-29.

`.review-policy.json`s regel `prod-och-hemligheter` bär rubriken "Prod-vägar och hemligheter" och prövningstexten "Detta är en kandidat för risk.niva = 'hog'". Dess mönsterlista är:

  .env* · scripts/*prod* · supabase/functions/**/*.ts · *-policy.conf · *-policy.json

Den fångar INTE `.prod-functions-allowlist.conf` — filnamnet bär "allowlist", inte "policy", och filen ligger i repo-roten, inte under `scripts/`. Verifierat: `npm run review:policy -- --pr 2117 --json` gav `"policyRegler": []` för en PR vars ENDA ändrade fil är just den.

Det är ingen bugg i matchningslogiken — `scripts/lib/review-policy.mjs` matchar korrekt vad mönstren faktiskt säger. Det är en namnkonventions-lucka.

VARFÖR DET SPELAR ROLL: `.prod-functions-allowlist.conf` avgör ensam vilka Edge Functions som når prod. Den är precis den filklass regeln finns för. I dag når granskaren rätt slutsats bara om orkestreraren råkar be om det i uppdragstexten — regeln injiceras aldrig automatiskt, oavsett vilken granskare som kör. Instansen som avtäckte luckan (#2117) fick `hog` i runda 1 och `medel` i runda 2, båda på granskarnas egen bedömning, inte på en injicerad regel.

GÖR: (i) avgör om mönsterlistan ska utvidgas — kandidater: `.prod-*`, `*-allowlist.conf`, eller en explicit rad för just denna fil; väg mot att en för bred glob drar in filer regeln inte är skriven för; (ii) svep `.review-policy.json`s samtliga regler mot repo-rotens faktiska filnamn och bokför varje annan fil som borde matcha men inte gör det (samma klass av lucka kan finnas mer än en gång); (iii) landa ändringen med tvåsidigt bevis — en fil som SKA matcha gör det, en som INTE ska fortfarande inte.

Not: `.review-policy.json` läses av `hamta-review-policy.mjs` ur `origin/main` med `git show`, aldrig från disk (ADR-105 beslut 7) — en ändring får alltså effekt först när den landat, inte på grenen som gör den.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mönsterlistan avgjord: utvidgad så att .prod-functions-allowlist.conf matchar, ELLER motiverat orörd med skälet bokfört i .review-policy.json:s egen kommentar
- [x] #2 Svepet i (ii) genomfört: varje repo-rots-fil som borde matcha någon regel men inte gör det är bokförd, åtgärdad eller motiverat orörd
- [x] #3 Tvåsidigt bevis: npm run review:policy mot en PR som rör filen injicerar regeln; en PR som inte ska matcha gör det fortfarande inte
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
scripts/test-review-policy.mjs går 44→46 fall (F3+F4) när PR #2291 landar (2026-09-04, ännu ej mergad vid stängningsbatch-tillfället). CLAUDE.md rad ~907 rättas i S119 stängningsbatch 1; .github/workflows/ci.yml:s gatekeeper-kommentar 'test-review-policy.mjs (44 fall, 173.2)' lämnas medvetet oförändrad — ci.yml är kod-klassad och #2316 rör filen samtidigt; rättas i nästa ci.yml-PR.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixat i PR (gren fix/review-policy-allowlist-glob), draft, ej armerad.

Mönsterlistan i regeln prod-och-hemligheter utvidgad med *-allowlist.conf
(symmetriskt med *-policy.conf/*-policy.json) — .prod-functions-allowlist.conf
matchar nu. kalla utvidgad med scripts/deploy-prod-functions.sh (skriptet
filen faktiskt styr). Dokumenterat som daterad SCOPE-RATTELSE 2026-09-04 i
filens egen _readme, samma konvention som 2026-09-02-posten.

AC #2 (svep repo-rotens filer mot samtliga regler): genomfort manuellt mot
alla *-policy.conf/*-policy.json-filer i roten (ls -la) - .prod-functions-
allowlist.conf var den ENDA luckan, ingen ytterligare hittad.

AC #3 (tvasidigt bevis): tva nya testfall i scripts/test-review-policy.mjs
(F3: .prod-functions-allowlist.conf traffar prod-och-hemligheter mot den
RIKTIGA policyfilen; F4 KONTRAST: README.md traffar fortfarande ingen regel).
Svit: 46 grona, 0 roda (var 44 fore andringen). Dessutom ett fristaende
tvasidigt bevis-skript mot matchaRegler direkt: gamla monsterlistan (utan
*-allowlist.conf) ger INGEN traff, nya listan ger TRAFF.

Live-verifiering: npm run review:policy -- --pr 2285 --json ger fortfarande
policyRegler:[] eftersom skriptet MEDVETET bara laser origin/main (ADR-105
beslut 7, ingen --ref-flagga finns) - regeln far effekt forst nar denna PR
landat. Bevisat i stallet med F3/F4 mot arbetstradets fil.

Ursprung: samma fynd som PR #2117 runda 2 (2026-08-29, detta kort) aterfanns
oberoende pa PR #2285 runda 1 fynd 2 (2026-09-04) - review:policy -- --pr 2285
--json gav policyRegler:[] trots att PR:en oppnar en prod-deploybarhets-gate.
Orkestreraren beslot 2026-09-04 (mandat Marcus, durabelt sessionsdok S119)
att detta befintliga kort ateranvands i stallet for att minta en dublett.

DoD: typecheck/biome/build grona (rort omrade: .review-policy.json,
scripts/test-review-policy.mjs - ingen src/-fil, langa-streck-grinden ej
tillamplig).
<!-- SECTION:FINAL_SUMMARY:END -->
