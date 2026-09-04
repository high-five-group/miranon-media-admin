---
owner: marcus803
updated: 2026-09-04
review_by: 2026-12-04
status: draft
---

# MCP-verktyg Apify, Firecrawl, Composio, Chrome DevTools, Higgsfield — nytta, plats, pris

> **Proveniens:** avgränsat research-pass. Avvikelse från kontraktets
> standardlandning, bokförd av orkestreraren: filen skrivs till
> orkestrerarens egen worktree
> (`/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s118-apparaten`),
> inte huvudkatalogen — en annan levande session äger den. Gren
> `docs/s118-sessionsstart-apparatkartan`, commit `1e684bd1`. Inget
> committat, inga git-skrivningar, ingen MCP-server installerad eller
> ändrad. Frågan: kan orkestrerar-/agent-arbetssättet förbättras med
> Apify, Firecrawl, Composio, Chrome DevTools MCP och Higgsfield — var,
> till vilket pris, med vilka risker.

## Vad jag redan hade innan jag sökte

**Läst före första sökning:** `CLAUDE.md` § Verktygsfakta (Airtable-MCP:ernas
två räckvidder — PAT-servern ser inte automationer/interfaces, claude.ai-
connectorn gör), `docs/research/l8-workflow-kartlaggningen-2026-08-09.md`
(hela § A.5 + § A.8 — Kun Chens AXI-princip, GitHub-MCP mätt till ≈3×
tokenkostnad/>2× latens mot CLI, hans egna Chrome-DevTools-AXI-wrapper),
`ADR-106` (agnostik-snittet: harness-djup mekanisering kräver en FAKTISK
nuvarande användare, "ingen abstraktion utan faktisk nuvarande användare"),
`ADR-107` (reproducerbarhet, maskinlager — perifert relevant, ingen direkt
träff), alla tre agentdefinitionerna i `.claude/agents/`, `T159`, `T167`,
`T141`, `T79`, `T93` (fulltext, se nedan), och
`docs/reference/atkomst-och-nycklar.md` (grep på "mcp", två träffar: GitHub
PAT delas mellan `gh` och GitHub-MCP; Airtable-MCP-serverns token
`AIRTABLE_API_KEY` når prod med `create`-behörighet).

**Repo-brett grep på apify/firecrawl/composio/higgsfield: noll träffar**
före detta pass, i alla `.md`-filer. Ingen ADR eller tråd har alltså redan
avgjort frågan — detta är genuint ny mark, inte en omprövning.

**Vad som var nytt och avgörande:**

1. **Mekaniskt verifierat hos förstapart** (`code.claude.com/docs/en/sub-agents`,
   hämtad 2026-09-04): alla tre agentdefinitioner (`bygg-agent.md`,
   `research-pass.md`, `review-agent.md`) använder `disallowedTools`
   (denylist), inte `tools` (allowlist). Det betyder att **varje ny
   MCP-server som installeras på användarnivå blir automatiskt tillgänglig
   för samtliga tre agenter — inklusive `bygg-agent` som committar och
   pushar** — om den inte uttryckligen läggs till i respektive
   `disallowedTools`. Ingen av de tre filerna nämner detta idag. Detta är
   den enskilt starkaste risk- och placeringsfaktorn i hela svaret, se § B
   och § D.6.
2. `T159` och `T167` gav färdiga svar på om verktygen löser REDAN
   REGISTRERADE problem (de gör det inte, se § D.7 och § A/Composio).
   `T79`/`T93` gav de närmaste träffarna för Composio, men svagare än
   Marcus antar (se § A/Composio).
3. Två egna research-pass (`agent-autonomi-eskaleringsdesign-2026-07-29.md`,
   `forberedelseskarm-splash-branschmonster-2026-08-16.md`) dokumenterar
   samma konkreta brist två gånger oberoende: `WebFetch` ger bara
   sidtiteln på JS-renderade SPA:er (Material 3s och Apple HIGs
   dokumentationssidor). Det är det enda av de fem verktygen med ett
   redan skrivet, daterat, tvåfaldigt träffat behov — Firecrawl, se § A.

## Konfigurerat läge, mätt 2026-09-04 (läst, inte ändrat)

`~/.claude.json` → `mcpServers` (**användarnivå**, gäller alla projekt på
maskinen): `magic`, `nanobanana`, `google-drive`, `context7`, `playwright`,
`chrome-devtools`, `airtable` (PAT-servern). Projektnivå (`.claude.json` →
`projects["…miranon-media-admin"].mcpServers`): `vercel` (HTTP,
`https://mcp.vercel.com`). Ingen `.mcp.json` i repot (`test -f .mcp.json`
→ saknas). Plugin-levererade: `resend`, GitHub (`mcp__plugin_github_github`),
Figma. Connector-baserade (claude.ai-konto, annan mekanism än
`mcpServers`): `mcp__claude_ai_Airtable/Gmail/Google_Calendar/Google_Drive`.

Antal verktyg **redan** exponerade i denna session (räknat direkt ur
verktygslistan): `chrome-devtools` 29, `playwright` 24, `airtable` (PAT)
16, `context7` 2 — **71 tool-definitioner redan i poolen** innan något av
de fem nya läggs till. Relevant baslinje för § B.3.

## A. Per verktyg

### Apify

**Vad:** plattform för webbskrapning — tusentals färdiga "Actors" (skrapare
för sociala medier, sök, kartor, e-handel) + en generisk `rag-web-browser`-
actor. MCP-servern hostas på `mcp.apify.com`.

**Status:** förstapart (Apify AB, etablerat sedan 2015). Repo
`apify/apify-mcp-server`: **5 905 stjärnor, MIT-licens, pushad 2026-09-04**
(samma dag som detta pass — mätt direkt via GitHub API, inte gissat).
Auth: Apify API-token, OAuth (rekommenderat) eller bearer-token; anonym
åtkomst för dokumentation/actor-sök. Rate limit **30 req/s per användare**
(`docs.apify.com/integrations/mcp`, hämtad 2026-09-04).

**Default-tools:** 5 (`search-actors`, `fetch-actor-details`,
`search-apify-docs`, `fetch-apify-docs`, `rag-web-browser`) — smalt och
AXI-vänligt redan i grundläget; fler actors kan exponeras via URL-parametrar
vid behov.

**Pris** (förstapart `apify.com/pricing`, hämtad 2026-09-04): Free $0/mån
med **$5/mån inkluderad plattformskredit**, 5 samtidiga körningar, 16 GB
RAM/körning, $0,2/compute unit, krediter rullar INTE över. Betalt: Starter
$19, Scale $199, Business $999/mån.

**Registrerat behov:** **inget hittat.** `T79` (custom miranon.se) och `T93`
(AI-assistent) ligger tematiskt närmast men kräver inte massskrapning idag.
Marcus egen bedömning ("ger nytta direkt") är en hypotes, inte grundad i
någon skriven tråd eller kort.

### Firecrawl

**Vad:** webbskrapning/crawling/sök/extraktion optimerad för att mata
LLM-kontext med ren markdown — rendrar JavaScript, hanterar SPA:er.

**Status:** förstapart (Mendable AI → omdöpt Firecrawl, YC-backat, Series A
$14,5M augusti 2025). Repo `firecrawl/firecrawl-mcp-server` (den gamla
`mendableai`-vägen redirectar hit): **7 390 stjärnor, MIT, pushad
2026-09-03** — mätt via GitHub API.

**Tools:** README (`firecrawl/firecrawl-mcp-server`, main-grenen, hämtad
2026-09-04) räknar **14 numrerade verktygsgrupper** — `scrape`, `map`,
`search` (+ `search_feedback`), `feedback`, `crawl`, `check_crawl_status`,
`parse`, `agent` (+ `agent_status`), `interact` (+ `interact_stop`),
`research_*` (4 undertyper), `monitor_*` (6 undertyper),
`developer_search` — **≈20+ distinkta verktygsnamn** om allt laddas.
Betydligt tyngre än Apifys default-set.

**Auth:** nyckellös (begränsad daglig kvot), OAuth, eller API-nyckel mot
`https://mcp.firecrawl.dev/v2/mcp`; självhosting möjlig.

**Pris** (förstapart `firecrawl.dev/pricing`, hämtad 2026-09-04): Free
**1 000 krediter/mån**; Hobby $16/mån (årsbetalning) 5 000 krediter;
Standard $83/mån 100 000; Growth $333/mån 500 000; Scale $599/mån
1 000 000.

**Registrerat behov: DIREKT TRÄFF.** `docs/research/agent-autonomi-eskaleringsdesign-2026-07-29.md`
och `docs/research/forberedelseskarm-splash-branschmonster-2026-08-16.md`
dokumenterar OBEROENDE av varandra att `WebFetch` ger bara sidtiteln på
JS-renderade dokumentationssidor (Material 3s duration/easing-tokens,
Apple HIGs launch-screen-sidor) — tvingade fram en WebSearch-syntes
uttryckligen märkt "overifierat ordagrant mot originalet" i båda passen.
`firecrawl_scrape` rendrar JS och löser exakt den bristen. Detta är det
enda av de fem verktygen med ett redan skrivet, daterat, tvåfaldigt
registrerat behov.

### Composio (Rube)

**Vad:** mellanvara som exponerar 500+ tredjepartsappars (Gmail, Slack,
Notion, Linear, Airtable m.fl.) API:er som MCP-verktyg med färdig OAuth.
"Rube" är Composios egen hostade "universella MCP-server".

**Status:** bolaget är väletablerat ($29M totalt, $25M Series A,
Lightspeed, juli 2025; grundat 2023) men **Rube-servern själv är ung** —
lanserad 2025-08-22, ~1 år gammal. `ComposioHQ/rube`s GitHub-API-anrop gav
404 (repot verkar ha flyttats/döpts om) — stjärnantalet (~322, en
tredjepartsaggregators uppgift) kunde **inte** verifieras direkt av mig och
bokförs som overifierat.

**Tool-arkitektur — INTE hundratals verktygsdefinitioner.** Rube använder
ett meta-verktygs-mönster: `RUBE_SEARCH_TOOLS`, `RUBE_CREATE_PLAN`,
`RUBE_MULTI_EXECUTE_TOOL`, `RUBE_REMOTE_WORKBENCH` — **4 meta-verktyg**
som dynamiskt söker och exekverar bland de 500+ underliggande
app-åtgärderna server-side (`composio.dev/content/rube-mcp-solving-context-overload`,
hämtad 2026-09-04). Låg token-kostnad i verktygsdefinitions-lagret, men
flyttar kostnaden till extra tur-och-retur (sök → planera → exekvera) per
uppgift — en annan avvägning än en direktladdad server, **inte mätt av mig
kvantitativt** (ingen oberoende benchmark hittad).

**Pris** (förstapart `composio.dev/pricing`, hämtad direkt 2026-09-04):
Free $0/mån, **100 000 tool calls/mån**, 50 000 trigger-events/mån,
obegränsade kopplade konton, 3 teammedlemmar, 1M LLM-tokens/mån, inget
kort krävs. Pro $29/mån + användning. **En tredjepartsaggregator påstod
20 000 calls/mån gratis — förstapartssidan sade 100 000; illustrerar
varför förstaparts-verifiering spelar roll här.**

**Registrerat behov: svagare än Marcus antar.** `T93` (AI-assistent i
admin-appen) är den närmaste träffen — Composios värde (verktygsintegration
för en AI-agent) matchar T93s "verktygen, inte chatten"-mönster PRINCIPIELLT.
Men två saker gör kopplingen svag: (1) T93s stack-kandidat är **Vercel AI
SDK** körande i den SKEPPADE appen, inte en Claude Code MCP-server — helt
annan runtime; (2) för ORKESTRERAR-/agent-arbetssättet (frågan som faktiskt
ställdes) finns inget registrerat behov — allt Composio skulle lägga till
(Gmail, Slack, Notion, Linear …) har ingen tråd eller inget kort som
efterfrågar det. Detta är Marcus egen "bygg för framtiden"-ram, och
`ADR-106` talar direkt emot den: *"ingen abstraktion utan faktisk nuvarande
användare"*.

### Chrome DevTools MCP

**REDAN KONFIGURERAT** (användarnivå, se § Konfigurerat läge). Förstapart
(ChromeDevTools/Google Chrome DevTools-teamet). Repo: **50 868 stjärnor,
Apache-2.0, pushad 2026-09-04** (samma dag — mätt via GitHub API) — det
mest etablerade/högst-förtroende verktyget av de fem, med bred marginal.
Auth: ingen — talar CDP mot en lokal Chrome-instans, startar den vid
behov. Pris: **gratis** (lokalt verktyg, inga API-kostnader) — det enda av
de fem utan löpande marginalkostnad.

**Mätt gap mot uppströms:** denna sessions verktygslista har **29**
`mcp__chrome-devtools__*`-verktyg. `docs/tool-reference.md` på GitHubs
main-gren (hämtad 2026-09-04) listar **~50 verktygsnamn** i nio kategorier
— vår installerade version saknar bl.a. `screencast_start/stop`,
`click_at`, hela Memory-kategorin (13 heapsnapshot-verktyg), Extensions (5)
och `execute_3p_developer_tool`. **Orsaken till gapet är INTE fastställd**
(äldre pinnad version kontra medveten konfigurationsbegränsning) — flaggat
öppet i § F.

**Jämfört med Playwright MCP (också redan konfigurerat, 24 verktyg denna
session):** reellt delvis överlapp (navigering, klick, skriv, skärmdump,
konsol — bekräftat av ≥4 oberoende 2026-jämförelseartiklar:
`trackingplan.com`, `test-lab.ai`, `mcp.directory`, `stevekinney.com`), men
Chrome DevTools MCP är det ENDA av de två som exponerar riktiga
prestanda-spårningsprimitiv (`performance_start_trace`,
`performance_stop_trace`, `performance_analyze_insight`,
`lighthouse_audit`) — Playwright MCP saknar dessa helt. **Inte
redundans.** Marcus instinkt att verktyget "ger nytta direkt" stämmer, och
det är redan installerat och redan rätt verktyg för prestandaarbete
(relevant för t.ex. `docs/research/pdf-scrollprestanda-pdfium-chrome-2026-08-22.md`-
klassen), skilt från Playwrights roll (funktionell interaktions-QA).

### Higgsfield

**Vad:** AI-bild/video-generering — 30+ modeller (Sora, Veo, Kling, Cinema
Studio, Soul m.fl.), upp till 4K/15 sekunder.

**Status:** officiell MCP-server EXISTERAR (`https://mcp.higgsfield.ai/mcp`,
bekräftat på `higgsfield.ai/mcp`, hämtad 2026-09-04) — men **minst tre
oberoende, tredjeparts-underhållna MCP-servrar för samma plattform** ligger
parallellt på GitHub (`geopopos/higgsfield_ai_mcp`,
`WinstonJunCong/cgl-higgsfield` — "31 tools, 63 models, unlimited mode",
`jfikrat/higgsfield-mcp`). Ett verkligt supply-chain-förvirringsrisk: den
som följer en blogglänk i stället för att verifiera endpointen kan installera
en oreviderad community-server av misstag.

**Auth:** kontobaserad inloggning, inga API-nycklar att hantera (enligt
`higgsfield.ai/mcp`).

**Pris:** kreditbaserat, kopplat till befintliga Higgsfield-planer.
Förstapartens egen prissida (`higgsfield.ai/pricing`) är **JS-renderad och
gav ingen extraherbar prisinformation via WebFetch** — samma felklass våra
egna research-pass redan dokumenterat för Material 3/Apple HIG (se § Vad
jag redan hade). Tredjepartssyntes, INTE verifierad ordagrant: Starter
$19/mån 270 krediter, Plus $59/mån 1 200, Ultra $129/mån 3 000, ingen
rullning. Ett inlägg från Higgsfields eget X-konto (hittat via sökning,
äktheten inte oberoende verifierad av mig utöver sökträffen) beskriver en
tidsbegränsad kampanj: "100 gratis krediter + 3 dagars full MCP-åtkomst",
kräver kortuppgifter i kassan, **förnyas automatiskt till en betald
Plus-plan om den inte avbokas inom 24 timmar.** En reell faktureringsrisk
om verktyget provas oreflekterat.

**Registrerat behov: inget hittat.** Global `CLAUDE.md` § Lärpreferenser
("lär sig bäst genom … att skapa instruktionsvideos och manualer") är den
enda tänkbara kopplingen, men Higgsfield är ett GENERERINGS-verktyg — det
spelar inte in vad en agent eller Marcus faktiskt GÖR i appen, vilket är
vad en instruktionsvideo kräver. Chrome DevTools MCP har redan
skärmdumps-/screencast-primitiv (om den senare versionen installeras, se
ovan) och skillen `guide-builder` finns redan för wizard-format-guider.
Ingen tråd i `tasks/threads/` efterfrågar AI-genererat videoinnehåll.

## B. Risker

**1. Prompt injection in i en skrivbehörig agent — den enskilt största
risken, mekaniskt verifierad.** `disallowedTools` är en denylist (§ Vad
jag redan hade, punkt 1): en ny MCP-server installerad på användarnivå når
`bygg-agent` (git-skriv + push) automatiskt om ingen uttryckligen
utesluter den. Apify och Firecrawl hämtar godtyckligt externt innehåll som
blir en del av agentens kontext. Anthropics egen MCP-dokumentation
(`code.claude.com/docs/en/mcp`, hämtad 2026-09-04) varnar rakt ut:
*"Servers that fetch external content can expose you to prompt injection
risk."* Oberoende forskning (Johns Hopkins/Aonan Guan, april 2026, refererad
via Checkmarx/Practical DevSecOps-syntes) demonstrerade att injicerade
instruktioner i GitHub PR-titlar kaprade Claude Code, Gemini CLI och GitHub
Copilot. Våra egna hookar (`deny-resend-send.sh`, `deny-prod-ref.sh` m.fl.)
skyddar mot KÄNDA farliga kommandomönster — de kan strukturellt INTE skydda
mot "agenten luras att skriva skadlig kod i en fil och committa den", för
det är en semantisk handling, inget kommandomönster en hook kan mönster-
matcha.

**2. Hemlighetshantering.** Apify (API-token), Firecrawl (API-nyckel),
Composio (OAuth per app), Higgsfield (kontoinloggning) kräver alla
credentials i `~/.claude.json` → `mcpServers.<namn>.env` — samma mekanism
som befintliga `airtable.env.AIRTABLE_API_KEY` (redan flaggad i
`docs/reference/atkomst-och-nycklar.md` som en token som når PROD med
`create`-behörighet). Anthropics egen vägledning: committa aldrig
hemligheter i projektnivåns `.mcp.json` (vi har ingen — bra utgångsläge),
använd `${ENV_VAR}`-expansion, OAuth lagras i systemnyckelringen där det
går. **Composios OAuth-per-app-modell är den säkraste av de fyra betalda
verktygen på denna punkt** — ingen statisk långlivad token i vår config
(SOC2-påståendet är tredjepartsrapporterat via Rubes README, inte
oberoende reviderat av mig).

**3. Tokenkostnad för verktygsdefinitioner.** Baslinjen redan i poolen:
71 verktyg (§ Konfigurerat läge). Firecrawl lägger till **≈20+** om allt
laddas — en betydande kontext-kostnad per session för en roll (research-pass)
som inte anropar det varje tur, samma mönster som L8-korpusens GitHub-MCP-
fynd (3× tokenkostnad mot CLI). Apifys default-set (5) är AXI-vänligt redan
i grundläget. Composio/Rube är lättast i MCP-definitions-lagret (4
meta-verktyg) men flyttar kostnaden till fler tur-och-retur — en avvägning,
inte en besparing, och **inte mätt av mig**. Chrome DevTools MCP:
inkrementell kostnad noll, redan betald.

**4. Supply chain.** Apify (etablerat bolag sedan 2015, förstapart,
5 905★, MIT), Firecrawl (YC/Series A-finansierat, förstapart, 7 390★, MIT),
Composio (väletablerat bolag, förstapart, Rube ~1 år), Chrome DevTools MCP
(Google, 50 868★, Apache-2.0 — högst förtroende med bred marginal) — alla
rimligt legitima. **Higgsfield är avvikaren:** flera oofficiella
tredjeparts-servrar konkurrerar synligt med den officiella. Generella
MCP-ekosystemrisker dokumenterade i 2026-syntes (Checkmarx, Practical
DevSecOps): "rug pulls" (servern byter ett godkänt verktygs beteende tyst
i efterhand), tool shadowing, tool poisoning (~5,5 % av 1 899 undersökta
servrar enligt en akademisk studie, Hasan m.fl. 2025 — refererad via
sökresultat, **inte verifierad av mig mot originalpapperet**).

## C. Jämfört med CLI-alternativ (AXI-principen)

**Vårt eget repo har redan konvergerat på AXI-principen, oberoende av Kun
Chen.** `.claude/agents/review-agent.md` rad 44: *"Föredra `gh`/`git show`
framför ett kvarvarande MCP-verktyg"* — en empirisk bekräftelse inifrån vår
egen praxis, inte bara ett externt benchmark.

- **Apify:** har `apify-cli` (npm, förstapart, `apify/apify-cli`) —
  `apify call <actor> --input=…` speglar AXI direkt. För en enstaka
  research-pass-skrapning är CLI:t sannolikt billigare än MCP-rundturen
  (**inte mätt specifikt för Apify** — extrapolerat från GitHub-MCP-
  precedentet, en hypotes, inte ett bevis).
- **Firecrawl:** har BÅDE ett REST-API (`curl -X POST
  https://api.firecrawl.dev/v2/scrape`) OCH ett dedikerat `firecrawl-cli`
  npm-paket (`firecrawl/cli`, "CLI and Agent Skill for Firecrawl"). Två
  icke-MCP-vägar finns redan. MCP-serverns värde ligger i att AGENTEN
  själv väljer att anropa den autonomt — inte i att lösa en enstaka
  skrapning billigare (samma resonemang Kun Chen själv för: mät
  verktygets effektivitet innan det ges till agenten).
- **Composio:** har en egen CLI (`composio tools list/search/info`,
  Bun+Effect) — men CLI:t löser inte kärnproblemet MCP-formen finns till
  för (autonom, OAuth-medierad handling över många tredjepartsappar).
  Adopteras Composio någonsin är MCP/Rube-formen den enda som matchar dess
  faktiska värdeerbjudande.
- **Chrome DevTools MCP mot Playwright MCP:** se § A — reellt
  differentierat, inte redundant.
- **Higgsfield:** har både en CLI (`higgsfield.ai/cli`, nämnd i sökträffar
  men **inte oberoende hämtad/verifierad av mig**) och en MCP-server — men
  frågan är moot givet § A:s "inget registrerat behov".

## D. Kandidat-placeringar (kandidater — Marcus äger beslutet)

1. **Firecrawl i `research-pass`, snävt scopat.** Löser det tvåfaldigt
   dokumenterade WebFetch/JS-SPA-gapet. Kostnad: gratis-nivåns 1 000
   krediter/mån räcker sannolikt för sporadiska dokumentationsslagningar.
   Risk: MEDEL — externt innehåll in i en agent som bara skriver till
   `docs/research/` och aldrig committar/pushar (begränsar värsta
   scenariot) — MEN endast om den uttryckligen utesluts ur `bygg-agent`s
   pool via ett tillägg i dess `disallowedTools`, eftersom
   denylist-arvet annars ger den dit ändå.
2. **Chrome DevTools MCP — ingen ny installation, processfråga.**
   Säkerställ att `bygg-agent`s prestandaverifiering (t.ex.
   `pdf-scrollprestanda`-klassen) faktiskt anropar
   `performance_start_trace`/`lighthouse_audit` i stället för att Marcus
   kör DevTools manuellt i webbläsaren. Kostnad: noll inkrementell. Risk:
   ingen ny.
3. **Apify — smal, spekulativ kandidat.** Om `T79` (custom miranon.se)
   eller ett framtida konkurrent-/marknadsresearch-pass någonsin behöver
   massskrapning bortom en enskild sida (Firecrawls sweet spot) är Apifys
   actor-katalog differentieraren. Inget registrerat behov triggar detta
   idag — bokmärk, installera inte. Kostnad: $5/mån gratisnivå. Risk:
   LÅG-MEDEL, samma klass som Firecrawl, samma begränsning (research-pass
   enbart).
4. **Composio/Rube — avrådes för orkestrerar-/agent-arbetssättet idag.**
   `ADR-106` talar direkt emot att installera "för framtiden" utan en
   faktisk nuvarande användare. Tas `T93` upp senare bör Composio
   utvärderas DÅ mot Vercel AI SDK:s eget verktygsanropsmönster — inte
   förinstalleras i Claude Code spekulativt nu.
5. **Higgsfield — avrådes.** Inget registrerat behov; befintliga verktyg
   (skärmdump/screencast via Chrome DevTools MCP + `guide-builder`-skillen)
   täcker den enda tänkbara kopplingen (instruktionsvideor) bättre än
   filmisk AI-videogenerering. Faktureringsrisken på "gratis"-kampanjen är
   en extra varningsflagga om verktyget ändå provas.
6. **Mekanisk hygien-kandidat, oberoende av vilka verktyg som väljs.**
   Uppdatera `disallowedTools`-frontmatter i `bygg-agent.md`,
   `research-pass.md` OCH `review-agent.md` I SAMMA ändring som varje ny
   MCP-server läggs till på användarnivå — dagens rena denylist-mönster
   betyder att en ny server annars tyst når alla tre agenter, exakt
   motsatsen till dagens medvetet nedskurna pooler (`airtable`,
   `chrome-devtools`, `playwright`, `context7`).
7. **T159 (Elfsight-driftdetektor) — testad explicit, ändrar inte
   avvägningen.** `T159`s bortval vilar på att den återstående vinsten
   (1 rad → 0 rader) inte motiverar ett löpande beroende av en oofficiell
   endpoint vi inte styr. Firecrawl/Apify tar inte bort den underliggande
   sköraheten — de LÄGGER TILL ett externt beroende (skraptjänstens egen
   drifttid) ovanpå den redan flaggade risken. Slutsats: verktygen ändrar
   inte `T159`s kalkyl; bortvalet står.

## E. Rekommenderad installationsordning och scope

1. **Firecrawl först** — det enda verktyget med ett skrivet, daterat,
   tvåfaldigt registrerat behov. Användarnivå (matchar det redan etablerade
   mönstret — `chrome-devtools`/`playwright`/`airtable`/`context7` ligger
   alla där, inget i `.mcp.json` på projektnivå), API-nyckel som miljövariabel,
   scopat till `research-pass` via en explicit `disallowedTools`-post i
   `bygg-agent.md` och `review-agent.md`.
2. **Chrome DevTools MCP** — ingen åtgärd krävs (redan installerat).
   Överväg att uppdatera till den nyare verktygsuppsättningen (screencast,
   minnesdetalj, extensions) om `bygg-agent`s prestandaarbete skulle dra
   nytta — låg prioritet, orsaken till versionsgapet är inte fastställd
   (§ F).
3. **Apify** — defer till ett konkret behov uppstår; adopteras den senare,
   samma research-pass-enbart-scoping som Firecrawl.
4. **Composio, Higgsfield** — installera inte. Omprövas bara när `T93`
   (Composio) eller ett konkret videoinnehålls-behov (Higgsfield) faktiskt
   plockas upp som en avgränsad arbetsenhet, per `ADR-106`s princip om
   ingen abstraktion utan nuvarande användare.

**Scope-mekanik, sidoobservation (utanför frågans kärna men värd att
bokföra):** MCP-servrar konfigurerade i `~/.claude.json` på användarnivå
gäller GLOBALT för varje Claude Code-projekt på maskinen, inte bara
`miranon-media-admin` — precis som alla nuvarande servrar redan gör. Det
är en avvägning Marcus bör väga (gäller kostnaden/risken repo-brett?) som
INTE ingick i uppdraget och därför inte är fullt utredd här.

**MCP-ytan bestäms vid sessionsstart** (`CLAUDE.md` § hookar/MCP-analog):
en installation nu i `~/.claude.json` slår igenom först i en session som
STARTAR efter installationen — den löpande orkestrerar-sessionen (och
subagenter den redan spawnat) ser den inte, samma mönster som redan
dokumenterat för hook-registrering mitt i en session.

## F. Vad som INTE besvarades

- **Ingen intern precedent alls** för något av de fem verktygen fanns
  före detta pass (repo-brett grep, noll träffar) — genuint ny mark.
- **Ingen branschprecedent-genomgång** ("3+ branschledar-projekt") gjordes
  för något av de fem specifikt — jag undersökte inte hur andra
  multi-agent-Claude-Code-uppsättningar (t.ex. FirstMate-klassen ur
  L8-korpusen) har eller inte har adopterat Apify/Firecrawl/Composio i sina
  egna verktygspooler. Deklareras öppet som tunt/frånvarande, ej fyllt med
  en gissning.
- **Composios exakta appkatalog (500+) och SOC2-påstående** kommer från
  Composios egen marknadsföringstext (Rube-README) — inte oberoende
  reviderat av mig.
- **Higgsfields officiella MCP-lanseringsdatum ("30 april 2026")** kommer
  från en WebSearch-syntes av sekundärt blogginnehåll, inte en primär
  changelog jag själv hämtat — overifierat.
- **Ingen empirisk token-/latensmätning** gjordes för något av de fyra nya
  verktygen på det sätt L8-korpusen mätte GitHub-MCP mot `gh` (3×/2×). Jag
  räknade verktygsNAMN (en proxy, inte en tokenmätning) och rapporterade
  leverantörs-/community-påståenden. En verklig mätning (ladda varje
  server, diffa kontextfönstrets tokenförbrukning före/efter) var utanför
  detta pass' scope och är den enskilt mest värdefulla NÄSTA mätningen om
  Marcus vill adoptera något av dem.
- **Ingen av de fem servrarna testades skarpt** — inget installerades
  eller konfigurerades, per uppdraget (research-pass, ingen kod/config
  rörd).
- **Chrome DevTools MCP:s exakta installerade-mot-uppströms-gap** (29 mot
  ~50 verktyg) är mätt, men VARFÖR gapet finns (äldre pinnad version kontra
  medveten konfigurationsbegränsning) är inte fastställt.
- **`ComposioHQ/rube`s stjärnantal** (~322, tredjepartskälla) kunde inte
  verifieras direkt mot GitHub API (404 — repot verkar flyttat/omdöpt).

## Dom

**Ja, arbetssättet kan förbättras — men bara av ETT av de fem verktygen
idag, och installationen kräver en samtidig ändring av tre agentfiler för
att inte tyst utvidga `bygg-agent`s attackyta.** Firecrawl löser ett
verkligt, redan två gånger dokumenterat hål (WebFetch mot JS-renderade
SPA:er) och bör scopas till `research-pass`. Chrome DevTools MCP är redan
installerat, redan rätt verktyg, och inte redundant med Playwright MCP —
ingen åtgärd behövs mer än att använda det medvetet vid prestandaarbete.
Apify är en rimlig men i dag ogrundad kandidat — spara den till ett
konkret behov. Composio och Higgsfield saknar båda ett registrerat behov i
vårt orkestrerar-/agent-arbetssätt; `ADR-106` talar direkt mot att
installera dem "för framtiden", och Higgsfields tredjeparts-server-
proliferation plus "gratis"-kampanjens auto-förnyelse är konkreta
varningsflaggor om de ändå provas privat av Marcus utanför detta arbetsflöde.

## Källförteckning

- [`code.claude.com/docs/en/sub-agents`](https://code.claude.com/docs/en/sub-agents) — hämtad 2026-09-04 (disallowedTools = denylist, mekaniskt bevisat)
- [`code.claude.com/docs/en/mcp`](https://code.claude.com/docs/en/mcp) — hämtad 2026-09-04 (prompt injection-varning, hemlighetshantering, tool output-gränser)
- [`docs.apify.com/integrations/mcp`](https://docs.apify.com/integrations/mcp) — hämtad 2026-09-04
- [`apify.com/pricing`](https://apify.com/pricing) — hämtad 2026-09-04
- [GitHub API: `apify/apify-mcp-server`](https://api.github.com/repos/apify/apify-mcp-server) — mätt 2026-09-04
- [`firecrawl.dev/pricing`](https://www.firecrawl.dev/pricing) — hämtad 2026-09-04
- [GitHub: `firecrawl/firecrawl-mcp-server` README](https://raw.githubusercontent.com/firecrawl/firecrawl-mcp-server/main/README.md) — hämtad 2026-09-04
- [GitHub API: `firecrawl/firecrawl-mcp-server`](https://api.github.com/repositories/899407931) — mätt 2026-09-04
- [`composio.dev/pricing`](https://composio.dev/pricing) — hämtad 2026-09-04
- [`composio.dev/content/rube-mcp-solving-context-overload`](https://composio.dev/content/rube-mcp-solving-context-overload) — hämtad 2026-09-04
- [GitHub: `ComposioHQ/Rube`](https://github.com/composiohq/rube) — sökträff 2026-09-04, README ej oberoende hämtat
- [GitHub: `ChromeDevTools/chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp) — hämtad 2026-09-04
- [GitHub API: `ChromeDevTools/chrome-devtools-mcp`](https://api.github.com/repos/ChromeDevTools/chrome-devtools-mcp) — mätt 2026-09-04
- [`tool-reference.md`, ChromeDevTools/chrome-devtools-mcp main](https://raw.githubusercontent.com/ChromeDevTools/chrome-devtools-mcp/main/docs/tool-reference.md) — hämtad 2026-09-04
- [`higgsfield.ai/mcp`](https://higgsfield.ai/mcp) — hämtad 2026-09-04
- [`higgsfield.ai/pricing`](https://higgsfield.ai/pricing) — hämtad 2026-09-04 (JS-renderad, gav ingen prisinformation)
- [Trackingplan: Chrome DevTools MCP vs Playwright MCP](https://www.trackingplan.com/blog/chrome-devtools-mcp-vs-playwright-mcp-digital-analysts) — sökträff 2026-09-04
- [test-lab.ai: Chrome DevTools MCP vs Playwright MCP vs Playwright CLI](https://www.test-lab.ai/blog/chrome-devtools-mcp-vs-playwright-mcp-cli) — sökträff 2026-09-04
- [Aptible: Prompt Injection in MCP](https://www.aptible.com/mcp-security/mcp-prompt-injection) — hämtad 2026-09-04
- [Checkmarx: MCP Security](https://checkmarx.com/learn/mcp-security-risks-real-world-incidents-and-security-controls/) — sökträff 2026-09-04
- [Practical DevSecOps: MCP Security Vulnerabilities 2026](https://www.practical-devsecops.com/mcp-security-vulnerabilities/) — sökträff 2026-09-04
- [`docs/research/l8-workflow-kartlaggningen-2026-08-09.md`](l8-workflow-kartlaggningen-2026-08-09.md) — internt, AXI-principen, GitHub-MCP-mätningen
- [`docs/research/agent-autonomi-eskaleringsdesign-2026-07-29.md`](agent-autonomi-eskaleringsdesign-2026-07-29.md) — internt, WebFetch-begränsningen (första träffen)
- [`docs/research/forberedelseskarm-splash-branschmonster-2026-08-16.md`](forberedelseskarm-splash-branschmonster-2026-08-16.md) — internt, WebFetch-begränsningen (andra träffen)
- [`ADR-106`](../decisions/ADR-106-agnostik-snittet-harness-neutral-karna-harness-djup-drivning.md) — internt, agnostik-snittet
- [`ADR-107`](../decisions/ADR-107-reproducerbarhets-malet-lattviktsvagen-fore-nix.md) — internt, reproducerbarhet (perifert relevant)
- [`docs/reference/atkomst-och-nycklar.md`](../reference/atkomst-och-nycklar.md) — internt
- [`tasks/threads/T159-driftdetektor-mot-elfsight-kalendern.md`](../../tasks/threads/T159-driftdetektor-mot-elfsight-kalendern.md) — internt
- [`tasks/threads/T167-mcp-ytan-kan-inte-skriva-skript-steg-i-airtable-automationer.md`](../../tasks/threads/T167-mcp-ytan-kan-inte-skriva-skript-steg-i-airtable-automationer.md) — internt
- [`tasks/threads/T141-downloads-atkomsten-forsvann-mellan-tva-claude-code-versioner.md`](../../tasks/threads/T141-downloads-atkomsten-forsvann-mellan-tva-claude-code-versioner.md) — internt (WebFetch-liknande felklass, ej direkt relevant men läst)
- [`tasks/threads/T79-custom-miranon-se-webbplats-app-samverkan-marcus.md`](../../tasks/threads/T79-custom-miranon-se-webbplats-app-samverkan-marcus.md) — internt
- [`tasks/threads/T93-ai-assistent-i-admin-appen-marcus-vision-hittills-helt.md`](../../tasks/threads/T93-ai-assistent-i-admin-appen-marcus-vision-hittills-helt.md) — internt
- [`.claude/agents/bygg-agent.md`](../../.claude/agents/bygg-agent.md), [`research-pass.md`](../../.claude/agents/research-pass.md), [`review-agent.md`](../../.claude/agents/review-agent.md) — internt
