# `dequeuePullRequest` konsumerar armeringen

**GraphQL-mutationen `dequeuePullRequest` tar posten ur kön OCH nollar
`autoMergeRequest` — PR:en ser efteråt ut som en som ALDRIG armerats, inte
som en armerad PR som tillfälligt lämnat kön.** Mätt två gånger 2026-09-04
(orkestreraren tog två köade poster ur kön under npm-advisory-incidenten,
~09:10 och ~10:45, för att inte bränna deras armering på en garanterad
kö-fällning): i båda fallen krävde den dequeuade PR:en ett HELT NYTT `gh pr
merge --auto` för att armeras igen — det gamla armerings-tillståndet gick
inte att återställa, bara skapa på nytt. Komplement till CLAUDE.md § Landning
"det fjärde läget" (`failed_checks`-utsparkning konsumerar armeringen på
samma sätt) — `dequeuePullRequest` är den AVSIKTLIGA vägen till samma
konsumtion, inte bara en ofrivillig bieffekt av en fälld check.
