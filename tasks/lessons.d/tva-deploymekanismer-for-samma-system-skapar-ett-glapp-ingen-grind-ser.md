# Två deploy-mekanismer för samma system skapar ett glapp ingen grind ser

**[UNIVERSAL] När två delar av samma system rullas ut via OLIKA mekanismer —
en automatisk, en manuell — är fönstret mellan dem ett tillstånd ingen mätning
i CI kan se. Klienten och dess API kan vara internt konsistenta i repot,
gröna i varje jobb, och ändå osynkade i produktion. Grinden mäter trädet;
glappet uppstår i utrullningen, efter att trädet lämnat den.**

Asymmetrin är hela felet. Vercel deployar Production automatiskt i
merge-ögonblicket; Supabase Edge Functions deployas inte alls automatiskt.
Två halvor, två utlösare, ingen gemensam grind — och ingenting i repot är
någonsin fel.

Mätt två gånger på fem dagar, med motsatta symptom:

- **2026-08-17 (S107), högljutt.** Prod-EF:erna deployades 13:08Z medan
  sessionens EF-rörande mergar landade 15:42–18:16Z. Den gamla
  `_shared/attachments.ts` returnerade inte nycklarna
  `rackvidd`/`kursfamilj`/`kursniva`; den nya fronten parsade dem med
  `.nullable()` (inte `.optional()`) via kastande `.parse()`. Varje yta som
  listade bilagor kastade i prod.
- **2026-08-22, tyst.** Fronten gick live 16:37Z medan prod-EF:en
  `get-persons` bar `UPDATED_AT` från 2026-08-20 — äldre än båda skivorna som
  lärde den registerläget. Klienten frågade efter `register=true`; EF:en kände
  inte parametern, föll igenom till sök-grenen och klampade till `pageSize`
  50. Personlistan visade 50 av 559. Ingen 500, ingen röd yta, inget larm:
  den gamla servern svarade korrekt på en fråga klienten inte hade ställt.

Den tysta varianten är den farliga. Ett kast syns; en stympad lista ser ut
som en kort lista.

## Den persisterade cachen gör glappet långlivat EFTER att det stängts

Det är den delen som gör lärdomen värd att skriva ned, inte bara
deploy-ordningen.

Stänger man glappet — deployar den saknade halvan — är felet inte
nödvändigtvis borta. Klienten kan ha SPARAT det gamla svaret. En cache som
persisteras till `localStorage` överlever omladdningen, och det enda
versionsskydd den bär är en app-versions-buster. Bustern är verkningslös här,
och det är inte en bugg i den: **appversionen var redan den nya när fel data
skrevs.** Datan föddes i glappet, under den nya fronten, och matchar därför
vid restore. Bustern kan skilja gammal app från ny app; den kan inte skilja
ny app som pratade med gammal server från ny app som pratade med ny server.

Två inställningar förlängde felet i vår instans: `maxAge` 24 timmar, och en
`staleTime` som just höjts till 30 minuter för den drabbade nyckeln. Med båda
satta var den felaktiga datan både bevarad och FÄRSK — ingen
bakgrundshämtning startade. Fixen blev en manuell radering av
lagringsnyckeln.

Och skyddet man tror finns fanns inte: `refetchOnWindowFocus` verkar bara på
en STALE fråga. Inom `staleTime`-fönstret hämtar en fokus-återkomst
ingenting. Kodens egen kommentar sa det rakt ut, korrekt, och stod där när
felet inträffade — en anteckning är ingen grind.

## Vad som faktiskt håller

1. **Rulla ut den manuella halvan FÖRST.** En ny server som svarar en gammal
   klient är bakåtkompatibel så länge tillägget är additivt. Tvärtom öppnar
   det cache-fönstret ovan. Ordningen är inte stilistisk — den är skillnaden
   mellan ett transient fel och ett som överlever sin egen fix.
2. **Mät innehållet, inte deployen.** En version som bumpas på allt vid varje
   utrullning kan inte skilja "omdeployad" från "deployad med ny kod". En
   innehålls-hash kan: i vår instans bytte `get-persons` hash medan
   `get-events` behöll sin genom SAMMA deploy. Kontrasten är beviset.
3. **Rensa klientlagringen för den som satt i glappet** — annars bär den
   felet vidare.
4. **Ge ordningen en BÄRARE, inte bara en rad.** Ordningen var redan
   dokumenterad i runbooken när den bröts andra gången. Ett steg som heter
   "front-deployen verifierad utrullad" kan bara VERIFIERA, aldrig
   SEKVENSERA, när plattformen skickar ut fronten i merge-ögonblicket. En
   regel vars mekanism inte kan hålla den är en önskan.

   **Bäraren i vårt substrat är ett KORT, och kontrasten är mätt inom samma
   dygn.** `TASK-284.6` (*"Prod-utrullning: eventlänkens vakt och åtgärdskön"*)
   skapades `2026-08-21 11:36` som en planerad skiva i sin egen familj och stod
   `Done` när familjen stängdes. `TASK-286`-familjen fick ingen motsvarighet:
   `TASK-286.8` skapades först `2026-08-22 17:34` — efter att fronten gått live
   `16:37Z` i precis det glapp kortet skulle ha förhindrat. (Backlog-CLI:ts
   tidsstämplar är UTC; mätt mot `26ec953a`, vars `updated_date 12:36` hör till
   en commit gjord `14:36:55 +0200`.) Skillnaden mellan de två spåren låg inte i
   kunskap — båda visste att EF-halvan deployas för hand. Den låg i om
   skivningen gav den halvan en egen post med eget DoD. **Rör en familj en
   manuellt utrullad halva bär den en prod-utrullningsskiva; annars är
   utrullningen ett minne, och minnen har ingen bevakare.**

Testa därför inte bara om halvorna passar ihop i repot. Fråga vad som är ute
i produktion just nu, i båda halvorna, mätt på artefakten — en driftbild
härledd ur git är en hypotes.

Relaterat: `TASK-286.8` (instansens fulla bokföring), `TASK-289`
(`staleTime`-risken, materialiserad), `TASK-296`,
`tasks/sessions/2026-08-17-session-107.md` rad ~285–325 (den första
instansen), `CLAUDE.md` § Prod-EF-deploy körs via SKRIPTET.
