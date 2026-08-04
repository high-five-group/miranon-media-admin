---
owner: marcus803
updated: 2026-08-04
review_by: 2027-02-04
status: stable
---

# Hur mekaniserar branschledare 2026 operativa processregler — och vad är tillämpligt på vår Claude Code-orkestrering? (Code, 2026-08-04)

> **Proveniens:** avgränsat research-pass beställt direkt av orkestreraren
> 2026-08-04, grundat i en färsk (ej committad) intern inventering av detta
> repo som fann ett entydigt mönster: regler med verklig mekanism (GitHub
> ruleset, CI-grindar, hooks, git pre-commit) efterlevs; regler i ren prosa
> (ADR-090 katalogägarskap, session-resume-procedursteg, kommandohygien-
> lessons) bryts upprepat av färska kontexter. Passet svarar på EN fråga:
> vilka branschmönster mekaniserar processregler i stället för att förlita
> sig på prosa, och vilka av dem passar en Claude Code-orkestrering med
> subagenter?
>
> **Återanvänd forskning:** detta repo har redan ett skarpt, primärkälle-
> grundat pass på en angränsande delfråga —
> [`obevakade-tillstand-vaktens-form-2026-07-30.md`](obevakade-tillstand-vaktens-form-2026-07-30.md)
> (T108/ADR-087) — som täcker Kubernetes level/edge-triggering, Flux,
> GitHub-/Stripe-webhook-doktrin, Temporal och AWS Step Functions i detalj
> och med sex egna mätningar mot Claude Code v2.1.220. Det passet återges
> INTE här i sin helhet; det citeras och byggs vidare på där det är
> relevant (delfråga 4), per instruktionen att återanvänd forskning som
> redan finns i repot.

## Kort svar

**Mönstret är inte "hitta EN mekanism" — det är en tre-lagers arkitektur som
varje granskad branschledare (Anthropic själva, Google, GitHub, OPA/CNCF,
Uber) bygger oberoende av varandra: (1) en exekveringspunkt som INTE går att
kringgå — en hook, en admission-kontroll, en branch-regel — som prövar
FORM/syntax billigt vid varje enskild handling, (2) en periodisk
avstämningsslinga (reconciliation/audit) som prövar SANNING/semantik mot
verkligt tillstånd, dyrare men oberoende av om exekveringspunkten
kringgicks, och (3) en explicit deklaration att allt som INTE går att pröva
mekaniskt kräver en extern verifierare — ett andra par ögon i en FRISK
kontext — eftersom både branschforskning och Anthropics egen dokumentation
säger att självgranskning är den svaga länken.**

Klasserna (a)–(d) i uppdraget mappar rent mot detta:

- **(a) katalog-/worktree-ägarskap** saknar lager 1 helt — ADR-090 är en
  ren prosa-deklaration i session-startens LÄS-fas, ingen `SessionStart`-
  eller `PreToolUse`-hook prövar den. Mekaniserbar med **Claude Codes egen
  förstapartsmekanism** (se delfråga 1).
- **(b) session-resume:s procedursteg** är samma klass — ett steg i en
  skill som bara körs om aktören faktiskt läser och följer skillen. Kräver
  antingen en hook (om ett observerbart facit finns, t.ex. en fil-
  artefakt som MÅSTE existera efter steget) eller accepteras som
  kontrakt+extern verifiering om det inte går att observera mekaniskt.
- **(c) "kör svepet vid varje väckning"** är EXAKT lager 2 (periodisk
  reconciliation) utan en TRIGGER för lager 2 — skriptet är byggt, ingen
  mekanism startar det. Etablerat branschmönster för just detta hål finns
  (delfråga 5).
- **(d) `check-lifecycle.sh` prövar form, inte sanning** — det är den
  generella "grinden kollar syntax, inte semantik"-fällan som hela
  branschen löser med en andra, dyrare kontroll (Kubernetes audit-lager,
  Gatekeepers `audit`-controller). Detta repo har redan EN korrekt
  instans av mönstret (`stop-vakt.sh`, ADR-087) — problemet är att den
  inte är generaliserad till klass (d).

## Delfråga 1 — Claude Code:s egen mekaniserings-yta (förstapart)

**Källa:** [code.claude.com/docs/en/hooks-guide](https://code.claude.com/docs/en/hooks-guide)
(hämtad 2026-08-04) och [code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)
(hämtad 2026-08-04). Ingen versionsmarkör syntes på sidorna vid hämtningen;
innehållet speglar dokumentationens tillstånd 2026-08-04.

**Den bärande meningen, ordagrant, ur `best-practices`:**

> "Unlike CLAUDE.md instructions which are advisory, hooks are deterministic
> and guarantee the action happens."

Och direkt därefter:

> "Use hooks for actions that must happen every time with zero exceptions."

Detta är Anthropics egen, explicita svar på uppdragets ramfråga: prosa
(CLAUDE.md, skills, lessons) är **rådgivande**; hooks är **deterministiska**.
`hooks-guide` säger samma sak i sin inledning:

> "Hooks are user-defined shell commands. Claude Code runs them at specific
> points in its lifecycle, which gives you deterministic control: certain
> actions always happen rather than relying on the LLM to choose to run
> them."

**Regelklasserna hooks bär, mätt mot den fullständiga händelsetabellen i
`hooks-guide`:**

| Behov | Hook-event | Vad den kan göra |
|---|---|---|
| Blockera en handling INNAN den sker | `PreToolUse` | `permissionDecision: "deny"` — och **detta gäller även i `bypassPermissions`-läge**: *"A hook that returns permissionDecision: 'deny' blocks the tool even in bypassPermissions mode... This lets you enforce policy that users can't bypass by changing their permission mode."* |
| Kräva att en handling registreras | `PostToolUse` | kan INTE ångra (verktyget har redan kört), men kan logga/formattera |
| Injicera kontext vid start/efter compaction | `SessionStart` | valfri text skrivs till stdout och läggs i Claudes kontext |
| Vägra att en tur avslutas förrän ett villkor håller | `Stop` / `SubagentStop` | exakt mekanismen detta repo redan använder i `stop-vakt.sh` (ADR-087) |
| Granska en konfigurationsändring | `ConfigChange` | kan blockera med `exit 2` eller `{"decision":"block"}` |
| En dömande bedömning, inte en deterministisk regel | `type: "prompt"` / `type: "agent"` | en Claude-modell (default Haiku för prompt-hooks) avgör `ok: true/false`; **agent-hooks kan läsa filer och köra kommandon för att verifiera mot FAKTISKT tillstånd** |

Den sista raden är den mest direkta träffen mot uppdragets delfråga 4
(form vs sanning): dokumentationen säger uttryckligen

> "Use agent hooks when you need to verify something against the actual
> state of the codebase."

— dvs Anthropic har redan en förstapartsbyggd mekanism för precis den
klass `check-lifecycle.sh` saknar (den prövar fält↔rubrik-form, aldrig om
en "pausad" session faktiskt är overksam).

**Best-practices-sidans egen verifieringsstege**, ordagrant, är också
direkt relevant för hela uppdraget — den namnger fyra nivåer i stigande
mekaniserings-grad:

> "As a deterministic gate: a Stop hook runs your check as a script and
> blocks the turn from ending until it passes... By a second opinion: a
> verification subagent or a dynamic workflow that checks its own findings
> has a fresh model try to refute the result, so the agent doing the work
> isn't the one grading it."

Och separat, sektionen **"Add an adversarial review step"**:

> "The longer Claude works unattended, the more an independent check
> matters before you count the work as done. A reviewer running in a fresh
> subagent context sees only the diff and the criteria you give it, not the
> reasoning that produced the change, so it evaluates the result on its own
> terms."

**Nyans, inte bara bekräftelse:** Anthropics egen multi-agent-forsknings-
system mekaniserar INTE allt. Enligt
[anthropic.com/engineering/multi-agent-research-system](https://www.anthropic.com/engineering/multi-agent-research-system)
(hämtad 2026-08-04) löste de resursallokering (hur många subagenter, hur
många tool-calls) genom att **"embed scaling rules in the prompts"** —
alltså prosa, inte en hook — och en separat `CitationAgent` verifierar
efteråt att citat faktiskt stämmer mot källorna. Detta är en viktig
kalibrering: **inte varje regel MÅSTE mekaniseras** — bara de där ett
observerbart facit finns och kostnaden av ett brott är hög. Resursallokering
är låg kostnad och svår att pröva mekaniskt (rätt antal subagenter beror på
frågans komplexitet); citat-korrekthet är hög kostnad (hallucinerad källa)
och mekaniskt prövbar (jämför sträng mot dokument) — därför fick bara den
en dedikerad verifierare.

## Delfråga 2 — Policy-as-code-precedent: var bor regeln?

**OPA/Conftest** ([openpolicyagent.org/docs/cicd](https://www.openpolicyagent.org/docs/cicd),
hämtad 2026-08-04): regler skrivs i Rego, en fil, och körs i CI —
*"you can run `conftest test plan.json` before every terraform apply. A
failed policy breaks the build."* Regeln bor i en fil under versionskontroll,
inte i ett confluence-dokument, och verkställs vid EXAKT den punkt där
brottet annars skulle nå produktion.

**GitHub rulesets** ([`docs.github.com`](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets),
hämtad 2026-08-04): *"multiple rulesets can apply at the same time, so you
can be confident that every rule targeting a branch in your repository will
be evaluated when someone interacts with that branch."* Och en poäng som är
lätt att missa: reglerna är **läsbara utan adminrättigheter** — *"Anyone
with read access to a repository can view the active rulesets... without
requiring admin access."* Regeln är alltså inte bara mekanisk, den är
**transparent** på samma sätt som prosan var tänkt att vara, fast den går
inte att glömma bort att läsa.

**pre-commit-ramverket** ([pre-commit.com](https://pre-commit.com/), hämtad
2026-08-04): den arkitektur detta repo redan namnger i egen `CLAUDE.md`
(`.eslintrc` + `.prettierrc` + `.markdownlintrc` + `.vale.ini`-mönstret,
Lesson #6) ÄR pre-commits eget designval — **hook-LOGIKEN är delad och
återanvändbar, hook-KONFIGURATIONEN (`.pre-commit-config.yaml`) är
per-repo.** Detta bekräftar repots redan etablerade konvention som en
korrekt instans av branschstandarden, inte en lokal uppfinning.

**CODEOWNERS** ([`docs.github.com`](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners),
hämtad 2026-08-04) är instruktivt för klass (a) i uppdraget just för att
det är en TVÅDELAD mekanism: filen i sig är bara en **deklaration**
("code owners are automatically requested for review") — den blir en
**spärr** först när branch-skyddet slår på en separat kryssruta: *"require
approval from a code owner before the author can merge."* Poängen för
ADR-090 (katalogägarskap): en deklaration ("senare startande session tar
worktreen") är strukturellt identisk med CODEOWNERS UTAN kryssrutan —
den syns, men den stoppar ingenting. En fullständig mekanisering kräver
BÅDA delarna: deklarationen (redan skriven i ADR-090) OCH en spärr som
faktiskt läser den.

**Danger/Dangerfile** ([`github.com/danger/danger-js`](https://github.com/danger/danger-js),
hämtad 2026-08-04): *"Danger runs after your CI, automating your team's
conventions surrounding code review... you can use Danger to codify your
team's norms, leaving humans to think about harder problems."* Detta är
branschens namn för exakt det uppdraget beskriver som problemet: en
konvention ("kom ihåg att uppdatera CHANGELOG", "PR:en är för stor") som
annars bara står i en PR-mall-kommentar, omvandlad till kod som körs
per PR.

**Var ska regeln bo — det gemensamma svaret från alla fyra:** så nära den
faktiska handlingen som möjligt, och ALDRIG längre bort än den yta där
brottet konkret sker. OPA/Conftest kör i CI precis före `apply`. GitHub
rulesets sitter på push/merge-gränsen. pre-commit sitter på commit-gränsen.
Danger sitter på PR-öppning. Ingen av dem bor i ett separat dokument som
en människa (eller agent) måste komma ihåg att slå upp.

## Delfråga 3 — "Vem grindar orkestreraren?"

**Google SRE-boken**, kapitlet om att eliminera toil
([sre.google/sre-book/eliminating-toil/](https://sre.google/sre-book/eliminating-toil/),
hämtad 2026-08-04), öppnar med epigrafen:

> "If a human operator needs to touch your system during normal operations,
> you have a bug." — Carla Geisser, Google SRE

Det är samma princip applicerad på en människa som CLAUDE.md redan
applicerar på en agent-orkestrerare: konstant, repetitiv mänsklig vaksamhet
("svep vid varje väckning", "kom ihåg att armera om") är per definition en
bugg i systemet, inte en dygd hos utföraren.

**SRE-bokens övervaknings-kapitel**
([sre.google/sre-book/monitoring-distributed-systems/](https://sre.google/sre-book/monitoring-distributed-systems/),
hämtad 2026-08-04) ger den kvantitativa motiveringen till varför man INTE
kan lösa detta genom att bara be en människa (eller en agent) vara mer
uppmärksam:

> "Paging a human is a quite expensive use of an employee's time... When
> pages occur too frequently, employees second-guess, skim, or even ignore
> incoming alerts, sometimes even ignoring a 'real' page that's masked by
> the noise."

**Akademisk grund för att självgranskning specifikt är svag hos LLM:er:**
Huang et al., *"Large Language Models Cannot Self-Correct Reasoning Yet"*
(arXiv:2310.01798, presenterad ICLR 2024) — peer-granskad, hämtad 2026-08-04:
studien definierar "intrinsic self-correction" (modellen rättar sig själv
utan externt facit) och finner att modeller **inte** tillförlitligt kan
göra detta. Detta är oberoende akademiskt stöd för precis det mönster
detta repos egen `CLAUDE.md` redan bokför empiriskt (§ Roll-arkitektur):
self-review ~9%, transparens-rapport ~64%, Marcus-pushback ~27%.

**Anthropics egen artikel om multi-agentsystem**
([claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them),
hämtad 2026-08-04) namnger den svagaste länken explicit:

> "The most significant failure mode for verification subagents is marking
> outputs as passing without thorough testing."

— vilket är ORDAGRANT samma fällklass som `check-lifecycle.sh` faller i:
en grind som säger "godkänt" utan att faktiskt ha prövat det påstående
grinden avser att skydda. Samma artikel ger också receptet: en
verifierare ska instrueras konkret ("run the full test suite and report
all failures"), inte vagt ("make sure it works") — annars ärver
verifieraren samma svaghet som den skulle kompensera för.

**Checklistforskning (Gawande) — sekundärkälla för anekdoten, primärkälla
för utfallet:** Boeing Model 299-historien (1935, checklista uppfanns efter
en dödsolycka orsakad av att flygplanet blev för komplext för minnet
ensamt) hittades bara via boksammanfattningssajter (t.ex. grahammann.net,
tallyfy.com) — INTE verifierad mot Gawandes bok direkt eller en
primärkälla inom passets tidsram, och märks därför som obelagd anekdot.
**Det kvantitativa utfallet DÄREMOT är primärkälle-belagt:** Haynes et al.,
*"A Surgical Safety Checklist to Reduce Morbidity and Mortality in a Global
Population"*, **New England Journal of Medicine** 2009 (doi:10.1056/NEJMsa0810119),
peer-granskad multisajt-studie: införandet av WHO:s 19-punkts kirurgi-
checklista sänkte komplikationsfrekvensen från 11,0 % till 7,0 % och
inneliggande dödlighet från 1,5 % till 0,8 % — en reduktion på ungefär en
tredjedel, **hos experter som redan visste vad de skulle göra**. Det är
den starkaste tillgängliga belägget i detta pass för att en extern,
mekanisk avstämning slår på erfarna utförares egen disciplin, inte bara
hos LLM-agenter utan hos mänskliga experter i högriskmiljö.

**Google SRE-bokens EGEN grund för incidenthantering** visade sig INTE vara
Gawande eller flyg-/medicincheck­listor — den granskade sidan
([sre.google/sre-book/managing-incidents/](https://sre.google/sre-book/managing-incidents/),
hämtad 2026-08-04) grundar sig i stället uttryckligen i **FEMA:s Incident
Command System (NIMS)**, en annan, fristående forcing-function-tradition.
Detta nyanserar en möjlig övertolkning: "checklistor fungerar" har flera
oberoende ursprung (flyg/medicin via Gawande, katastrofhantering via ICS),
inte ett enda rotursprung som sprids — vilket stärker att mönstret är
allmänt, inte en enskild skolas artefakt.

## Delfråga 4 — Form-vs-sanning: finns fler tillämpliga mönster?

Repots eget tidigare pass
([`obevakade-tillstand-vaktens-form-2026-07-30.md`](obevakade-tillstand-vaktens-form-2026-07-30.md))
fann redan fyra oberoende domäner som konvergerar på samma princip och
kallade precedent-rymden "TÄT, inte tunn": Kubernetes (*"Edge-triggered
behavior must be just an optimization"* — kubernetes/community
`controllers.md`), Flux GitOps (*"they do not make Flux 'push-based' as
the event contains no instructions, and only serves as an 'early
wake-up call'"*), betalnings-/webhook-plattformar (GitHub: *"does not
automatically redeliver failed deliveries"*; Stripe: *"doesn't guarantee
the delivery of events in the order that they're generated... use the API
to retrieve any missing objects"*), och durable execution (Temporal,
AWS Step Functions "stuck executions", LangGraph). Det passet drog också
en skarp linje: händelsen/webhooken/watch:en är **en väckarklocka, aldrig
beviset** — sanningen hämtas alltid genom att fråga auktoritativt tillstånd
på nytt.

**Detta pass kompletterar med ett direkt citat** ur Kubernetes egen
kontrollerguide
([`github.com/kubernetes/community`](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-api-machinery/controllers.md),
hämtad 2026-08-04) och Kubernetes-dokumentationens egen sida om
controller-mönstret
([kubernetes.io/docs/concepts/architecture/controller](https://kubernetes.io/docs/concepts/architecture/controller/),
hämtad 2026-08-04):

> "Level driven, not edge driven... If an API object appears with a marker
> value of true, you can't count on having seen it turn from false to
> true, only that you now observe it being true. Even an API watch suffers
> from this problem."
>
> "A controller tracks at least one Kubernetes resource type. These
> objects have a spec field that represents the desired state. The
> controller(s) for that resource are responsible for making the current
> state come closer to that desired state."

**Det nya fyndet i DETTA pass:** OPA Gatekeeper är självt byggt som ett
form/sanning-PAR, inte en enda mekanism. Enligt Gatekeepers egen
dokumentation ([`open-policy-agent.github.io/gatekeeper`](https://open-policy-agent.github.io/gatekeeper/website/docs/audit),
hämtad 2026-08-04):

> "Audit performs periodic evaluations of existing resources against
> constraints, detecting pre-existing misconfigurations." Default-intervall
> 60 sekunder.

Admission-kontrollen (lager 1, `PreToolUse`-analogen) prövar bara den
INKOMMANDE skrivningen — dvs FORM vid ETT tillfälle. `audit` (lager 2)
skannar periodiskt **allt existerande tillstånd** på nytt, oavsett hur det
kom dit — vilket är exakt vad `check-lifecycle.sh` INTE gör (den läser
fält↔rubrik-formen på en fil, aldrig om den påstådda "pausade" sessionen
faktiskt är overksam i praktiken). Gatekeepers arkitektur är alltså ett
namngivet, produktionsmässigt CNCF-mönster för precis den lucka klass (d)
pekar på: **en admission-liknande grind räcker aldrig ensam mot drift som
uppstår EFTER att grinden godkände tillståndet, eller mot tillstånd som
aldrig gick genom grinden.**

## Delfråga 5 — Statisk deny-hook vs periodisk reconciliation: när väljs vad?

**SRE-bokens beslutskriterium för när något förtjänar en OMEDELBAR,
avbrytande kontroll** (motsvarar `PreToolUse`-deny) är kostnads-drivet:

> "Does this rule detect an otherwise undetected condition that is urgent,
> actionable, and actively or imminently user-visible?"

Om svaret är nej — om ett fel inte är akut precis NU — är den mekaniska
slutsatsen i SRE-boken inte "avstå från att pröva" utan "pröva mer sällan,
periodiskt, utan att avbryta någon": exakt Gatekeepers `dryrun`/`audit`-
princip. Gatekeepers egen faspraxis (hämtad 2026-08-04) namnger en
konkret utrullningsordning: *"Deploy all new Constraints with
enforcementAction: warn first, review violations, fix workloads, then
switch to deny"* — dvs **mät kostnaden BILLIGT (periodisk, icke-blockerande)
INNAN du betalar kostnaden för en blockerande grind.**

**Repots egen redan korrekta instans av detta:** `scripts/heartbeat-svep.sh`
(beskrivet i `CLAUDE.md` § Landning, T112) är redan medvetet designat som
periodisk, level-triggered reconciliation (var ~90:e sekund, trevägs-
snapshot, "level-triggered rapporterat: varje svep tillståndet håller, inte
bara vid övergången"). Det är alltså INTE mönstret som saknas för klass
(c) — det är TRIGGERN. Ett skript som redan gör rätt sak periodiskt men som
ingen mekanism startar är strukturellt identiskt med Gatekeepers
`audit`-controller om ingen någonsin körde `gatekeeper-audit`-podden.

**Den allmänna avvägningsregeln, destillerad ur SRE-boken + Gatekeeper +
Kubernetes-källorna ovan:**

- **Deny-hook (blockera vid handlingen)** när (1) handlingen SJÄLV är den
  enda vägen till brottet, och (2) kontrollen är billig/deterministisk att
  köra vid just den handlingen. Exempel i detta repo: `PreToolUse`-vakten
  mot `gh run watch` i förgrunden (redan i `.claude/settings.json`).
- **Periodisk reconciliation/audit (upptäck + rätta senare)** när (1)
  brottet kan uppstå UTANFÖR den kontrollerade handlingen (en annan
  session, manuell filredigering, tidsdrift), eller (2) kontrollen är för
  dyr/semantisk för att betala vid varje enskild handling. Exempel:
  `heartbeat-svep.sh`, Gatekeepers `audit`.
- **Kostnaden att INTE välja är inte symmetrisk:** ett för-brett deny-hook
  ger falsklarm/friktion vid VARJE handling (SRE-bokens "alert fatigue");
  en reconciliation utan trigger ger ett osynligt hål som ser precis ut
  som "det finns redan en grind" tills någon mäter (klass c, exakt).

## Delfråga 6 — Precedent: 3+ verkliga projekt/organisationer

Precedent-rymden är **INTE tunn** för denna fråga — fem oberoende
organisationer/ekosystem hittades, med varierande källstyrka:

1. **Uber — SubmitQueue** (förstapart, redan verifierat i detta repo i ett
   tidigare pass: [`sessions-parallellitet-frontier-praxis-2026-08-02.md`](sessions-parallellitet-frontier-praxis-2026-08-02.md),
   källor `eng.uber.com`/web.archive.org + `github.com/uber/submitqueue`).
   Mätt utfall: trunk-grönhet gick från 52 % till 99 % efter att
   "vänta på din tur, verifiera före merge" mekaniserades som en kö-bot i
   stället för en konvention utvecklarna förväntades följa. Detta pass
   återanvänder den redan verifierade siffran snarare än att hämta om den.
2. **Google — mandatory code review + presubmit** (förstapart-adjacent:
   Googles egen open source-bok *Software Engineering at Google*, kapitel
   16, `abseil.io/resources/swe-book/html/ch16.html`, redan citerad i
   samma tidigare pass). Konventionen "granska varandras kod" mekaniserades
   till ett obligatoriskt, verktygsburet steg som blockerar submit.
3. **CNCF/OPA-ekosystemet — Gatekeeper** (förstapart, `openpolicyagent.org`
   och `open-policy-agent.github.io/gatekeeper`, verifierat i detta pass).
   Ett helt grundat-projekt vars existens ÄR migrationen: Kubernetes-
   klusteradmins gick från policydokument ("namnge inte poddar såhär",
   "kräv resource limits") till en admission-webhook + audit-controller
   som är CNCF-graduerad och används brett i produktion.
4. **GitHub — CODEOWNERS + rulesets + merge queue** (förstapart,
   `docs.github.com`, verifierat i detta pass). GitHub dogfooder sitt eget
   mönster: produkten ÄR mekaniseringen av "be rätt person granska" och
   "vänta på din tur att landa" som annars levde i README-konventioner.
5. **Netflix — Chaos Monkey/Simian Army** — **SEKUNDÄRKÄLLA ENDAST i detta
   pass.** Netflix eget tech-blogginlägg (`netflixtechblog.com`) gick inte
   att hämta (Medium-omdirigering blockerad, `web.archive.org` ej
   åtkomlig för verktyget denna körning). Fyndet — att Netflix byggde ett
   automatiskt verktyg som TVINGAR fram resiliens i stället för att lita
   på att ingenjörer följer en best-practice-guide, efter 2008 års
   driftstopp — vilar här enbart på tredjepartsaggregerande artiklar
   (Medium, systemdesign-nyhetsbrev). Räknas som svagt belagt exempel,
   inte som ett av de tre bärande.

**Dom för delfråga 6:** minst FYRA av de fem är förstaparts- eller
repo-redan-verifierade källor, vilket överstiger 3-projekts-baren tydligt.
Netflix-exemplet behålls i listan för fullständighet men är explicit
nedgraderat till obelagt i detta pass — det ska INTE citeras som lika starkt
som de fyra andra.

## Dom

**Tre-lagers-arkitekturen är branschstandard 2026, inte ett lokalt påfund:**
(1) en icke-kringgåbar exekveringspunkt vid själva handlingen (hook,
admission-kontroll, branch-regel) som prövar det som är billigt att pröva
DÄR, (2) en periodisk reconciliation/audit som prövar sanning mot verkligt
tillstånd oberoende av om lager 1 kringgicks eller aldrig fanns, och (3) en
uttalad gräns för vad som INTE kan mekaniseras — där kontraktet blir
"extern verifierare i fresh kontext", inte "hoppas att aktören läser
prosan". Anthropic dokumenterar alla tre lagren för Claude Code specifikt
(hooks, agent-hooks, adversarial review-mönstret), vilket gör detta den
mest direkt tillämpliga första-parts-vägledningen som finns för just detta
repos problem.

**Klasserna (a)–(d) har alla en känd, namngiven bransch-motsvarighet:**

- (a) katalog-/worktree-ägarskap → CODEOWNERS-mönstret (deklaration +
  separat spärr-kryssruta) → mekaniserbart med en `SessionStart`- eller
  `PreToolUse`-hook som läser samma tre signaler ADR-090 redan namnger.
- (b) session-resume:s procedursteg → mekaniserbart ENDAST om steget har
  ett observerbart facit (en fil som måste finnas/vara uppdaterad efteråt);
  annars adversarial-review-mönstret (en fresh-kontext-verifierare
  kontrollerar att resume-flödet faktiskt kördes).
- (c) "kör svepet vid varje väckning" → Gatekeeper-audit-mönstret finns
  redan i repot som skript; saknar bara triggerns motsvarighet till
  Gatekeepers egen schemalagda audit-controller-pod.
- (d) `check-lifecycle.sh` prövar form, inte sanning → Gatekeepers
  admission/audit-par + detta repos EGEN `stop-vakt.sh` (ADR-087) är
  redan bevis på att mönstret fungerar HÄR; det saknas bara generalisering
  till lifecycle-klassen.

## Vad jag inte kunde belägga

- **Gawande-anekdoten (Boeing Model 299, 1935)** hittades bara via
  boksammanfattningssajter (grahammann.net, tallyfy.com m.fl.) — INTE
  verifierad mot Gawandes bok eller en primärkälla inom passets tidsram.
  Det kvantitativa utfallet (Haynes et al., NEJM 2009) ÄR däremot
  primärkälle-belagt och används i stället som det bärande beviset.
- **Netflix Chaos Monkey/Simian Army** (delfråga 6, punkt 5) kunde inte
  verifieras mot Netflix egen tech-blogg inom passets tidsram —
  `netflixtechblog.com` omdirigerar via Medium på ett sätt verktyget inte
  kunde följa, och `web.archive.org` var inte åtkomligt för
  hämtningsverktyget i denna körning. Fyndet vilar enbart på
  tredjepartsartiklar och räknas INTE som ett av de bärande
  precedent-projekten.
- **OPAs egen dokumentation gav INGET explicit citat** för "policy ska bo
  i kod, inte dokumentation" trots att det är produktens hela premiss —
  sidan som granskades (`openpolicyagent.org/docs/cicd`) beskriver VAD OPA
  gör, inte en uttalad motivering för VARFÖR. Slutsatsen om "regeln ska bo
  nära brottspunkten" är därför **härledd** ur var de fyra granskade
  verktygen FAKTISKT placerar sin exekvering (CI-steg, push-gräns,
  commit-gräns, PR-öppning) — inte ett direkt citerat designprincip-uttalande
  från OPA själva.
- **Ingen mätning gjordes** i detta pass av hur klasserna (a)–(d) specifikt
  skulle bete sig om de mekaniserades enligt rekommendationen nedan (t.ex.
  hur ofta en `SessionStart`-hook för ADR-090 faktiskt skulle träffa en
  verklig parallellsession). Detta är ett dokumentations-/precedentpass,
  inte en implementations- eller mätpass — nästa steg vore att bygga och
  mäta, per samma disciplin som `obevakade-tillstand-vaktens-form-2026-07-30.md`
  redan gjorde för ADR-087.
- **Session-resume:s procedursteg (klass b) specifikt** undersöktes inte
  mot ett konkret, namngivet observerbart facit i detta pass — uppdraget
  bad om branschmönster, inte en skarp lösning för just det skillet. Om
  en mekanisering ska designas för klass (b) krävs ett eget, smalare pass
  som identifierar VILKET facit steget faktiskt lämnar efter sig (en
  uppdaterad fil? en specifik loggrad?) innan en hook kan skrivas mot det.

## Rekommendation

Detta är en rekommendation, inte ett beslut — Marcus/en grillning äger
valet om och hur klasserna (a)–(d) faktiskt mekaniseras.

1. **Klass (a) — katalog-/worktree-ägarskap:** skriv en `SessionStart`-hook
   (matcher `startup|resume`) som läser exakt de tre signaler ADR-090 redan
   namnger (annat sessionsdoks `lifecycle: active`, `git worktree list`,
   smutsigt huvudträd/främmande gren) och skriver träffen som
   `additionalContext` in i sessionens start — dvs samma detektion som
   redan är BESLUTAD i ADR-090, bara flyttad från "något Code kommer ihåg
   att göra i LÄS-fasen" till "något harnesset gör åt Code". Detta är
   CODEOWNERS-mönstret: deklarationen finns redan (ADR-090), det som
   saknas är kryssrutan.
2. **Klass (c) — heartbeat-svepets trigger:** detta är den mest
   directa Gatekeeper-audit-parallellen av de fyra. Undersök om
   `SessionStart`/`Notification`(`agent_completed`)-hooken kan starta
   svepet som en bakgrundsprocess, ELLER acceptera en enklare lösning:
   en `cron`/`launchd`-jobb utanför Claude Code helt (samma väg som
   Gatekeepers audit-controller är en egen, alltid körande pod — inte
   något som triggas av en enskild `kubectl`-handling). Det senare kräver
   ingen Claude Code-hook alls och är därför den enklaste vägen till
   samma garanti.
3. **Klass (d) — generalisera form/sanning-paret:** `stop-vakt.sh` är
   redan ett korrekt exempel på ett SANNINGS-prövande, fail-closed
   `Stop`/`SubagentStop`-hook (ADR-087). `check-lifecycle.sh` är ett
   FORM-prövande CI-skript. Dessa två hör ihop som Gatekeepers
   admission+audit-par, men är inte namngivna som ett par idag. En
   framtida `check-lifecycle.sh`-utökning som (likt `type: "agent"`-hooks)
   FAKTISKT undersöker om en "pausad" session har färska commits/ändrad
   arbetskatalog efter paus-tidsstämpeln vore den semantiska motsvarigheten
   — men det kräver ett eget avgränsat pass för att specificera VAD
   "arbetar fortfarande" mekaniskt betyder (jfr § Vad jag inte kunde
   belägga för klass b, samma typ av lucka).
4. **Klass (b) — session-resume:s procedursteg:** mekanisera INTE blint.
   Identifiera FÖRST om steget lämnar ett observerbart facit. Om ja: en
   `Stop`-hook efter resume-flödet som kontrollerar facitet (samma form
   som ADR-087). Om nej: acceptera explicit att detta är kontrakt +
   extern verifiering (adversarial-review-mönstret, Anthropics egen
   rekommendation) — inte ett hål att skämmas över, utan en medveten gräns
   för vad mekanisering kan nå.
5. **Generellt:** vid varje framtida "regel ska efterlevas"-beslut, ställ
   Anthropics egen fråga explicit innan ni väljer form: *är detta en
   handling som går att blockera BILLIGT vid källan (hook), eller ett
   tillstånd som kan drifta UTANFÖR någon enskild handling (reconciliation)?*
   Svaret avgör vilket av de två lagren som behövs — ofta båda, aldrig
   "vänta att prosan räcker" när kostnaden av ett brott är hög.

## Källförteckning

**Förstapartskällor (leverantör/organisation, primär, hämtade 2026-08-04
om inget annat anges):**

- [code.claude.com/docs/en/hooks-guide](https://code.claude.com/docs/en/hooks-guide) — Claude Code-dokumentation, "Automate actions with hooks"
- [code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices) — Claude Code-dokumentation, "Best practices for Claude Code"
- [anthropic.com/engineering/multi-agent-research-system](https://www.anthropic.com/engineering/multi-agent-research-system) — Anthropic Engineering, "How we built our multi-agent research system"
- [claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them) — Anthropic/Claude blogg, verifieringssubagent-mönster
- [openpolicyagent.org/docs/cicd](https://www.openpolicyagent.org/docs/cicd) — Open Policy Agent, officiell dokumentation
- [`open-policy-agent.github.io/gatekeeper/website/docs/audit`](https://open-policy-agent.github.io/gatekeeper/website/docs/audit) — Gatekeeper (CNCF), officiell dokumentation, audit-controller
- [`docs.github.com — about rulesets`](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) — GitHub, officiell dokumentation
- [`docs.github.com — about CODEOWNERS`](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) — GitHub, officiell dokumentation
- [pre-commit.com](https://pre-commit.com/) — pre-commit-ramverkets officiella sajt
- [`github.com/danger/danger-js`](https://github.com/danger/danger-js) — Dangers officiella README
- [kubernetes.io/docs/concepts/architecture/controller](https://kubernetes.io/docs/concepts/architecture/controller/) — Kubernetes officiell dokumentation, controller-mönstret
- [`github.com/kubernetes/community — controllers.md`](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-api-machinery/controllers.md) — Kubernetes SIG API Machinery, officiell utvecklarguide
- [sre.google/sre-book/eliminating-toil](https://sre.google/sre-book/eliminating-toil/) — Google, *Site Reliability Engineering* (officiell webbversion)
- [sre.google/sre-book/monitoring-distributed-systems](https://sre.google/sre-book/monitoring-distributed-systems/) — Google, *Site Reliability Engineering*
- [sre.google/sre-book/managing-incidents](https://sre.google/sre-book/managing-incidents/) — Google, *Site Reliability Engineering*
- Haynes, A.B. et al., *"A Surgical Safety Checklist to Reduce Morbidity and Mortality in a Global Population"*, **New England Journal of Medicine** 2009;360:491-499, doi:10.1056/NEJMsa0810119 — peer-granskad primärstudie
- Huang, J. et al., *"Large Language Models Cannot Self-Correct Reasoning Yet"*, arXiv:2310.01798 (ICLR 2024) — peer-granskad akademisk källa

**Repo-internt, redan verifierat (återanvänt per instruktion, ej omhämtat):**

- [`docs/research/obevakade-tillstand-vaktens-form-2026-07-30.md`](obevakade-tillstand-vaktens-form-2026-07-30.md) — T108/ADR-087, Kubernetes/Flux/GitHub/Stripe/Temporal/AWS-precedent
- [`docs/research/sessions-parallellitet-frontier-praxis-2026-08-02.md`](sessions-parallellitet-frontier-praxis-2026-08-02.md) — Uber SubmitQueue + Google-precedent (52 %→99 %)
- [`docs/decisions/ADR-087-stop-vakten-avslutspastaende-mot-observerat-tillstand.md`](../decisions/ADR-087-stop-vakten-avslutspastaende-mot-observerat-tillstand.md)
- [`docs/decisions/ADR-090-sessions-parallellitet-detektera-och-fraga.md`](../decisions/ADR-090-sessions-parallellitet-detektera-och-fraga.md)
- [`scripts/stop-vakt.sh`](../../scripts/stop-vakt.sh), [`scripts/check-lifecycle.sh`](../../scripts/check-lifecycle.sh), [`scripts/heartbeat-svep.sh`](../../scripts/heartbeat-svep.sh)
- [`.claude/settings.json`](../../.claude/settings.json)
- [`CLAUDE.md`](../../CLAUDE.md) § Roll-arkitektur (self-review ~9 %, transparens-rapport ~64 %, Marcus-pushback ~27 %), § Landning (heartbeat-svep, T112)

**Tredjepartskällor (sekundär, explicit nedgraderade i texten):**

- Boksammanfattningssajter om Gawandes *The Checklist Manifesto* (grahammann.net, tallyfy.com m.fl.) — anekdoten obelagd mot primärkälla, se § Vad jag inte kunde belägga
- Medium/systemdesign-aggregatorer om Netflix Chaos Monkey/Simian Army — se § Vad jag inte kunde belägga och delfråga 6 punkt 5
