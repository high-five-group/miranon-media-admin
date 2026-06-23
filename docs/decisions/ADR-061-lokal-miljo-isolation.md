# ADR-061: Lokal miljö-isolation — självverifierande miljö-bindning

- Status: Accepted
- Datum: 2026-06-23
- Fas: Meta

## Kontext

T30-klustret (tasks/threads/T30-lokal-miljo-isolation.md) diagnostiserade en rotorsak,
i en mening: miljö-isolation som stannade vid CI-/deploy-gränsen och aldrig nådde
utvecklarens disk. Tre symptom — T12 (.env.test URL→staging men TEST_USER-cred-split),
T28 (.env.local VITE_SUPABASE_URL = prod → lokal dev/e2e träffar prod-DB), T29
(error-context ARIA-snapshot exponerar lösenord i klartext) — är tre uttryck för den enda
orsaken. Forensiken är disk-belagd i T30-kortet.

Den befintliga ytan (Session 32 orienterings-pass, mot disk): src/env.ts gör redan
fail-fast-validering vid uppstart via @t3-oss/env-core + zod (createEnv), importerad från
src/main.tsx så den kraschar före React mountas — MEN den är ref-agnostisk: prod- och
staging-URL passerar lika. `vite.config.ts` har ingen mode-/envDir-hantering; inga
npm-scripts sätter --mode; .env.local (laddas av Vite i alla mode) bär prod-pekaren.

Research (2026-06-23, förstapartskällor): Vites env-precedens — .env.local laddas i alla
mode, men en mode-specifik .env.[mode] överskuggar samma variabel. Fail-fast
uppstarts-validering som vägrar fel bindning är ett etablerat branschmönster. Supabases
kanon: dev ska köras lokalt mot Supabase-CLI-stacken, staging/preview är separat. Supabases
publishable/anon-nyckel är säker att exponera i källkod (RLS-grindad); legacy anon-nyckeln
avvecklas i slutet av 2026 till förmån för publishable/secret-nycklar.

## Beslut

Gör miljö-bindningen självverifierande så att symptom-klassen inte kan återuppstå. Tre pelare.

**Pelare 1 — Vite mode-baserad miljö-separation (bindningen).** Flytta miljö-pekaren UT ur
.env.local (reserveras för miljö-agnostiska maskin-overrides). Pinna varje miljö i sin
mode-fil: .env.development (staging-ref — interim dev-mål, se scope-beslut), .env.staging
(staging-ref), .env.production (prod-ref). Mode-filerna bär endast publika VITE_-variabler
(URL + publishable/anon-nyckel) och committas (leverantörs-sanktionerat — publika by design).
Mode-explicita npm-scripts.

**Pelare 2 — Fail-fast mode-medveten grind (keystone).** Utöka src/env.ts: prod-Supabase-ref
får förekomma i VITE_SUPABASE_URL ENDAST när import.meta.env.MODE === 'production'; annars
kastas vid uppstart. Minimal regel, inget nytt beroende — återanvänder den redan wirade
t3-env/zod-ytan. En parallell minimal grind på node-api-test-ytan (process.env), eftersom
src/env.ts (import.meta.env) inte täcker den. Detta är mekanismen som gör klassen
icke-återuppståndlig: återuppståndelse kräver att grind-kod tas bort — synligt i review/CI.

**Pelare 3 — Cred-hygien + den smala resten.** T29: maskera/exkludera lösenordsfältet ur
Playwrights error-context-ARIA-snapshot (eller purge i teardown). T12: verifiera funktionellt
att TEST_USER-creds autentiserar mot staging (en auth-körning) — prod-säkerheten är redan
stängd av grinden + .env.test:s staging-ref, kvar är ren funktionell cred-validitet.
Ramning: VITE_-variabler är publika by design; genuina hemligheter (Airtable-PAT) bor redan
i Edge-Function-env (rätt 12-faktor-form) — ingen hemlighets-läcka att laga på bindnings-sidan.

Symptom→fix-mappning:

| Symptom | Stängs av |
|---|---|
| T28 (.env.local→prod) | Pelare 1 (pekaren ut) + Pelare 2 (grinden) |
| T12 (.env.test cred-split) | Pelare 2 (prod-säkerhet) + Pelare 3 (funktionell cred-verifiering) |
| T29 (error-context klartext) | Pelare 3 (artefakt-fix) |

Landnings-ordning: Pelare 1 → Pelare 2 → Pelare 3, varje steg bootbart + egen commit + CI-grön.

"För all framtid"-mekanismen: grinden (Pelare 2) stänger säkerhets-klassen oberoende av
dev-mål. Det är därför scope-beslutet nedan stänger T30 permanent trots att dev-målet är ett
interim-värde.

Scope-beslut (Väg B): denna omgång levererar self-verifying binding med dev pekat på STAGING
som interim icke-prod-mål; den kanoniska lokala Supabase-stacken (Väg A) deferreras till egen
tråd. Motiv: dubbelriktad över-engineering-vakt — golvet (icke-prod rör aldrig prod + grinden)
levereras nu; lokal-stack är isolation OVANFÖR golvet, deferrad-standard för en
en-utvecklar-app, med egen riskprofil (schema-drift) som inte ska blandas in i en
bindnings-fix. Väg A ramas som en isolations-UPPGRADERING, aldrig som en återöppning av
säkerhets-frågan. Två explicita interim-villkor: (1) Väg A registrerad som tråd T31 med
scope fångat; (2) interim-priset namngivet — med staging-som-dev-mål delar dev-arbete och
staging-validering databas (lågt för en ensam utvecklare, ej noll, spårat).

## Alternativ som övervägdes

- **Väg A nu (lokal Supabase-stack för dev):** Supabase-kanon, maximal isolation. Förkastat
  för denna omgång: net-new infra (Docker, `supabase/`-katalog, migration-sync) med egen
  riskprofil som inte ska blandas med en bindnings-fix i samma landning. Deferrad till T31,
  inte avfärdad.
- **Bara punkt-fixa de tre symptomen utan grind:** förkastat — adresserar inte rotorsaken;
  klassen kan återuppstå vid nästa hand-redigering. Grinden är det som gör det "för all framtid".
- **Nytt valideringsbibliotek (envalid e.d.):** onödigt — t3-env/zod är redan wirat vid
  uppstart; gapet är ref-medvetenhet, inte modulen. Inget nytt beroende motiverat.
- **Exakt MODE→ref-karta i grinden:** förkastat till förmån för den minimala regeln
  "prod-ref ⇒ endast production" — lägre underhåll, fångar samma felklass.

## Konsekvenser

Positiva: säkerhets-klassen strukturellt stängd; T28 stängs vid implementation, T12:s
prod-säkerhet stängd, T29 stängs; ingen ny dependency; bindningen versionskontrollerad och
drift-omöjlig; CI-säker (process.env-override + mode ger koherens på deploy-ytorna).

Negativa/skuld: dev delar staging-DB tills T31 (lokal-stack) landar; T31 + T32
(anon→publishable-nyckel-migration, slut-2026-deadline) kvarstår som registrerade trådar;
grinden måste verifieras mot befintliga CI-deploys (prod-build = production + prod-ref
passerar; staging-deploy = staging + staging-ref passerar) INNAN Pelare 2 landar.

Uppföljning: T30 + T12/T28/T29 flippar closed först när Pelare 1–3-implementationen landar —
inte vid denna ADR. ADR-061 är beslutet; implementationen stänger trådarna.
