# ADR-028: Supply chain incident-respons-protokoll (npm advisories)

- Status: Accepted
- Datum: 2026-05-12
- Fas: 2 (K0åg — supply chain malware-respons)

## Kontext

2026-05-12 morgon upptäcktes via `npm audit` att `@tanstack/history`, `@tanstack/react-router`, `@tanstack/router-plugin` och tre transitiva paket (`@tanstack/router-core`, `@tanstack/router-generator`, plus en transitiv flag på `nuqs`) hade GitHub Security Advisory [GHSA-rmmr-r34h-pfm5](https://github.com/advisories/GHSA-rmmr-r34h-pfm5) publicerad 2026-05-11 23:39 UTC ("Malware in @tanstack/history"). Sex critical severity vulnerabilities rapporterades.

Block A-C-diagnostik i K0åg-prompten visade att Marcus' lokala maskin + CI-miljö var pre-malware:

- @tanstack/history@1.161.6 (installerad 2026-04-13 i Fas 0) hade inga `preinstall`/`install`/`postinstall`-hooks och var publicerad 2026-03-15 — 8 veckor före malware-versioner 1.161.9 och 1.161.12 (publicerade 2026-05-11 19:20-19:26 UTC).
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
- Pin-disciplin betyder att Dependabot inte automatiskt uppgraderar pinned paket. Marcus måste manuellt övervaka när patched versioner publiceras (för dessa specifika paket — `@tanstack/react-router`, `@tanstack/router-plugin`, `@tanstack/history`-override). Lyfts som todo-pinpoint i `tasks/todo.md` med trigger "kontrollera npm view @tanstack/react-router time veckovis".
- `npm audit` kommer fortsätta varna om GHSA-rmmr-r34h-pfm5 tills advisoryns `>=0`-range tas bort eller patched versioner publiceras. Lärdom: audit-output ska inte tolkas binärt — false positives möjliga när installerade artefakter är pre-malware.

## Spårbarhet

- K0åg arbets-commit: `ea59787` (security(fas2): remediate GHSA-rmmr-r34h-pfm5 supply chain malware in @tanstack/* (K0åg))
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
- K0åh sessionsdok-trail: `tasks/sessions/2026-05-13-ci-optimering.md` (K-sista bake-in)
- K0åh commit-trail: `0d19ede` (audit-ci.jsonc) + denna commit (docs)
