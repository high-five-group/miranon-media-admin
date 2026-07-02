---
name: to-issues
description: Dela upp en plan, specifikation eller PRD i självständigt plockbara issues i projektets issue-tracker med tracer-bullet-baserade vertikala skivor.
disable-model-invocation: true
---

# To Issues

Dela upp en plan i självständigt plockbara issues med vertikala skivor (tracer bullets).

Vokabulären för issue-trackern och triage-etiketter ska redan ha tillhandahållits. Kör annars `/setup-matt-pocock-skills`.

## Process

### 1. Samla kontext

Arbeta utifrån det som redan finns i konversationens kontext. Om användaren anger en issue-referens (issuenummer, URL eller sökväg) som argument, hämta den från issue-trackern och läs hela brödtexten och alla kommentarer.

### 2. Utforska kodbasen (valfritt)

Om du inte redan har utforskat kodbasen, gör det för att förstå kodens nuvarande tillstånd. Issue-rubriker och beskrivningar ska använda projektets ordlistevokabulär och respektera ADR:er i området du berör.

Leta efter möjligheter att prefaktorera koden så att implementationen blir enklare. ”Gör ändringen enkel, gör sedan den enkla ändringen.”

### 3. Skissa vertikala skivor

Dela upp planen i **tracer-bullet**-issues. Varje issue är en tunn vertikal skiva som går genom **alla** integrationslager från början till slut, **inte** en horisontell skiva av ett lager.

<vertical-slice-rules>

- Varje skiva levererar en smal men **komplett** väg genom varje lager (schema, API, UI och tester).
- En färdig skiva kan demonstreras eller verifieras på egen hand.
- Eventuell prefaktorering ska göras först.

</vertical-slice-rules>

### 4. Fråga ut användaren

Presentera den föreslagna uppdelningen som en numrerad lista. Visa för varje skiva:

- **Rubrik**: kort, beskrivande namn.
- **Blockeras av**: vilka andra skivor (om några) som måste bli färdiga först.
- **Användarberättelser som täcks**: vilka användarberättelser skivan hanterar (om källmaterialet har sådana).

Fråga användaren:

- Känns granulariteten rätt? (för grov / för fin)
- Är beroenderelationerna korrekta?
- Bör några skivor slås ihop eller delas ytterligare?

Iterera tills användaren godkänner uppdelningen.

### 5. Publicera issues i issue-trackern

Publicera ett nytt issue i issue-trackern för varje godkänd skiva. Använd mallen nedan för issue-brödtexten. Dessa issues anses redo för AFK-agenter, så publicera dem med rätt triage-etikett om inget annat har angetts.

Publicera issues i beroendeordning (blockerare först) så att du kan hänvisa till verkliga issue-identifierare i fältet ”Blockeras av”.

<issue-template>
## Överordnat ärende

En referens till det överordnade issuet i issue-trackern (om källan var ett befintligt issue; utelämna annars detta avsnitt).

## Det som ska byggas

En kortfattad beskrivning av denna vertikala skiva. Beskriv beteendet från början till slut, inte implementation lager för lager.

Undvik specifika filsökvägar eller kodavsnitt — de blir snabbt inaktuella. Undantag: om en prototyp skapade ett avsnitt som uttrycker ett beslut mer exakt än prosa kan (tillståndsmaskin, reducer, schema eller typform), lägg in det här och notera kort att det kommer från en prototyp. Begränsa det till beslutsbärande delar — inte en fungerande demo, bara de viktiga delarna.

## Acceptanskriterier

- [ ] Kriterium 1
- [ ] Kriterium 2
- [ ] Kriterium 3

## Blockeras av

- En referens till blockerande ärende (om något).

Eller ”Inga — kan påbörjas direkt” om det saknas blockerare.

</issue-template>

Stäng eller ändra **inte** något överordnat issue.
