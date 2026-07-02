---
name: improve-codebase-architecture
description: Skanna en kodbas efter möjligheter till fördjupning, presentera dem i en visuell HTML-rapport och grilla sedan den kandidat som användaren väljer.
disable-model-invocation: true
---

# Förbättra kodbasarkitektur

Synliggör arkitekturell friktion och föreslå **möjligheter till fördjupning** — refaktoreringar som omvandlar grunda moduler till djupa. Målet är testbarhet och att AI lättare kan navigera kodbasen.

Detta kommando *informeras* av projektets domänmodell och bygger på en gemensam designvokabulär:

- Kör `/codebase-design` för arkitekturvokabulären (**modul**, **gränssnitt**, **djup**, **skarv**, **adapter**, **hävstång**, **lokalitet**) och dess principer (raderingstestet, ”gränssnittet är testytan”, ”en adapter = hypotetisk skarv, två = verklig”). Använd termerna exakt i varje förslag — glid inte över till ”komponent”, ”tjänst”, ”API” eller ”gräns”.
- Domänspråket i `CONTEXT.md` ger namn åt bra skarvar; ADR:erna i `docs/adr/` dokumenterar beslut som kommandot inte ska ompröva.

## Process

### 1. Utforska

Läs först projektets domänordlista (`CONTEXT.md`) och ADR:er i området du berör.

Använd sedan Agent-verktyget med `subagent_type=Explore` för att gå igenom kodbasen. Följ inte rigida tumregler — utforska organiskt och notera var du upplever friktion:

- Var kräver förståelse av ett begrepp att du hoppar mellan många små moduler?
- Var är moduler **grunda** — gränssnittet nästan lika komplext som implementationen?
- Var har rena funktioner brutits ut enbart för testbarhet, medan verkliga buggar gömmer sig i hur de anropas (ingen **lokalitet**)?
- Var läcker tätt kopplade moduler över sina skarvar?
- Vilka delar av kodbasen är otestade eller svåra att testa genom sitt nuvarande gränssnitt?

Tillämpa **raderingstestet** på allt du misstänker är grunt: skulle komplexiteten samlas om det raderades, eller bara flyttas? ”Ja, samlas” är signalen du söker.

### 2. Presentera kandidater i en HTML-rapport

Skriv en självständig HTML-fil i operativsystemets tillfälliga katalog så att inget hamnar i repot. Hämta katalogen från `$TMPDIR`, med `/tmp` som reserv (eller `%TEMP%` på Windows), och skriv till `<tmpdir>/architecture-review-<timestamp>.html` så att varje körning får en färsk fil. Öppna den för användaren — `xdg-open <path>` på Linux, `open <path>` på macOS, `start <path>` på Windows — och ange den absoluta sökvägen.

Rapporten använder **Tailwind via CDN** för layout och stil samt **Mermaid via CDN** för diagram när en graf, ett flöde eller en sekvens kommunicerar strukturen tillförlitligt. Blanda Mermaid med handbyggda CSS-/SVG-visualiseringar: använd Mermaid för grafformade relationer (anropsgrafer, beroenden och sekvenser) och handbyggda divar/SVG när uttrycket ska vara mer redaktionellt (massdiagram, tvärsnitt och kollapsanimationer). Varje kandidat får en **före/efter-visualisering**. Var visuell.

Rendera ett kort för varje kandidat med:

- **Filer** — berörda filer och moduler.
- **Problem** — varför nuvarande arkitektur skapar friktion.
- **Lösning** — enkel beskrivning av vad som förändras.
- **Fördelar** — förklarade genom lokalitet och hävstång samt hur testerna förbättras.
- **Före-/efterdiagram** — sida vid sida och specialritat för att visa grundhet och fördjupning.
- **Rekommendationsstyrka** — `Strong`, `Worth exploring` eller `Speculative`, renderat som en badge.

Avsluta rapporten med avsnittet **Top recommendation**: vilken kandidat du skulle ta först och varför.

**Använd vokabulären i CONTEXT.md för domänen och `/codebase-design` för arkitekturen.** Om `CONTEXT.md` definierar ”Order”, tala om ”Order intake module” — inte ”FooBarHandler” och inte ”Order service”.

**ADR-konflikter:** lyft en kandidat som strider mot en befintlig ADR bara när friktionen verkligen motiverar att ADR:en ses över. Märk den tydligt i kortet, till exempel med en varningsruta: *”contradicts ADR-0007 — but worth reopening because…”*. Lista inte varje teoretisk refaktorering som en ADR förbjuder.

Se [HTML-REPORT.md](HTML-REPORT.md) för komplett HTML-stomme, diagrammönster och stilvägledning.

Föreslå **inte** gränssnitt ännu. När filen är skriven, fråga användaren: ”Vilken av dessa vill du utforska?”

### 3. Grillningsloop

När användaren valt en kandidat, kör `/grilling` för att gå igenom designträdet tillsammans: begränsningar, beroenden, formen på den fördjupade modulen, vad som ligger bakom skarven och vilka tester som överlever.

Sidoeffekter sker direkt när beslut kristalliseras — kör `/domain-modeling` för att hålla domänmodellen aktuell under arbetet:

- **Namn på en fördjupad modul efter ett begrepp som saknas i `CONTEXT.md`?** Lägg till termen i `CONTEXT.md`. Skapa filen först när den behövs.
- **Förtydligande av en suddig term under samtalet?** Uppdatera `CONTEXT.md` direkt.
- **Användaren förkastar kandidaten med ett bärande skäl?** Erbjud en ADR, formulerad så här: *”Vill du att jag dokumenterar detta som en ADR så att framtida arkitekturgranskningar inte föreslår det igen?”* Erbjud den bara när skälet faktiskt behövs för att en framtida utforskare inte ska föreslå samma sak igen; hoppa över flyktiga skäl (”inte värt det just nu”) och självklara skäl.
- **Vill användaren utforska alternativa gränssnitt för den fördjupade modulen?** Kör `/codebase-design` och använd dess parallella mönster ”design it twice” med delagenter.
