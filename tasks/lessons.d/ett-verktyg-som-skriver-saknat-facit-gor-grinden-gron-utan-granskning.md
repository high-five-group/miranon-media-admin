# Ett verktyg som SKRIVER saknat facit gör grinden grön utan att någon granskat innehållet

**Snapshot-verktyg "löser" ett saknat facit genom att skapa det ur den
aktuella körningen. Nästa körning är då grön — men det som stämplades var
vad koden RÅKADE producera, inte vad någon godkänt. Ett facit som föds ur
ett träd där koden just ändrats stämplar ändringen åt granskaren, osedd.
Committa aldrig ett auto-genererat facit i samma pass som du ändrat koden
det beskriver.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, `TASK-309.16` / commit `d9d973d5`): när
promoverings-grindens fem saknade mobil-snapshots avtäcktes hade Playwright
redan **skrivit filerna** vid körningen (*"…writing actual"*). De togs
medvetet **bort igen** i stället för att committas, av två skäl som båda
bär: ett facit stämplas av Marcus (`ADR-102`/`ADR-104`), och dessa
genererades ur ett träd där koden i samma pass fått tre fixar
(`items-center`, avslutande separator, `SidRam`-sidkromet). Att checka in
dem hade gjort den ändrade mobila ytan till gällande form utan att någon
sett den. Bokfört som eget kort i stället, med generering och granskning
lagd i samma pass som den kommande visuella baslinjen.

**Det generella:** ett facit har två funktioner som drar åt olika håll —
det är en REGRESSIONSDETEKTOR (billig, mekanisk) och en GODKÄND FORM (dyr,
mänsklig). Auto-generering levererar den första gratis och förfalskar tyst
den andra. Felmoden är särskilt lömsk eftersom verktyget rapporterar den som
en åtgärd, inte som en fråga: rött blir grönt utan att någon fattat ett
beslut. Regeln som håller är att skilja de två ögonblicken i tiden — en
körning som ÄNDRAR kod får aldrig också vara den som FÖDER facitet. Kör
generering i ett eget pass, mot ett träd vars kod redan är godkänd, och låt
en människa se resultatet innan det blir sanning.
