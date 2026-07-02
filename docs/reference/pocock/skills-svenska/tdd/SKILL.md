---
name: tdd
description: Testdriven utveckling. Använd när användaren vill bygga funktioner eller åtgärda buggar test-först, nämner ”red-green-refactor” eller vill ha integrationstester.
---

# Testdriven utveckling

## Filosofi

**Kärnprincip:** Tester ska verifiera beteende genom publika gränssnitt, inte implementationsdetaljer. Koden kan förändras helt; testerna ska inte göra det.

**Bra tester** är integrationsliknande: de kör verkliga kodvägar genom publika API:er. De beskriver *vad* systemet gör, inte *hur* det gör det. Ett bra test läses som en specifikation — ”användaren kan slutföra ett köp med en giltig varukorg” anger exakt vilken förmåga som finns. Testerna överlever refaktoreringar eftersom de inte bryr sig om den interna strukturen.

**Dåliga tester** är kopplade till implementationen. De mockar interna samarbetspartner, testar privata metoder eller verifierar på externa vägar (som att fråga databasen direkt i stället för att använda gränssnittet). Varningssignalen är att testet går sönder när du refaktorerar trots att beteendet inte har förändrats. Om du byter namn på en intern funktion och testerna fallerar testade de implementation, inte beteende.

Se [tests.md](tests.md) för exempel och [mocking.md](mocking.md) för riktlinjer om mocking.

## Antimönster: horisontella skivor

Skriv **inte** alla tester först och därefter all implementation. Det är ”horisontell skivning” — att tolka RÖD som ”skriv alla tester” och GRÖN som ”skriv all kod”.

Det skapar **skräptester**:

- Tester som skrivs i bulk testar föreställt, inte faktiskt, beteende.
- Du testar sakernas *form* (datastrukturer och funktionssignaturer) i stället för användarorienterat beteende.
- Tester blir okänsliga för verkliga förändringar: de passerar när beteendet är trasigt och fallerar när beteendet är rätt.
- Du springer före strålkastarna och låser teststrukturen innan du förstår implementationen.

**Rätt angreppssätt:** vertikala skivor via tracer bullets. Ett test → en implementation → upprepa. Varje test svarar på det du lärde dig i föregående cykel. Eftersom du just skrev koden vet du exakt vilket beteende som spelar roll och hur det ska verifieras.

```
FEL (horisontellt):
  RÖD:   test1, test2, test3, test4, test5
  GRÖN:  impl1, impl2, impl3, impl4, impl5

RÄTT (vertikalt):
  RÖD→GRÖN: test1→impl1
  RÖD→GRÖN: test2→impl2
  RÖD→GRÖN: test3→impl3
  ...
```

## Arbetsflöde

### 1. Planering

Läs `CONTEXT.md` (om den finns) när du utforskar kodbasen, så att testnamn och gränssnittsvokabulär följer projektets domänspråk. Respektera ADR:er i området du berör.

Innan du skriver kod:

- [ ] Bekräfta med användaren vilka gränssnittsändringar som behövs.
- [ ] Bekräfta med användaren vilka beteenden som ska testas och prioriteras.
- [ ] Identifiera möjligheter till djupa moduler (litet gränssnitt, djup implementation) — kör `/codebase-design` för vokabulär och testbarhetskontroller.
- [ ] Lista beteendena som ska testas, inte implementationsstegen.
- [ ] Få användarens godkännande av planen.

Fråga: ”Hur ska det publika gränssnittet se ut? Vilka beteenden är viktigast att testa?”

**Du kan inte testa allt.** Bekräfta exakt vilka beteenden som betyder mest för användaren. Fokusera testinsatsen på kritiska vägar och komplex logik, inte varje möjlig kant.

### 2. Tracer bullet

Skriv **ett** test som bekräftar **en** sak om systemet:

```
RÖD:   Skriv test för första beteendet → testet fallerar
GRÖN:  Skriv minsta kod som passerar → testet passerar
```

Detta är din tracer bullet — den bevisar att vägen fungerar från början till slut.

### 3. Inkrementell loop

För varje återstående beteende:

```
RÖD:   Skriv nästa test → fallerar
GRÖN:  Minsta kod som passerar → passerar
```

Regler:

- Ett test i taget.
- Bara tillräckligt med kod för att få det aktuella testet att passera.
- Förutse inte framtida tester.
- Håll tester fokuserade på observerbart beteende.

### 4. Refaktorera

När alla tester passerar, leta efter [refaktoreringskandidater](refactoring.md):

- [ ] Extrahera duplicering.
- [ ] Fördjupa moduler (flytta komplexitet bakom enkla gränssnitt).
- [ ] Tillämpa SOLID-principer där det är naturligt.
- [ ] Fundera på vad den nya koden avslöjar om befintlig kod.
- [ ] Kör tester efter varje refaktoreringssteg.

**Refaktorera aldrig medan du är RÖD.** Nå GRÖN först.

## Checklista per cykel

```
[ ] Testet beskriver beteende, inte implementation
[ ] Testet använder bara publikt gränssnitt
[ ] Testet överlever intern refaktorering
[ ] Koden är minimal för detta test
[ ] Inga spekulativa funktioner har lagts till
```
