# En skivning som inte prövats mot kodens faktiska kopplingar är en hypotes

**Skiva inte efter funktionsyta — pröva varje skivgräns mot koden den ska skära
igenom, innan korten publiceras. En gräns som ser ren ut i en beskrivning kan
gå rakt igenom en delad symbol.** `[UNIVERSAL]`

Mätt 2026-08-07 (S93 femte resumen). `/to-issues` delade `TASK-145` i sju
skivor efter vad Lotta ser: registret, räknarna, markera-läget, betalningsytan.
Varje skiva läste sunt för sig. **Två av gränserna höll inte mot koden**, och
båda upptäcktes först när en byggagent stod i dem.

## Fel 1 — en rad utan ägare

`TASK-145.2` specades som *"fyra klickbara steg-räknare"*. Summeringsblocket
innehåller åtta rader; de fyra andra — Eventinfo-signalraden, Bor över,
Avbokade — hamnade utanför varje kort. Agenten sökte i backlog-korten, fann
noll träffar på "Bor över", och tog bort raden med sitt E2E-test.

Beslutet fanns hela tiden — i **grillad samsyn beslut 2** (sessionsdok) och i
**facit-bilagan** (radens exakta form, med bevisbild). Men inte i ett kort. Den
som bygger läser kort.

## Fel 2 — en delad symbol mitt i en gräns

`TASK-145.1` (enad lista) och `TASK-145.3` (markera-läget) såg ut som två
skivor. I koden var de en:

```text
Deltagare.tsx:1652   markeringKandidatIds = protoVariant === 'a'
                       ? registerListaA.map(r => r.id) : obekraftadeIds
Deltagare.tsx:2103   <GruppRubrik handling={<MarkeraKnapp … />}>
                       {`Obekräftade (${obekraftade.length})`}
```

Markera-knappens enda anropsplats satt **inuti rubriken** `145.1` skulle riva,
och kandidatmängden **var** kön som revs. Att nå `145.1`:s första AC utan att
röra `145.3`:s yta var strukturellt omöjligt.

**Ironin som gör lärdomen skarp:** samma sessions Del 8 bokförde redan
kopplingen — *"markera-läget beror på filtreringen, inte bara på registret:
`markeringKandidatIds` ÄR den filtrerade listan (`Deltagare.tsx`:1652)"* — och
skivade ändå isär dem. Att KÄNNA till en koppling räcker inte; den måste
prövas mot varje gräns man drar.

## Det generella

En skivning är en **hypotes om var koden går att dela**. Den prövas billigast
före publicering — genom att för varje gräns spåra de symboler skivan ska röra
och fråga *vem mer läser dem?* Prövas den i stället av en byggagent kostar den
ett helt pass, och agenten tvingas välja mellan att gissa en form eller stanna.

**Två sunda beteenden räddade båda fallen:** agenten flaggade den oägda raden
öppet i stället för att tyst hoppa över den, och stannade vid den omöjliga
gränsen med fil och rad i stället för att bygga runt. Fångsten skedde alltså
externt — självgranskningen av skivningen hade noll träffar, precis som
fångst-raterna förutsäger.
