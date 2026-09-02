# Acceptance-tester kan inte köras isolerat med `fil.ts:rad`, delmängden startar ingen dev-server

**[UNIVERSAL] Acceptance-klassens dev-server startas bara av den FULLA
testkörningen, inte av en fil:rad-avgränsad delmängd
(`npx playwright test fil.ts:rad`). Kör man ändå en sådan delmängd mot en
server som aldrig startades, faller testerna med `ERR_CONNECTION_REFUSED`,
vilket kan misstolkas som ett äkta fel i stället för en avsaknad server.**
Mätt 2026-09-02 (S113 resume 9,
`/private/tmp/claude-501/-Users-marcus-Repon-miranon-media-admin/36910b85-3a39-48d5-b59f-5effc4f483d2/scratchpad/lessons-kandidater-resume9.md`
kandidat (u)): en `#2216`-agent fick en felaktig order från orkestreraren
om att köra en fil:rad-delmängd, och repots egen varningstext
"KÖRDES BARA EN DELMÄNGD AV FILEN" är instruktionen för hur resultatet ska
tolkas, inte brus att ignorera. Regel: Acceptance-klassens tester körs alltid
som HELA filen eller hela svit-kommandot, aldrig som en fil:rad-delmängd,
om syftet är att verifiera mot en riktig dev-server. Ett order om en
fil:rad-delmängd mot Acceptance-klassen ska ifrågasättas innan den körs.
