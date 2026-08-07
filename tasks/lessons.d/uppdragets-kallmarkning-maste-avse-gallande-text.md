# Ett källmärkt uppdrag kan vara precist och ändå fel — källan måste vara GÄLLANDE, och förbudet får inte svälja skyldigheten

**Tre distinkta sätt att skriva ett uppdrag som en kompetent mottagare utför
exakt som skrivet och ändå fel: citera en föråldrad rad, namnge en delmängd som
läses som helheten, och formulera ett förbud som svalde en skyldighet.**
`[UNIVERSAL]`

Mätt 2026-08-07 (S93 femte resumen). Fem uppdrag till byggagenter i ett pass;
**tre av dem bar var sin instans**. Samtliga fångades av mottagaren, ingen av
självgranskningen.

## 1. Källan var precis, men föråldrad

`TASK-145.2`s uppdrag citerade facit-bilagans rad 131 ordagrant:

> *"Eventinfo-raden + Bor över-raden står kvar, ORÖRDA (signal-slot,
> `AutoKryss`, kryss-läget)"*

Samma fil, rad 681, river `AutoKryss` (*"### 4. Auto-kryssen riven"*), och
grillad samsyn beslut 2 — citerad i **samma uppdrag** — namnger auto-kryssen som
rivning nummer ett. Uppdragets två källhänvisningar motsade varandra; rad 131
var skriven före konvergens-passet.

`ADR-086` kräver att varje faktapåstående källmärks, och det gjordes. **Men en
källmärkning till en föråldrad rad ser exakt likadan ut som en till en
gällande.** I ett dokument som växer våg för våg är den tidiga texten kvar och
läser som nutid. Disciplinen räcker alltså inte: citatet måste dessutom
kontrolleras mot senare avsnitt i samma fil.

## 2. Delmängden lästes som helheten

`TASK-145.1`s uppföljning bad om att laga *"Personkorten-blocket"* i
`event-detail.staging.test.ts`. Agenten lagade exakt det — 0/8 → 8/8 — och
rapporterade precist. Samma fil bar ett **annat** block
(`Markera-läget — batch-bekräftelse`) som uppdraget aldrig nämnde. Det stod kvar
rött och slog igenom på `main` när den verifierande sviten körde staging-testerna
som PR-klassen skippar.

Att namnge en delmängd är att tyst utesluta resten. Skriv ut regeln, inte bara
instansen.

## 3. Förbudet svalde skyldigheten

`TASK-145.1` AC #9 löd *"Inga befintliga E2E-filer raderas i denna skiva"*.
Agenten tillämpade det symmetriskt: rörde dem inte alls, och lämnade tretton
tester röda på ytor skivan själv medvetet ändrat.

Läsningen är rimlig. Texten sade vad som var förbjudet och underförstod vad som
krävdes. Rättad lydelse: *"Ingen fil RADERAS. Assertioner som prövar den yta
skivan medvetet ändrat SKA däremot uppdateras — att lämna dem röda är inte samma
sak som att bevara täckning."*

## Det generella

Ett uppdrag läses **bokstavligt** av en mottagare som inte kan veta vad du menade.
Tre kontroller före utskick, var och en billig:

1. **Är varje citat gällande?** Sök samma term i resten av filen — ett dokument
   som växer i vågor bevarar sin egen historia som löptext.
2. **Namnger jag en instans där jag menar en klass?** Om ja, skriv klassen.
3. **Bär mitt förbud en outtalad skyldighet?** "Radera inte" är inte "lämna
   orört". Skriv ut båda halvorna.

**Fångst-mönstret är det viktigaste i posten.** Alla tre hittades av mottagande
agenter som prövade premisserna mot disk — noll av dem av författarens
genomläsning. Det är `ADR-086`s premiss-pass som fungerar, och det är samma
asymmetri som fångst-raterna redan beskriver: självgranskning är svag, extern
fångst dominerar. Skriv därför uppdrag som **går att motsäga** — med sökbara
källor och mätbara påståenden — hellre än uppdrag som låter säkra.
