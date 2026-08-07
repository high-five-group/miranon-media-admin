---
owner: marcus803
updated: 2026-06-23
review_by: 2026-09-23
status: stable
lifecycle: closed
---

# T30 — Lokal miljö-isolation (kluster-parent för T12 / T28 / T29)

> Kluster-tråd-kort (ADR-053). T12, T28 och T29 registrerades som tre separata
> symptom under sessioner 23–31. Forensik (Session 31, T26-arbetet) visade att de
> är tre uttryck för EN rotorsak. Detta kort är den auktoritativa ingången: det
> DIAGNOSTISERAR rotorsaken och KARTLÄGGER branschledar-lösningsrymden. Det
> BESLUTAR inte — lösnings-beslutet + ADR:n är nästa session.

- **Tråd-ID:** `T30-lokal-miljo-isolation`
- **Tillstånd:** se frontmatter `lifecycle` (closed — löst av ADR-061, se Lösning nedan)
- **Symptom-trådar:** [`T12`](README.md) · [`T28`](README.md) · [`T29`](README.md) (förblir separata, pekar hit)
- **Uppstod:** Session 31 (T26 Landning B — prod-pekaren blockerade staging-repron, forensiken följde)

## Rotorsak

**I en mening:** miljö-isolation som stannade vid CI-/deploy-gränsen och aldrig
nådde utvecklarens disk.

Forensisk kedja — varje led belagt mot disk:

- **Rykande pistolen.** Konverteringsplanen instruerade `.env.local` mot prod-reffen
  från dag ett: [`docs/archive/conversion-plan-2026-04-14.md`](../../docs/archive/conversion-plan-2026-04-14.md)
  rad 1157–1159, steg 15 — "Skapa `.env.local`: `VITE_SUPABASE_URL=https://lvjsfnphlauldxqlncpl.supabase.co`".
  Prod-pekaren var alltså inte en drift — den var den ursprungliga instruktionen.
- **Tidslinjen gör det ofrånkomligt.** Lokal e2e-auth ([`tests/e2e/auth.setup.ts`](../../tests/e2e/auth.setup.ts))
  byggdes i commit `fca8bfd` (2026-05-12), när prod var enda miljön. ADR-050
  (Isolerad staging-miljö) beslutades 2026-06-13 och staging byggdes 2026-06-15
  (commit `45c02a9`, "ADR-050 staging-migration komplett"). Lokal-ytan föddes alltså
  ~en månad FÖRE staging existerade — den KUNDE inte peka någon annanstans än prod.
- **ADR-050:s scope.** [ADR-050](../../docs/decisions/ADR-050-isolerad-staging-miljo.md)
  täcker CI + deployad backend. Noll förekomster av `.env.local` / `.env.test` /
  lokal dev i hela ADR:n (`grep -c` = 0); dess öppna trådar T1–T4 (Supabase-tier,
  staging-bas-ID, namn-vs-ID-adressering, schema-sync) rör inte lokal-ytan. Lokal
  disk var en BLIND FLÄCK i staging-migrationen — inte en känd, deferrad skuld.
- **Halv-migrationen.** Session 26 (2026-06-20, [`tasks/sessions/archive/2026-06/2026-06-20-session-26.md`](../sessions/archive/2026-06/2026-06-20-session-26.md)
  ~rad 320) rättade `.env.test`:s `TEST_SUPABASE_URL` + anon-key till staging
  (`pqtshyierkdgwdnxuirz`) — men `TEST_USER`-creds OCH `.env.local` lämnades på
  prod. Dokraden nämner bara URL:en, inte creds/`.env.local` → en opportunistisk
  punkt-fix av den L6b-exponerade prod-URL:en, inte en medveten "migrera lokal
  konfig"-handling. Det förklarar dagens inkoherens: `.env.test` har staging-URL
  men `TEST_USER`-creds som bara autentiserar mot prod.
- **Airtable-sidan friskförklarad.** Ingen lokal `AIRTABLE_BASE_ID` / `AIRTABLE_PAT`
  (appen når Airtable enbart via deployade Edge Functions; PAT bor i EF-env, ej
  klient-bundle). Rotsjukan är därför Supabase-URL-specifik, inte tudelad.

## De tre symptomen

| Tråd | Symptom | Distinkt fix-yta |
|---|---|---|
| `T12` | `.env.test` URL→staging men `TEST_USER`-creds autentiserar mot prod (split) | staging-`TEST_USER`-creds till lokal `.env.test` + URL/creds-koherens |
| `T28` | `.env.local` `VITE_SUPABASE_URL` = prod-ref → lokal dev/e2e träffar prod-DB | mode-separation + miljö-pekaren ut ur den alltid-laddade filen |
| `T29` | `error-context` `aria`-snapshot exponerar lösenord i klartext | maskera/exkludera lösenordsfält ur artefakt / purge i teardown |

Alla tre delar EN orsak (ovan); var och en har ändå sin egen fix-yta → de förblir
separata symptom-trådar som pekar hit.

## Branschledar-lösningsrymd (kartlagd, ej beslutad)

> Rotorsaken är strukturell: miljö-bindningen förlitade sig på handredigering
> av en alltid-laddad fil. Fixen måste därför vara strukturell — branschledare
> gör miljö-bindningen självverifierande så att klassen inte kan återuppstå.
> Tre pelare, var och en källbelagd. Detta kort KARTLÄGGER dem; nästa session
> BESLUTAR (vilka, i vilken ordning, exakt mekanism) och producerar en ADR.

### Pelare 1 — `Vite` mode-baserad miljö-separation (strukturell bindning)

`.env.local` laddas av `Vite` i ALLA fall (gitignored) — därför ärvde varje lokal
körning prod-pekaren. `Vite`-native mönster: mode-specifika env-filer. `vite --mode
staging` laddar `.env.staging`; lokal e2e körs i staging-mode för att matcha CI
exakt (CI sätter `VITE_SUPABASE_URL`=staging-secret, ekvivalent). `.env.local`
reserveras för maskin-lokala, MILJÖ-AGNOSTISKA overrides — aldrig miljö-pekaren.
Då har varje mode en koherent fil; ingen halv-migration möjlig.
Källa: `Vite` env-and-mode-docs (`vite.dev/guide/env-and-mode`). Trade-off:
omstrukturera `.env`-filerna + mode-medvetna npm-scripts. Låg komplexitet.

### Pelare 2 — Fail-fast miljö-validering vid uppstart (strukturell grind)

Mode-separation förhindrar inte en inkoherent bindning (staging-URL + prod-creds,
eller lokal körning mot prod-ref). Fältets svar: validera env vid uppstart, vägra
boota på inkoherens. Vårt felläge är textboksfallet — appen bootar och failar
halvvägs (auth mot staging med prod-creds); uppstarts-validering inverterar det
(avsluta med tydligt fel FÖRE trafik). Konkret: en valideringsmodul (`zod` manuellt,
~3 rader + schema, inget nytt beroende — projektet är TS; alt. `envalid` om en
validator-vokabulär föredras) som VÄGRAR dev/e2e vars Supabase-ref = prod-reffen.
Detta är den strukturella L110-grind T12-noten pekade på, nu belagd. Löser KLASSEN.
Källor: `zod` / `t3-env` / `envalid` 2026-guider (validera vid uppstart, fail-fast).
Trade-off: undvik false-positive på legitima prod-builds.

### Pelare 3 — Credential-hygien + publik-vs-hemlig-distinktionen

AVGÖRANDE skärpning: `VITE_`-variabler buntas in i klient-bundlen by design →
Supabase-URL + anon-key är PUBLIKA (anon-nyckeln RLS-grindad, avsedd för browsern).
Prod-pekaren är därför INGEN hemlighets-läcka — den är ett MILJÖ-BINDNINGS-fel
(lokal aktivitet träffar prod-databasen). Appen routar redan genuina hemligheter
(Airtable-PAT) via Edge Functions (EF-env, ej klient-bundle) — redan rätt
12-faktor-form. De äkta cred-frågorna är smalare: (a) staging-`TEST_USER`-creden CI
har skrevs aldrig till lokal `.env.test` (12-faktor-lackmus: kodbasen ska kunna
bli open source utan att kompromettera creds); (b) T29 — `error-context`-klartext-
läckan är samma lackmus på artefakt-nivå (Playwright maskerar screenshot/video/
trace men ej `aria`-snapshotten; fix: maskera/exkludera lösenordsfältet ur
`error-context`, eller purge i teardown).
Källor: `Vite` security-note (`VITE_` klient-buntat); `12factor.net/config` (lackmus);
Arcjet (env-var-secrets → föredra referens/store-fetch). Trade-off: minimal —
secret-routingen är redan korrekt; mest test-cred-provisionering + en artefakt-fix.

## Scope-not

Detta kort DIAGNOSTISERAR — det beslutar inte lösningen. Vilka pelare, i vilken
ordning, exakt mekanism (mode-namn, validerings-bibliotek, artefakt-fix) → nästa
sessions ADR. T12/T28/T29 förblir öppna symptom-trådar tills den ADR:n landar; T30
är deras kluster-parent och auktoritativa ingång.

## Lösning (Session 32 — ADR-061)

Klustret löst. ADR-061 (lokal miljö-isolation — självverifierande miljö-bindning) beslutade
och implementerade fixen i fyra landningar (verifierade SHA mot git log):

- Pelare 1 — `Vite` mode-separation + dev→staging (commit `dde6d41`)
- Pelare 2 — fail-fast mode-medveten grind, klient-runtime + api-test-yta (commit `8315d5a`)
- Pelare 2.5 — build-tids-vägran via `vite.config.ts`, tredje grind-ytan (commit `eb7ae4c`)
- Pelare 3 — T29 `error-context`-maskering (commit `445b46f`) + T12 cred-synk
  (Marcus, staging-användarnas lösenord satta i dashboarden; `.env.test` + GitHub-secrets synkade)

Symptom-stängning: T28 strukturellt (pekare ut ur `.env.local` + grind), T29 bevisad
artefakt-fix, T12 funktionellt verifierad (auth mot staging grön, Session 32). Säkerhets-
klassen är icke-återuppståndlig via grinden på tre ytor — "för all framtid" uppfyllt.
