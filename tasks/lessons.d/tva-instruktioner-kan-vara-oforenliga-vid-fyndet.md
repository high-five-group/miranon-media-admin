# Två rimliga instruktioner kan bli oförenliga i samma stund fyndet görs [UNIVERSAL]

**"Tysta ingenting" och "öppna PR" är båda riktiga var för sig. Tillsammans
tvingar de fram ett regelbrott så snart uppdraget faktiskt hittar något.**

**Empiri (S91, 2026-07-28, `TASK-62`):** en byggagent fick bygga en vakt, med
den uttryckliga skärpningen att den inte fick tysta fällningar på befintliga
filer — de vore ju fyndet. Samma uppdrag sa också "öppna PR".

Vakten fällde 36 tester i 8 filer. Agenten följde **båda** instruktionerna
korrekt, och resultatet blev en avsiktligt röd PR i den delade kön — vilket
`CONTRIBUTING.md` förbjuder rakt ut: *"rött i CI ska betyda EN sak: oväntad
regression."*

Felet var orkestrerarens, inte agentens. Instruktionerna var oförenliga endast i
det tillstånd där uppdraget lyckas — och det tillståndet var det *förväntade*.

**Varför det är lätt att missa:** vid formuleringen läses instruktionerna mot
lyckat-utan-fynd. "Tysta ingenting" känns som en försiktighetsåtgärd för ett
osannolikt fall, inte som en styrning av huvudspåret. Konflikten uppstår först i
utfallsläget, och då är agenten redan igång.

**Motmedlet:** formulera uppdraget mot det utfall där det *lyckas*. Fråga
konkret: om jobbet hittar exakt det vi hoppas — vad ska då hända med
leveransen? Här hade rätt instruktion varit *"hitta fällningarna, rapportera
dem, pusha inte rött"*, alltså att skilja **fyndet** från **landningen**.
