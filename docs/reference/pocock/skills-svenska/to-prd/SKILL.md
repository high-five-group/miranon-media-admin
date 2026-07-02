---
name: to-prd
description: Omvandla den aktuella konversationen till en PRD och publicera den i projektets issue-tracker — ingen intervju, bara en syntes av det ni redan har diskuterat.
disable-model-invocation: true
---

Den här skillen använder den aktuella konversationens kontext och förståelsen av kodbasen för att skapa en PRD. Intervjua **inte** användaren — syntetisera bara det du redan vet.

Vokabulären för issue-trackern och triage-etiketter ska redan ha tillhandahållits. Kör annars `/setup-matt-pocock-skills`.

## Process

1. Utforska repot för att förstå kodbasens nuvarande tillstånd om du inte redan har gjort det. Använd projektets ordlistevokabulär genomgående i PRD:n och respektera ADR:er i området du berör.

2. Skissa skarvarna där funktionen ska testas. Befintliga skarvar ska föredras framför nya. Använd högsta möjliga skarv. Om nya skarvar behövs, föreslå dem så högt upp som möjligt. Ju färre skarvar i kodbasen, desto bättre — idealet är en.

   Stäm av med användaren att dessa skarvar motsvarar deras förväntningar.

3. Skriv PRD:n med mallen nedan och publicera den sedan i projektets issue-tracker. Applicera triage-etiketten `ready-for-agent` — ytterligare triage behövs inte.

<prd-template>

## Problemformulering

Problemet som användaren upplever, ur användarens perspektiv.

## Lösning

Lösningen på problemet, ur användarens perspektiv.

## Användarberättelser

En **lång**, numrerad lista med användarberättelser. Varje berättelse ska använda formen:

1. Som <aktör> vill jag <funktion>, så att <nytta>

<user-story-example>
1. Som mobilbankskund vill jag se saldot på mina konton, så att jag kan fatta bättre informerade beslut om mina utgifter.
</user-story-example>

Listan med användarberättelser ska vara mycket omfattande och täcka alla delar av funktionen.

## Implementationsbeslut

En lista över fattade implementationsbeslut. Den kan innehålla:

- Modulerna som ska byggas eller ändras.
- Gränssnitten på moduler som ska ändras.
- Tekniska förtydliganden från utvecklaren.
- Arkitekturbeslut.
- Schemaändringar.
- API-kontrakt.
- Specifika interaktioner.

Ta **inte** med specifika filsökvägar eller kodavsnitt. De kan snabbt bli inaktuella.

Undantag: om en prototyp skapade ett avsnitt som uttrycker ett beslut mer exakt än prosa kan (tillståndsmaskin, reducer, schema eller typform), lägg in det direkt vid det relevanta beslutet och notera kort att det kommer från en prototyp. Begränsa det till beslutsbärande delar — inte en fungerande demo, bara de viktiga delarna.

## Testbeslut

En lista över fattade testbeslut. Inkludera:

- En beskrivning av vad som gör ett test bra (testa bara externt beteende, inte implementationsdetaljer).
- Vilka moduler som ska testas.
- Förebilder för testerna (det vill säga liknande testtyper i kodbasen).

## Utanför omfattningen

En beskrivning av det som inte omfattas av denna PRD.

## Ytterligare anteckningar

Övriga anteckningar om funktionen.

</prd-template>
