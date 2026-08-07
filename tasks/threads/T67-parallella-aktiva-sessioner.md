---
owner: marcus803
updated: 2026-08-02
review_by: 2026-10-07
status: stable
lifecycle: paused
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

## Designsteget VERKSTÄLLT (2026-08-02, S94) — mekaniseringen kvarstår

**Web-research-kravet uppfyllt** (S94, spawnat MITT I grillningen på Marcus
uttryckliga villkor — Del 3 punkt 6):
[`sessions-parallellitet-frontier-praxis-2026-08-02.md`](../../docs/research/sessions-parallellitet-frontier-praxis-2026-08-02.md)
levererade 3+ precedent för mekanismen (worktree per session — Anthropic,
JetBrains, GitHub Copilot-appen, Cursor, OpenAI Codex) och **fällde halva det
ursprungliga förslaget**: den specifika triggerformen denna tråd länge
föreslagit — session A detekterar session B och isolerar sig SJÄLV, tyst,
utan att fråga — har tunt-till-inget direkt precedent. Etablerade mönster i
samma problemklass (vim swap-filer, tmux nästlad-blockering, GitHub
Codespaces) landar alla på **detektera + fråga**, aldrig detektera + agera
tyst.

**Grillad samsyn 7/7, Marcus-kvitterad 2026-08-02** (S94 Del 3 punkt 6):
reviderat beslut = **detektera + fråga**, inte tyst auto-isolering. Bokfört i
[ADR-090](../../docs/decisions/ADR-090-sessions-parallellitet-detektera-och-fraga.md):
session-start får ett detektionssteg (annat sessionsdoks `lifecycle: active` ·
`git worktree list` · smutsigt huvudträd) → FYND i RAPPORTERA → Marcus
kvitterar i sessionsstartens befintliga utbyte (noll extra rundor). Senare
session tar worktreen; först startad behåller sin plats. Ovillkorad worktree
per session (Anthropics desktop-mönster) är öppet bokförd som framtida väg
"när formen bevisat sig" (Marcus 2026-08-02) — ingen ny grillning krävs för
det bytet, men det bokförs då som en Update i ADR-090.

**Räknar-/ID-allokeringen och merge-kön kräver ingen ändring** — redan
branschmässigt grundade (research-filen § Delfråga 4–5): trunk-based
development (Google, Uber SubmitQueue) för kön, Rails/Django/git-
mönsterfamiljen för räknarna.

**Lifecycle-prövning mot `tasks/threads/README.md`-reglerna (frontmatter
ändrad `active` → `paused` i denna landning):** designbeslutet är fattat och
bokfört (ADR-090), men den FAKTISKA mekaniseringen — detektionssteget skrivet
in i hub-skillen `session-start`/`session-resume` — är HUB-arbete som landar
i en separat hub-PR, utanför denna spoke-landnings räckvidd. Tråden är alltså
varken `active` (inget arbete på den pågår just nu, i DENNA landning) eller
`closed` (det underliggande problemet är inte löst förrän mekaniseringen
faktiskt finns) — `paused` med ett namngivet, externt väntevillkor är formen
`README.md`-reglerna själva definierar för det läget (samma mönster som
`T113` använder för "väntar på en framtida session"). **Väntar nu på:**
hub-PR:n som skriver in detektionssteget i `session-start`/`session-resume`
(orkestrerarens ägande, per ADR-089/ADR-090 § Verkställande). Återupptas
(`paused` → `closed`, eller `active` om mekaniseringen kräver spoke-uppföljning)
när den hub-landningen är verifierad.

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Titel (fullständig, ursprunglig):**
Parallella aktiva sessioner — arbetssätts-pilot (seriella räknare, delad checkout, delade append-ytor, end-pass-serialisering, levande regel-ytor). Pilot = S57 ∥ S56 (systemets första samtidigt-aktiva parallellkörning); guardrails 1–6 i S57 Del 1; empirin ackumuleras i S57-doket. **DESIGNSTEGET VERKSTÄLLT 2026-08-02 (S94):** web-research levererad ([`sessions-parallellitet-frontier-praxis-2026-08-02.md`](../../docs/research/sessions-parallellitet-frontier-praxis-2026-08-02.md), spawnad mitt i grillningen på Marcus villkor) och fällde halva ursprungsförslaget — mekanismen (worktree per session) stenhårt etablerad, men triggerformen (tyst auto-isolering) tunt-till-inget belagd; vim/tmux/Codespaces landar alla på detektera+fråga. Grillad samsyn 7/7 punkt 6 → [ADR-090](../../docs/decisions/ADR-090-sessions-parallellitet-detektera-och-fraga.md): detektera + fråga i session-starts LÄS-fas, ovillkorad worktree öppet bokförd som framtida väg. `paused` i stället för `active`/`closed`: beslutet är fattat men mekaniseringen (hub-skillen `session-start`/`session-resume`) landar i en SEPARAT hub-PR — se kortets § Designsteget VERKSTÄLLT för motiveringen

**Ingång (fullständig, ursprunglig):**
[T67-parallella-aktiva-sessioner.md](T67-parallella-aktiva-sessioner.md) · S57 Del 1 · [ADR-090](../../docs/decisions/ADR-090-sessions-parallellitet-detektera-och-fraga.md)
