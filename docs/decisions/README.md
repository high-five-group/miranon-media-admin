---
owner: marcus803
updated: 2026-06-28
review_by: 2026-11-15
status: stable
---


# Architecture Decision Records

Denna mapp innehåller Architecture Decision Records (ADR) för Miranon Media Admin — ett kort, permanent spår av **varför** tekniska val gjordes så att framtida läsare (inklusive framtida jag) förstår kontexten bakom koden.

## Format

Varje ADR följer samma struktur:

```text
# ADR-NNN: [Titel]
- Status: Accepted | Superseded | Deprecated
- Datum: YYYY-MM-DD
- Fas: 0 | 1 | ...
- Kontext: Varför frågan uppstod
- Beslut: Vad vi valde
- Alternativ som övervägdes: Vad vi INTE valde och varför
- Konsekvenser: Vad beslutet innebär framåt
```

En ADR är **oföränderlig** efter att den accepterats. Om ett beslut senare ändras skrivs en ny ADR som `Supersedes ADR-NNN`, och den gamla markeras `Superseded by ADR-MMM`.

### Korrigering vs supersedering

Oföränderligheten justeras via en av två mekanismer beroende på omfattning:

- **Additiv korrigerings-not** — när ADR:ns kärnbeslut STÅR men en avgränsad punkt visat sig felaktig eller inaktuell. En blockquote läggs direkt efter header-blocket (efter `- Fas: …`-raden): `> **Korrigering (<källa>, <datum>):** <vad som korrigeras>. Se <pekare>. Beslutstexten nedan bevaras oförändrad (immutabilitet).` Källan/pekaren är den korrigerande ADR:n (ADR-MMM) eller — för errata utan ny ADR — sessionen/committen som gjorde rättelsen. Ursprungstexten rörs ALDRIG. Precedens: ADR-001 + ADR-010 (korrigerade av ADR-036, Session 7 K0.1c); ADR-030 (fetch-depth-erratum, Session 7 K0.S2).
- **Superseded by** — när beslutet i grunden ersätts eller ogiltigförklaras. En ny ADR skrivs som `Supersedes ADR-NNN`; den gamla markeras `Superseded by ADR-MMM`.

Kriterium: en avgränsad punkt korrigeras medan beslutet kvarstår → additiv not; beslutet ersätts i grunden → supersedering.

## Index

| Nr | Titel | Status | Fas |
|----|-------|--------|-----|
| [ADR-001](ADR-001-biome-over-eslint-stylelint-prettier.md) | Biome 2.0 över ESLint + Stylelint + Prettier | Accepted | 0 |
| [ADR-002](ADR-002-tailwind-v4-theme-css-first.md) | Tailwind v4 `@theme` CSS-first (ingen `tailwind.config.ts`) | Accepted | 0 |
| [ADR-003](ADR-003-css-custom-property-naming.md) | CSS custom property-namnkonvention (bindestreck, inga perioder) | Accepted | 0 |
| [ADR-004](ADR-004-typescript-baseurl-removal.md) | TypeScript `baseUrl` proaktiv borttagning | Accepted | 0 |
| [ADR-005](ADR-005-zod-parallell-definitions.md) | Zod parallella definitioner (schema bredvid interface) | Accepted | 1 |
| [ADR-006](ADR-006-fetch-with-retry-infrastructure.md) | `fetchWithRetry` på infrastrukturnivå (i `callEdgeFunction`) | Accepted | 1 |
| [ADR-007](ADR-007-event-name-collision-deferred-aliasing.md) | `Event`-namnkollision — uppskjuten aliasering per fil | Accepted | 1 |
| [ADR-008](ADR-008-file-inventory-selective-run.md) | FILE-INVENTORY selektiv körning (skydda Fas 0-filer) | Accepted | 1 |
| [ADR-009](ADR-009-supabase-client-env-consolidation.md) | `supabase-client.ts` env-konsolidering via `@/env` | Accepted | 1 |
| [ADR-010](ADR-010-biome-exclude-deno-edge-functions.md) | Biome-exkludering för Deno Edge Functions | Accepted | 1 |
| [ADR-011](ADR-011-csp-plugin-deferral.md) | CSP-nonce-plugin uppskjuten från Fas 0 till Fas 7 | Accepted | 0 |
| [ADR-012](ADR-012-conversion-plan-ersatt-av-byggplan.md) | `conversion-plan.md` ersatt av `byggplan.md` | Accepted | Meta |
| [ADR-013](ADR-013-fas-4-borttagningen.md) | Fas 4 borttagen — DataTable till Fas 7 | Accepted | Meta |
| [ADR-014](ADR-014-create-registration-idempotency.md) | `create-registration` måste vara idempotent (idempotens-kravet står; lagrings-mekanism + timing superseder delvis av [ADR-059](ADR-059-idempotens-lagring-defer-fas-e.md)) | Accepted | 6c |
| [ADR-015](ADR-015-send-email-direct-resend.md) | `send-email` direkt Resend-anrop — medveten skuld | Superseded by ADR-067 | 6e |
| [ADR-016](ADR-016-tanstack-optimistic-mutation-pattern.md) | TanStack optimistic mutation-mönster | Accepted | 5.5 |
| [ADR-017](ADR-017-polling-vs-realtime.md) | Hybrid polling 60s, Realtime till Fas E | Accepted | 6d |
| [ADR-018](ADR-018-fas-5-forenkling.md) | Fas 5 selektivt förenklad — 4 [GA] till Fas 7 | Accepted | 5 |
| [ADR-019](ADR-019-background-sync-defer.md) | Background Sync defer från Fas 7 till Fas 8 | Accepted | 8 |
| [ADR-020](ADR-020-fas-3-5-egen-fas.md) | Fas 3.5 = egen fas (a11y-baseline) | Accepted | 3.5 |
| [ADR-021](ADR-021-docs-omstrukturering.md) | docs/-omstrukturering till specs/analysis/reference/logs/ | Accepted | Pre-Fas-2 |
| [ADR-022](ADR-022-analys-flyttat-till-docs-research.md) | analys/ flyttat till docs/research/datamodell-research/ | Accepted | Pre-Fas-2 |
| [ADR-023](ADR-023-sessions-arkivering.md) | tasks/sessions/-arkivering med datum-baserad strategi | Accepted | Pre-Fas-2 |
<!-- vale Vale.Terms = NO -->
<!-- L_X.1 IL-mitigation per ADR-032 § L_X.1 vs L_X.2-distinktion: Vale.Terms canonical-substitution (github → GitHub) skulle flagga `.github/`-token i ADR-024-titelraden om disable togs bort. IL-disable är tillförlitlig mitigation för L_X.1-klass (inline lookbehind/lookahead-pattern fungerar via IL), vs L_X.2 som kräver helfil-disable per ADR-032. Empiriskt verifierat i K3.6 Block I.2 Skuld 4: temp-fil utan disable → 1 Vale.Terms error rad 57. -->
| [ADR-024](ADR-024-publika-professionalitetssignaler.md) | Publika professionalitetssignaler — LICENSE, package.json, .github/, top-level docs | Accepted | Pre-Fas-2 |
<!-- vale Vale.Terms = YES -->
| [ADR-025](ADR-025-byggplan-lattlast-v2-till-v3.md) | BYGGPLAN-LÄTTLÄST v2 → v3 (revision efter byggplan-revisionen) | Accepted | Pre-Fas-2 |
| [ADR-026](ADR-026-runtime-validering-vid-datagrans.md) | Runtime-validering vid datagräns med Zod `.parse()` | Accepted | 2 |
| [ADR-027](ADR-027-kvalitetsdefinitioner-stack-skifte.md) | KVALITETSDEFINITIONER-11.md stack-skifte (Vue → React) | Accepted | 2 |
| [ADR-028](ADR-028-supply-chain-incident-respons.md) | Supply chain incident-respons-protokoll (npm advisories) | Accepted | 2 |
| [ADR-029](ADR-029-ci-architektur-changed-files-pattern.md) | CI-arkitektur — changed-files-baserat skip-mönster + third-party Actions-policy | Accepted | Meta |
| [ADR-030](ADR-030-docs-grindvakter-frontmatter-policy.md) | Docs-grindvakter + frontmatter-policy (5 grindvakter + 4-fält-frontmatter på styrande docs) | Accepted | Meta |
| [ADR-031](ADR-031-dependabot-strategi-2026.md) | Dependabot-strategi 2026 — grouping, cooldown, minimal CI-yta, manuell review | Accepted | Meta |
| [ADR-032](ADR-032-vale-lazy-continuation-helfil-disable.md) | Vale L_X.2 lazy-continuation-quirk — helfil-disable som formaliserad mitigation | Accepted | Meta |
| [ADR-033](ADR-033-shellcheck-strict-grindvakt.md) | Shellcheck-strict-grindvakt för bash-scripts | Accepted | Meta |
| [ADR-034](ADR-034-skill-arkitektur.md) | Skill-arkitektur — hub/projekt-skills + Agent Skills-standard | Accepted | Meta |
| [ADR-035](ADR-035-plugin-aktivering-user-scope.md) | marcus-system-plugin aktiveras via user-scope install-record (scope-migrering övergiven; #38271) | Accepted | Meta |
| [ADR-036](ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md) | Kvalitetsgrind — CI enda mekaniska enforcement (pre-commit-grind var dead config; korrigerar ADR-001 + ADR-010) | Accepted | Meta |
| [ADR-037](ADR-037-auth-resolution-render-gate.md) | Auth-resolution render-gate (mount-gate + guardad invalidate; stänger Fynd 2 + 3 + index.tsx-vektorn) | Accepted | 2 |
| [ADR-038](ADR-038-router-fel-defaultErrorComponent.md) | Router-fel-fångst via defaultErrorComponent (branded fallback inkl. root-route; stänger Fynd 4) | Accepted | 2 |
| [ADR-039](ADR-039-konsistens-grindar-kadens.md) | Konsistens-grindar i CI — kadens-principen + lesson→grind-principen (per-push ADR-count + fetch-depth-invariant) | Accepted | Meta |
| [ADR-040](ADR-040-sessions-numreringskonvention.md) | Sessions-numreringskonvention — sekventiella heltal (inga decimaler; faser separat axel; historik grandfathrad) | Accepted | Meta |
| [ADR-041](ADR-041-session-end-do-confirm-roll.md) | session-end:s roll — do-confirm-verifiering, inte read-do-motor (omdefinierar ADR-034:s skill-mekanik; tre-lagers-kadens med ADR-039) | Accepted | Meta |
| [ADR-042](ADR-042-code-roll-disciplin-alltid-pa.md) | Code-roll-disciplin alltid-på via template, inte skill — falsifierar Session 9-handoffens "egen skill" mot ADR-034 p.8 + K8 | Accepted | Meta |
| [ADR-043](ADR-043-session-lifecycle-skills-arkitektur.md) | Session-lifecycle som två-ytors skill-par (Chat + Code) + Project Instructions bas/delta-mall; ger Chat-ytan lifecycle-mekanism utan discovery-beroende | Accepted | Meta |
| [ADR-044](ADR-044-react-aria-components-demo-route.md) | react-aria-components som primitiv-bas (hooks = per-komponent-reservutgång) + demo-route `/dev/primitives` i stället för Storybook | Accepted | 3 |
| [ADR-045](ADR-045-a11y-runner-arkitektur.md) | A11y-runner-arkitektur — CI-måltavla `/dev/primitives` via webServer-dev-server, 0 violations kanonisk tolerans, `test:a11y` i Test+Build-sfären | Accepted | 3.5 |
| [ADR-046](ADR-046-felmeddelande-wiring-describedby.md) | Felmeddelande-wiring via aria-describedby (React Arias FieldError) — explicit aria-errormessage rivs; ARIA-UPGRADE §1-erratum | Accepted | 3.5 |
| [ADR-047](ADR-047-pwa-arkitektur-fas-5.md) | PWA-arkitektur Fas 5 — `vite-plugin-pwa` `injectManifest` + Workbox offline-fallback + DoD 4-modernisering (Lighthouse v12 tog bort PWA-kategorin) | Accepted | 5 |
| [ADR-048](ADR-048-synk-horisont-arkiv-atkomst.md) | Synk-horisont — arkivmaterial exkluderas ur projektkunskapen men förblir i git; via-Code-åtkomstregel | Accepted | Meta |
| [ADR-049](ADR-049-fas-5-5-betalfalt-val.md) | Fas 5.5 write-slice skriver Anmälningsavgift, inte Status (Status saknar betald-värde); superseder ADR-016:s Status-kodexempel; allow-test deferrad pending staging-isolering | Accepted | 5.5 |
| [ADR-050](ADR-050-isolerad-staging-miljo.md) | Isolerad staging-miljö — separat Supabase-projekt (Pro) + dedikerad Airtable-bas utan records + env-driven `AIRTABLE_BASE_ID`; avvisar Free+keep-alive och branching som primär; öppna trådar T1–T4 | Accepted | Meta |
| [ADR-051](ADR-051-session-paus-lifecycle-verb.md) | session-paus — fjärde lifecycle-verbet (skriv-motpart till resume): parkera oavslutad session durabelt utan completion; asymmetrisk Chat-skill, bevarar sessionsnummer; utökar ADR-043 beslut 3 additivt | Accepted | Meta |
| [ADR-052](ADR-052-lifecycle-frontmatter-falt.md) | `lifecycle:` — dedikerat livscykel-fält (enum active/paused/closed) ortogonalt mot `status:`; skill-ägt; validerat av separat lätt grind (ej governing-regimen, immutabilitets-skäl); applicering sessionsdok nu, schema-on-read för övriga | Accepted | Meta |
| [ADR-053](ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md) | Tråd-arkitektur — tråden som förstaklass-organisationsenhet (register tasks/threads/ + tråd-ID `T<NN>` + commit-tagg `[T<NN>]`); forensiskt navigerbar tidslinje + inkodad triage av det oväntade; återanvänder lifecycle-fältet; MEDIUM-på-MINIMAL (event-sourcad ombyggnad förkastad) | Accepted | Meta |
| [ADR-054](ADR-054-fetch-depth-full-historik.md) | `fetch-depth: 0` (full historik) — finit djup var anti-mönstret (1→50→100→250 brast 4 ggr); falsifierar ADR-030:s finit-djup-rationale; shallow-detektion blir no-op (acceptabelt); apparatens avveckling deferrad till tråd T08 | Accepted | Meta |
| [ADR-055](ADR-055-datakalla-atkomst-router-context-di.md) | Datakälla-åtkomst via TanStack Router-context-DI — adapter injiceras i router-context bredvid queryClient + auth (ej direkt-importerad modul-singleton); första UI→data-wiringen, precedens för Fas 6; superseder STATE-STRATEGY:152-singletonskissen; avvisar useDataSource-provider (redundant) + env-factory (YAGNI) | Accepted | 5.5 |
| [ADR-056](ADR-056-list-paginerings-port-cursor-dubbel-kalla.md) | List-paginerings-port — cursor-baserad, dubbel-källa: opakt `listPersons({search,cursor,pageSize}) → {persons,nextCursor}`-kontrakt på DataSourceAdapter; Airtable-impl (offset-token-wrapper, ett anrop/sida) byggs nu, Postgres keyset/seek-design låst för Fas E; useInfiniteQuery + "Ladda fler"-knapp (a11y 11/10); ersätter L2:s klient-slice (tyst trunkering + full walk); numeriskt `?page` lämnar URL:en (STATE-STRATEGY-drift flaggad) | Accepted | 6a |
| [ADR-057](ADR-057-lager-oberoende-fitness-invariant.md) | Lager-oberoende som fitness-invariant — deklarerar fyra checkbara klausuler (adapter-enda dataåtkomst; enkelriktat UI→data-beroende; full port-paritet; gäller mot dubbel-källa ej migration) som Inc 3:s post-implementations-audit mäter mot; grundad i architecture fitness functions (Ford/Parsons/Kua); förkastar "underförstått i kod" (ad hoc-räkning driftade 14-vs-15) | Accepted | Meta |
| [ADR-058](ADR-058-arkitektur-fitness-audit-mekanism.md) | Arkitektur-fitness-audit — mekanism + fast rapport-kontrakt + governance-placering: verifierar fem fitness-områden (lager-oberoende/swappbarhet/EF-ribba mekaniskt; över-engineering-vakt/ärliga betyg via omdöme) mot ADR-057 + §6.10 + KVALITETSDEFINITIONER; Code-side `arch-audit`-skill (plugin 4→5), Chat-`/audit` deferras till 3b; rekommenderad vid fas-gränser, ej per-push-grind; fyller nischen ADR-039↔ADR-041 | Accepted | Meta |
| [ADR-059](ADR-059-idempotens-lagring-defer-fas-e.md) | Idempotens-lagring defer:as till Fas E — superseder ADR-014:s lagrings-mekanism (Airtable unik-constraint på skrivbart fält är omöjlig) + timing-beslut; interim klient-skydd (mutationKey-dedup + disabled-knapp under in-flight, klient-UUID-nyckel bevarad i kontraktet), server-side UNIQUE-reservation när Postgres blir datahem (Fas E); smalt multi-session-race-fönster accepterat öppet (single-admin-golv); Alt X Airtable-dedup noterad som fallback | Accepted | 6c |
| [ADR-060](ADR-060-sentinel-setup-purge-create-conformance.md) | Sentinel-markerade test-records + setup-purge för create-write-conformance — per-körning-unik sentinel (ingen cross-run-kollision), conformance EF-only (ingen cred-breddning), purge vid SETUP ej teardown (Vlad Mihalcea), purge i Airtable-creddad tooling SKILD från testet; prod-delete-EF (Alt A) + test-Airtable-cred (Alt B) avvisade; interim manuell/schemalagd purge, bounded sentinel-ackumulering tolererad tills cred-skild seed-fas finns. Första create-write-conformance-konventionen | Accepted | 6c |
| [ADR-061](ADR-061-lokal-miljo-isolation.md) | Lokal miljö-isolation — självverifierande miljö-bindning (Vite mode-separation + fail-fast mode-medveten grind + cred-hygien); löser T30-klustret (T12/T28/T29); Väg B, lokal-stack deferrad → T31 | Accepted | Meta |
| [ADR-062](ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) | Segment-yta — beräknat medlemskap från källan (Deltaganden), dynamisk regel med snapshot; ersätter 6e-L3 "Skicka mail"-inramningen med ny Fas 6g; medlemskap beräknas från källan ej Personer-rollupsen (stänger Luckor A/B/C by construction); strukturerad include/exclude-definition över taxonomin (kurs × modalitet), on-demand-eval, frys/export för SKOOL; Väg A (lappa rollups) + streaming-motor avvisade; Make deprecierbar, 9 legacy-segment migreras gradvis | Accepted | 6g |
| [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) | Airtable-basen som förstklassig leverabel — maxas till 11/10 / branschledarmässig / mall-redo, ej ersätts; resolution sker I BASEN (städa/fixa/optimera), inte lappa eller designa bort i efterträdare; defekt-registret (data-model §Kända fällor + T16 + app↔Airtable-interaktions-registret) = KRAVSPEC för bas-maximeringen; namngiven post-Fas-6-maximerings-milstolpe; Supabase-migration = separat SENARE spår, ej ersättning; öppen rivning av ADR-062:s "route-around"-felpremiss (Chats premiss, korrigerad) | Accepted | Projekt-grundande |
| [ADR-064](ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md) | Segment-taxonomin härleds från event-domänen; medlemskap förblir strikt närvaro; basens ofullständighet är ärlig signal — förfinar ADR-062 beslut 3 (idealiserat "6×2" → disk-/live-belagd sju-par-taxonomi över sex kursnamn); medlemskaps-filtret förblir strikt `Närvaropoäng=1` (golvet lättas ej); include/exclude-rymden härleds från event-domänen (självväxande, ej hårdkodad); tomma segment är ärlig utdata som DRIVER bas-arbetet; oavstämda Föreläsningar + "Resor i medvetandet"-namnkollision registreras (ADR-063/T16), böjs ej in i kontraktet | Accepted | 6g |
| [ADR-065](ADR-065-segment-regel-persistens.md) | Segment-regel-persistens — en sparad app-segment-regel lagras som TYPAD JSON (`{include, exclude}` från segment-membership.ts) i ett NYTT dedikerat fält `App-segmentregel` (multilineText) i den BEFINTLIGA Segment-tabellen; namnet skiljer appens regel från `Segmentformel` (Make-läst) + `Segmentdefinition` (klartext); fältet är migrations-mål för de 9 legacy-formelsträng-segmenten (Make deprecieras post-Fas-6, pekar ADR-062 beslut 7 + T16); separat tabell / återanvänt Segmentformel / Segmentdefinition / Supabase-nu avvisade; speglar Supabase `definition jsonb`; schema-tillägg additivt staging→prod (senare pass) | Accepted | 6g |
| [ADR-066](ADR-066-skapa-event-write-vertikal-idempotens.md) | Skapa nytt event — create-event write-vertikal mot Eventplanering; ETT rad-write, ingen kaskad, system-genererade fält (EventKey/Event-nr) sätts aldrig; server-side-byggt create-set ur typade inputs + allowlist-SSOT; idempotens via Airtable-nativ upsert (`performUpsert.fieldsToMergeOn`) på nytt dedikerat `Idempotensnyckel`-fält (UUID v4, Stripe/IETF-semantik); affärsnyckel-merge / ingen-idempotens / check-then-create-TOCTOU avvisade; pessimistisk create (TanStack-grundad) + disabled-knapp; Eventtyp KRÄVS vid create (prod-introspektion N=50, 100 % sessionsmall båda klasser → ingen carve-out); Månad/år härleds ur Startdatum (bas-maximerings-post T16); EF/allowlist/schema-fält = L1 | Accepted | 6f |
| [ADR-067](ADR-067-bulk-mail-segment-send-kontrakt.md) | Bulk-mail på segment — send-email-kontraktet; **supersederar ADR-015** (aldrig-byggt enkel-sänd); Resend `/emails/batch` (≤100/anrop, sekventiella + 429-toleranta), ej loop-/emails / ej Broadcasts; partial-failure = permissive-mode + distinkt räknande status-objekt (requested/suppressedConsent/suppressedNoEmail/deduped/attempted/accepted/rejected[]), acceptans ≠ leverans; två-lagers idempotens (MAIL: Resend 24h, deterministisk `<jobId>/b<index>`, jobId=UUIDv4 header+body create-event-mönstret, 409 distinkt; LOGG: ny additiv `Idempotensnyckel`-kolumn på Utskickslogg, merge-upsert); consent-gate vid send (`ejGodkandMail===false`, GOLV/GDPR, exkludera-och-räkna); e-post-hygien dedup+exkludera-tomma (GOLV); revisionslogg en-tabells write-vertikal (Bulkutskick-länk valfri, ej obligatorisk förälder); multipart html+text; durabel-kö/webhook-opens/schemalagd-send deferrade (T41/T42/T43); EF/allowlist/schema-kolumn/render-källa = L1+ | Accepted | 6h |

## Relaterade dokument

- [BUILD-LOG.md](../BUILD-LOG.md) — kronologisk implementation journal som refererar dessa ADR:er
- [conversion-plan.md](../archive/conversion-plan-2026-04-14.md) — fas-för-fas-planen
- [gap-analysis.md](../archive/gap-analysis.md) — gap-analys mellan conversion-plan och research
- [../tasks/lessons.md](../../tasks/lessons.md) — universella lärdomar som uppstått under implementation
