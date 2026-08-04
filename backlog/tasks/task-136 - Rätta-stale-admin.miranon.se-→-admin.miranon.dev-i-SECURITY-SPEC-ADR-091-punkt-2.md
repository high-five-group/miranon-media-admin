---
id: TASK-136
title: >-
  Rätta stale admin.miranon.se → admin.miranon.dev i SECURITY-SPEC (ADR-091
  punkt 2)
status: To Do
assignee: []
created_date: '2026-08-04 10:45'
labels:
  - ready-for-agent
dependencies: []
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
- [ ] #1 SECURITY-SPEC.md:s CORS-exempel (§ 'A05: CORS på Edge Functions') läser 'https://admin.miranon.dev' i stället för 'https://admin.miranon.se'
- [ ] #2 Ingen annan 'miranon.se'-förekomst i repot rörd — verifierat via git diff att exakt en rad ändrats i exakt en fil
- [ ] #3 SECURITY-SPEC.md:s frontmatter-fält 'updated' bumpat till landningsdatumet (governing doc per .frontmatter-policy.conf)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
