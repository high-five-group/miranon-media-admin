---
id: TASK-314
title: >-
  Kontrast-vakter: prefers-contrast-svep för de nio obevakade ytorna (299.10
  steg 10)
status: Done
assignee: []
created_date: '2026-08-24 13:43'
updated_date: '2026-08-24 14:39'
labels:
  - ready-for-agent
dependencies: []
ordinal: 575000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-beslut 2026-08-24 (S112, alternativ a): bygg automatiska prefers-contrast: more-svep för de nio ytor som saknar täckning, så att QA-kortet 299.10:s steg 10 blir mekaniskt belagt (samma väg som steg 9/mobil belades) och skyddet blir permanent. Ytorna (ur 299.10:s stängningsanalys 2026-08-23): /mer/anmalningar · väntelistan · intresserade · maillogg · installera-appen · aktivitetshistoriken · dokumentytan · persondetaljen · Hem/bevakningsraden. FÄRDIG FÖREBILD: tests/visual/dorrlista-promoverings-grind.spec.ts rad ~736–812 (kontrast + reduced-motion + print i samma fil) — följ dess form exakt, återuppfinn inte.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 prefers-contrast: more-svep finns för samtliga nio ytor enligt dörrlistans mönster
- [x] #2 Negativ kontroll: minst ett svep bevisat kunna fälla (riktad mutation, reverterad efter bevis)
- [x] #3 Notes-rad på 299.10 med referens: steg 10 nu mekaniskt belagt — bockning av 299.10 AC #1 görs i separat stängningspass
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGT (S112 fix-våg 1). Nio prefers-contrast: more-svep tillagda i de nio ytornas BEFINTLIGA spec-filer (ingen ny testfil skapad) — se filer/rader i PR-diffen. Formfynd, bokfört öppet: dörrlistans referens (contrast-more:border-border-strong → token-probe mot --mm-border-strong + axe 0) replikerades exakt för de FEM ytor som redan bär motsvarande contrast-more-affordans i sin källkod (anmälningssidan rad 788, aktivitetshistorik rad 903, dokument rad 1277, persondetalj (Sektion, flera rader), bevakningsraden rad 191/251 — token --mm-navcard-border-contrast, som resolvar till samma --mm-border-strong). De FYRA återstående ytorna (väntelista, intresserade, maillogg, installera-appen) SAKNAR helt egen contrast-more-styling i sin källkod (grep -rn "contrast-more" på respektive komponentfil = noll träffar) — deras rader/kort bär en STATISK border (border-text-muted/20 respektive border-border) som redan är synlig i normalläget. För dessa fyra prövar svepet i stället att den befintliga statiska gränsen förblir renderad (solid, bredd > 0) under förstärkt kontrast, plus en NY pixel-baseline (toHaveScreenshot, samma idiom som filens egen ordinarie visuella baslinje) — det är den starkaste generella regressionsvakten när inget känt kontrast-specifikt token finns att peka ut. Samma pixel-baseline lades även till för aktivitetshistorik och dokument (som redan använder toHaveScreenshot i sin ordinarie form) utöver token-proben, i linje med filens egen idiom; de tre ariaSnapshot-mönster-filerna (anmälningssidan, persondetalj, bevakningsraden) fick INGEN ny pixel/ariaSnapshot — bara computed-style + axe, matchar dörrlistans egen kontrast-test som inte heller bär en snapshot av något slag (docblockens § VARFÖR ARIASNAPSHOT OCH INTE PIXLAR: strukturen ändras inte av emuleringen, bara beräknade stilar). Detta scope-val (vilka ytor får screenshot, vilka inte) är min bedömning av "följ förebildens form" tillämpad per fils egen etablerade idiom — bokfört här för granskning, inte tyst.

Lokal körning (PLAYWRIGHT_VISUAL_DEV_SERVER=1, --project=visual-desktop OCH --project=visual-mobile, -g "hög-kontrast-läge"): 11/11 gröna på båda vyportarna (9 nya + 2 opåverkade befintliga referenser: dörrlistan TASK-214.5, åtgärdssidan TASK-171.3). Nya -darwin.png är lokala jämförelsebaslinjer, gitignorerade, aldrig incheckade.

Negativ kontroll (AC #2): riktad mutation — AnmalningarSida.tsx rad 788, contrast-more:border-border-strong tillfälligt borttagen. RÖTT: expect(kant.farg).toBe(strongToken) — Expected "rgb(196, 196, 194)", Received "rgba(0, 0, 0, 0)". Reverterad (git diff --stat bekräftar byte-identisk fil mot före), omkörd: GRÖNT, 1 passed.

Baseline-dispatch: kördes riktat (specfilter täcker exakt de nio filerna, 56 matchande tester) — PR-nummer och run-ID bokförs i slutrapporten till orkestreraren. Baseline-PR #1883 (öppen, orörd) överlappar delvis (aktivitetshistorik-visual + dokument-visual) för filernas ORDINARIE test — min dispatch föder ÄVEN de nio ytornas NYA kontrast-bilder, vilket #1883 inte gör (den kördes innan detta pass).

Done-flipp S112: PR #1911 landad, post-merge 0a93e95f grön (verifierad 2026-08-24).
<!-- SECTION:NOTES:END -->
