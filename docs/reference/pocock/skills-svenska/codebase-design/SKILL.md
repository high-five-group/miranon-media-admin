---
name: codebase-design
description: Gemensamt språk för att utforma djupa moduler. Använd när användaren vill utforma eller förbättra ett moduls gränssnitt, hitta möjligheter att fördjupa kod, avgöra var en skarv ska ligga, göra kod mer testbar eller mer lättnavigerad för AI, eller när en annan skill behöver vokabulären för djupa moduler.
---

# Kodbasdesign

Utforma **djupa moduler**: mycket beteende bakom ett litet gränssnitt, placerat vid en ren skarv och testbart genom det gränssnittet. Använd språket och principerna här när kod utformas eller struktureras om. Målet är hävstång för anroparen, lokalitet för den som underhåller och testbarhet för alla.

## Ordlista

Använd dessa termer exakt. Byt inte ut dem mot ”komponent”, ”tjänst”, ”API” eller ”gräns”. Det konsekventa språket är själva poängen.

**Modul** — allt som har ett gränssnitt och en implementation. Termen är avsiktligt oberoende av skala: en funktion, klass, ett paket eller en vertikal del genom flera lager. *Undvik:* enhet, komponent, tjänst.

**Gränssnitt** — allt en anropare måste känna till för att använda modulen korrekt: typsignaturen, men även invariansregler, ordningskrav, fellägen, obligatorisk konfiguration och prestandaegenskaper. *Undvik:* API, signatur (för snävt — de avser bara den typmässiga ytan).

**Implementation** — det som finns inne i en modul, alltså själva kodstommen. Skilj från **adapter**: något kan vara en liten adapter med stor implementation (ett Postgres-repo), eller en stor adapter med liten implementation (en minnesbaserad fejk). Säg ”adapter” när skarven är ämnet; annars ”implementation”.

**Djup** — hävstång vid gränssnittet: mängden beteende som en anropare eller ett test kan använda per del av gränssnittet som måste läras in. En modul är **djup** när mycket beteende ligger bakom ett litet gränssnitt, och **grund** när gränssnittet är nästan lika komplext som implementationen.

**Skarv** *(Michael Feathers)* — en plats där beteende kan ändras utan att redigera just där; den *plats* där en moduls gränssnitt finns. Var skarven ska ligga är ett eget designbeslut, skilt från vad som ska ligga bakom den. *Undvik:* gräns (överlastat av DDD:s bounded context).

**Adapter** — en konkret sak som uppfyller ett gränssnitt vid en skarv. Termen beskriver *rollen* (vilken plats den fyller), inte substansen (vad som finns inuti).

**Hävstång** — det anroparen får av djup: mer förmåga per del av gränssnittet som lärs in. En implementation ger avkastning över N anropsställen och M tester.

**Lokalitet** — det underhållaren får av djup: ändringar, buggar, kunskap och verifiering samlas på ett ställe i stället för att spridas bland anroparna. Fixa en gång, fixa överallt.

## Djup kontra grund

**Djup modul** = litet gränssnitt + mycket implementation:

```
┌─────────────────────┐
│ Litet gränssnitt    │  ← Få metoder, enkla parametrar
├─────────────────────┤
│                     │
│ Djup implementation │  ← Dold komplex logik
│                     │
└─────────────────────┘
```

**Grund modul** = stort gränssnitt + liten implementation (undvik):

```
┌─────────────────────────────────┐
│       Stort gränssnitt           │  ← Många metoder, komplexa parametrar
├─────────────────────────────────┤
│  Tunn implementation             │  ← Skickar mest bara vidare
└─────────────────────────────────┘
```

Fråga när du utformar ett gränssnitt:

- Kan jag minska antalet metoder?
- Kan jag förenkla parametrarna?
- Kan jag dölja mer komplexitet inuti?

## Principer

- **Djup är en egenskap hos gränssnittet, inte implementationen.** En djup modul kan vara uppbyggd av små, mockbara och utbytbara delar internt — de är bara inte en del av gränssnittet. En modul kan ha **interna skarvar** (privata för implementationen och använda av dess tester) samt den **externa skarven** vid gränssnittet.
- **Raderingstestet.** Föreställ dig att modulen raderas. Om komplexiteten försvinner var den bara en vidarekoppling. Om komplexiteten dyker upp hos N anropare gjorde modulen nytta.
- **Gränssnittet är testytan.** Anropare och tester passerar samma skarv. Om du vill testa *förbi* gränssnittet har modulen troligen fel form.
- **En adapter betyder en hypotetisk skarv. Två adaptrar betyder en verklig.** Skapa inte en skarv förrän något faktiskt varierar över den.

## Utforma för testbarhet

Bra gränssnitt gör testning naturlig:

1. **Ta emot beroenden; skapa dem inte.**

   ```typescript
   // Testbar
   function processOrder(order, paymentGateway) {}

   // Svår att testa
   function processOrder(order) {
     const gateway = new StripeGateway();
   }
   ```

2. **Returnera resultat; skapa inte sidoeffekter.**

   ```typescript
   // Testbar
   function calculateDiscount(cart): Discount {}

   // Svår att testa
   function applyDiscount(cart): void {
     cart.total -= discount;
   }
   ```

3. **Liten yta.** Färre metoder innebär färre nödvändiga tester. Färre parametrar innebär enklare testuppsättning.

## Relationer

- En **modul** har exakt ett **gränssnitt** (ytan den visar för anropare och tester).
- **Djup** är en egenskap hos en **modul**, mätt mot dess **gränssnitt**.
- En **skarv** är platsen där en **moduls** **gränssnitt** finns.
- En **adapter** sitter vid en **skarv** och uppfyller **gränssnittet**.
- **Djup** skapar **hävstång** för anropare och **lokalitet** för underhållare.

## Förkastade synsätt

- **Djup som kvoten mellan rader implementation och rader gränssnitt** (Ousterhout): belönar utfyllnad i implementationen. Använd i stället djup som hävstång.
- **”Gränssnitt” som TypeScripts nyckelord `interface` eller en klass publika metoder**: för snävt — gränssnittet här omfattar allt anroparen behöver veta.
- **”Gräns”**: överlastat av DDD:s bounded context. Säg **skarv** eller **gränssnitt**.

## Gå djupare

- **Fördjupa ett kluster utifrån dess beroenden** — se [DEEPENING.md](DEEPENING.md): beroendekategorier, skarvdisciplin och testning genom att ersätta i stället för att stapla.
- **Utforska alternativa gränssnitt** — se [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md): starta parallella delagenter som tar fram radikalt olika gränssnitt och jämför dem utifrån djup, lokalitet och placeringen av skarven.
