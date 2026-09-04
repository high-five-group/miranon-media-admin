---
owner: marcus803
updated: 2026-08-04
review_by: 2027-02-04
status: draft
---

# `ask` eller `deny` — och varför förstår Marcus knappt meddelandet? (Code, 2026-08-04)

> **Proveniens:** avgränsat research-pass beställt av orkestreraren efter att
> Marcus ifrågasatte ett designval i Session 97: *"Jag fick en fråga innan vi
> designade Hooks:en om vi skulle köra på 'ask' eller om det skulle ske
> automatiskt, du föreslog 'ask' men nu vet jag inte om de var rätt val. Dels
> är jobbigt att få de där frågorna och dels så förstår jag ju knappt det som
> står där."* (Marcus, 2026-08-04, verbatim ur uppdraget). Passet besvarar två
> delfrågor: (1) `ask` eller `deny` per mekanism, enligt vilket kriterium, och
> (2) varför meddelandena är obegripliga och hur de ska skrivas om. Inget
> byggt, inget ändrat — rent beslutsunderlag.

## Kort svar

**Nuvarande fördelning är i sak rätt, av rätt skäl — men den var aldrig
förklarad för Marcus i begriplig form, och det är det som faktiskt gick
sönder.** Kriteriet som avgör `ask` vs `deny` är inte "hur allvarligt är
felet" utan **"finns falska positiva, och vad kostar en felaktig blockering
jämfört med vad kostar en missad blockering?"** Tre av repots fyra
S97-mekanismer bygger på heuristik som KAN ta fel (git-katalog-ägarskap via
textmönster, pipe-detektion via regex) — där är `ask` rätt, eftersom en
felaktig hård blockering låser fast arbete på falska grunder, medan skadan
av att missa en sann positiv är återställbar. Den fjärde (Resend-mail-låset)
har en i det närmaste kategorisk träffbild och en skada som är irreversibel
(ett skickat mail) — där är hård `deny` rätt, vilket repot redan gör.
`stop-vakt.sh` är inte en del av samma beslutsrymd alls: den är en
`Stop`-hook, inte `PreToolUse`, och den frågar aldrig Marcus något — den
tvingar AGENTEN att ompröva sitt eget avslutspåstående.

**Den andra halvan av problemet är fristående från `ask`/`deny`-valet.**
Claude Codes egen dokumentation slår fast att fältet `permissionDecisionReason`
visas **direkt för användaren, ordagrant**, när beslutet är `ask` — det är
alltså bokstavligen den teknik-tunga texten (`"ADR-090 beslut 2"`, `"L440"`,
`"S96 Del 8"`) Marcus möter i prompten, inte en sammanfattning av den. Det är
en text skriven för nästa Code-session att förstå kontext, återanvänd
oförändrad som gränssnitt mot en människa utan teknisk bakgrund. Det bryter
husets egen Gunilla-princip, och lösningen är att skriva om
`permissionDecisionReason` i tre steg — vad hände, varför det spelar roll, vad
du ska göra — oavsett vilket beslut (`ask` eller `deny`) hooken fattar.

## Delfråga 1 — `ask` eller `deny`: vad säger Claude Codes egen dokumentation

**Auktoritativ förstapartskälla:** [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks)
§ PreToolUse, och [code.claude.com/docs/en/hooks-guide](https://code.claude.com/docs/en/hooks-guide)
(båda hämtade 2026-08-04).

### De fyra värdena, ordagrant

> `permissionDecision` — `"allow"`, `"deny"`, `"ask"`, or `"defer"`. `"allow"`
> skips the permission check. `"deny"` blocks the tool. `"ask"` escalates to
> the user. `"defer"` falls through to the normal permission flow.
>
> `"allow"`: skip the interactive permission prompt. Deny and ask rules,
> including enterprise managed deny lists, still apply...
> `"deny"`: cancel the tool call and send the reason to Claude
> `"ask"`: show the permission prompt to the user as normal

`"defer"` gäller bara i headless-läge (`-p`-flaggan) och är irrelevant för
repots interaktiva hook-yta.

**Kombinationsregeln** (flera hookar på samma verktygsanrop): mest
restriktiva beslut vinner, i ordningen `deny` > `defer` > `ask` > `allow`. En
enda `deny` från valfri hook blockerar, oavsett vad andra hookar svarar.

### Vem ser vad — det centrala faktumet för Fråga 2

Detta är exakt citerat ur referensdokumentationens fälttabell för
`PreToolUse`-beslutskontroll:

> `permissionDecisionReason` — Human-readable message shown **to Claude when
> denying, or to the user when asking**. Not shown when allowing or
> deferring.

Och separat, samma tabell:

> `systemMessage` — Warning message shown to the user.

Det här ger ett fältkontrakt som inte är intuitivt utan att läsa
dokumentationen ordagrant, och som förklarar Marcus upplevelse fullt ut:

| Beslut | Vem ser `permissionDecisionReason`? | Extra fält för människan |
|---|---|---|
| `deny` | Claude (modellen) — inte primärt Marcus | `systemMessage` finns för att ändå nå Marcus |
| `ask` | **Marcus, ordagrant, i permission-prompten** | `systemMessage` kan komplettera |
| `allow` | Ingen (fältet visas inte) | `systemMessage` |

Alla fyra S97-hookars `fraga()`-funktioner bygger `permissionDecisionReason`
som en tät logg-rad avsedd att ge en FRAMTIDA Code-session (eller Claude
självt) full kontext — den skrevs för en läsare som redan kan begreppen
`ADR-090`, `git-skrivning`, `S96 Del 8`. När beslutet är `ask` blir precis den
texten Marcus enda beslutsunderlag i prompten. Ingen omskrivning för
människan sker någonstans i kedjan. Det är alltså inte ett fel i `ask` som
mekanism — det är att samma sträng återanvänds för två läsare med helt olika
förkunskap, vilket är precis vad Gunilla-principen (CLAUDE.md, hub) säger
aldrig ska hända.

### Finns dokumenterad vägledning om NÄR man ska välja `ask` vs `deny`?

**Nej — inte hittad.** Dokumentationen definierar semantiken exakt (tabellen
ovan) men innehåller ingen sektion av typen "choose ask when X, deny when Y".
Kriteriet i detta pass § Dom är därför HÄRLETT ur (a) hur repots egna
S97-hookar redan motiverade sina val i sina filhuvuden och i `ADR-090`, och
(b) branschmönstret i § Delfråga 3 nedan — inte citerat från en Anthropic-sida
som säger det rakt ut. Detta är en öppen lucka, inte en gissning maskerad som
fakta.

## Delfråga 2 — mätning: fungerar `ask`-vägen tillförlitligt i vår faktiska drift?

`docs/decisions/ADR-090-sessions-parallellitet-detektera-och-fraga.md` (§
Updates, 2026-08-04) flaggar öppet en "KÄND RISK": att JSON-baserad
`ask`/`deny`-utdata har "en dokumenterad opålitlighets-instans" i
`github.com/anthropics/claude-code/issues/37210`, gällande `Edit`-verktyget,
"INTE motbevisad för Bash".

**Detta pass läste själva GitHub-ärendet i stället för att bara citera dess
existens** ("mät hellre än citera") — `gh issue view 37210 --repo
anthropics/claude-code`. Resultatet nyanserar risken väsentligt:

Ärendet är **stängt av rapportören själv**, med denna förklaring (ordagrant,
2026-03-21):

> "Update: resolved on our side — exit code was the issue. ... 1. Exit code 2
> is treated as a hook crash, not a denial. Claude Code expects exit code
> **0** for both allow and deny. ... 2. Missing `hookSpecificOutput` wrapper.
> ... After fixing both — exit 0 + `hookSpecificOutput` wrapper — deny
> enforcement works correctly across all tool types (Read, Edit, Bash,
> Write). ... Closing this as the issue was in our implementation, not in
> Claude Code."

Med andra ord: buggen var att rapportörens hook blandade de två ömsesidigt
uteslutande vägarna (JSON-utdata OCH `exit 2` samtidigt) — exakt det
dokumentationen varnar för explicit: *"Use exit 2 to block with a stderr
message, or exit 0 with JSON for structured control. Don't mix them: Claude
Code ignores JSON when you exit 2."* Det var alltså aldrig en
plattformsbugg i JSON/`ask`-vägen.

**Verifierat mot våra egna skript:** `deny-frammande-huvudkatalog.sh` och
`deny-grind-genom-pipe.sh` (de två som returnerar `ask`) gör exakt det
korrekta mönstret — `jq -nc '{...}' ; exit 0` (rad 91–100 respektive 65–74 i
respektive fil). Ingen av dem blandar `exit 2` med JSON-utdata. Den citerade
"kända risken" i `ADR-090` gäller alltså **inte** vårt faktiska
implementationsmönster — det är en risk som redan är strukturellt undviken.
Detta bör bokföras som en rättelse i `ADR-090`, inte som en kvarstående
osäkerhet (se § Oväntade fynd).

Ett näraliggande ärende, `#33106` ("PreToolUse hook `permissionDecision`
'deny' not enforced for MCP server tool calls"), är fortfarande **stängt som
inaktivt, inte som löst** — reproduktionen där visar dock en annan
egen-orsakad bugg (en extra `echo`-rad skriven till stdout FÖRE JSON-blocket,
vilket korrumperar JSON-parsningen — samma felklass som dokumentationens egen
"JSON validation failed"-felsökningssektion beskriver för shell-profiler som
läcker text till stdout). Det gäller uttryckligen MCP-verktyg, inte Bash, och
ingen av de fyra S97-hookarna matchar mot MCP-verktyg med `ask`. Relevansen
för vår yta är därför låg, men inte noll — flaggas öppet.

**Slutsats för Delfråga 2:** `ask`-mekanismen är dokumenterat tillförlitlig
när mönstret (`exit 0` + `hookSpecificOutput`-wrapper, ingen blandning med
`exit 2`) följs — vilket båda våra `ask`-hookar redan gör. Den öppna,
obevisade frågan är inte JSON-tillförlitligheten utan
**hook-registrering-vid-sessionsstart** (redan dokumenterad separat i
`CLAUDE.md` § "En ny hook kan ALDRIG skarpbevisas...") — en annan mekanism,
inte samma risk.

## Delfråga 3 — branschmönstret: hård spärr vs mänskligt beslut

Frågan "`ask` eller `deny`" är inte unik för Claude Code. Tre etablerade
policy-gate-mönster besvarar den, och alla landar på **samma kriterium**:
skiljelinjen går på falska positiva × skadans reversibilitet, inte på hur
allvarligt det underliggande problemet känns.

### 1. Kubernetes admission-webhooks — `failurePolicy: Fail` vs `Ignore`

Källor: [Kubernetes-referensen för `ValidatingWebhookConfiguration`](https://dev-k8sref-io.web.app/docs/extend/validatingwebhookconfiguration-v1/),
[Gatekeepers egen "Failing Closed"-sida](https://open-policy-agent.github.io/gatekeeper/website/docs/failing-closed/).

`failurePolicy` styr inte policyns UTFALL (godkänn/neka) utan vad som händer
när webhooken själv INTE kan svara (timeout, nätverksfel). `Fail` nekar
API-anropet om webhooken är nere; `Ignore` släpper igenom som om webhooken
inte fanns. Branschrekommendationen är `Ignore` för icke-säkerhetskritiska
webhookar och `Fail` bara där policyn måste hålla oavsett kostnad — samma
avvägning som repots egna fail-open/fail-closed-val i S97-hookarnas filhuvuden
(`deny-frammande-huvudkatalog.sh` failar öppet på eget internt fel;
`deny-resend-send.sh` failar slutet). **Detta är en annan axel än
`ask`/`deny`** (den gäller infrastrukturfel, inte policybeslutet), men
strukturen — irreversibel skada kräver hårdare defaultval — är identisk.

Det som direkt speglar VÅR fråga är webhookens **svar** vid en äkta
policy-överträdelse: `AdmissionReview.response.status.message` är fältet vars
text visas för användaren i `kubectl`-felutskriften när ett anrop nekas.
Branschstandarden är alltså inte "neka tyst" utan **"neka med ett
människoläsbart skäl i klartext"** — vilket är exakt samma krav som
`permissionDecisionReason`/`systemMessage`-paret i Claude Code, och exakt det
kravet våra nuvarande meddelanden bryter mot (se § Delfråga 4).

### 2. OPA/Gatekeeper — `enforcementAction: deny` / `dryrun` / `warn`

Källa: [Gatekeepers officiella how-to](https://open-policy-agent.github.io/gatekeeper/website/docs/howto/)
och [violations-sidan](https://open-policy-agent.github.io/gatekeeper/website/docs/violations/).

Gatekeeper har tre lägen, inte två: `deny` (blockerar), `dryrun` (loggar,
blockerar aldrig — för att TESTA en ny policy innan den sätts skarp) och
`warn` (släpper igenom men bifogar en varning i API-svaret). Default är
`deny`. Den dokumenterade rekommendationen är att **nya** policyer alltid
börjar i `dryrun`, flyttas till `warn` när falsklarms-frekvensen är känd, och
går till `deny` sist, när träffbilden är bevisad ren. Det är precis samma
sekvens repot redan följer informellt: `deny-frammande-huvudkatalog.sh` och
`deny-grind-genom-pipe.sh` är NYA (S97, samma dag) och saknar ännu produktion-
mätt falsklarms-frekvens — `ask` är Gatekeepers `warn`-läge i praktiken (den
släpper aldrig igenom OM Marcus säger nej, men den travesterar inte
automatiskt). `deny-resend-send.sh` är den enda av de fyra med en KATEGORISK,
inte-förhandlingsbar policy (Rogers krav, noll undantag) — motsvarande
Gatekeepers `deny` för en redan bevisad, aldrig-legitima överträdelseklass.

### 3. Git-hookar — hård `exit 1`, men med en dokumenterad, kostsam nödutgång

Källor: [Adam Johnsons genomgång av att hoppa över git-hookar](https://adamj.eu/tech/2023/02/13/git-skip-hooks/),
[GeeksforGeeks om `--no-verify`](https://www.geeksforgeeks.org/git/how-to-skip-git-commit-hooks/).

Klient-sidans `pre-commit`-hookar kör hårt (`exit 1` stoppar commiten) men har
en inbyggd, KÄND nödutgång: `git commit --no-verify`. Detta är alltså inte
"hård spärr utan utväg" — det är hård spärr MED en explicit, synlig, av
utvecklaren medvetet vald utväg. Server-sidans `pre-receive`-hookar (som körs
vid push, inte vid commit) har INGEN sådan utväg — de är den faktiska sista
grinden, och branschmönstret är att lägga den irreversibla/kompatibilitets-
kritiska kontrollen där, inte i klient-hooken. Samma tvålagers-tänk som
repots eget mail-lås (`.claude/settings.json` `permissions.deny` som lager 1
tillsammans med `deny-resend-send.sh` som lager 2, dokumenterat i skriptets
eget filhuvud).

**Sammanfattat kriterium, konvergerat från alla tre familjer:** hård spärr
(`deny`/`Fail`/`exit 1` utan utväg) är rätt ENDAST när (a) policyn är bevisat
ren — inga kända falska positiva kvar i produktion — OCH (b) skadan av att
missa en sann positiv är irreversibel eller mycket dyr. Saknas endera
villkoret landar branschmönstret konsekvent på ett mellanläge med mänskligt
beslut (`warn`/`ask`/`dryrun`), aldrig på tyst släpp-igenom.

## Delfråga 4 — prompt-trötthet: är den mätt, och undergräver den `ask`?

Marcus konkreta oro — att frekventa prompts leder till reflexmässigt
godkännande, vilket skulle göra `ask` till ett skydd som bara SER ut som ett
skydd — är ett väldokumenterat, mätt fenomen i säkerhets-UX-forskningen.
Det är inte en åsikt; det är en av de mest replikerade effekterna i fältet.

- **Akhawe & Felt, "Alice in Warningland" (USENIX Security 2013,**
  [usenix.org](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/akhawe)**):**
  storskalig fältstudie, 25+ miljoner varningsvisningar i Chrome och Firefox.
  Klickgenom-frekvensen ("jag godkänner ändå") varierade kraftigt med
  varningstyp: cirka 70,2 % för Chromes SSL-varningar mot cirka 33 % för
  Firefox SSL-varningar samma period — samma UNDERLIGGANDE risk, olika
  gränssnitt, olika grad av reflexmässigt godkännande. Studien visar alltså
  att UTFORMNINGEN av prompten, inte bara dess FÖREKOMST, avgör om
  människan faktiskt läser den.
- **BYU/Vance et al., publicerad i *MIS Quarterly* 2018** (sammanfattad av
  [Schneier on Security](https://www.schneier.com/blog/archives/2018/06/the_habituation.html),
  primärkälla [neurosecurity.byu.edu](https://web.archive.org/web/20221122163422/https://neurosecurity.byu.edu/media/Vance_et_al._2017_MISQ.pdf)):
  fMRI- och ögonrörelse-mätningar visar att hjärnans respons på en
  säkerhetsvarning avtar redan efter 2–3 exponeringar för SAMMA varningsdesign
  — och att effekten replikerades i fält, inte bara i labb, mätt via
  faktiskt beteende (adherence) på deltagarnas egna mobiler över tid.
- **Chrome, "Introducing quieter permission UI for notifications"
  (blog.chromium.org, 2020-01-07,** [chromium-blogget](https://blog.chromium.org/2020/01/introducing-quieter-permission-ui-for.html)**):**
  Googles egen motivering för att bygga om hela prompt-flödet var att
  användare som upprepat nekar (eller ignorerar) en viss typ av prompt
  automatiskt flyttas till ett TYSTARE läge — en direkt, produktions-driven
  åtgärd mot samma mekanism, fast i den MOTSATTA riktningen (reflexmässig
  nekning/ignorering i stället för reflexmässigt godkännande). Kompletterande
  siffra ur samma forskningslinje ([research.google](https://research.google/pubs/shhhbe-quiet-reducing-the-unwanted-interruptions-of-notification-permission-prompts-on-chrome/)):
  notifikationsprompten stod för 74 % av alla behörighetsprompter men hade
  bara 10 % beviljande-frekvens på desktop — en hög FREKVENS av en LÅGVÄRDIG
  prompt-typ är precis det mönster som göder trötthet.

**Slutsats:** Marcus oro är korrekt och väl belagd — men den belägger ett
GENERELLT samband (fler exponeringar av SAMMA varningsform → sämre
uppmärksamhet), inte ett specifikt underkännande av `ask` som mekanism. De
mätta motmedlen i forskningen är exakt de två sakerna detta pass redan
rekommenderar: (1) HÅLL FREKVENSEN NERE genom smala, precisa triggers (redan
repots uttalade princip — `deny-grind-genom-pipe.sh`s filhuvud: "En bred
lista hade gjort hooken till en falsklarmsmaskin"), och (2) förbättra
INNEHÅLLET så varje prompt som väl visas faktiskt går att ta ställning till
på några sekunder (§ Delfråga 5). Ingen av de granskade källorna
rekommenderar "byt ask mot deny" som motmedel mot trötthet — snarare
tvärtom: Chrome-exemplet byggde ett TREDJE läge (tystare varning) i stället
för att hoppa till hård blockering.

## Delfråga 5 — hur ska ett meddelande skrivas för att Marcus ska förstå det på tre sekunder?

Grundfaktumet från § Delfråga 1 avgör formen: när beslutet är `ask` är
`permissionDecisionReason` den ENDA text Marcus ser i prompten (`systemMessage`
kan komplettera men ersätter den inte). Meddelandet måste därför själv bära
hela beslutsunderlaget, i tre led — vad hände, varför det spelar roll, vad du
ska göra — utan att luta sig mot kod-jargong, interna förkortningar
(`ADR-090`, `L440`, `S96 Del 8`) eller teknisk terminologi (`git-skrivning`,
`exitkod`, `pipe`) som en icke-teknisk läsare aldrig mött.

### Exempel 1 — `deny-frammande-huvudkatalog.sh` (KATALOGÄGARSKAP)

**Nuvarande text** (`scripts/deny-frammande-huvudkatalog.sh` rad 267, med
exempelvärden insatta):

> "KATALOGÄGARSKAP (ADR-090 beslut 2): kommandot är en git-skrivning (merge)
> mot huvudkatalogen /Users/marcus/Repon/miranon-media-admin —
> arbetskatalogen är huvudkatalogen — men huvudkatalogen ägs av en ANNAN
> session enligt ägarlappen (satt 2026-08-04T10:12:00Z). Regeln: den först
> startade sessionen behåller huvudträdet, den senare arbetar i en worktree.
> S96 Del 8 bröt detta tre gånger i ett pass."

**Föreslagen omskrivning:**

> "STOPP — en annan pågående Code-session äger huvudmappen just nu.
>
> Det Code vill göra: spara en ändring direkt i projektets huvudmapp — inte i
> sin egen säkra kopia.
>
> Varför det spelar roll: en ANNAN Code-session jobbar just nu i den mappen.
> Skriver båda samtidigt kan arbete krocka eller försvinna. Det har hänt
> tidigare samma dag.
>
> Vad du ska göra: godkänn bara om du VET att den andra sessionen är klar
> eller död (t.ex. kraschad igår). Neka annars — Code fortsätter då säkert i
> sin egen kopia i stället, utan att något går förlorat."

### Exempel 2 — `deny-grind-genom-pipe.sh` (L440)

**Nuvarande text** (`scripts/deny-grind-genom-pipe.sh` rad 136, med
exempelvärden insatta):

> "L440 — GRINDENS EXITKOD GÅR FÖRLORAD I PIPEN. Kommandot kör 'npm run
> typecheck' och pipar vidare: \"npm run typecheck | tail -20\". En pipe
> returnerar SISTA ledets exitkod, så en röd grind blir grön för skalet —
> och nästa steg (commit, push, armering) kör som om allt vore bra. ...
> Rätt former: kör grinden naket och läs exitkoden direkt · 'grind > fil;
> KOD=\$?' · 'if grind; then ...; else stanna; fi' · eller läs PIPESTATUS
> explicit. Är utdatan det enda du bryr dig om och exitkoden genuint
> ointressant — godkänn, men gör det medvetet."

**Föreslagen omskrivning:**

> "STOPP — ett kvalitetstest kan se godkänt ut även om det underkändes.
>
> Det Code vill göra: köra ett kvalitetstest men bara visa de sista raderna
> av resultatet.
>
> Varför det spelar roll: på det här sättet kan Code inte se om testet
> faktiskt GODKÄNDES eller UNDERKÄNDES — bara vad det skrev ut. Det har hänt
> flera gånger tidigare att ett underkänt test såg godkänt ut och koden gick
> vidare ändå.
>
> Vad du ska göra: neka om du vill vara säker på att testet verkligen gick
> igenom — Code kör då om det på ett sätt där resultatet syns tydligt.
> Godkänn bara om du VET att Code bara är ute efter texten, inte om testet
> gick igenom."

Båda omskrivningarna behåller den maskinläsbara identiteten (`ADR-090`,
`L440`) som en parentetisk fotnot i stället för som huvudtext, så
spårbarheten till källdokumentet inte går förlorad för en teknisk läsare som
senare granskar loggen — men den raden bär inte längre beslutet.

## Dom — rekommendation per mekanism

Kriteriet, uttalat en gång: **finns falska positiva i mekanismens egen
träffbild, och är skadan av en missad sann positiv återställbar?** Ja på
båda → `ask`. Nej på endera (ingen realistisk falsk positiv, ELLER skadan är
irreversibel/mycket dyr) → `deny`.

| Mekanism | Falska positiva möjliga? | Skadans natur | Rekommendation |
|---|---|---|---|
| `deny-frammande-huvudkatalog.sh` | **Ja** — ADR-090 § Beslut 2 nämner uttryckligen legitima undantag ("S97 kör själv i huvudkatalogen med kvittens"); textmönster-detektionen är dokumenterat approximativ (§ Scope-gränser i skriptet) | Fel FORM på en git-operation — S96 Del 8:s tre överträdelser gav "noll dataförlust" (ADR-090 § Updates) | **Behåll `ask`.** En hård spärr utan utväg hade låst legitimt arbete på en heuristik som bevisligen kan ta fel. |
| `deny-grind-genom-pipe.sh` | **Ja** — skriptets eget filhuvud: "Det finns ett legitimt fall: när utdatan är det enda intressanta och exitkoden genuint saknar betydelse" | Missad röd grind — allvarligt men återställbart, CI fångar den i nästa led (skriptets eget filhuvud) | **Behåll `ask`.** Matchar Gatekeepers `warn`-läge för en policy utan ännu bevisad, ren träffbild (byggd samma dag). |
| `deny-resend-send.sh` | **Nej, i praktiken** — exakt/nästan-exakt matchning mot kända Resend-sänd-verktygsnamn och endpoint-mönster; kravet är kategoriskt (Rogers noll-tolerans) tills Marcus MEDVETET återaktiverar | Ett skickat mail — **irreversibelt** | **Behåll hård `deny` (`exit 2`).** Matchar k8s `failurePolicy: Fail` för säkerhetskritiska webhookar och Gatekeepers `deny` för en bevisat aldrig-legitim överträdelseklass. Redan korrekt implementerad. |
| `stop-vakt.sh` | Ja (dokumenterade blinda fläckar i skriptets eget filhuvud — spawnade agenter syns inte i `background_tasks`) | En agent tvingas jobba en extra runda i onödan — låg kostnad, kapad vid 8 försök | **Inte tillämplig på `ask`/`deny`-frågan.** Det är en `Stop`-hook, inte `PreToolUse` — kontraktet är `{"decision":"block"}` mot AGENTEN, aldrig en prompt till Marcus. Ingen ändring att göra här för DENNA fråga. |

**Nyckelinsikt att bära vidare:** `ask`/`deny`-valet var redan rätt gjort i
S97. Det som brast var att räkna `permissionDecisionReason` som "intern
loggtext" när den i verkligheten är "det enda Marcus läser i tre sekunder
innan han klickar." Fråga 2 löser Fråga 1:s upplevda problem mer direkt än
ett byte till `deny` någonsin skulle — ett obegripligt `deny`-meddelande är
lika illa som ett obegripligt `ask`-meddelande, det bara ger Marcus noll
inflytande i stället för ett förvirrande val.

## Vad jag inte kunde belägga

- **Anthropic ger ingen egen, uttalad vägledning om NÄR `ask` ska väljas
  framför `deny`.** Kriteriet i denna dom är härlett ur repots egna
  motiveringar plus branschmönstret (§ Delfråga 3), inte citerat direkt ur
  en Anthropic-sida som säger det rakt ut.
- **Jag kunde inte verifiera VAR eller NÄR Marcus faktiskt mötte "de där
  frågorna"** han refererar till. `CLAUDE.md` § "En ny hook kan ALDRIG
  skarpbevisas..." dokumenterar att hookar registrerade mitt i en session
  (vilket S97:s fyra hookar var) inte laddas i den sessionen — vilket gör
  det osäkert om S97:s `ask`-hookar ens hunnit fira för Marcus ännu.
  Klagomålet kan lika gärna gälla Claude Codes GENERELLA, inbyggda
  behörighetsprompter (utanför repots egna hookar) som repots
  specialbyggda `ask`-hookar specifikt. Detta ändrar inte kriteriet i denna
  dom, men det är en öppen fråga värd att ställa till Marcus innan
  meddelande-omskrivningen genomförs skarpt: gäller trötthets-klagomålet
  Claude Codes standardprompter, repots egna hookar, eller båda?
  UTAN att göra en `deny-frammande-huvudkatalog.sh`-fixtur kunde inte heller
  en levande, skarp `ask`-prompt provoceras fram i detta rena research-pass
  (uppdraget förbjöd byggande/ändring).
  Ingen exakt körnings-siffra på hur ofta `ask` faktiskt fyrat i produktion
  finns därför i detta pass.
- **`#33106`s relevans för vår yta är obekräftad i endera riktningen** — den
  är stängd som inaktiv, inte som bevisat löst eller bevisat verklig. Berör
  inte de fyra S97-mekanismerna direkt (ingen matchar MCP-verktyg med
  `ask`), men flaggas öppet eftersom repots mail-lås (`deny-resend-send.sh`)
  MATCHAR MCP-verktyg — dock med `exit 2`, inte JSON, vilket enligt § Delfråga
  2 undviker just den felklassen.
- **Ingen mätning av UI-tecken-/radgräns** för `ask`-promptens visningsyta
  gjordes — de föreslagna omskrivningarna i § Delfråga 5 är längre än
  originalen. Om terminalens promptruta trunkerar långa
  `permissionDecisionReason`-strängar vet detta pass inte var gränsen går;
  det bör verifieras skarpt (en kort, ofarlig testprompt) innan
  omskrivningarna låses fast i skripten.

## Rekommendation (märkt som rekommendation, inte beslut)

1. **Ändra INGET av de fyra beslutsvärdena.** `ask`/`ask`/`deny`/`(N/A)` är
   redan rätt fördelat enligt kriteriet ovan och matchar branschmönstret i
   tre oberoende leverantörsfamiljer.
2. **Skriv om `permissionDecisionReason` i de två `ask`-hookarna** enligt
   Gunilla-formen i § Delfråga 5 (vad hände · varför spelar det roll · vad
   ska du göra), med de tekniska identifierarna nedgraderade till en
   parentetisk fotnot. Verifiera skarpt att texten inte trunkeras i
   promptrutan innan den låses.
3. **Rätta `ADR-090`s "KÄND RISK"-notering** (§ Beslut 2, Updates) så den
   speglar att `#37210` visade sig vara en felanvänd exit-kod hos
   rapportören, inte en plattformsbugg — inte ta bort varningen tyst, utan
   bokföra rättelsen som en ny Update, i linje med husets egen regel om att
   falsifierat innehåll rivs öppet, aldrig tyst.
4. **Fråga Marcus explicit** om trötthets-klagomålet gäller Claude Codes
   INBYGGDA behörighetsprompter, repots EGNA hookar, eller båda — svaret
   avgör om nästa steg är "skriv om fyra hook-meddelanden" eller "granska
   hela `permissions.allow`-listan i `.claude/settings.json` för att minska
   frekvensen av standardprompter också."

## Källförteckning

**Förstapart — Claude Code:**

- [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) —
  fullständigt referensschema för `PreToolUse`, fälttabell
  (`permissionDecision`, `permissionDecisionReason`, `systemMessage`),
  kombinationsregeln vid flera hookar. Hämtad 2026-08-04.
- [code.claude.com/docs/en/hooks-guide](https://code.claude.com/docs/en/hooks-guide) —
  exit-kod-kontraktet, "Don't mix them"-varningen om `exit 2` vs JSON,
  felsökningssektionen om stdout-korruption. Hämtad 2026-08-04.
- `github.com/anthropics/claude-code` issue
  [#37210](https://github.com/anthropics/claude-code/issues/37210) — läst i
  sin helhet inklusive stängningskommentaren; visar att den "kända risken"
  i `ADR-090` var en felanvänd exit-kod, inte en plattformsbugg.
- `github.com/anthropics/claude-code` issue
  [#33106](https://github.com/anthropics/claude-code/issues/33106) — läst i
  sin helhet; stängd som inaktiv, gäller MCP-verktyg specifikt, låg
  relevans för vår Bash-fokuserade yta.

**Branschprecedent — policy-gates:**

- [Kubernetes: `ValidatingWebhookConfiguration`-referensen](https://dev-k8sref-io.web.app/docs/extend/validatingwebhookconfiguration-v1/) —
  `failurePolicy: Fail`/`Ignore`.
- [Gatekeeper: "Failing Closed"](https://open-policy-agent.github.io/gatekeeper/website/docs/failing-closed/)
  och [Gatekeeper: how-to](https://open-policy-agent.github.io/gatekeeper/website/docs/howto/)
  och [violations-sidan](https://open-policy-agent.github.io/gatekeeper/website/docs/violations/) —
  `enforcementAction: deny`/`dryrun`/`warn`, rekommenderad utrullningsordning.
- [Adam Johnson: "Git: How to skip hooks"](https://adamj.eu/tech/2023/02/13/git-skip-hooks/)
  och [GeeksforGeeks: "How To Skip Git Commit Hooks?"](https://www.geeksforgeeks.org/git/how-to-skip-git-commit-hooks/) —
  `--no-verify`, klient- vs server-sidans hookar.

**Prompt-trötthet, empiriskt mätt:**

- Akhawe & Felt, "Alice in Warningland: A Large-Scale Field Study of Browser
  Security Warning Effectiveness", USENIX Security 2013 —
  [usenix.org](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/akhawe).
- Vance et al., *MIS Quarterly* 2018 (habituering, fMRI + ögonrörelse +
  fältdata) — sammanfattad av
  [Schneier on Security](https://www.schneier.com/blog/archives/2018/06/the_habituation.html),
  primärkälla
  [neurosecurity.byu.edu](https://web.archive.org/web/20221122163422/https://neurosecurity.byu.edu/media/Vance_et_al._2017_MISQ.pdf).
- ["Introducing quieter permission UI for notifications"](https://blog.chromium.org/2020/01/introducing-quieter-permission-ui-for.html),
  Chromium Blog, 2020-01-07.
- ["Shhh...be Quiet!" — reducing unwanted notification permission
  prompts](https://research.google/pubs/shhhbe-quiet-reducing-the-unwanted-interruptions-of-notification-permission-prompts-on-chrome/),
  Google Research / USENIX Security 2021.

**Lokala källor konsulterade:**

- `.claude/settings.json` (aktuell hook-registrering, alla fem PreToolUse-
  hookar + Stop/SubagentStop).
- `scripts/deny-frammande-huvudkatalog.sh`, `scripts/deny-grind-genom-pipe.sh`,
  `scripts/deny-resend-send.sh`, `scripts/stop-vakt.sh` — lästa i sin helhet.
- `docs/decisions/ADR-090-sessions-parallellitet-detektera-och-fraga.md` —
  läst i sin helhet, inklusive § Updates 2026-08-04.
- `tasks/sessions/archive/2026-08/2026-08-04-session-97.md` § Del 4 (mekaniseringen).
