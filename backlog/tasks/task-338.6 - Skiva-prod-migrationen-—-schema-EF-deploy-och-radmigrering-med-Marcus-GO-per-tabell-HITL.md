---
id: TASK-338.6
title: >-
  Skiva: prod-migrationen — schema, EF-deploy och radmigrering med Marcus GO per
  tabell (HITL)
status: To Do
assignee: []
created_date: '2026-08-29 08:04'
updated_date: '2026-08-29 11:47'
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

Denna sektion är den KONSOLIDERADE, GÄLLANDE versionen (skriven via `backlog task edit --notes`, review-runda 3 — ersätter tidigare ackumulerade notes som innehöll en FELAKTIG kommandoföljd, rapporterad av granskaren). Historik: tre granskningsrundor mot PR #2097 (`e0ddc1fe` → `caca9989` → `984ce344` → denna), sammanfattade i § Granskningshistorik nedan.

## Premiss-pass (ADR-086) — tre divergenser funna vid bygget, alla bokförda

1. **`scripts/deny-prod-ref.sh` vaktar INTE Airtable-bas-ID:n.** Läst i sin helhet (`.prod-ref-policy.conf` + skriptet): matchar ENDAST Supabase-projektets prod-ref (TASK-203, värdet står i `.prod-ref-policy.conf` som `PROD_REF_PROD`). Airtables prod-bas-ID (`app8uGPrVCVOm6LfD`) nämns i policyfilen EN gång, i en KOMMENTAR, aldrig som matchat värde. Uppdragets föreslagna prov ("kör `--kontrollera app8uGPrVCVOm6LfD` och se om hooken faller") hade i verkligheten inneburit en LIVE, OBLOCKERAD läsning mot förbjuden prod — kördes DÄRFÖR ALDRIG mot verklig prod. Skriptet bär i stället sin EGEN mekaniska guard (`resolveTargetBaseId`), skarpt bevisad via barnprocess: `--kontrollera app8uGPrVCVOm6LfD` utan `AIRTABLE_PROD_GODKAND_AV_MARCUS` → exit 1, ingen fetch. Källa: `atkomst-och-nycklar.md` § "Prod-deploy av bilagespåret" bekräftar oberoende. (Denna nots egen skrivning demonstrerade samma lås skarpt: ett tidigare utkast med Supabase-prod-refen utskriven i en Bash-heredoc fälldes av exakt denna hook — bevis i PR-transkriptet, inte i denna fil.)
2. **`prefersSingleRecordLink: true`** i ursprungsuppdragets fältspec stämde inte — live `describe_table` mot staging visade `false`. Skriptet skapar `Plats`-fältet UTAN det attributet, matchande den levande formen.
3. **Radantalet 0/9 (TASK-338.1s rapport) hade driftat till 6/158 vid bygg-tid** (TASK-338.2 landade mellan 338.1 och detta bygge, dess testsvit exercisar legacy-mappningen och skapar nya legacy-fixturer löpande). Idempotens bevisad på den ANDRA `--utfor`-körningen (0 skrivningar), inte den första.

## Vad som är byggt

- `scripts/task-338-6-prod-migration.mjs` — TRE lägen: `--kontrollera <bas-id>` (läser schema OCH rader, ändrar inget), `--utfor-schema <bas-id>` (steg i: option "Gemensam" + länkfältet Plats + lookupfältet Platsnamn — rör ALDRIG en riktig Bilagor-rad; choice-skapelsen använder alltid en kastbar rad, skapa+radera, typecast), `--utfor-rader <bas-id>` (steg iii: radmigrering Kurstyp/Alla event → Gemensam i batchar om 10, Kursfamilj/Kursnivå orörda — kräver att choicen redan finns, annars `GuardError`). Bas-ID alltid argument, aldrig config.
- **Prod-lås:** `resolveTargetBaseId` kräver miljövariabeln `AIRTABLE_PROD_GODKAND_AV_MARCUS` satt till EXAKT samma bas-ID som körningen fick (t.ex. `AIRTABLE_PROD_GODKAND_AV_MARCUS=app8uGPrVCVOm6LfD`, ALDRIG ett kort värde som `1` eller `true`) — annars VÄGRAR skriptet innan någon nätverksanrop görs. Samma mönster som `create-eventinnehall-modell.mjs` § TASK-309.9.
- **Fail-closed post-verifiering:** efter `--utfor-schema`/`--utfor-rader` läses schemat/raderna FÄRSKT och prövas igen (`schemaKonvergerad`/`raderKonvergerade`) — diskrepans → **exit 4**, aldrig bara en utskriven varning.
- **Config-baserad idempotens:** ett Plats-/Platsnamn-fält som redan finns men är FELKONFIGURERAT (fel type/linkedTableId/recordLinkFieldId/fieldIdInLinkedTable) fäller med `GuardError` och rör INGET.
- **Kvarleva-spårbarhet (review-runda 3):** `createThrowawayAndDelete` loggar det skapade record-ID:t INNAN DELETE-försöket; misslyckas DELETE bär felmeddelandet ID:t ("KVARLEVA — radera X manuellt"). `--kontrollera`-rapporten har en rad **"Gemensam-rader utan Namn/Event-länk: K"** som räknar potentiella föräldralösa kastbara rader (signaturen: varken `Namn` eller `Event`-länk satt — en riktig Gemensam-bilaga har alltid minst ett av de två).
- **5xx-retry** med exponentiell backoff (2 försök, 1 s/2 s) utöver befintlig 429-hantering, hermetiskt testad via injicerad `fetchImpl`/`sleepImpl`.
- **PAT-scope-kravet:** `AIRTABLE_SCHEMA_TOKEN` måste bära PAT-scopet `schema.bases:write` (utöver `schema.bases:read`) — detta är EN ANNAN AXEL än Airtable-basens `permissionLevel` (t.ex. "create") som ett token/collaborator kan ha på basen som HELHET. Ett token kan ha `permissionLevel: "create"` på basen och ÄNDÅ sakna det granulära PAT-scopet om det skapades med en snävare scope-lista. Se `docs/reference/atkomst-och-nycklar.md` § "TOKEN-FÄLLAN, mätt och rättad" för distinktionen, och § "Prod-deploy av bilagespåret" → (a) Prod-schemat för var den dedikerade, least-privilege-scopade PAT:en beskrivs (prod-varianten; staging-varianten i `.env.seed.example`s `AIRTABLE_SCHEMA_TOKEN`-block).
- `scripts/test-task-338-6-prod-migration.mjs` — **74 fall**, samtliga hermetiska (DI mot injicerade `fetchImpl`/`sleepImpl`/`logImpl`, ingen riktig fetch/väntan/global console.log-mutation). Tvåsidigt bevisad TRE gånger (en per granskningsrunda): en planterad regression föll rött exakt på den avsedda platsen, återställt → alla gröna igen.
- Wirad i `ci.yml`:s "Test gatekeeper script suites"-steg (samma steg som `test-fas4-prod-deploy.sh`) — kommentaren där är uppdaterad till 74 fall / `planSchema`/`runSchema`/`planRader`/`runRader` / exit 0–4 (review-runda 3, punkt 3).
- `package.json`: `"migration:task-338-6"`-npm-script för STAGING-bruk. En PROD-körning görs med `node scripts/task-338-6-prod-migration.mjs` DIREKT (inte via npm-scriptet), inline-env — samma konvention som `atkomst-och-nycklar.md` redan etablerar för `create-eventinnehall-modell.mjs`.
- `.staging-preflight-wiring-policy.json`: skriptet + dess testsvit registrerade (`kravStagingLedigt()` i `main()`, hoppas över för prod-mål).

**Ärlig gräns, bokförd öppet:** create+typecast-mekanismen för choice-skapelse (`--utfor-schema` steg 1) är INTE oberoende omprövad skarpt — TASK-338.1 bevisade UPDATE-vägen (PATCH på en riktig rad) skarpt; review-runda 2 bytte till CREATE+DELETE av arkitekturskäl (schema-steget ska aldrig röra en riktig rad). Airtables dokumenterade typecast-beteende beskrivs som identiskt för create och update, men detta specifika create-anrop har ALDRIG körts skarpt — ingen av de tre granskningsrundorna tillät en ny `--utfor-schema`-körning mot staging (fälten fanns redan där sedan tidigare). Marcus faktiska prod-körning (steg 3 i kommandoföljden nedan) blir den FÖRSTA skarpa exekveringen av denna kodväg.

## Skarp körning mot STAGING — prod (`app8uGPrVCVOm6LfD`) ALDRIG anropad i denna skiva

Token: Airtable-MCP-serverns PAT (`~/.claude.json` → `mcpServers.airtable.env.AIRTABLE_API_KEY`), exporterad som BÅDE `AIRTABLE_SCHEMA_TOKEN` och `STAGING_AIRTABLE_TOKEN` — sanktionerad väg, `atkomst-och-nycklar.md` § "TOKEN-FÄLLAN". `.env.seed` saknar en dedikerad `AIRTABLE_SCHEMA_TOKEN` lokalt (samma kända lucka som `create-bilagor-table.mjs`/`create-eventinnehall-modell.mjs`).

- **Build-rundan:** `--kontrollera` → `--utfor` (gamla kombinerade läget, 6 rader migrerade) → `--kontrollera` → `--utfor` igen (**0 skrivningar, sant idempotens-bevis**).
- **Review-runda 2:** endast `--kontrollera` (schema redan i synk sedan build-rundan).
- **Review-runda 3:** endast `--kontrollera` (samma) — bekräftade den nya "Gemensam-rader utan Namn/Event-länk"-raden fungerar live: **0** (inga kvarlevor finns, väntat — ingen `createThrowawayAndDelete`-DELETE har någonsin fallerat mot staging).

## Rörda filer

- `scripts/task-338-6-prod-migration.mjs`, `scripts/test-task-338-6-prod-migration.mjs` — skriptet + testsviten.
- `package.json`, `.github/workflows/ci.yml`, `.staging-preflight-wiring-policy.json` — wiring.
- `backlog/tasks/task-338.6 - *.md` — denna notes-uppdatering.

## AC/DoD-status

**AC #1–#3:** inget bockat (Marcus prod-steg, uppdraget explicit). Kräver Marcus faktiska prod-körning enligt § Kommandoföljd nedan.

**DoD:** #1 N/A (Marcus prod-steg) · #2 rörda grindar gröna (se § Grindar) · #3 path-scopad add, inga orelaterade filer · #4 N/A för denna skiva (prod aldrig rörd) men MEKANIKEN som tvingar GO-i-klartext är levererad och skarpt bevisad · #5/#6 N/A (ingen EF-/klientkod rörd).

## Grindar (senast mätta, review-runda 3)

| Grind | Resultat |
|---|---|
| `node scripts/test-task-338-6-prod-migration.mjs` | **74/74 gröna**, exit 0, 1,25 s lokalt |
| `npm run typecheck` | exit 0 |
| `npx @biomejs/biome check .` | exit 0 (bara pre-existerande, orörda warnings/infos) |
| `actionlint -ignore 'unexpected key "queue"…'` | exit 0 |
| `yamllint -c .yamllint.yml .github/workflows/ci.yml` | exit 0 |
| `node scripts/check-staging-preflight-wiring.mjs` | grön, 8 Node-ytor, 0 oklassade |
| `--kontrollera apphjj8Q7lkXCMsL4` | exit 0, endast läsning |

## § Kommandoföljd Marcus kör mot PROD — DENNA SEKTION ÄR DEN ENDA GÄLLANDE

(Tidigare versioner av denna sektion använde ett felaktigt kombinerat `--utfor <bas-id>`-läge som inte längre finns — kört som skrivet där gav `ArgError`/exit 2. Denna version är korrigerad och testad mot den faktiska CLI-formen.)

**Förkrav före steg 3:** `AIRTABLE_SCHEMA_TOKEN` måste vara en PAT med scopet `schema.bases:write` (utöver `schema.bases:read`) mot prod-basen — se § "PAT-scope-kravet" ovan för distinktionen mot basens `permissionLevel`, och `atkomst-och-nycklar.md` § "Prod-deploy av bilagespåret" → (a) Prod-schemat för var den dedikerade PAT:en beskrivs. `STAGING_AIRTABLE_TOKEN` behöver `data.records:read+write` mot samma bas. Sätt BÅDA inline på kommandoraden — ALDRIG i `.env.seed` (den är staging-scopad).

`--kontrollera`/`--utfor-schema`/`--utfor-rader` är alla snabba (sekunder) och får gå via `!`-prefixet. EF-deploy-steget (5) INTE — eget terminalfönster, CLAUDE.md § Prod-EF-deploy, kommandot `bash scripts/fas4-prod-deploy.sh --deploya <supabase-prod-ref>` (refen står i `.prod-ref-policy.conf`s `PROD_REF_PROD` — skrivs INTE ut här i klartext: `scripts/deny-prod-ref.sh` fäller varje Bash-kommando som nämner den, oavsett om det är en körning eller bara dokumentation som citerar den, se § Premiss-pass punkt 1).

```
1) Läs planen mot prod (ändrar inget):
   AIRTABLE_SCHEMA_TOKEN="<prod-scopad-PAT>" STAGING_AIRTABLE_TOKEN="<prod-scopad-PAT>" \
   node scripts/task-338-6-prod-migration.mjs --kontrollera app8uGPrVCVOm6LfD
   Läs: "Gemensam" finns: NEJ · Plats-fält finns: NEJ · Platsnamn-fält finns: NEJ ·
   radfördelning (N rader Kurstyp + M rader Alla event, "Att migrera: N+M").

2) Marcus GO i klartext för SCHEMAT på tabellen Bilagor (ADR-125 § 8).

3) Steg (i): schema — KRÄVER GO. Miljövariabeln sätts i SHELLET på DENNA rad, aldrig i .env:
   AIRTABLE_SCHEMA_TOKEN="<prod-scopad-PAT>" STAGING_AIRTABLE_TOKEN="<prod-scopad-PAT>" \
   AIRTABLE_PROD_GODKAND_AV_MARCUS=app8uGPrVCVOm6LfD \
   node scripts/task-338-6-prod-migration.mjs --utfor-schema app8uGPrVCVOm6LfD
   Förväntat: exit 0. Exit 4 = post-verifieringen visade att schemat INTE
   konvergerade — STOPPA, utred INNAN nästa steg.

4) Verifiera schemat:
   AIRTABLE_SCHEMA_TOKEN="<prod-scopad-PAT>" STAGING_AIRTABLE_TOKEN="<prod-scopad-PAT>" \
   node scripts/task-338-6-prod-migration.mjs --kontrollera app8uGPrVCVOm6LfD
   Läs: "Gemensam" finns: JA · Plats-fält finns: JA · Platsnamn-fält finns: JA.
   Fält-ID:na skriptets utdata rapporterar (skapade i steg 3) bokförs i
   data-model.md § Bilagor, prod-kolumnen (idag "väntar TASK-338.6").

5) Steg (ii): EF-deploy — EGET terminalfönster, ALDRIG via !-prefixet (~10 min):
   bash scripts/fas4-prod-deploy.sh --kontrollera <supabase-prod-ref-ur-.prod-ref-policy.conf>
   bash scripts/fas4-prod-deploy.sh --deploya     <supabase-prod-ref-ur-.prod-ref-policy.conf>

6) Marcus GO i klartext för RADERNA (ADR-125 § 8, "irreversibelt i data").

7) Steg (iii): radmigrering — KRÄVER GO:
   AIRTABLE_SCHEMA_TOKEN="<prod-scopad-PAT>" STAGING_AIRTABLE_TOKEN="<prod-scopad-PAT>" \
   AIRTABLE_PROD_GODKAND_AV_MARCUS=app8uGPrVCVOm6LfD \
   node scripts/task-338-6-prod-migration.mjs --utfor-rader app8uGPrVCVOm6LfD
   Förväntat: exit 0. Exit 4 = legacy-rader kvar EFTER migreringen — STOPP,
   utred (rör inget mer förrän orsaken är förstådd).

8) Slutverifiering:
   AIRTABLE_SCHEMA_TOKEN="<prod-scopad-PAT>" STAGING_AIRTABLE_TOKEN="<prod-scopad-PAT>" \
   node scripts/task-338-6-prod-migration.mjs --kontrollera app8uGPrVCVOm6LfD
   Läs: "Att migrera: 0" · "Redan Gemensam" = N+M (summan från steg 1).

9) De två dokument Marcus laddade upp 2026-08-29 som "Alla event" omklassas
   via "Ändra räckvidd" I APPEN (TASK-338.4/338.7) — INTE via detta skript
   eller basen direkt (TASK-338 § Implementationsbeslut).
```

Efter körning: bocka AC #1–#3 på detta kort och sätt Status via `task edit`.

## Granskningshistorik (PR #2097)

| Runda | Granskad SHA | Risk | Fynd → åtgärd |
|---|---|---|---|
| 1 | `e0ddc1fe` | hög | 5 fynd: Platsnamn-body-formen (ERROR, fixad runda 2), --utfor-split (WARNING, fixad runda 2), fail-closed (WARNING, fixad runda 2), config-idempotens (WARNING, fixad runda 2), PAT-scope+5xx-retry (INFO, bokförd runda 2) |
| 2 | `984ce344` | medel | 3 fynd: kortets kommandoföljd (ERROR, fixad DENNA runda), kvarleva-spårbarhet för createThrowawayAndDelete (WARNING, fixad DENNA runda), ci.yml-kommentardrift (INFO, fixad DENNA runda) |
| 3 | (denna commit) | — | väntar granskning |
<!-- SECTION:NOTES:END -->
