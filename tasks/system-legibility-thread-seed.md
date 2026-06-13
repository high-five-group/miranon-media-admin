---
owner: marcus803
updated: 2026-06-14
review_by: 2026-09-14
status: draft
---

# Tråd-frö — Systemets läsbarhet + hantering av det oväntade

> Externminne författat vid pausen av session 19 (2026-06-14) för en minneslös
> framtida Chat. Detta är en OVÄNTAD tråd som uppstod utanför scope i en pausad
> session — och att den behövde en egen fil för att överleva är det första beviset
> på gapet den beskriver. Läs detta + ADR-043 + ADR-051 + L119 innan tråden tas upp
> för riktig behandling (egen ADR, egen session).

## Vad Marcus egentligen vill skapa (problemet i klartext)

Inte "ett bättre system" i allmänhet, utan två krav som ser ut som två men är ett:

1. Systemets HISTORIA ska vara en förstaklass-artefakt — en utomstående ska kunna titta in i dokumentationen och EXAKT förstå vad som hänt, och logiskt + effektivt navigera händelsekedjan/tidslinjen.
2. Det OVÄNTADE (saker utanför scope — ibland nära, ibland långt ifrån, men alltid oväntat) ska hanteras av en INKODAD process, inte av Marcus omdöme i stunden varje gång.

Forensisk läsbarhet som designad egenskap; triage av det oväntade som inkodad rutin.

## Varför detta är ett äkta gap (per systemets EGEN standard)

Hela ADR-043:s premiss var att "lita på omdöme/konvention vid lifecycle-ögonblick" var
empiriskt för svagt (K8 + de tre process-haverierna) — så det KODADES IN som skills.
"Lita på omdöme för det oväntade" är exakt samma svaghetsklass, oåtgärdad. Per
systemets egen bevisföring är gapet reellt, inte en lyx.

Testet som bevisar gapet: Marcus fråga själv. Den är en oväntad utanför-scope-tråd i
en pausad session. Systemets faktiska alternativ för den var: (a) dö med chatten,
(b) Marcus minns den (svagaste mekanismen — den ADR-043 underkände), (c) improvisera
en fil (detta dok). Det fanns inget FÖRSTAKLASS-HEM för "värdefull oväntad tråd →
parkera durabelt, länkad, navigerbar, för senare triage".

## De två konkreta gapen

1. INGEN INKODAD TRIAGE FÖR DET OVÄNTADE. Idag beslutar Marcus ad hoc (denna session valde detour-bygg för paus, ny-session för lifecycle-fält — fungerade, men via omdöme, inte process). Ingen namngiven rutin "oväntat uppstår → klassa → hantera".
2. INGEN KANONISK TIDSLINJE — plus en NY lucka vi själva skapade. Historien lever utspridd över ADR / lessons / sessionsdok / BUILD-LOG / todo / git, var och en partiell, hopfogad för hand. Ironin: paus/end-gränsen i ADR-051 (beslut 4) gör att paus INTE skriver BUILD-LOG — så hela paus-bygget (ADR-051 + skillen, denna session) syns inte i den kronologiska loggen förrän session 19 så småningom AVSLUTAS. För en pausad session finns ingen kronologisk händelsepost i mellanläget. En utomstående KAN rekonstruera, men inte "exakt och effektivt" — ingen "börja här, följ tråden"-ryggrad finns.

## Rotorsaken (under båda gapen)

Organisationsenheten är SESSIONEN (en chatt-avgränsad behållare). Men arbete flödar i
TRÅDAR (en fas, en feature, en utredning, en oväntad upptäckt) som skär TVÄRS igenom
sessioner. Exempel: Fas 5.5 är en tråd som spänner 18→19→20→19→18. Det oväntade är
ALLTID en ny tråd. Eftersom doken är organiserade efter behållaren (session), inte
efter tråden (den kausala enheten), har det oväntade inget hem OCH tidslinjen går inte
att navigera per tråd. Samma rot gjorde session 18 förvirrande; samma rot gör Marcus
fråga hemlös.

## Optionsrymd (att VALIDERA i ADR-sessionen — EJ förvald här)

Billigast först:

- MINIMAL: namngiven triage-mikroprocess (oväntat → klassa: defer-till-register / ny-session / detour-nu / förkasta) + en tunn TRÅD-/BACKLOG-REGISTER-fil som ger oväntade trådar ett hem OCH dubblar som utomståendes index/ingång.
- MEDIUM: trådar som egen dok-typ med tillstånd (återanvänd session 20:s `lifecycle:`-fält — active/paused/closed för trådar) + ett tidslinje-index som länkar trådar ↔ commits ↔ ADR/lessons.
- TUNG: event-sourcad omstrukturering av hela dok-modellen kring trådar (append-only händelselogg som sanning, tillstånd härlett).

Chat-Claudes seniorlutning (att pröva, ej anta): BÖRJA MINIMAL. Systemets egen filosofi
— koda den svagaste länken, håll hierarkin grund, överabstrahera inte (ADR-034/043) —
talar för det. Den tunga versionen riskerar att bli byråkrati som bryter just den
sömlöshet målet kräver (ett system så elaborat att det blir sin egen overhead). Tunn
register + triage stänger båda gapen till låg kostnad. Validera mot research före beslut.

## Ärlig kalibrering (skydd mot överbygge)

INGEN dokumentation gör historien perfekt läsbar för en kall utomstående — git självt
(guldstandarden) kräver expertis att läsa. Målet är inte allvetande utomstående; det är
"dramatiskt mer navigerbar via en tunn ryggrad". Jaga det uppnåeliga, inte asymptoten.

## Triage-taxonomi (STARTPUNKT att förfina, ej slutgiltig)

När något oväntat uppstår, klassa mot två axlar — närhet till nuvarande scope, och om det BLOCKERAR nuvarande arbete:

- Blockerar + i scope → hantera nu (som paus-bygget: enabling-detour, egen landning).
- Blockerar + utanför scope → STOPPA, eskalera till Marcus (väg-beslut).
- Blockerar ej + värdefullt → defer till tråd-/backlog-register (durabelt, för senare).
- Blockerar ej + lågvärde → förkasta explicit (ej tyst — noteras kort).

Kriteriet "ny session vs detour" = sessions-paus-distinktionen (ADR-051/session 20):
fortsätter samma scope → detour; distinkt scope → egen session.

## Research-domän-checklista (för trådens ADR — obligatorisk web-research)

Förstaparts först, sedan minst 3 distinkta branschledande mönster. Query-mönster + mål:

- Anthropic förstaparts (FÖRST): long-running agent harness — plan-fil + progress-fil + strukturerade handoffs; hanterar de oväntat-scope/avbrott? Query: "Anthropic long-running agent progress handoff unexpected work".
- Event sourcing: append-only händelselogg som sanning, tillstånd härlett. Query: "event sourcing append-only log state reconstruction timeline". Branschled: Fowlers event-sourcing-beskrivning; EventStore; Kafka-as-log.
- Distribuerad tracing (stark analogi tråd↔trace): trace = tråd, span = arbetssteg över tid/tjänster. Query: "distributed tracing trace span model OpenTelemetry".
- Work-item-/issue-spårning: hur Linear/Jira/GitHub Issues modellerar en arbetsenhet som spänner många sessioner/PR:er — tillståndsmaskin, länkar, tidslinje. Query: "issue tracker work item state machine timeline links".
- Beslut-/audit-logg i skala: navigerbar besluts-/ändringshistorik. Query: "audit trail immutable queryable history" + "architecture decision log navigability".
- Oplanerat arbete i agila system (triage-sidan). Query: "handling unplanned work interrupts WIP triage".

Kräv minst 3 distinkta branschledar-källor för ADR:n; återanvänd befintlig projekt-research där den finns.

## EJ i denna tråds scope (gränsdragning)

- Pausade session 19 (staging) + session 18 (Fas 5.5) — orörda; egna resumes.
- Session 20 (lifecycle-fält) — egen, redan seedad; denna tråd är SEPARAT men kan ÅTERANVÄNDA lifecycle-fältet för tråd-tillstånd (se MEDIUM).
- Den faktiska arkitekturen — avsiktligt EJ designad här. Detta frö poserar problemet + optionsrymden; ADR-sessionen beslutar.

## Sekvensering (Marcus prioriterar)

Sannolikt efter session 20 (lifecycle-fältet är en byggsten denna tråd kan återanvända)
— men möjligen före staging (resume-19) om systemkonsolidering värderas över
feature-arbete. Marcus äger ordningen.

## Relaterat

ADR-043 (lifecycle-skill-arkitektur; K8-precedent: omdöme-vid-ögonblick för svagt →
inkoda). ADR-051 (paus-verb; BUILD-LOG-luckan i beslut 4). L119 (asymmetrisk axel =
drift). ADR-030 (frontmatter-konvention). ADR-048 (synk-horisont/arkiv —
läsbarhets-relevant). ADR-023 (arkivering). `session-20-scope-seed.md` (lifecycle-fält
— återanvändbart för tråd-tillstånd).

## Meta

Att denna fil existerar — en oväntad utanför-scope-tråd, registrerad rent och durabelt
i stället för att dö med chatten — är det FÖRSTA proof-pointet på den förmåga tråden
vill bygga in. Behandlingen av tråden börjar med att tråden bevisar sin egen tes.
