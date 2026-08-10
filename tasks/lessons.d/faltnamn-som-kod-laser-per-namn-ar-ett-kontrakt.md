# Ett fältnamn som kod läser per namn är ett kontrakt — en "snyggare" omdöpning är en brytande ändring, och den bryter tyst

**Byt aldrig namn på ett datakällefält medan något bygge läser det per namn.
Mot en namn-läsning är omdöpningen inte ett fel utan en TYSTNAD: läsningen
returnerar tom lista, inte undantag, och varje grind som inte kör mot skarp
data ser grönt.** `[UNIVERSAL]`

Mätt 2026-08-10 (S103). Ett nytt `Anteckningar.Person`-länkfält i Airtable födde
automatiskt ett spegelfält på `Personer`, som Airtable döpte till
**"Anteckningar 2"** eftersom tabellen redan bar ett `Anteckningar`
(multilineText). Orkestreraren döpte om spegelfältet till "Anteckningar (ström)"
i båda baserna 20:13–20:14 med motiveringen att "Anteckningar 2" inte hör hemma
i en bas som är en förstklassig leverabel (`ADR-063`).

I exakt samma stund byggde en parallell agent `get-person-notes` med
`const NOTES_LINK_FIELD = 'Anteckningar 2'`. Agentens 614 tester kördes FÖRE
omdöpningen och var gröna; PR:en armerades 20:15:52 med en läsning som från
20:13 hade gett **tyst tom lista** — exakt den felklass agenten själv skrivit
en varning om i sin egen kodkommentar.

**Fångsten kom inte från någon grind**, utan från att orkestreraren läste
agentens slutrapport och kände igen fältnamnet: `gh pr diff | grep` på namnet
visade beroendet. Förvärrande: repot skickar `run_staging: false` villkorslöst i
PR-grinden sedan `TASK-70.3`, så staging-testerna kör först i post-merge. Ingen
check hade fällt före landning.

**Åtgärden var att backa, inte att laga framåt.** Namnet återställdes i båda
baserna, och basen står nu i exakt det tillstånd agenten bevisade grönt mot —
belagt med differentialmätning: `"Anteckningar 2"` accepteras av Airtable-API:t,
`"Anteckningar (ström)"` ger `UNKNOWN_FIELD_NAME`. Ett fult fältnamn är
oändligt mycket billigare än en tyst trasig läsning i prod.

**Det generella, i tre led:**

1. **Ett nytt länkfält ändrar TVÅ tabeller, inte en.** Verifiera motsatt tabells
   fältlista efteråt — särskilt när det egna namnet redan förekommer där.
2. **Kosmetik på en namn-läst yta är inte kosmetik.** Frågan före varje
   omdöpning är "läser någon detta per namn?", inte "ser det snyggt ut?".
3. **Skriv kontraktet där handen är.** Fältets egen beskrivning i basen bär nu
   varningen om att namnet är ett kontrakt, så nästa person som frestas ser den
   innan hen rör namnet — inte efteråt i en lesson.

Samma familj som `ADR-050`s bas-portabilitet (adressera per NAMN, inte
fält-ID): valet att läsa per namn är rätt, men det gör namnet till en del av
API-ytan — och en API-yta byter man inte i förbifarten.
