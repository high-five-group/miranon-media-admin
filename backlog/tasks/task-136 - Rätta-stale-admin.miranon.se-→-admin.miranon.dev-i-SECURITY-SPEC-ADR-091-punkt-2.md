---
id: TASK-136
title: >-
  Rätta stale admin.miranon.se → admin.miranon.dev i SECURITY-SPEC (ADR-091
  punkt 2)
status: Done
assignee: []
created_date: '2026-08-04 10:45'
updated_date: '2026-08-07 11:07'
labels:
  - ready-for-agent
dependencies: []
modified_files:
  - docs/specs/SECURITY-SPEC.md
priority: low
ordinal: 219000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Utbrutet ur `TASK-129` symptom 2 (fynd 2026-08-02) på Marcus beslut 2026-08-04 (S96-sessionen, chattkvittens; bokförd i sessionsdok Del 10) — Åtgärdsväg A behöll denna del som eget mekaniskt kort i stället för att låta den vänta på ADR-091-amenderingens större fråga.

**Fyndet:** `docs/specs/SECURITY-SPEC.md` rad 461 (mätt 2026-08-04 mot repots HEAD, sektionen `#### A05: CORS på Edge Functions`) bär i sitt illustrativa kodblock för `supabase/functions/_shared/cors.ts`:

```typescript
'Access-Control-Allow-Origin': 'https://admin.miranon.se',
```

[ADR-091](../../docs/decisions/ADR-091-hosting-deploy-vercel-pro.md) punkt 2 beslutade `admin.miranon.dev` som appens origin. Domänen i exemplet är stale — inte CSP-mönstret (punkt 4:s scope) och täcks inte av den rivningen.

**Bekräftat vid triage:** den RIKTIGA koden (`supabase/functions/_shared/cors.ts`, `corsHeadersFor()`) är env-driven via `CORS_ALLOWED_ORIGINS` och innehåller INGEN hårdkodad domän — bara SECURITY-SPEC:s illustrativa kodexempel gör det. Detta är alltså en ren dokumentationsrättelse, ingen kodändring.

**AVGRÄNSNING — de flesta 'miranon.se' i repot är LEGITIMA och ska INTE röras.** Den publika sajten heter miranon.se och Airtable-fältet heter bokstavligen 'Publicerad på miranon.se' (14 filer bär den exakta frasen, mätt 2026-08-04 — TASK-129 uppskattade 19; skillnaden beror sannolikt på filer tillkomna/ändrade mellan fyndet och denna räkning och är i sig inte en del av detta korts scope). En svepande sök-ersätt över hela repot vore fel. Rör ENDAST rad 461:s `admin.miranon.se`-exempel.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SECURITY-SPEC.md:s CORS-exempel (§ 'A05: CORS på Edge Functions') läser 'https://admin.miranon.dev' i stället för 'https://admin.miranon.se'
- [x] #2 Ingen annan 'miranon.se'-förekomst i repot rörd — verifierat via git diff att exakt en rad ändrats i exakt en fil
- [x] #3 SECURITY-SPEC.md:s frontmatter-fält 'updated' bumpat till landningsdatumet (governing doc per .frontmatter-policy.conf)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Premiss-provad mot disk (ADR-086): kortets 'rad 461' var stale — mätt 2026-08-05 mot HEAD, raden är 469 (troligen filförskjuten av commit bc355de7, TASK-127.6, samma dag). Rättad rad = 469, ingen scope-effekt (samma sträng, samma sektion). cors.ts (corsHeadersFor()) verifierat env-driven via CORS_ALLOWED_ORIGINS, ingen hårdkodad domän — kortets premiss höll. Kvarvarande out-of-scope-fynd, ej rört: SECURITY-SPEC rad 808 citerar 'admin.miranon.se' i en historisk ADR-093-riven-not (korrekt, beskriver det FÖRE detta kort) — utanför korts scope per AVGRÄNSNING. Orkestrerarens uppdragstext (2026-08-05) noterade att produktionens CORS_ALLOWED_ORIGINS-secret fortfarande bär admin.miranon.se utöver admin.miranon.dev — SECURITY-SPEC:s text ('Bara appens egen domän tillåts') är en normativ policy-rad, inte ett sakpåstående om secretens aktuella innehåll, så ingen filändring gjordes för den — bokfört här i stället, secreten ej rörd.

Stängd retroaktivt 2026-08-07 (TASK-151, #844-driftsvep): arbetet var klart och mergat 2026-08-05, men CLI-statusflippen till Done uteblev — nattgrindens enda drift-post (1 av 235 prövade kort).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
SECURITY-SPEC.md rad ~469 rättad admin.miranon.se → admin.miranon.dev (§ A05 CORS-exempel). Landat via PR #796 (commit 21759afc, mergeCommit 1d4700b4), mergad till main 2026-08-05T15:43:04Z — verifierat ancestor av origin/main och läst live i HEAD:s docs/specs/SECURITY-SPEC.md. CI grön per jobb på PR:en (Lint+Audit+TypeCheck, Test suite/Pure+Build, Acceptance, Webblasarbeteende, Docs link check — samtliga SUCCESS). Stängt av TASK-151 (#844-drift) 2026-08-07 — AC redan avbockade sedan tidigare, endast status/DoD/final-summary saknades.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
