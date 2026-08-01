---
id: TASK-113
title: >-
  T108: Stop/SubagentStop-vakten — avslutspåståendet stäms av mot observerat
  tillstånd
status: In Progress
assignee: []
created_date: '2026-08-01 11:55'
updated_date: '2026-08-01 13:23'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 186000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Proveniens

Tråd `T108` (Obevakade tillstånd), flaggad MÅSTE LÖSAS av Marcus 2026-07-29. Formvalet är avgjort i research-passet [`docs/research/obevakade-tillstand-vaktens-form-2026-07-30.md`](../docs/research/obevakade-tillstand-vaktens-form-2026-07-30.md): form (d) mekaniserad som `Stop`/`SubagentStop`-hook som stämmer av aktörens avslutspåstående mot observerat tillstånd och vägrar avslutet när påståendet inte bärs. Trådkartan ([`tasks/threads/S91-tradkarta-2026-07-31.md`](../tasks/threads/S91-tradkarta-2026-07-31.md) § T108) satte ett förbehåll: formen är kortbar först när mätningen av `background_tasks`-täckningen är stängd. **Den mätningen är nu klar** — detta kort mintas på den grunden.

## Sekvens

**Exekvering: efter S91-kärnan** (per trådkartan och minting-uppdraget 2026-08-01). Kortet är plockbart i sak men ska inte plockas före S91-kärnan är landad.

## Mätningarna som stänger kartans förbehåll

Kartans obelagda led var detektorns täckning: fyrar `background_tasks` för spawnade agenter, och om inte — vilken signal ersätter den? Tre mätningar besvarar det:

- **(a)** `background_tasks` var `[]` i båda subagent-körningarna, även med en bakgrundsagent igång (passet § Vad jag inte kunde belägga). En detektor som bara läser `background_tasks` missar "väntar på en subagent".
- **(b)** `TaskList` på orkestrerar-ytan visade "No tasks found" medan **elva spawnade agenter var aktiva** (mätt 2026-07-31, bokfört i [`T112`](../tasks/threads/T112-vackningskedjan-over-turgransen.md) § Mätt 3). Harnessets task-lista är alltså inte heller en bärande signal.
- **(c)** Ersättande signal är **task-notifikationer vid agent-stopp** — och `T112` (§ Mätt 1) visade att även den kedjan kan tystna mot en idle huvudsession: en fullbordad vakt väckte ingen förrän nästa dag. **Detta är ett KÄNT kvarvarande hål som detektorn INTE täcker** — det skrivs in som ärlig svaghet, per passets egen formulering (*"formens ärliga svaghet, och den ska stå i ADR:n — inte döljas"*).

Konsekvens för designen: detektorn kan inte lita på en enskild kanal. Den prövar avslutspåståendet mot det tillstånd som faktiskt är observerbart i hook-indatan (`last_assistant_message` + `background_tasks` + väntepåstående-matchning), och dess kända blinda fläckar bokförs öppet i stället för att antas täckta.

## Vad som ska byggas

`Stop`- och `SubagentStop`-hook i `.claude/settings.json` + detektorskript, per passets § Rekommendation. Passets fem egenskapskrav, vart och ett härlett ur ett belagt fel:

1. **Fail-closed** — kan tillståndet inte avgöras: blockera eller larma, aldrig tyst släpp (förebild `scripts/ci-wait.sh`).
2. **Leverera tillstånd, inte tillsägelse** — mätning 5b visade att `reason` som instruktion kan ignoreras; skriv in avstämningens resultat.
3. **Läs `stop_hook_active`, släpp igenom vid `true`** — taket på 8 är andra försvarslinje, inte design.
4. **Billig i normalfallet** — dyr avstämning endast när `last_assistant_message` matchar ett väntepåstående; annars exit 0 direkt.
5. **Avfyrbar på beställning** — tvåsidigt bevis mot känt fel, samma praxis som `nightly.yml` `simulate_failure` och `gate-proof.yml`.

Logiken config-driven per Lesson #6: universellt skript, värden i policy-conf.

## Två kända kostnader, ur passet — bärs in i beslutet

1. **Formen kan inte distribueras via pluginet** — `hooks`-nyckeln tappas tyst ([`L370` i `tasks/lessons.md`](../tasks/lessons.md)). Den bor per repo och driver isär över tid; precedent för att bära det ändå finns i samma lesson.
2. **Detektionen är heuristisk med falska negativ.** Verkställigheten (blockeringen) är mekanisk och mätt skarp; upptäckten vilar på prosa-matchning och på kanaler som mätningarna ovan visat ofullständiga. Strikt bättre än nuläget, där detektorn är Marcus — men aldrig ett täckningsanspråk.

## ADR-baren

Passet: formen når ADR-baren och *"bör beslutas som ADR, inte glida in via ett kort"*. ADR:n ingår därför i kortets leverans, med de ärliga svagheterna utskrivna — inklusive T112-hålet i (c) ovan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Stop- och SubagentStop-hook registrerad i .claude/settings.json; detektorlogik i config-drivet skript (Lesson #6), inte hårdkodad inline
- [x] #2 Detektorn prövar avslutspåståendet mot observerat tillstånd i hook-indatan och blockerar avslut när ett väntepåstående inte bärs; exit 0 direkt när inget väntepåstående matchar (billig i normalfallet)
- [x] #3 stop_hook_active respekteras: genomsläpp vid true, mätt — taket på 8 nås aldrig i normal drift
- [x] #4 Fail-closed verifierat: oavgörbart tillstånd ger blockering/larm, aldrig tyst släpp
- [x] #5 Hooken levererar avstämningens resultat (tillstånd), inte en förmaning — per passets mätning 5b
- [x] #6 Tvåsidigt bevis körbart i repot: detektorn fäller mot planterat känt väntepåstående-fel OCH är grön mot korrekt avslut
- [x] #7 ADR skriven med de ärliga svagheterna utskrivna: heuristisk detektion med falska negativ, per-repo-hemvist (hooks tappas tyst av pluginet), och T112-hålet — task-notifikationskedjan mot idle huvudsession täcks INTE av detektorn
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
