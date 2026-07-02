# Format för CONTEXT.md

## Struktur

```md
# {Kontextnamn}

{En eller två meningar om vad detta kontextområde är och varför det finns.}

## Språk

**Order**:
{En eller två meningar som beskriver termen}
_Undvik_: Purchase, transaction

**Invoice**:
En begäran om betalning som skickas till en kund efter leverans.
_Undvik_: Bill, payment request

**Customer**:
En person eller organisation som lägger beställningar.
_Undvik_: Client, buyer, account
```

## Regler

- **Ta ställning.** När flera ord finns för samma begrepp, välj det bästa och lista de andra under `_Undvik_`.
- **Håll definitionerna korta.** Högst en eller två meningar. Definiera vad begreppet *är*, inte vad det gör.
- **Inkludera bara termer som är specifika för projektets kontext.** Allmänna programmeringsbegrepp (timeouts, feltyper och hjälpmönster) hör inte hemma här, även om projektet använder dem mycket. Fråga innan en term läggs till: är detta ett unikt begrepp i kontexten eller ett allmänt programmeringsbegrepp? Bara det förra hör hemma här.
- **Gruppera termer under underrubriker** när naturliga kluster uppstår. Om alla termer hör till ett enda sammanhängande område fungerar en platt lista bra.

## Repon med ett eller flera kontextområden

**Ett kontextområde (de flesta repos):** en `CONTEXT.md` i repots rot.

**Flera kontextområden:** en `CONTEXT-MAP.md` i repots rot listar områdena, var de finns och hur de förhåller sig till varandra:

```md
# Kontextkarta

## Kontextområden

- [Ordering](./src/ordering/CONTEXT.md) — tar emot och följer kundbeställningar
- [Billing](./src/billing/CONTEXT.md) — skapar fakturor och hanterar betalningar
- [Fulfillment](./src/fulfillment/CONTEXT.md) — hanterar lagerplock och leverans

## Relationer

- **Ordering → Fulfillment**: Ordering skickar händelsen `OrderPlaced`; Fulfillment konsumerar den för att starta plockning
- **Fulfillment → Billing**: Fulfillment skickar händelsen `ShipmentDispatched`; Billing konsumerar den för att skapa fakturor
- **Ordering ↔ Billing**: delade typer för `CustomerId` och `Money`
```

Skillen härleder vilken struktur som gäller:

- Om `CONTEXT-MAP.md` finns, läs den för att hitta kontextområdena.
- Om bara en `CONTEXT.md` i roten finns, använd ett kontextområde.
- Om ingen av dem finns, skapa en `CONTEXT.md` i roten när den första termen har fastställts.

När flera kontextområden finns, härled vilket som den aktuella frågan rör. Fråga om det är oklart.
