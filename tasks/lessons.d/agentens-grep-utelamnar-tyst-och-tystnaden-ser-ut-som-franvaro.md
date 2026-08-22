# Agentens `grep` utelämnar filer tyst — och tystnaden ser ut som frånvaro

**[UNIVERSAL] `grep` i Claude Code:s skal är inte systemets `grep`. Det är en
skalfunktion som kör `ugrep` med `-I` (hoppa över binärfiler) och
`--ignore-files` (respektera ignore-listor). Båda flaggorna får en fil att
försvinna UTAN meddelande: sökningen returnerar tomt och exit 1 — samma utfall
som när strängen genuint inte finns. Ett noll-resultat ur en agents `grep` är
därför aldrig ett bevis för frånvaro.**

Differentialmätning (2026-08-22, `ugrep 7.8.4`, macOS; fixtur: en `.tsx` med en
rå `0x00` mitt i en sträng, och en `.txt` som en `.gitignore` bredvid pekar ut):

| Anrop | NUL-filen | Ignore-listad fil |
|---|---|---|
| skalets `grep -rn` | inget utdata, exit 1 | inget utdata, exit 1 |
| skalets `grep -c` | **tom rad**, exit 1 | — |
| `/usr/bin/grep -rn` | `Binary file … matches`, exit 0 | träffrad, exit 0 |

Systemets `grep` SÄGER att filen är binär. Agentens säger ingenting alls.
Skillnaden är hela felet: den ena tystnaden är en observation, den andra är en
utelämnad fil.

**Instansen som avtäckte det** (`TASK-283.2`/`283.3`, 2026-08-22):
`PersonsList.tsx` fick en rå NUL-byte som fogtecken i en filternyckel, där
kommentaren två rader ovanför föreskriver ett mellanslag. Koden fungerade — NUL
är en giltig separator i en strängnyckel — och typecheck, lint, bygg och
sviterna var gröna. Men `file` klassade filen som `data`, `grep -c 'useMemo'`
gav tomt, och varje repo-bred `grep -rn` hoppade över den. `283.2`:s agent såg
symptomet och bokförde det som verktygsartefakt; `283.3`:s agent rotorsakade det
(`dedc5b51`). Efter fixen: `Java source, Unicode text, UTF-8 text`, och samma
`grep -c` ger 7.

**Två regler ur detta:**

1. **Beter sig ett verktyg avvikande mot EN indata medan det fungerar överallt
   annars, är avvikelsen en egenskap hos indatan.** "Verktygsartefakt" är en
   klassning som kräver belägg. Utan belägg är den en omväg runt ett fynd, och
   omvägen ärvs av nästa läsare som en källmärkt premiss.
2. **Ingen testnivå fångar en byte-form-defekt.** Felet låg i filens bytes, inte
   i dess semantik. Det som kan fånga det är `file`, en `git diff --stat` som
   visar `Bin`, eller en räkning av lästa filer. En inventering som vilar på
   `grep -rn` bör kunna svara på hur många filer som faktiskt lästes — annars
   mäter den sin egen filtrering.

Släkt: `ett-tyst-verktyg-ser-likadant-ut-som-ett-verktyg-utan-fynd.md` — där ett
övervakningsverktyg vars noll var tvetydigt, här ett sökverktyg vars noll var
falskt. Samma rot: frånvaro rapporterad av ett verktyg måste kunna skiljas från
trasig rapportering.
