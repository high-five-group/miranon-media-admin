# Utforma två gånger

När användaren vill utforska alternativa gränssnitt för en vald fördjupningskandidat, använd detta mönster med parallella delagenter. Det bygger på Ousterhouts ”Design It Twice”: den första idén är sällan den bästa.

Använd vokabulären i [SKILL.md](SKILL.md): **modul**, **gränssnitt**, **skarv**, **adapter** och **hävstång**.

## Process

### 1. Rama in problemområdet

Innan du startar delagenter, skriv en användarvänd förklaring av problemområdet för den valda kandidaten:

- Begränsningarna som varje nytt gränssnitt måste uppfylla.
- Beroendena det skulle använda och deras kategorier (se [DEEPENING.md](DEEPENING.md)).
- En ungefärlig illustrativ kodskiss som förankrar begränsningarna — inte ett förslag, utan ett sätt att göra dem konkreta.

Visa detta för användaren och gå sedan direkt vidare till steg 2. Användaren kan läsa och tänka medan delagenterna arbetar parallellt.

### 2. Starta delagenter

Starta minst tre delagenter parallellt. Var och en måste ta fram ett **radikalt annorlunda** gränssnitt för den fördjupade modulen.

Ge varje delagent ett separat tekniskt underlag: filsökvägar, kopplingsdetaljer, beroendekategori från [DEEPENING.md](DEEPENING.md) och vad som ligger bakom skarven. Underlaget är fristående från den användarvända problemförklaringen i steg 1. Ge varje agent en egen designbegränsning:

- Agent 1: ”Minimera gränssnittet — sikta på högst 1–3 ingångspunkter. Maximera hävstången per ingångspunkt.”
- Agent 2: ”Maximera flexibiliteten — stöd många användningsfall och utbyggnad.”
- Agent 3: ”Optimera för den vanligaste anroparen — gör standardfallet trivialt.”
- Agent 4 (vid behov): ”Utforma med ports & adapters för beroenden över skarvar.”

Inkludera både vokabulären i [SKILL.md](SKILL.md) och vokabulären i `CONTEXT.md` så att varje delagent namnger saker konsekvent med arkitekturspråket och projektets domänspråk.

Varje delagent ska leverera:

1. Gränssnittet (typer, metoder och parametrar — samt invariansregler, ordning och fellägen).
2. Ett användningsexempel som visar hur anropare använder det.
3. Vad implementationen döljer bakom skarven.
4. Beroendestrategi och adaptrar (se [DEEPENING.md](DEEPENING.md)).
5. Avvägningar — var hävstången är hög och var den är låg.

### 3. Presentera och jämför

Presentera designerna en i taget så att användaren kan ta in var och en. Jämför dem sedan i löpande text. Kontrastera **djup** (hävstång vid gränssnittet), **lokalitet** (var förändring samlas) och **placeringen av skarven**.

Ge därefter en egen rekommendation: vilken design är starkast och varför? Om delar från olika designer kan kombineras väl, föreslå en hybrid. Var tydlig och ta ställning — användaren vill ha en välgrundad bedömning, inte en meny.
