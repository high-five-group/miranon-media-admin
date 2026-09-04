# En review-agent kan inte läsa ett kort som bara finns på PR-grenen via `npm run bl`, läs via `git show <head>:<kortfil>`

`npm run bl` läser backlog-kort mot en isolerad projektrot och ser bara vad
som redan finns på den checkout som körs, vilket gör att ett kort som
mintats på en ännu inte landad PR-gren (och alltså saknas på `origin/main`)
inte kan hämtas med det verktyget av en granskare som arbetar mot
huvudgrenen. Mätt 2026-09-02 (S113 Del 16 forts.,
`tasks/sessions/2026-08-29-session-113.md` rad 1852 till 1854): tre olika
review-agenter stötte på samma problem oberoende av varandra och löste det
var för sig genom att läsa kortfilen direkt ur PR-grenens head med
`git show <head>:<kortfil>`. Regel: en review-agent som behöver läsa ett
kort som hör till PR:en den granskar ska läsa det via `git show
<PR-head-SHA>:<sökväg till kortfilen>`, aldrig via `npm run bl` eller
`backlog task <id>`, eftersom kortet kan sakna motsvarighet på huvudgrenen.
