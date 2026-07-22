# ADR-071: AFK-batch-kontraktet — /work-batch som orkestrerings-skript kring oförändrad do-work

- Status: Accepted (Session 62 — 2026-07-11; grillad samsyn S61 Del 2 [5 beslut,
  samtliga på Code-rekommendation med Marcus-kvittens] + pilot bevisad Del 3
  [TASK-3 autonomt To Do→Done] + batch 2 Del 4 [granskningsfärdig-läget bevisat];
  kanonisk samsyns-trail: `tasks/sessions/2026-07-11-session-61.md` Del 2–4)
- Datum: 2026-07-11
- Fas: Session 61–62 — arbetssätt/exekverings-process (ingen
  byggfas-status-ändring)

> **Amendering (Session 76, 2026-07-22 — T81 review-utfalls-klasserna;
> grillad samsyn S76 Del 2 [5 beslut, samtliga på Code-rekommendation
> med Marcus-kvittens, varav två villkorade "djupt genomtänkt och
> branschledarmässigt" → research-pass före låsning]; research-grund:
> Google eng-practices · Conventional Comments · Bugzilla/Mozilla-
> resolutionerna · Scrum sprint review + Definition of Ready ·
> Kubernetes-triage; empirisk grund: S75 Del 8–10, review-våg 1 +
> fix-vågorna PR #78/#79):** fyra poster som förlänger beslut 3 förbi
> "Done-flippen är Marcus" med review-utfallens hantering;
> beslutstexten nedan bevaras oförändrad (immutabilitet).
>
> 1. **Klassrymden — tre hanterings-klasser + två bokförings-utfall.**
>    **FIX** (byggfel mot facit/kort) och **FACIT-REVIDERING** (Marcus
>    ändrar facitet med komplett direktiv inom kortets leverans-yta;
>    rivs ÖPPET, aldrig tyst) hanteras i fix-vågen; **ITERATION**
>    (öppen designfråga ELLER ny yta/nytt scope) blir ny skiva.
>    Bokförings-utfall: **INGEN DEFEKT** (facit-exakt leverans, eller
>    ägs-av-annat-kort → bokförs på ägande kort) · **STALE LÄGE**
>    (granskningen träffade äldre serverat läge → omgranskning i
>    färskt läge, ingen klassning dessförinnan). Gränstestet är
>    TVÅDELAT: *komplett direktiv?* + *inom levererad yta?* — båda JA
>    → fix-våg; annars skiva. (T81-radens ursprungliga avsikts-formel
>    ersatt öppet: den felklassade S75:s facit-revideringar redan vid
>    första mötet med empirin.)
> 2. **Fix-vågens kontrakt (femdelat).** (i) Färskt-läge-kontroll +
>    verifiering av varje review-punkt mot kod/kort/facit FÖRE
>    klassning — utforsknings-belägg, aldrig gissning; (ii)
>    klassningen eskaleras som STOPPA-frågor i domän-klartext (L305)
>    — Marcus-kvittensen är vågens avfyrningskvitto; (iii) samlad våg
>    = EN PR med merge-commit (ej squash — SHA-bevisen) och CI grön
>    per jobb på PR + main: fix-vågens leveransform AVVIKER medvetet
>    från beslut 5:s trunk-push (fixar rör redan levererade ytor
>    under Marcus aktiva granskning; main hålls stabil tills vågen är
>    helt grön och landar atomiskt); (iv) rött-först-bevis i samma
>    körform per fix; (v) kort-kommentar per berört kort — DoD #5
>    fortsatt öppen tills omgranskning.
> 3. **Iterations-skivan — född vid triagen, beslutsgrindad
>    exekvering.** Föds OMEDELBART vid triagen (aldrig tyst, ADR-053)
>    via backlog-CLI:t som barn under familje-PRD:n: öppna
>    beslutsfrågor på kortet, DoD-arv + extra-grindar vid födseln,
>    beroenden deklarerade. `ready-for-agent` flippas FÖRST på Marcus
>    designbeslut (grillning som norm vid design-fork, enkel kvittens
>    vid liten fråga); därefter ordinarie batch-ordning — ingen
>    gräddfil (Ready-gate-/needs-triage-mönstret).
> 4. **Done-flipp-grinden per klass.** Utan anmärkning → flipp på
>    EXPLICIT kort-kvittens (generell positiv signal räcker aldrig);
>    FIX/FACIT-REVIDERING → flipp först efter mergad fix-våg + Marcus
>    omgranskning i färskt läge; ITERATION blockerar ALDRIG
>    moderkortets flipp (nytt scope är nytt kort). Flippen utförs i
>    tvåstegs-stängningens form med kvittensen som kvitto.
>
> Termerna (fix-våg · iterations-skiva · facit-revidering) har hemvist
> HÄR — EJ ORDLISTA.md (processtermer, inte produktdomän;
> T71-precedentet i beslut 2). Hub-referensrad i work-batch-skillen
> tas i S76:s hub-bunt (T78 b + T82) = ett plugin-bump-moment.
> Kanonisk samsyns-trail: `tasks/sessions/2026-07-22-session-76.md`
> Del 2.

## Kontext

T61 (AFK/Ralph-loopen, armerad S50 med designbeslutet "loopen är en yttre
iterator kring oförändrad skill") och T71 (dynamic workflows-utforskningen,
klar S60) togs till beslut i S61. Marcus mål-bild: en fullpublicerad backlogg
ska kunna drivas autonomt skiva för skiva, med Marcus som granskare av
slutresultatet. Orienterings-passet omverifierade T71:s tekniska påståenden
mot färsk Anthropic-dokumentation (100 % höll) och kartlade branschprecedent
(Copilot coding agent, Ralph-loopen, Backlog.md:s agent-riktlinjer, Anthropics
harness-vägledning, Codex/Cursor) → 8 konvergenspunkter där systemet redan
uppfyllde 6–7; luckan var hårda stop-villkor + review-yte-valet. Ralphs
frånvaro av stop-villkor har "broken codebase" som dokumenterat failure mode;
egen empiri säger att agent-omdöme i stunden är svagaste fångst-mekanismen
(~9 %). ADR-baren nås 3/3: konsent-söm-lås som många framtida körningar
bygger på · överraskande utan kontext · verklig avvägning (fyra
review-modeller, tre stop-policyer, två substrat prövades i grillningen).

## Beslut

1. **Batch-kvittot — konsent-sömmen vidgas öppet.** Marcus EXPLICITA
   batch-order (med max-kort för avfyrningen) är samma durabla konsent-klass
   som per-kort-ordern i /do-work: `ready-for-agent`-etiketten +
   batch-ordern = förhandskvittot för commit + push inom korts scope, för
   upp till max-kort kort. Skill-formen `/work-batch` bor i hubben
   (Marcus-avfyrad, `disable-model-invocation: true`) — batch-ordern blir
   därmed samma kvitto-klass som skill-invokeringen. Aldrig självinitierad.
2. **Substratvalet — orkestrerings-skript i Code-sessionen.** Loopen körs
   som deterministiskt workflow-skript: frisk do-work-subagent per kort
   (uppfyller do-work:s "nästa kort tas i frisk session"), kontraktets
   grindar kodade som kod (inte agent-omdöme), schema-tvingad statusretur
   per kort, orkestratorns OBEROENDE disk-verifiering, Code kvar som
   live-följbar/avbrytbar orkestrerare. do-work-skillen är loop-kroppen och
   förblir OFÖRÄNDRAD (S50 beslut 7 realiserat). Begreppet
   **orkestrerings-skript** får hemvist SYSTEMET.md §0 — inte ORDLISTA.md,
   som är produktdomän (T71:s begreppskrock-lösning).
3. **Granskningsfärdig-läget (review-modellen).** Skiva med mänsklig
   DoD-grind (design-review) drivs till kod + mekanisk facit-avprickning +
   CI grön per jobb + AC bockade; människo-grinden lämnas ÖPPEN, kortet
   står `In Progress` med not — **Done-flippen är Marcus.** Icke-UI-skivor
   drivs hela vägen till Done. Beroende-kedjor exekveras i
   **granskningsvågor**: en design-miss propagerar aldrig förbi sin våg.
4. **Halt-first + hårda gränser (stop-policyn).** Batchen stannar vid
   FÖRSTA STOPPA-/abort-utfall (kortet återställs To Do med avbrotts-not
   per do-work:s abort-väg; batch-rapporten pekar ut det). Hårda gränser:
   max-kort per avfyrning (Marcus sätter; default lågt ~3) · aldrig samma
   kort två gånger i samma batch · valfritt token-budget-tak · kill-switch;
   omstart idempotent via backlog-tillståndet. Inget tids-tak (klockan är
   avstängd i orkestrerings-skript by design; kort-tak + budget är de
   ärliga spakarna). Stop-villkor ska vara hårda externa gränser, aldrig
   agent-omdöme (branschkonvergenspunkten).
5. **Trunk-push per skiva bevaras + omprövningströskel.** Batchen pushar
   `main` per kort som interaktiva do-work (DoD oförändrad; revert är
   etablerad väg). Durabel omprövningströskel: när appen går i skarp
   Lotta-drift ELLER batchar växer förbi ~5 kort tas branch/draft-PR-frågan
   upp som egen landning. Mekanik-fakta för den landningen: CI triggar inte
   på icke-main-push utan öppen PR (`on:`-blocket verifierat), och
   squash-merge river SHA-bevisen i final-summary-raderna
   (merge-commit-krav om branch-formen väljs).
6. **Headless-spåret dokumenterad framtida form.** `claude -p "/do-work"`
   är doc-verifierat fungerande och är den naturliga formen för CI-/
   cron-drift — väljs INTE nu (svagare observabilitet och rapport-struktur
   än orkestrerings-skript i session).

## Alternativ som övervägdes

- **HITL-omklassning av UI-skivor** (avvisad: tömmer batchen på UI-tunga
  PRD:er) och **design-review på QA-kortet** (avvisad: river
  per-skiva-grinden; en miss kan bygga in sig i senare skivor — omprövas
  när facit-assertions bevisat sig över några batchar).
- **Skip-and-continue** (avvisad: batch-globala problem upprepar sig) och
  **klassad hybrid** (avvisad: stopp-klassning = agent-omdöme i svagaste
  läget, 9 %-empirin). **Tids-tak** (avvisat: klockan avstängd by design).
- **Differentierad trunk/branch per kort-typ** (avvisad: komplexitet över
  golvet).
- **Headless-först** (avvisad: svagare observabilitet) och
  **skill-utan-pilot** (avvisad: bryter minimal-test-regeln; piloten kördes
  därför FÖRE skill-bygget).
- **Agent teams** (förkastade per T71: session-scoped task-lista vs vårt
  durabla substrat), **ultracode-default** (avrådd per T71),
  **parallella agenter** (T67-materia; sekventiellt är v1-beslutet).

## Konsekvenser

- `/work-batch` levereras i plugin 1.13.0 (hub-commit `3174a1e`);
  allowlist-förkravet gäller per spoke: exakta DoD-kommandon i
  `.claude/settings.json`, Marcus-kvitterad diff (precedent `71c9143`).
- do-work steg 5 omskrivet till **tvåstegs-stängningen** (T75/L263):
  leverans-commit (kod + kort-ändringar) + stängnings-commit
  (final-summary + Done) efter CI-verifiering — självreferensen är fysik;
  specen ljuger inte längre mot sin egen mekanik.
- Empirisk baslinje från S61: 3 kort autonomt levererade · first-pass-CI
  2/3 · 0 mänskliga ingripanden · 0 permission-stopp · defekter fångade av
  grindarna före/vid CI. **Ärlig gräns:** stop-vägen är aldrig triggad i
  någon batch — bevisad mekanism saknas tills första skarpa halten.
- Framtida omprövningar bokförda: branch/PR-tröskeln (beslut 5),
  parallellism (T67), headless/CI-drift (beslut 6).

## Referenser

- `tasks/sessions/2026-07-11-session-61.md` Del 2 (grillad samsyn), Del 3
  (pilot), Del 4 (batch 2) — kanonisk trail.
- Tråd-registret: T61 (AFK-loopen) · T71 (dynamic workflows) · T75
  (tvåstegs-stängningen).
- Hub: `plugins/marcus-system/skills/work-batch/SKILL.md` (proceduren) +
  `SYSTEMET.md` §0/§5/§7 · lessons K61.1–K61.4 (spoke L263–L266).
