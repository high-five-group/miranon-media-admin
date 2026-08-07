---
id: TASK-148
title: 'PRD: Subagentens väntekontrakt — parkering löst för gott'
status: To Do
assignee: []
created_date: '2026-08-07 09:44'
labels: []
dependencies: []
ordinal: 246000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Subagenter kan hamna i väntan som strukturellt aldrig kan brytas — en subagent har ingen framtida tur att vakna i. Tre mätta instanser (L323, L340, tre agenter ~700k tokens 2026-08-05). Orkestreraren märker inte parkeringen: fullbordade vakter väcker inte en idle session (T112), och harnessets task-lista visar tomhet medan agenter är aktiva. Kompensationer finns (heartbeat-svepet, stop-vakten, vakt-design-regeln) men vägen IN i parkeringen står öppen — Monitor och run_in_background är anropbara i subagent-kontext — och rotorsaken på orkestrerar-sidan (var väckningskedjan bryts) är obelagd (T112 mätning iv aldrig körd).

### Lösning

Mekanisera väntekontraktet: en subagents jobb är att GÖRA, aldrig att VÄNTA. (1) PreToolUse-spärr nekar Monitor och run_in_background i subagent-kontext — fullföljer harnessens eget mönster (fyra async-verktyg är redan strukturellt borttagna ur subagenter av leverantören själv). (2) Persistens-före-väntan + explicit-timeout kompletteras i bygg-agent-instruktionen (auto-bakgrunds-konverteringen kan ingen hook stoppa). (3) Principen namnges i konstitutionen. (4) ADR-096 kodifierar kontraktet. (5) Harness-mätning belägger var väckningskedjan bryts; protokoll författas av agent, mätningen körs i dedikerad HITL-session. (6) Upstream-issue till harness-leverantören när luckan bekräftats mot aktuell version.

### Användarberättelser

1. Som orkestrerare vill jag att en subagent som försöker gå in i asynkron väntan stoppas mekaniskt i anropsögonblicket, så att parkerings-klassen inte kan uppstå oavsett instruktions-efterlevnad.
2. Som Marcus vill jag att inga tokens bränns på väntan som strukturellt inte kan brytas, så att batchar landar i arbetstakt, inte i väcknings-takt.
3. Som bygg-agent vill jag få ett tydligt nej med skäl när jag försöker använda en väntemekanism som inte kan leverera till mig, så att jag väljer förgrunds-formen direkt.
4. Som bygg-agent vill jag ha en explicit sekvensregel — persistens före väntan — så att mitt färdiga arbete alltid är återhämtningsbart även om min process dör efteråt.
5. Som orkestrerare vill jag veta exakt var väckningskedjan bryts (notifikations-leverans eller agent-resume), så att kompensationer riktas mot den verkliga defekten och inte mot symptom.
6. Som Marcus vill jag att mätta harness-defekter rapporteras uppströms med våra mätdata, så att de lagas vid källan i stället för att kompenseras lokalt för evigt.
7. Som framtida spoke vill jag ha mönstret dokumenterat med logik och konfiguration separerade, så att det kan dupliceras utan refactor.
8. Som framtida läsare vill jag förstå varför verktyg som harnessen listar nekas lokalt, så att spärren inte rivs som ett misstag.
9. Som orkestrerare vill jag att stop-vaktens kända blinda fläck (spawnade agenter syns inte i background_tasks) får sitt facit ur mätningen, så att avslutspåstående-vakten kan skärpas eller frikännas på data.

### Implementationsbeslut

- PreToolUse-spärren nekar Monitor-verktyget och Bash-anrop med run_in_background när hook-indatan bär agent_id (subagent-kontext). Logiken universell, värdena i egen policy-konfig per repots grindvakts-konvention. Registreras i spoke-settings — hooks kan inte distribueras via plugin (L370).
- Ordningen låst i grillningen: spärren → instruktionskompletteringen. Skivan "bygg ADR-087-hooken" UTGICK vid kod-verifiering — stop-vakten är redan byggd, registrerad på båda hook-eventen och tvåsidigt bevisad (TASK-113).
- Instruktionskompletteringen är en KOMPLETTERING av bygg-agentens befintliga asynkron-signal-sektion, inte en ny sektion: (a) persistens före väntan — commit + push innan varje anrop som kan konverteras till bakgrund; (b) explicit timeout på långa kommandon — enda försvaret mot harnessens tysta bakgrunds-konvertering vid timeout.
- Principen namnges i konstitutionen med Temporal-mönstret som förebild: subagent = Activity (GÖR), orkestrerare = Workflow (VÄNTAR).
- ADR-096 kodifierar hela kontraktet; ADR-087 refereras som syskonmekanism för avslutspåstående-klassen. Extern köhanterare avråds explicit med decline-rationale i ADR:n.
- Harness-mätningen: differentialprotokoll där varje cell skiljer EN variabel (bakgrunds-Bash · Monitor-event · subagent-completion, vardera mot idle respektive nyss aktiv session), facit läses ur sessionens JSONL-transcript post-hoc. Landar som research-dok + T112-uppdatering (mätning iv får sitt svar).
- Upstream-issue: agent författar utkast; Marcus godkänner texten före filing — utåtriktad handling.
- Premiss-pass obligatoriskt först i varje skiva: harness-fakta (verktygslistor, hook-fält, versionsbeteende) omverifieras mot live miljö och mot koden före bygge — research-underlaget mättes mot en specifik harness-version, och koden är sanningskällan.

### Testbeslut

- Spärren testas i repots etablerade tvåsidiga hook-testsvits-form (deny-familjens prejudikat): syntetisk hook-JSON in; fäller-fall (Monitor med agent_id · run_in_background med agent_id), släpper-fall (samma anrop utan agent_id · orelaterade verktyg), fail-closed-fall (oparsbar indata). Externt beteende testas — exit/permissionDecision — aldrig skriptets inre.
- Skarpbevis kan ALDRIG tas i byggsessionen (hook-laddnings-regeln): bokförs som öppen skuld i skivan, betalas som en av nästa sessions första handlingar med differentialmätning mot en redan laddad hook.
- Docs-skivorna bär de befintliga dokumentations-grindarna; inga nya grindar införs.

### Utanför omfattningen

- Extern durable-execution-infrastruktur (köhanterare) — explicit avrådd i research; omprövas endast om framtida mätning visar att orkestrerar-väntan blockerar framdrift, inte bara kostar tokens.
- Ändringar i heartbeat-svepet — det fungerar och är andra sidan av kontraktet.
- Hub-distribution av hook-mekanik — omöjlig via plugin; hubben får mönster-dokumentation vid nästa hub-sync.
- Busy-wait-klassen (upprepade korta polling-anrop) — bränner tokens men parkerar inte; egen framtida yta om mätning motiverar.

### Estimat

5 skivor + QA-kort. Storleksklass liten-medel: en mekanik-skiva (medel), fyra docs/protokoll-skivor (små).

### ADR-koppling

ADR-096 mintas i skiva 1 (väntekontraktet — över baren, prövad i grillningen S99). Styrande i området: ADR-086 (mottagaren prövar premisser), ADR-087 (stop-vakten, syskon), ADR-053 (triage av det oväntade), ADR-090 (sessions-parallellitet).

### Ytterligare anteckningar

Grillad samsyn: sessionsdok S99 Del 2 (fem kvitterade frågor + skarv-kvittens med premiss-korrektion). Research-underlag: subagent-parkering-handoff-kontraktet (2026-08-05), obevakade tillstånd (2026-07-30), orkestrerar-väckning (2026-08-02). Kronologi och instanser: T112, T108, TASK-115. Marcus process-markering under grillningen: kod-verifiera substratets premisser FÖRE frågor formuleras — inbakad här som obligatoriskt premiss-pass per skiva.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
