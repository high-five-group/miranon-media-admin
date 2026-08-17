# `!`-prefixet passerar PreToolUse-hookar — mätt två gånger, medan dokumentationen tiger

S102 resume 8 (2026-08-17), miranon-media-admin · Claude Code-harnessets hook-yta

**Frågan som uppstod:** Marcus skulle köra prod-kommandon som
`scripts/deny-prod-ref.sh` (PreToolUse på `Bash`) avsiktligt spärrar för
agenter, och frågade om han kunde använda `!`-prefixet i stället för att byta
till sin egen terminal.

**Vad förstapartsdokumentationen svarar: ingenting.**
`interactive-mode.md` § Shell mode säger att `!` kör kommandon *"directly
without going through Claude"* och att det *"doesn't require Claude to
interpret or approve the command"* — men hooks-dokumentationen nämner aldrig
`!`, och ingen sida säger om shell-läget passerar `PreToolUse`-pipelinen.
"Directly" kan lika gärna betyda *utan Claudes tolkning* (semantik) som *utan
hookar* (struktur). En riktad genomsökning av docs, GitHub-issues och bloggar
gav inget entydigt svar.

**Vad repots egen historik svarar: ja, det passerar. Två instanser.**

1. **S103 Del 15 (2026-08-14), facit-stämpeln.** Marcus klistrade först
   stämplingskommandot som chatt-text — agenten körde det via `Bash` och
   stämpel-hooken fällde på Kanal A (stämplings-skriptet i kommando-position).
   *"Rättades till `!`-prefixet, stämpeln satt i HANS kanal"* — samma kommando,
   samma hook, ingen fällning.
2. **S106, manifest-rättelsen** (`lessons.d/facit-kallor-ompekas-fore-stampeln.md`):
   *"Rättelsen krävde en Marcus-`!`-rad (sed)"* mot ett stämplat manifest —
   exakt formen deny-hookens Kanal B fäller (in-place-redigering mot en
   manifest-sökväg i samma segment som fältnamnet).

Båda hookarna är `PreToolUse` på `Bash`. Ett agent-anrop fälldes, ett
`!`-anrop med samma innehåll gick igenom.

**Regeln:** `!`-prefixet är en fungerande väg förbi PreToolUse-hookar — det är
MÄTT, inte dokumenterat. Behandla det som empiriskt belagt för hookar av den
klassen, aldrig som en garanti harnesset lovat: förstaparten kan ändra det
utan att bryta något dokumenterat kontrakt.

**Praktiskt:** för Marcus egna spärrade kommandon är `!` förstahandsvalet och
kostar ingenting att pröva — fälls det syns hookens svenska skäl omedelbart i
utdatan, och den egna terminalen står kvar som den strukturellt garanterade
vägen (en hook ser bara Claude Codes egna anrop).

**Felklassen att undvika:** jag avfärdade `!`-vägen som *"obelagd"* efter att
ha frågat dokumentationen och fått tyst — och rekommenderade terminalen som
enda väg. Belägget fanns i repots eget sessionsdok hela tiden, en fil jag
redan läst i samma pass. **Att förstaparten tiger är inte samma sak som att
huset saknar mätning.** Sök i egen historik innan ett verktygsfaktum kallas
obelagt.

## Bifynd, mätt i samma andetag: att DOKUMENTERA kommandot fäller hooken

Detta fragment skrevs först via en Bash-heredoc. Den fälldes av stämpel-hooken
— inte för att den skrev något, utan för att brödtexten **citerade**
stämplingskommandot inuti markdown-backticks. Hookens segmenterare delar på
backtick (en kommandosubstitution kör sitt innehåll även inbäddad i en sträng),
så ett citat i prosa blev ett segment vars kommando-position matchade Kanal A.

Det är `TASK-168`-klassens falsk-positiv i en form kortet inte listar: inte ett
argument, inte ett filnamn som råkar sluta likadant, utan **dokumentation av
kommandot**. Vägen förbi är att skriva filen med `Write` i stället för heredoc
— `Write` prövas bara mot manifest-sökvägar, och en lessons-fil är ingen sådan.

Sensmoralen är inte att hooken är fel. § HELLRE FÖR BRETT gäller: en falsk
fällning kostar ett verktygsbyte, en missad förfalskning kostar hela
mekanikens syfte. Men klassen är värd att känna igen, för den träffar
oundvikligen den som skriver ned hur mekaniken fungerar.
