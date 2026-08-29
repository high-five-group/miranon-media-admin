# Delad staging bär aldrig mer än en olandad EF-version — serialisera EF-PR:er

**[UNIVERSAL] Två bygg-agenter som deployar var sin olandad Edge Function till
den delade stagingen gör varandras (och `main`:s) staging-tester röda i
merge-kön — deployen ur en PR-gren är orkestrerarens steg omedelbart före
armering, inte bygg-agentens.** Mätt 2026-08-29 (S113): `340.1` deployade
`generate-event-attachment` (201→200 vid upprepat Skapa) och `338.2` fem EF:er
(`Gemensam`-svar) till staging före landning; tre köade PR:er körde `main`:s
staging-tester mot dem. Åtgärd: rulla tillbaka staging till `main`:s version,
landa de köade, deploya sedan EN PR-grens EF:er ur en kastbar worktree → kö →
landning → nästa. Bygg-agenten testar mot staging under bygget, men den sista
deployen före kön ägs av den som ser hela kön. Den strukturella fixen är
staging-isolering per PR (`TASK-333`-klassen); tills dess är serialisering
regeln.
