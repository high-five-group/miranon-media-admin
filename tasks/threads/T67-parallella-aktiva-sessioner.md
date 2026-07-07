---
owner: marcus803
updated: 2026-07-07
review_by: 2026-10-07
status: stable
lifecycle: active
---

# T67 — Parallella aktiva sessioner (arbetssätts-pilot)

> Tråd-kort (ADR-053). Född i Session 57:s steg 0-landning (2026-07-07)
> när Marcus beslutade köra S57 (migrerings-hub-session 2) PARALLELLT
> med aktiv S56 (produktspåret, annan agent) — systemets första
> samtidigt-aktiva parallellkörning. Behovet i Marcus ord: "Vi måste
> kunna jobba parallellt med fler aktiva sessioner, annars kapar vi
> produktiviteten ordentligt" — men utan att kollidera.

- **Tråd-ID:** `T67-parallella-aktiva-sessioner`
- **Tillstånd:** se frontmatter `lifecycle`
- **Sessioner:** 57 (född; piloten körs skarpt där, parallellt med 56)
- **Styrande:** S57 Del 1 (parallell-deklarationen + guardrails 1–6);
  ADR-053 (registrerings-plikten)
- **Commit-historik:** `git log --grep "\[T67\]"`

## Vad tråden löser (problemet i klartext)

Sessions-mekaniken (ADR-040/043/051/069) antog implicit EN aktiv
session i taget — inget förbjuder parallellitet, men inget skyddar den
heller. Parallella aktiva sessioner kolliderar potentiellt på:

1. **Seriella räknare** — lessons-, tråd- och ADR-nummer deriveras
   från disk; två sessioner kan derivera samma "nästa" samtidigt.
2. **Delad checkout** — agenterna arbetar i SAMMA working tree
   (git status blandar bådas filer; add-svep kan fånga andras arbete).
3. **Delade append-ytor** — todo.md, BUILD-LOG.md, lessons.md,
   tråd-registret.
4. **End-pass-samtidighet** — två stängningar nära i tid racear om
   numrering och slutsummeringar.
5. **Levande regel-ytor** — en session som redigerar konstitution/
   discipliner ändrar den andres regelverk mitt i körning.

## Pilotens svar (guardrails 1–6, fulltext S57 Del 1)

Räknar-karantän till end-passet + pull-och-omderivera i varje
skriv-ögonblick · end-passen serialiseras via Marcus (ADR-069-grinden
gör honom ändå till grind per session) · skrivyte-separation (hub vs
spoke-kod) · levande regel-ytor minimeras och rigor bevaras ·
kollisions-observationer bokförs öppet som pilot-empiri · explicit
per-fil-add, aldrig `-A`/katalog (delad checkout).

## Status och nästa steg

- Pilot-empirin ackumuleras i S57-doket (empiri #1: förklarad dirty
  tree vid dok-födelsen — parallell-agentens aktiva kort-filer).
- EFTER piloten, på Marcus initiativ: grillning av arbetssättet till
  samsyn → design (räknar-allokering, ev. worktree-isolation,
  todo-/BUILD-LOG-form, end-pass-protokoll) → sannolik ADR (rör
  ADR-040/043/051/069-terräng) + mekanik-hemvist i session-skillsen.
- Web-research-krav vid designen (3+ precedent): Anthropics
  parallel-agents-mönster (git worktrees per agent), trunk-based
  development-praxis, distribuerad ID-allokering.
