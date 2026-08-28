# ADR-089: Modell- och effort-policy per processteg — orchestrator-worker-tieringen

- Status: Accepted (Marcus GO 2026-08-02, grillad samsyn 7/7)
- Datum: 2026-08-02
- Fas: Meta (agent-/orkestreringsinfrastruktur)

> **Om beslutsvägen — bokförd öppet.** `S94` utredde frågan i sex ordnade steg
> (`tasks/sessions/archive/2026-08/2026-08-02-session-94.md` Del 1–3): två research-pass mot
> primärkällor (Anthropics förstapartslinje +
> [`modell-tiering-anthropic-2026-08-02.md`](../research/modell-tiering-anthropic-2026-08-02.md);
> frontier-branschpraxis +
> [`modell-tiering-frontier-praxis-2026-08-02.md`](../research/modell-tiering-frontier-praxis-2026-08-02.md)),
> `T113`:s första Sonnet-mätpunkt
> ([`uppdragsrevision-korning-3-2026-08-02.md`](../research/uppdragsrevision-korning-3-2026-08-02.md)),
> ett tio-rads processteg×modell×effort-underlag
> ([`modell-policy-underlag-2026-08-02.md`](../research/modell-policy-underlag-2026-08-02.md))
> och därefter `/grill-me` till explicit samsyn — sju frågor, sju
> Marcus-kvittenser, samma dag (Del 3). Formvalet (ADR i spoken +
> frontmatter-värden, i stället för enbart en SYSTEMET-sektion) gjordes under
> grillningen (Del 3 punkt 7) och ADR-bar-prövas nedan. Noteras av samma skäl
> som i [ADR-086](ADR-086-uppdragets-premisser-provas-av-mottagaren.md)–
> [ADR-088](ADR-088-sessionsdok-single-writer-leveransvag.md): en läsare ska
> kunna se vem som vägde, inte bara vad som beslutades.

## Kontext

`T110` (orkestrerarens felklasser) och `T113` (Sonnet-subagent-mätuppföljningen)
hade ackumulerat en fråga ingen av dem kunde svara på ensam: **är
modellvalet per agent-yta ett grillat beslut eller vana?** PR #557
(2026-08-01, Marcus GO) satte `model: sonnet` i `.claude/agents/bygg-agent.md`
och `research-pass.md`, men grunden var punktinsatsen efter en enskild
mätning — inte en genomtänkt policy för HELA agent-/skill-landskapet
(orkestrering, HITL-grillning, implementation, research, sökning, planering,
felsökning, arkitektur-audit).

Marcus öppning (S94 Del 1): modellvalet ska hänga på **processteget**, inte på
vana — Sonnet för genomförande, Opus för arkitektur/svår felsökning, Fable för
orkestrering — som en hypotes att pröva mot källor, inte ett förutbestämt
facit. Utredningen tog terrängen från spridda trådfynd (`T110`–`T113`, `T67`,
`T71`) till en källbelagd, mätgrundad och grillad policy.

**Vad research-passen faktiskt fann** (sammanfattat; full argumentation i
respektive fil):

- **Anthropics egen linje är svårighets-baserad, inte roll-baserad.**
  Multi-agent-forskningssystemet (2025-06) körde Opus 4 som lead + Sonnet 4
  som subagenter och slog en enskild Opus 4 med **+90,2 %** — men artikeln
  själv förklarar vinsten med token-spridning över isolerade kontextfönster,
  inte med att lead-agenten var starkast. Anthropics eget Agent SDK-exempel
  (`model="opus" if is_strict else "sonnet"`) sätter uttryckligen en
  STARKARE modell på en hög-insats-SUBAGENT (säkerhetsgranskning) än på
  orkestreraren — motsatsen till en ren rollregel. Slutsats (dom, delfråga 5):
  "starkaste modellen orkestrerar" är Anthropics egen referens-precedens och
  en strukturell default för de INBYGGDA agenterna (Explore/Plan/
  general-purpose ärver och Explore capas sedan v2.1.198), men INTE en
  uttalad generell regel.
- **Frontier-branschen kör statisk per-roll-mappning som DOMINERANDE form.**
  Sex namngivna produkter (Cognition/Devin Fusion, Sourcegraph Amp,
  Factory.ai/Droid, Aider, Cursor, GitHub Copilot) plus två ramverk (OpenAI
  Agents SDK, CrewAI) mappar modellstyrka mot processteg. OpenAI Agents
  SDK:s triage-exempel sätter uttryckligen en STARKARE modell på
  orkestrerings-/handoff-agenten — matchande att fel i orkestreringssteget är
  dyrast att återhämta. En tredjepartskälla (Augment Code) dömer statisk
  mappning som den dokumenterat dominerande formen i produktion i dag; det
  repot redan gör (frontier-orkestrerare + `model: sonnet`-subagenter) är
  strukturellt samma mönster.
- **Frontmatter-modell är en mekanism med dokumenterad historik av att gå
  sönder.** Minst åtta separata GitHub-issues (#44385, #18346, #68392,
  #47488, #5456, #10993, #19174, #34821, 2026-01→07) beskriver att en
  subagents deklarerade `model:` tyst ignoreras. Motmedlet är ett billigt
  sanity-check: agenten rapporterar sin egen modell-identitet.
- **Eskalationströsklar är etablerat mönster men tunt konkretiserat.**
  CodeRescue (arxiv 2607.19338) mäter att en budget-kalibrerad
  eskalationsrouter löser FLER fall (71,7 %) till 35 % av kostnaden av
  "alltid eskalera" (68,6 % till full kostnad) — naiv alltid-eskalera är
  alltså strikt sämre, inte bara dyrare. Ingen frontier-leverantör publicerar
  sitt exakta tröskeltal; "2 identiska fällningar" har en enda
  tredjepartskälla (Requesty).

### ADR-bar-prövningen — alla tre villkor håller

1. **Svårt att återställa i koherens:** policyn spänner över
   agent-frontmatter, thread-bokföring (`T113`), orkestrerarens läsdisciplin
   och hubbens skill-texter. Ett odokumenterat modellval driver isär över tid
   — exakt det PR #557 löste punktvis men inte principiellt.
2. **Överraskande utan kontext:** att RIVA ett 2026-08-01-beslut (hårdkodad
   Fable-eskalering) samma vecka det fattades är kontraintuitivt utan
   Marcus-input + Anthropic-linjen bakom. Att en subagent kan ges en
   STARKARE modell än orkestreraren (Anthropics eget SDK-exempel) är
   likaså kontraintuitivt mot en naiv "orkestreraren är alltid starkast".
3. **Verklig avvägning:** options-rymden kartlades i två research-pass —
   svårighets-baserad dynamisk klassificerare kontra statisk per-roll-
   mappning kontra roll-absolut utan avvikelse — och grillades punkt för
   punkt till 7/7 samsyn (Del 3).

## Beslut

### 1. Skelettet — statisk default per roll, med rätt till medveten avvikelse

**Haiku = hitta · Sonnet = utföra · Opus = avgöra/felsöka · Fable =
orkestrera**, som STATISK DEFAULT per roll — inte en klassificerare, inte en
roll-absolut regel utan undantag. Rätten till **medveten, bokförd
per-uppdrag-avvikelse** är inbyggd i skelettet självt: avvikelsen ska synas i
uppdragstexten (samma öppenhetskrav som `ADR-086`:s källkrav). Skelettet är en
syntes, inte ett val av den ena källan över den andra: Anthropics egen
svårighets-baserade linje (Opus-lead+Sonnet-sub är fallstudie-precedens, INTE
en uttalad regel) + den frontier-dominanta statiska per-roll-mappningen. Ett
roll-absolut skelett UTAN avvikelserätt hade brutit mot Anthropics egen
SDK-vägledning (hög-insats-subagent kan motivera starkare modell än
orkestreraren); ett rent klassificerar-baserat skelett hade byggt
infrastruktur utan belagd avkastning på denna skala (dubbelriktad
över-engineering-vakt, `frontier-praxis` § Rekommendation punkt 4).

### 2. Roll-tabell

| Roll/yta | Bärare | Modell@effort | Not |
|---|---|---|---|
| Orkestrering, samordning, landnings-svep, grillning/design-samsyn (HITL) | huvudloop (output-style + session-start/resume) | **Fable@xhigh** · kvot-fallback **Opus@xhigh** | HITL-stegen är orkestrerarens egen yta (`T71`: kan ej delegeras) |
| Implementation mot spec (`do-work`/`work-batch` → bygg-agent) | `.claude/agents/bygg-agent.md` | **Sonnet@xhigh** | effort EXPLICIT, se beslut 4 |
| Research-pass | `.claude/agents/research-pass.md` | **Sonnet@xhigh** | effort EXPLICIT men ej separat grillad, se beslut 4 |
| Sök/lokalisera (Explore-klass) | harness-default | **Haiku** per anrop | routing-regeln, beslut 3 |
| Plan / general-purpose / claude-code-guide | harness-default | **Sonnet** per anrop | Opus vid MEDVETEN avvikelse |
| Svår felsökning / arkitektur-audit | skill i huvudloop i dag | **Opus@xhigh** (framtida agent-form) | Marcus tiering-hypotes; ej byggd i denna landning |

### 3. Routing-regeln — ordagrant

> Haiku-Explore endast när svaret är en adress, inte en tolkning; blir
> agentens omdöme del av leveransen → minst Sonnet; vid tvekan: uppåt.

**Kostnadsoptimering får aldrig äta kvalitetsgolvet.** Regeln skärptes under
grillningen (Del 3 punkt 4) på Marcus egen invändning ("utforska och
föreslå") — en Explore-liknande sökning som i praktiken kräver ett omdöme om
VILKEN adress som är rätt, inte bara VAR den ligger, är redan över Haiku-
tröskeln.

### 4. Effort — explicit slår tyst arv

`.claude/agents/bygg-agent.md` och `.claude/agents/research-pass.md` får
`effort: xhigh` **explicit** i frontmatter. Nivån **BEHÅLLS** — den ändras
inte, den blir bara synlig: disk-läsningen (`modell-policy-underlag` § Verifierad
mekanik) visar att agenterna redan idag kör `xhigh` via det globala
`effortLevel: "xhigh"` (satt S60) och ett UTELÄMNAT `effort`-fält (default =
ärvt från sessionen). Ett tyst arv är exakt den mekanismklass PR #557 löste
punktvis för `model` men inte för `effort` — pre-#557-läxan appliceras
symmetriskt. All egen evidens är dessutom mätt PÅ xhigh (`T113` mätpunkt 1–3),
och Anthropics egen modell-/effort-guide rekommenderar högre effort för
"coding/agentic"-uppgifter. **Ett nivåbyte kräver mätning** — se mätkortet
under § Verkställande.

**Notera öppet:** research-pass-värdet följer samma princip som
bygg-agentens (explicit + oförändrat tills mätt) men var INTE ett separat
grillat val — grillningen (Del 3 punkt 2) tog uttryckligen bara ställning
till bygg-agentens effort. Research-pass-raden i tabellen ovan ärver
principen, inte ett eget Marcus-kvitterat beslut.

### 5. Eskalering — 2× fälld → Opus som default

**River öppet** 2026-08-01-beslutet ("fäller en skiva två gånger → respawn
med `model: fable`", bokfört `T113` § Eskalationsregel). Ny regel: **fäller en
skiva två gånger → respawn på Opus som DEFAULT**; orkestreraren får välja
Fable direkt när felbilden själv är Fable-klassad (t.ex. kräver den typ av
tvärgående syntes eller extern-prövnings-omdöme ingen annan modell hittills
visat) — det valet bokförs i uppdraget, inte tyst. `TASK-115`-klassens
transienter (G0-retry-instanserna) utesluts före räkning, precis som
tidigare.

**Skälet till rivningen:** Marcus-input 2026-08-02 (hårdkoda inte Fable; Opus
är giltig OCH obligatorisk fallback vid Fable-kvottak) + Anthropics egen
svårighets-baserade linje (modell-/effort-bloggens regel: *"If Claude has all
the pertinent context and clearly tried and still got it wrong, that's a
signal to pick a larger model"* — en signal om STYRKA, inte om en specifik
namngiven modell).

**Deklarerat öppet:** talet "2 fällningar" är valt för enkelhet, INTE
branschbelagt som optimum. CodeRescue (arxiv 2607.19338) visar att en
budget-kalibrerad trigger (71,7 % lösningsgrad, 35 % av kostnaden) slår en
naiv alltid-eskalera-policy (68,6 %, full kostnad) — formen "eskalera vid
upprepad fällning" är forskningsstödd, men exakt talet 2 vilar på en enda
mindre tredjepartskälla (Requesty), inte på en frontier-leverantörs
publicerade tröskel. Ingen av de tre stora namnen i frontier-praxis-passet
(Cognition, Factory, GitHub Copilot) publicerar sitt eget tröskeltal.

### 6. Läsdisciplin (orkestreraren)

**"Läs själv för att BESLUTA och GRANSKA; delegera för att PRODUCERA."**
Tillståndsytor (git/gh-status, PR-diffar, agenters slutrapporter inför
armering) och granskningsmoment läses av orkestreraren personligen;
bulk-läsning, research och transcript-analys delegeras. Den exakta HUR-texten
(vilka ytor, i vilket steg) bor i hub-skillsen (`session-start`/`session-resume`)
och i output-stylen — denna ADR bär beslutet, inte hemvistets prosa.

### 7. Sanity-check — agenter rapporterar egen modell-identitet

Motmedel mot frontmatter-ignorerings-bugklassen (≥8 GitHub-issues,
`modell-tiering-anthropic-2026-08-02.md` § Dom + källförteckning). Både
`bygg-agent.md` och `research-pass.md` får en explicit rad i § Rapportera:
agenten skriver sin faktiska modell-identitet (ur egen systemprompt/
transcript) i slutrapporten, med en mening om varför.

### 8. Hemvist

`SYSTEMET.md` (hub) bär mekanik-kartan med pekare hit; **bärarna** — agent-
frontmatter, skill-texter — bär de faktiska värdena. Två spoke-ADR:er (denna +
`ADR-090`) i stället för enbart en SYSTEMET-sektion: ADR-bar-prövningen (ovan)
håller för båda, och ett beslut som spänner flera repo-lager (frontmatter +
thread-bokföring + framtida hub-skill) förtjänar sitt eget permanenta spår i
spoken där verkställandet faktiskt sker.

## Vad som inte byggs — durabelt, så det inte återföreslås

- **Dynamisk klassificerar-routing** (en modell som routar andra modeller
  per uppgift): förkastad NU. Statisk per-roll-mappning är den dokumenterat
  DOMINERANDE formen i produktion (`frontier-praxis` § Dom + § Rekommendation
  punkt 4); en klassificerare kräver egen infrastruktur (träningsdata eller
  tredjeparts-router) utan belagd avkastning på denna skala. Matchar
  dubbelriktad över-engineering-vakt.
- **Roll-absolut mappning utan avvikelserätt:** förkastad. Anthropics eget
  SDK-exempel visar att en enskild subagent med genuint hög insats kan
  motivera en STARKARE modell än orkestrerarens egen — en policy utan
  ventil för det fallet motsäger den egna källan policyn bygger på.
- **Hårdkodad Fable-eskalering** (2026-08-01-beslutet): riven, se beslut 5.
- **Effektpåståenden om effort-bytet (xhigh → high) utan mätning:** förbjudna
  tills mätkortet (§ Verkställande) gett en jämförelsevåg. Detta är samma
  disciplin som `ADR-086` kräver av `T113`s effektpåståenden — n=1 räcker
  aldrig.

## Precedenter

- **Anthropic, multi-agent research-system (2025-06):** Opus 4 lead + Sonnet
  4 subagenter, +90,2 % mot enskild Opus 4 — fallstudie, inte regel
  (`modell-tiering-anthropic-2026-08-02.md` delfråga 1).
- **Anthropic Agent SDK, dynamiskt agent-exempel:** `model="opus" if
  is_strict else "sonnet"` — svårighets-/insats-driven, inte rolldriven
  (samma fil, delfråga 4).
- **OpenAI Agents SDK, triage-exemplet:** starkare modell på
  orkestrerings-/handoff-agenten, lättare modeller på worker-agenterna
  (`modell-tiering-frontier-praxis-2026-08-02.md` delfråga 1).
- **Cognition/Devin Fusion:** frontier-agent + billigare "sidekick" med
  mid-session-eskalering vid "struggle"; 35 % kostnadsreduktion, 88 % av
  interna PR:er automatiskt routade (samma fil).
- **Factory.ai/Droid — Factory Router:** eskalerar explicit "if the selected
  model struggles"; 99 % pass rate till 20 % lägre kostnad än Opus 4.7 på
  Terminal-Bench 2 (samma fil).
- **CodeRescue** (arxiv 2607.19338): budget-kalibrerad eskalationsrouter
  71,7 % lösningsgrad / 35 % kostnad mot alltid-eskalera 68,6 % / full
  kostnad — formen "eskalera vid fällning" beläggs akademiskt, exakt
  tröskeltal gör det inte.

Precedent-rymden för EXAKT frågan "orkestrerare-kontra-subagent-modell" är
tunn och deklareras tunn (en Anthropic-fallstudie + tre tredjepartsbloggar som
återger samma ursprungsmönster,
`modell-tiering-anthropic-2026-08-02.md` § Vad jag inte kunde belägga). För
"modell-tiering per processteg" i stort är rymden bred (sex produkter + två
ramverk + akademisk cascade-linje).

## Konsekvenser

- Två agentdefinitioner (`bygg-agent.md`, `research-pass.md`) får ett
  explicit `effort: xhigh`-fält — noll beteendeförändring i sig (nivån var
  redan xhigh via tyst arv), men framtida drift i det globala
  `effortLevel`-settinget kan inte längre tyst sänka dessa två agenters
  effort utan att någon ser en avvikelse mot en skriven default.
- `T113` § Eskalationsregel amenderas (riven öppet, ny Opus-default-regel);
  trådens `paused`-lifecycle och väntevillkor (n≥2 Sonnet-mätning) är
  ORÖRDA av denna ADR.
- Ett mätkort öppnas för effort-jämförelsen (xhigh mot high) — nivåbyte sker
  ENDAST på Marcus-beslut över den datan, aldrig på denna ADR:s ord ensamt.
- Sanity-check-raden lägger en rad text i två agentdefinitioners
  slutrapport-kontrakt — ingen ny mekanism, ingen ny grind.
- Orkestrerarens läsdisciplin (beslut 6) formuleras operativt i hub-skillsen
  i en SEPARAT hub-landning; denna ADR gör inget hub-arbete självt.

## Relaterat

`T110` (orkestrerarens felklasser, empirisk bakgrund) · `T113`
(Sonnet-subagent-mätuppföljningen, amenderad av beslut 5) · `T67`/`ADR-090`
(syskon-ADR:n från samma grillning, sessions-parallellitet) · `ADR-086`
(uppdragets premisser prövas av mottagaren — källkravs-symmetrin beslut 1
och 4 lånar) ·
[`modell-policy-underlag-2026-08-02.md`](../research/modell-policy-underlag-2026-08-02.md) ·
[`modell-tiering-anthropic-2026-08-02.md`](../research/modell-tiering-anthropic-2026-08-02.md) ·
[`modell-tiering-frontier-praxis-2026-08-02.md`](../research/modell-tiering-frontier-praxis-2026-08-02.md) ·
[`uppdragsrevision-korning-3-2026-08-02.md`](../research/uppdragsrevision-korning-3-2026-08-02.md) ·
`tasks/sessions/archive/2026-08/2026-08-02-session-94.md` Del 1–3.

## Verkställande

Denna landning: `.claude/agents/bygg-agent.md` + `research-pass.md`
(`effort: xhigh` + sanity-check-raden), `T113`-amenderingen, `T67`-bokföringen
(`ADR-090`), och ett mätkort (`effort: xhigh` mot `high` för bygg-agenten,
jämförelsevåg mot `T113`-riggens axel 1 + tokenkostnad). Hub-halvan
(output-style, session-start/resume-texten, `SYSTEMET.md`-sektionen,
plugin-bump + reinstall) ägs av orkestreraren i en separat hub-landning —
inte del av denna ADR:s spoke-verkställande.
