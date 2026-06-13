---
owner: marcus803
updated: 2026-06-14
review_by: 2026-09-14
status: draft
---

# Scope-frö — Session 20: lifecycle-fält + systemkonsolidering

> Externminne författat vid pausen av session 19 (2026-06-14) för en minneslös
> framtida Chat. Detta dok bär HELA planen + research-grunden så session 20 kan
> plockas upp utan föregående chatt-kontext. Läs detta + session-19-dokets
> HANDOFF-block + ADR-051 + L119 vid session-20-start.

## Varför session 20 finns (problemet)

Livscykel-tillstånd (är en session/fas active/paused/closed?) uttrycks idag ENBART
i dok-prosa, på ad-hoc-plats med inkonsekvent vokabulär: session 18 sa
"PAUSLÄGE/Pausorsak"; session 19 begravde "PÅGÅENDE" i en "Del 3 — Lessons +
status"-rubrik. Den implicitheten är exakt rotorsaken till A1/A2-forken som ADR-051
nyss åtgärdade för verb-sidan. Marcus pushback (2026-06-13/14): prosa-bara är risky
— livscykel hör i ett dedikerat, O(1)-läsbart FÄLT, inte begravt i kropp.

## Beslut som redan är fattade (ratificerade av Marcus, bär in i session 20)

1. Bygg ett DEDIKERAT frontmatter-fält `lifecycle:` (enum: `active` / `paused` /
   `closed`) — SEPARAT från `status:`.
2. `status:` förblir orört: det är ett DOKUMENTKVALITETS-fält (enum
   draft/stable/deprecated, ADR-030, empiriskt bekräftat av check-frontmatter.sh
   Check 4). Livscykel är en ORTOGONAL axel — ett dok kan vara `status: stable` OCH
   `lifecycle: paused` samtidigt. Lägg ALDRIG paused i status-enumet (kategori-fel).
3. Fältet måste vara SKILL-ÄGT, annars är det skuld inte tillgång: `session-paus`
   sätter `paused`; `session-resume` sätter `active` vid återupptagning;
   `session-end` sätter `closed`. Utan det ägarskapet flyttas driften bara från
   kropp till fält.
4. Kroppens HANDOFF-block BEHÅLLS — fält = "vilket tillstånd" (O(1)), kropp = den
   rika carryn (öppna trådar, nästa steg) ett fält inte kan bära. Komplement, ej
   ersättning.

## Research-grund (förstaparts + branschstandard — återanvänd, re-researcha ej i onödan)

- Branschstandard-DMS modellerar livscykel-tillstånd som FÖRSTAKLASS-konstruktion
  skild från en kvalitets/status-flagga (Veeva Vault: livscykel-states + workflows
  bär egen active/inactive-statusflagga; status och lifecycle är skilda fält). Källa:
  platform.veevavault.help (Defining Document Lifecycles / Lifecycle States).
- Nytt metadata-fält läggs ADDITIVT/valfritt (schema-on-read): nya dok börjar bära
  attributet, befintliga fortsätter fungera utan — ingen big-bang-migrering. Källa:
  InfoWorld, "separating metadata and content" (2025-11).
- Ortogonalitets-principen (två oberoende tillstånds-axlar modelleras separat, ej
  hopslagna i ett fält) — jfr statechart orthogonal regions. Generell designprincip.
- Intern grund: ADR-030 (governing-docs frontmatter-konvention + status-enum),
  ADR-051 (paus-verb + beslut 4 innehållsgräns), L119 (asymmetrisk axel = drift).

## Session 20 arbets-scope (ordnad)

1. ADR-052 (Proposed→Accepted vid inkrement 1): `lifecycle:`-fält — beslut,
   enum-värden, ortogonalitet mot `status:`, skill-ägt underhåll, övergångs-regel
   för dok utan fältet. Citera ADR-051 + ADR-030 + research ovan. Läs ADR-030 +
   ADR-051 i sin helhet FÖRST (research-före-arkitektur).
2. Frontmatter-policy: lägg `lifecycle:` i schema-definitionen
   (`.frontmatter-policy.conf` el. motsv. — Code verifierar exakt fil/mekanism mot
   disk). Avgör: grind-tvingat (check-frontmatter Check N) eller konventions-bundet?
   Sessionsdok är EJ i governing-listan idag → besluta om de ska in, eller om en
   separat lättare grind läser fältet. Ett oläst fält = passiv struktur (undvik).
3. Konsistens-grind: flagga dok vars `lifecycle:`-fält motsäger kropps-tillstånd
   (t.ex. `active` på ett dok med PAUSLÄGE-rubrik). Annars återinförs drift.
4. Skill-edits (hub `claude-app-skills/`): `session-paus` sätter `paused`;
   `session-resume` sätter `active`; `session-end` sätter `closed`. + intentions-
   grind-klargörande: SESSIONS-paus (behåll N, →paus) vs ARBETS/fas-paus med ren
   sessionsgräns (→end icke-fas-avslut, N+1) — Marcus distinktion 2026-06-13/14.
5. create-session-doc-referens (hub plugin): nya dok FÖDS med `lifecycle: active`.
6. Retro-applicering: session-18 → `lifecycle: closed` (sessionen slutade; 19 var
   nytt dok); session-19 → `lifecycle: paused`. Tighta då session-18:s additiva
   PAUS-KLARGÖRANDE-not (`c1e6f19`) om fältet gör delar redundanta.
7. PI-bas: ev. pekare-tillägg om lifecycle-fältet påverkar Chat-instruktion.

## EJ i session 20:s scope (gränsdragning)

- Staging bygg-steg 3-8 → resume av SESSION 19 (efter session 20).
- Fas 5.5-arbetet → resume av SESSION 18 (sist).
- session-paus-VERBET är redan byggt (ADR-051) — session 20 bygger FÄLTET, inte om
  verbet.

## Marcus-vald sekvens (hela vägen)

Session 20 (detta, lifecycle-fix) → resume session 19 (staging) → resume session 18
(Fas 5.5). "Fixa systemet, sedan slutför arbetet."

## Projektion-moment att batcha EFTER session 20 (Marcus manuellt, en gång)

- RE-PASTE PI (bas+delta) i claude.ai-projektrutan (aktiverar `/session-paus`-pekaren +
  ev. session-20-tillägg).
- LADDA UPP `session-paus` (+ ev. session-20-redigerade skills) till claude.ai
  (Settings → Customize → Skills).
- Båda mot SLUTVERSIONER efter session 20, ej nu (annars dubbelarbete).

## Carry-flaggor som lever oberoende (påminnelse, ej session-20-scope)

- `AIRTABLE_BASE_ID` (=`app8uGPrVCVOm6LfD`) ej satt som prod-secret (prod-ref
  `lvjsfnphlauldxqlncpl`) — MÅSTE sättas FÖRE nästa prod-redeploy (fail-fast,
  refaktor `49267b4`). Hanteras i resume-19 bygg-steg 4, ej session 20.
- Prod-deploy ENDAST via `scripts/deploy-prod-functions.sh`.
