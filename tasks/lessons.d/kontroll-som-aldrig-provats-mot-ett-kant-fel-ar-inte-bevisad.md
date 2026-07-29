# En kontroll som aldrig prövats mot ett känt fel är inte bevisad — den är hoppfull

**En mekaniserad kontroll ärver tyst antagandena i sitt mönster. Prövas den bara
mot ett rent tillstånd bevisar det ingenting: grönt betyder då antingen "inga fel"
eller "kan inte se fel", och de två går inte att skilja åt utifrån. Varje ny
kontroll ska därför köras mot ett KÄNT fel innan den skrivs in — annars levereras
en täckning som inte finns.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29, femtonde resumen — `tasks/s91-restlistan.md`):**

Restlistan hade trettonde resumen fått en mekanisk statuskontroll i filhuvudet,
införd just för att ersätta ett auditpass efter att en audit lämnat kvar två fel.
Kontrollen fungerade — den fångade fel samma kväll den skrevs. Den matchade

```text
^- \[ \] \*\*`TASK-N`
```

alltså kort-ID:t **först** på raden. Det var sant för de flesta poster i filen.
Men A7-spårets rader bär sitt ID **sist**, efter en pil. För dem var kontrollen
strukturellt blind, och det syntes inte, eftersom utfallet var tomt — vilket lästes
som "inga fel".

Tre fel låg och väntade i kroppen, samtliga redan korrekt bokförda i filens egen
Avbockningslogg:

| Post | Kort | Stod som | Faktisk status |
|---|---|---|---|
| `A7:3` | `TASK-70.1` | öppen | Done |
| `A7:5` | `TASK-70.3` | öppen | Done |
| `A7:6` | `TASK-70.4` | avbockad **i kroppen** | Done |

`A7:6` är det skarpaste fallet: raden bröt filens uttryckliga regel att kroppen
bara bär öppna poster, låg synlig mitt i filen, och passerade både kontrollen och
varje mänsklig genomläsning under ett dygn.

**Felet var inte i regexen utan i leveransen av den.** Mönstret skrevs mot de
rader som råkade ligga närmast när det skrevs, och kördes sedan mot en fil som var
nyss städad. Ett grönt utfall mot ett rent tillstånd var hela beviset.

**Motmedlet är billigt och tar en tool-call:** kör den nya kontrollen mot en
version av filen där felet bevisligen finns — `git show <sha>:<fil>` räcker.
Formen som ersatte den prövades trefaldigt före den skrevs in: **tre FEL** mot
filen vid `02a9517` (där den gamla gav noll), **tomt** mot den rättade, och
**ingen falsk positiv** på den rad som nämner ett `Done`-kort som beroende utan
att bära det. Först då var täckningen ett påstående med belägg.

**Skärpningen mot närliggande lärdomar:** [[L322]] handlar om grindar som är
fail-open — de släpper igenom fel de *ser*. Denna klass är tystare och värre: en
grind som aldrig ser felklassen alls, och därför aldrig ens får chansen att vara
fail-open. Och där lärdomen om CI:s exakta kommando säger att en lokal körning med
andra flaggor är en grind du inte kört, säger denna att **en grind du kört men
aldrig sett fällas är en grind du inte vet något om.**

**Generaliseringen:** det gäller varje mekanisering som ersätter ett mänskligt
pass — grindvakter, statuskontroller, lint-regler, self-tests. Rött-först är
redan repots kontrakt för kod (ADR-071 § Rött-först). Denna lärdom säger att
kontraktet gäller lika mycket för de kontroller vi skriver åt oss själva i
prosa-artefakter, där ingen CI påminner om det.
