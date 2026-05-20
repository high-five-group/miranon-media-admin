# Vale L_X.2 Regression Test-Suite

> Etablerad: Session 6.6.6 K3.6 (2026-05-20) per ADR-032 § Regression-skydd.

## Syfte

Denna test-suite implementerar AssertFlip-mönstret (arXiv 2507.17542, 2025) för regression-skydd mot **Vale 3.14.1 L_X.2-upstream-bug**: Vale mis-scopar inline code-spans i flerrads-paragrafer med lazy continuation.

Test-suiten är **lift-trigger** för ADR-032 § Lift-protokoll: när T1 går från PASS (bug reproducerar) till FAIL (Vale rapporterar inte längre fel) har upstream-fix landat → ADR-032-helfil-disables kan tas bort per K-fas.

## Tester

### T1 — L_X.2-reproduktion (inverterad assertion)

**Verifierar:** case-d4.md + case-d6.md reproducerar L_X.2-trigger i nuvarande Vale-version.

**Pass-kriterium:**

- Pre-upstream-fix: Vale RAPPORTERAR fynd → T1 PASS (= bug bekräftad fortfarande)
- Post-upstream-fix: Vale rapporterar 0 fynd → T1 FAIL (= lift-trigger aktiverad)

**AssertFlip-rationale:** Test som "failar på buggy version, passar på fixed version" är valid bug-reproducing test (arXiv 2507.17542 § 3.2). Vår inversion: test som "passar på buggy version (RED-as-GREEN), failar på fixed version" är valid lift-trigger.

### T2 — Helfil-disable suppression

**Verifierar:** `<!-- vale Vale.Terms = NO -->` topp-av-fil suppressar L_X.2-fynd korrekt.

**Pass-kriterium:** 0 Vale.Terms-fynd post-disable-block insertion.

### T3 — Andra rules ej maskerade

**Verifierar:** Brand-rule fortsätter rapportera trots Vale.Terms-disable.

**Pass-kriterium:** Brand-fel flaggas på case-brand.md med "Miranon" standalone.

## Filer

| Fil | Syfte |
|---|---|
| `case-d4.md` | L_X.2-trigger: HELT-bold rad 1 + lazy-continuation |
| `case-d6.md` | L_X.2-trigger: code-span rad 1 + plain lazy-continuation (case-d6 träffar kolumn 3:30) |
| `case-brand.md` | T3-fixture: "Miranon" standalone → Brand-fel förväntat |
| `.vale.ini` | Isolerad minimal-config (BasedOnStyles=Vale + Miranon) |
| `.vale/styles/config/vocabularies/Miranon/accept.txt` | Minimal vocab (4 termer för L_X.2-trigger + Brand-test) |
| `.vale/styles/Miranon/Brand.yml` | Brand-rule (kopierad från real-repo verbatim per K3.6-A Revision 1) |

## Lift-protokoll vid upstream-fix

När `bash scripts/test-vale-regression.sh` rapporterar T1 FAIL:

1. Bump Vale-version i `.github/workflows/ci.yml`
2. Per ADR-032-K3-PENDING-fil: ta bort helfil-disable-block
3. Verifiera Vale rapporterar 0 fynd på filen post-disable-removal
4. Egen K-fas-leverans med atomic-commits per fil

Se [ADR-032 § Lift-protokoll](../../docs/decisions/ADR-032-vale-lazy-continuation-helfil-disable.md) för komplett protokoll.

## Referenser

- [ADR-032](../../docs/decisions/ADR-032-vale-lazy-continuation-helfil-disable.md) § Regression-skydd — spec för T1-T3
- [AssertFlip paper](https://arxiv.org/abs/2507.17542) — inverterad-assertion-mönster
- [errata-ai/Google](https://github.com/errata-ai/Google) — branschstandard Vale-rule-testing
- Session 6.6.6 K3.4 — 11-case minimal-repro-trail
- Session 6.6.6 K3.6 — denna test-suite etablering
