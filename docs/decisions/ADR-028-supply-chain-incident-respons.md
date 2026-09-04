
# ADR-028: Supply chain incident-respons-protokoll (npm advisories)

- Status: Accepted
- Datum: 2026-05-12
- Fas: 2 (K0åg — supply chain malware-respons)

## Kontext

<!-- vale Vale.Terms = NO -->
2026-05-12 morgon upptäcktes via `npm audit` att `@tanstack/history`, `@tanstack/react-router`, `@tanstack/router-plugin` och tre transitiva paket (`@tanstack/router-core`, `@tanstack/router-generator`, plus en transitiv flag på `nuqs`) hade GitHub Security Advisory [GHSA-rmmr-r34h-pfm5](https://github.com/advisories/GHSA-rmmr-r34h-pfm5) publicerad 2026-05-11 23:39 UTC ("Malware in @tanstack/history"). Sex critical severity vulnerabilities rapporterades.
<!-- vale Vale.Terms = YES -->

Block A-C-diagnostik i K0åg-prompten visade att Marcus' lokala maskin + CI-miljö var pre-malware:

<!-- vale Vale.Terms = NO -->
- @tanstack/history@1.161.6 (installerad 2026-04-13 i Fas 0) hade inga `preinstall`/`install`/`postinstall`-hooks och var publicerad 2026-03-15 — 8 veckor före malware-versioner 1.161.9 och 1.161.12 (publicerade 2026-05-11 19:20-19:26 UTC).
<!-- vale Vale.Terms = YES -->
- Marcus' senaste lokala `npm install` före malware-publicering var 2026-05-11 12:02 UTC (Session 4 K0åa nuqs install) — 7h+ före malware.
- Senaste CI-run före malware: 2026-05-11 12:01 UTC (`bc9d6aa` K1.6) — inga CI-runs efter advisory publicerats.

Strategiska val som avhandlades i Block D:

1. **Uppgradera till patched:** Ej möjligt. TanStack-teamet har inte publicerat patched versioner (`first_patched_version: None` i advisory).
2. **Pin exakt + overrides:** Behåll nuvarande säkra versioner via exakt-pin + `overrides`-block för transitiv `@tanstack/history`. Lock-fil regenereras helt.
3. **`npm audit fix --force`:** Föreslår downgrade till `@tanstack/router-plugin@1.111.6` (56 versioner bak från 1.167.20). Sannolikt breaking changes.
4. **Status quo:** Lock-fil låser via integrity-hashes, men risk att framtida `npm install` (inte `npm ci`) plockar malware-versioner om semver-range `^1.161.6` matchar `1.161.9`.

K0åg implementerade Strategi 2 (Marcus' val). Detta ADR kodifierar process-besluten så framtida supply chain-incidenter hanteras konsistent.

## Beslut

1. **Vid security-advisory på direkt dependency: pin exakt + `overrides` för transitiva, INTE `npm audit fix --force`.** Pinning (ta bort `^`-prefix i `package.json` `dependencies`/`devDependencies`) blockerar oavsiktlig uppgradering. `overrides`-blocket tvingar transitive paket till säkra versioner. Detta bevarar fungerande nuvarande versioner medan vi väntar på patched upstream. `npm audit fix --force` är förbjudet utom som sista utväg eftersom det rutinmässigt föreslår destruktiva major-downgrade-vägar.

2. **Vid säkerhetsincident: regenerera lock-fil helt, INTE partiell fix.** `rm -rf node_modules package-lock.json && npm install` är obligatoriskt — partiell `npm install <paket>` lämnar dependency-träd-rester från pre-incident tillstånd. Helt-regenerering garanterar att alla integrity-hashes är från ren install mot aktuell registry-state.

3. **Artefakt-kontinuitet ska verifieras post-install.** Innan `rm -rf node_modules package-lock.json` ska `cp package-lock.json package-lock.json.pre-<incident-tag>` köras (lokal backup, INTE committad). Post-install ska integrity-hashes jämföras pre/post för alla kritiska paket. Drift signalerar att resolved versioner ändrats → kräver designval (utvidga overrides eller acceptera drift med motivering).

4. **`npm audit --audit-level=high` ska köras vid varje sessionsstart.** Denna advisory upptäcktes vid K1.7 sessionsstart Block B-baseline. Utan disciplinen hade K2 startat med malware-versioner i `node_modules` (vid första `npm install` av `@tanstack/react-router-devtools` eller `react-error-boundary` som K2 planerade). Pre-flight audit är billigt (~2s), incident-mitigation är dyrt (1 dags fas-paus + ADR-arbete + dependency-koreografi).

5. **Selektiv `git add` vid security-commits.** Backup-fil (`package-lock.json.pre-<tag>`) ska aldrig committas — den är lokal artefakt för verifikation. Använd `git add package.json package-lock.json` (eller motsvarande explicit lista), INTE `git add -A` eller `git add .`. Selektiv add är generell K0åg-prompt-disciplin men särskilt viktig vid security-incidenter där råa diagnostik-output (loggfiler, debug-dumps) kan ligga untracked i working tree.

## Konvention för framtida supply chain-incidenter

När `npm audit` rapporterar new high/critical vulnerability:

1. **STOPPA all annan progress** — sessionsdok-skelett, kod, allt. Säkerhetsincident har high prio.
2. **Diagnostik först (autonom):** Karakterisera vad malware GÖR (postinstall? runtime-payload? exfil-mönster?). Verifiera lokal install-tidslinje mot malware-publicering. Verifiera CI-impact.
3. **STOPPA-OCH-FRÅGA för strategi:** Presentera Marcus åtgärds-matris (uppgradera / pin / downgrade / status quo). Inkludera secret-fotavtryck (NAMN endast, aldrig värden).
4. **Implementera per Marcus' val** med Beslut §1-§5 ovan.
5. **ADR kodifierar nya process-regler** om incidenten avslöjat luckor i nuvarande process. Separat commit efter security-fix-commit.

## Alternativ som övervägdes

1. **`npm audit fix --force` som default.** Avvisat: föreslår rutinmässigt destruktiva major-downgrades (i K0åg: `@tanstack/router-plugin@1.111.6`, 56 versioner bak). Förstör fungerande versioner som råkat ha säkra builds. Pin + overrides bevarar nuvarande tillstånd.

2. **Ad-hoc-respons utan kodifiering.** Avvisat: drift. Nästa incident triggar samma diskussion om från grunden. ADR-kodifiering tar 30 min nu, sparar timmar varje gång.

3. **CI-only detection (Dependabot Security Updates).** Avvisat: för sent. Dependabot kan föreslå PR först efter att malware redan installerats lokalt om Marcus kör `npm install` mellan advisory-publicering och Dependabot-PR. Sessionsstart-audit (Beslut §4) är proaktiv där CI-only är reaktiv.

4. **Inkludera `package-lock.json.pre-<tag>` i git-historiken.** Avvisat: backup-filen har samma malware-känsliga info som riktiga lock-filen och bara ändrar storlek på repot. Lokal artefakt räcker — kan tas bort manuellt efter incident-commit verifierats grön på CI.

## Konsekvenser

**Positivt:**

- Konsistent supply chain-respons över framtida incidenter. Nästa gång `npm audit` rapporterar critical, är processen 1-2 timmar istället för dagvarande utredning.
- Pre-flight audit vid sessionsstart fångar incidenter inom timmar av publicering snarare än vid nästa `npm install`.
- Pin + overrides är reversibelt — när patched versioner publiceras, tas pinning + overrides bort och vanlig uppgradering återupptas.
- Process bevarar fungerande versioner istället för att downgrade-tvinga via `audit fix --force`.

**Negativt:**

- `npm audit` vid varje sessionsstart är ~2s extra. Men det är en del av RAPPORTERA Block B-baseline redan i alla sessionsstart-prompter — ingen ny kostnad.
<!-- vale Vale.Terms = NO -->
- Pin-disciplin betyder att Dependabot inte automatiskt uppgraderar pinned paket. Marcus måste manuellt övervaka när patched versioner publiceras (för dessa specifika paket — `@tanstack/react-router`, `@tanstack/router-plugin`, `@tanstack/history`-override). Lyfts som todo-pinpoint i `tasks/todo.md` med trigger "kontrollera npm view @tanstack/react-router time veckovis".
<!-- vale Vale.Terms = YES -->
- `npm audit` kommer fortsätta varna om GHSA-rmmr-r34h-pfm5 tills advisoryns `>=0`-range tas bort eller patched versioner publiceras. Lärdom: audit-output ska inte tolkas binärt — false positives möjliga när installerade artefakter är pre-malware.

## Spårbarhet

<!-- vale Vale.Terms = NO -->
- K0åg arbets-commit: `ea59787` (security(fas2): remediate GHSA-rmmr-r34h-pfm5 supply chain malware in @tanstack/* (K0åg))
<!-- vale Vale.Terms = YES -->
- Advisory: <https://github.com/advisories/GHSA-rmmr-r34h-pfm5>
- Sessionsdok-trail: `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 3.7
- Diagnostik-data: K0åg-prompten Block A-E (RAPPORTERA-output, bevarad i Session 5-transcript när transcript-disciplin etableras)

## Updates

### 2026-05-13 — K0åh allowlist-rensning (advisory snärjt)

GitHub Security Advisory Database uppdaterade GHSA-rmmr-r34h-pfm5 `vulnerable_version_range` från `>=0` till `= 1.161.9` + `= 1.161.12` 2026-05-12 13:06:25Z (~14h efter advisory-publicering 2026-05-11 23:39:34Z). Vår installerade `@tanstack/history@1.161.6` är pre-malware och inte längre i vulnerable range — bekräftat säker av GitHub Security-teamet via snäv range-update.

**Triggerande observation (Session 6 K1.A Block A.3 RAPPORTERA 2026-05-13):**

- `npm audit` returnerade `critical: 0` (förväntat 6 från K0åg-baseline)
- `npm audit --json | grep -c GHSA-rmmr-r34h-pfm5` → 0 träffar
- `audit-ci`-utdata pre-rensning: `Consider not allowlisting advisory: GHSA-rmmr-r34h-pfm5. Passed npm security audit.`

K17-disciplin (live security-state-verifikation vid sessionsstart, [`tasks/lessons.md`](../../tasks/lessons.md) `## 2026-05-13 — Fas 2 Session 5b`) fångade avvikelsen ~24h efter advisory-uppdatering.

**K0åh-åtgärder (Session 6, 2026-05-13):**

1. Allowlist-blocket rensat i `audit-ci.jsonc` (commit `0d19ede`) — `"allowlist": []` (struktur bevarad för framtida incident-respons).
2. `npx audit-ci --config audit-ci.jsonc` → grön utan allowlist (verifierat post-rensning lokalt).
3. `tasks/todo.md` Veckovis-granskning-rutin ersatt med K0åi-trigger för pin-luckring (commit i K0åh-paketet).
4. `CLAUDE.md` Sessionsstart audit-disciplin uppdaterad — allowlist-villkoret obsolet, nytt `npm view @tanstack/history@latest`-version-villkor introducerat (commit i K0åh-paketet).
5. Denna `## Updates`-sektion etablerad som living resolution-spårning (kontra ny ADR) — samma incident, status-iteration.

**Bevarat per K7 refactor/semantik-separation:**

- Exakt-pin på 5 `@tanstack/*`-paket bevaras tills TanStack rör `latest`-dist-tag (defense-in-depth: skyddar mot dependency-drift in i 1.161.9/1.161.12-range vid framtida transitive-uppgraderingar)
- `overrides: { "@tanstack/history": "1.161.6" }` bevaras synkront med pin-disciplin
- Pin-luckring + overrides-borttagning skjuts till **K0åi** — naturlig trigger när `npm view @tanstack/history@latest` returnerar annan version än `1.161.6`

**Resterande osäkerheter:**

- `first_patched_version: "1.161.13"` finns deklarerat per-vulnerability i advisory, men `npm view @tanstack/history@latest` returnerar fortfarande `1.161.6` (TanStack har inte bumpat `latest`-dist-tag bakåt). När/om det sker, trigga K0åi.
- Advisoryns `withdrawn_at: null` + `summary: "Malware in @tanstack/history"` är aktiva — incidenten är inte avskriven, bara range-snärjt.

**Spårbarhet:**

- Advisory-snäv-uppdatering (live-data): <https://github.com/advisories/GHSA-rmmr-r34h-pfm5> — kontrollera `updated_at`-fält + `vulnerable_version_range` per `vulnerabilities[]`-objekt
- K0åh sessionsdok-trail: `tasks/sessions/archive/2026-05/2026-05-13-ci-optimering.md` (K-sista bake-in)
- K0åh commit-trail: `0d19ede` (audit-ci.jsonc) + denna commit (docs)

### 2026-06-13 — GHSA-gv7w-rqvm-qjhr allowlistad (esbuild Deno-vektor, ej tillämplig)

GitHub Security Advisory Database publicerade GHSA-gv7w-rqvm-qjhr
("esbuild: Missing binary integrity verification in Deno module enables
RCE via NPM_CONFIG_REGISTRY", severity high, sårbart intervall >=0.17.0
<0.28.1) 2026-06-12 20:08 UTC — ~2 h före Session 17:s första CI-run,
vilket gjorde audit-jobbet rött på alla pushar.

**Triggerande observation (källa + datum):**

- CI run 27445663233 (2026-06-13): "Audit dependencies" FAIL på
  GHSA-gv7w-rqvm-qjhr; gårdagens runs gröna (advisory nypublicerad).

**Åtgärder (Session 17, 2026-06-13):**

<!-- vale Vale.Terms = NO -->
1. Empirisk kontrollgrind: ingen Deno-sida av repot använder esbuild
   (rg över supabase/ = 0 träffar; ingen deno.json/import_map);
   esbuild 0.27.7 nås enbart som transitiv dev-dependency via
   vite@8.0.12 + tsx; ej direkt dependency; ingår ej i prod-bundle.
2. Allowlist-post i audit-ci.jsonc med motivering + datering +
   expiry 2026-07-13 i JSONC-kommentar (K0åh-mönstret) — commit 9429336.
3. Spårad riv-todo i tasks/todo.md med verifierbart sluttillstånd
   (npm ls esbuild ≥ 0.28.1 via vite/tsx-bump + post borttagen + CI grön).
<!-- vale Vale.Terms = YES -->

**Bevarat per Konvention-flödet:**

- Steg 1–4 följda (STOPPA → diagnostik → åtgärdsmatris A/B/C →
  Marcus/Chat-val C → implementation). Steg 5 ej utlöst — ingen
  processlucka; vägen var exakt den audit-ci.jsonc-kommentaren anvisar.

**Resterande osäkerheter:**

<!-- vale Vale.Terms = NO -->
- Tidshorisont för vite/tsx-bump till esbuild ≥ 0.28.1 (bevakas via
  dependabot-PR:ar; expiry 2026-07-13 tvingar omprövning).
<!-- vale Vale.Terms = YES -->

**Spårbarhet:**

- Advisory: <https://github.com/advisories/GHSA-gv7w-rqvm-qjhr>
- Sessionsdok: `tasks/sessions/2026-06-13-session-17.md`
- Commits: 9429336 (allowlist), b86482d (todo), denna commit (denna post).

### 2026-06-15 — GHSA-fx2h-pf6j-xcff fixad (kirurgisk Vite-bump; §2-avvikelse)

<!-- vale Vale.Terms = NO -->

GitHub Security Advisory Database publicerade GHSA-fx2h-pf6j-xcff (vite,
severity high, sårbart intervall `>=8.0.0 <=8.0.15`) — nypublicerad i
fönstret mellan två gröna CI-runs under resume-19, vilket gjorde
audit-jobbet rött på nästa push (CI run 27564917307, 2026-06-15).
Advisoryn är dev-server-only och icke-malware (vites egen dev-server-vektor),
ingår ej i prod-bundlen. `vite` är en direkt dev-dependency.

**Triggerande observation (källa + datum):**

- CI run 27564917307 (2026-06-15): "Audit dependencies" FAIL på
  GHSA-fx2h-pf6j-xcff (vite); föregående run 27563078712 grön (advisory
  nypublicerad i mellanrummet, time-of-check mot live advisory-DB).

**Åtgärder (resume-19, 2026-06-15):**

1. STOPPA → diagnostik → åtgärdsmatris A/B/C → Marcus-val A (uppgradera),
   därefter REVIDERAD mekanism efter empiriskt fynd (se §2-avvikelse nedan).
2. Kirurgisk bump: `vite` range `^8.0.10` → `^8.0.16`; riktad `npm install`
   med pre-fix-locken som bas → enbart vite-subträdet uppdaterades.
3. Lock-diff verifierad enkelspårig: 21 noder rörda, alla under vite@8.0.16
   (vite, rolldown, @oxc-project/types, postcss, tinyglobby). Vakt-paket
   oförändrade: @biomejs/biome 2.4.15, @playwright/test 1.60.0, typescript 6.0.3.
4. Verifiering: audit-ci grön (fx2h ej flaggad), regression grön
   (biome/typecheck/test:api/build).

**§2-avvikelse (kvitterad av Marcus, öppen rivning):**

ADR-028 §2 föreskriver FULL lock-regenerering. Den regeln är en
MALWARE-PURGE-mekanism — dess rationale är att rensa tainted träd-rester
efter ett komprometterat paket. GHSA-fx2h-pf6j-xcff är ICKE-malware (vites
egen dev-server-path-traversal) → det finns inget tainted träd att purgea →
full-regen ger noll säkerhetsvärde och drog empiriskt in orelaterad churn
(@biomejs/biome 2.4.15 → 2.5.0, som bröt `biome check` på orelaterade filer).
En riktad `npm install vite@<ver>` ger en npm-KONSISTENT subträds-lock (ej
den partiella hand-edit §2 förbjuder) och är därmed trogen §2:s INTENT medan
den håller säkerhets-committen enkelspårig. Avvikelsen gäller denna icke-malware-klass;
§2:s full-regen står kvar för malware-incidenter.

**Resterande osäkerheter:**

- esbuild förblev 0.27.7 (kirurgisk bump tvingade ej upp den) → gv7w-riv-villkoret
  (esbuild ≥ 0.28.1) är fortsatt EJ uppfyllt; gv7w-allowlisten står kvar oförändrad
  (separat följdsteg, bevakas via dependabot enligt 2026-06-13-posten).

**Spårbarhet:**

- Advisory: <https://github.com/advisories/GHSA-fx2h-pf6j-xcff>
- Sessionsdok: `tasks/sessions/archive/2026-06/2026-06-13-session-19.md` (resume-19)
- Commit: denna commit (vite-bump + denna post).

<!-- vale Vale.Terms = YES -->

### 2026-08-04 — Incidentklass-amendering: kompromiss kontra ordinär patchad advisory (`TASK-133`)

**Bakgrund (källa: tråd `T118`, `docs/research/t118-npm-advisory-remediering-praxis-2026-08-04.md`, PR #682):**

2026-08-03 blockerade tre nya high/moderate-advisories (`brace-expansion`
GHSA-rgw5-rvv9-x895, `fast-uri` GHSA-7p8r-x3mc-p8w7, `postcss`
GHSA-fxqj-rqcc-2cmp) merge-kön. Innan strategival beställde Marcus ett
research-pass för att pröva — inte bara bekräfta — den föreslagna vägen.
Passet verifierade overrides-vägen men falsifierade halva den underliggande
premissen: `ADR-028` §2 föreskriver full lock-fil-regenerering utan
undantag, men repots egen commit-historik har redan löst sex tidigare
transitiva advisory-incidenter med en riktad overrides/lockfile-bump —
aldrig med `rm -rf node_modules package-lock.json`. Endast en av de sex
(Vite, 2026-06-15-posten ovan) fick sin avvikelse skriven in i denna ADR;
de fem andra var tyst identisk praxis.

**Amenderingen (Marcus-GO 2026-08-04, sessionsdok `tasks/sessions/archive/2026-08/2026-08-02-session-96.md` Del 10):**

Beslut §2 föreskriver "regenerera lock-fil helt, INTE partiell fix" utan
att skilja på incidentklass. Det var rätt regel för §2:s egen
födelsekontext — men fel klass-regel för en ordinär, patchad advisory. Två
incidentklasser definieras härmed för §2:

<!-- vale Vale.Terms = NO -->
1. **Malware/kompromiss** (bekräftad skadlig kod i en publicerad
   paketversion — `ADR-028`:s egen födelsekontext, `@tanstack/history`)
   → **Beslut §2 kvarstår oförändrat:** full lock-fil-regenerering
   (`rm -rf node_modules package-lock.json && npm install`) är obligatorisk
   för att rensa komprometterade träd-rester.
2. **Ordinär patchad advisory** (GHSA/CVE med `first_patched_version`
   publicerad i GitHub Security Advisory-databasen, ingen
   kompromiss-misstanke) → **riktad pin/overrides-bump + riktad
   `npm install` (INTE `rm -rf`) är standardformen.** Detta är inte ett
   undantag från §2 — §2:s purge-rationale omfattade aldrig denna klass.
<!-- vale Vale.Terms = YES -->

**Empiri — sju incidenter sedan `ADR-028` skrevs, verifierat `git show <sha> --stat` 2026-08-04:**

| Commit | Datum | Paket | Bokföring före denna post |
|---|---|---|---|
| `9b97dadb` | 2026-06-27 | linkify-it → 5.0.1 (override) | Tyst |
| (range-bump, ingen egen SHA) | 2026-06-15 | Vite → `^8.0.16` | Öppet kvitterad (Updates-post ovan) |
| `93eb9697` | 2026-07-21 | fast-uri → 3.1.4 (lockfile) + linkify-it → 6.0.0 | Tyst |
| `8f4aeb3d` | 2026-07-22 | sharp → 0.35.3 (override) | Tyst |
| `92ef2e43` | 2026-07-24 | js-yaml → 5.2.2 (override) | Tyst |
| `3a50e8ec` | 2026-07-25 | brace-expansion → 5.0.8 (override) | Tyst |
| `c227593f` (PR #684) | 2026-08-04 | brace-expansion → 5.0.9 · fast-uri → 3.1.5 (ny post) · postcss → 8.5.25 (ny post) | Öppet kvitterad FÖRE denna amendering (`T118`) |

Samtliga sex SHA:n ovan verifierade på nytt (`git show <sha> --stat`,
2026-08-04, denna landning) — datum, paket och diff-omfång matchar tabellen
exakt.

**Research-fynd (mätt, `docs/research/t118-npm-advisory-remediering-praxis-2026-08-04.md`, 2026-08-04):**

1. `npm audit fix` (utan `--force`) rör **aldrig** ett befintligt
   `overrides`-fält som redan pinnar en sårbar version. Mätt skarpt mot
   detta repo (`npm audit fix --dry-run`, sidoeffektfritt): verktyget
   föreslog korrekt bump av `postcss` och `fast-uri`, men var strukturellt
   oförmöget att fixa `brace-expansion` — paketet var redan hårdpinnat via
   `overrides` sedan `3a50e8ec`. Ingen varning, ingen avvikande exit-kod —
   bara "up to date". Alternativ B (`npm audit fix` utan force) hade alltså
   löst 2 av 3 advisories och lämnat den tredje tyst olöst.
2. `npm ci` **hård-felar** om `package.json`s `overrides`-fält ändras utan
   att lockfilen regenereras (`"npm error Invalid: lock file's
   fast-uri@3.1.4 does not satisfy fast-uri@3.1.5"`, exit ≠ 0). CI kör
   `npm ci` i minst åtta separata steg (`ci-suite.yml` × 5, `nightly.yml` ×
   flera). CI är därmed redan en fail-safe mot en overrides-redigering som
   glömmer synka lockfilen — en positiv, mätt korrigering av en
   tredjepartskälla i research-passet som påstod att `npm ci` "ignores
   overrides".

**Beslut §1, §3, §4 orörda av denna amendering.**

**Spårbarhet:**

- Tråd: `T118`
- Research: PR #682 (`docs/research/t118-npm-advisory-remediering-praxis-2026-08-04.md`)
- Fix: PR #684 (merge-commit `c227593f`)
- Amendering: `TASK-133`
- Sessionsdok: `tasks/sessions/archive/2026-08/2026-08-02-session-96.md` Del 10
