---
id: TASK-299.8
title: 'Skiva: Promovering av sidram + initialcirkel till intresserade'
status: Done
assignee: []
created_date: '2026-08-22 19:32'
updated_date: '2026-08-23 13:22'
labels:
  - ready-for-agent
dependencies:
  - TASK-299.1
parent_task_id: TASK-299
ordinal: 548000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Intresserade får husets sidram och initialcirkeln, på samma villkor som väntelistan. RADINNEHÅLLET RÖRS INTE (Marcus beslut 2026-08-22, alternativ B). Sidan har i dag en acceptance-skarv men ingen visuell; den får en när den landar. Täcker användarberättelser: 11, 12, 13, 18, 21.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Intresserade bär den delade sidramen; den gamla textlänken och den dubblerade sidmarginalen är borta
- [x] #2 Varje rad bär initialcirkeln ur personens namn, med primitiv-komponenten — ingen ny inline-kopia
- [x] #3 Radens fält och deras inbördes ordning är OFÖRÄNDRADE
- [x] #4 Sidan har en visuell spec med baslinje för desktop och mobil
- [x] #5 Befintliga acceptance-skarven utvidgad, inte omskriven
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BEROENDE OMSATT 2026-08-22: TASK-299.5 → TASK-299.1.

Marcus order i klartext: "Bygg det globalt bara med sidkromet." Det ursprungliga beroendet på 299.5 antog att sidramens form måste vinnas på anmälningssidan innan den kan promoveras till systersidorna. Det antagandet håller inte längre:

- Kant-i-kant är avgjort i S111:s grillning, inte i konvergenspasset.
- SidRam- och InitialAvatar-primitiverna LANDADE i TASK-299.1 (merge-SHA 24238b1c) och finns att importera i dag.
- Omfattningen är låst av Marcus 2026-08-22: full omfattning på ytaxeln, bara sidkromet på ägandeskapsaxeln. Se TASK-299 § OMFATTNINGEN LÅST.

Vad denna skiva faktiskt behöver är alltså primitiverna, inte anmälningssidans LISTA. Beroendet pekar nu på det som verkligen krävs. TASK-299.5 förblir låst bakom 299.4 (Marcus konvergensgranskning) — den kedjan rörs inte.

MARCUS UNDANTAGSREGEL, samma beslut: "Ser vi något som inte funkar sedan så är det ju bara att göra ett undantag på den sidan, men jag tror det är helt lungt." Ett lokalt avsteg på en enskild sida är alltså tillåtet och ska INTE läsas som att den delade formen ska rivas. Stöter du på en yta där sidkromet inte fungerar: bygg undantaget lokalt, bokför skälet, riv inte formen.

BYGGT (TASK-299.8, 2026-08-23). src/components/intresserade/Intresserade.tsx: gamla textlanken + p-4 ersatta med SidRam (chevron ensam, to="/mer") - monstret kopierat verbatim ur DokumentYta.tsx (samma mal, samma etikett "Tillbaka till Mer"). Varje rad bar nu InitialAvatar (husets primitiv). Radens tre Field-par ar ordagrant oforandrade (AC #3) - bara chrome+avatar ar nya. Rubriken (h1) lever kvar i sidan, ej i SidRams rubrik-gren (OMFATTNINGEN LAST punkt 2). Tre varv titta-och-iterera kort mot dev-fixturvarlden (Playwright, hermetisk) vid 375/390/768/1280 px + tomt/fel-lage - inga CSS-fixar kravdes efter forsta varvet.

AC #4 (visuell spec): tests/visual/intresserade.spec.ts tillagd, samma form som personer.spec.ts/mer-anmalningar.spec.ts (network.use-overskuggad get-leads, toHaveScreenshot). INGEN baseline-PNG incheckad - CONTRIBUTING.md § Visuell regression: "Baselines fods i CI, aldrig lokalt", endast -linux-bilder checkas in och jag kor macOS/darwin. Samma monster som notis-visual.spec.ts/chunk-banner-visual.spec.ts (TASK-285.9): spec-filen finns, baslinjen fods via visual-baselines.yml (specfilter=intresserade) i ett separat, granskat steg. Lokalt genererade -darwin.png anvandes bara for min egen granskning och ar RADERADE fore commit (verifierat: git status visar bara de tre avsedda filerna).

DIVERGENS UPPTACKT OCH ATGARDAD: min worktree grenade fran 3a838454 (bar redan f11410b3, dependency-omsattningen - kortets Dependencies: TASK-299.1 var alltsa korrekt hela tiden i min worktree). Orkestrerarens forvarning om kortfils-konflikt (299.7:s DIRTY-incident) TRAFFADE INTE mig - git log HEAD..origin/main -- "backlog/tasks/task-299.8*" gav noll traffar. Jag fast-forwardade anda (git merge --ff-only origin/main, till 492a38ce) innan push, eftersom origin hade dragit ifran 11 commits under bygget. Ingen konflikt uppstod (mina tre rorda filer overlappar inte med FF-diffen). Sidoeffekt av FF: npm run test:api gick forst 3 fel -> 0 fel efter FF. De tre felen (pdfBase64 undefined i generate-event-attachment/preview-receipt staging-tester) berodde pa TASK-302.2 (parallell agent, delad staging-EF redan omlagd till {url, utgar} innan dess egen PR landat i min worktrees ursprungliga bas) - EJ en regression i denna skiva. Kallor: git log --oneline, worktree-listan (agent-a3d7f73f60e861e14 pa feat/task-302-2-skarpa-preview-ef), kortet TASK-302.2. FF till 492a38ce (som bar TASK-302.2 merge, PR #1838) loste det helt - 1037/1037 grona om.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1845, landad i main. Intresserade bär den delade sidramen och initialcirkeln; px-4 ersätter det tidigare mx-4-mönstret. Radens fält och ordning oförändrade.

DoD #3 bockad av orkestreraren (ADR-096, se 299.7). Verifierat via landningen.

Agenten prövade orkestrerarens varning om kortfils-konflikt och fann den icke-tillämplig för just detta kort — git log HEAD..origin/main mot kortfilen gav noll träffar. Den fast-forwardade ändå, vilket också löste tre röda api-tester som berodde på en parallell sessions redan deployade staging-EF.
<!-- SECTION:FINAL_SUMMARY:END -->
