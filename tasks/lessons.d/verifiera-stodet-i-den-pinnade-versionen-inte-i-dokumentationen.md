# Verifiera stödet i den PINNADE versionen, inte i dokumentationen

**Att ett bibliotek stödjer något säger inget om att *vår* version gör det.
Läs koden vid den SHA vi faktiskt kör.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29, merge queue-aktiveringen):** hela vår
risk-klassning — docs-klassen, D1-klassen, dedupen — vilar på
`tj-actions/changed-files`, SHA-pinnad till v47.0.6. Kortet för merge
queue-aktiveringen nämnde den **inte alls**, trots att en klassning som faller
ut fel i kön hade gjort varje kö-landning antingen otestad eller onödigt dyr.

Kedjan som gjordes, i den ordningen:

1. **Dokumentationen** sade att actionen stödjer `merge_group`. Otillräckligt —
   den beskriver senaste versionen.
2. **PR #1404** visade att stödet mergades 2023-07-24. Bättre, men fortfarande
   ett datum mot ett annat datum.
3. **Koden vid vår exakta pin** avgjorde saken. `src/commitSha.ts`:

   ```js
   } else if (github.context.eventName === 'merge_group') {
     currentSha = github.context.payload.merge_group?.head_sha
   ...
     previousSha = github.context.payload.merge_group?.base_sha
   ```

Steg 3 gav dessutom mer än ett ja: det visade **vilken diff-bas** som används
(`base_sha → head_sha`), vilket är den egenskap som avgör om klassningen blir
rätt. Dokumentationen hade aldrig kunnat ge det svaret.

Beviset höll skarpt: kvällens första kö-körning klassade `Test suite` som
`skipped` för en docs-landning på `merge_group`-ytan.

**Varför datum-resonemanget inte räcker som slutbevis:** "stödet kom tre år före
vår pin" är ett starkt indicium, men det förutsätter att stödet aldrig
regredierat, att vår pin är den tag vi tror, och att funktionen inte flyttats
bakom en flagga. Alla tre antagandena kostar en tool-call att pröva och en
felsökningsrunda att missa.

**Formen:** vid varje beroende som bär en grind — läs den funktion du förlitar
dig på, i koden, vid den ref som står i workflow-filen. `gh api
repos/OWNER/REPO/contents/PATH?ref=<vår-sha>` gör det på ett anrop.

Släkt med [[verifiera-med-cis-exakta-kommando-inte-svagare-lokal-variant]]:
samma disciplin, ett lager längre ut — där gäller det grindens flaggor, här dess
beroenden.
