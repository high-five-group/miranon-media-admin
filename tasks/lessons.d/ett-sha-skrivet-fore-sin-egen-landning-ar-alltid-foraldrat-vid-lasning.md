# Ett SHA skrivet före sin egen landning är alltid föråldrat vid läsning

[UNIVERSAL]

## Vad som hände

Paus-blocket i ett sessionsdok bär raden *"Spoke `main` @ `<SHA>`"* som
tillståndsuppgift. Vid nästa resume stämmer den aldrig — blocket skrivs,
commit:as, PR:as och mergas, och **mergen ändrar HEAD efter att raden skrevs**.

Vid sextonde pausen stod `43b601b`; vid läsning var HEAD `e04be38`, alltså
mergen av paus-dokets egen PR. Det är **sjätte förekomsten** av exakt samma
mönster i samma session (femte bokfördes i Del 24.1). Varje gång har den
rapporterats som divergens, utretts, och avfärdats som ofarlig — och varje gång
har nästa paus skrivit raden på nytt.

## Varför det inte går att städa bort

De fem föregående förekomsterna behandlades som slarv: *skriv rätt SHA nästa
gång.* Men raden kan inte skrivas rätt. Den beskriver ett tillstånd som
**garanterat ändras av den handling som publicerar raden**. En text kan inte
citera SHA:t på den commit som ännu inte finns när texten skrivs.

Det gör detta till en formfråga, inte en noggrannhetsfråga. En rättelse är ingen
lösning när felet är inbyggt i formen.

## Regeln

**Skriv aldrig ett värde som den egna landningen kommer att ändra.** Antingen:

- utelämna det (`git log -1` svarar bättre än en fryst rad), eller
- skriv det med sin egen horisont utsatt: *"föräldern till denna pausens egen
  merge"* — då är raden sann vid läsning i stället för falsk.

## Generaliseringen

Klassen är bredare än SHA:n: **varje tillståndsyta som skrivs före sin egen
publicering bär samma fel.** Räkningar av öppna PR:er, "noll öppna ärenden",
pool-storlekar — allt som ändras av landningen som publicerar påståendet.

Testet är en fråga: *ändrar handlingen som publicerar denna text något som
texten påstår?* Är svaret ja ska värdet peka, inte kopieras.

Relaterat: [[strukturell-kontroll-kan-vara-gron-medan-lasningen-ser-felet]] —
båda handlar om påståenden vars sanning ingen mekanism prövar.
