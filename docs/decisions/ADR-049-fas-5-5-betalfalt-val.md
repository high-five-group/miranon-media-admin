# ADR-049: Fas 5.5 write-slice skriver Anmälningsavgift, inte Status

- **Status:** Accepted
- **Datum:** 2026-06-13
- **Fas:** 5.5 (vertikal write-slice — Session 18 K1)

## Kontext

Fas 5.5 etablerar mutation-mönstret genom en minimal vertikal slice:
"markera anmälan som betald" via befintlig `update-record` Edge Function
med en ny `operationKey` (inga nya EF-deploys). Vid sessionsstart-
orienteringen (2026-06-13, HEAD 9881403) korslästes byggplanens scope mot
den faktiska datamodellen och en divergens hittades:

- [ADR-016](ADR-016-tanstack-optimistic-mutation-pattern.md):s kodexempel
  och byggplanens Fas 5.5-DoD (§4, "endast Status-fält") antar att
  operationen skriver fältet **`Status`** (`fldWr5cCPNx9HEKtL`).
- Men `Status` är `RegistrationStatus` — sex värden (Obekräftad, Bekräftad
  (mail skickat), Betalningspåminnelse skickad, Avbokad/Ombokad, Flytta
  till väntelista, Inställt; [data-model.md:191](../reference/data-model.md)).
  **Inget av dem är "Betald".** Betald-konceptet bor i separata betalfält i
  Anmälningar:
  - `Anmälningsavgift` (`fldJtKQ3qLxRKOvR6`, singleSelect: Mottagen / Ej mottagen)
  - `Slutbetalning` (`fldIImadnJUZHr5Qh`, singleSelect: Mottagen / Ej mottagen / Ej relevant (för föreläsningar))
  - `Betalning mottagen (psionautics-event)` (`fldQE6aPiFfwVmJQ3`, checkbox)

ADR-016:s `fields: { Status: 'Bekräftad (mail skickat)' }`-exempel var
alltså pre-Fas-2.5-drift: "betald" mappade aldrig korrekt mot ett
Status-värde. Marcus låste fält-valet vid K1-start.

Synk-gate 2 (handshake per Fas 5.5/6-operation, per A4) kördes före
skrivning: fältnamnet `Anmälningsavgift` bekräftades mot 06a-status
([`06a-airtable-redesign.md`](../research/datamodell-research/06a-airtable-redesign.md)
rör `Status`/aktiv-formel/mailfält, inte avgiftsfältet) och
[`06b-supabase-target.md`](../research/datamodell-research/06b-supabase-target.md)
(noll träffar på avgiftsfältet → ingen target-rename). Ingen divergens.

## Beslut

Operationen `mark-registration-fee-paid` skriver fältet
**`Anmälningsavgift`** i Anmälningar (`tbloOcrppVoyrHbrq`) till värdet
`'Mottagen'`. `allowedFields: ['Anmälningsavgift']` — endast detta fält,
deny-by-default på allt annat.

operationKey-namnet (`-fee-paid`, inte `-paid`) lämnar medvetet rum åt en
framtida slutbetalnings-operation: betalning är i praktiken tvåstegs
(avgift först, slutbetalning sedan), och Fas 5.5-slicen täcker steg ett.

Test-uppsättningen som faktiskt levereras i K1 (justerad efter CI-fyndet,
Öppen tråd 1):

- **`deny: okänd operation → 400` aktiv** — korrekt oavsett EF-deploy.
- **`deny: fält utanför allowlist` + `deny: recordId-prefix`** är skrivna
  med `operationKey: mark-registration-fee-paid` + `Slutbetalning` som
  förbjudet fält, men `test.skip` tills `update-record` omdeployats till
  staging (annars svarar deployad EF "Unknown operation", inte de
  operations-specifika 400-vägarna). Båda fäller i EF:ens valideringssteg
  **före** Airtable-anropet → inget record behövs, ingen mutation.
- **Allow-testet deferrat** med exakt aktiverings-villkor: redeploy +
  muterbart staging-record + read-restore-teardown +
  `TEST_REGISTRATION_RECORD_ID`-secret.
- **Auth-/anonym-deny (401) dupliceras inte här** — den täcks av den
  delade `requireUser`-gatewayen och bevisas i require-user-sviten
  ([tests/api/require-user.staging.test.ts](../../tests/api/require-user.staging.test.ts)),
  som gäller alla Edge Functions inkl. update-record.

## Alternativ

- **`Slutbetalning`** — avvisat som förstaslice: tre-värdes-fält med
  `Ej relevant (för föreläsningar)`-specialfall som komplicerar den
  minimala mallen. Blir en egen operation (`mark-final-payment-…`) senare.
- **`Betalning mottagen (psionautics-event)`** — avvisat: smalast (checkbox,
  endast psionautics-eventspår), inte representativ mall för Fas 6.
- **`Status`** (ADR-016/byggplanens antagande) — avvisat: fältet saknar
  betald-värde; vore semantiskt fel skrivning.

## Konsekvenser

- Mönstret blir mall för Fas 6:s mutationer (operations-baserat API +
  optimistic UI), nu med korrekt fält-mappning från start.
- **Superseder ADR-016:s `Status`-kodexempel** (fält-nivån, inte hela
  mönstret): mutationen riktar `Anmälningsavgift`, inte `Status`. En
  öppen erratum-rad lagd i ADR-016 vid kodexemplet (ej tyst patch).
- Byggplanens Fas 5.5-DoD-formulering "endast Status-fält" är nu inaktuell
  i fält-detaljen — flaggad som öppen tråd, ändras inte i denna klunga
  (styrande-dok-ändring, eget beslut).

## Öppen tråd 1 — EF-redeploy krävs för operations-specifika tester

**Empiriskt fynd (CI-run 27463508240):** att registrera operationen i
`field-allowlists.ts` påverkar INTE staging förrän `update-record`-EF:en
**omdeployas** — den delade filen bundlas in i funktionen vid deploy, och
CI har inget deploy-steg (staging-testerna kör mot senast manuellt
deployade version). Före redeploy returnerar den deployade EF:en
`"Unknown operation: mark-registration-fee-paid"` (registret tomt).

Konsekvens för testerna ([update-record.staging.test.ts](../../tests/api/update-record.staging.test.ts)):

- `deny: okänd operation → 400` — korrekt oavsett deploy (aktiv).
- `deny: fält utanför allowlist` — kräver deployad operation (annars
  "Unknown operation" istället för "not allowed"). `test.skip` tills
  redeploy.
- `deny: recordId-prefix` — pre-redeploy passerar den för FEL anledning
  (får 400 via "Unknown operation", når aldrig prefix-checken i steg 3).
  `test.skip` tills redeploy så den verkligen prövar sin namngivna väg.
- `allow` — kräver både redeploy OCH muterbart record (Öppen tråd 2).

**Unblock:** redeploy `update-record` till staging (separat manuellt
steg, ej i CI-pipelinen — kräver Supabase-deploy-access). Byggplanens
"Inga nya EF-deploys" gäller NYA funktioner; en redeploy av befintlig
`update-record` är nödvändig och inte i konflikt med den raden.

## Öppen tråd 2 — allow-test-provisionering (blockerande för DoD "1 allow-test")

Allow-testet ([update-record.staging.test.ts](../../tests/api/update-record.staging.test.ts))
är `test.skip` tills allow-vägen kan bevisas utan att lämna live-data
muterad. Det kräver ett beslut om **staging-Airtable-isolering** INNAN
implementations-vägen väljs:

- Pekar staging-Supabase mot en **egen Airtable-bas** (isolerad testdata)
  eller mot **samma bas som produktionsdata**? Svaret avgör om mutation i
  test är säker.
- Först därefter väljs implementationsväg:
  - **(B) self-create/delete** — testet skapar ett kastbart record i
    `beforeAll`, muterar, raderar i `afterAll` (kräver Airtable-write i
    testkontext).
  - **(C) utpekat record** — designerat kastbart staging-record via
    `TEST_REGISTRATION_RECORD_ID` + read-restore-teardown.

Fas 5.5-DoD-raden "1 allow-test" är därmed **deferrad, ej levererad** i
K1 — löses i en allow-test-provisionerings-klunga, inte här. Deny-by-
default-kärnan (operations-allowlistens säkerhetspoäng) är levererad och
bevisbar i CI.
