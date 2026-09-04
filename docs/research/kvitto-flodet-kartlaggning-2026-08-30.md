---
owner: marcus803
updated: 2026-08-30
review_by: 2026-11-30
status: stable
---

# Kvitto-flödet i dag — kartläggning ur koden (underlag för grillning)

> **Syfte:** Marcus fråga 2026-08-30 (S113 resume 3): *"Hur kan Lotta jobba
> med kvitton i dag? Kan hon 'lägga med' kvitton när hon skickar
> deltagarinformation till alla deltagare — 20 deltagare → 20 unika kvitton
> genererade före utskicket?"* Läst ur kod och styrande docs av en
> utforskaragent (Explore, very thorough), de bärande påståendena
> verifierade rad för rad av orkestreraren. Inget ändrat. Radnummer gäller
> `main` @ `2b3d105c`.

## Kort svar

**Nej — går inte i dag, varken automatiskt eller manuellt i bulk.** Kvittot
är en aktiv handling per betalning med exakt en UI-ingång, edge-funktionen
tar en mottagare per anrop, kvitton kan inte väljas i utskickets
bilageväljare, och utskicket bifogar samma fil till alla. Den hårda
blockeraren är datan: inget numeriskt belopp per anmälan i basen.

## (a) Flödet som Lotta upplever det

1. Åtgärder → betalningspanelen: bocka *Anmälningsavgift*/*Slutbetalning*
   som **Mottagen** (`src/components/events/atgarder/AtgardsSida.tsx:1297–1336`).
2. Först då syns **Skicka kvitto** på den raden — kvittoseriens ENDA
   UI-ingång (`AtgardsSida.tsx:1144`, `:1333–1335`). Aktiv handling, aldrig
   automatik (Marcus-beslut a, `ADR-109:27–31`).
3. Dialog: **belopp** + **betalsätt** (Swish/Bankgiro/Plusgiro), båda
   obligatoriska, inmatade för hand (`AtgardsSida.tsx:1175–1177`, `:1261–1281`).
4. Skicka → serverns svar visas: *"Kvitto skickat — MM-2026-1001 skickat
   till {namn}"* eller felskäl (`AtgardsSida.tsx:1246–1255`).
5. Kunden får mail med PDF-bilagan. **Lotta får ingen kopia, ingen
   nedladdning, och PDF:en sparas aldrig** (`_shared/send-receipt.ts:258`
   `lagringsnyckel: null`; finalizern hoppar över fältet,
   `send-receipt-email/index.ts:215`). Kvittot finns bara i mailet.
6. Aktivitetsloggen: "skickade kvitto" (`src/data/mutations/receipts.ts:64–81`).

**Bilagor-ytans "Betalningskvitto"** (Skapa bilaga ▾, `DokumentYta.tsx:292`)
är bara en förhandsvisning av formen med typexempel och numret
`FÖRHANDSVISNING` (`preview-receipt/index.ts:114`, `:124–131`); "Ladda ner"
revs i S113 Del 8 för kvittoseriens integritet (`DokumentYta.tsx:2340–2353`).

## (b) Den tekniska kedjan

| Steg | Var |
|---|---|
| Knapp + formulär | `AtgardsSida.tsx:1160–1293` |
| Mutation (`idempotencyKey: crypto.randomUUID()`) | `src/data/mutations/receipts.ts:44–58` |
| Adapter-kontrakt | `src/data/adapters/DataSourceAdapter.ts:317` (`sendReceipt`), `:636` (`previewReceipt`) |
| POST mot EF | `src/data/adapters/AirtableAdapter.ts:640–641`; schema `src/domain/schemas/SendReceipt.schema.ts:9–12` |
| Skarp EF | `supabase/functions/send-receipt-email/index.ts` — validerar `registrationId`/`eventId`/`betalning`/`belopp`/`betalsatt` + UUID v4 Idempotency-Key (`:327–360`); mottagare läses server-side (`:56`, `:244–260`) |
| Orkestrator (DI) | `supabase/functions/_shared/send-receipt.ts:182–208`: utskicksspärr → icke-prod-spärr → allokera nummer → PDF → sänd en gång → avvisad = `failed` utan finalisering → accepterad = PATCH Kvitton → städa utkast |
| Kvittonummer | `MM-<år>-<löpnummer>` från 1001 per år (`_shared/receipt-numbering.ts:52–57`, `ADR-109:67–71`); server-side (`ADR-109:104–114`); egen `Kvitton`-ledger (prod `tblZC6jBQIHiuS24a`, `data-model.md:152`) med läs-högsta → skriv kandidat → läs om → tie-break → förlorare raderar (`receipt-numbering.ts:107–152`), kollisionsbevisat 8-/16-vägs (`tests/api/receipt-numbering.test.ts`, `ADR-109:81–89`) |
| Mall | `docs/mallar/bilagor/kvitto.html` + `kvitto.css`, Eta via DocRaptor/Prince (`_shared/mall-render.ts` `renderaMallPdf('kvitto', …)`), speglad till `_shared/mallar/kvitto.html.ts` (autogenererad, paritetsgrind `scripts/check-mallparitet.sh`) |
| Data | `byggKvittoData` (`_shared/mall-data.ts`) + `_shared/receipt-content.ts` (moms 25 % avrundad först, `formatBelopp`, ISO-datum, `kvittoBenamning` `:271–295`, `MIRANON_ORG` `:91–105`); läser fem Event-fält (`send-receipt-email/index.ts:290–303`, `data-model.md:1028–1041`) |
| E-post | Resend `/emails` singel (`send-receipt-email/index.ts:164–200`), ämne `Kvitto MM-2026-1001`, PDF-bilaga `<kvittonummer>.pdf`; idempotensnyckel `<jobId>/kvitto/<registrationId>/<betalning>` (`_shared/send-receipt.ts:172–179`) |

## (c) De fyra hindren för "20 kvitton vid utskicket"

1. **En ingång per betalningsrad**, synlig först när betalningen är Mottagen
   (`ADR-109:138–145`). 20 deltagare = 20 dialoger, 20 belopp.
2. **EF: en mottagare, en betalning per anrop** — bulk-brygga är
   "parkerad idé", ingen knapp (`_shared/send-receipt.ts:20–28`, verbatim:
   *"inget tekniskt hinder mot en framtida bulk-brygga (samma orkestrator
   anropad i loop av en klientsida bulk-knapp), men ingen sådan knapp finns
   i v1"*).
3. **Klass C (kvitto) är strukturellt frånvarande i bilageväljaren** — den
   listar `Bilagor`-rader; ett kvitto uppstår vid sändtillfället
   (`AtgardsSida.tsx:395–400`).
4. **Utskicket bifogar samma bytes till alla** (`_shared/send-action-email.ts:650–661`);
   ett kvitto är unikt per mottagare (`_shared/send-receipt.ts:8–16`).

**Det som finns:** åtgärd nr 3 `eventinfo` *"Skicka deltagarinformation"*
(`src/components/events/atgarder/atgardsmallar.ts:65–71`) går via
`send-action-email` med `attachmentIds` (`AtgardsSida.tsx:2172`) — delade
bilagor (klass A/B) till alla markerade, aldrig något unikt per person.

**Datan:** `ADR-109:58–63` — inget prisfält i `Anmälningar`/`Eventplanering`.
Nyans: `Eventinnehåll` (`tblwqaBrkm6hJPITd`) och **Eventplanerings
`(bilagetext)`-fält** bär `Pris`/`Anmälningsavgift`/`Resterande belopp` — som
**fritext** (`singleLineText`, `data-model.md:517`, `:539`), inte belopp per
anmälan. **Rättelse 2026-08-30 (appvandringen, S113 resume 4):** denna rad
sade tidigare att `Platser` (`tbl7ER0wNqAZ9ZhEq`) bar prisfälten — fel;
Platser bär Namn/Adress/Parkering/Transport/Kläder och en
Eventplanering-spegel (`data-model.md:526–530`), inga priser. Rad 539 är
Eventplanerings `(bilagetext)`-kopia. I staging är fritextpriserna dessutom
tomma för Fjärrskådning/Utbildning (vandringens skärmdump 25).

## (d) Styrande beslut, kort, trådar

- `ADR-109` (styrande; sju beslut, fem öppna punkter `:147–199`, tre
  Updates) · `ADR-124` (förhandsvisningens utkast i Storage) · `ADR-125`/
  `ADR-119` (renderingsvägen) · `ADR-063`.
- Kort: `TASK-147.7` (bygget) · `304` · `306` · `302.3` · `274`
  (utskicksspärren) · `147.9` steg 7 (QA av kvittoflödet — obockat go/no-go,
  `tasks/marcus-listan.md:670–690` punkt 24) · `309.11` (parkerad).
- Trådar: `T170` (active), `T171` (active), `T176` (closed).
- **Inget kort finns för bulk-kvitto** (grep `backlog/tasks/`, `drafts/`,
  `todo.md`, `marcus-listan.md`); idén finns bara som kommentar.

## (e) Fällor att bära in i grillningen

1. Numret kan hoppa, aldrig dupliceras/återanvändas (`ADR-109:91–102`).
2. Klient-retry före serversvar förbrukar ett nummer (`ADR-109:171–181`).
3. Airtables läs-efter-skriv är inte momentan — accepterad risk på
   single-admin-golv (`ADR-109:193–199`); **förvärras mest av 20 parallella
   allokeringar**.
4. `maxAttempts: 20` → HTTP 503 (`receipt-numbering.ts:118`).
5. Icke-prod: bara Resends testadresser (`_shared/send-receipt.ts:218–220`).
6. Belopp/betalsätt är alltid handpåläggning (`ADR-109:164–170`).
7. PDF:en lagras inte alls (`lagringsnyckel: null`) — starkare än P28.

## (f) Osäkert ur koden

- Om `lagringsnyckel: null` är ett medvetet v1-beslut (ingen ADR-punkt
  hittad, till skillnad från `Notering`, `ADR-109:133–136`).
- Om `TASK-147.9` steg 7 körts.
- Roger-avstämningen om gränsen mot hans fakturasystem (PRD 147 rad 91,
  `#10` obockad).
- `kvittoRader()` i `receipt-content.ts:22–27` saknar konsument sedan
  `TASK-309.5` — "kandidat för mailtext-koppling eller rivning".

## Orkestrerarens utlåtande (inte beslut)

Behovet är rätt — Lotta ska inte klicka 20 gånger — men kvittot hör till
**betalningen**, inte till informationsrundan: koppla det till
deltagarinfo-utskicket och du får kvitton till de som inte betalat klart,
inget till den som betalar efteråt, och en trasig sändning nr 12 bränner
ett nummer mitt i ett annat jobb. Bättre form: bulk-handling i Åtgärder
(*"Skicka kvitto till alla med mottagen betalning"*) matad av ett
**numeriskt pris per event**, per-mottagare-utfall (utskickens disciplin),
och en regel för fel mitt i serien. Tre öppna beslut → grillning.
