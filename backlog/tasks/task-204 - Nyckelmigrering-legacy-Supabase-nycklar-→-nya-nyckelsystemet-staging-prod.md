---
id: TASK-204
title: 'Nyckelmigrering: legacy Supabase-nycklar → nya nyckelsystemet (staging + prod)'
status: To Do
assignee: []
created_date: '2026-08-12 16:53'
updated_date: '2026-08-28 05:09'
labels:
  - ready-for-human
  - sakerhet
dependencies: []
priority: high
ordinal: 379000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ARBETSENHET, ej plockbar skiva — behöver /to-issues innan exekvering. Underlag klart: docs/research/supabase-hemlighetsexponering-forhindrande-2026-08-12.md.

VARFÖR DETTA ÄR GOLV, INTE FÖRBÄTTRING

Supabase egen dokumentation, verbatim (guides/troubleshooting/rotating-anon-service-and-jwt-secrets, hämtad och verifierad av orkestreraren 2026-08-12): "it is no longer possible to rotate the legacy anon, service and JWT secrets."

Konsekvensen är absolut: en läckt legacy-nyckel kan ALDRIG ogiltigförklaras. Vi kan inte byta den. Det gäller BÅDA projekten — staging pqtshyierkdgwdnxuirz och prod lvjsfnphlauldxqlncpl — och prod bär verklig persondata.

Enda vägen tillbaka till rotationsförmåga är migrering till asymmetriska JWT-signeringsnycklar + publishable/secret-nycklar. Supabase avvecklar dessutom legacy-nycklarna (deadline enligt research: slutet av 2026), så migreringen kommer att krävas oavsett — men den är inte längre en deadline-fråga, den är en säkerhetsförmåga vi saknar tills den är gjord.

UTLÖSANDE INCIDENT

2026-08-12 skrev "supabase projects api-keys" ut stagings legacy service_role-JWT i klartext i ett agent-transkript, UTAN --reveal. Research visade att detta är avsiktligt plattformsbeteende: --reveal-flaggan gäller enbart de nya sb_secret-nycklarna (supabase/cli issue 4775, stängd via PR 5633). Legacy returneras alltid i klartext, och det finns ingen kommandoradsväg som tystar den.

Den exponerade staging-nyckeln kan alltså inte roteras. Den blir giltig tills migreringen är gjord. Det är den skuld detta kort betalar.

REDAN GJORT (bygg inte om)

TASK-203 landade det mekaniska försvaret i första ledet: deny-hook mot hemlighets-utskrivande kommandon plus prod-ref-låset, 45 tvåsidiga testfall. Det hindrar en UPPREPNING. Det gör ingenting åt att den redan exponerade nyckeln inte går att byta.

OMFATTNING ATT SKIVA

- Edge Functions som läser SUPABASE_SERVICE_ROLE_KEY ur Deno.env (research räknade 38) — utred om plattformen injicerar en motsvarighet för nya nycklar eller om EF-koden måste ändras.
- Frontendens anon-nyckel → publishable, i .env-filerna och GitHub-secreten TEST_SUPABASE_ANON_KEY.
- Ordning staging före prod, med verifierat kvitto per steg.
- Rotations-runbook skrivs EFTER migreringen, inte före — legacy-systemet stöder ändå inte zero-downtime-rotation, så en runbook mot det gamla systemet vore en runbook för något som inte går att göra.

FÖRBÄTTRING OVANPÅ GOLVET (egna skivor, lägre prioritet)

gitleaks i CI med Supabase-medveten allowlist — research visade att GitHub secret scanning saknar mönster för anon/service_role och att TruffleHog av design är blind för HMAC-signerade JWT:er, medan gitleaks generiska jwt-regel är den enda som fångar formatet (brusig men relevant).

ÖPPNA FRÅGOR ur researchen, ej besvarade

Exakt GHAS-pris per säte (endast sekundärkällor hittade). Om GitHubs supabase_secret_key-mönster matchar sb_secret-prefixet exakt. En tidsmässig motsägelse mellan ett community-supportsvar och den aktuella felsökningssidan om legacy-rotation. Om Claude Code har någon förstaparts output-redaktionsmekanism utöver PreToolUse allow/deny.

SEKVENSERING — Marcus-rekommendation, ej beslutad

Orkestrerarens förslag 2026-08-12: kör detta som eget pass EFTER att aktivitetsloggens kedja nått hem-spalten (TASK-201.7). Skälet är inte prioritet utan risk — migreringen rör samma Supabase-projekt som 201.3-201.8 bygger mot, och en halvfärdig nyckelmigrering mitt i en aktiv byggkedja är farligare än väntan. Marcus har inte tagit ställning.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC saknas medvetet: kortet är explicit 'ARBETSENHET, ej plockbar skiva — behöver /to-issues innan exekvering', och sekvenseringen är ospecad: 'Marcus har inte tagit ställning' till om detta ska köras efter TASK-201.7 eller nu. Kräver Marcus-beslut om sekvensering innan /to-issues kan bryta ned i skivor med egen AC. Källa: kortets egen Description (SEKVENSERING-sektionen). Verifierat av registerhygien-passet 2026-08-28 (redan taggat ready-for-human, sakerhet).
<!-- SECTION:NOTES:END -->
