# ADR-050: Isolerad staging-miljö (separat Supabase-projekt + dedikerad Airtable-bas)

- **Status:** Accepted (öppna trådar markerade)
- **Datum:** 2026-06-13
- **Fas:** Session 19 — staging-miljö (designsession, ingen byggfas-status-ändring)
- **Relaterad:** [ADR-048](ADR-048-synk-horisont-arkiv-atkomst.md) (synk-horisont), [ADR-049](ADR-049-fas-5-5-betalfalt-val.md) (server-kontrakt `mark-registration-fee-paid`), Fas 5.5, L110

> **Korrigering (Session 36, 2026-06-26):** Tråd T2 (Öppna trådar nedan) antog att staging-kopian skulle få NYA tabell-/fält-ID:n (Code skulle "läsa nya bas-/tabell-ID:n empiriskt"). Live-verifiering (Session 36 pass 2) visar i stället IDENTISKA tabell- och fält-ID:n staging↔prod (Segment-tabellen = `tbll2N6JKCj4u6y9o` på BÅDA baser) — duplicerings-metoden bevarade ID:na. Sak-beslutet (separat staging-miljö med distinkt datalager) STÅR oförändrat: `list_records` på staging är distinkt från prod, och `baseId`-routningen är empiriskt bevisad även för WRITE (`create_field` landade staging-only, prod orört). Praktisk konsekvens: adressera dessa baser per id (`describe_table`-by-namn är opålitlig mot dem). Se Session 36 + [`data-model.md`](../reference/data-model.md) § Segment — write-fält (fyndet registrerat där). Beslutstexten nedan bevaras oförändrad (immutabilitet).

## Kontext

Session 18 pausade Fas 5.5 när deploy-verifieringen visade att orgen kör EN
miljö: "staging" == produktion + samma Airtable-bas (L110). Empiriskt bekräftat
i Session 19 (`supabase projects list` → ett projekt, `lvjsfnphlauldxqlncpl`,
West EU). Test-/CI-/config-infran är redan författad som om staging vore separat
(6 `TEST_*`-secrets, `STAGING_REQUIRED:'1'`, `verify_jwt`-gateway); 3 tester i
[update-record.staging.test.ts](../../tests/api/update-record.staging.test.ts)
(rad 56/83/110) är skippade i väntan på en redeploy-bar, mutations-säker
staging. Denna ADR beslutar miljön infran antar.

Forensiska fynd (Session 19 förarbets-pass):

- Inget migrations-infra: `supabase/migrations/` saknas; schemat lever bara på
  prod-projektet.
- `AIRTABLE_BASE_ID = 'app8uGPrVCVOm6LfD'` HÅRDKODAT i
  [`airtable-client.ts:1`](../../supabase/functions/_shared/airtable-client.ts)
  (ej env-drivet) → en staging-EF skulle skriva till prod-basen.
- Tabell-ID hårdkodat i
  [field-allowlists.ts](../../supabase/functions/_shared/field-allowlists.ts);
  fältet (`Anmälningsavgift`) adresseras redan per namn.
- Ingen deploy-automatik (manuell `supabase functions deploy`); Fas 7-skuld:
  prod-deploy måste filtrera bort `test-*`-funktioner.
- CI: 3 steg konsumerar `TEST_SUPABASE_*`; variabelnamnen är generiska → bara
  värden pekas om.

## Beslut

1. **Supabase:** separat långlivat staging-projekt på Pro (Supabase kanoniska
   tvåprojekts-mönster: staging + prod, projekt-val via `PROJECT_ID` i CI).
   Alltid på, native backup.
2. **Airtable:** dedikerad staging-bas, duplicerad UTAN records, seedad med
   syntetiska test-records — håller anmälar-PII utanför staging; ger
   kontrollerad mutations-säker target (allow-test rad 110).
3. **Miljö-isolering via env-driven config:** `AIRTABLE_BASE_ID` blir
   per-projekt Supabase-secret (prod→prod-bas-ID, staging→staging-bas-ID).
   Tabell/fält adresseras per NAMN (env-portabelt).

## Alternativ övervägt

- **Väg A — andra projektet på Free + keep-alive-cron.** $0; orgen har 1 ledig
  projektplats (lock=2). Avvisat för 11/10: free-projekt pausar efter 7 dgr
  inaktivitet och väcks ej automatiskt → keep-alive blir en tyst felande rörlig
  del under CI-grinden; ingen native backup. Dokumenterat som fallback om
  kostnad någon gång prioriteras om.
- **Väg C — branching (Pro).** Ephemera per-PR-miljöer; avvisat som PRIMÄR
  staging (vi vill ha en långlivad, konstant prod-spegel med deployad EF). Kan
  adderas senare för PR-previews.

## Förarbete (krävs före staging-bygget, oavsett vald väg)

1. Etablera migrations-infra: `db pull` mot prod → första migration (schema till
   git).
2. Gör `AIRTABLE_BASE_ID` env-drivet + byt operations-registrets
   tabell-adressering till namn.
3. Deploy-allowlist: håll `test-*`-prefix-funktioner borta från prod, tillåt dem
   på staging.

## Bygg-sekvens (efter förarbete)

1. Skapa staging-Supabase-projektet (Pro).
2. Så staging-DB via migration (`db push` mot staging).
3. Marcus skapar staging-Airtable-basen (utan records) + seedar syntetisk
   test-anmälan; Code läser nya bas-/tabell-ID:n empiriskt.
4. Sätt staging-secrets (`AIRTABLE_TOKEN` mot nya basen,
   `AIRTABLE_BASE_ID`=staging, `ADMIN_EMAILS`, `CORS_ALLOWED_ORIGINS`).
5. Deploy de 6 EF:erna till staging (`test-auth` tillåten här).
6. Peka om CI:s `TEST_SUPABASE_*`-värden mot staging (struktur orörd).
7. Aktivera de 3 skippade testerna + allow-testet mot seedad record.

## Konsekvenser

- Fas 5.5 avblockeras; deny/allow-tester kör mot mutations-säker miljö utan att
  röra prod.
- L110-klassen stängs strukturellt; miljö-isolering är inte längre
  dokumentations-fiktion.
- Schemat hamnar i git (migrations) — en länge saknad grund.
- Löpande Pro-kostnad.
- Airtable-staging kräver manuell schema-sync-disciplin (saknar migrations).
- Två deploy-mål ökar ytan; deploy-allowlist blir obligatorisk för
  prod-säkerhet.

## Öppna trådar

- **T1:** Supabase-plan-tier obekräftad (CLI döljer den). Kostnad: redan Pro →
  +~$10/mån projekt; Free → uppgradera org till Pro ($25/mån) + projekt. Marcus
  bekräftar via dashboard (Org→Billing).
- **T2:** Staging-bas-ID + nya tabell-ID:n fylls efter Marcus kopia (Code läser
  empiriskt).
- **T3:** Namn-vs-ID-adressering mot Airtable-API bekräftas mot Airtables
  API-docs i env-drive-refaktorn.
- **T4:** Schema-sync-disciplin staging↔prod (kadens + mekanism) detaljeras
  separat.

## Updates

### 2026-09-06 — Staging får en ANDRA roll: demots maskinrum (ADR-132)

[ADR-132](ADR-132-demolaget-staging-som-maskinrum-bakom-dorr-i-prod-appen.md)
låter Lottas demoläge köra mot staging-projektet — samma Edge Functions,
kvittoserie, Airtable-bas och mailspärr — bakom en dörr i prod-appens
Mer-meny. Rollen som långlivad prod-spegel för verifiering står orörd; det
som tillkommer är en fast, svep-undantagen demofixtur, en nattlig
återställning (`aterstall-demo`) och demoappens origin i
`CORS_ALLOWED_ORIGINS`. Branching-avvisningen ovan omprövas INTE (research
§ 11 fynd 5): en gren som demobackend vore en tredje roll och en egen ADR.

### 2026-09-06 — Vercel-förhandsvisningarnas CORS: en ANDRA, mönster-driven secret (TASK-415.1)

`TASK-415` mätte att Vercels PR-förhandsvisningar (unika origins per bygge)
byggde mot PROD-projektet, inte staging — se
[docs/research/pr-forhandsvisningar-och-backend-branschmonster-2026-09-06.md](../research/pr-forhandsvisningar-och-backend-branschmonster-2026-09-06.md).
Marcus GO på väg (a): koppla Vercels Preview-target till staging.
`CORS_ALLOWED_ORIGINS` (exakt matchning, punkt 4 ovan) kan inte bära en
origin som byter sträng vid varje bygge. Lösningen är en EGEN, valfri
staging-secret — `CORS_ALLOWED_ORIGIN_PATTERNS` — som prövas EFTER
exaktlistan och matchar Vercel-förhandsvisningarnas två adressformer via ett
`*`-mönster (branschprecedent: Supabases eget redirect-URL-mönster för
Vercel, <https://supabase.com/docs/guides/auth/redirect-urls>). `*` matchar
aldrig över en `.`-gräns, och ett mönster utan en literal domän-del
ignoreras fail-closed. `CORS_ALLOWED_ORIGINS` självt rör TASK-415.1 inte —
prod är opåverkad. Full mekanik: docs/specs/SECURITY-SPEC.md §6.2,
`supabase/functions/_shared/cors-origin-policy.ts`.
