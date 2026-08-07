---
owner: marcus803
updated: 2026-08-07
review_by: 2027-02-07
status: stable
---

<!-- vale Miranon.VueToReact = NO -->
<!-- Citat ur Cursors egen dokumentation ("composable rules") innehåller ordet
     "composable" i sin engelska, icke-Vue-betydelse — se § Delfråga 4. -->

# Ackumulerande lärdomslager — branschpraxis för form och utnyttjande (Code, 2026-08-07)

> **Proveniens.** Avgränsat research-pass. Källor: Google SRE-boken och SRE-workbooken
> (förstapart, hämtade direkt), Atlassians incident-handbok (förstapart), en GAO-rapport om
> NASA:s LLIS (amerikansk federal tillsynsmyndighet — primärkälla för statsförvaltningens
> egen granskning), Nuclinos artikel om NASA:s kunskapsgraf-konvertering (tredjepart, men
> citerar NASA:s Chief Knowledge Architect direkt), Anthropics förstapartsdokumentation
> (`code.claude.com/docs/en/memory`, `claude.com/blog/context-management`,
> `anthropic.com/engineering/effective-context-engineering-for-ai-agents`), Devins
> förstapartsdokumentation (`docs.devin.ai/product-guides/knowledge`) och Cursors
> förstapartsdokumentation (`cursor.com/docs/context/rules`). Fyra läs-only disk-mätningar
> mot `tasks/lessons.md`, `docs/decisions/ADR-039*`, `ADR-085*`, `ADR-081*` och
> `tasks/todo.md`. Inga ändringar gjorda i något repo utöver denna fil; inga git-kommandon
> som muterar något kördes.

---

## Vad jag redan hade när jag började — inventering före sökning

Repot bär redan tre research-pass från 2026-07-27 (samma vecka som S91) som gräver djupt i
en **angränsande men annan** fråga: **vilket LAGER** (CLAUDE.md, skill, hook, agentdefinition)
som ska bära en given regel, och om instruktionsfilernas **STORLEK** faktiskt skadar
efterlevnad:

- `agent-instruktionsfiler-branschpraxis-2026-07-27.md` — Anthropics egen
  mekanism→innehåll-avbildning, fem leverantörers konvergens på "håll filen kort", och den
  peer-reviewade *Lost in the Middle*-effekten.
- `instruktionsleverans-branschpraxis-2026-07-27.md` — plugin-leverans, `@`-import,
  progressiv disclosure; hittade **kontrollerad mätdata** (två 2026-preprints) som visar att
  progressiv disclosure hjälper vid skalning men **underpresterar** för innehåll som hänger på
  "exact output conventions, numerical thresholds" — en varningsflagga värd att bära in i
  denna fråga.
- `mekaniserbara-regler-branschpraxis-2026-07-27.md` — sju gränsfallsregler mot
  branschpraxis; `The Compliance Gap`-studien (0 %→75 % vid verktygsborttagning, 0 %→97 % vid
  belönat revisionsspår) och faktorstudien som finner **ingen** detekterbar effekt av
  filstorlek på efterlevnad (arXiv:2605.10039).
- `regelinventering-dubbletter-2026-07-27.md` — mätte hub+spoke+disciplinfil: 41 % av
  158 regelpunkter var TVINGANDE (mekaniserbara), bara 26 % krävde genuint omdöme.

**Vad de INTE täcker, och som är denna frågas kärna:** ingen av de fyra frågar om ett
ackumulerande **lärdoms-ARKIV** (skrivet en gång, aldrig omprövat, växande utan tak) är rätt
FORM, eller vad branschen gör för att lärdomar faktiskt **UTNYTTJAS** snarare än bara lagras.
De handlar om regel-LEVERANS (når filen en session?), inte om lärdoms-LIVSCYKEL (vad händer
med en lärdom efter den skrivits?). Detta pass bygger vidare på deras källor där de är
relevanta (citerade, inte omresearchade) och tillför fyra nya källspår: Google SRE:s
postmortem-till-åtgärd-kedja, NASA LLIS-antimönstret, Anthropics `MEMORY.md`-curerings-
mekanik (en detalj de tidigare passen bara nämnde i en tabellrad utan att analysera dess
tvingande beskärnings-logik) och fyra agent-harness minnesarkitekturer sida vid sida.

**Beslut jag hittade och som är direkt relevant, redan verifierat mot disk:**

- **ADR-039** (2026-05-27) — "Lesson→grind-principen": en lärdom som föreskriver en mekanisk
  grind genererar en spårad `todo.md`-punkt tills grinden finns. Citerar redan "Google SRE
  Workbook postmortem-kultur; Atlassian incident-handbok" som precedent, **utan URL eller
  citat** — detta pass verifierar den hänvisningen mot primärkällan (se § Delfråga 1) och
  finner den **korrekt i sak**.
- **ADR-085** (2026-08-01) — hubbens `tasks/lessons.md` (den GLOBALA filen, ett annat repo)
  delades i volymer + tunt index när den passerade ~5 500 rader, uttryckligen modellerad på
  Node.js-changelogens form. **Detta löser exakt formfrågan** — men bara för hubben.
  **Spokens egen `tasks/lessons.md` (denna fråga) har aldrig fått samma behandling** — se
  § Mätt nedan.
- **ADR-081** (2026-07-27) — numrering av spokens lessons sker vid landning, inte vid
  skrivning (fragment i `tasks/lessons.d/`), löser en kollisionsklass men rör inte filens
  storlek eller sökbarhet.

Ingen befintlig fil eller ADR besvarar frågan "är formen och utnyttjande-graden
branschledarmässig". Detta pass är den första riktade undersökningen av just den frågan.

---

## Mätt: spokens `tasks/lessons.md` som den faktiskt ser ut i dag (2026-08-07)

| Mått | Värde |
|---|--:|
| Filstorlek | 794 006 tecken (`wc -c`) |
| Rader | 10 100 (`wc -l`) |
| Numrerade lärdomsposter | 462 st (`### L1` … `### L479`, med luckor — konsoliderings-historik) |
| `[UNIVERSAL]`-taggade poster | 718 träffar (fler än 462 eftersom taggen även nämns i löptext) |
| H2-sessionsblock (kronologiska, inte tematiska) | 90 st |
| Konsoliderade fragment i `tasks/lessons.d/` | 7 st (plus `README.md`), väntar numrering vid landning (ADR-081) |
| Topikalt index/register | **Inget.** Enda strukturen är en instruktionssektion ("Så här används denna fil") plus 90 kronologiska H2-rubriker — ingen ämnesbaserad TOC |
| Uppslagsmetod enligt `session-start`-skillen | `grep -n "^### L3"` (kräver att man redan gissar numret) eller `Read` med `offset` mot slutet — **ingen** semantisk eller ämnesbaserad ingång |

Två jämförelser som sätter storleken i sammanhang, båda **uppskattningar** (ej mätta via
`/context`, som denna offline-läsning inte har tillgång till):

- **Mot Claude Codes egen `MEMORY.md`-gräns** (200 rader / 25 KB, se § Delfråga 2): filen är
  **≈ 50× gränsens radtal** och **≈ 31× gränsens byte-tak**. Skulle `tasks/lessons.md`
  behandlas som en `MEMORY.md`-fil skulle Claude Codes egen mekanik tysta trunkera allt
  bortom de första ~200 raderna vid varje session — exakt det session-start-skillen redan
  undviker genom att aldrig läsa filen oguardat.
- **Uppskattad tokenkostnad vid en hypotetisk fullständig inläsning:** ≈ 199 000–227 000
  tokens (3,5–4,0 tecken/token, samma omräkningsmetod som
  `instruktionsleverans-branschpraxis-2026-07-27.md` använde och som denna fil därför håller
  sig till för intern jämförbarhet). Det är i sig skälet till att session-start-skillen
  förbjuder en full läsning — en disciplin som redan finns och håller, oberoende av vad detta
  pass finner om formen.

---

## Delfråga 1 — Google SRE: arkiv eller åtgärdskedja?

**Läses gamla postmortems, eller är värdet i åtgärderna? Svaret är: båda, men i en
uttryckligt rangordnad ordning, och rangordningen är mekaniserad.**

### Postmortem-arkivet finns, och det används i aggregat

SRE-workbooken, ordagrant: *"We store postmortems in a tool called Requiem so it's easy for
any Googler to find them ... We have thousands of postmortems stored, dating back to 2009."*
Och: *"Requiem parses out metadata from individual postmortems and makes it available for
searching, analysis, and reporting."* SRE-boken tillägger att externa verktyg för
postmortem-aggregering *"are becoming more and more useful"* för att hitta *"common themes and
areas for improvement."*

Arkivet är alltså inte värdelöst — det bär **trendanalys över tid**, inte primärt individuell
återläsning av en enskild gammal postmortem.

### Men den uttalade, mekaniserade regeln är: åtgärd, inte arkivering, är beviset

Citatet som avgör frågan, tillskrivet Ben Treynor Sloss (Googles VP för 24/7-drift), citerat i
SRE-workbooken:

> *"To our users, a postmortem without subsequent action is indistinguishable from no
> postmortem. Therefore, all postmortems which follow a user-affecting outage must have at
> least one P[01] bug associated with them. I personally review exceptions. There are very few
> exceptions."*

Mekaniken bakom: *"Any resulting action items are filed as bugs in our centralized bug tracking
system. Consequently, we can monitor the closure of action items from each postmortem."* Alltså
inte bara "skriv en åtgärd" utan ett **spårat arbetsobjekt med synlig closure-status**, i
samma system som allt annat arbete.

Och boken namnger explicit antimönstret som uppstår om bara skrivandet belönas:

> *"If you reward engineers for writing postmortems, but not for closing the associated action
> items, you risk an unvirtuous cycle of unclosed postmortems."*

### Atlassians incident-handbok — oberoende bekräftelse, samma mekanism

Atlassian, förstapart: *"every corrective action and recurring issue identified during the
review should be converted into a Jira work item with a clear owner and a deadline."* Och:
*"once the postmortem process is done, the actions are prioritized by the development team as
part of their normal backlog."* Blameless-kulturen (*"assumed that every team and employee
acted with the best intentions"*) är den psykologiska förutsättningen för att postmortems
överhuvudtaget skrivs ärligt — men mekanismen som avgör om de **utnyttjas** är
work-item-konverteringen, inte kulturen ensam.

### Verifiering av ADR-039:s citat

ADR-039 skrev 2026-05-27, utan URL: *"Lesson→grind (Google SRE Workbook postmortem-kultur;
Atlassian incident-handbok): åtgärder utan formell spårning glöms."* Detta pass bekräftar
citatet **håller i sak** mot primärkällan — Ben Treynor Sloss-citatet och Atlassians
Jira-mekanism är exakt den princip ADR-039 sedan byggde `todo.md`-spårningen på. Det var alltså
inte en lös analogi.

**Skillnaden mot vårt system, mätt:** Googles mekanism har (a) en **obligatorisk** koppling —
varje postmortem MÅSTE ha en bugg, personligt granskad vid undantag, och (b) en **synlig
closure-metrik** över hela beståndet ("we can monitor the closure of action items from each
postmortem"). ADR-039:s lesson→grind-princip har (a) inte: kopplingen sker när **någon
identifierar** att en lärdom föreskriver en grind — ingen sweep tvingar alla 462 poster genom
samma bedömning. Stickprov i `tasks/todo.md` (grep 2026-08-07) hittar flera öppna,
L-nummer-refererade lesson→grind-punkter (t.ex. rader som refererar `L149`, `L91`, `L52`) —
mekanismen används **på riktigt**, inte bara på papper — men ingen closure-rate över hela
beståndet är mätt eller mätbar med nuvarande verktyg. Se § Vad jag inte kunde belägga.

---

## Delfråga 2 — Anthropic: stora minnesfiler eller kuraterade ytor + strukturerad anteckningsteknik?

**Svaret är entydigt: kuraterade ytor, med en hård, mekaniskt tvingad beskärningsregel för
just den artefaktklass som är närmast jämförbar med `tasks/lessons.md`.**

### "Structured note-taking" — vad artikeln faktiskt föreskriver

Från *Effective context engineering for AI agents*: *"Structured note-taking, or agentic
memory, is a technique where the agent regularly writes notes persisted to memory outside of
the context window."* Exemplet är uttryckligen en liten, levande fil: *"your custom agent
maintaining a NOTES.md file"*. Detta är i sig inte ett argument mot en stor fil — men artikeln
ramar in principen som helhet mycket tydligare i sin slutsats: *"find the smallest set of
high-signal tokens that maximize the likelihood of your desired outcome."* Och om beskärning
specifikt: *"The art of compaction lies in the selection of what to keep versus what to
discard."*

### Memory tool + context editing — mätt, inte antaget

Anthropics egen blogg (`claude.com/blog/context-management`) rapporterar kontrollerade
mätningar, inte påståenden: **84 % tokenbesparing** i en 100-turs-utvärdering
(*"reducing token consumption by 84%"*) och **39 % prestandalyft** när minnesverktyget
kombinerades med context editing (*"improved performance by 39% over baseline"*). Mekanismen
beskrivs uttryckligen som ackumulering **plus** aktiv gallring: *"This allows agents to build
up knowledge bases over time ... "* medan context editing *"removes stale information,
compressing verbose output."* Ackumulering utan gallring testas alltså **inte** som
konfigurationen som vinner — vinsten kommer från kombinationen.

### `MEMORY.md` (auto memory) — den mest direkt jämförbara mekanismen, och den mest talande

Detta är passets skarpaste nya fynd, och det fanns bara delvis i de tre tidigare passen (en
tabellrad, ingen analys av curerings-logiken). Auto memory är Claude Codes egen mekanism för
**exakt** den artefaktklass `tasks/lessons.md` är: *"Learnings and patterns"* Claude själv
ackumulerar över sessioner. Den bär en **hård, mekaniserad** form:

- Ett `MEMORY.md`-index, **alltid laddat**, hårt begränsat: *"The first 200 lines of
  `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every
  conversation. Content beyond that threshold is not loaded at session start."*
- Ämnesfiler (`debugging.md`, `api-conventions.md`, …) **laddas aldrig vid start** — Claude
  läser dem on-demand: *"Topic files ... are not loaded at startup. Claude reads them on
  demand using its standard file tools when it needs the information."*
- **Aktiv gallring är inbyggd i skrivögonblicket, inte en framtida städning:** *"If the file is
  near a limit, Claude Code reminds Claude to shorten it: keep one line per entry, move detail
  into topic files, and merge or drop stale entries."*
- Och en konsekvens som är direkt relevant för en fil som `tasks/lessons.md` skulle bli om den
  behandlades likadant: *"If the file is over a limit, the write still succeeds, but Claude
  Code returns an error telling Claude to rewrite the index, because everything past the limit
  is dropped on the next load."* En ogallrad, växande fil **förlorar mekaniskt sitt eget
  innehåll** förbi gränsen — det är inte en rekommendation, det är hur läsvägen fungerar.

Detta är samma form som ADR-085 redan valde för **hubbens** `lessons.md` (tunt index + frysta
volymer + en aktiv volym) — oberoende härlett av Anthropic för sin egen minnesmekanism och av
`TASK-105`s bygg-agent för hubben, samma mönster två gånger.

### Nyansen från de tidigare passen som fortfarande gäller

`instruktionsleverans-branschpraxis-2026-07-27.md` fann kontrollerad mätdata (2026-preprints,
**ej peer-reviewade**) som visar att progressiv disclosure *"underpresterar när framgång
hänger på 'exact output conventions, numerical thresholds, or long artifact-generation
pipelines'."* En lärdomsfil är delvis den klassen — många lessons ÄR exakta trösklar och
korrigeringar. Det är ett skäl att vara försiktig med att splitta **för aggressivt** eller
förlita sig på att en agent alltid hittar rätt ämnesfil — inte ett skäl att behålla en enda
oindexerad fil. `MEMORY.md`-mönstret adresserar just den risken genom att indexet **fortfarande
är sökbart i sin helhet** (det är index-filen som gallras, inte innehållet som raderas — det
flyttas till namngivna ämnesfiler).

---

## Delfråga 3 — NASA LLIS: är write-only-arkiv ett känt antimönster, och vad är motmedlet?

**Ja, dokumenterat av en federal tillsynsmyndighet, med en namngiven rotorsak och ett mätt
motmedel.**

### Vad GAO faktiskt fann (GAO-02-195, granskning av NASA:s Lessons Learned-process)

- **Kännedom och användning var lågt:** *"27 percent of program and project managers were not
  aware of LLIS before our survey"*, och *"43 percent of program and project managers have not
  submitted a lesson to the LLIS."*
- **Sökbarheten var arkivets faktiska brott:** *"It is difficult to weed through all the
  irrelevant lessons to get to the few 'jewels' that you need to find."*
- **Kulturell broms:** *"there is reluctance to share negative lessons for fear that they might
  not be viewed as good project managers."*
- **Verktyget konkurrerade aldrig med det som faktiskt fungerade:** de tre huvudkällorna
  för lärdomar var *"(1) system and engineering reviews, (2) program and project briefings, and
  (3) informal discussions with colleagues"* — inte den centraliserade databasen.

GAO:s rekommendationer var strukturella, inte "skriv fler lärdomar": utse en ägare
(*"a lessons learned manager to lead and coordinate"*), bygg bättre sök, och koppla
**incitament** till prestationsutvärdering — samma princip som Googles bug-koppling, fast för
skrivsidan snarare än åtgärdssidan.

### Motmedlet, mätt konkret: NASA:s egen kunskapsgraf-konvertering

NASA:s Chief Knowledge Architect (David Meza), citerad: *"Collecting and storing the lessons
learned is only half the battle. Making that knowledge easily discoverable is the real
challenge."* Det gamla gränssnittet: *"The system required you to punch in a keyword which
would then produce an endless, randomly arranged list of links to documents, every one of which
needed to be checked one by one — a process so tedious that NASA engineers hardly ever
consulted the system."*

Fixen var inte att skriva om lärdomarna utan att **strukturera retrievalen**: noder klustrade
kring ämnen via maskininlärning, en grafdatabas (Neo4j), och ett visuellt gränssnitt.
Effekten, konkret: en sökning som tidigare gav 3 irrelevanta dokument på 8 dagar gav sedan
*"over 30 relevant files in the database"* — och löste ett verkligt Orion-spacecraft-problem.

### Generalisering utanför NASA

Ett bredare PM-branschmönster, sekundärkälla men konsekvent med GAO/NASA: *"lessons ... often
get lost in a database, preventing companies from really learning from experience and
repeating mistakes"* — samma antimönster, oberoende observerat.

**Överfört till oss:** `tasks/lessons.md`s uppslagsmetod i dag (grep mot ett gissat nummer,
eller läs svansen) delar NASA:s gamla systems kärnproblem — **arkivet är sökbart men inte
navigerbart**: det finns inget ämnesbaserat index att gå via, bara en linjär text man antingen
redan vet numret för eller läser kronologiskt. Vi delar dock INTE NASA:s värsta problem
(43 % kände inte ens till systemet, 27 % hade aldrig bidragit) — `tasks/lessons.md` skrivs
aktivt och ofta (462 poster på ~15 veckor). Bristen är renodlat på **retrieval-sidan**, inte på
capture-sidan.

---

## Delfråga 4 — Ledande agent-harness 2025–2026: minnesarkitekturer sida vid sida

Fyra leverantörer undersökta. Mönstret konvergerar starkt på en form; en av de fyra kunde
**inte** verifieras mot förstapartskälla för den specifika funktion som efterfrågades.

| Harness | Alltid-laddad, kuraterad yta | Djup/detalj-lager | Retrieval-mekanism | Explicit anti-monolit-regel |
|---|---|---|---|---|
| **Claude Code** (Anthropic) | `MEMORY.md`-index, hårt tak 200 rader / 25 KB | Ämnesfiler (`debugging.md` m.fl.), obegränsat antal | On-demand filläsning | Ja, mekaniserad — index gallras aktivt, innehåll bortom taket tappas tyst vid nästa laddning |
| **Cursor** | Projekt-/user-/team-regler, `AGENTS.md` | Fler regelfiler, refererade filer i stället för kopierade | Auto-attach på filmönster | Ja, i prosa — *"Keep rules under 500 lines"*, *"Split large rules into multiple, composable rules"*, *"Reference files instead of copying their contents"* |
| **Devin** (Cognition) | Knowledge-mappar (organisations-/projekt-scope) | Enskilda Knowledge-poster, obegränsat antal, i mappträd | **Trigger-baserad automatisk recall** — *"Devin retrieves Knowledge when relevant, not all at once or all at the beginning"* | Ja, explicit — *"Split up your Knowledge into smaller ones where possible"*, *"Create specific Knowledge that is targeted at one workflow or action"* |
| **OpenAI Codex** | `AGENTS.md`, tak `project_doc_max_bytes` (32 KiB default) | Skills, nästlade `AGENTS.md` | Katalog-nästling, närmast-fil-vinner | Ja, i prosa — *"Keep it small"*, *"A common mistake is overloading the prompt with durable rules instead of moving them into AGENTS.md or a skill"* |

**Devins mekanism är den mest direkt jämförbara** med frågans kärna (en växande samling av
inlärda fakta/rättelser, inte statiska regler): den är förstapart-dokumenterad som
**mappstrukturerad med tvingande trigger-baserad retrieval**, inte en flat logg. Citatet som
avgör: *"Devin will read the entire Knowledge contents [of a matched item], so keep it all
relevant and up-to-date!"* — samma "läs allt av det som matchar, inte allt som finns"-princip
som `MEMORY.md`s index+ämnesfil-delning.

**Vad som INTE kunde verifieras:** sekundära bloggar (inte Cursors egen dokumentation)
beskriver en separat "Memories"-funktion i Cursor — chatt-observerade preferenser som
extraheras automatiskt. Cursors egen dokumentationssida för regler (`cursor.com/docs/context/
rules`, hämtad direkt 2026-08-07) **nämner den inte alls**. Detta redovisas som obekräftat,
inte som fakta — se § Vad jag inte kunde belägga.

**Det entydiga mönstret över samtliga tre VERIFIERADE harness (Claude Code, Devin, Codex) plus
Cursors regel-dokumentation:** ingen av dem skeppar en enda, oindexerad, obegränsat växande fil
som sin primära minnesmekanism. Samtliga har (a) en liten, alltid-laddad, aktivt hållen kort
yta, och (b) ett obegränsat antal SMÅ, namngivna, ämnesscopade filer som laddas selektivt.
Skillnaden mellan leverantörerna ligger i HUR selektionen sker (hårt tak + gallring hos
Anthropic, trigger-matchning hos Devin, filmönster-matchning hos Cursor, katalognästling hos
Codex) — inte OM den sker.

---

## Dom

Frågan har två delar, och de har olika svar.

**Del A — är det branschledarmässig praxis att FÅNGA lärdomar som numrerade, skrivna poster?**
**Ja, entydigt.** Google (Requiem, tusentals postmortems sedan 2009), Atlassian (Jira-spårade
work items), och Anthropics egen `MEMORY.md` bekräftar alla att skriftlig, strukturerad
fångst av lärdomar är etablerad, väl fungerande praxis. `tasks/lessons.md`s disciplin att
skriva en post per korrigering, numrerad, med `[UNIVERSAL]`-taggning, är i linje med detta.

**Del B — är den nuvarande FORMEN (en enda, 794 006 tecken stor, oindexerad, kronologisk fil
utan ämnesuppslag) branschledarmässig?** **Nej — mätt mot alla fyra undersökta
precedent-klasser, ingen matchar formen, och en av dem (NASA LLIS pre-fix) är den uttryckliga
**FAILURE CASE** branschen själv citerar.** Google/Atlassian arkiverar men lutar värdet mot
spårade åtgärder; Anthropic, Devin och Codex delar alla upp i en liten alltid-laddad yta plus
många små scopade djup-filer; NASA:s pre-fix-LLIS — en enda stor, keyword-sökbar men
oindexerad samling — är den arketypiska varningen, inte förebilden. **Hubbens egen
`lessons.md` (ADR-085) har redan löst exakt detta problem för sig själv, i samma repo-familj,
fem dagar innan denna fråga ställdes** — precedenten för att fixa formen finns internt, inte
bara externt.

**Del C — utnyttjas lärdomarna, eller arkiveras de bara?** **Delvis, mätt.** ADR-039:s
lesson→grind-princip är en verklig, i drift varande motsvarighet till Googles
bugg-koppling och Atlassians Jira-koppling — inte bara en deklarerad avsikt. Stickprovet i
`tasks/todo.md` visar flera öppna, L-nummer-refererade lesson→grind-punkter. Men täckningen är
**partiell och ospårad i aggregat**: ingen mekanism sveper alla 462 poster för
befordringsvärde, och ingen closure-rate mäts över beståndet på det sätt Requiem gör för
Google. Det är den delen av utnyttjande-mekaniken som saknar Googles motsvarande synlighet.

---

## Vad jag inte kunde belägga

1. **Cursors "Memories"-funktion** (auto-extraherade preferenser från chatt) — beskrivs i
   flera sekundära bloggar men **nämns inte alls** i Cursors egen regel-dokumentation
   (`cursor.com/docs/context/rules`, hämtad direkt). Kan vara en produktfunktion som ligger
   utanför den sidan, eller feltolkad av sekundärkällorna. Behandla som obekräftat.
2. **Closure-rate för ADR-039:s lesson→grind-pipeline i vårt eget repo.** Jag hittade flera
   öppna, spårade punkter (grep mot `todo.md`) men inget aggregerat mått motsvarande Googles
   "we can monitor the closure of action items from each postmortem". Frånvaron av mätning är
   inte bevis på att pipelinen inte fungerar — bara att ingen sammanställning finns att citera.
3. **Om `[UNIVERSAL]`-taggens 718 träffar (mot 462 poster) betyder att en majoritet av
   lärdomarna faktiskt är universella**, eller om taggen används mer generöst i löptext än i
   faktisk klassning. Jag räknade regex-träffar, inte klassificerade posterna individuellt —
   utanför uppdragets omfattning.
4. **Hur stor andel av de 462 posterna som genuint är TVINGANDE/mekaniserbara** kontra
   OMDÖME/KUNSKAP, i samma mening som `regelinventering-dubbletter-2026-07-27.md` klassade
   hub+spoke-konstitutionens 158 punkter. Ingen sådan klassning finns för `lessons.md` själv —
   det vore ett eget, stort pass.
5. **Om en volym-split av spokens `lessons.md` (à la ADR-085) skulle kosta något specifikt
   för spoke-mekaniken** — `check-lesson-numbers.sh`, ADR-081:s fragment-flöde,
   `lessons-hub-sync`-skillens lyft-logik som redan pekar mot spokens fil. Jag läste inte dessa
   skript i detalj; en sådan ändring skulle kräva att de verifieras mot en volym-form innan
   den utfördes. Detta pass bedömer FORMEN mot branschpraxis, inte migrationskostnaden.
6. **Om NASA:s efterföljande kunskapsgraf-lösning (Neo4j-klustring) generaliserar till en
   text-baserad markdown-fil utan ML-klustring.** Fyndet är att STRUKTURERAD RETRIEVAL löste
   problemet — den specifika tekniken (grafdatabas) är sannolikt överdimensionerad för vår
   skala (462 poster mot NASA:s hela agentur-historik) och bör inte tolkas som ett förslag om
   samma teknik.

---

## Rå options-yta

Tre alternativ, lagda fram neutralt utan rekommendation — beslutet är Marcus'. Var och en
utvärderad mot vad forskningen faktiskt visar, för och emot.

### Alternativ 1 — Behåll formen (en fil, kronologisk, grep-på-nummer)

**Talar för:** Faktorstudien (arXiv:2605.10039, tidigare pass) hittade ingen detekterbar
effekt av ren FILSTORLEK på efterlevnad — storlek i sig är inte bevisligen skadligt.
Session-start-skillens on-demand-grep-disciplin undviker redan den värsta kostnaden (full
inläsning). Ingen migrationskostnad, ingen risk att bryta `check-lesson-numbers.sh` eller
`lessons-hub-sync`s lyft-logik.

**Talar emot:** Ingen av de fyra undersökta agent-harnessen (Claude Code, Devin, Cursor,
Codex) använder denna form för sin egen ackumulerande minnesklass. NASA:s pre-fix-LLIS —
den explicita branschens varnings-exempel — delar formens kärndrag (en stor, keyword-sökbar
men oindexerad samling). Retrieval kräver att man redan vet vilket nummer eller ämne man
letar efter; det finns inget sätt att upptäcka en relevant, obekant lärdom.

### Alternativ 2 — Kuratera ned (volym-split + index, à la ADR-085 / `MEMORY.md`-mönstret)

**Talar för:** Matchar samtliga fyra undersökta minnesarkitekturer (kuraterad kort yta +
många små scopade djup-filer). Redan bevisad internt — ADR-085 löste identiskt problem för
hubbens `lessons.md` fem dagar tidigare, med en dokumenterad procedur (Node.js-changelog-
formen) som kan återanvändas rakt av. Anthropics `MEMORY.md`-mekanik visar konkret,
mätt vinst (84 % tokenbesparing, 39 % prestandalyft) av just kombinationen
kuraterat-index-plus-on-demand-djup.

**Talar emot:** Kostar ett migrationspass (462 poster, 90 H2-block, `[[Lnnn]]`-länkar som
måste förbli fil-oberoende sökbara, `check-lesson-numbers.sh` och `lessons-hub-sync` som
båda antar en enda fil). SkillJuror-studien (tidigare pass) varnar att progressiv disclosure
**underpresterar** för innehåll som är "exact output conventions, numerical thresholds" —
en del av lärdomsmassan är exakt den klassen, vilket gör en NAIV split (utan ämnesindex)
riskabel: risken är att man byter "allt finns men är osökbart" mot "det mesta finns men
agenten hittar aldrig rätt fil".

### Alternativ 3 — Ändra befordrings-mekaniken (stärk ADR-039:s lesson→grind)

**Talar för:** Detta är den axel där Google/Atlassian-precedensen är starkast och mest
direkt tillämplig: en obligatorisk, spårad koppling från varje lärdom till en bedömning
("mekaniserbar? → todo-punkt tills grind finns"), plus en synlig closure-metrik över hela
beståndet (Requiem-motsvarighet). Kräver inte att filens FORM ändras alls — kan köras som
ett fristående sweep-pass oavsett vad Alternativ 1/2 blir.

**Talar emot:** Löser inte retrieval-problemet (NASA:s huvudfynd) — en lärdom kan vara
perfekt befordrad till en grind och ändå vara omöjlig att hitta i arkivet för någon som söker
efter den ursprungliga texten. Kräver ett systematiskt sweep-pass över 462 poster (en
engångskostnad i samma klass som Alternativ 2:s migration) plus ett sätt att hålla
closure-metriken uppdaterad framåt (repeterande kostnad, till skillnad från Alternativ 2:s
engångskostnad).

**Alternativen är inte ömsesidigt uteslutande.** Google kör faktiskt båda: ett arkiv (Requiem,
strukturerat och sökbart — Alternativ 2:s princip) OCH en obligatorisk åtgärdskoppling
(Alternativ 3:s princip). Ingen av källorna i detta pass beskriver ett system som bara gjorde
det ena.

---

## Källförteckning

### Google, förstapart

- [SRE Book — Postmortem Culture: Learning from Failure](https://sre.google/sre-book/postmortem-culture/)
- [SRE Workbook — Postmortem Culture: Learning from Failure](https://sre.google/workbook/postmortem-culture/)

### Atlassian, förstapart

- [Atlassian — Postmortems: Enhance Incident Management Processes](https://www.atlassian.com/incident-management/handbook/postmortems)

### NASA / amerikansk federal tillsyn

- [GAO-02-195 — NASA: Better Mechanisms Needed for Sharing Lessons Learned](https://www.govinfo.gov/content/pkg/GAOREPORTS-GAO-02-195/html/GAOREPORTS-GAO-02-195.htm) — **förstapart, federal tillsynsrapport**
- [Nuclino — Why NASA converted its lessons learned database into a knowledge graph](https://blog.nuclino.com/why-nasa-converted-its-lessons-learned-database-into-a-knowledge-graph) — **tredjepart, citerar NASA:s Chief Knowledge Architect David Meza direkt**

### Anthropic, förstapart

- [How Claude remembers your project (CLAUDE.md, rules, auto memory)](https://code.claude.com/docs/en/memory)
- [Context management (memory tool + context editing, 84 %/39 %-mätningarna)](https://claude.com/blog/context-management)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

### Devin (Cognition), förstapart

- [Devin Docs — Knowledge](https://docs.devin.ai/product-guides/knowledge)
- [Cognition — How Cognition Uses Devin to Build Devin](https://cognition.com/blog/how-cognition-uses-devin-to-build-devin)

### Cursor, förstapart

- [Cursor — Rules](https://cursor.com/docs/context/rules) — verifierat: **ingen träff** på "Memories"-funktionen som sekundära källor beskriver

### Internt underlag (läst i sin helhet)

- `docs/research/agent-instruktionsfiler-branschpraxis-2026-07-27.md`
- `docs/research/instruktionsleverans-branschpraxis-2026-07-27.md`
- `docs/research/mekaniserbara-regler-branschpraxis-2026-07-27.md`
- `docs/research/regelinventering-dubbletter-2026-07-27.md`
- `docs/decisions/ADR-039-konsistens-grindar-kadens.md`
- `docs/decisions/ADR-085-hubbens-lessons-i-volymer.md`
- `docs/decisions/ADR-081-nummer-tilldelas-vid-landning.md`
- `plugins/marcus-system/skills/session-start/SKILL.md` (`~/Repon/marcus-system/`)

### Ej åberopad som grund, endast bakgrund

- PMI: *"Lessons (Really) Learned? How To Retain Project Knowledge And Avoid Recurring
  Nightmares"` — sekundär, allmän bekräftelse av write-only-mönstret, ingen ny data utöver
  GAO/NASA.

---

## Verifierat mot disk (läs-only, 2026-08-07)

| Kontroll | Utfall |
|---|---|
| `wc -c tasks/lessons.md` | 794 006 tecken |
| `wc -l tasks/lessons.md` | 10 100 rader |
| `grep -c "^### L[0-9]" tasks/lessons.md` | 462 numrerade poster |
| Första/sista post | `### L1` (rad 1019), `### L479` (rad 10057) |
| `grep -c "^## " tasks/lessons.md` | 90 H2-block, samtliga kronologiska (datum + sessionsnamn), inget ämnesindex |
| `ls tasks/lessons.d/` (och `check:docs`s egen räkning) | 7 nummerlösa fragment väntar landning (ADR-081-flödet); `check:docs` bekräftar samma tal och 462 unika numrerade poster |
| `grep -n "lesson.?grind\|ADR-039" tasks/todo.md` | Flera öppna, L-nummer-refererade punkter (t.ex. L149, L91, L52) — pipelinen är i drift, inte bara deklarerad |
| Branch / commit vid pass-start | `docs/s99-160-flippar` @ `5bd5d672c376139ae097c420c39b9410709811e6` |

Inga ändringar gjorda i något av dessa utöver denna forskningsfil. Arbetsträdet är i övrigt
orört av detta pass.
