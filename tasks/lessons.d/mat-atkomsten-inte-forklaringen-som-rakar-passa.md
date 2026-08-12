# Mät åtkomsten, inte förklaringen som råkar passa

**Tre bottnar av samma fälla. (1) Att mäta OMGIVNINGEN — miljövariabler,
konfigkataloger, CI-workflow-filer — är inte att mäta ÅTKOMSTEN; kör
bevis-kommandot innan du deklarerar att en åtkomst saknas. (2) En hängning
är inte ett felmeddelande — ett headless-kommando som blockerar har inte
sagt VARFÖR; kör om med tom eller styrd stdin innan orsaken antas. (3) En
förklaring som PASSAR symptomet är inte verifierad förrän den också
förklarar fallen där symptomet UTEBLEV — annars slutar sökningen vid den
första träffen, inte vid sanningen.** `[UNIVERSAL]`

Mätt/upptäckt 2026-08-12 (S105, TASK-202) i en och samma utredning om
Marcus återkommande fick frågan om åtkomster han redan hade.

## Botten 1 — omgivningen mättes, inte åtkomsten

En "token-utredning" (`tasks/sessions/2026-08-11-session-105.md` Del 4)
mätte `printenv`, `~/.supabase/`, CI-workflow-filer och `.env`-filnamn, och
drog slutsatsen att `SUPABASE_ACCESS_TOKEN` "saknas genuint". Fel: Supabase
CLI hade en giltig nyckelrings-inloggning sedan 2026-03-30 hela tiden.
Supabase egen dokumentation säger rakt ut att kontots token i första hand
lagras i "native credentials storage" — en tom `~/.supabase/access-token`
är bevis för att den ligger RÄTT, inte att den saknas. Bevis-kommandot
(`npx supabase projects list`) svarar direkt och hade avslöjat detta på en
sekund.

## Botten 2 — en hängning är inte ett felmeddelande

`TASK-201.2`:s Implementation Notes bokför ordagrant: *"`supabase link
--project-ref pqtshyierkdgwdnxuirz` (staging) hängde oändligt (interaktivt
login-flöde utan TTY)"* — och drog slutsatsen att CLI:t saknade
autentisering. Fel igen: CLI:t var redan inloggat. Hängningen var prompten
för DATABAS-LÖSENORDET, som `supabase link` ställer och väntar på stdin
för — inte ett login-flöde. Kontrollprovet som såg ut att bekräfta
hypotesen (ett ogiltigt token gav snabbt svar) bekräftade den inte: ett
ogiltigt token får `link` att fela FÖRE lösenordsprompten, ett annat skäl
än det antagna. Regeln: ett headless-kommando som hänger har inte sagt
VARFÖR det hänger — kör om med styrd stdin (`echo "" | kommando`) innan
slutsatsen dras.

## Botten 3 — den viktigaste: en träff är inte samma sak som ett bevis

Samma utredning byggde en tredje förklaring, för `~/Downloads`s
"Operation not permitted": macOS TCC-tabellen visade `com.microsoft.VSCode`
/ `kTCCServiceSystemPolicyDownloadsFolder` = `0` (nekad). Raden PASSADE
symptomet perfekt — nekad behörighet, nekad läsning — och blev skriven ner
som förklaring, med en föreslagen fix (slå på behörigheten i
Systeminställningar).

**Förklaringen var falsk, och den föll på det enda test som spelar roll:**
en tidigare session (S104, 2026-08-10) läste `~/Downloads/<en fil>`
FRAMGÅNGSRIKT — belagt i sessionens eget transkript — med exakt samma
värdapp, samma TCC-rad (oförändrad sedan 2026-01-03, verifierat via
`last_modified`), och samma worktree-isolering. Hade TCC-raden varit den
verksamma mekanismen hade den körningen fallit också. Den gjorde inte det.
Sökningen hade stannat vid den första förklaring som stämde med SYMPTOMETS
NÄRVARO, utan att pröva om den också stämde med symptomets FRÅNVARO — och
byggde till och med en föreslagen åtgärd (Systeminställnings-toggeln) på
den ostämda förklaringen, innan någon kontrollerade om åtgärden faktiskt
skulle lösa något.

Den faktiska boven är, i skrivande stund, fortfarande okänd — den enda
kända ledtråden är en KORRELATION (Claude Code-version 2.1.226 fungerade,
2.1.227 gjorde det inte), uttryckligen inte hävdad som bevisad orsak. Se
`docs/reference/atkomst-och-nycklar.md` § Aktuellt öppet läge för hela
falsifieringskedjan och nästa, billiga mätsteg.

## Det generella

En förklaring som förklarar TRÄFFEN är halvfärdig. Den är inte verifierad
förrän den också förklarar varje känt fall där symptomet borde ha
inträffat men inte gjorde det. Ett kontrollprov som "råkar peka rätt" är
inte heller gratis att lita på — botten 2 ovan visar att ett kontrollprov
kan bekräfta en hypotes av HELT ANNAT skäl än det avsedda (ogiltigt token
felar på ett annat steg än giltigt-men-väntande token, inte för att
hypotesen om saknad autentisering var rätt). Regeln som binder alla tre
bottnar: mät den faktiska frågan (åtkomsten, orsaken till en hängning,
frånvaron av ett symptom) — mät den aldrig genom en proxy som råkar se
rätt ut.
