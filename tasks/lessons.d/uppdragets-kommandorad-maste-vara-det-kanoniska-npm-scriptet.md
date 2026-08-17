# Ett uppdrag anger det kanoniska npm-scriptet, aldrig en handskriven kommandorad — scriptet bär miljökontraktet

**`package.json`-scripten bär miljövariabler som kommandot inte fungerar utan.
Skrivs kommandoraden av för hand in i en uppdragstext följer flaggorna med men
inte miljön, och mottagaren får ett rött utfall som ser ut som ett äkta fel.
Ange scriptnamnet (`npm run <script> -- <extra>`) och låt scriptet äga
miljön.** `[UNIVERSAL]`

Instans (S102, 2026-08-16, mätt kostnad ~1 h): `task-243.1`:s uppdragsrad
saknade `PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1`. Playwrights `webServer` startade
då på fel port, och **åtta identiskt röda körningar** i rad feltolkades som
lastrelaterad flakighet innan roten hittades. Bokfört i sessionsdokets Del 14
med slutsatsen "npm-scripten bär miljökontraktet".

**Det generella:** en kommandorad i prosa är en KOPIA av ett kontrakt som bor
någon annanstans — samma kopierings-drift som repot städat bort ur styrande
dokument. Kopian tappar tyst den del som inte syns i kommandotexten (env,
`pre`/`post`-steg, `--` -vidarebefordran), och den divergensen visar sig som
ett falskt fel hos mottagaren, inte hos skribenten.
