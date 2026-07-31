# En parser som tyst tappar sitt underlag ser ut som ett fynd

**Ett mätskript som inte redovisar hur mycket av indata det faktiskt kunde läsa
producerar ett trovärdigt tal ur nästan ingenting. Nämnaren är inte en detalj i
utskriften — den är det enda som skiljer en mätning från en gissning med
decimaler.**
`[UNIVERSAL]`

**Empiri (TASK-102, 2026-07-31).** Karens-fönstret skulle härledas ur hur länge
kort faktiskt legat i grindens fällande tillstånd. Första körningen svarade:

```text
kort med commit-historik: 179
MÄTPUNKTER: n=23
```

`n=23` är ett fullt rimligt tal. Fördelningen såg vettig ut, percentilerna gick
att räkna, och talet hade kunnat bäras hela vägen in i en policy-fil.

Det var fel. `git log --name-status` citerar sökvägar med icke-ASCII som default
(`core.quotePath=true`), och repots kortfiler bär å/ä/ö och em-streck i sina
titlar. Den citerade strängen kunde `git cat-file` inte slå upp, så **145 av 179
kort returnerade tom blob**. Efter `-c core.quotePath=false`:

```text
oparsbara: 0
MÄTPUNKTER: n=91
```

Fyra gånger så mycket underlag — och en helt annan fördelning, eftersom just de
kort vars titlar var svenska (alltså de nyare) var de som föll bort.

**Varför felet var osynligt:** skriptet räknade bara det som lyckades. Ett kort
som inte gick att parsa passerade genom en `.filter()` utan att lämna spår.
Utskriften kunde därför inte skilja "23 kort låg i tillståndet" från "23 kort gick
att läsa". Detta är exakt samma felklass som `TASK-90` lagade i själva grinden
— *"0 inkonsistenta" lästes som full täckning* — men den uppträdde här i
MÄTNINGEN som skulle kalibrera samma grind.

**Regeln:** varje mätskript redovisar sin nämnare och sin bortfallsräkning i
samma utskrift som resultatet, och ett bortfall större än noll namnger vad som
föll bort. Raden `oparsbara: 0` är inte utfyllnad — den är det som gör `n=91`
till ett tal man får använda. Ett skript som bara kan säga hur många det hittade
kan aldrig säga hur många det missade.

**Följdregel för git-verktyg specifikt:** `-c core.quotePath=false` hör till
varje `git log`/`git diff` vars utdata ska matas till ett annat kommando. Det är
inte kosmetik — det är skillnaden mellan en sökväg och en escapad sträng.
