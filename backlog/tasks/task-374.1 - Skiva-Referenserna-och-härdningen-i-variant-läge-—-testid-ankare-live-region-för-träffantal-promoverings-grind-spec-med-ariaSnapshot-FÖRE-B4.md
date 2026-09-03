---
id: TASK-374.1
title: >-
  Skiva: Referenserna och härdningen i variant-läge — testid-ankare, live-region
  för träffantal, promoverings-grind-spec med ariaSnapshot FÖRE (B4)
status: To Do
assignee: []
created_date: '2026-09-03 09:20'
updated_date: '2026-09-03 10:28'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-374
ordinal: 676000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: den stämplade B3-formen står kvar bakom DEV-växeln, men härdas formneutralt och får sina regressionsreferenser innan den flippas. En utvecklare öppnar /mer/intresserade?variant=a&data=fyll och ser exakt facit-formen; en skärmläsare hör träffantalet när en sökning görs; grind-specen bär referenserna FÖRE flippen så att flippen (374.2) kan bevisa identitet. Prototyp-railen rörs inte (stående dev-komponent som B2 använder). Täcker användarberättelser: 10, 11, 12, 18, 20
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ytan intresserade-listan i variant-läge (?variant=a, lägena fylld via ?data=fyll och tom) är identisk med facit tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json ytan intresserade-lista — härdningen ändrar inte formen (ariaSnapshot före/efter härdningen identisk, bilagd i Final Summary)
- [x] #2 Ett testid-ankare finns på ytans alla tre render-grenar (laddar, fel, lista) och används av grind-specen
- [x] #3 Träffantalet vid sökning annonseras i en artig live-region; acceptance-sviten hävdar annonseringen
- [x] #4 Ny promoverings-grind-spec efter anmälningssidans mall: ariaSnapshot-referenser tagna FÖRE flippen ur variant-läget i egen commit, båda vyporterna, lägena fylld och tom; grinden tvåsidigt bevisad — grön på identisk yta, RÖD på avsiktligt muterad (bevis i Final Summary)
- [x] #5 Fyllnadsradernas typomvandling (as unknown as Intresserad) borta ur prototypen utan att formen ändras
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 Facit-granskning utförd och bokförd mot tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json ytan intresserade-lista (bild facit-intresserade-lista.png) — formen i bilden slår varje prosa (ADR-102 B1)
- [x] #5 check-facit.sh exit 0 efter skivan — markör-invarianten (c) är global, avregistrering i samma commit som rivning (ADR-102 B3)
- [x] #6 ariaSnapshot-paret grönt i BÅDA vyporterna där skivan rör ytan (ADR-103 B4)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
RUNDA 1 (commit 27a7e2dc, PR #2248): Härdade IntresseradeKonvergens.tsx formneutralt — data-testid="intresserade-yta" på alla tre render-grenar (laddar/fel/lista; lista-grenen fick en ny ren <div>-behållare, ARIA-roll "generic", osynlig i ariaSnapshot), aria-live="polite" aria-atomic="true" på träffräknaren (role="status" undveks medvetet — hade dubbelannonserat och synts som en ny nod i ariaSnapshot; samma teknik som DokumentYta.tsx rad ~3436), samt "as unknown as Intresserad" ersatt med "satisfies Intresserad" + alla PersonSchema-fält i fyllnadsfabriken. Ny promoverings-grind-spec (tests/visual/intresserade-promoverings-grind.spec.ts, FAS 1 av ADR-103 B4): ariaSnapshot-referenser för fylld/tom ur ?variant=a mot mockad get-leads, båda vyportarna. Formneutralitet bevisad: ariaSnapshot av <main> före/efter hela härdningen byte-identisk (diff exit 0, båda dataläger). Tvåsidigt grindbevis: 12/12 grönt på identisk yta, exit 1 båda vyportarna på avsiktlig mutation.

RUNDA 2 (review-utlåtande PR #2248, runda 1, tre fynd — se /private/tmp/claude-501/.../scratchpad/utlatande-pr2248.json):

1. Regex-lås för löst (warning, auto-fix). intresserade-fylld-visual-{desktop,mobile}.aria.yml låste den namnlösa radens "12 dagar sedan" med regexen \d+ dagar sedan, trots att dagarSedanSenaste: 12 i fylldaRader() är en hårdkodad testkonstant utan verklig tidsberoende. Rättat till literalt "12 dagar sedan" i båda filerna. Grinden omkörd: grön på identisk yta (12/12), och RÖD igen (exit 1, båda vyportarna) när dagarSedanSenaste muterades till 13 — diffen pekade exakt på den ändrade siffran. Mutationen återställdes direkt.

2. Felaktig källhänvisning (warning, auto-fix). tests/visual/intresserade-promoverings-grind.spec.ts citerade två gånger "Kortets § Källmärkta premisser" som källa. Den rubriken finns i INGET kort (git grep mot origin/main gav noll träffar i backlog/tasks/*.md) — den stod i orkestrerarens uppdragstext till mig, inte i backloggen. Båda citaten rättade: ersatta med "orkestrerarens uppdrag till TASK-374.1, 2026-09-03" och en öppen redogörelse för felet (varför det stod fel, hur det upptäcktes) i stället för att bara tystas bort — nästa läsare ska se att felet fanns, inte bara att det försvann.

3. AC #3 felställd (måste göras sann, inte omformuleras). AC-texten säger "acceptance-sviten hävdar annonseringen", men i runda 1 låg hela hävdandet i tests/visual/, som inte körs av blockerande CI. Ny fil tests/acceptance/mer-intresserade-konvergens.acceptance.test.ts (Acceptance-klassen, CI-blockerande) navigerar till samma /mer/intresserade?variant=a, mockar get-leads via samma nätverksfixtur som mer-intresserade.acceptance.test.ts, och hävdar exakt samma två saker som grind-specens block: aria-live="polite"+aria-atomic="true" på räknaren (och att role inte är "status"), och att texten uppdateras korrekt vid en sökning. K0-testerna i mer-intresserade.acceptance.test.ts rördes INTE (ny fil valdes explicit för att hålla de två låsen — K0 kontra B3-konvergensen bakom ?variant=a — åtskilda).

DEV-antagandet (premiss för hela AC #3-fixen) verifierades EMPIRISKT innan bygget, inte antaget: "Vitest kör med import.meta.env.DEV=true" i uppdraget var FALSKT (repot har noll Vitest — inget i package.json/package-lock.json, ingen config, ingen binär i node_modules/.bin/, verifierat med grep+find). Den del av premissen som faktiskt bar vikt — att import.meta.env.DEV är sant och ?variant=a renderar i Playwrights acceptance-projekt — höll DÄREMOT: en riktad probe-körning (PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1, --project=acceptance) mot /mer/intresserade?variant=a renderade intresserade-yta-ankaret och räknaren korrekt, INNAN den riktiga testfilen skrevs. Eftersom uppdraget självt pekade ut "samma mönster som tests/acceptance/mer-intresserade.acceptance.test.ts" (ett Playwright-baserat mönster) som förebild, byggdes lösningen med repots FAKTISKA och ENDA testramverk (Playwright, via en riktig route-navigering) i stället för att antingen stanna helt eller införa ett nytt ramverk (Vitest+RTL) på eget bevåg. Detta rapporteras öppet som en avvikelse från uppdragets bokstavliga "Vitest"-ordval, inte som en tyst omtolkning — AC-texten själv rördes inte, den gjordes sann.

Tvåsidigt bevis för den nya acceptance-filen: grön (aria-live/aria-atomic + sökuppdatering verifierade), och RÖD (exit 1) när attributen togs bort från prototypen — felmeddelandet pekade exakt på den saknade aria-live-attributen. Attributen återställda, grönt igen.

Alla grindar omkörda efter runda 2 med identiskt resultat som runda 1 (se PR-kommentar/agent-svar för exitkoder): typecheck 0, biome 0, build 0, check-langa-streck.mjs 0, check-facit.sh 0 (identisk output mot ursprunglig baseline), grind-specen 12/12 (båda vyportar), K0-acceptance 9/9 orörd, ny acceptance-fil 1/1.
<!-- SECTION:FINAL_SUMMARY:END -->
