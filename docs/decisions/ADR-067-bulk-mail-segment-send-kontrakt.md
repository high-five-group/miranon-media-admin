# ADR-067: Bulk-mail på segment — send-email-kontraktet (Resend batch, två-lagers idempotens, consent-gate, revisionslogg)

- **Status:** Accepted
- **Datum:** 2026-06-28
- **Fas:** 6h (Bulk-mail på segment) — appens sista obyggda Fas 6-write-vertikal efter [ADR-066](ADR-066-skapa-event-write-vertikal-idempotens.md) (6f create-event) + [ADR-065](ADR-065-segment-regel-persistens.md) (6g segment-write). **Supersedes [ADR-015](ADR-015-send-email-direct-resend.md)** (send-kontraktet). Lyder [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) (resolution I BASEN) + [ADR-050](ADR-050-isolerad-staging-miljo.md) (bas-portabilitet per NAMN).

## Kontext

Fas 6h bygger bulk-mailutskick PÅ ett segment: en admin väljer ett segment (sparat per [ADR-065](ADR-065-segment-regel-persistens.md), eller nyberäknat), skriver ämne + mailtext, och skickar till segmentets medlemmar. Mottagar-upplösningen sker via 6g:s segment-motor (`computeMembership` i `_shared/segment-membership.ts`, beräknat medlemskap från Deltaganden). 6h är skrivaren som FYLLER `Utskickslogg` — tabellen som 6e:s `get-mail-log` läser (tom sedan Session 33, [L188](../../tasks/lessons.md)).

Pre-passet (Session 39, forensiskt L191-pass) avtäckte tre forks och en öppen fråga:

1. **ADR-015 ↔ landad `MailPayloadSchema` divergerar i grunden.** [ADR-015](ADR-015-send-email-direct-resend.md) modellerade ett **enkel-mottagar, transaktionellt** send (`to`, `subject`, `body_html`, `body_text` → `{messageId, sentAt}`, allt-eller-inget). Den blev **aldrig implementerad** — `sendEmail` är en no-op-stub i båda adaptrar (`AirtableAdapter.ts:238`, `SupabaseAdapter.ts:90`). Den landade `MailPayloadSchema` (`src/domain/schemas/MailPayload.schema.ts`) är redan **bulk-över-segment** (`amne`, `mailtext`, `segmentIds[]`, `antalMottagare?`). Granularitets-, partial-failure- och idempotens-modellerna i ADR-015 är otillämpliga på bulk.
2. **Resend-yta + per-mottagar-idempotens-lagring** var ospecificerade.
3. **Utskickslogg-fält-IDs fanns ej på disk** ([L189](../../tasks/lessons.md): schema är hypotes tills korsat mot live) → live-introspekterade i denna landning (L0 DEL 1, staging-bas `apphjj8Q7lkXCMsL4`).

Forks 1–2 avgjordes via förstaparts-research (Resend batch-API + batch-idempotens + permissive-mode). Detta ADR ÄR de avgjorda besluten. Fråga 3 är nu introspektionsbelagd (se [data-model.md §Utskickslogg](../reference/data-model.md)).

## Beslut

### D1 — Supersedera ADR-015:s send-kontrakt

[ADR-015](ADR-015-send-email-direct-resend.md):s send-kontrakt ersätts i grunden. ADR-015 var villkorligt (Fas 6e-deploy "om Mer-fliken behåller mail-vy") och blev **aldrig byggt** (no-op-stub). ADR-067 är det första riktiga send-kontraktet, **bulk-först**. ADR-015:s besluts-text bevaras oförändrad (immutabilitet); en `Superseded by ADR-067`-not läggs på dess header och dess README-status sätts till `Superseded`. ADR-015:s migrationsväg-resonemang (direct-Resend som medveten skuld → mail-event-pattern vid empirisk trigger) lever vidare som DEFERRAD tråd (durabel kö, se nedan).

### D2 — Yta: Resend `/emails/batch`

Bulk skickas via **`POST /emails/batch`** (≤100 mail/anrop), **inte** loop mot `/emails` (rate-limit-fälla vid segment >ett fåtal mottagare). Segment >100 → **sekventiella batch-anrop** (chunkning à 100, jfr `PERSON_BATCH_SIZE`-mönstret i `compute-segment`). Anropen är **429-toleranta** (backoff vid rate-limit). **Ej** Resend Broadcasts (no-code marketing-produkt med egen audience-modell; vårt segment är in-system-beräknat av 6g). Exakt rate-limit-tak verifieras vid L1 mot Resends då-aktuella dokumentation.

### D3 — Partial-failure: permissive batch-mode + distinkt status-objekt

Batch skickas i **permissive mode** (Resend-header) så att en delmängd kan accepteras även om andra rader avvisas — utfallet kollapsar **ALDRIG** till en binär flagga. Svaret är ett distinkt status-objekt med räknare:

```text
{ status: 'sent' | 'partial' | 'failed',
  requested, suppressedConsent, suppressedNoEmail, deduped, attempted, accepted,
  rejected: [{ email, reason }] }
```

`status` härleds: `failed` = 0 accepted; `partial` = ≥1 accepted ∧ ≥1 rejected; `sent` = alla attempted accepted. Synkron status = **ACCEPTANS vid submit** (Resend tog emot), **ej leverans**. Resend-klienten **kastar inte** vid radfel — koden inspekterar `error`/`errors` i svaret. Leverans / bounce / öppning ligger **UTANFÖR** 6h-scope (kräver webhook-ingestion → DEFERRAD).

### D4 — Idempotens i två lager (ände-till-ände exakt-en-gång)

- **(a) MAIL-lager (Resend, 24h):** varje batch-anrop bär en **deterministisk** `Idempotency-Key` på formen `<jobId>/b<index>` (batch-index). `jobId` = klientens `Idempotency-Key` (**UUID v4**, header-företräde + body-fallback + validering — exakt create-event-mönstret, [ADR-066](ADR-066-skapa-event-write-vertikal-idempotens.md) D3). Resends 24h-fönster gör batch-retrys säkra. **`409 invalid_idempotent_request`** (samma nyckel, ändrad payload) och **`409` vid pågående/concurrent** surfas som **distinkta** fel — **ingen blind-retry**.
- **(b) LOGG-lager (Utskickslogg):** revisionsraden mergas på en **NY additiv kolumn `Idempotensnyckel`** (singleLineText) via Airtable-nativ upsert (`performUpsert.fieldsToMergeOn: ['Idempotensnyckel']`) — exakt [ADR-066](ADR-066-skapa-event-write-vertikal-idempotens.md):s merge-mönster. Merge-fält får per Airtable-API:t ej vara beräknat → singleLineText. **Fält-namn LÅST: `Idempotensnyckel`** (introspektion bekräftade additivitet — inget befintligt fält med det namnet på Utskickslogg; jfr Eventplanering.`Idempotensnyckel`).

De två lagren ger ände-till-ände exakt-en-gång: mail-lagret hindrar dubbel-sänd inom 24h, logg-lagret hindrar dubbel-loggrad vid retry.

### D5 — Consent-grind vid send (GOLV, GDPR)

Skicka **endast** till medlemmar där `ejGodkandMail === false` (`Ej godkänd för mailutskick`, `fldbQB9BGJgB1HCg7`, **checkbox** på Personer). Exkludera-**och-räkna** (`suppressedConsent`), aldrig tyst. Segment-motorn **bär** flaggan utan att filtrera ([L195](../../tasks/lessons.md): consent buren, ej filtrerad) — **6h:s send-gate är där exkluderingen sker**. Detta är GOLV (samtycke/GDPR), skärs aldrig i enkelhetens namn.

### D6 — E-post-hygien (GOLV)

Före send: **dedupliera** på normaliserad e-post (`deduped`-räknare); medlemmar **utan** e-post **exkluderas och räknas** (`suppressedNoEmail`), aldrig tyst tappade. (SKOOL-export-paritet b7.)

### D7 — Revisionslogg via write-vertikal-mönstret (en-tabells)

En `Utskickslogg`-rad skrivs via det färskaste write-vertikal-mönstret (`_shared/field-allowlists.ts`-SSOT + `operationKey` + `getOperation`/`findDisallowedField`-grind, deny→400, requireUser→401, POST→405, `{error}`+requestId, conformance rå-skrivbevis — jfr `save-segment`/`create-event`). **En-tabells:** introspektionen visar att länken `Utskicks-ID` → Bulkutskick är `multipleRecordLinks` (**valfri**, ej obligatorisk förälder) → 6h skapar **ingen** Bulkutskick-förälder (Bulkutskick är Make-legacy-kampanjbordet; coexistens-orört). Send-skrivbara fält (introspekterade, L0 DEL 1):

| Fält | Fält-ID | Typ | Roll i loggraden |
|---|---|---|---|
| Namn på utskick | `fldWRz9ap7fxHAMkW` | singleLineText | utskickets namn |
| Skickat till | `fldnNRJHfhEQLrQkp` | multipleRecordLinks → Personer | accepterade mottagar-record-ID:n |
| Filter snapshot | `fldM7DTUDljK3POWP` | multilineText | segment/filter-ögonblicksbild |
| Mailutskick copy | `fldPCrRxwjuUa7J2R` | singleLineText | mailtext-kopia |
| Utskicks-ID | `fldqK5kGeVjVtJcS0` | multipleRecordLinks → Bulkutskick | **valfri** länk (ej satt av 6h i L0-scope) |
| `Idempotensnyckel` | _(skapas L1, additiv)_ | singleLineText | merge-nyckel (D4b) |

**`Antal skickade`** (`fldqJBTOwErzMdCAO`, formula `COUNTA({Skickat till})`) skrivs **aldrig** — härleds ur `Skickat till`. Ej skrivbara: `Datum` (createdTime), `Öppningsgrad (%)` (formula), `Antal öppnade mail` (`fldmDGQsMv8BbPWok`, link → Email Opens — opens-ingestion, DEFERRAD).

### D8 — Multipart (GOLV, leverans)

Mailet skickas som **multipart** (html + text). `html` härleds ur `mailtext`; den exakta render-källan (mall/escaping) låses vid **L2**.

### Deferrade (spekulation ovanför golvet — registrerade, ej byggda)

Per [ADR-053](ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md)-ledstjärnan (registrera, förkasta ej tyst) — registrerade som trådar:

- **Durabel kö / workpool** (ADR-015:s mail-event-pattern). Nuvarande volym (tiotal–hundratal mail/utskick, ~5–20/dag per ADR-015) → synkron EF med sekventiella batch-anrop räcker. Bygg när empirisk trigger nås. → tråd.
- **Webhook-leverans/öppning-ingestion.** Fyller `Antal öppnade mail` + `Öppningsgrad (%)` (idag formel-tomma utan opens-data). Kräver Resend-webhook-mottagare + Email Opens-skrivning. → tråd.
- **Schemalagd send** (send vid framtida tidpunkt). → tråd.

## Alternativ som övervägdes

- **Loop `/emails` per mottagare (ADR-015:s form).** Avvisat (D2): rate-limit-fälla vid segment; N HTTP-anrop seriellt; ingen batch-idempotens.
- **Binär `{sent|failed}`-status.** Avvisat (D3): kollapsar consent-/e-post-/dedup-suppression och per-rad-avvisning till en flagga → ingen operativ felsökning, ingen ärlig räkning.
- **Endast mail-lager-idempotens (ingen logg-merge).** Avvisat (D4): batch-retry efter delvis loggad skrivning ger dubbel loggrad; logg-merge ger exakt-en-gång på revisionsraden.
- **Consent-filtrering i segment-motorn.** Avvisat (D5/[ADR-064](ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md)/L195): motorn beräknar medlemskap (närvaro), consent är en send-tids-policy — olika ansvar; gaten hör till 6h.
- **Skapa Bulkutskick-förälder per send.** Avvisat (D7): länken är valfri; Bulkutskick är Make-legacy-kampanjbordet — att skriva det nu blandar in-system-send med legacy-flödet utan nytta i L0-scope.
- **Durabel kö direkt.** Avvisat: överingenjörsmässigt utan empirisk volym/incident-data (ADR-015 M4-principen) → deferrad tråd.

## Konsekvenser

**Positiva:**

- Ett ärligt bulk-send-kontrakt som ersätter den aldrig-byggda enkel-sänd-skulden; partial-failure + suppression är förstklassig, räknad utdata.
- Ände-till-ände exakt-en-gång via två oberoende idempotens-lager, båda på etablerade mönster ([ADR-066](ADR-066-skapa-event-write-vertikal-idempotens.md) + Resend 24h).
- 6h fyller Utskickslogg → 6e:s `get-mail-log` får riktig data (stänger den tomma-källa-conformance-luckan, [L188](../../tasks/lessons.md)).
- Consent-gate + e-post-hygien som GOLV → GDPR-hållbart, ingen tyst suppression.

**Negativa / skuld:**

- Ingen leverans-/öppnings-spårning (synkron acceptans ≠ leverans) → `Öppningsgrad (%)` förblir formel-tom tills webhook-ingestion-tråden byggs.
- Synkron EF utan durabel kö → en EF-timeout mitt i sekventiella batchar kan lämna ett delvis skickat jobb; mitigeras av D4:s två-lagers-idempotens (säker retry inom 24h) men inte eliminerat. Registrerat som durabel-kö-tråd.
- `Idempotensnyckel`-kolumnen på Utskickslogg måste skapas (additiv, L1) FÖRE EF:en deployas som skriver den — samma hårda ordning som [ADR-066](ADR-066-skapa-event-write-vertikal-idempotens.md) (annars fäller Airtable skrivningen).

**Beroenden:**

- **6g segment-motor** (`computeMembership`, `_shared/segment-membership.ts`) för mottagar-upplösning. 6g-EF:erna är STAGING-only (ej prod) → 6h körs mot staging tills prod-deploy (medveten separat handling).
- **Resend** (`RESEND_API_KEY` i env, ej committad), `/emails/batch`.
- **Utskickslogg** (`tblIesjbuSWNp6oxK`) + additiv `Idempotensnyckel`-kolumn (L1).

**Verifiering vid L1+ (bevis-skuld):**

- `_shared/field-allowlists.ts` får en `send-email`-operation med Utskickslogg-tableId + send-skrivbara fält (D7-listan inkl. `Idempotensnyckel`).
- Deny/allow-svit (fält utanför allowlist → 400) + idempotens-svit (replay → samma loggrad, ändrad payload → 409) + consent/e-post-suppression-svit (räknarna stämmer).
- `Idempotensnyckel`-kolumnen skapad på staging FÖRE EF-deploy (hård ordning).

## Tillägg (additivt) — 2026-06-28 (Session 41, 6h arch-audit)

> Additiv förtydligande-not. Besluts-texten (D1–D8) är **oförändrad/immutabel**; detta
> tillägg utökar status-taxonomin med ett noll-leverans-utfall och hedrar D3:s
> "partial-failure aldrig binär / ärligt utfall"-intention. Ingen ny ADR-fil
> (`check-adr-count` orörd, 67 == 67). Grund: 6h arch-audit-fynd (noll-leverans
> rapporterades som grön `sent` + skrev en fantom-Utskickslogg-rad).

- **`status`-taxonomin utökas med `'skipped'`** (utöver `sent`/`partial`/`failed`):
  `attempted === 0` (tomt segment, ELLER alla undertryckta efter consent/e-post-grinden)
  → `status: 'skipped'`, **aldrig `sent`**. Ett noll-leverans-utfall får inte maskeras
  som framgång. `sent` kvarstår = alla attempted accepterade (kräver `attempted ≥ 1`).
- **Noll-leverans skriver INGEN Utskickslogg-rad** (`logRecordId = null`). Ingen
  fantom-revisionsrad för ett utskick som inte nådde någon. Idempotens-konsistent:
  tomt → ingen rad → re-run → fortfarande ingen rad.
- **Klient-gate:** ett sparat segment som just nu beräknar 0 medlemmar blockeras
  client-side (Skicka disabled + "inga mottagare"-notis) → ingen onödig round-trip.
  Vid `accepted === 0` (noll-leverans eller allt-avvisat) renderar klienten ett
  ärligt icke-success-utfall + suppression-breakdown (aldrig grön "skickades").
- Invarianten (D3) `requested == suppressedConsent + suppressedNoEmail + deduped + attempted`
  är **oförändrad** och fortsatt api-pure-bevisad.
