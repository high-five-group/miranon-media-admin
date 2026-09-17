# Huvudkatalogen på en docs-gren när agenter spawnas ger medåkande commits i deras PR:er

**Agent-worktrees skapas från orkestrerarens HEAD, inte från `origin/main`.
Står huvudkatalogen på en docs-gren när bygg-agenter spawnas åker den
commiten med som förfader i deras PR:er, och granskaren ser en fil som inte
hör till avsikten.** Mätt 2026-09-17 (S125): sessionsdok-commiten
`bcf0561e` (gren `docs/s125-fodelse`) fanns i fillistan för #2491 och
PR #2492 och fick särskild instruktion till tre granskare; agenten för #2495
valde själv att gren-a från `origin/main` för att undvika det. Regel: flytta
huvudkatalogen tillbaka till `main` så snart en docs-PR är pushad och armerad,
före nästa spawn — eller instruera agenten att basera sin gren på
`origin/main` uttryckligen.
