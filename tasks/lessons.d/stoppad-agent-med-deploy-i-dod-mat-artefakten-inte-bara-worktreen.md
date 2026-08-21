# En stoppad agent med deploy i sin DoD har kanske redan lämnat spår utanför git — mät artefakten, inte bara worktreen

**När en bygg-agent vars kort bär "deploy till staging" stoppas mitt i, är
`git status` i dess worktree ett OFULLSTÄNDIGT bokslut. Deployen lämnar inget
spår i git. Följ varje stopp med en artefakt-mätning (`supabase functions
list`, motsvarande för andra mål) och återställ pariteten mot `main` om
artefakten hunnit före.** `[UNIVERSAL]`

Instans (S109, 2026-08-21): `TASK-283.1`-agenten stoppades när Marcus valde
väg B för personlistan, vilket gjorde EF-bokstavsfiltret onödigt. Worktreen
visade sju okommittade filer, ingen gren, ingen PR — "inget förlorat, inget
läckt". Men `functions list` mot staging visade `get-persons` **v27,
uppdaterad 10:02:47Z**, fem minuter före stoppet: agenten hade deployat kod
som aldrig nådde `main`. `main`:s version deployades om (v28, 10:07:51Z) och
pariteten var tillbaka inom fem minuter — staging-CI hade annars kört mot en
EF ingen review sett.

**Det generella:** samma klass som `CLAUDE.md` § Prod-EF-deploy ("en driftkarta
härledd ur git är en HYPOTES om prod, aldrig en mätning") — men riktad mot
STOPP-ögonblicket, där frestelsen att nöja sig med `git status` är störst
eftersom stoppet känns som att inget hann hända. Varje sidoeffekt som inte bor
i git måste ha sin egen mätning i stopp-rutinen; annars är "agenten hann inte"
ett antagande med samma felklass som "EF:en är aldrig deployad".
