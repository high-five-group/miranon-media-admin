# En hemlighet som anländer i fel kanal kan bara hanteras av MOTTAGAREN — instruktionen om rätt kanal är ingen vakt

**Du kan be om en nyckel via env-fil och ändå få den klistrad i chatten. I det
ögonblicket finns ingen hook att fälla på och ingen kommandorad att maskera:
enda kvarvarande kontrollen är vad mottagaren gör härnäst. Tre led, i ordning
— eka aldrig värdet vidare, flytta det till en gitignorerad env-fil och vidare
via `--env-file` (aldrig som kommandoargument), och registrera rotationen med
en konkret UTLÖSARE, inte med ordet "senare".**
`[UNIVERSAL]`

Instans (S108, 2026-08-23, Del 14 § D): DocRaptor-nyckeln klistrades i chatten
trots env-fil-instruktionen. Hanteringen som valdes: `.env.docraptor`
(gitignorerad via `.env.*`) → `supabase secrets set --env-file` mot staging;
`DOCRAPTOR_API_KEY` uppdaterad 14:23Z och verifierad via `secrets list`-digest
i stället för genom att skriva ut värdet. Prod-secreten kunde bara Marcus
sätta, så kommandot gavs till honom. Exponeringen bokfördes med utlösare:
rotera nyckeln när promoveringen är verifierad i prod, sätt sedan om båda
secrets.

**Det generella:** `--env-file`-formen är inte kosmetik. En hemlighet som
skrivs som kommandoARGUMENT hamnar i skalhistorik, i processlistan och i
agentens transkript — tre nya kopior av precis det som skulle begränsas.
Env-fil-formen skapar noll av dem. Och rotationen behöver en utlösare snarare
än ett datum: "efter att promoveringen är verifierad i prod" är kontrollerbart
och kopplat till ett steg någon faktiskt tar, "senare" är varken. Syskonposten
— en hemlighet som passerat ett API-svar eller ett transkript är
rotationspliktig — säger att vakten måste sitta på kommandot, inte på
uppmärksamheten. Den här instansen är fallet där det inte finns något kommando
att sätta vakten på, och det gör mottagarens rutin till hela försvaret.
