# Grundorsaken till DET SOM FÖLL löses nu — en lapp med en anteckning om den riktiga fixen är fortfarande en lapp

**När symptomet är åtgärdat men grundorsaken bakom samma fällning står kvar,
är "eget kort" inte scope-disciplin utan uppskjuten lathet med kvitto. Gränsen
som räddar regeln från att bli gränslös: det som ska lösas NU är roten till
det som just föll. Defekter som aldrig var en del av samma fel registreras —
det är en annan sak, och den är legitim.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 18 § C): prod-deployen föll på en ostyrd
CLI-version. Första PR:en (`#1900`) bytte det fällande anropsstället till
`npx supabase` och bokförde den kvarstående svagheten — att `npx supabase`
inte heller är versionspinnad — som "eget kort". Marcus fällde det:
*"Varför löser vi inte svagheter och brister? Du vet ju att vi håller
branschledarstandard."* Klassen stängdes i stället i samma pass (`#1915`:
policyfil, resolver, samtliga sju anropsställen), medan defekter UTANFÖR
fällningen fick sina kort (`#1902`: `TASK-312` för `jq`, `yamllint`, GitHub
Actions och `gh`; `TASK-313` för `--dry-run`-defekten).

**Det generella:** uppskjutandet ser ut som disciplin därför att det
producerar en artefakt — ett kort, en rad i en rapport, en referens att peka
på. Testet som skiljer de två fallen åt är en enda fråga: *skulle den
registrerade posten ha förhindrat den fällning du just åtgärdade?* Är svaret
ja är det inte ett kort — det är resten av fixen. Är svaret nej är
registreringen rätt handling. Motsatt riktning finns redan bokförd i huset:
när roten ligger utanför repots rådighet ÄR bokföringen rätt svar, men då med
namngiven ägare, exakt ändring och ett datum att mäta om — inte som en
hänvisning utan mottagare.
