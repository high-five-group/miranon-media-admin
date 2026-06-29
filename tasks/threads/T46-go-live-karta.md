# T46 — Go-live-karta: konsoliderad avstånd-till-live per leverans-väg

- Tillstånd: paused
- Uppstod: Session 41
- Karta materialiserad: Session 43 (vid 6g prod-deploy-landningen)

Två-vägs-distinktionen (Skool-export = access-grant, ej consent-gatead / mail =
consent-gatead) och vad som gatear varje väg till prod var durabelt dokumenterat men
SPRITT över ≥5 ytor (segment-arkitektur.md, ADR-062, ADR-067, T44, BUILD-LOG/session-
carries). Denna karta är den konsoliderade operativa vyn: per leverans-väg — vad är
byggt, vad gatear prod, vem äger grinden, hur nära är användaren.

## Go-live-karta (per leverans-väg)

| Väg | Byggt + auditerat | Prod-deployad | Återstående gate till live | Ägare av gaten |
|---|---|---|---|---|
| **Skool-export (6g)** — access-grant, ej consent-gatead | ✅ L1–L4 (S35–S37, arch-audit ren) | ✅ **LEVERERAD S43** — compute-segment/save-segment/get-segments ACTIVE v1 på prod (`lvjsfnphlauldxqlncpl`), auth-grind-bevisad (401/405) | full autentiserad prod-smoke (save-segment happy-path) = **T40**; prod-frontend serverar segment-ytan = overifierat | Code (T40, prod-test-user-förkrav) |
| **Mail (6h)** — consent-gatead | ✅ L0–L3 (S39–S41, arch-audit ren, avvikelse-fix) | ❌ **KVARSTÅR** — send-email ej i prod-allowlisten, ej deployad | **T44 M3** (prod-Resend-nyckel + verifierad `miranon.dev`, psionautics-DNS-korsjämförelse) + Code-at-prod-deploy (`ENVIRONMENT=production` + prod-`Idempotensnyckel`-kolumn + deploy) | Marcus (M3-provisionering) + Code (deploy) |

### 6g-grenens leverans-bevis (S43)

Risk-trappa STEG 0–4': forensisk pre-pass (deploy-set = 3, inget prod-schema-gap) →
allowlist-deklaration 7→10 (`dd97807`, fail-closed-test 4/4) → override-smal prod-deploy
(blast-radius exakt 3, de 5 stale T39-EF:er orörda) → deny-grind grön (401/405, inget 200).
Commit-trail: `fbca88f` (doc-födelse) → `dd97807` (allowlist) → BUILD-LOG Session 43.
Deployen committade inget (out-of-CI prod-handling).

## Closeout-förkrav (gatear FULLT Fas 6-avslut)

- **T39** — prod-funktions-drift-sync: de 5 stale prod-EF:erna ligger efter staging-HEAD;
  skärpt S43 (allowlist nu 10 → blind kanonisk deploy osäker, se [README T39-not](README.md)).
- **T40** — autentiserad prod-smoke: nu både create-event (6f) OCH save-segment (6g);
  precondition = prod-test-user via rätt kanal.

Klass: dok-konsolidering / operativ-vy. Blockerar ej; värdefullt (ADR-053: registrera,
förkasta aldrig tyst). Trådtillstånd `paused` — kartan är ritad, men dess spårade subjekt
(6h-grenen + closeout T39/T40) utvecklas alltjämt; stängs när go-live nås på båda vägarna.
Relaterat: T44, T39, T40, ADR-062, ADR-067, segment-arkitektur.md.
