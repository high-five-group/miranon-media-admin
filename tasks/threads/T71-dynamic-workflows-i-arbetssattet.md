---
owner: marcus803
updated: 2026-07-12
review_by: 2026-10-09
status: stable
lifecycle: active
---

# T71 — Dynamic workflows / ultracode i Pocock-arbetssättet

> Tråd-kort (ADR-053). Född i Session 60 (2026-07-09) ur Marcus fråga: kan
> Anthropics "dynamic workflows" / ultracode användas i det arbetssätt vi fick
> efter integrationen av Matt Pococks metod — och vad hade Matt själv gjort?
> Utforskningen kördes fullt ut (LÄS → RAPPORTERA); INGET workflow kördes och
> ingen kod rördes. ADR-053-klass: blockerar ej + värdefullt → defer (`paused`).

- **Tråd-ID:** `T71-dynamic-workflows-i-arbetssattet`
- **Tillstånd:** se frontmatter `lifecycle`
- **Sessioner:** 60 (född; utforskningen genomförd, beslut ej taget) ·
  61 (upptagen med `T61`: grillad samsyn — AFK-batch-kontraktet, 5 beslut —
  och pilot körd grön) · 62 (ADR-071 mintad + `/work-batch` byggd,
  hub `3174a1e` plugin 1.13.0 — beslutet verkställt)
- **Styrande:**
  [ADR-071](../../docs/decisions/ADR-071-afk-batch-kontraktet.md)
  (AFK-batch-kontraktet, Accepted S62)
- **Besläktad:** `T67` (parallella aktiva sessioner — samma terräng: samtidighet,
  worktree-isolation, räknar-kollisioner). `T56` (djupa moduler + arkitektur-
  granskning, Pocock-planen). `T01` (system-läsbarhet).
- **Commit-historik:** `git log --grep "\[T71\]"`

## Varför tråden finns

Marcus arbetssätt är sedan S47–S50 en Pocock-härledd kedja: `grilling` → ev.
`prototype` → `to-prd` → `to-issues` → `do-work`, med Backlog.md som durabelt
issue-substrat. Anthropic har sedan dess levererat en primitiv — dynamic
workflows — som utger sig för att lösa exakt det Matt efterlyser i sin kurs.
Frågan är om den hör hemma i vår kedja, var, och till vilket pris.

Utforskningen är **klar**. Det som återstår är ett beslut, och beslutet är
ADR-bart. Kortet bär hela underlaget så att en framtida session inte behöver
göra om arbetet.

## Källor (viktigt — flera ligger UTANFÖR repot och utanför synk-horisonten)

| Källa | Plats | Not |
|---|---|---|
| Kursens fulla transcript (84 lektioner, 11 729 rader) | `/Users/marcus/Documents/Codex/2026-06-23/hej/outputs/ai-coding-for-real-engineers-svenska.md` | **Utanför repot.** Enda fulltext-källan. Alla lektions-/radnummer nedan syftar hit. |
| Destillat (664 rader) | `docs/reference/pocock/matt-pocock-arbetssatt-for-ai-kodning.md` | I repot |
| Kursnoteringar | `docs/reference/pocock/Kursnoteringar_AIHero.md` | I repot |
| Pococks original-skills (svenska) | `docs/reference/pocock/skills-svenska/` | I repot; frusen referens |
| Anthropic-dokumentation | `code.claude.com/docs/en/workflows`, `.../ultrareview`, `.../ultraplan`, `.../agent-teams` | Hämtade 2026-07-09 |

Lokal miljö vid registreringen: Claude Code `2.1.205`; `effortLevel: "xhigh"` satt
globalt; workflows **på**; size guideline `unrestricted`; agent teams **av**;
`origin` = `github.com/marcus803/miranon-media-admin` (så ultrareview/ultraplan
är tekniskt tillgängliga).

## Vad funktionerna faktiskt ÄR (verifierat mot primärkälla)

Andrahandskällor visade sig opålitliga: en `claude-code-guide`-agent rapporterade
fel om både `pipeline()`-signaturen och var skript sparas. Allt nedan är hämtat
direkt ur Anthropics dokumentation.

- **Dynamic workflows** — ett JavaScript-skript som orkestrerar subagenter. Det
  avgörande står i dokumentationens egen jämförelsetabell, kolumnen *"Who decides
  what runs next"*: för subagenter, skills och agent teams är svaret "Claude, turn
  by turn". För workflows är svaret **"The script."** Mellanresultat lever i
  skriptvariabler, inte i ett kontextfönster. Gränser: 16 samtidiga agenter,
  1 000 agenter per körning, "Large workflow"-varning vid >25 agenter eller
  >1,5 M projicerade tokens. Skriptet persisteras per körning under
  `~/.claude/projects/<session>/`; **sparade** workflows hamnar i
  `.claude/workflows/`.
- **Ultracode** — inte ett verktyg utan ett *läge*: `xhigh` reasoning effort
  **plus** automatisk workflow-orkestrering för varje substantiell uppgift.
  Slås på med `/effort ultracode`. Eftersom `effortLevel: "xhigh"` redan är satt
  globalt tillför ultracode oss **endast** auto-workflow-lagret.
- **Ultrareview** (`/code-review ultra`) — molnkörd granskningsflotta där varje
  fynd reproduceras och verifieras oberoende. Usage credits (~$5–20) efter tre
  gratis körningar. Inte ett workflow.
- **Ultraplan** — plan drivs i Claude Code on the web, kommenteras styckesvis i
  webbläsaren, exekveras sedan i molnet eller "teleporteras" till terminalen.

## Den strukturella spärren (kärnfyndet)

Dokumentationen, § *Behavior and limits*:

> "No mid-run user input — Only agent permission prompts can pause a run.
> **For sign-off between stages, run each stage as its own workflow.**"

Ett workflow kan alltså inte stanna och fråga Marcus. Och våra fyra uppströms-
skills är byggda **kring** att stanna och fråga Marcus:

| Skill | HITL-grind som blockerar workflow-formen |
|---|---|
| `grilling` | Samsyn nås först när Marcus explicit kvitterar |
| `to-prd` | Skarv-kvittensen (steg 2) |
| `to-issues` | Skiv-godkännandet (steg 4: granularitet, beroenden, AFK/HITL-klass) |
| `prototype` | Divergens (Marcus väljer EN variant) + konvergens (iteration i browsern) |

Var och en är mid-run user input. **Workflows kan strukturellt inte bära dem.**
Det är inte en begränsning att beklaga — det är samma linje Matt själv drar
mellan HITL och AFK.

## Vad Matt faktiskt säger (citat + radnummer i transcriptet)

Han **efterfrågar** funktionen, bokstavligen (Lektion 48, rad 6819):

> "Vore det inte bättre om vi kunde framtvinga något **deterministiskt** som
> höjer dess kvalitet?"

Och han beskriver sin egen AFK-loop så här (Lektion 57, rad 7774):

> "'Genomför fas N' är i praktiken en `for`-loop som väntar på att automatiseras."

Ett workflow-skript **är** en `for`-loop runt `agent()`. Detta är den starkaste
matchningen i hela materialet. Men fyra villkor avgör om han skulle älska eller
avsky den:

1. **Entropi-tesen** (Lektion 47, rad 6616–6620, 6648). Han förkastar "kod är
   billig": *"I sitt nuvarande tillstånd är AI en accelerator för
   programvaruentropi."* … *"Billig kod accelererar bara dig mot punkten där din
   kludge-mätare är maxad, kodbasen är rent skräp och omöjlig för en AI att
   ändra."* Parallell kodproduktion multiplicerar generering — men inte de
   entropi-räddande commits AI är dålig på.
2. **Sycophancy-risken** (Lektion 41, rad 5710). *"AI har en naturlig benägenhet
   till inställsamhet."* En judge-panel av LLM:er som bedömer LLM:er riskerar
   korrelerad inställsamhet. Hans signalhierarki (Lektion 48, rad 6773–6779):
   typkontroll/test/lint/CI ger *starka* signaler; AI-omdöme är komplement,
   aldrig grund.
3. **Determinism införs motvilligt** (Lektion 70, rad 9368). Om att hindra
   AFK-agenten från HITL-issues: *"Du kanske vill genomdriva detta mer
   deterministiskt genom att dölja dem med etiketter, men hittills har det
   fungerat bra."* Konsekvent med Lektion 21 (rad 2695): *"Det du behöver göra
   är att rida på vågen."* Han plattar inte ut fördelningen — han begränsar
   utfallsrymden.
4. **Uttryckligt mandat att byta ut delar** (Lektion 84, rad 11322): *"Det här är
   just nu bara mitt synsätt. Du får helt fritt göra detta i en annan ordning,
   hitta din egen väg genom labyrinten och kalla faserna vad du vill."*

**Ärlighet om gränsen för materialet:** Matt sätter **aldrig** upp flera parallella
AFK-orkestrerare mot samma arbetsyta. Han varken demonstrerar eller varnar för det.
Den parallellism han faktiskt förespråkar är (a) delagenter för utforskning
(Lektion 16) och (b) *människa parallellt med agent* (Lektion 70, rad 9430). Allt
utöver det är extrapolation från hans principer, inte hans ord.

## Var det PASSAR i vårt maskineri

1. **Research-fasen (Matts fas 2)** — starkast match, lägst risk. `/deep-research`
   finns redan bundlad: fan-out:ar sökningar, korsverifierar källor, filtrerar bort
   påståenden som inte överlever. Matt säger att research *"cachar en dyr
   utforskningsfas"* (Lektion 73) och att **valet** är HITL medan **insamlingen**
   inte är det. Workflow samlar, Marcus väljer. Ingen ny kod krävs.
2. **AT-Max-milstolpen (ADR-063)** — starkast värde. Defekt-registret i
   `docs/reference/data-model.md` är kravspec för bas-maximeringen. Att svepa
   Airtable-basen mot ett defekt-register, fält för fält, är exakt dokumentationens
   kanoniska form: *"audit every file for the same issue, then adversarially verify
   each finding."* Fan-out över många objekt med mänsklig grind på fan-in. Vi har
   redan `arch-audit` som verifierare och Airtable-MCP som agenterna kan nå.
3. **Review-fasen (Matts fas 7)** — situationsbunden. `/code-review ultra`
   verifierar varje fynd oberoende (motmedel mot sycophancy). Men vår CI kör redan
   fem jobb: typecheck, Biome, Playwright api-pure + api-staging, a11y, Vale,
   lychee och ett dussin egna grindvakter. Den deterministiska signalen är redan
   stark. Ultrareview tillför mest inför en **substantiell** merge, inte per skiva.
   Spara de tre gratis körningarna.

## Var det INTE passar

- **`do-work` ska inte fan-out:as.** Tre skäl ur vår egen och Matts arkitektur:
  Matts slutregel *"arbeta bara med en enda uppgift"* (Lektion 64, rad 8648); vår
  `do-work` stänger kortet i **samma commit som koden** (parallella commits mot
  samma branch är en konflikt, inte en optimering); och parallell kodproduktion är
  per Lektion 47 en entropi-multiplikator. `isolation: worktree` löser
  filkonflikten men inte de andra två — och varje worktree måste köra hela
  DoD-sviten separat.

  **REVIDERAD ÖPPET S65 (2026-07-12, ADR-073 — aldrig tyst rivning):**
  avvisningen VAR korrekt för sin form (delat träd + trunk-push +
  samma-commit-stängning + delad plock + delad staging). Premisserna revs
  därefter ben för ben, varje ben med egen bokförd mekanism: *samma
  commit som koden* → tvåstegs-stängningen (T75/L263, S62) gjorde
  stängningen till en separat orkestrator-handling; *parallella commits
  mot samma branch* → kort-branch + PR som serialiseringspunkt (T76
  beslut 4); *delad plock* → Marcus-utpekad partition före spawn (T76
  beslut 2); *entropi-multiplikatorn* → worktree-isolering + fasat
  schema + staging-semafor (T76 beslut 1/3) — och "varje worktree måste
  köra hela DoD-sviten" visade sig vara priset, inte hindret
  (implementationsfasen dominerar väggklockan; semafor-väntan 220 s
  totalt i piloten). **Bevis: S65-piloten** (2 pipelines × utpekade
  kort, 5/5 first-pass, 0 konflikter, ≈35 % väggklocke-vinst).
  Lektion 47:s kärna STÅR för oisolerad parallell kodproduktion —
  det bevisade är den ISOLERADE formen med alla fyra mekanismerna
  (ADR-073), inte fan-out i allmänhet.
- **Uppströms-skillsen kan inte bli workflows.** Mid-run-spärren ovan.
  Dokumentationens egen instruktion (*"run each stage as its own workflow"*) hjälper
  inte, eftersom det är just våra stages som behöver Marcus mitt i. En
  workflow-driven grillning är en självmotsägelse: hela poängen är att det delade
  designkonceptet uppstår i dialogen (Lektion 23).
- **Agent teams är inte vägen — oväntat fynd.** Vid första anblick mappar de 1:1
  mot våra backlog-kort (shared task list, dependencies, self-claim, file locking).
  Men dokumentationen säger att task-listan är **session-scoped**
  (`~/.claude/tasks/{session-derived-name}/`), att `/resume` inte återställer
  in-process-teammates, och att task-status *"can lag"*. Vårt `backlog/`-substrat är
  **durabelt** och överlever sessionsbyten. Kontinuitets-principen (filartefakter är
  enda sanningskällan) säger då att backlog vinner. **Vi har redan byggt den bättre
  varianten.** Detta är direkt relevant för `T67`.

## Rekommendationen som INTE är självklar: slå inte på `/effort ultracode` som default

Systemet vilar på en empirisk mätning: self-review fångar ~9 % av felen,
transparens-rapporten ~64 %, Marcus-pushback ~27 %. Roll-arkitekturen är byggd på
slutsatsen att **extern fångst dominerar och intern självkontroll är svag.**

Ultracode drar åt motsatt håll, och dokumentationen är explicit:

> "Sessions with ultracode on **don't show the [Large workflow] warning**, because
> turning ultracode on already opts you in to large runs."

Och för permission mode `auto`: godkännande-prompten *"Skipped entirely when
ultracode is on."*

Ultracode **tar bort grindar** — precis de grindar arkitekturen bevisat att den
behöver. Det gör Claude till autonom planerare av multi-agent-körningar för *varje*
substantiell uppgift, i ett system vars bärande fynd är att Claude inte bör vara sin
egen granskare.

**Använd i stället `ultracode:` som keyword per prompt.** Då är opt-in explicit,
engångs och riktad — samma form som `/do-work`-avfyrningen: ett durabelt
förhandskvitto för en avgränsad operation. Grindstrukturen bevaras.

## Vad Matt själv sannolikt skulle göra (tolkning, ej hans ord)

- **Koda sin Ralph-loop som ett workflow** — sekventiellt, inte parallellt.
  `maxIterations` blir en `while`-loop; `completionSignal` blir ett returnerat
  schema. Han sa själv att den väntade på att automatiseras. Men han skulle behålla
  *en agent, en uppgift, ren kontext per varv*.
- **Omfamna det på research** utan tvekan — han cachar redan research till granskad
  markdown.
- **Vägra fan-out:a implementation** — hans egen entropi-tes förbjuder det.
- **Ranka våra CI-grindar över varje LLM-judge-panel**, och bara acceptera judges
  ovanpå den deterministiska grunden.
- **Aldrig låta ett workflow ersätta grillningen** — hela hans kritik av planläget
  är att man rusar till en artefakt innan samsyn finns.

**Designidé värd att pröva:** låt en workflow-driven `do-work`-loop
**stanna-och-rapportera** i stället för stanna-och-fråga. Agenten returnerar
strukturerad data — `{status: 'stopped', reason: 'scope-beslut', question: '…'}` —
loopen bryter, Marcus svarar, ny körning återupptar. Våra STOPPA-grindar överlever
intakta men blir **data i stället för dialog**. Det kringgår mid-run-spärren utan
att riva grinden.

## Begreppskrock att lösa vid designen

Ordet "workflow" bär redan **tre** betydelser i repot:

1. GitHub Actions-workflow (`.github/workflows/ci.yml`)
2. Matts "final workflow" — sjufas-kedjan (arbetsflödet)
3. Anthropics dynamic workflow — orkestrerings-skriptet

`ORDLISTA.md` är renodlat produktdomän (Person, Event, Anmälan…) och ska **inte**
bära systemmekanik-termer. Krocken måste ändå lösas språkligt om tråden tas upp —
sannolikt genom att kalla (3) för **orkestrerings-skript** i vårt språkbruk, och
reservera "arbetsflöde" för (2). Hemvist: `SYSTEMET.md` (hubben), ej ORDLISTA.

## Osäkerheter jag inte kunde lösa från källorna

- **`resumeFromRunId` mot vår session-paus/resume-lifecycle.** Dokumentationen:
  *"Resume works within the same Claude Code session. If you exit Claude Code while a
  workflow is running, the next session starts the workflow fresh."* Våra sessioner
  pausas och återupptas över dagar (S60 pausades två gånger). Verklig friktion som
  måste **prövas**, inte resoneras fram.
- **Permission-friktion.** Workflow-subagenter kör i `acceptEdits` och ärver
  tool-allowlisten, men shell-kommandon utanför allowlistan kan prompta mid-run. En
  `do-work`-liknande workflow skulle prompta på `git push` om den inte allowlistas
  först.
- **Ingenting ovan är erfarenhetsbaserat.** Noll workflows kördes. Regeln "testa nytt
  approach med minimalt test före full implementation" är **inte** uppfylld ännu.

## Säkerhets-fynd: fan-out mot prod-basen kräver read-only-regim

Uppstod vid registreringen (S60), efter briefingen — bevaras här så det inte dör med
sessionen.

AT-Max-svepet (steg **B** nedan) skulle låta upp till **16 samtidiga** subagenter
arbeta mot Airtable-basen. Men basen är **prod** (`app8uGPrVCVOm6LfD`), och
Airtable-MCP:n exponerar `create_record`, `update_records`, `delete_records`,
`update_field`, `create_field`. Workflow-subagenter kör enligt dokumentationen alltid
i `acceptEdits` och **ärver sessionens tool-allowlist**, oavsett huvudsessionens
permission mode — och file edits auto-godkänns.

Ett "audit"-svep är per definition **read-only**, men ingenting i workflow-runtimen
framtvingar det. Sexton agenter med skrivverktyg mot prod-basen är en oacceptabel
riskyta för ett svep vars enda syfte är att LÄSA och rapportera.

**Förkrav innan B körs** (ej löst — designfråga för steg C):

1. Begränsa agenternas verktyg till läs-operationerna (`list_records`,
   `describe_table`, `search_records`, `get_record`, `list_tables`), eller
2. kör svepet mot en **kopia** av basen, eller
3. båda.

Detta knyter an till `T12`/`T40`-klassen (test-/skriv-ytor som råkar peka mot prod) och
till ADR-061:s miljö-isolationsregim. Samma klass av fel, ny yta.

## Beslutsstatus

Beslutet är **ADR-bart** enligt baren: (1) svårt att återställa i koherens,
(2) överraskande utan kontext, (3) resultat av en verklig avvägning. Ingen ADR
mintad — beslutet är inte taget. Tas tråden upp är grillning normalstarten
(options-rymden är bred, beslutet permanent).

**S61-uppdatering (2026-07-11):** Tråden upptagen tillsammans med `T61`.
Grillning körd till samsyn ([S61 Del 2](../sessions/archive/2026-07/2026-07-11-session-61.md)
— AFK-batch-kontraktet, 5 beslut: granskningsfärdig-läget · halt-first +
hårda gränser · trunk-push + omprövningströskel · orkestrerings-skript i
session med `/work-batch`-skill + ADR-071 vid bevis · pilot TASK-3).
**Piloten KÖRD GRÖN samma dag** (S61 Del 3): task-3 autonomt `To Do`→`Done`
via sekventiell workflow-iterator kring OFÖRÄNDRAD do-work-skill —
first-pass-CI, 0 defekter, 0 ingripanden. Minimal-test-regeln därmed
uppfylld; § Osäkerheter-raden "ingenting ovan är erfarenhetsbaserat" gäller
inte längre. Kortets rekommendationer höll vid docs-omverifiering med
citat-krav (S61 orienterings-pass); två tillägg BORTOM kortet, båda
doc-verifierade: (a) `claude -p "/do-work"` fungerar dokumenterat (headless-
spåret öppet som framtida CI/cron-form), (b) subagent-verktygsrestriktion
via `.claude/agents`-frontmatter `tools`-fält är dokumenterad —
säkerhets-fyndets förkrav 1 (read-only-regim för AT-Max-svepet) är därmed
byggbart. Permission-osäkerheten löst med granskningsbar
`permissions.allow` i spoke-settings (Marcus-kvitterad diff, `71c9143`).
ADR-071 mintas vid /work-batch-bygget; steg A/B (AT-Max-spåret) står kvar
oförändrade.

**S62-uppdatering (2026-07-11): beslutet TAGET och verkställt.**
[ADR-071](../../docs/decisions/ADR-071-afk-batch-kontraktet.md) mintad
(batch-kvittot · orkestrerings-skript-substratet · granskningsfärdig-läget ·
halt-first + hårda gränser · trunk-push + omprövningströskel ·
headless-spåret som framtida form) och `/work-batch`-skillen byggd i hubben
(`3174a1e`, plugin 1.13.0; SYSTEMET.md §0 bär orkestrerings-skript-begreppet
— begreppskrocken i § Beslutsstatus C-punkten löst). Tvåstegs-stängningen
(T75) skill-normerad i samma landning. Kvar i tråden: steg A/B
(AT-Max-spåret) + review-fasens `/code-review ultra`-form — oförändrade.

## Nästa steg (när tråden tas upp)

- **A.** Kör `/deep-research` mot en verklig, avgränsad fråga i AT-Max-spåret. Noll
  ny kod, noll risk; ger empiri om fan-out/verifiera/syntetisera-formen utan att
  röra maskineriet. **Rekommenderad start.**
- **B.** Skriv ett litet `ultracode:`-workflow som sveper *en* Airtable-tabell mot
  defekt-registret. Testar den faktiska formen vi vill skala, mot vår faktiska
  datakälla. Kör efter A.
- **C.** Grillning → ev. ADR om orkestrerings-substratets hemvist, inklusive
  `do-work`-loopens form (stanna-och-rapportera) och begreppskrocken ovan.

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Titel (fullständig, ursprunglig):**
Dynamic workflows / ultracode i Pocock-arbetssättet — utforskningen KLAR (S60), beslutet ej taget. Kärnfynd: workflows kan strukturellt inte bära mid-run HITL (`grilling`/`to-prd`/`to-issues`/`prototype` har alla en grind mitt i), men Matt efterlyser bokstavligen deterministisk kvalitets-framtvingning (L48) och kallar sin AFK-loop "en `for`-loop som väntar på att automatiseras" (L57). Passar: research-fasen (`/deep-research`), AT-Max-defektsvepet (ADR-063), review-fasen (`/code-review ultra`). Passar EJ: fan-out av `do-work` (entropi-multiplikator, L47; kortet stängs i samma commit som koden). Agent teams förkastade — deras task-lista är session-scoped medan vårt `backlog/` är durabelt. Rekommendation: `/effort ultracode` EJ som default (tar bort grindar; self-review-fångst ~9 %) — använd `ultracode:`-keyword per prompt. Beslutet är ADR-bart

**Ingång (fullständig, ursprunglig):**
[T71-dynamic-workflows-i-arbetssattet.md](T71-dynamic-workflows-i-arbetssattet.md) · besläktad `T67`, `T56` · **UPPTAGEN S61 (2026-07-11):** kortets rekommendationer docs-omverifierade (höll 100 %), grillad samsyn (S61 Del 2) + pilot grön (Del 3); **S62 (2026-07-11):** [ADR-071](../../docs/decisions/ADR-071-afk-batch-kontraktet.md) MINTAD + `/work-batch` byggd (hub `3174a1e`, plugin 1.13.0) — beslutet verkställt; orkestrerings-skript-begreppet landat i SYSTEMET.md §0 (begreppskrock-lösningen)
