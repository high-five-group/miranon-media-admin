# ADR-011: CSP-nonce-plugin uppskjuten från Fas 0 till Fas 7

- **Status:** Accepted
- **Datum:** 2026-05-05
- **Fas:** 0 (skrivs i P3a, refereras från Fas 7)

## Kontext

`docs/conversion-plan.md` listade `[GA] vite.config.ts ... security headers-plugin med CSP-nonce` som Fas 0-leverans. Vid faktisk Fas 0-implementation 2026-04-14 (Session 1, React) togs plugin medvetet inte med — endast en kommentar i `vite.config.ts:10` markerade behovet. Conversion-plan bullet-listades som "skapad i Fas 0" men implementationen var skjutsad. P0-inventory (2026-05-04) klassade detta som "behöver omformuleras" — driften måste dokumenteras med ADR snarare än maskeras genom att uppdatera conversion-plan i efterhand.

CSP (Content Security Policy) med nonce kräver:

1. Server-side header-injektion (deploy-pipeline)
2. Klient-side nonce-passering till alla `<script>` och `<style>`-taggar
3. Vite-plugin som genererar unik nonce per build/request
4. Fallback-strategi för dev-läge där HMR kräver `unsafe-inline`

I Fas 0 var deploy-pipelinen inte etablerad, ingen route hade renderad HTML, och CSP utan praktisk angreppsyta är teoretisk skyddsåtgärd. Fas A (säkerhetshardening 2026-05-04) prioriterade angreppsytor med faktisk impact (auth, operations-API, INVARIANT-mönster).

## Beslut

CSP-nonce-plugin implementeras i **Fas 7 (Konsolidering)**, inte i Fas 0. Plugin levereras tillsammans med:

- Trusted Types
- Säkerhetsheaders (HSTS, X-Frame-Options, etc.)
- Deploy-pipeline (staging → production)
- Verifierad chaos-testing

Fas 7-DoD inkluderar: "CSP-plugin aktiv i prod, ingen inline-script-violation i console". Implementation följer detta beslut — `byggplan.md` Fas 7 listar plugin som scope-bullet, Fas 0 listar den som skuld.

## Alternativ som övervägdes

**Alt 1 — Implementera i Fas 0 enligt conversion-plan.** Avvisat: ingen praktisk angreppsyta att skydda i Fas 0; plugin-koden hade ändå behövt omarbetas när deploy-pipeline etablerades i Fas 7. Tidig implementation utan deploy-context = teoretisk kod, högre risk för fel vid senare aktualisering.

**Alt 2 — Implementera i Fas 5 (app-shell) när första route renderar.** Avvisat: Fas 5 förenklat per B3-beslutet (P1) — `[GA]`-tillägg som kräver deploy-context flyttades samlat till Fas 7. CSP följer samma logik.

**Alt 3 — Skippa CSP helt, lita på andra säkerhetsåtgärder.** Avvisat: CSP är defense-in-depth mot XSS som inte ersätts av andra mönster (operations-API, INVARIANT). Defer:as, inte skippas.

## Konsekvenser

**Positiva:**

- Plugin implementeras i kontext (deploy-pipeline finns) → mindre risk för fel.
- Fas 0 levererar fokuserat (tokens, Biome, build-setup) utan teoretisk säkerhetskod.
- Tydlig spårbarhet: skuld noterad i `byggplan.md` Fas 0 + ADR-pekare.

**Negativa:**

- Mellan Fas 0 och Fas 7 har appen ingen CSP-skydd. Mitigation: appen är inte i production under den tiden — staging-deploys kommer först i Fas 7.
- Risk att Fas 7 glömmer plugin när scope växer. Mitigation: Fas 7 DoD-punkt 1 är "CSP-plugin aktiv i prod" — direkt mappad mot detta ADR.

**Verifiering:** I Fas 7-start läses denna ADR. Plugin-implementation refererar ADR-numret i kommentar. Fas 7 DoD bockar av "CSP aktiv → verifikation att ADR-011:s villkor är uppfyllda".
