---
id: TASK-338.6
title: >-
  Skiva: prod-migrationen — schema, EF-deploy och radmigrering med Marcus GO per
  tabell (HITL)
status: To Do
assignee: []
created_date: '2026-08-29 08:04'
updated_date: '2026-08-29 11:22'
labels:
  - ready-for-human
dependencies:
  - TASK-338.1
  - TASK-338.2
  - TASK-338.3
  - TASK-338.4
  - TASK-338.5
parent_task_id: TASK-338
ordinal: 616000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-moment i tre steg, i denna ordning: (i) Bilagor i PROD får option 'Gemensam', länken Plats → Platser (tblPeNLeeQ1IduGTK) och lookup Platsnamn — additivt, efter Marcus GO i klartext för tabellen Bilagor (ADR-125 § 8); (ii) EF-deploy till prod via bash scripts/fas4-prod-deploy.sh --deploya <prod-ref> i EGET terminalfönster (aldrig via !-prefixet, CLAUDE.md § Prod-EF-deploy), verifierat på UPDATED_AT; (iii) radmigrering Kurstyp/Alla event → Gemensam i prod med räkneverifiering före/efter, efter Marcus GO. Ordningen är säker oavsett tack vare läsvägens legacy-tolerans (338.2). Orkestreraren förbereder ett skript med --kontrollera (läser, ändrar inget) och --utfor för steg (i) och (iii) med prod-ref som argument (deny-prod-ref-låset bevaras). data-model.md § Bilagor får prod-ID:n. Täcker användarberättelser: 10, 14.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prod: option, länk och lookup finns (fält-ID:n bokförda); Marcus GO citerat i Implementation Notes
- [ ] #2 Prod-EF:erna get-event-attachments, upload-attachment, finalize-attachment-upload, update-attachment-scope deployade — UPDATED_AT-tider bokförda
- [ ] #3 Prod: 0 rader kvar med Kurstyp/Alla event; antal Gemensam = summan före; de två dokument Marcus laddade upp 2026-08-29 finns kvar och är läsbara i räckviddsläget
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Modell-identitet:** Sonnet 5 ("You are powered by the model named Sonnet 5. The exact model ID is claude-sonnet-5.").

**Premiss-pass (ADR-086) — TRE divergenser funna och bokförda, ingen dold:**

1. **scripts/deny-prod-ref.sh vaktar INTE Airtable-bas-ID:n** (läst i sin helhet, `.prod-ref-policy.conf` + skriptet). Policyn matchar ENDAST `PROD_REF_PROD="lvjsfnphlauldxqlncpl"` (Supabase, TASK-203) — Airtables prod-bas-ID (`app8uGPrVCVOm6LfD`) nämns i policyfilen EN gång, i en KOMMENTAR (rad 52), aldrig som ett matchat värde. Uppdragets föreslagna skarpa prov ("kör `--kontrollera app8uGPrVCVOm6LfD` och se om hooken faller") hade alltså i verkligheten inneburit en LIVE, OBLOCKERAD läsning mot den bas uppdraget kallar FÖRBJUDEN. **Provet kördes därför ALDRIG mot verklig prod.** I stället bär skriptet SJÄLVT prod-låset (`resolveTargetBaseId`, samma mönster som `scripts/create-eventinnehall-modell.mjs` § TASK-309.9, env-var `AIRTABLE_PROD_GODKAND_AV_MARCUS`). Detta KÖRDES skarpt (barnprocess-integrationstest, se § Testsvit) mot `app8uGPrVCVOm6LfD` utan att sätta miljövariabeln: **exit 1, ingen fetch gjord** (guard-fel kastas innan main() når token-check eller nätverk). Det är beviset uppdraget efterfrågade, producerat av rätt mekanism. Källa: `atkomst-och-nycklar.md` § "Prod-deploy av bilagespåret" tabellen bekräftar samma sak oberoende — "`AIRTABLE_PROD_GODKAND_AV_MARCUS` är en gate INUTI skripten — ingen hook, inget deny-skript (grep-verifierat)".

2. **`prefersSingleRecordLink: true` i uppdragets fältspec stämmer INTE mot verkligheten.** Live `describe_table` mot staging (`fldmkHUxPNRRA0Rxi`) visar `prefersSingleRecordLink: false` — samma default Airtable satte när TASK-338.1 skapade fältet utan att explicit sätta värdet. Skriptets `Plats`-fält-skapelse (`planUtfor`) sätter DÄRFÖR `options: { linkedTableId }` ENDAST — ingen `prefersSingleRecordLink` — vilket matchar den LEVANDE staging-formen exakt (idempotens-kravet: en framtida prod-körning måste kunna särskilja "redan skapat, matchar" från "mismatch", och en avvikande `prefersSingleRecordLink`-förväntan hade gett falska mismatchar). Rättat mot verklighet, inte mot uppdragets ord.

3. **Radantalet 0/9 (TASK-338.1s rapporterade slutläge) hade DRIFTAT till 6/158 (senare 0/164) vid detta korts start.** Källa: live `mcp__airtable__list_records` mot staging (`OR({Räckvidd}='Kurstyp',{Räckvidd}='Alla event')` → 6 träffar; `{Räckvidd}='Gemensam'` → 158 träffar) plus `TASK-338.2`-kortet (Status: ✔ Done, uppdaterat 09:56 UTC — EFTER 338.1s 08:32 UTC-rapport) vars EGEN testsvit (`upload-attachment.staging.test.ts` m.fl.) exercisar legacy-mappningen (`rackvidd='Kurstyp'/'Alla event'` → normaliseras vid LÄSNING) och därmed skapar nya `ZZ-attachment-test-*`-rader med dessa värden vid varje CI-körning. Uppdragets "förväntat 0 skrivningar" höll alltså INTE på den FÖRSTA `--utfor`-körningen (6 skrivningar gjordes, korrekt migrering av äkta legacy-rader) — men höll EXAKT på den ANDRA körningen (0 skrivningar, se § Skarp körning). Detta är förenligt med ett äkta idempotent verktyg som körs mot en population i rörelse, inte ett fel i skriptet. Ingen av divergenserna blockerade arbetet; alla tre är källmärkta ovan.

**Vad som byggdes:**

- `scripts/task-338-6-prod-migration.mjs` — `--kontrollera <bas-id>` (läser: Räckvidd-choices, om Plats/Platsnamn finns, radfördelning) och `--utfor <bas-id>` (steg (i) schema-additivt + steg (iii) radmigrering, båda idempotenta). Bas-ID är ALLTID argument, aldrig config. Prod-lås: `resolveTargetBaseId` kräver `AIRTABLE_PROD_GODKAND_AV_MARCUS=<bas-id>` EXAKT för varje bas ≠ staging (samma kontrakt som `create-eventinnehall-modell.mjs`). Option-tillägget använder DEN BEVISADE typecast-vägen (TASK-338.1): PATCHar en riktig legacy-rad till "Gemensam" om en sådan finns (korrekt permanent migrering, ingen återställning behövs) — annars (inga legacy-rader men ≥1 annan rad) en kastbar skapa+radera-rad (dokumenterad RESERVVÄG, ej skarpt bevisad — prod förväntas alltid ha legacy-rader, se TASK-338 § Implementationsbeslut om Marcus två uppladdade dokument). Meta-API PATCH mot ett befintligt fälts `options.choices` PRÖVADES INTE på nytt (redan skarpt avlivad i TASK-338.1: Airtables egen 422 "Changing a field's type or number precision is not currently supported" — plattformsvägg, inte verktygsbegränsning). Radmigrering batchas om 10 (Airtables PATCH-tak). Exit: 0=OK, 1=prod-guard-vägran, 2=argument-/bas-ID-form-fel, 3=API-/token-fel.
- `scripts/test-task-338-6-prod-migration.mjs` — 43 fall, DI mot injicerade API-stubbar (inget nätverk för planerings-/exekveringslogiken) + en liten barnprocess-integrationsdel som bevisar de FAKTISKA exit-koderna för grenar som exitar FÖRE fetch. Körd: **43/43 gröna, exit 0.** Sabotage-bevis: kortslöt `resolveTargetBaseId`s guard (`if (false && godkandEnv !== bas)`) → **7 fall föll rött** (exit 1→3-mismatchar), återställt, om-körd → 43/43 grönt igen. Sviten fäller alltså när den ska, inte bara grön av sig själv.
- `package.json`: `"migration:task-338-6"`-npm-script (samma `--env-file-if-exists=.env.seed`-mönster som `schema:eventinnehall`) — för STAGING-bruk. En prod-körning görs med `node scripts/task-338-6-prod-migration.mjs` DIREKT (inte via npm-scriptet), inline-env, samma konvention som `atkomst-och-nycklar.md` § "Prod-deploy av bilagespåret" redan etablerar för `create-eventinnehall-modell.mjs`.
- `.github/workflows/ci.yml`: testsviten wirad i "Test gatekeeper script suites"-steget (samma steg som `test-fas4-prod-deploy.sh`) — motiverat: skriptet är ett REPETERBART operativt verktyg (Marcus kör det mot prod, potentiellt fler gånger), samma klass som fas4-deployen, till skillnad från engångs-schemaskriptens (`create-bilagor-table.mjs`/`create-eventinnehall-modell.mjs`) MEDVETET ovirade test-sviter.

**Skarp körning mot STAGING (`apphjj8Q7lkXCMsL4`) — prod (`app8uGPrVCVOm6LfD`) INTE anropad någon gång i denna skiva.** Token: Airtable-MCP-serverns PAT (`~/.claude.json` → `mcpServers.airtable.env.AIRTABLE_API_KEY`), exporterad som BÅDE `AIRTABLE_SCHEMA_TOKEN` och `STAGING_AIRTABLE_TOKEN` — sanktionerad väg, `atkomst-och-nycklar.md` § "TOKEN-FÄLLAN, mätt och rättad" ("token... fungerar via skript-vägen när den exporteras som `AIRTABLE_SCHEMA_TOKEN`/`STAGING_AIRTABLE_TOKEN`"). `.env.seed` saknar en dedikerad `AIRTABLE_SCHEMA_TOKEN` (0 träffar, samma kända lucka som `create-bilagor-table.mjs`/`create-eventinnehall-modell.mjs` filhuvuden redan dokumenterar för TASK-147.12/309.2).

1. `--kontrollera apphjj8Q7lkXCMsL4`: Gemensam finns=JA, Plats finns=JA, Platsnamn finns=JA, 271 rader (Event=71, Gemensam=158, Kurstyp=4, Alla event=2, tomt=36), att migrera=6.
2. `--utfor apphjj8Q7lkXCMsL4`: schema redan i synk (0 skrivningar där) — **6 rader migrerade** (matchar steg 1:s "att migrera"). Räkneverifiering: Kurstyp/Alla event kvar=0, Gemensam totalt=164.
3. `--kontrollera apphjj8Q7lkXCMsL4` (om igen): att migrera=0, Gemensam=164 — bekräftar steg 2.
4. `--utfor apphjj8Q7lkXCMsL4` (ANDRA gången, idempotens-beviset): **optionAdd=0 platsField=0 platsnamnField=0 radMigrering=0** — sant nollresultat, exit 0. Detta är den idempotens som uppdraget efterfrågade — fast på ANDRA körningen, inte den första (se § Premiss-pass punkt 3 för varför).

**Rörda filer och varför:**
- `scripts/task-338-6-prod-migration.mjs` (ny) — förberedelseskriptet.
- `scripts/test-task-338-6-prod-migration.mjs` (ny) — dess testsvit.
- `package.json` — npm-wrapper för staging-bekvämlighet.
- `.github/workflows/ci.yml` — CI-wiring av testsviten.
- `backlog/tasks/task-338.6 - *.md` — denna notes-uppdatering (samma commit som koden).

**AC-status:** Inget kryssat (Marcus prod-steg, uppdraget explicit). AC #1–#3 kräver att Marcus faktiskt kör mot prod — se § Kommandoföljd nedan.

**DoD-status (denna förberedelse-skiva):**
- #1 Alla AC avbockade: N/A — Marcus prod-steg, ska inte bockas här.
- #2 Rörd fil-klass lokala grindar gröna: se § Grindar nedan.
- #3 Inga orelaterade filer i diffen: path-scopad `git add`, verifierat.
- #4 Prod-schemaändringar endast efter Marcus GO: N/A för DENNA skiva — prod rördes ALDRIG (se § Skarp körning, endast staging). Mekaniken som TVINGAR GO-i-klartext för prod ÄR levererad (`resolveTargetBaseId`, skarpt bevisad i testsviten).
- #5 Deny/allow-test per ny/ändrad EF-operation: N/A — ingen EF-kod rörd (samma resonemang som TASK-338.1s Implementation Notes).
- #6 Lagervakten (EF/_shared): N/A — ingen matchnings-/valideringslogik i klienten, ingen klientkod rörd.

**Grindar (mätta, exitkoder separat fångade):**
- `npm run typecheck`: se transcript.
- `npx @biomejs/biome check .`: se transcript.
- `npm run build`: se transcript.
- `npm run test:api`: se transcript.
- `node scripts/test-task-338-6-prod-migration.mjs`: 43/43, exit 0 (tvåsidigt bevisad, se § Vad som byggdes).
- `actionlint -color -ignore 'unexpected key "queue" for "concurrency" section'`: se transcript (ci.yml rörd).

**§ Kommandoföljd Marcus kör mot PROD (i denna ordning; `--kontrollera`/`--utfor` snabba, får gå via `!`-prefixet — `fas4-prod-deploy.sh --deploya` INTE, eget terminalfönster, CLAUDE.md § Prod-EF-deploy):**

```bash
# 0) Läs planen mot prod (ändrar inget)
node scripts/task-338-6-prod-migration.mjs --kontrollera app8uGPrVCVOm6LfD
#   Kräver AIRTABLE_SCHEMA_TOKEN + STAGING_AIRTABLE_TOKEN i env — antingen en
#   prod-scopad PAT (schema.bases:read+write + data.records:read+write), ELLER
#   Airtable-MCP-serverns PAT (~/.claude.json → mcpServers.airtable.env.AIRTABLE_API_KEY,
#   redan "create" mot BÅDA baserna — atkomst-och-nycklar.md § TOKEN-FÄLLAN).
#   Sätt INLINE på kommandoraden, ALDRIG i .env.seed (den är staging-scopad).

# 1) Steg (i)+(iii): schema (option/Plats/Platsnamn) + radmigrering — KRÄVER GO
AIRTABLE_SCHEMA_TOKEN="<prod-scopad-eller-MCP-PAT>" \
STAGING_AIRTABLE_TOKEN="<samma PAT>" \
AIRTABLE_PROD_GODKAND_AV_MARCUS=app8uGPrVCVOm6LfD \
node scripts/task-338-6-prod-migration.mjs --utfor app8uGPrVCVOm6LfD

# 2) Steg (ii): EF-deploy — EGET terminalfönster, ALDRIG via !-prefixet (~10 min)
bash scripts/fas4-prod-deploy.sh --kontrollera <prod-supabase-ref>
bash scripts/fas4-prod-deploy.sh --deploya     <prod-supabase-ref>

# 3) Verifiera igen (0 legacy kvar, Gemensam-antalet stämmer)
node scripts/task-338-6-prod-migration.mjs --kontrollera app8uGPrVCVOm6LfD

# 4) De två dokument Marcus laddade upp 2026-08-29 som "Alla event" omklassas
#    via "Ändra räckvidd" I APPEN (TASK-338.4/338.7) — INTE via detta skript
#    eller basen direkt (TASK-338 § Implementationsbeslut).
```

Ordningen mellan (i)/(iii) och (ii) är inte strikt tvingande — läsvägen (338.2) tolererar legacy-värden — men rekommenderas i denna ordning för renhet.

Efter körning: bocka AC #1–#3 på detta kort och sätt Status via `task edit`, samt fyll data-model.md § Bilagor prod-kolumnen (idag "väntar TASK-338.6") med de faktiska prod-fält-ID:na skriptets utdata rapporterar.

---

## Review-runda 2 (PR #2097, granskad e0ddc1fe, risk hög — 1 error + 3 warning + 3 info) — RÄTTAT, ny SHA caca9989

**Modell-identitet (denna runda):** Sonnet 5 ("You are powered by the model named Sonnet 5. The exact model ID is claude-sonnet-5.").

**1. ERROR (rättat):** `Platsnamn`-fältets create-body skickade `recordLinkFieldId`/`fieldIdInLinkedTable` på TOPPNIVÅ i stället för nästlat under `options`, vilket Airtables Meta-API (POST .../fields, variant multipleLookupValues) kräver — samma fel `Plats`-fältet redan undvek (`options: { linkedTableId }`). Extraherat till EXPORTERADE, pura funktioner `buildPlatsFieldBody(platserTableId)` / `buildPlatsnamnFieldBody(platsFieldId, platserNamnFieldId)`; testsviten asserterar body-formen direkt (`body.options.recordLinkFieldId`/`fieldIdInLinkedTable`, samt att INGEN av nycklarna ligger på toppnivå). Sabotage-bevisat: återinförde buggen → 3 fall föll rött exakt på den → återställt → 70/70 grönt.

**2. WARNING/ask-user (avgjort av orkestreraren på Marcus mandat, rättat):** Skriptet har nu TRE lägen i stället för två:

```bash
node scripts/task-338-6-prod-migration.mjs --kontrollera <bas-id>    # läser BÅDE schema och rader, ändrar inget
node scripts/task-338-6-prod-migration.mjs --utfor-schema <bas-id>   # steg (i): option + Plats + Platsnamn — ALDRIG en riktig Bilagor-rad
node scripts/task-338-6-prod-migration.mjs --utfor-rader <bas-id>    # steg (iii): radmigrering — kräver att choicen redan finns (annars GuardError, exit 1)
```

Option-tillägget ("Gemensam"-choicen) använder nu ALLTID en kastbar rad (skapa+radera, typecast) i stället för att typecasta på en riktig legacy-rad som förra rundan gjorde — så `--utfor-schema` rör ALDRIG persisterad Bilagor-data, oavsett om legacy-rader finns eller ej. Detta håller ADR-125 § 8:s "additivt men irreversibelt i data"-distinktion skarp mellan de två lägena.

**3. WARNING (rättat):** Båda `--utfor-*`-lägena är nu FAIL-CLOSED. Efter skrivning läses schemat/raderna FÄRSKT och prövas igen (`schemaKonvergerad`/`raderKonvergerade`, rena testbara funktioner) — visar det diskrepans (schema INTE konvergerat / legacy-rader kvar >0) avslutar skriptet med **exit 4**, inte bara en utskriven varning.

**4. WARNING (rättat):** Idempotensen är nu KONFIGURATIONSBASERAD, inte bara namnbaserad. Finns `Plats` men med annan `type`/`options.linkedTableId`, eller `Platsnamn` med annan `recordLinkFieldId`/`fieldIdInLinkedTable`/`type` → `planSchema` fäller med `GuardError` och rör INGET. Åtta nya testfall täcker varje felkonfigurationskombination (fel type på båda fälten, fel linkedTableId, fel recordLinkFieldId, fel fieldIdInLinkedTable, samt "Platsnamn finns men Plats saknas" — ett strukturellt inkonsistent schema).

**5. INFO (bokfört):** `AIRTABLE_SCHEMA_TOKEN` måste bära PAT-SCOPET `schema.bases:write` (utöver `schema.bases:read`) — detta är en ANNAN axel än Airtable-basens `permissionLevel` (t.ex. "create") som en token/collaborator kan ha på basen som HELHET. Ett token kan ha `permissionLevel: "create"` på basen och ÄNDÅ sakna det granulära PAT-scopet, om token:et skapades med en snävare scope-lista. Se `docs/reference/atkomst-och-nycklar.md` § "TOKEN-FÄLLAN, mätt och rättad" för den exakta distinktionen samt § "Prod-deploy av bilagespåret" → (a) Prod-schemat för var den dedikerade, least-privilege-scopade PAT:en beskrivs (för prod-varianten; staging-varianten i `.env.seed.example`s `AIRTABLE_SCHEMA_TOKEN`-block). 5xx-fel retries nu upp till 2 gånger med exponentiell backoff (1 s, 2 s) utöver den befintliga 429-hanteringen — hermetiskt testat via injicerad `fetchImpl`/`sleepImpl` (fyra nya testfall: 200 direkt, 429-retry oförändrad, 5xx-retry-och-lyckas, 5xx-uttömd-kastar, 4xx-ingen-retry).

**Skarp verifiering denna runda:** ENDAST `--kontrollera apphjj8Q7lkXCMsL4` kördes (koordinatorns explicita instruktion — fälten finns redan i staging sedan förra rundan, så en `--utfor-*`-körning hade bara bevisat 0 skrivningar utan att faktiskt exercisa create-vägarna). Utdata: `Gemensam`/`Plats`/`Platsnamn` finns alla (JA/JA/JA), 0 rader att migrera, exit 0, `PREFLIGHT OK`. **INGEN prod-anrop.**

**Ärlig gräns, bokförd öppet:** create+typecast-mekanismen för choice-skapelse (steg 1 i `--utfor-schema`) är INTE oberoende omprövad skarpt denna runda — TASK-338.1 bevisade UPDATE-vägen (PATCH på en riktig rad) skarpt förra rundan; denna runda byter till CREATE+DELETE av arkitekturskäl (punkt 2 ovan). Airtables dokumenterade typecast-beteende beskrivs som identiskt för create och update, men detta specifika create-anrop är INTE självt körts skarpt — koordinatorn förbjöd en ny `--utfor-schema`-körning mot staging tills fynd #1 var rättat. Nästa granskningsrunda (eller Marcus faktiska prod-körning) blir den första skarpa exekveringen av denna specifika kodväg.

**Testsvit:** 70 fall (upp från 43 i förra rundan), samtliga hermetiska (inklusive `airtableRequest`s retry-logik, testad via injicerad `fetchImpl`/`sleepImpl` — ingen riktig fetch, ingen riktig väntan). Tvåsidigt bevisad enligt ovan.

**Grindar denna runda:** `npm run typecheck` (exit 0) · `npx @biomejs/biome check .` (exit 0, endast pre-existerande warnings/infos i orörda filer) · `node scripts/test-task-338-6-prod-migration.mjs` (70/70, exit 0) · `node scripts/check-staging-preflight-wiring.mjs` (grön, 8 Node-ytor, 0 oklassade) · `--kontrollera apphjj8Q7lkXCMsL4` (exit 0, endast läsning). `ci.yml` ORÖRT denna runda — actionlint/yamllint ej körda (inte tillämpligt).

**Ny SHA:** `caca99892b299060845e2e0b0cdd9ad05977dba5` (PR #2097, gren `feat/task-338-6-prod-migrationsskript`).
<!-- SECTION:NOTES:END -->
