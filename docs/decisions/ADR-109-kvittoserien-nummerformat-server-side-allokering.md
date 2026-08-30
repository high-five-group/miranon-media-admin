# ADR-109: Kvittoserien — nummerformat, server-side allokering, samtidighetsform och öppna punkter

- Status: Accepted (uppdragsspecificerat 2026-08-10 av Marcus via mission-
  briefen, S102 Implementation Notes a–d, kvitterat i klartext i
  huvudsessionen; byggd som TASK-147.7 av en bygg-agent i S104-batchen).
  Klarar ADR-baren (`~/.claude/CLAUDE.md` § ADR-BAR): svårt att återställa
  (ett utfärdat kvittonummer får aldrig omnumreras — en tyst kod-drift som
  bröt unikheten hade varit en bokförings-defekt, inte en UI-bugg),
  överraskande utan kontext (Airtable saknar atomisk increment — se
  Kontext) och resultat av en verklig avvägning (läs-verifiera-retry mot
  ett dedikerat reservationstabellsschema, se § Avvisade alternativ).
- Datum: 2026-08-10
- Fas: Fas 6 (Åtgärds-sidan, PRD `TASK-147`, S104-batchen)
- Relation: Ärver `ADR-067`-revisionens sändvägsmönster (`TASK-147.1`,
  `TASK-147.5` singelloop-grenen) och `ADR-063`s additiva-fält-princip
  (basen som förstklassig leverabel, resolution i basen). Konsulterar
  `docs/reference/airtable-constraints.md` §A (P1–P3) som den auktoritativa
  källan för varför Airtable strukturellt inte kan ge atomisk numrering.

## Kontext

PRD `TASK-147` (Åtgärds-sidan) kräver en kvittofunktion: Lotta ska kunna
skicka ett numrerat kvitto för en bekräftad betalning, som PDF-bilaga,
klass C i bilage-fundamentets taxonomi (`TASK-146`). Marcus fattade fyra
beslut i S102 (kortets Implementation Notes, kvitterat i klartext):

- **(a)** Appens kvittoserie ERSÄTTER Rogers manuella fakturasystems-kvitton
  för allt som prickas av i appen (Swish/Bankgiro/Plusgiro). Kvittot är en
  AKTIV handling — aldrig automatik som följer på avprickningen. Sällsynta
  faktura-fall kvitteras i Rogers system UTAN app-kvitto — en betalning
  kvitteras i exakt ETT system.
- **(b)** Format `MM-<år>-<löpnummer>`, start 1001 (`MM-2026-1001`) —
  synligt avgränsad från Rogers serie.
- **(c)** Innehåll: datum, belopp, betalsätt, event, kundnamn, Miranons
  org-uppgifter. MOMSRADEN UTELÄMNAS — öppen Roger-punkt, momsstatus måste
  bekräftas innan kvitton går skarpt till kunder.
- **(d)** En ångrad avprickning (Lotta bockar av "Mottagen" igen) efter ett
  utskickat kvitto: kvittot består med sitt nummer och sin notering.
  Kreditrutin och bokförings-export defereras till Roger-feedback senare,
  EJ v1.

**Airtable kan inte ge atomisk numrering** — den strukturella grunden för
hela detta ADR:s § Beslut 2. `docs/reference/airtable-constraints.md` §A:

- **P1** — ingen unique-constraint på ett skrivbart fält (bara det
  auto-genererade record-ID:t är garanterat unikt, och det är inte
  skrivbart).
- **P2** — inga transaktioner / ingen atomär multi-record-skrivning.
- **P3** — server-side idempotens (och därmed en race-säker räknar-tabell)
  är strukturellt omöjlig i Airtable, som en DIREKT konsekvens av P1+P2.

En naiv "läs högsta löpnummer, +1, skriv" har alltså ett race-fönster:
två samtidiga allokeringar kan båda läsa samma högsta-värde INNAN någon av
dem hunnit skriva sitt eget, och båda skulle då försöka ta SAMMA nummer.
Kortets AC #2 kräver explicit att detta race BEVISAS hanterat, inte bara
antaget bort ("unikhet under samtidighet bevisad").

**Basen har inget prisfält.** Sökt igenom `Anmälningar`- och
`Eventplanering`-tabellernas write-fält (`docs/reference/data-model.md`
§ Schema cheat sheet) samt hela domänmodellen
(`src/domain/models/Registration.ts`, `Event.ts`) och S102-sessionsdoket
— noll träffar (ADR-086 premiss-pass, 2026-08-10). Kvittots "belopp" kan
alltså inte härledas server-side; se § Öppna punkter.

## Beslut

1. **Formatet är LÅST till `MM-<år>-<löpnummer>`, start `1001` per år**
   (Marcus-beslut b). Varje år är sin egen namnrymd — 2027 börjar om på
   1001, inte en fortsättning av 2026:s serie. `MM`-prefixet är synligt
   avgränsat från Rogers manuella fakturaserie (beslut a/b), och håller
   kvittoserien läsbart skild även om siffror skulle råka kollidera.

2. **Allokeringsprotokollet är läs-högsta + skriv-med-verifikation + deterministisk
   retry** — `supabase/functions/_shared/receipt-numbering.ts`
   § `allocateReceiptNumber`. Per försök: (i) läs ALLA ledger-poster för
   året, räkna högsta löpnumret; (ii) skriv en kandidat-post DIREKT (högsta
   plus 1); (iii) läs om samma löpnummer — ensam ⇒ vunnet; (iv) flera poster
   med samma nummer ⇒ deterministisk tie-break (lexikografiskt LÄGSTA
   record-ID vinner); (v) förlorare RADERAR sin kandidat-post (`DELETE`,
   `deleteAirtableRecord`, repots FÖRSTA delete-operation) och gör om från
   (i) med ett färskt högsta-värde. **Hermetiskt bevisat, inte antaget**:
   `tests/api/receipt-numbering.test.ts` forcerar ÄKTA kollisioner via JS:s
   microtask-schemaläggning (N parallella `Promise.all`-anrop läser alla
   samma tomma ledger INNAN någon hinner skriva) — 8-vägs och 16-vägs
   samtidighet konvergerar till fullt unika, täta serier; ett
   negativ-kontroll-pass (naiv "läs-max-skriv" utan verifikation, körd
   utanför testsviten) producerade 8/8 dubbletter och bevisar därmed att
   testets `new Set(lopnummer).size===N`-assertion FÄLLER en trasig
   implementation, inte bara godkänner en korrekt.

3. **"Ingen retroaktiv omnumrering" gäller UTFÄRDADE kvitton, inte
   allokerings-kandidater.** Ett nummer som VUNNIT racet och gått till en
   accepterad sändning (Resend `accepted: true`) ändras aldrig efteråt.
   Protokollets steg (iv)–(v) ovan rör bara kandidater INNAN de nått en
   accepterad sändning — en FÖRLORAD kandidat blev aldrig ett kvitto en
   kund såg, så att ge den ett nytt nummer i nästa varv är att FULLFÖLJA en
   allokering, inte att omnumrera en existerande. Samma disciplin gäller en
   AVVISAD sändning (Resend-bounce): den reservationsraden lämnas
   OFINALISERAD (bara `Kvittonummer`/`Löpnummer`/`År` satta, aldrig
   `Skickad`) — numret hoppas över för alltid, återanvänds ALDRIG av en
   efterföljande, NY sändning för samma betalning
   (`tests/api/send-receipt.test.ts` § avvisad sändning, bevisat).

4. **Allokeringen är SERVER-SIDE, uteslutande** — klienten skickar aldrig
   ett nummer, bara betalningens identitet (registrationId + betalning).
   EF:en `send-receipt-email` (repots ÅTTONDE write-vertikal) är den ENDA
   anroparen av `allocateReceiptNumber`; `_shared/send-receipt.ts` §
   `sendReceipt` orkestrerar ordningen: icke-prod-spärr (GOLV, återanvänd
   ur `send-bulk.ts`) FÖRE allokering (ett nummer ska aldrig förbrukas för
   ett mail som inte kan skickas i miljön) → allokera → bygg PDF → sänd EN
   gång (deterministisk idempotensnyckel `<jobId>/kvitto/<registrationId>/
   <betalning>`, EGEN namnrymd, skild från åtgärdsutskickens
   `<jobId>/<actionType>/<registrationId>` och testmailets `<jobId>/test`)
   → finalisera (PATCH, ENDAST vid accepterad sändning).

5. **Ledgern och kvittots beständiga metadata är SAMMA Airtable-tabell**
   (`Kvitton`, staging `tblk8fZcArXPpRYnX`, skapad additivt via Airtable
   MCP 2026-08-10 — deklarativ hemvist `scripts/create-kvitton-table.mjs`,
   samma mönster som `scripts/create-bilagor-table.mjs`). Reservationen
   (steg 2 ovan) och finaliseringen (steg 4) skriver till SAMMA record —
   INTE två separata rader — annars hade en avvisad sändning lämnat en
   spårlös, oidentifierbar reservation kvar (`_shared/send-receipt.ts` §
   `ReceiptFinalizer` filhuvud).

6. **Ingen fält-skrivning på Anmälningar** (beslut d, beständigheten). Ett
   kvitto stämplar INGET fält på den betalning det avser — dess EGEN
   existens i `Kvitton`-tabellen ÄR beständigheten. En efterföljande
   av-bockning av betalnings-krysset (`useSetPaymentStatus`,
   `registrationPayments.ts`) rör en HELT ANNAN tabellrad och kan
   strukturellt inte påverka en redan skapad `Kvitton`-post — "kvittot
   består med sitt nummer + notering" är därför en EGENSKAP av att de två
   tabellerna aldrig kopplas ihop av någon skrivande operation, inte kod
   som måste skrivas och kan glömmas. `Notering`-fältet finns på tabellen
   (öppet för en framtida kreditrutin, beslut d) men skrivs INTE av v1 —
   "Kreditrutin + bokförings-export = Roger-feedback senare, ej v1" är
   Marcus egen avgränsning.

7. **En betalning kvitteras i exakt ETT system** (beslut a) realiseras som
   ETT `Betalning`-val per kvitto (Anmälningsavgift ELLER Slutbetalning,
   aldrig båda i samma anrop) och EN mottagare per sändning — UI-ingången
   (`AtgardsSida.tsx` § `SkickaKvittoKnapp`) sitter PER betalningsrad
   (`BetalningsSkrivYta` § `SkrivRad`), synlig ENDAST när just DEN
   betalningen redan är Mottagen. Det finns strukturellt ingen väg att
   trigga ett app-kvitto för en betalning fortfarande markerad "Ej
   mottagen".

## Öppna punkter (bygget går vidare, dessa är INTE lösta)

- **~~Momsraden~~ (beslut c) — STÄNGD 2026-08-22, se § Updates.** Ursprunglig
  öppen punkt, bevarad ordagrant för historiken (riv aldrig tyst): Rogers
  bekräftelse av momsstatus krävs INNAN kvitton går skarpt till KUNDER.
  Kvitto-PDF:en (`_shared/receipt-content.ts`) utelämnar raden helt,
  medvetet, öppet bokfört — bygget är INTE blockerat av den öppna frågan,
  men skarp drift mot verkliga kunder är det tills Roger svarat.
- **~~Miranons org-uppgifter~~ (organisationsnummer, postadress) — STÄNGD
  2026-08-22, se § Updates.** Ursprunglig öppen punkt, bevarad ordagrant
  för historiken: finns INTE dokumenterade någonstans i repot (sökt
  `docs/`, `src/`, S102-sessionsdoket — noll träffar, samma ADR-086
  premiss-pass som avtäckte avsaknaden av ett prisfält). `_shared/
  receipt-content.ts` § `MIRANON_ORG_PLACEHOLDER` bär en explicit, läsbar
  platshållartext i stället för en gissning — samma "skattefakta gissas
  aldrig"-disciplin som momsraden. Roger/Marcus måste bekräfta de
  verkliga uppgifterna innan PDF:en går skarpt.
- **Belopp och betalsätt är Lotta-inmatade i UI:t, inte serverhärledda** —
  en DIREKT konsekvens av att basen saknar ett prisfält (§ Kontext). Detta
  är en medveten designavvägning (samma "aktiv handling, ingen gissning"-
  linje som beslut a), INTE en gissning: ett framtida prisfält på
  Eventplanering/Anmälningar skulle kunna förfylla värdet, men att
  konstruera ett sådant fält låg utanför detta korts scope och nämns här
  som en möjlig framtida förenkling, inte ett krav.
- **En klient-retry FÖRE serverns svar (samma `jobId`) kan förbruka ett
  extra, aldrig-utfärdat nummer.** Resends `idempotencyKey` förhindrar att
  SJÄLVA mailet går ut två gånger, men vår EGEN allokering+PDF-generering
  sker FÖRE Resend-anropet — en omsänd request skulle allokera ett NYTT
  nummer innan den når den deduplicerade Resend-träffen. Konsekvensen är en
  övergiven, ofinaliserad `Kvitton`-rad (samma öppet accepterade läge som
  en avvisad sändning, § Beslut 3) — ALDRIG en dubbel-utskickad kvittomail
  eller ett återanvänt nummer. Ett numrerings-GAP av denna typ är samma
  accepterade konsekvensklass verkliga faktura-/kvittosystem redan lever
  med (en "voided"/aldrig-skickad post hoppas över, återanvänds aldrig) —
  inte en bugg att fixa i denna landning.
- **Facit-/ARIA-deltat.** "Skicka kvitto"-knappen är NY DOM i
  betalningspanelen (`BetalningsSkrivYta`) när en betalning är Mottagen —
  ett nytt, minimalt ARIA-delta mot den befintliga, stämpel-väntande
  facit-ytan (`tests/visual/atgardssida-promoverings-grind.spec.ts` +
  `__aria__`-snapshotarna). Deltat är EXAKT REDOVISAT i PR-body/kortets
  notes, inte tyst introducerat — self-godkännande av facit ligger
  UTANFÖR detta korts mandat (kräver Marcus-stämpel, se
  `~/.claude/CLAUDE.md`-arvet). Målad axe-scan av betalningspanelen med
  knappen synlig gav 0 överträdelser
  (`tests/acceptance/atgarder-kvitto-send.acceptance.test.ts`), så deltat
  är accessibility-rent även om det ännu inte är facit-godkänt.
- **Airtables läs-efter-skriv-konsistens** i allokeringsprotokollet (§
  Beslut 2) är inte dokumenterat momentan i ALLA lägen — samma öppet
  accepterade risk som P1/P2 drar för hela basens skrivmodell
  (`airtable-constraints.md`: "smalt multi-session-race-fönster accepterat
  öppet, single-admin-golv"). Ett extremt osannolikt fönster (två
  `listByYear`-läsningar som båda missar varandras just skrivna rader)
  ligger utanför vad protokollet strukturellt kan garantera.

## Avvisade alternativ

- **Ett dedikerat, separat "räknar-singleton"-record** (en enda rad per
  år som PATCHas atomiskt) i stället för läs-högsta-över-alla-rader.
  Avvisat: Airtable saknar `UPDATE ... WHERE version = X`-semantik (ingen
  optimistisk lås-kolumn med server-side jämförelse), så en PATCH mot en
  singleton-rad har EXAKT samma race-fönster som läs-högsta-varianten —
  den byter bara VILKEN rad som racas om, löser inget strukturellt.
- **Klient-genererat kandidatnummer** (klienten läser högsta via en GET,
  föreslår nästa). Avvisat direkt: bryter § Beslut 4 (server-side
  uteslutande) och öppnar en klient-styrd väg till kvittots viktigaste
  garanti (unikhet) — samma "mottagaren kan aldrig komma från klienten"-
  princip som resten av `TASK-147`-arket följer, tillämpad på numret
  i stället för adressen.
- **En extern, monotont ökande ID-tjänst** (t.ex. ett UUID eller en
  tidsstämpel-baserad sekvens i stället för ett tätt löpnummer). Avvisat:
  Marcus-beslutet (b) är explicit ett LÖPNUMMER från 1001, inte en
  godtycklig unik identifierare — kvittots läsbarhet för Roger/Lotta/
  kunden är en uttalad del av kravet, inte en implementationsdetalj.

## Konsekvenser

**Positiva:** unikhet under samtidighet är hermetiskt bevisad (inte
antagen), server-side allokering stänger klient-manipulation strukturellt,
kvittots beständighet (beslut d) är en arkitektonisk EGENSKAP snarare än
en regel som kan glömmas i framtida kod, och protokollet är återanvändbart
(dependency-injicerat, Node+Deno dual-importable) för en EVENTUELL framtida
räknad serie av annat slag utan att uppfinna mönstret på nytt.

**Negativa / skuld:** tre öppna punkter (moms, org-uppgifter, belopp/
betalsätt manuellt) måste stängas innan skarp kundleverans; ett smalt,
öppet accepterat numrerings-gap-läge vid klient-retry; facit-godkännandet
för den nya knappen är parkerat hos Marcus, inte klart i denna landning;
allokeringsprotokollets värsta-fall-konvergens (flera rundor vid mycket
hög samtidighet) är obegränsad i teorin även om `maxAttempts` (default 20)
ger ett hårt, namngivet fel (`ReceiptAllocationExhaustedError`) i stället
för en oändlig loop.

## Relaterat

- `docs/reference/airtable-constraints.md` §A (P1–P3) — den strukturella
  grunden för varför atomisk numrering är omöjlig i Airtable.
- `ADR-067`-revisionen + `TASK-147.5` — singelloop-sändningsmönstret
  (`ActionSingleSender`-formen) kvittots egen `ReceiptSender` speglar utan
  att literalt återanvända (se `_shared/send-receipt.ts` filhuvud för
  varför en FEMTE `ActionType` på `runActionSend` avvisades).
- `ADR-063` — additiva fält i basen, resolution i basen (Kvitton-tabellen
  följer samma princip: skapad additivt, prod orörd).
- `docs/reference/data-model.md` — Kvitton-tabellens fält-ID:n (att fylla
  i vid nästa data-model.md-revision; se PR-notes för den fullständiga
  listan tills dess).

## Updates

### 2026-08-22 — Beslut (c):s momsutelämning är UPPHÄVD; org-uppgifterna bekräftade (T170)

Två av § Öppna punkter stod som *"INTE lösta"* när detta ADR skrevs
(2026-08-10). Båda stängs av samma källa och kvittens, samma dag.

**Vad som bekräftade det.** Marcus pekade ut
`~/Desktop/Miranon Media/exempelpdokument/`, och en av filerna
(`2026-08-03 kvitto-forlaga.pdf`) visade sig vara ett SKARPT kvitto ur Rogers
fakturasystem — inte ett utkast. Bokfört i
[`tasks/threads/T170-rogers-kvittoforlaga-besvarar-tre-oppna-punkter.md`](../../tasks/threads/T170-rogers-kvittoforlaga-besvarar-tre-oppna-punkter.md)
(`pdftotext -layout`, läst 2026-08-22). Marcus kvitterade i klartext
2026-08-22: *"Allt på Rogers kvitto stämmer."* Kvittot är dessutom
oberoende omläst en andra gång (`pdftotext -layout`, samma kommando) under
byggsessionen som skrev denna post — alla siffror nedan matchade utan
avvikelse.

**Momssatsen är 25 %.** Rogers momsrad: `Netto 2 000,00 | Exkl. moms
2 000,00 | Moms 500,00 | Öresavr 0,00 | SEK | BETALT 2 500,00` —
500 / 2 000 = 25 %.

**Beslut (c) rivs ÖPPET, inte tystas.** Den ursprungliga formuleringen —
*"MOMSRADEN UTELÄMNAS — öppen Roger-punkt, momsstatus måste bekräftas
innan kvitton går skarpt till kunder"* — höll fram till denna kvittens och
är nu FALSK som beskrivning av kodens tillstånd. Den står ORÖRD i § Beslut
ovan (frysta beslutstexter ändras inte i efterhand, samma disciplin
`ADR-081` § Updates etablerade) — denna post är UPPHÄVNINGEN, inte en tyst
korrigering.

`_shared/receipt-content.ts` § `beraknaMoms` beräknar nu moms och netto:
momsen avrundas till närmaste ÖRE FÖRST (`brutto × 0,2` — momsandelen av
ett bruttobelopp vid 25 % moms, INTE 0,25), och nettot HÄRLEDS som
differensen `brutto − moms`, aldrig avrundat oberoende av momsen. Ordningen
är LÅST: avrundas båda delarna var för sig direkt ur bruttot kan raderna
sluta INTE summera exakt till bruttot — en bokföringsdefekt, bevisad (inte
bara påstådd) i `tests/api/receipt-content.test.ts` med ett konkret
motexempel (100,09 kr: oberoende avrundning ger 20,02 + 80,07 =
100,08999999999999 ≠ 100,09; den låsta ordningen håller
`netto + moms === brutto` exakt för samma belopp). `kvittoRader()` visar
de tre beloppen som egna, Gunilla-läsbara rader: `Netto` / `Moms (25 %)` /
`Betalt` — i stället för Rogers sex kolumner.

**Org-uppgifterna är bekräftade, samma källa och kvittens.** `_shared/
receipt-content.ts` § `MIRANON_ORG_PLACEHOLDER` (platshållaren) är
BORTTAGEN och ersatt av `MIRANON_ORG`:

| Fält | Värde | Kommentar |
|---|---|---|
| Firma | Miranon Media AB | Placeholdern sade "Miranon Media" — `AB` saknades |
| Organisationsnr | 559540-5498 | |
| Postadress | Uttringe Hages väg 17, 144 63 Rönninge, Sverige | |
| Momsreg.nr | SE559540549801 | Ny rad på kvittot, fanns inte i placeholder-versionen |

Kvittots ÖVRIGA sidfotsuppgifter hos Roger (Plusgiro, Swish, `www.miranon.se`,
`roger@`/`lotta@outsidereality.se`, telefonnummer, "Godkänd för F-skatt")
togs MEDVETET INTE med. Det är betalningsvägar och kontaktuppgifter för en
FAKTURA — Rogers mall är en återanvänd fakturamall (T170 § Post 3
noterar redan att ett KVITTO från samma mall bär ett `Förfallodatum`-fält,
ett faktura-artefakt) — inte information en kund som REDAN BETALAT behöver
på sitt kvitto. Att ärva dem hade varit att ärva en artefakt av Rogers
mallval, inte en avsikt för vårt eget kvitto.

**Vad som INTE ändras av denna post.** § Beslut 1–7 (nummerformatet,
allokeringsprotokollet, samtidighetsbeviset, server-side-exklusiviteten,
beständigheten, en-betalning-i-ett-system) är alla ORÖRDA. Övriga öppna
punkter i § Öppna punkter (belopp/betalsätt Lotta-inmatat, klient-retry-
gapet, facit-/ARIA-deltat, läs-efter-skriv-konsistensen) kvarstår öppna,
oförändrade av denna post.

### 2026-08-22 — Beslut (c) utökas: köparens e-post + Rogers beloppsformat (S108, Marcus-beslut)

Samma dag, samma tråd (T170), ett andra Marcus-beslut, ordagrant: *"matcha
Rogers beloppsformat och ta med e-posten."* Beslut (c) ovan står ORÖRD
(frysta beslutstexter ändras inte i efterhand) — denna post är en
UTÖKNING, inte en rivning.

**Beloppsformatet byter till Rogers.** `_shared/receipt-content.ts` §
`formatBelopp` gav tidigare `"2500 kr"`/`"133,50 kr"` (heltal utan
decimaler, `kr`-suffix på varje rad). Rogers kvittoförlaga (T170) skriver
i stället `2 000,00` — sv-SE-tusentalsavgränsare, ALLTID två decimaler,
INGEN valuta per rad — och reserverar valutakoden (`SEK`) för EN prefix på
BETALT-raden. `formatBelopp` ger nu exakt den formen; `kvittoRader()`
prefixar `SEK` på Betalt-raden, Netto/Moms är utan valutakod.

**Ett genuint plattformsval låg dolt i detta, inte bara en strängändring.**
`Intl.NumberFormat('sv-SE')`s grupperingstecken skiljer sig mellan
ICU-versioner (U+00A0 NBSP äldre CLDR, U+202F NNBSP nyare CLDR) — och
pdf-lib/WinAnsiEncoding (`StandardFonts.Helvetica`, `_shared/
receipt-pdf.ts`) kan INTE koda U+202F: verifierat mot en isolerad
pdf-lib-installation, `page.drawText` kastar `WinAnsi cannot encode " "
(0x202f)`. Utan normalisering hade PDF-renderingen kraschat för varje
belopp ≥ 1000 kr om körmiljön (Deno/Supabase Edge Runtime) råkade ge det
nyare tecknet — en risk som aldrig syns lokalt (Node i byggmiljön gav
U+00A0, inte U+202F). `formatBelopp` normaliserar därför ALLTID
grupperingstecknet till ett vanligt mellanslag (U+0020), oavsett vilket av
de två körmiljön ger — se funktionens egen docstring för hela
resonemanget och `tests/api/receipt-content.test.ts` för regressionstestet
som bevisar det (byte-nivå, inte bara en synlig strängjämförelse).

**Köparens e-post är med.** `KvittoradSpec` bär nu `kundEpost: string`,
och `kvittoRader()` skriver den som en egen rad direkt under kundnamnet —
samma Fakturaadress-ordning (namn → e-post) som Rogers förlaga. Adressen
härleds SERVER-SIDE, samma "kan aldrig komma från klienten"-linje som
mottagarens namn (`send-receipt-email/index.ts` § filhuvud): den redan
lästa `ReceiptSendInput.email` (Anmälans `E-post`-fält) trådas nu genom
`ReceiptPdfBuilder`s spec (`_shared/send-receipt.ts`) i stället för att
bara användas som sändningsadress. `preview-receipt`s typexempel bär en
fiktiv adress (`anna.andersson@example.com`) — aldrig en verklig kunds.

**Vad som INTE ändras av denna post.** § Beslut 1–7 och den föregående
Updates-postens moms-/org-innehåll är ORÖRDA. § Öppna punkter kvarstår
oförändrade — ingen av dem rörde beloppsformat eller e-post.

### 2026-08-22 — Datumet blir ISO, adressen blir tre fält (S108, Marcus-beslut "Kör dina rekommendationer")

Samma dag, samma tråd (`T170`), MARCUS-SEKVENS punkt 2 kvitterad: en
kvitto-agent byggde `kvitto.html`/`kvitto.css` mot förlagan (PR #1781), och
orkestreraren mätte tre synliga avvikelser i slutbilden. En av dem —
sidfotens adress radbröt mitt i postnumret ("…väg 17, 144 / 63 Rönninge,
Sverige") eftersom `MIRANON_ORG.adress` (§ Updates 2026-08-22 ovan) är EN
sträng men mallens sidfotskolumn är smal — ledde till Marcus dom på
slutbilden, ordagrant: *"Kör dina rekommendationer"*. Källa:
`tasks/sessions/2026-08-20-session-108.md` § Del 9 C.

**Två ändringar, båda i `_shared/receipt-content.ts`:**

1. **`formatKvittoDatum` byter till ISO (`YYYY-MM-DD`).** Gav tidigare
   `"3 augusti 2026"`. Ett kvitto är en bokföringshandling — ISO är den
   entydiga, sorterbara formen, och den råkar dessutom matcha Rogers egen
   datumsträng exakt (`"2026-08-03"`, `pdftotext -layout` mot förlagan).
   UTC-baserad (som tidigare) — ingen tidszons-rollover vid ett årsskifte.
   `git grep formatKvittoDatum` gav EN konsument (`kvittoRader()` i samma
   fil) före denna ändring — ingen annan konsument (mailets brödtext i
   `send-receipt-email/index.ts` skriver inget datum alls) behöver den
   svenska datumtexten, så ingen bevarande-funktion byggdes.
2. **`MIRANON_ORG.adress` (en sträng) blir tre fält** —
   `gatuadress`/`postadress`/`land` — Rogers egen radindelning
   ("Uttringe Hages väg 17" / "144 63 Rönninge" / "Sverige"). `kvittoRader()`
   skriver dem som tre separata rader i stället för en.

**Mallen och fixturen följer med.** `docs/mallar/bilagor/kvitto.html`s
sidfotskolumn bär nu `{{orgGatuadress}}`/`{{orgPostadress}}`/`{{orgLand}}`
som tre `<p>`-element i stället för en `{{orgAdress}}` — fem rader i
sidfotskolumnen (org-namn/gata/postort/land/webb), samma antal som
förlagans egen sidfot. `{{datum}}`-tokenet är oförändrat till namnet;
värdet det fylls med byter form. `fixtures/kvitto.exempel.json` bär de nya
fälten och ISO-datumet.

**"Betalsätt"-raden rörs INTE** — Marcus dom omfattade explicit bara
datum och adress; raden är oförändrad i både `kvittoRader()` och mallen.

**Vad som INTE ändras av denna post.** § Beslut 1–7 och de två föregående
Updates-posternas moms-/org-/beloppsinnehåll är i övrigt ORÖRDA — org-namnet,
org-numret och momsregistreringsnumret är samma strängar som innan, bara
adressfältet är omformat. § Öppna punkter kvarstår oförändrade.

### 2026-08-30 — Kvittot blir per INBETALNING och skickas som ett jobb: (a) omformas, beslut 2, 5 och 7 rivs, (d) tas in i v1, beloppspunkten stängs (S113 Del 11)

Grillningen om Lottas betalningsflöde (S113 Del 11, tretton kvitterade
beslut) river fyra av denna ADR:s premisser samtidigt. Rivningen sker
ÖPPET här; § Beslut och § Öppna punkter ovan står ORÖRDA (frysta
beslutstexter ändras aldrig i efterhand — samma disciplin `ADR-081`
§ Updates etablerade och de tre föregående posterna följer).
Lagringsvalet som gör rivningen möjlig bor i
[`ADR-128`](ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md),
jobbmotorn i [`ADR-129`](ADR-129-jobbmotorn-ko-cron-och-kick.md).

**Vad som faktiskt ändrades i verkligheten:** appen får en domänpost
`Inbetalning` — en post per bankrad, i Supabase Postgres — och kvittot
avser exakt EN sådan post. Den posten fanns inte när denna ADR skrevs
2026-08-10; basen hade inte ens ett prisfält (§ Kontext säger det rakt
ut). Fyra av besluten nedan vilar på just den avsaknaden.

#### Beslut (a) OMFORMAS: registrera först, skicka sedan

Marcus ursprungliga beslut (a) sade att kvittot är *"en AKTIV handling —
aldrig automatik som följer på avprickningen"*. **Den principen står och
förstärks.** Vad som omformas är HANDLINGEN: avprickningen finns inte
längre som begrepp, och den aktiva handlingen är inte längre "tryck på
kvittoknappen på en betalningsrad".

Ny form (Del 11 beslut 3, reviderad av Marcus egen fråga *"klickar hon på
skicka kvitto så går kvittot iväg till alla 8 samtidigt eller?"* — som
avslöjade den bättre formen): Enter **registrerar** inbetalningen utan
att skicka något. Rutan *Skicka kvitto* är **förbockad** och betyder *ta
med i nästa sändning*, inte *skicka nu*. En stående knapp *Skicka N
kvitton* skickar alla väntande som ETT jobb. `⌘`/`Ctrl`+Enter =
*Registrera och skicka* för den enstaka tisdags-Swishen.

Kvittot är alltså fortfarande aldrig automatik — men granskningen kommer
före skicket, vilket den inte gjorde förut. Beslut (a):s andra hälft
(*"en betalning kvitteras i exakt ETT system"*) är oförändrad; sällsynta
fakturafall kvitteras fortsatt hos Roger utan app-kvitto.

#### Beslut 2 RIVS: allokeringsprotokollet ersätts av en databassekvens

Beslut 2:s läs-högsta + skriv-med-verifikation + deterministisk retry är
korrekt och hermetiskt bevisat — och en **kompensation för en vägg som
inte finns i Postgres**. Protokollet existerar enbart därför att Airtable
saknar unique-constraint och transaktioner
([`airtable-constraints.md`](../reference/airtable-constraints.md) §A,
P1–P3), vilket § Kontext ovan säger uttryckligen.

Med kvittoledgern i Postgres (`ADR-128` beslut 3–4) tas numret ur en
**sekvens per år**, och dubbelskick stängs av en **unik nyckel per
inbetalning** i stället för av ett protokoll. Sekvensen startar efter det
högsta befintliga numret i respektive miljö (prod: 0 kvitton, mätt
read-only 2026-08-30; staging: max `MM-2026-1002`).

**Vad rivningen INTE innebär:** den samtidighetsegenskap beslut 2 fick
bevisa är inte uppgiven, den är flyttad från kod till databas.
`tests/api/receipt-numbering.test.ts` och dess negativa kontroll behåller
sitt värde som historik över varför Airtable-vägen såg ut som den gjorde;
den nya vägen bär sitt eget bevis i `TASK-346.3`/`346.4`.

#### Beslut 5 RIVS: ledgern är inte längre Airtable-tabellen `Kvitton`

Beslut 5 slog fast att ledgern och kvittots beständiga metadata är SAMMA
Airtable-tabell (`Kvitton`, staging `tblk8fZcArXPpRYnX`). Ledgern flyttar
till Postgres (`ADR-128` beslut 3). Reservation-och-finalisering-i-samma-
rad-formen (skälet i beslut 5:s andra hälft: en avvisad sändning ska inte
lämna en spårlös reservation) **bevaras** i den nya tabellen — det var
formens poäng, inte tabellens hemvist.

Airtable-tabellen `Kvitton` pensioneras i `TASK-346.12`, efter promovering
— inte i denna post, och inte förrän den nya ledgern bär allt.

#### Beslut 7 RIVS: ett kvitto avser en INBETALNING, inte ett `Betalning`-val

Beslut 7 realiserade *"en betalning kvitteras i exakt ETT system"* som ETT
`Betalning`-val per kvitto (Anmälningsavgift ELLER Slutbetalning), med
UI-ingången per betalningsrad, synlig endast när just den betalningen
redan var Mottagen.

Hela den konstruktionen bygger på att facken är något man BOCKAR I. Efter
Del 11 beslut 7 **härleds** facken ur summan mot priset (`ADR-128`
beslut 2) — Lotta väljer aldrig fack, så det finns inget val att fästa ett
kvitto vid. Kvittot fäster i stället vid inbetalningen, som är en verklig
händelse med ett belopp och ett datum.

Beslut 7:s SKÄL — att en betalning kvitteras i exakt ett system — står
oförändrat och bärs nu av den unika nyckeln per inbetalning.

#### Beslut 6: GARANTIN står, MEKANISMEN rivs

Beslut 6 sade *"Ingen fält-skrivning på Anmälningar"* och byggde kvittots
beständighet på att de två tabellerna aldrig kopplas ihop av någon
skrivande operation.

**Garantin står och förstärks:** kvittoledgern ligger nu i en HELT ANNAN
DATABAS än anmälan, så ingen Airtable-operation kan strukturellt påverka
en utfärdad kvittopost. Beständigheten är fortfarande en egenskap av
arkitekturen, inte kod som kan glömmas.

**Mekanismen rivs:** appen skriver numera fält på `Anmälningar` — de två
valfälten, `Summa inbetalt (kr)` och kvittonumret — som en **spegel**
(`ADR-128` beslut 5), så att Lottas vyer, automation A7 och rollups
fungerar orörda. Meningen *"Ett kvitto stämplar INGET fält på den
betalning det avser"* är därmed FALSK som beskrivning av kodens tillstånd
framåt. Spegeln är dock aldrig sanningen, bara en projektion: raderas ett
spegelvärde ändras inget kvitto.

**Divergens mellan källorna, bokförd öppet (ADR-086).** Kortet
`TASK-346.1` AC #4 och PRD:ns § ADR-koppling listar *"beslut 1, 3, 4, 6
står"* och river 2, 5, 7. Verifieringsrapporten
([`verifiering-kvittoskivning-afk-natt-2026-08-30.md`](../research/verifiering-kvittoskivning-afk-natt-2026-08-30.md)
§ 3.1 punkt 3) listar i stället 5, 6, 7 — och pekar uttryckligen ut att
*"spegeln är exakt det"* beslut 6 förbjuder. Båda har rätt om olika saker:
kortet om garantin, rapporten om mekanismen. Denna post följer därför
unionen — 2, 5 och 7 rivs helt, 6 rivs till sin mekanism med garantin
kvar — i stället för att välja en källa och tysta den andra.

#### Beslut (d) UTÖKAS: kreditkvitto tas in i v1

Marcus ursprungliga (d) deferrade kreditrutinen: *"Kreditrutin och
bokförings-export defereras till Roger-feedback senare, EJ v1."*

Del 11 beslut 9 tar in **kreditkvittot i v1** (orkestrerarens andra
reversering under grillningen; skälet till att det låg utanför var *ärvt
scope, inget tekniskt*). Formen: radera före kvitto; makulera efter
(med skäl — kvittot består, märkt makulerat); återbetalning = en negativ
inbetalning; kreditkvitto med **nästa nummer i samma serie** och
hänvisning till originalet, samma trigger som kvittot.

**Bokförings-exporten till Roger är fortsatt deferrad** — den halvan av
(d) står oförändrad.

#### Öppen punkt STÄNGD: "belopp och betalsätt är Lotta-inmatade"

Den öppna punkten löd: *"Belopp och betalsätt är Lotta-inmatade i UI:t,
inte serverhärledda — en DIREKT konsekvens av att basen saknar ett
prisfält"*, och pekade själv ut lösningen: *"ett framtida prisfält på
Eventplanering/Anmälningar skulle kunna förfylla värdet"*.

Det fältet byggs nu (`ADR-128` beslut 7, skiva `TASK-346.2`): numeriska
`Pris (kr)` och `Anmälningsavgift (kr)` BREDVID fritexten, plus ett
frivilligt `Avtalat pris` per anmälan. Beloppet blir därmed **härlett och
föreslaget** — belopps-knappar `1 000 · anmälningsavgift`, `2 500 · allt`,
`annat…` — i stället för fritt inskrivet. Betalsättet är förvalt till det
senast använda.

**Punkten stängs, men inte till "serverhärlett".** Lotta kan alltid skriva
ett annat belopp (banken visar vad den visar, och `2 500,00` ska tas emot
som det står). Skillnaden är att gissningen är borta: appen vet priset och
föreslår, i stället för att kräva ett handskrivet tal utan facit.

#### Vad som INTE ändras av denna post

§ Beslut **1** (formatet `MM-<år>-<löpnummer>`, start 1001 per år), **3**
(ingen retroaktiv omnumrering av utfärdade kvitton; hoppade nummer
återanvänds aldrig) och **4** (allokeringen är SERVER-SIDE uteslutande —
konsumenten i `ADR-129` är en Edge Function, alltså fortsatt server-side)
är ORÖRDA. De tre föregående Updates-posternas moms-, org-, belopps- och
datumformat är likaså orörda. Kvarvarande öppna punkter — klient-retry-
gapet, facit-/ARIA-deltat och Airtables läs-efter-skriv-konsistens —
kvarstår formellt, men de två sistnämnda får ny hemvist när ytan byggs om
(`TASK-346.7`) respektive förlorar sin grund i takt med att ledgern
lämnar basen.
