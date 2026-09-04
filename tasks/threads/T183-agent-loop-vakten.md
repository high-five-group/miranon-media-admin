---
owner: marcus803
updated: 2026-09-03
review_by: 2026-11-30
status: stable
lifecycle: paused
---

# T183 — Agent-loop-vakten: bygg-agent-kontraktet saknar stopp-regler mot upprepade identiska fel

> Registrerad på Marcus explicita order (2026-09-02): en bygg-agent gick i en
> meningslös loop under S113 resume 9 (70 verktygsanrop, 43 minuter, sju
> identiska fel i rad) efter en felaktig orkestrerar-order. Detta kort är
> REGISTRERINGEN (durabel bokföring); lösningsdesignen är ett senare
> grillnings-pass. Inga designbeslut är fattade här.

- **Tråd-ID:** `T183-agent-loop-vakten`
- **Tillstånd:** se frontmatter `lifecycle`
- **Källa:** orkestrerarens transkript i sessionen
  `~/.claude/projects/-Users-marcus-Repon-miranon-media-admin/36910b85-3a39-48d5-b59f-5effc4f483d2.jsonl`
  (S113 resume 9, 2026-09-02), samt bygg-agentens egen körning
  (`tasks/a*.output`, JSONL). Sifferfakta nedan är mätta ur agentens rådata
  av orkestreraren, inte en minnesbild.
- **Besläktad:** `T179` (AFK-nattens orkestrerare körde in i kontextväggen,
  `paused`), annan felklass (harnessets kontextgräns snarare än ett
  agent-kontrakt utan stopp-regler), samma familj av ett obevakat, kostsamt
  tillstånd under ett autonomt pass.

## Vad som är mätt

En bygg-agent (PR `#2216`, TASK-239, acceptance-sharding) fick ordern att
köra tre specifika Playwright-tester isolerat med
`npx playwright test <fil>:<rad>`. Ordern var felaktig av två skäl
samtidigt.

1. **Formen startar aldrig acceptance-sviternas dev-server.** Repots egen
   varningstext ("KÖRDES BARA EN DELMÄNGD AV FILEN") beskriver exakt detta,
   men lästes som brus snarare än som instruktion.
2. **En samtidig worktree-borttagning skiftade en port-allokering.** Agenten
   tog bort en gammal, redan landad worktree (`agent-a31e74fac8f16e58a`,
   byte-identisk med origin). `git worktree list`s index skiftade som
   följd, och `devPort('acceptance')` i `tests/support/dev-portar.ts` gick
   från 19399 till 18399, en port som redan var bunden av en annan
   samtidig agent.

Följden: sju identiska `ERR_CONNECTION_REFUSED`-fel mot port 18399, plus
sex dev-server-startförsök, över 70 verktygsanrop och 43 minuter, innan
orkestreraren gav en avbrytorder. Övriga sju bygg-agenter samma dag låg på
5 till 15 minuter och 21 till 57 verktygsanrop.

Marcus fråga, verbatim: *"Hur kommer det sig att agenten fastnar i en
meningslös loop? … det kanske händer jätteofta fast vi inte vet om det."*

## Tre delar till lösningsdesignen (ej beslutade, för grillningen)

1. **Bygg-agent-kontraktet får stopp-regler.** Samma kommando plus samma
   fel tre gånger i rad ska stoppa agenten och trigga en rapport, inte fler
   försök. En verktygs- eller repo-varning om körsätt ska räknas som
   instruktion, inte som brus.
2. **Ett mätskript över agent-transkripten** (`tasks/a*.output`:
   varaktighet, antal `tool_use`, upprepade identiska fel) skulle svara på
   Marcus fråga "hur ofta händer detta". Heartbeat-svepet kan potentiellt
   larma på en agent som kör längre än X minuter eller upprepar samma fel
   Y gånger.
3. **En orkestrerar-lesson:** verifiera kommandot innan en agent beordras
   köra det (ADR-086 gäller i båda riktningarna, inte bara agentens egna
   premiss-pass mot uppdraget).

Klassning (ADR-053): blockerar inte nuvarande arbete, men värdefullt. Defer
till detta register.

## Instansdata S114 2026-09-03

Marcus flaggade explicit att review-loopens tidsåtgång hör till
arbetssätts-frågan denna tråd bär, mitt i TASK-374-promoveringen:
*"Fan vilken tid det tar för en sådan enkel promovering eller?"* →
orkestreraren föreslog hopvikning av tre skivor i en landning; Marcus:
*"Okej kör på. Jag tror vi har reggat kort eller trådar på vårt
'arbetssätt', så vi har planerat att kolla på hur vi jobbar för att
kunna effektivisera."* Mätt tidtabell för en fristående skiva
(`374.1`, sessionsdok S114 Del 6): bygge 30 min · review runda 1
13 min · fix 13 min · review runda 2 5 min · kö 14 min · post-merge
11 min ≈ **1 h 25 min per skiva**. Hopvikningen av tre skivor i en
landning (`374.2`+`374.3`+`374.4`, anmälningssidans precedent)
sparade uppskattningsvis cirka 1 timme mot att landa dem var för sig.
Jämförelsepunkt: ADR-103 B5:s egen mätning låg på 150 min/skiva.

Detta är instansdata till frågan "hur ofta/hur mycket tar
review-loopen", inte en lösningsdesign — samma status som resten av
kortet.

## Nästa steg

Bärare: obestämd. Grillas som eget pass (Marcus-order 2026-09-02). Inget av
delarna ovan är beslutat.
