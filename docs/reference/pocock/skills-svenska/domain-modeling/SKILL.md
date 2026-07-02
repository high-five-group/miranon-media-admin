---
name: domain-modeling
description: Bygg och förfina ett projekts domänmodell. Använd när användaren vill fastställa domänterminologi eller ett gemensamt språk, dokumentera ett arkitekturbeslut eller när en annan skill behöver underhålla domänmodellen.
---

# Domänmodellering

Bygg och förfina aktivt projektets domänmodell medan du utformar lösningen. Detta är den *aktiva* disciplinen: utmana termer, uppfinn gränsfallsscenarier och skriv ned ordlistan och besluten så snart de kristalliseras. (Att bara *läsa* `CONTEXT.md` för vokabulär är inte denna skill — det är en enradsrutin som vilken skill som helst kan följa. Använd denna skill när modellen förändras, inte när den bara konsumeras.)

## Filstruktur

De flesta repos har ett enda kontextområde:

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

Om det finns en `CONTEXT-MAP.md` i roten har repot flera kontextområden. Kartan pekar ut var varje område finns:

```
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          ← systemövergripande beslut
├── src/
│   ├── ordering/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                 ← områdesspecifika beslut
│   └── billing/
│       ├── CONTEXT.md
│       └── docs/adr/
```

Skapa filer först när det finns något att skriva. Saknas `CONTEXT.md`, skapa den när den första termen är fastställd. Saknas `docs/adr/`, skapa katalogen när den första ADR:en behövs.

## Under sessionen

### Utmana mot ordlistan

När användaren använder en term som strider mot det etablerade språket i `CONTEXT.md`, påpeka det direkt: ”Din ordlista definierar ’cancellation’ som X, men du verkar mena Y — vilket är rätt?”

### Förtydliga suddigt språk

När användaren använder vaga eller överlastade termer, föreslå en exakt kanonisk term: ”Du säger ’account’ — menar du Customer eller User? Det är olika saker.”

### Diskutera konkreta scenarier

När domänrelationer diskuteras, stresstesta dem med specifika scenarier. Hitta på scenarier som undersöker gränsfall och tvingar användaren att vara exakt om gränserna mellan begreppen.

### Kontrollera mot koden

När användaren beskriver hur något fungerar, kontrollera om koden håller med. Om du hittar en motsägelse, lyft den: ”Din kod avbokar hela Orders, men du sade nyss att delvis avbokning är möjlig — vilket stämmer?”

### Uppdatera CONTEXT.md direkt

När en term är fastställd, uppdatera `CONTEXT.md` på en gång. Bunta inte ihop uppdateringarna — dokumentera dem när de uppstår. Använd formatet i [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

`CONTEXT.md` ska vara helt fri från implementationsdetaljer. Använd inte `CONTEXT.md` som specifikation, kladdblock eller förråd för implementationsbeslut. Den är en ordlista och inget annat.

### Föreslå ADR:er sparsamt

Föreslå bara en ADR när alla tre villkor är uppfyllda:

1. **Svårt att återställa** — kostnaden för att ändra sig senare är betydande.
2. **Överraskande utan kontext** — en framtida läsare kommer undra ”varför gjorde de så här?”.
3. **Resultat av en verklig avvägning** — det fanns genuina alternativ och ett val gjordes av konkreta skäl.

Saknas något av de tre villkoren, hoppa över ADR:en. Använd formatet i [ADR-FORMAT.md](./ADR-FORMAT.md).
