# Prod-driftsättning av betalningsflödet — runbook + morgonchecklista

> Syfte: ta betalningsdomänen och jobbmotorn (`TASK-346`, `ADR-128`/`ADR-129`)
> från `main` till **prod**, Lottas skarpa miljö med verklig persondata och
> verkliga pengar, utan att komponera stegen i stunden. Varje steg bär
> kommandot verbatim, den förväntade utdatan, kvittot på att steget lyckades,
> och vad man gör när det inte gjorde det. Morgonchecklistan direkt nedan är
> en skannbar sammanfattning av HELA morgonen (inklusive de bitar som ligger
> utanför denna runbooks egen yta); varje detaljerat steg bor i sin egen
> sektion längre ned.
>
> **Vem kör denna: Marcus.** Samma lås som `prod-driftsattning-runbook.md`:
> `scripts/deny-prod-ref.sh` nekar varje agent-Bash-kommando som bär
> prod-projektets referens, och `scripts/create-betalningsfalt.mjs` blockerar
> prod-basen hårt i kod (`forbiddenBaseIds`). Detta är avsiktligt — en
> prod-driftsättning mot verklig persondata OCH verkliga pengar är ett
> Marcus-beslut, inte något en agent ska kunna trilla in i.
>
> **Syskondokument:**
> [`prod-driftsattning-runbook.md`](prod-driftsattning-runbook.md) (samma
> genre, aktivitetsloggen) ·
> [`staging-verifiering-runbook.md`](staging-verifiering-runbook.md) ·
> [`backfill-inbetalningar.md`](backfill-inbetalningar.md) (backfillens regel
> — denna runbook äger bara PROD-SEKVENSEN för den) ·
> [`atkomst-och-nycklar.md`](atkomst-och-nycklar.md) (åtkomstregistret).
> Appliceringsvägens mekanik (varför inget databas-lösenord behövs, vad
> `link` faktiskt gör): [`supabase/migrations/README.md`](../../supabase/migrations/README.md)
> § Betalningsdomänen + jobbmotorn.
>
> **Skrivet:** 2026-08-31, av en AFK-nattagent (`TASK-346.11`) mot det läge
> S113-natten (`tasks/sessions/2026-08-29-session-113.md` § Del 12) lämnade
> `main` i. Ingen prod-operation i denna fil är utförd av agenten som skrev
> den — varje kommando är obeprövat mot prod och läses, verifieras mot
> aktuellt läge, och köres av Marcus.

## Morgonchecklistan — skannbar, kopieringsbar

Sju punkter, samma form som paus 5:s stomme
(`tasks/sessions/2026-08-29-session-113.md` § MORGONCHECKLISTA), nu ifylld
med faktiska kommandon. **Punkt 1 är staging** (agenten har redan gjort sitt);
**punkt 2 och framåt är prod** — det är gränsen mellan var agenten stannade
och var Marcus tar vid.

1. **Läs handoffen, gå staging-QA:n.** Läs S113 Del 12:s sista landningsrad +
   `TASK-346.13`:s tolv steg. Öppna `http://localhost:5173` (eller den
   stagingde­ployen som är aktuell) mot fixturen `ZZ-GRANSKNING-S113`. Säg
   "justera X" högt eller i chatten → det blir en fix-skiva; det är INTE
   något som görs i denna fil.
2. **Prod-Postgres, i ordning:** § Steg 1–7 nedan (länka → migrationer →
   golv → Vault → cron → Realtime → länka tillbaka till staging). Ett
   kommando avgör om allt gick igenom:

   ```bash
   npx supabase migration list
   ```

   Förväntat: `20260830195728`, `20260830195900`, `20260830200100`,
   `20260901111500`, `20260906165100` visar `local` **och** `remote` ifyllda
   (se § Steg 2 för fullständig utdata). Denna femradiga lista gäller
   FÖRSTAGÅNGSSEKVENSEN ovan (§ Steg 1–7); en inkrementell skiva som TASK-367
   kör bara sin EGEN, senaste migration för sig — se § "Inkrementell deploy
   när flödet redan är i prod" nedan.
3. **Prod-basens fält + priser + backfill:** § Steg 11–13. Förutsättningen
   för allt annat: de nio fälten i tabellen i § Steg 11 måste finnas INNAN
   backfillen (§ Steg 13) kan hitta ett enda pris.
4. **Funktionsdeploy:** § Steg 8–10 (allowlist-PR:n landad → `bash
   scripts/fas4-prod-deploy.sh --deploya lvjsfnphlauldxqlncpl` i **eget
   terminalfönster**, aldrig via `!`-prefixet — CLAUDE.md § Prod-EF-deploy).
5. **Miljöflaggan i Vercel:** § Steg 14.

   ```bash
   npx vercel env ls production | grep VITE_FEATURE_BETALNINGAR
   ```

   Tomt svar = flaggan är av. Sätt den, deploya om, **verifiera med egna
   ögon i prod** (logga in, öppna `/mer`, se raden "Betalningar").
6. **Facit-stämplar** för de fyra amenderade ytorna (Hem, Åtgärds-sidan,
   persondetalj, Mer) — § Steg 16. Kräver att `TASK-346.7` har landat; kolla
   `npx backlog task 346.7 --plain` innan du börjar. `hog`-risk-drafts från
   natten (om några) granskas här också.
7. **Sedan:** `TASK-346.12` (riv flaggan, pensionera Airtable-ledgern som
   sanning) och `TASK-346.13` (QA i prod). Svep utgångna fixturer när det
   passar (`npm run seed:review -- --sweep`). Säg vilken bank Lottas Swish-
   export kommer ifrån — det blir en egen skiva för `TASK-346.10`:s verkliga
   matchning.

**Var agenten stannade:** varje kommando från och med punkt 2 kräver
prod-referensen och nekas mekaniskt för en agent
(`scripts/deny-prod-ref.sh`). Ingenting i denna fil är körd i prod.

## Var kommandona körs

**Kör allt i din egen terminal, utanför Claude Code**, av samma skäl som
`prod-driftsattning-runbook.md` § "Var kommandona körs": prod-ref-låset ser
bara Claude Codes egna Bash-anrop, och ber du en agent göra det åt dig faller
kommandot på låset — det är korrekt beteende, inte ett fel att felsöka.

**Arbetskatalog för Postgres-stegen (§ Steg 1–7):** en ren utcheckning av
`main` i huvudrepot (`~/Repon/miranon-media-admin`), inte en agent-worktree.
`link`-tillståndet (`supabase/.temp/project-ref`) är per arbetskatalog.

**Arbetskatalog för funktionsdeployen (§ Steg 9):** `fas4-prod-deploy.sh`
kräver SJÄLVT att du står på `main`, med rent träd, i nivå med
`origin/main` — det är en preflight i skriptet, inte en rekommendation här.

## Projekt-referenserna

| Miljö | Projektnamn | Ref | Skapad | Postgres (senast mätt) |
|---|---|---|---|---|
| Staging | `miranon-media-admin-staging` | `pqtshyierkdgwdnxuirz` | 2026-06-13 | 17.6 (mätt 2026-08-30, ADR-129 § Kontext) |
| **Prod** | `miranon-media-admin` | `lvjsfnphlauldxqlncpl` | **2026-03-30** | **omätt** |

**Prod är det ÄLDRE projektet — 2,5 månader äldre än staging.** Det är skälet
att § Steg 5:s sekundintervall-kontroll är ett riktigt steg och inte en
formalitet: ett äldre projekt kan i princip sitta på en äldre Postgres-build
än den staging mättes mot. Gissa aldrig att de är lika.

## Steg 0 — Förkrav

Samma disciplin som `prod-driftsattning-runbook.md` § Steg 0: mät ÅTKOMSTEN,
aldrig omgivningen.

```bash
npm run atkomst:diagnos
```

**Steget lyckades när:** `Supabase CLI: FINNS` och `npx supabase projects
list` innehåller båda projekten (se den runbookens § Steg 0 för fullständig
felsökningstabell — den återges inte här, samma facit gäller).

Utöver diagnosen, tre saker specifika för denna driftsättning:

1. **`main` utcheckad och ren, i nivå med `origin/main`.**

   ```bash
   cd ~/Repon/miranon-media-admin
   git fetch origin && git status --short && git log --oneline -1
   git rev-parse HEAD && git rev-parse origin/main
   ```

   `git status --short` tomt; de två SHA:erna identiska.

2. **De fem migrationsfilerna finns på disk** (de tre första landade med
   `TASK-346.3`, PR `#2147`; den fjärde —
   `20260901111500_inbetalning_notering.sql` — landade med promoverings-PR:n
   `fix/hem-betalningskort-marcus-iteration`; den femte —
   `20260906165100_inbetalning_kvitto_avbojt.sql` — landar med TASK-367
   (PR `#2416`, "kvitto att skicka" härlett ur Postgres) och finns alltså på
   disk först EFTER att DEN PR:en är mergad till `main`, inte i dagsläget):

   ```bash
   ls supabase/migrations/20260830195728_betalningsdomanen_inbetalningar_kvitton.sql \
      supabase/migrations/20260830195900_jobbmotorn_ko_cron_jobbtabeller.sql \
      supabase/migrations/20260830200100_purga_testrader_sentineler.sql \
      supabase/migrations/20260901111500_inbetalning_notering.sql \
      supabase/migrations/20260906165100_inbetalning_kvitto_avbojt.sql
   ```

   Alla fem listas. Saknas en: `main` är inte fast-forwardad tillräckligt
   långt — kör `git fetch` + `git merge --ff-only origin/main` innan du
   fortsätter.

3. **Prod-appens anon-nyckel** ligger redan i `.env.production`
   (gitignorerad? nej — den filen är explicit undantagen i `.gitignore` och
   ligger på disk i klartext, den bär bara publika `VITE_`-värden). Ingen ny
   nyckel ska skapas:

   ```bash
   cat .env.production
   ```

   Förväntat:

   ```text
   VITE_SUPABASE_URL=https://lvjsfnphlauldxqlncpl.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_zC5oCxJpSXCG6fGFg6aSxw_6aYKw8GB
   ```

   Detta ÄR värdet `jobbmotor_anon_nyckel` ska bära i § Steg 4 — samma
   nyckel, inte en ny.

## Inkrementell deploy när flödet redan är i prod

Denna runbook är skriven för FÖRSTAGÅNGSDRIFTSÄTTNINGEN (Steg 1–16 nedan).
Betalningsflödet har varit LIVE i prod sedan 2026-09-02 (S113/S115), så en
efterföljande skiva som bara lägger till en kolumn eller ändrar en Edge
Function — TASK-367 (PR `#2416`, "kvitto att skicka" härlett ur Postgres,
migration `20260906165100_inbetalning_kvitto_avbojt.sql`) är det första
exemplet — kör INTE hela sextonstegs-sekvensen. Den behöver bara tre steg,
i denna ordning, ALDRIG omvänd:

1. **Migrationen i prod först.** Samma `supabase db push`-mönster som
   `supabase/migrations/README.md` beskriver (`echo "" | npx supabase link
   --project-ref <prod-ref>` följt av `npx supabase db push`) — Marcus eget
   terminalfönster, ALDRIG via `!`-prefixet (samma skäl som § Prod-EF-deploy
   i `CLAUDE.md`: en hängning eller ett SIGKILL mitt i lämnar katalogen
   länkad mot prod).

   **Kvitto — kör INNAN steg 2 får påbörjas, aldrig ur `db push`s exit 0
   ensamt** (samma disciplin som § Steg 2 nedan: "Bekräfta att objekten
   faktiskt finns, aldrig ur exit 0 ensamt"):

   ```bash
   npx supabase migration list
   ```

   **Förväntad utdata** (mätt mot staging, `--output pretty`, samma rader i
   annan miljö — bland ev. fler rader):

   ```text
     Local            | Remote           | Time (UTC)
    ------------------|------------------|-----------------------
     ...
     `20260906165100` | `20260906165100` | `2026-09-06 16:51:00`
   ```

   Raden för DENNA PR:s migration (`20260906165100`) visar samma tidsstämpel
   i BÅDE `Local`- och `Remote`-kolumnen. **Formatet är CLI-versions-/
   TTY-beroende, prosaregeln är det bindande facit:** körd interaktivt i
   Marcus eget terminalfönster (en riktig TTY) ger `supabase migration list`
   normalt denna tabell utan flaggor; körd icke-interaktivt (pipe, en
   agent-shell utan TTY) gav SAMMA kommando i denna installation (CLI
   `2.116.0`) i stället JSON-rader
   (`{"local":"20260906165100","remote":"20260906165100",...}`) — mätt
   direkt, inte antaget ur `--help`. Läs kolumnerna/nycklarna oavsett form:
   det är `local`/`remote`-VÄRDET för `20260906165100` som avgör steget, inte
   utskriftens format.

   **Steget lyckades när:** `local` och `remote` är identiska för
   `20260906165100`. Ett `remote` som saknas eller står tomt (`null`/`""`)
   betyder att `db push` antingen kördes mot fel länkat projekt eller
   misslyckades halvvägs — **steg 2 får inte påbörjas**: en `--deploya` mot
   den kolumnen ännu inte i prod är exakt övergången denna sektions "Varför
   ordningen är låst"-stycke varnar för (`42703`/`PGRST204` → HTTP 500 på
   hela betalningsinkorgen och hela registreringsvägen).

   **Om kvittot saknas:** kontrollera `cat supabase/.temp/project-ref` —
   står den INTE på prod-refen länkade `db push` aldrig mot rätt projekt och
   ska köras om efter en ny `echo "" | npx supabase link --project-ref
   <prod-ref>`. Står refen rätt men `remote` ändå saknas: `db push`
   misslyckades under körningen — läs hela dess utskrift (inte bara raderna
   du kände igen, samma regel som § Steg 2), rätta felet, och kör om
   `npx supabase db push` följt av en NY `migration list`-kontroll innan
   `--deploya` någonsin körs.
2. **EF-deployen därefter**, `scripts/fas4-prod-deploy.sh --deploya`
   (allowlistens samtliga funktioner, ~12 min) — TASK-367 rör
   `registrera-inbetalning` och `hamta-oppna-betalningar`; batchen tar även
   med `get-event-attachments` (TASK-416.12), obesläktad men väntande i
   samma allowlist.
3. **Klienten är fri** — Vercel bygger och deployar `main` automatiskt, ingen
   manuell handling.

**Varför ordningen är låst hitåt, inte bara en vanesak:** `hamta-oppna-
betalningar` filtrerar `.eq('kvitto_avbojt', false)` och `registrera-
inbetalning` skriver `kvitto_avbojt: !medKvitto` till en kolumn som INTE
finns i prod förrän steg 1 kört. Deployas EF:erna FÖRE migrationen svarar
PostgREST `42703 undefined_column` (läsvägen) respektive `PGRST204`
(skrivvägen) på båda funktionerna — Postgres-felet blir `mapErrorToResponse`
→ HTTP 500, och HELA betalningsinkorgen (inte bara den nya sektionen) och
HELA registreringsvägen slutar fungera tills migrationen kommit ikapp.

**Mellanläget migration-i-prod/EF-fortfarande-gammal är ofarligt** (steg 1
klart, steg 2 inte påbörjat än): den gamla `registrera-inbetalning` skriver
aldrig till `kvitto_avbojt` (kolumnen har `default false`, och ett `insert`
utan kolumnen i sin lista lämnar den på defaultvärdet), och den gamla
`hamta-oppna-betalningar` frågar aldrig efter den. En overifierad, extra
kolumn ingen kod läser eller skriver är bara en oanvänd kolumn — samma
princip `_shared/betalningar-db.ts`s `INBETALNING_KOLUMNER`-docblock redan
slår fast ("en applicerad kolumn som ingen EF ännu läser är bara en oanvänd
kolumn").

**Mellanläget klient-ny/EF-fortfarande-gammal är ALLTID ofarligt**, oavsett
var i sekvensen Vercel råkar hinna före EF-deployen (Vercel bygger på varje
push till `main`, oberoende av när Marcus kör `--deploya`): den GAMLA
`registrera-inbetalning` läser body-fält EXPLICIT (`body?.anmalanRecordId`,
`body?.belopp`, `body?.betalsatt`, …) utan `...body`-spread och utan ett
strict-schema som avvisar okända nycklar — en klient som redan skickar
`medKvitto` mot den icke-uppdaterade funktionen får fältet TYST IGNORERAT.
Det finns alltså inget farligt fönster åt det hållet; risken sitter
uteslutande i EF-FÖRE-migration-riktningen ovan.

## Ordningen — och varför den är just denna

| # | Steg | Rör | Varför här |
|---|---|---|---|
| 1 | Länka mot prod | Supabase CLI | Allt Postgres-arbete nedan riktas av länken |
| 2 | Applicera migrationerna | Postgres-schema | Tabellerna och extensionerna måste finnas innan något annat |
| 3 | Kvittoseriens golv | Data, inte schema | `allokera_kvittonummer()` är fail-closed mot ett saknat golv |
| 4 | Vault-hemligheterna | Data | Cron ringer aldrig ut förrän alla tre finns |
| 5 | Cron-posten + sekundintervall | Verifikation | Prods PG-version är omätt (se ovan) |
| 6 | Realtime-publikationen | Verifikation | Utan den får klienten aldrig en push |
| 7 | Länka tillbaka till staging | Hygien | Annars går nästa `supabase`-kommando i denna katalog mot prod |
| 8 | `.prod-functions-allowlist.conf` | **Kod, egen PR** | Fail-closed — funktionerna deployas aldrig annars |
| 9 | Funktionsdeploy | Edge Functions | Skriv- och läsvägen för hela domänen |
| 10 | Deny-smoke mot de nio EF:erna | Verifikation | Bevisar grindarna innan datavägen rörs |
| 11 | Prod-fälten i basen | Airtable | Utan dem kan inget pris härledas |
| 12 | Priser på kommande event | Airtable | Härledningen bär inget utan priser |
| 13 | Backfill-GO | Data | Gör historiken kompatibel med härledningen |
| 14 | Miljöflaggan i Vercel | Frontend | Ytorna finns redan i koden, bakom flaggan |
| 15 | Rök-test / kedjebevis (Marcus val) | Verifikation | Se § Steg 15 — kostar ett riktigt kvittonummer |
| 16 | Facit-stämplar | Bokföring | De fyra amenderade ytorna, B3-mandatet |

---

## Steg 1 — Länka mot prod

```bash
cd ~/Repon/miranon-media-admin
cat supabase/.temp/project-ref          # vad är du länkad mot NU?
echo "" | npx supabase link --project-ref lvjsfnphlauldxqlncpl
cat supabase/.temp/project-ref          # och vad är du länkad mot nu?
```

**Förväntad utdata:** `{"project_ref":"lvjsfnphlauldxqlncpl","message":""}`,
följt av att `cat` skriver `lvjsfnphlauldxqlncpl`.

**Steget lyckades när:** `cat supabase/.temp/project-ref` skriver
prod-referensen. Läs den raden varje gång.

**Om det inte lyckades:** se `prod-driftsattning-runbook.md` § Steg 1 — samma
`echo "" |`-fälla, samma `LegacyInvalidAccessTokenError`-tolkning.

## Steg 2 — Applicera migrationerna

**Detta är INTE en scopad push av bara dessa fem filer.** `db push` applicerar
VARJE migration som ännu inte är registrerad som applicerad i prod — om andra
PRD:er landat migrationer på `main` sedan senaste prod-driftsättningen
applicerar de OCKSÅ. Läs hela listan `db push` skriver ut, inte bara raderna
du kände igen.

```bash
npx supabase migration list
npx supabase db push
npx supabase migration list
```

**Förväntad utdata** (bland ev. andra rader): `db push` skriver minst

```text
Applying migration 20260830195728_betalningsdomanen_inbetalningar_kvitton.sql...
Applying migration 20260830195900_jobbmotorn_ko_cron_jobbtabeller.sql...
Applying migration 20260830200100_purga_testrader_sentineler.sql...
Applying migration 20260901111500_inbetalning_notering.sql...
Applying migration 20260906165100_inbetalning_kvitto_avbojt.sql...
```

och i EXAKT den ordningen (tidsstämpel-sorterat, `20260830195728` <
`20260830195900` < `20260830200100` < `20260901111500` <
`20260906165100` — ordningen är bindande: se `supabase/migrations/README.md`
§ Betalningsdomänen för varför).

**Steget lyckades när:** andra `migration list` visar `local` **och**
`remote` ifyllda för alla fem versionerna. Bekräfta att objekten faktiskt
finns, aldrig ur exit 0 ensamt:

```bash
npx supabase inspect db table-stats --linked
npx supabase db query --linked "select extname, extversion from pg_extension where extname in ('pgmq','pg_cron','pg_net') order by extname"
```

`table-stats` ska lista `public.inbetalningar`, `public.kvitton`,
`public.kvittoserie_golv`, `public.jobb`, `public.jobb_rad`. Extensions-
kommandot ska ge tre rader. Mätt i staging 2026-08-30: `pgmq 1.5.1`,
`pg_cron 1.6.4`, `pg_net 0.20.3`. **En annan version i prod är inte i sig
ett fel** — Supabase versionerar extensions plattformsvis — men notera
avvikelsen om du ser en, den är en bra sak att ha bokförd.

**Mätt i prod 2026-09-02 (`TASK-359`): `pg_net 0.20.0`** — en tillåten
avvikelse mot stagings `0.20.3` per exakt samma resonemang som ovan; `pgmq`
och `pg_cron` omättes inte separat i det passet.

**Om det inte lyckades:** `migration list` säger exakt vilken av de fem som
gick igenom. Se § Rullbakåt R1 — läs den innan du river något, kvitton är
append-only och tabellerna kan bära verkliga rader så fort steg 9–10 är
körda.

## Steg 3 — Kvittoseriens golv (prod: 1001)

`allokera_kvittonummer()` kastar `P0002` hellre än att gissa — se
migrationsfilens § 3. Golvet är DATA och kan inte bo i migrationen, eftersom
Postgres inte kan läsa Airtable-ledgern.

```bash
npx supabase db query --linked "insert into public.kvittoserie_golv (ar, forsta_lopnummer, motivering) values (2026, 1001, 'Prod-ledgern i Airtable ar tom (matt read-only 2026-08-30, ADR-128 beslut 4) - serien borjar vid golvet.') on conflict (ar) do nothing"
npx supabase db query --linked "select ar, forsta_lopnummer, motivering, seedad_nar from public.kvittoserie_golv order by ar"
```

**Förväntad utdata:** en rad, `ar = 2026`, `forsta_lopnummer = 1001`.

**Steget lyckades när:** raden finns och `forsta_lopnummer = 1001` — INTE
1003 (det är stagingens golv, inte prods; kopiera aldrig staging-kommandot
rakt av, se `supabase/migrations/README.md` § "Kvittoseriens golv" för
stagingversionen och notera att talet är miljöspecifikt).

**Om det inte lyckades:** ett `on conflict (ar) do nothing` som inte skrev
någon rad betyder att en rad för 2026 redan fanns — läs den existerande
raden (samma `select` som ovan) innan du antar att något gick fel.

**ÅRSSTEGET — återkommande, inte en engångshandling.** Varje nytt kalenderår
behöver sin EGEN rad i `kvittoserie_golv` INNAN årets första kvitto utfärdas
— annars kastar `allokera_kvittonummer()` `P0002: kvittoserie: golv saknas
for ar <N>` på det första kvittoförsöket i januari. Detta är en öppen punkt
ur granskningen (ingen mekanism påminner om det) och denna runbook äger den
som ett STÅENDE årligt steg:

```bash
npx supabase db query --linked "insert into public.kvittoserie_golv (ar, forsta_lopnummer, motivering) values (<NASTA_AR>, 1001, 'Nytt kalenderar - serien startar om pa 1001 per ADR-109 beslut 1, ingen foregaende ledger for aret.') on conflict (ar) do nothing"
```

Sätt en kalenderpåminnelse (inte en kod-mekanism — det finns ingen) i god tid
före varje årsskifte, t.ex. första veckan i december.

## Steg 4 — Vault-hemligheterna (tre per miljö)

Namnen är låsta av migrationens läsning (`jobb_cron_tick()`, § 5 i
`20260830195900_jobbmotorn_ko_cron_jobbtabeller.sql`):
`jobbmotor_funktions_url`, `jobbmotor_anon_nyckel`,
`jobbmotor_delad_hemlighet`. Cron gör noll anrop förrän alla tre finns
("fail-quiet", § Steg 5 nedan förklarar utfallet före seedning).

**4a — URL och anon-nyckel (låg känslighet, publik nyckel).**

```bash
npx supabase db query --linked "select vault.create_secret('https://lvjsfnphlauldxqlncpl.supabase.co/functions/v1/jobb-konsument', 'jobbmotor_funktions_url', 'ADR-129 beslut 7 - konsumentfunktionens URL (prod)')"
npx supabase db query --linked "select vault.create_secret('sb_publishable_zC5oCxJpSXCG6fGFg6aSxw_6aYKw8GB', 'jobbmotor_anon_nyckel', 'ADR-129 beslut 7 - samma varde som .env.production VITE_SUPABASE_ANON_KEY')"
```

Anon-nyckeln ÄR den publika nyckeln ur § Steg 0 punkt 3 — samma värde, inte
en ny.

**4b — Den delade hemligheten (genereras EN gång, skrivs ALDRIG ut).**

Denna hemlighet ska INTE återanvändas från staging — en egen, ny, prod-bara
hemlighet. Kommandona nedan lämnar värdet ENDAST i en shell-variabel; inled
varje rad som INNEHÅLLER `$HEMLIGHET` i klartext med **ett mellanslag** —
`zsh`s (och `bash`s `HISTCONTROL=ignorespace`) hoppar då över raden i
historiken. Verifiera själv att din shell gör det innan du litar på det
(`setopt | grep -i histignorespace` i zsh):

```bash
 HEMLIGHET="$(openssl rand -hex 32)"
 printf '%s' "$HEMLIGHET" | shasum -a 256
```

**Skriv ner den utskrivna digest-raden** (den 64-teckens hex-strängen) — den
går INTE att räkna baklänges till hemligheten, och den är hela verifikatet
nedan.

```bash
 npx supabase db query --linked "select vault.create_secret('$HEMLIGHET', 'jobbmotor_delad_hemlighet', 'ADR-129 beslut 7 - delad hemlighet cron -> jobb-konsument (prod), seedad TASK-346.11')"
 npx supabase secrets set JOBBMOTOR_DELAD_HEMLIGHET="$HEMLIGHET" --project-ref lvjsfnphlauldxqlncpl
 unset HEMLIGHET
```

**Verifikatet — digest-jämförelse, eftersom EF-secrets aldrig kan läsas
tillbaka.** `jobb-konsument` skriver ALDRIG ut hemligheten, inte ens dess
längd (se funktionens eget filhuvud) — det finns alltså ingen väg att fråga
Edge Function-sidan "vad är ditt värde?". Pariteten vilar i stället på att
SAMMA `$HEMLIGHET`-variabel användes för båda skrivningarna ovan, plus att
Vault-sidan går att läsa tillbaka och jämföra mot digesten du skrev ner:

```bash
npx supabase db query --linked "select encode(digest(decrypted_secret,'sha256'),'hex') as digest from vault.decrypted_secrets where name = 'jobbmotor_delad_hemlighet'"
```

**Steget lyckades när:** denna digest är EXAKT identisk med den du skrev ner
i steget ovan. (Om `digest()` ger `function digest(text, unknown) does not
exist`: `pgcrypto` ligger i schemat `extensions` i vissa projekt — kör om med
`extensions.digest(...)`.)

**Kontrollera att alla tre finns:**

```bash
npx supabase db query --linked "select name, created_at from vault.decrypted_secrets where name like 'jobbmotor_%' order by name"
```

**Förväntad utdata:** tre rader — `jobbmotor_anon_nyckel`,
`jobbmotor_delad_hemlighet`, `jobbmotor_funktions_url`.

**Om det inte lyckades:** en `unique_violation` på `vault.create_secret`
betyder att namnet redan finns (en tidigare, avbruten körning?) — läs
`vault.decrypted_secrets` för att se vad som står där innan du skriver om
något; `vault.update_secret(id, new_secret)` är rätt väg för en ÄNDRING, inte
ett andra `create_secret`-anrop.

## Steg 5 — Cron-posten + sekundintervall-kontrollen

Migrationen skapar posten med `'10 seconds'` som schema. Sekundgranularitet
i `pg_cron` kräver — enligt Supabase egen dokumentation, citerad i
`docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md` § B6 —
Postgres-version **≥ 15.1.1.61** (Supabases egna platt­forms-versionsnummer,
inte bara major.minor). Staging mätte `17.6` och accepterades utan vidare
tolkning eftersom major version 17 ligger långt bortom tröskelns 15-serie.
**Prod är OMÄTT** (§ Projekt-referenserna ovan — och det äldre projektet är
just skälet att inte anta parkitet).

```bash
npx supabase db query --linked "select version()"
```

**Tolkningsregel:**

| Utfall | Åtgärd |
|---|---|
| Major version ≥ 16 | Fortsätt, sekundintervallet håller med god marginal |
| Major version = 15 | Slå upp EXAKT build-nummer i Dashboard → Project Settings → Infrastructure, jämför mot 15.1.1.61, innan du litar på `'10 seconds'` |
| Major version < 15 | Använd fallbacket nedan — **inte en trasig motor**, bara ett längre intervall |

**Verifiera cron-posten:**

```bash
npx supabase db query --linked "select jobid, jobname, schedule, active, username from cron.job where jobname = 'jobbmotor-tick'"
```

**Förväntad utdata:** en rad, `schedule = '10 seconds'`, `active = true`,
`username = postgres`.

**Fallback vid otillräcklig PG-version** (ADR-129 § Obelagt: minutintervall
plus kicken är fortfarande en fungerande motor, inte en trasig — kicken via
`EdgeRuntime.waitUntil` ger fortsatt snabb respons på det FÖRSTA kvittot i en
batch oavsett cron-intervall):

```bash
npx supabase db query --linked "select cron.alter_job(job_id := (select jobid from cron.job where jobname = 'jobbmotor-tick'), schedule := '* * * * *')"
```

Verifiera om med samma `select … from cron.job …` som ovan — `schedule` ska
nu visa `* * * * *`.

**Läs körningsloggen** — men läs INTE `return_message` som funktionens svar.
Cron-jobbets kommando är `select public.jobb_cron_tick();`
(`supabase/migrations/20260830195900_jobbmotorn_ko_cron_jobbtabeller.sql`
rad 487) — en ren `SELECT`, och pg_cron bokför i `return_message` sin EGEN
exekverings-bokföring för en SELECT (t.ex. `1 row`), INTE värdet raden
faktiskt returnerade. **Mätt i prod 2026-09-02 (`TASK-359`):**
`return_message = '1 row'`, `status = 'succeeded'` — en tidigare version av
detta stycke påstod att `return_message` visar funktionens JSON
(`"skal":"inget-vantar"` / `"vault-saknar-varden"`) direkt; det stämmer
INTE för denna jobbtyp.

```bash
npx supabase db query --linked "select status, return_message, start_time from cron.job_run_details where jobid = (select jobid from cron.job where jobname='jobbmotor-tick') order by start_time desc limit 5"
```

**Läs den FAKTISKA JSON:en genom att anropa funktionen direkt** — det är
FÖRVÄNTAT, inte ett fel, att den visar `anrop: false, skal: "inget-vantar"`
tills en riktig inbetalning skapar ett jobb (se migrationens § 5 kommentar):

```bash
npx supabase db query --linked "select public.jobb_cron_tick() as tick"
```

**Steget lyckades när:** körningsloggen visar minst en rad med
`status = 'succeeded'` (bevisar att cron faktiskt TICKAR), OCH det direkta
anropet ovan svarar med giltig JSON. Ett svar med
`"skal":"vault-saknar-varden"` betyder att § Steg 4 inte är klart än — gå
tillbaka dit. `"skal":"inget-vantar"` är det NORMALA läget tills en verklig
inbetalning finns.

## Steg 6 — Realtime-publikationen

```bash
npx supabase db query --linked "select schemaname, tablename from pg_publication_tables where pubname = 'supabase_realtime' and tablename in ('inbetalningar','jobb','jobb_rad') order by tablename"
```

**Förväntad utdata:** tre rader — `inbetalningar`, `jobb`, `jobb_rad`.
**`kvitton` ska INTE finnas i listan** — det är medvetet uteslutet (migrationens
§ 5-kommentar: kvittots synliga tillstånd bärs av `jobb_rad`).

**Steget lyckades när:** exakt de tre raderna syns, inte färre. Saknas en är
migrationen inte fullständigt applicerad — tillbaka till § Steg 2.

## Steg 7 — Länka tillbaka till staging

**Hoppa inte över detta**, av samma skäl som `prod-driftsattning-runbook.md`
§ Steg 8: `link`-tillståndet är sticky och osynligt.

```bash
echo "" | npx supabase link --project-ref pqtshyierkdgwdnxuirz
cat supabase/.temp/project-ref
```

**Steget lyckades när:** `cat` skriver `pqtshyierkdgwdnxuirz`.

---

## Steg 8 — `.prod-functions-allowlist.conf` (FÖRUTSÄTTNING, inte ett live-steg)

**Detta är en KOD-ändring i en git-spårad policyfil, inte något som redigeras
på plats under driftsättningen.** Filen läses av `scripts/deploy-prod-functions.sh`
(som `fas4-prod-deploy.sh --deploya` anropar internt) och är fail-closed: en
funktion som inte står här deployas ALDRIG till prod, oavsett hur färdig den
är. Samma mönster som `TASK-201.9` § Steg 0.1 (aktivitetsloggens två EF:er) —
landa raderna som en egen liten PR, genom den vanliga merge-kön
(`ADR-076` — även Marcus push går via PR, ruleset diskriminerar inte på
identitet), FÖRE du kör § Steg 9.

**Kontrollera först att raderna verkligen saknas** (de gjorde det, mätt av
denna runbooks författare 2026-08-31 mot `main` `3fcc11de` — verifiera igen,
läget kan ha ändrats):

```bash
bash scripts/deploy-prod-functions.sh --list
```

Förvänta dig `[EXKLUDERAD]` framför alla nio: `registrera-inbetalning`,
`hantera-inbetalning`, `koa-kvitton`, `jobb-konsument`, `skicka-kvitto-igen`,
`hamta-oppna-betalningar`, `hamta-inbetalningar`, `hamta-jobbstatus`,
`hamta-kvittolank`.

**Lägg till, i filens egna konvention (kommentarblock med datum + GO-citat
före raderna), sist i filen:**

```text
# Betalningsflödet (TASK-346.4/346.11, <datum>, Marcus GO "<citat>"):
registrera-inbetalning
hantera-inbetalning
koa-kvitton
jobb-konsument
skicka-kvitto-igen
hamta-oppna-betalningar
hamta-inbetalningar
hamta-jobbstatus
hamta-kvittolank
```

**Steget lyckades när** ändringen landat på `main` (via PR + merge-kön) och:

```bash
git fetch origin && git merge --ff-only origin/main
bash scripts/deploy-prod-functions.sh --list
```

visar deploy-setet med de nio inkluderade och `[EXKLUDERAD]` bara kvar för
`test-*`-funktionerna.

**Om det inte lyckades:** en agent kan bygga PR:n (det är en vanlig
kod-ändring, inte en prod-operation — filen i sig är statisk repo-konfig),
men landningen går via samma PR + merge-kö-flöde som allt annat, och
`--deploya` i § Steg 9 vägrar deploya funktioner som inte står här (fail-closed
med avsikt).

## Steg 9 — Funktionsdeploy

Förkrav: § Steg 8 landad, `--list` visar de nio i deploy-setet. Kör i **eget
terminalfönster** — ALDRIG via `!`-prefixet (CLAUDE.md § Prod-EF-deploy:
`!`-kanalens 2-minuterstak kan flytta körningen till bakgrunden eller döda
den, och skriptets säkerhetsmekanism ÄR en EXIT-trap som inte körs vid
SIGKILL).

```bash
bash scripts/fas4-prod-deploy.sh --kontrollera lvjsfnphlauldxqlncpl   # läser läget, ändrar inget — kör FÖRST
bash scripts/fas4-prod-deploy.sh --deploya     lvjsfnphlauldxqlncpl   # länka → deploya allowlisten → verifiera → länka tillbaka
```

Skriptets egen preflight kräver att du står på `main`, med rent träd, i nivå
med `origin/main` — om det vägrar där, det är inte ett fel i denna runbook,
det är skriptet som skyddar dig mot att deploya från fel träd.

**Förväntad utdata:** `--deploya` skriver en rad per funktion, sedan
verifierar och länkar tillbaka till staging automatiskt (dess egen EXIT-trap
— du behöver INTE göra § Steg 7 igen efteråt för funktionsdelen).

**Steget lyckades när:**

```bash
npx supabase functions list --project-ref lvjsfnphlauldxqlncpl
```

visar alla nio som `ACTIVE` med färsk `UPDATED_AT` (inte `VERSION` — en
deploy bumpar `VERSION` på funktioner som INTE rördes också, `UPDATED_AT`
står stilla för dem, CLAUDE.md § Prod-EF-deploy).

**Om det inte lyckades:** skriptets exitkod bär meningen (0 = allt gick
igenom, 1 = preflight fällde, 2 = en skarp operation avbröts — läs utdatan,
återlänkningen till staging har ändå körts via trappen). Läs `prod-
driftsattning-runbook.md` § Rullbakåt R2 för den generella "en Edge Function
deployades trasig"-vägen (samma mekanik, ingen rollback-till-föregående-
version finns i Supabase CLI).

## Steg 10 — Deny-smoke mot de nio EF:erna

Alla nio har `verify_jwt = true` i `supabase/config.toml` — gatewayen
avvisar ett anrop utan giltig JWT MED 401 innan koden ens körs, samma
mekanik som `prod-driftsattning-runbook.md` § Steg 5 beskriver i detalj.
`jobb-konsument` har DESSUTOM sin egen auktorisation (den delade
hemligheten) — ett anrop med anon-nyckeln som Bearer-token PASSERAR
gatewayen men faller på `jobb-konsument`s egen kontroll, INTE på
`requireUser` (funktionen använder aldrig den — se dess filhuvud).

```bash
set -a; source .env.production; set +a
PROD_URL="$VITE_SUPABASE_URL"
ANON="$VITE_SUPABASE_ANON_KEY"
FN="$PROD_URL/functions/v1"

for par in \
  "registrera-inbetalning:POST" "hantera-inbetalning:POST" \
  "koa-kvitton:POST" "jobb-konsument:POST" "skicka-kvitto-igen:POST" \
  "hamta-oppna-betalningar:GET" "hamta-inbetalningar:GET" \
  "hamta-jobbstatus:GET" "hamta-kvittolank:GET"; do
  namn="${par%%:*}"; metod="${par##*:}"
  fel_metod="POST"; [ "$metod" = "POST" ] && fel_metod="GET"
  echo "== $namn =="
  curl -s -o /dev/null -w '  anon        %{http_code}\n' -X "$metod" "$FN/$namn"
  curl -s -o /dev/null -w '  fel metod   %{http_code}\n' -X "$fel_metod" "$FN/$namn"
  curl -s -o /dev/null -w '  anon-bearer %{http_code}\n' -X "$metod" -H "Authorization: Bearer $ANON" "$FN/$namn"
done
```

**Förväntad utdata:** `401` på samtliga tre rader för samtliga nio funktioner
— **27 gånger `401`, noll undantag.** Precis som i
`prod-driftsattning-runbook.md` § Steg 5: en `200` någonstans betyder att en
obehörig kan nå en betalnings-EF, stoppa omedelbart. En `404` betyder att den
specifika funktionen inte deployades — tillbaka till § Steg 9.

**Steget lyckades när:** alla 27 utfall är `401`.

## Steg 11 — Prod-fälten i Airtable-basen

Nio fält, exakt samma form som staging (`TASK-346.2`, verifierat empiriskt
där — fem fall + en bråkdelskontroll, se
[`data-model.md`](data-model.md) § "Prod-fälten — ÖPPET AC #5 för Marcus").
Källan för hela tabellen nedan är den sektionen — läs den där för
resonemanget bakom varje typval, den återges här bara som checklista:

| Tabell (prod-ID) | Fält | Typ |
|---|---|---|
| Eventinnehåll (`tblfwqsNPSYd6o44L`) | `Pris (kr)` | number, precision 2 |
| Eventinnehåll (`tblfwqsNPSYd6o44L`) | `Anmälningsavgift (kr)` | number, precision 2 |
| Eventplanering (`tblVE3UKWl1CKrphV`) | `Pris (kr)` | number, precision 2 |
| Eventplanering (`tblVE3UKWl1CKrphV`) | `Anmälningsavgift (kr)` | number, precision 2 |
| Anmälningar (`tbloOcrppVoyrHbrq`) | `Avtalat pris (kr)` | number, precision 2 |
| Anmälningar (`tbloOcrppVoyrHbrq`) | `Summa inbetalt (kr)` | number, precision 2 |
| Anmälningar (`tbloOcrppVoyrHbrq`) | `Kvittonummer` | singleLineText |
| Anmälningar (`tbloOcrppVoyrHbrq`) | `Pris (kr) (from Event)` | multipleLookupValues av Eventplanering.`Pris (kr)` via länken `Event` (`fldi3enUaMdbuGSlm`) |
| Anmälningar (`tbloOcrppVoyrHbrq`) | `Saknas (kr)` | formula — **DEN KORRIGERADE (runda 2) formeln**, se nedan |

**Ordningen är en invariant:** Eventinnehåll/Eventplanering FÖRE lookupen,
lookupen FÖRE formeln. En omkastad ordning ger "fält hittades inte" från
Airtable.

**Formeln, verbatim** (den KORRIGERADE versionen — narvaro-testet `& "" !=
""`, inte ett sanningsvärdestest, se `data-model.md` § "Kända kosmetisk
kant" för varför den första versionen läste ett explicit 0-pris som
"okänt"):

```text
IF(
  OR({Avtalat pris (kr)} & "" != "", {Pris (kr) (from Event)} & "" != ""),
  IF({Avtalat pris (kr)} & "" != "", {Avtalat pris (kr)}, {Pris (kr) (from Event)}) - {Summa inbetalt (kr)},
  BLANK()
)
```

**KÄND LUCKA i skriptvägen, STÄNGD 2026-09-01 (PR `#2192`) — historiken
bokförd, inte bara facit.** `data-model.md` sa att prod-fälten kan skapas
"t.ex. via `AIRTABLE_PROD_GODKAND_AV_MARCUS`-vägen
`create-eventinnehall-modell.mjs`/`create-betalningsfalt.mjs` redan
etablerar" — det stämde bara för HALVA det påståendet fram till PR `#2192`:
`scripts/create-eventinnehall-modell.mjs` hade vägen (`--bas <baseId>` +
miljövariabeln) sedan `TASK-309.9`, men `scripts/create-betalningsfalt.mjs`s
enda CLI-flagga var `--dry-run` och `CONFIG.expectedBaseId` var hårdkodad
till staging utan någon parameter för att rikta om den (verifierat av denna
runbooks författare 2026-08-31 — se PR:ens beskrivning för den fulla
diff:en). Väg A nedan (av de "Två vägar" som stod här) valdes av Marcus
mandat 2026-09-01 (verbatim i
`tasks/sessions/2026-08-29-session-113.md` § MANDAT) och implementerades i
PR `#2192`, `feat/betalningsfalt-prod-vagen`.

**Nuläget: `create-betalningsfalt.mjs` bär samma `--bas`/
`AIRTABLE_PROD_GODKAND_AV_MARCUS`-mönster som `create-eventinnehall-modell.mjs`**
(`resolveTargetBaseId`/`PROD_GODKAND_ENV_VAR`, `scripts/create-betalningsfalt.mjs`
kring rad 342–386 — radnumren kan glida, verifiera mot faktisk kod). Utan
`--bas` körs skriptet mot staging precis som tidigare, prod förblir
blockerad i `forbiddenBaseIds`. Mot prod:

```bash
AIRTABLE_PROD_GODKAND_AV_MARCUS=app8uGPrVCVOm6LfD \
AIRTABLE_SCHEMA_TOKEN=<prod-scopad-PAT> \
node scripts/create-betalningsfalt.mjs --bas app8uGPrVCVOm6LfD --dry-run
```

Kör först UTAN `--dry-run`-flaggan borttagen (dvs. med den kvar, som ovan)
för att se planen; ta bort `--dry-run` för att faktiskt skriva. Miljövariabelns
värde måste vara EXAKT samma bas-ID som `--bas`, satt av Marcus på
kommandoraden i klartext — annars VÄGRAR skriptet (fail-closed,
`resolveTargetBaseId`).

**Sidoeffekt av implementationen, värd att känna till:** tabellidentifieringen
i `create-betalningsfalt.mjs` byttes från hårdkodat staging-`tableId` till
NAMN-baserad uppslagning (`findTableByName`) för samtliga tre tabeller —
Eventinnehåll har nämligen OLIKA tabell-ID i staging (`tblwqaBrkm6hJPITd`)
och prod (`tblfwqsNPSYd6o44L`, samma ID som tabellen nedan), medan
Eventplanering/Anmälningar råkar dela ID mellan baserna. Ändrar inget i
tabellen nedan — bara HUR skriptet internt hittar rätt tabell i vilken bas
som helst.

Prod-token för schemaändringar kräver en PAT scopad mot PROD-basen, inte
`.env.seed`s stagingscopade token (samma begränsning som
`create-eventinnehall-modell.mjs`s filhuvud beskriver för sin egen
`--bas`-väg) — se [`atkomst-och-nycklar.md`](atkomst-och-nycklar.md).

**Steget lyckades när** en läsning bekräftar alla nio fält:

```bash
npx backlog task 346.2 --plain   # AC-listan att korsläsa mot
```

och en snabb kontroll i Airtables UI (eller `describe_table` via
Airtable-MCP:t, som INTE är förbjudet mot prod på samma sätt som skriv-
operationer — läsning av schema är ofarligt) att alla nio fält finns med
rätt typ och att `Saknas (kr)`s formel matchar strängen ovan EXAKT (kopiera
den, skriv den inte av för hand — en enda tappad `& "" != ""` återinför
0-prisbuggen).

## Steg 12 — Priser på kommande event

**Härledningen bär ingenting utan priser.** Mätt i staging (§ Backfill-
mätningen, se `backfill-inbetalningar.md`): 37 av 38 icke-fixtur-anmälningar
kunde inte backfillas eftersom priset saknades i alla fyra härledningsnivåer.
Samma sak gäller framåt: en helt korrekt betalningsdomän ger ändå "saknas
hela priset" för varje event vars `Pris (kr)`/`Anmälningsavgift (kr)` står
tomma.

**Innan backfillen (§ Steg 13):**

1. Lista kommande `Planerat`-event i prod (Airtable-vy eller
   `mcp__airtable__list_records` mot Eventplanering, filtrerat på
   `Startdatum > TODAY()`).
2. För varje: sätt `Pris (kr)` och `Anmälningsavgift (kr)` — antingen direkt
   på Eventplanering-raden (per-event-override) eller på motsvarande
   Eventinnehåll-standard (ärvs av alla event av den typen, se `data-model.md`
   § "Uppslaget Event (source) × Typ").
3. En föreläsning har bara `Pris (kr)`, inget avgifts-fack.

**Steget lyckades när** varje `Planerat`-event med startdatum efter dagens
datum bär ett numeriskt pris — antingen eget eller ärvt via sin
Eventinnehåll-standard. Kör backfillens dry-run (§ Steg 13) och läs
`pris-okant`-antalet: **lågt** betyder detta steg är gjort, **stort** betyder
det inte är det.

## Steg 13 — Backfill-GO

Backfillens REGEL, avvikelseklasserna och Lottas-lista-processen äger
[`backfill-inbetalningar.md`](backfill-inbetalningar.md) i sin helhet —
DENNA runbook äger bara PROD-SEKVENSEN, per den filens egen hänvisning
("Skriv det där, inte här: denna fil beskriver backfillens regel, runbooken
äger prod-sekvensen").

**Ordningen** (samma som `backfill-inbetalningar.md` § Prod § "Ordningen när
beslutet väl är fattat"):

1. Förutsättningen: § Steg 11 (fälten) och § Steg 12 (priserna) klara.
2. **Upplåsningen — formen är BESTÄMD sedan `TASK-360`** (Marcus mandat
   2026-09-02, "Kör backfill. Gör det ordentligt.") — samma typa-för-att-
   bekräfta-klass som `--bas`/`AIRTABLE_PROD_GODKAND_AV_MARCUS` fick i
   `scripts/create-betalningsfalt.mjs` (PR #2192). Prod förblir låst av
   FYRA oberoende lager (`validateBaseGuard`, `validateProjectRef`,
   `provaLanktillstand`, `scripts/deny-prod-ref.sh`) — ingen rivs, var och
   en får sin EGEN override. **Kör i din EGEN terminal, utanför Claude
   Code** (samma skäl som resten av denna runbook: `scripts/deny-prod-ref.sh`
   fäller varje agent-kommando som bär project-refen, oavsett om det är en
   skarp körning eller bara ett `grep`):

   ```bash
   AIRTABLE_PROD_GODKAND_AV_MARCUS=<prod-bas-id> \
   PROD_REF_GODKAND_AV_MARCUS=<prod-ref> \
     npm run backfill:inbetalningar -- --bas <prod-bas-id> --projekt-ref <prod-ref>
   ```

   `<prod-bas-id>` = Airtable-prodbasens ID (`.backfill-inbetalningar-policy.json`s
   `forbiddenBaseIds`, samma värde som `docs/reference/atkomst-och-nycklar.md`
   § Register). `<prod-ref>` = Supabase-prodprojektets ref (denna runbooks
   § Projekt-referenserna-tabell, ELLER `.prod-ref-policy.conf`s
   `PROD_REF_PROD` — läs filen, klistra inte in värdet i ett Bash-kommando som
   inte redan bär bypass-prefixet). BÅDA miljövariablerna krävs SAMTIDIGT —
   backfillen skriver till Airtable-spegeln OCH Postgres i samma körning, och
   `validateMiljoKonsistens` (TASK-360) vägrar en kombination där bara den
   ena är satt (t.ex. `--bas` prod men `--projekt-ref` staging).
   `PROD_REF_GODKAND_AV_MARCUS` är SAMMA variabel `scripts/deny-prod-ref.sh`
   redan kräver för Bash-anropet självt — namnet läses ur
   `.prod-ref-policy.conf`s `PROD_REF_BYPASS_VAR`, inte hårdkodat i skriptet,
   så det finns EN bypass-form i huset.

   **Airtable-token:** `STAGING_AIRTABLE_TOKEN` (samma variabelnamn, missvisande
   men oförändrat) måste peka på en PAT med LÄS+SKRIV mot prod-basen —
   `.env.seed`s token är staging-scopat (samma begränsning som § Steg 11 redan
   bokför för `AIRTABLE_SCHEMA_TOKEN`), så sätt den inline på SAMMA kommandorad,
   aldrig i `.env.seed`:

   ```bash
   AIRTABLE_PROD_GODKAND_AV_MARCUS=<prod-bas-id> \
   PROD_REF_GODKAND_AV_MARCUS=<prod-ref> \
   STAGING_AIRTABLE_TOKEN=<prod-scopad-PAT> \
     npm run backfill:inbetalningar -- --bas <prod-bas-id> --projekt-ref <prod-ref>
   ```

   Se `docs/reference/atkomst-och-nycklar.md` för var en prod-scopad PAT
   hämtas. Sviten (§ A11) LÅSER AKTIVT att prod-refens VÄRDE inte står i
   backfill-policyn — den posten rörs inte av denna form, eftersom bypass-
   värdena alltid kommer från miljön, aldrig från en fil i repot.
3. **Dry-run, läs planen** (utelämna `-- --utfor` — samma kommando som ovan,
   fast utan `--utfor`. Detta är det FÖRSTA du kör mot prod):

   ```bash
   AIRTABLE_PROD_GODKAND_AV_MARCUS=<prod-bas-id> \
   PROD_REF_GODKAND_AV_MARCUS=<prod-ref> \
   STAGING_AIRTABLE_TOKEN=<prod-scopad-PAT> \
     npm run backfill:inbetalningar -- --bas <prod-bas-id> --projekt-ref <prod-ref>
   ```

   Läs `pris-okant`- och `fack-motsagelse`-listorna. Är `pris-okant` stort:
   tillbaka till § Steg 12, fyll fler priser, kör om dry-run. Varje rad där en
   override faktiskt släpper igenom skrivs synligt till stderr
   ("BYPASS ANVÄND", TASK-360) — läs dem, de ska stämma med det du precis
   dikterade.
4. **Avvikelselistan mot Lottas lista** (har hon fört en) — rätta priserna
   och facken i BASEN (aldrig i inbetalningen, se `backfill-inbetalningar.md`
   § "Vad backfillen ALDRIG gör"), kör om dry-run, upprepa tills listan är
   förstådd.
5. **Skarpt** — lägg till `-- --utfor` sist:

   ```bash
   AIRTABLE_PROD_GODKAND_AV_MARCUS=<prod-bas-id> \
   PROD_REF_GODKAND_AV_MARCUS=<prod-ref> \
   STAGING_AIRTABLE_TOKEN=<prod-scopad-PAT> \
     npm run backfill:inbetalningar -- --bas <prod-bas-id> --projekt-ref <prod-ref> --utfor
   ```

**"Skip vs. topp-upp" — en öppen fråga denna runbook inte avgör.**
Avvikelseklassen `har-aktiva-inbetalningar` (en anmälan som redan bär en
icke-backfill-inbetalning) HOPPAS ÖVER av skriptet — den skriver aldrig
ovanpå. För en anmälan där Lottas lista visar att MER borde ha betalats än
vad de aktiva inbetalningarna summerar till finns två raka vägar som
skriptet INTE väljer mellan: (a) lämna anmälan som den är (skip) och låta
Lotta registrera resten manuellt i inkorgen efteråt, eller (b) registrera en
KOMPLETTERANDE `Historik`-inbetalning för mellanskillnaden ("topp-upp") så
att härledningen blir korrekt direkt. Båda är rimliga; formen är produkt-
/bokföringsval Marcus gör vid genomgången av avvikelselistan, inte ett
skriptbeteende att koda in i natt.

**Förväntade tal:** finns INTE att skriva av här (prod är omätt av en
agent) — se `backfill-inbetalningar.md` § "Förväntade tal" för formen: läs
dem ur dry-run:ens EGEN FÖRE-rad vid körningstillfället.

**Steget lyckades när:** EFTER-raden visar en summa som stämmer mot Lottas
lista (om hon har en), och `pris-okant`/`fack-motsagelse`-listorna är tomma
eller förstådda.

## Steg 14 — Miljöflaggan i Vercel

Koden läser `env.VITE_FEATURE_BETALNINGAR === 'pa'`
(`src/lib/funktionsflaggor.ts`) — värdet måste vara EXAKT strängen `pa`, inte
`true` eller `1`. `.env.production` saknar raden helt i dag (bekräftat på
disk 2026-08-31) — det ÄR avstängningen, per konstruktion.

```bash
npx vercel env ls production | grep VITE_FEATURE_BETALNINGAR   # tomt = av
npx vercel env add VITE_FEATURE_BETALNINGAR production
# klistra in: pa
```

**En tillagd env-var påverkar INTE den redan byggda, live Production-
deployen** — Vite bakar in `VITE_`-värden vid BYGGTID. En ny variabel kräver
en NY produktionsdeploy för att slå igenom:

```bash
npx vercel --prod
```

(eller: promota en ny build via Vercel-dashboarden — se
`prod-driftsattning-runbook.md` § Steg 6/R3 för samma distinktion mellan
"env-var satt" och "faktiskt utrullad".)

**Steget lyckades när** du **verifierar med egna ögon i prod**: logga in på
`admin.miranon.dev`, öppna `/mer`, se den elfte raden "Betalningar" (se
`tasks/sessions/bilagor/s64-mer-konvergens/AMENDERING-2026-08-31-betalningar-raden.md`
för exakt vad raden ska se ut som — ikon `Banknote`, sist i grupp 1). Klicka
in och bekräfta att sidan `/mer/betalningar` faktiskt renderar (inte en
redirect tillbaka till `/mer` — den redirecten är precis vad som händer när
flaggan INTE är på, `beforeLoad` i `src/routes/_authenticated/mer/
betalningar.tsx`).

**Om det inte lyckades:** en synlig redirect till `/mer` betyder ANTINGEN att
env-var-ändringen inte slog igenom (kör om `vercel --prod`, eller kontrollera
att den nya deployen faktiskt är Production-märkt) ELLER att en gammal
service-worker-precache servar den förra bundeln — se
`staging-verifiering-runbook.md`s fällor för samma klass av problem i
stagingmiljön; åtgärden i prod är densamma (`Clear site data`).

## Steg 15 — Rök-test / kedjebevis i prod (Marcus val)

Denna runbooks AC ber inte uttryckligen om ett rök-test, men samma form som
`prod-driftsattning-runbook.md` (dess § Steg 7) och 346.4:s egna, sex-stegs
kedjebevis i staging (registrera → skicka → jobb-konsument-tick → mottaget
kvitto med PDF → signerad länk → makulera) gör det till god praxis att
verifiera hela kedjan innan Lotta möter ytan skarpt. **Kostnaden är verklig
och specifik för prod, till skillnad från staging:** ett kvitto kan aldrig
raderas (append-only, `on delete restrict`), så EN körning FÖRBRUKAR
`MM-2026-1001` permanent — antingen som ett riktigt första kvitto, eller
som ett testkvitto som sedan makuleras (men fortfarande syns i ledgern,
märkt makulerat).

**Två vägar, Marcus val:**

- **A — Minimal.** Nöj dig med § Steg 5 och § Steg 10:s verifikat (cron
  tickar, funktionerna svarar rätt på deny-proberna) och låt Lottas FÖRSTA
  riktiga registrering vara det första verkliga provet på hela kedjan. Kostar
  inget testnummer, men den fulla kedjan (Vault-hemligheten, PDF-genereringen,
  mailutskicket) är fortfarande obevisad i just DENNA miljö fram till dess.
- **B — Fullt kedjebevis, mirrorat mot stagings.** Logga in i prod som dig
  själv (efter § Steg 14), registrera EN liten betalning mot en anmälan du
  kontrollerar (t.ex. din egen, om en finns, eller ett dedikerat testevent),
  tryck "Skicka kvitto", skicka om till din egen adress (`skicka-kvitto-igen`
  stödjer valfri mottagaradress — PRD berättelse 13), läs PDF:en (en rad,
  betalningsdatum, korrekt belopp), och MAKULERA inbetalningen efteråt med
  skälet "prod-driftsättning rök-test, TASK-346.11". Bevisar hela kedjan på
  riktigt, till priset av ett förbrukat kvittonummer och en permanent
  makulerad rad i Rogers bokföring.

**Steget lyckades när** (väg B): kvittot mottas med PDF-bilaga, den signerade
länken fungerar, och makuleringen syns i ledgern med status `makulerat` utan
att raden försvinner.

## Steg 16 — Facit-stämplar

**Förutsättning:** `TASK-346.7` har landat (Hem-kortet, Åtgärds-panelen,
anmälans detaljvy, personkortets Betalningar-sektion). Kontrollera:

```bash
npx backlog task 346.7 --plain
```

Var och en av de tre etablerade "facit-stämplade" ytorna bär ett manifest:

| Yta | Manifest |
|---|---|
| Hem | `tasks/sessions/bilagor/s102-hem-konvergens/facit.json` |
| Åtgärds-sidan | `tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json` |
| Persondetalj | `tasks/sessions/bilagor/s103-persondetalj-konvergens/facit.json` |

**Läs detta innan du förväntar dig en mekanisk spärr:** verifierat
2026-08-31 att INGEN av de tre manifestens `ytor[]`-poster bär ett
`referenser`-fält (innehållslåset `scripts/check-facit.sh` § invariant (d)
beskriver). `bash scripts/check-facit.sh` fäller alltså INTE på att
`TASK-346.7` ändrar dessa ytors innehåll — samma läge som Mer-sidan redan
mötte i natt (se
`tasks/sessions/bilagor/s64-mer-konvergens/AMENDERING-2026-08-31-betalningar-raden.md`
§ "FÖRST"). Det B3-mandaterade AMENDERING-sidofilerna `346.7` skriver är
alltså BOKFÖRING, inte en grind-tvingad reparation — precis som Mer-fallet.

**Din morgonhandling här:**

1. Läs varje AMENDERING-fil `346.7` skapade (leta med
   `find tasks/sessions/bilagor -iname 'AMENDERING-2026-08-3*'`).
2. Är du nöjd: inget MER krävs för att `check-facit.sh` ska vara grönt (det
   är det redan, verifiera med `bash scripts/check-facit.sh` — förväntat
   exit 0). Vill du ändå dokumentera din morgongranskning som en formell
   omstämpling av manifestet (valfritt, inte en spärr):

   ```bash
   npm run facit:godkann -- --pass s102-hem-konvergens --citat "<ditt omdöme om Betalningar-tillägget>" --ersatt
   ```

   (byt `--pass` till `s93-atgardssida-promovering` respektive
   `s103-persondetalj-konvergens` för de andra två). `--ersatt` krävs
   eftersom manifestet redan bär en tidigare `godkand`-stämpel.
3. Är du INTE nöjd: säg "justera X" — det blir en fix-skiva, inte en
   ändring av manifestet.

**Steget lyckades när:** du läst alla tre (fyra, om Mer räknas med)
AMENDERING-filer och antingen accepterat formen tyst eller omstämplat
manifestet enligt ovan.

## Sedan

`TASK-346.12` (riv miljöflaggan, pensionera Airtable-ledgern som sanning,
uppdatera CHANGELOG/byggplan) och `TASK-346.13` (QA i prod, Lottas lördag
hela vägen) ligger UTANFÖR denna runbooks scope — de är egna kort,
`ready-for-human`. Kör dem efter att § Steg 1–16 är gröna, inte parallellt
med dem.

---

## Rullbakåt

Prod bär, efter § Steg 9, verklig persondata och (efter § Steg 15 väg B,
eller Lottas första riktiga registrering) verkliga pengar. Samma disciplin
som `prod-driftsattning-runbook.md` § Rullbakåt: varje väg nedan är
formulerad så att den rör så lite som möjligt.

### R1 — Migrationen gick fel halvvägs

`migration list` (§ Steg 2) säger exakt vilken av de fem som applicerades.

**Säkert att riva ENDAST om ingen av tabellerna bär en rad ännu** (dvs. före
§ Steg 9/15 och innan Lotta registrerat något):

```bash
npx supabase db query --linked "drop table if exists public.jobb_rad"
npx supabase db query --linked "drop table if exists public.jobb"
npx supabase db query --linked "select pgmq.drop_queue('jobbko')" 2>/dev/null || true
npx supabase db query --linked "drop function if exists public.jobb_cron_tick()"
npx supabase db query --linked "select cron.unschedule('jobbmotor-tick')" 2>/dev/null || true
npx supabase db query --linked "drop table if exists public.kvitton cascade"
npx supabase db query --linked "drop table if exists public.inbetalningar cascade"
npx supabase db query --linked "drop table if exists public.kvittoserie_golv"
npx supabase migration repair --status reverted 20260901111500 --linked
npx supabase migration repair --status reverted 20260830200100 --linked
npx supabase migration repair --status reverted 20260830195900 --linked
npx supabase migration repair --status reverted 20260830195728 --linked
```

Den fjärde migrationen (`20260901111500_inbetalning_notering.sql`) lägger
bara till en kolumn (`notering`) på `public.inbetalningar` — `drop table …
inbetalningar cascade` ovan river den redan implicit, ingen egen DROP-rad
behövs. Repair-raden är ändå med (nyast-först, samma ordning som de tre
övriga) så migrationshistoriken stämmer efteråt.

(Se varje migrationsfils egen "NEDÅT"-kommentar för den fullständiga,
auktoritativa listan — ovanstående är en sammanslagning i rätt ordning,
inte en ersättning för att läsa filerna.)

**Efter § Steg 9/15, eller så fort en verklig rad finns: STANNA.** Riv
ingenting reflexmässigt — `kvitton` är append-only med avsikt (PRD:
verifikationskrav, SFL 39 kap. 5 §), och en tabellrivning här är en mycket
större händelse än vid aktivitetsloggen (den bar ingen bokföringsplikt).

### R2 — En Edge Function deployades trasig

Ingen rollback-till-föregående-version finns i Supabase CLI. Samma väg som
`prod-driftsattning-runbook.md` § Rullbakåt R2: checka ut känd god kod,
deploya om, återställ arbetsträdet:

```bash
git checkout <känd-god-sha> -- supabase/functions/<namn>
npx supabase functions deploy <namn> --project-ref lvjsfnphlauldxqlncpl
git checkout HEAD -- supabase/functions/<namn>
```

**Att RADERA en av de nio funktionerna helt** (`prod-driftsattning-runbook.md`
§ R2:s andra väg) är HÄR mer riskabelt än vid aktivitetsloggen: raderas
`jobb-konsument` fortsätter cron att RINGA den (404) var 10:e sekund så länge
`jobb_rad`-rader väntar — inte farligt (fail-quiet, ingen dataförlust) men
högljutt i `cron.job_run_details`. Föredra omdeploy av känd god kod.

### R3 — Vault-hemligheten eller EF-secreten är fel

Ett symptom: cron tickar (§ Steg 5 visar `succeeded`) men rader fastnar i
`fel` med `skal` som pekar på `401`/`Unauthorized` från `jobb-konsument`.

```bash
npx supabase db query --linked "select vault.update_secret((select id from vault.secrets where name='jobbmotor_delad_hemlighet'), '<NYTT_VARDE>')"
npx supabase secrets set JOBBMOTOR_DELAD_HEMLIGHET="<SAMMA NYA VARDE>" --project-ref lvjsfnphlauldxqlncpl
```

Kör om § Steg 4:s digest-jämförelse mot det NYA värdet.

### R4 — Fronten (miljöflaggan) är fel eller stale

Samma tre vägar som `prod-driftsattning-runbook.md` § R3: klientlokal
`Clear site data`, promota en tidigare Production-deploy i Vercel-
dashboarden, eller en revert-PR genom merge-kön. Att STÄNGA AV flaggan
snabbast görs genom att ta bort Vercel-env-varen och köra `npx vercel --prod`
igen — routen `/mer/betalningar` redirectar redan tillbaka till `/mer` när
flaggan är av (`beforeLoad`), så en avstängning är ofarlig även om Lotta står
mitt i ett registreringsflöde: hon ser bara att länken försvinner vid nästa
navigering.

### R5 — Allt ska tillbaka till läget före (endast om INGEN verklig rad finns)

I ordning, motsatt driftsättningen: R4 (fronten) → R2 (radera/återställ
funktionerna) → R3 (om hemligheten seedades) → R1 (riv tabellerna och
reparera historiken) → § Steg 7 (länka tillbaka till staging, om du inte
redan gjort det). Sista steget glöms lättast.

**Finns EN verklig rad (en riktig inbetalning, ett riktigt kvitto):** det
finns ingen fullständig återgång längre — se R1:s stopp-regel. Lös felet
framåt (makulera, korrigera, rätta i basen), riv aldrig.

## Fällor

| # | Symptom | Rotorsak | Skyddsräcke |
|---|---|---|---|
| 1 | `allokera_kvittonummer()` kastar `P0002` på årets FÖRSTA kvitto | Golvet finns bara för år som EXPLICIT seedats | § Steg 3 § ÅRSSTEGET — sätt en kalenderpåminnelse, ingen kod påminner |
| 2 | Cron tickar men "gör ingenting" i veckor | `jobb_cron_tick()` ringer ALDRIG när `vantar = 0` — det är avsiktligt, inte trasigt | § Steg 5, anropa `select public.jobb_cron_tick() as tick` direkt (INTE `return_message` — den bär bara pg_crons egen `SELECT`-bokföring, t.ex. `1 row`), förvänta `"skal":"inget-vantar"` tills en verklig inbetalning finns |
| 3 | `create-betalningsfalt.mjs` vägrar köra mot prod | Skriptet saknar (verifierat) den `--bas`-väg `create-eventinnehall-modell.mjs` har | § Steg 11 § "Känd lucka" — två vägar, inget skript gör det i dag |
| 4 | `db push` applicerar fler migrationer än väntat | `db push` är inte scopad till en PRD — den applicerar ALLT som inte redan är registrerat i prod | § Steg 2, läs HELA `db push`-utskriften |
| 5 | Miljöflaggan "satt" men syns inte i appen | Vite bakar in `VITE_`-värden vid BYGGTID — en ny Vercel-env-var kräver en NY deploy | § Steg 14, kör `npx vercel --prod` efter `env add` |
| 6 | EF-secreten `JOBBMOTOR_DELAD_HEMLIGHET` "verkar fel" men går inte att läsa tillbaka | Supabase exponerar aldrig ett EF-secrets värde efter `secrets set` | § Steg 4 § Verifikatet — digest-jämförelse mot Vault-sidan är det enda beviset som finns |
| 7 | Rök-testet förbrukar `MM-2026-1001` i onödan | Kvitton är append-only, `on delete restrict` | § Steg 15 — det är ett medvetet Marcus-val, inte ett misstag om det händer |
| 8 | `link`-tillståndet pekar mot prod långt efter du trodde du var klar | Sticky, per arbetskatalog, osynligt | `cat supabase/.temp/project-ref` före varje skarp operation, § Steg 7 efter Postgres-delen |
| 9 | `.prod-functions-allowlist.conf`-raderna "borde redan finnas" | Ingen av de nio EF:erna hade en rad, mätt 2026-08-31 mot `main` `3fcc11de` | § Steg 8 — verifiera på nytt med `--list`, läget kan ha ändrats sedan denna runbook skrevs |

## Vad denna runbook medvetet inte täcker

- **`TASK-346.12`** (riv miljöflaggan, pensionera Airtable-ledgern) och
  **`TASK-346.13`** (QA i prod) — egna, `ready-for-human`-kort, körs EFTER
  denna runbook.
- **Swish-importens matchning mot Lottas verkliga bankfil** (`TASK-346.10`)
  — HITL, väntar på att Marcus namnger banken (plusgirot antyder Nordea, PRD
  § Swish-import).
- **Formen på backfillens prod-upplåsning** (§ Steg 13 punkt 2) och
  **skip-vs-topp-upp** (§ Steg 13) — öppna Marcus-beslut, inte något denna
  runbook väljer åt honom.
- **`Saknas (kr) [ERSATT 2026-08-30 — 0-pris-bugg]`-fältet i staging** — ett
  kvarlämnat, okonsumerat gammalt fält (Airtable-API:t kan inte radera
  fält). Radera det manuellt i staging-UI:t när det passar — det är en
  STAGING-städning, inte en del av prod-driftsättningen.
- **DocRaptor-nyckelrotation** och andra Marcus-ägda trådar från S113 —
  bokförda i sessionsdokets § CARRY, orörda av denna runbook.
- **Allt mail utöver kvittot** — bekräftelse-, påminnelse- och
  deltagarinfoutskickens migrering till samma jobbmotor är en egen PRD
  (ADR-129 beslut 11).

## Relaterat

- [`prod-driftsattning-runbook.md`](prod-driftsattning-runbook.md) — samma
  genre, aktivitetsloggen; källan för mönstret denna fil följer.
- [`backfill-inbetalningar.md`](backfill-inbetalningar.md) — backfillens
  regel, avvikelseklasserna, Lottas lista.
- [`data-model.md`](data-model.md) § "Prod-fälten — ÖPPET AC #5 för Marcus"
  — den auktoritativa fältlistan och den korrigerade `Saknas (kr)`-formeln.
- [`atkomst-och-nycklar.md`](atkomst-och-nycklar.md) — åtkomstregistret.
- [`ADR-128`](../decisions/ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md)
  — inbetalningen som sanning, Postgres, spegeln.
- [`ADR-129`](../decisions/ADR-129-jobbmotorn-ko-cron-och-kick.md) —
  jobbmotorn: kö, cron, kick, Vault-seedens ägarskap per miljö.
- [`ADR-109`](../decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
  — kvittoserien, formatet, § Updates för vad Postgres-flytten rev.
- [`supabase/migrations/README.md`](../../supabase/migrations/README.md) §
  Betalningsdomänen + jobbmotorn — appliceringsvägens mekanik.
- `scripts/deploy-prod-functions.sh` +
  [`.prod-functions-allowlist.conf`](../../.prod-functions-allowlist.conf) —
  fail-closed deploy-grinden.
- `scripts/fas4-prod-deploy.sh` — EF-deploy-sekvensen som en körning.
- `scripts/deny-prod-ref.sh` + `.prod-ref-policy.conf` — prod-ref-låset.
- `tasks/sessions/2026-08-29-session-113.md` § Del 11–12 — grillningens
  tretton beslut och nattens byggkedja.
