---
id: TASK-18.6
title: 'Skiva: Hantera-flödet (bekräftelse-vertikalen + Bekräfta alla)'
status: In Progress
assignee: []
created_date: '2026-07-21 08:20'
updated_date: '2026-07-22 21:02'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.5
parent_task_id: TASK-18
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta kan tömma kön: Skicka bekräftelse-knappen i det obekräftade kortets botten (utanför person-länken, L303) driver NY operation där servern skickar bekräftelsemailet och flippar Status till Bekräftad i samma operation (Bekräftad betyder bekräftelsen skickad — basens Status-semantik). Bekräfta alla-pillen på Obekräftade-raden kör bulk med kontrollfråga (confirm-grind på massmutation). Schemalagt-datum och opt-out föds som ADDITIVA bas-fält och auto-utskicks-krysset läser/skriver dem (utskicks-MOTORN utanför). Optimistisk enskild bekräftelse, pessimistisk bulk. Täcker användarberättelser: 14, 15 samt 18-styrningen (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bekräftelse-operationen kontraktstestad: mail + status-flip atomiskt server-side, deny-by-default, teardown
- [x] #2 Bekräfta alla kräver kontrollfråga och uppdaterar grupper + summeringsrader live i e2e
- [x] #3 Schemalagt-fälten additiva i staging; krysset styr dem bevisat
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Leverans (task/18.6)

### Snittet

Hantera-flödet ände-till-ände i TVÅ vertikaler + en UI-styrning: (1) NY EF
`send-registration-confirmation` (mail + status-flip atomiskt server-side),
(2) `update-event` utökad med auto-utskickets två ADDITIVA bas-fält, (3) UI:
kortets Skicka bekräftelse, Bekräfta alla med kontrollfråga, auto-krysset i
signal-slotten.

### EF-NAMNVALET (bokfört per FAS-direktiv)

`send-registration-confirmation` — verb-substantiv per registrets konvention
(`mark-registration-fee-paid` / `log-payment-reminder` / `send-email`).
`send-` bär mail-handlingen, `-registration-confirmation` objektet.
Status-flippen är bekräftelsens BOKFÖRING i basen (ORDLISTA: Bekräftad ⟺
bekräftelsen skickad, S73 K53) — inte en egen handling, därför ETT verb.

### Arkitekturen (send-email-precedenten, Fas 6h)

- `_shared/confirm-registrations.ts` = REN orkestrator (DI: `ConfirmationSender`
  + `StatusFlipper`) → Node-importerbar för api-pure, Deno-importerbar för
  EF:en. Konformans-kärnan (partitionering, icke-prod-spärr, atomicitet,
  aldrig-binär status) bevisas in-memory; EF:en wirar de skarpa gränserna.
- ICKE-PROD-GOLVET ÅTERANVÄNT, ej kopierat: `NonProdAddressError` +
  `RESEND_TEST_ADDRESSES` importeras ur `_shared/send-bulk.ts` (FAS-direktivet).
- ATOMICITETEN: mail FÖRST, flip ENDAST för accepterad rad. En avvisad rad
  lämnas orörd — basen får aldrig påstå "bekräftad" utan skickat mail.
- `parseConfirmOutcome` är RAD-EXAKT via `errors[].index` och nycklad på
  registrationId (ej e-post): en +1-anmälan kan dela adress med huvudanmälan och
  hade annars flippat fel rad.
- Mottagaren löses SERVER-SIDE ur basen; klienten skickar bara record-ID:n.

### Bas-ändringar (ADDITIVA, STAGING ENDAST — PROD ORÖRD)

Eventplanering (`tblVE3UKWl1CKrphV`, staging `apphjj8Q7lkXCMsL4`), skapade
2026-07-22:

- `Deltagarinfo schemalagd` — `fldB4rk2VZcm4GdxY`, date (ISO)
- `Deltagarinfo auto-utskick avstängt` — `fldPrSKNUTJpJqctw`, checkbox (OPT-OUT)

Skrivbarheten LIVE-VERIFIERAD (PATCH 2026-09-01/true → omläsning → rensning)
INNAN allowlist-posterna låstes (L294). Anmälningar behövde INGA nya fält:
`Status` (`fldWr5cCPNx9HEKtL`) + `Bekräftelse skickad` (`fld0jnbkIbuFAumgG`)
fanns och live-verifierades. Synken mot `docs/reference/data-model.md` är
sessionens end-pass (läs-yta i denna skiva).

### Deploy (staging, explicit ref — prod aldrig)

`supabase functions deploy <fn> --project-ref pqtshyierkdgwdnxuirz` för
send-registration-confirmation (ny), update-event + get-event (nya fälten).
`.prod-functions-allowlist.conf` orörd: fail-closed ⇒ den nya EF:en är
prod-exkluderad by default (verifierat mot filen — ingen rad behövs, exakt
direktivets avsikt). `supabase/config.toml` orörd: den ligger dessutom UTANFÖR
kortets yta, och repots faktiska praxis sedan 6f är att nya EF:er inte listas
(create-event/send-email/get-event saknas alla — Supabase default
`verify_jwt=true` är det säkra utgångsläget). Öppet bokfört avsteg från
FAS-direktivets "tre filer".

### TDD-bevis (rött före grönt, observerat)

1. api-pure `confirm-registrations.test.ts` → RÖTT: "Cannot find module
   .../_shared/confirm-registrations" → GRÖNT 11/11 efter orkestratorn +
   allowlist-posten.
2. `parseConfirmOutcome`-fallet → RÖTT: "does not provide an export named
   'parseConfirmOutcome'" → GRÖNT 12/12.
3. staging `send-registration-confirmation.staging.test.ts` → RÖTT 6/6 mot ej
   deployad EF (`{"code":"NOT_FOUND","message":"Requested function was not
   found"}`) → GRÖNT 6/6 efter deploy.
4. `update-event.staging.test.ts` auto-utskicks-fallen → RÖTT 2/2 ("At least one
   updatable field is required (…)" utan de nya fälten) → GRÖNT 12/12 efter
   EF + allowlist + deploy.
5. e2e `event-bekraftelse.staging.test.ts` → RÖTT 7/7 mot UI utan hantera-flödet
   → GRÖNT 8/8.

### LIVE-BEVIS: mail + status-flip (den positiva happy-path:en)

Committad? NEJ — medvetet, och skälet är mekaniskt: Resends test-adresser är en
FAST lista och `create-registration`:s 409-affärsunikhet (normaliserad e-post ×
EventKey) gör att en andra körning inte kan skapa samma sentinel igen; ingen
operation kan skriva Status TILLBAKA till Obekräftad (allowlisten tillåter exakt
Status→Bekräftad + tidsstämpeln). En committad happy-path hade varit grön exakt
EN gång. Samma väg som send-email L2c/L2d (Session 40). Live-körning 2026-07-22
mot staging, efemär fixtur, teardown utförd:

- fixtur `recZrvgvDA4ljbIeD` (ZZ-Bekraftelse Livebevis, delivered@resend.dev,
  Obekräftad)
- POST → `200 {"status":"sent","requested":1,"attempted":1,"confirmed":
  ["recZrvgvDA4ljbIeD"],"skipped":[],"failed":[],"bekraftelseSkickad":
  "2026-07-22T20:34:57.368Z"}`
- Airtable-omläsning: `Status = "Bekräftad (mail skickat)"`,
  `Bekräftelse skickad = "2026-07-22T20:34:57.368Z"` (EN operation)
- Idempotens-rerun: `200 {"status":"skipped", skipped:[{reason:
  "already_confirmed"}]}`
- TEARDOWN: raden RADERAD ur staging (basen är leverabel).

Den committade sviten bär i stället kontraktets nyckel-oberoende punkter +
ATOMICITETENS NEGATIVA GREN (422-vägran ⇒ omläsning visar anmälan orörd) +
idempotens-skippen.

### UI (S73-facit)

- K46: `Skicka bekräftelse` i kortbotten, ENDAST på obekräftade kort, UTANFÖR
  person-länken (L303 — e2e asserterar noll knappar inuti
  `a[href*="/personer/"]`).
- K47/K48: `Bekräfta alla` i Obekräftade-rubrikens HANDLINGS-slot (syskon till
  toggle-knappen, aldrig inuti), success-grön Button-primitiv + kuvert.
  KONTROLLFRÅGAN är obligatorisk — pillen öppnar bara dialogen; e2e bevisar att
  avbryt skickar NOLL anrop.
- K44: auto-krysset i signal-slotten när dags-att-skicka-badgen är släckt.
  Slotten står reserverad som förut; aldrig båda samtidigt.
- Optimistisk enskild (kortet flyttar direkt), PESSIMISTISK bulk bakom
  kontrollfrågan (PRD beslut 20). Utfallet läses ur serverns räknare — aldrig
  "klart" när servern sa partial/skipped.
- Ingen ny primitiv behövdes (Post 4 i claims var VILLKORAD):
  Button/Dialog/Modal + rå RAC Checkbox per Betalningars precedent.

### Grindar

test:api 342 passed · typecheck 0 · biome 0 fel · build grön · test:a11y 62
passed · e2e chromium-authenticated FULL svit mot egen dev-server (port 5188,
aldrig 5173): 237 passed, 2 failed = enbart CORS-blockerade skarpa EF-läsningar
(5188 ligger utanför `CORS_ALLOWED_ORIGINS`) — bevisat gröna i en separat FULL
körning mot preview-origin 4173. CI kör samma svit mot 5173 (allowlistad) och
träffar inte den väggen.

### ÖPPNA PUNKTER (öppet bokförda, aldrig tysta)

1. MAIL-COPYN: Lottas kanoniska bekräftelse-text bor i Resend-mallen
   `medveten-kontakt-bekraftelse`, som är en broadcast-mall och INTE nåbar via
   batch-send-vägen. EF:en bär därför en neutral, sann första version som INTE
   lovar något om belopp/betalkonto (appen äger inte de uppgifterna).
   Copy-källan är ett eget beslut före prod-deploy.
2. AUTO-UTSKICKETS MOTOR finns inte (PRD §Utanför omfattningen). Krysset styr
   fälten som motorn ska läsa; texten "Schemalagt att skickas automatiskt
   <datum>" beskriver alltså basens tillstånd, inte en garanterad sändning.
   Marcus-granskningspunkt.
3. PROD: prod-fälten på Eventplanering saknas och EF:en är prod-exkluderad.
   Prod-deploy = separat auktoriserad handling MED fält FÖRE EF
   (ADR-066/067-carryn, fälla 37-mönstret).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
