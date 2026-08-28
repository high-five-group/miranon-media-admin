# ADR-101: Compact-formen — kontrollerad kompaktering med smal nisch

- Status: Accepted (grillad samsyn S99 Del 9, Marcus-kvitterad 2026-08-07)
- Datum: 2026-08-07
- Fas: Session 99 (PRD `TASK-160`)

## Kontext

När en orkestrerings-session närmar sig kontextfönstrets gräns mitt i en
arbetsenhet, med byggare i luften och PR:er i kön, finns i dag två utfall:
**pausa** — vilket kräver att hela pipelinen dräneras (mätt
serialiseringskostnad i S99:s båda tidigare pauser: "vi landar allt som är i
luften och väntar in agenterna") — eller **fortsätta** tills harnessets eget
auto-compact slår till okontrollerat, enligt grillningens observation
(`tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 9) vid ungefär 85–90 %
fyllnad, utan fokus-instruktion och utan att läget säkrats i fil. Status quo
är alltså inte "paus alltid" utan **"paus när någon råkar se statusraden,
annars okontrollerad kompaktering"**. Grillningens nyckelinsikt (Uppdrag 8,
S99 Del 9) var att den verkliga frågan är **kontrollerad kontra okontrollerad
kompaktering** — inte compact kontra paus.

### Grillad samsyn — fem kvitterade frågor + Marcus GO 2026-08-07

Källa: `tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 9.

1. **Position B** — komplement med smal nisch, inte ersättning (position A)
   och inte totalavvisning (position C). Se § Decline-rationale.
2. **Nischen:** tre samtidiga villkor (pipeline i luften · oavslutad
   arbetsenhet · zonen), max EN compact per session — andra impulsen är
   paus-signal.
3. **Zonen ~50 %** via tröskel-miljövariabeln — det nekade auto-compact-
   försöket ÄR zonlarmet (statusraden går inte att läsa programmatiskt);
   beslutsrätten tudelad: HITL = Marcus GO i klartext, AFK = agentens eget
   beslut.
4. **Markör-kontraktet** med öppet kvitterad divergens mot paus-formen: rent
   arbetsträd där LOKALA COMMITS RÄCKER (push-ekonomin — sessionen lever
   vidare i samma arbetsträd); bygget väntar INTE på `TASK-148.5`s
   harness-mätning.
5. **Leveransform:** ADR (baren prövad, alla tre villkor håller) + PRD med
   sju skivor.

### Källmärkning — förstapartsfakta, verifierade mot aktuell dokumentation

Grillningens förstapartsfakta (`guide-agent-pass`, 2026-08-07) verifierades
på nytt mot `code.claude.com/docs` av denna skivas byggagent (2026-08-07,
`WebFetch` + `claude-code-guide`), eftersom repots eget `T111`
(`tasks/threads/T111-autonom-orkestrering-kontexttroskel.md`, 2026-07-31)
bokförde motsatsen — "ingen `PreCompact`... hook finns" — knappt en vecka
tidigare. Skillnaden är inte en motsägelse i sak: `T111` var korrekt vid sin
egen mätning eller läste fel dokumentationsversion; denna ADR ersätter inte
`T111`s text (den är fryst per repots ADR-praxis) utan bokför den nyare,
motsägande verifieringen här, öppet, per `ADR-100`s läsregel
(kod-/dokumentverifiera prosapåståenden om nuvarande beteende före
användning).

- **`PreCompact`-hooken finns**, kan **blockera** kompaktering (`exit code 2`
  eller toppnivå-`decision: "block"` med `reason`), och matchar på ett fält
  som anger **vad som triggade kompakteringen** — dokumenterade värden
  `"manual"` (via `/compact`) och `"auto"` (harnessens egen tröskel). Hooken
  stödjer INTE `additionalContext`-injektion — den kan bara blockera eller
  släppa igenom, aldrig tillföra kontext till sammanfattningen. Källa:
  `code.claude.com/docs/en/hooks.md`.
- **`SessionStart`-hooken** har ett `source`-fält med de dokumenterade
  värdena `"startup"`, `"resume"`, `"clear"`, `"compact"`, `"fork"` — och
  `source: "compact"` sätts specifikt när en session startar om EFTER en
  kompaktering (manuell eller automatisk). Till skillnad från `PreCompact`
  KAN `SessionStart` injicera `additionalContext`. Källa: samma.
- **Tröskel-miljövariabeln:** `settings.json`-nyckeln `autoCompactWindow`
  (100 000–1 000 000 tokens, standard "tunad för modellen" när osatt) styr
  vid hur många tokens auto-compact triggas; `CLAUDE_CODE_AUTO_COMPACT_WINDOW`
  är motsvarande miljövariabel och kan override:a settings-nyckeln.
  `autoCompactEnabled: false` (eller `DISABLE_AUTO_COMPACT=1`) stänger av
  auto-compact helt. Källa: `code.claude.com/docs/en/settings.md`. Ett värde
  satt till ungefär hälften av sessionens faktiska kontextfönster (`T111`
  mätte 1 000 000 tokens totalt på denna Max-plan) ger den ~50 %-zon
  grillningen låste.
- **`/compact`-kommandot** har syntaxen `/compact [instructions]` och stödjer
  explicit valfria fokus-instruktioner som fri text efter kommandot — "pass
  focus instructions for the summary". Källa:
  `code.claude.com/docs/en/commands.md`.

### Pocock-korpusens kontextdisciplin

Källa: `docs/reference/pocock/matt-pocock-arbetssatt-for-ai-kodning.md` §
"Kontextdisciplin: Grill → Execute → Clear" (exakt filnamn verifierat mot
disk vid denna ADR:s mintning — dubbel-s i "arbetssatt", inte enkel-s).
Normalrytmen är Grill → Execute → Clear, och stycket är explicit om
kompaktering: *"Automatisk eller upprepad komprimering är inte det önskade
standardflödet. Varje sammanfattningslager lämnar 'sediment': mindre exakt,
äldre kontext som kan påverka agenten."* Samma stycke medger ändå ETT
undantag: *"Komprimera möjligen en gång när du har hårt vunnen kontext i en
svår felsökning eller direkt efter en stor implementation och behöver göra
fokuserad QA. Ange då uttryckligen nästa mål, så att sammanfattningen bevarar
rätt sak."* Detta är källgrunden för nischens **max EN compact per
session**-regel och för kravet att fokus-instruktionen alltid skrivs
explicit, inte lämnas till harnessens standardsammanfattning.

### Två öppna mätpunkter — HYPOTESER, kopplade till `TASK-148.5`

Ingen av följande är belagd i officiell dokumentation eller mätt lokalt;
båda är HYPOTESER som `TASK-160.6` lägger till det redan bokade
väckningskedjs-mätprotokollet (`TASK-148.5`, se `ADR-096`):

1. **Notifikations-överlevnad:** överlever subagent-notifikationer och
   `Monitor`-bevakningar en kompaktering i en levande session? Det enda
   dokumenterade angränsande faktumet (`code.claude.com/docs/en/sessions.md`
   och `scheduled-tasks.md` tillsammans) gäller RESUME efter en STÄNGD
   session — "Background Bash and monitor tasks aren't [restored]" — inte
   vad som händer med en PÅGÅENDE bakgrundsbevakning när sessionen
   kompakteras utan att stängas.
   Skillens robusthets-hållning (PRD § Implementationsbeslut, "Robusthet")
   planerar monitor-omstart som om ingenting överlever; faller mätningen
   annorlunda justeras skillen, inte arkitekturen.
2. **Retry-beteendet hos en NEKAD auto-compact:** larmar harnessen varje tur
   (level-triggered, som `heartbeat-svep.sh` redan är för landningsläget) så
   länge kontexten ligger i zonen, eller bara en gång? Avgör om
   PreCompact-grinden (`TASK-160.2`) behöver egen anti-spam-logik.

## Beslut

### 1. Nischen — tre samtidiga villkor, max EN compact per session

Kontrollerad compact tillåts ENDAST när tre villkor håller SAMTIDIGT:

1. **Pipeline i luften** — byggare arbetar, PR:er väntar i kön eller på
   granskning.
2. **Arbetsenheten oavslutad** — ingen naturlig landningspunkt att pausa vid.
3. **Kontexten i zonen** (~50 %, se § 2).

**Max EN compact per session.** En andra impuls att kompaktera är per
definition INTE samma situation längre — den behandlas som paus-signalen den
är: landa allt som går att landa och pausa på riktigt (`session-paus`,
`ADR-051`/`ADR-052`). Detta operationaliserar Pocock-citatets "möjligen en
gång" som en hård gräns snarare än en rekommendation, eftersom repots egen
instruktionsleverans-erfarenhet (`ADR-097`) redan visat att en mjuk
rekommendation i prosa inte håller över sessionsgränser utan en mekanisk
bärare.

**Compact ersätter aldrig paus vid scope-byte eller en naturlig
landningspunkt.** Nischen är smal med avsikt: den täcker EN specifik
situation (pipeline i luften + oavslutad enhet + zonen), inte "kompaktering
när det är bekvämt".

### 2. Zonen — auto-compact-tröskeln som zonlarm, inget nytt att läsa

Zonen sätts till ungefär hälften av sessionens faktiska kontextfönster via
`autoCompactWindow`/`CLAUDE_CODE_AUTO_COMPACT_WINDOW` (§ Källmärkning).
**Det nekade auto-compact-försöket ÄR zonlarmet:** statusradens
kontext-procent går inte att läsa programmatiskt (inget förstapartsläge
exponerar den till en hook eller ett skript), så kedjan är byggd för att
INTE kräva ögon på statusraden. När harnessen själv försöker auto-kompaktera
vid den sänkta tröskeln nekar PreCompact-grinden (`TASK-160.2`, `trigger:
"auto"` → neka alltid med anvisning som pekar på skillen) — och just den
nekningen är den maskinella signalen att sessionen nått zonen.

### 3. Tudelad beslutsrätt — HITL vs AFK

- **HITL** (Marcus i sessionen): Marcus GO i klartext krävs före varje
  kompaktering. Oåterkallelig kastning av verbatim-kontext sker aldrig utan
  ett uttalat mänskligt beslut.
- **AFK** (batch-körning utan Marcus i sessionen): agenten fattar beslutet
  själv, när samtliga tre nisch-villkor är mätta och läget är säkrat i
  markören (§ 4) — annars fastnar AFK-batchar i väntan på ett GO som
  strukturellt inte kan komma.

### 4. Markör-kontraktet — divergensen mot paus-formen, motiverad öppet

Markörfilen (satt ENDAST av pre-compact-skillen, `TASK-160.3`) bär:

- **Rent arbetsträd där LOKALA COMMITS RÄCKER** — push krävs INTE. Detta är
  en medveten, öppet kvitterad divergens mot paus-formens krav på ett
  verifierat rent OCH PUSHAT arbetsträd (`ADR-051` § Beslut 4). Skälet är
  `ADR-097`s push-ekonomi: "commit är gratis, push kostar" — en push utlöser
  en full CI-svit och en plats i det globala staging-mutexet, medan en lokal
  commit räcker som checkpoint. Compact-formens session LEVER VIDARE i
  SAMMA arbetsträd efter omstarten (till skillnad från paus, som parkerar
  trädet för en framtida, möjligen annan, resume) — det är den strukturella
  skillnaden som gör push onödig här men obligatorisk där.
- **Sessionsdok-carry** uppdaterad om olandat resonemang finns.
- **Todo-kadensraden** synkad.
- **Fokus-instruktionen** — skriven explicit i markören, det konkreta svaret
  på Pocock-citatets "ange då uttryckligen nästa mål" — producerad ur läget:
  nästa mål, öppna PR-nummer, numrerings-snapshot, monitor- och task-läge
  för omstart.
- **Engångsbiljett:** markören rensas av post-compact-steget
  (`TASK-160.4`s `SessionStart`-igenkänning, `source: "compact"`) — den
  överlever aldrig till nästa kompaktering.

### 5. Kedjan — helt mekaniserad

1. Tröskel-miljövariabeln sätter zonen lågt (§ 2).
2. Harnessens eget auto-compact-försök vid den tröskeln ÄR zonlarmet — inga
   ögon krävs.
3. `PreCompact`-grinden (deny-familjen, `TASK-160.2`) nekar okontrollerad
   kompaktering: `trigger: "auto"` → neka alltid med anvisning; `trigger:
   "manual"` → neka om markören saknas eller är äldre än ~15 min.
4. Pre-compact-skillen (hub-plugin, `TASK-160.3`) säkrar läget i markören
   och producerar fokus-instruktionen.
5. Kontrollerad manuell kompaktering körs med `/compact <fokus-instruktion>`.
6. `SessionStart`-igenkänningen (`source: "compact"`, `TASK-160.4`)
   omorienterar mot disk och rensar markören.

Paus/clear förblir default för landningspunkter och scope-byten — denna
kedja täcker uteslutande nischen i § 1.

## Decline-rationale — två avvisade positioner

Tre positioner vägdes i grillningen (S99 Del 9, punkt 1); Position B (detta
beslut) valdes som komplement med smal nisch.

### Position A — compact som ERSÄTTNING för paus — avvisad

Att låta kontrollerad compact ersätta paus generellt (inte bara inom den
smala nischen) är direkt motsagd av Pocock-korpusens sediment-varning
(§ Källmärkning): *"Automatisk eller upprepad komprimering är inte det
önskade standardflödet. Varje sammanfattningslager lämnar 'sediment'."*
Position A skulle göra kompaktering till standardvägen ut ur en lång
session i stället för undantaget Pocock själv beskriver — precis den drift
mot sediment-ackumulering nischens "max EN per session"-regel (§ 1) finns
för att förhindra. Paus/clear förblir normen för landningspunkter och
scope-byten; det är inte förhandlingsbart av detta beslut.

### Position C — avvisa kontrollerad compact helt — avvisad

Att inte bygga någon kontrollerad väg alls, och enbart lita på paus för
varje läge, ignorerar två fakta som redan gäller oavsett vad detta beslut
säger:

1. **Harnessens egen auto-compact existerar redan, odesignad.** Den slår
   till förr eller senare oavsett om vi bygger något — frågan är aldrig "sker
   kompaktering", bara "sker den kontrollerat (fokus-instruktion, läge
   säkrat i fil) eller okontrollerat (statusradens procent, ingen
   disk-säkring)". Position C löser inte bort auto-compact, den bara
   avstår från att styra den.
2. **Dräneringskostnaden.** Att kräva full paus varje gång kontexten närmar
   sig gränsen mitt i en arbetsenhet med byggare i luften betyder att hela
   pipelinen måste dräneras — den mätta serialiseringskostnaden från S99:s
   båda tidigare pauser (§ Kontext). Position C betalar den kostnaden vid
   VARJE gränsnärmande, inte bara vid genuina landningspunkter.

Position C skulle vara den enklaste ändringen (bygg ingenting), men
enkelheten är inte gratis — den betalar båda kostnaderna ovan i utbyte mot
att slippa en ny mekanism.

## ADR-baren — prövad

1. **Svår att återställa?** Ja, i båda meningarna. I kod: `PreCompact`-
   grinden (`TASK-160.2`) ändrar vilken kompaktering som faktiskt går igenom
   i varje session med den sänkta tröskeln — att riva den återinför
   okontrollerad kompaktering utan varning. I koherens: gränsen mellan
   compact-formens markör-kontrakt och paus-formens push-krav (§ 4) är
   omöjlig att rekonstruera ur skripten ensamma utan denna ADR — en läsare
   som bara ser "markören kräver inte push" utan kontext ser en bugg, inte
   ett designval.
2. **Överraskande utan kontext?** Ja — att repot medvetet SÄNKER sin egen
   auto-compact-tröskel (i stället för att höja den eller stänga av den) är
   kontraintuitivt utan att känna till att den sänkta tröskeln ÄR
   zonlarmet, inte ett misstag. Och att en `PreCompact`-hook kan blockera
   ett harness-inbyggt beteende är oväntat om man (som `T111` en vecka
   tidigare) trodde hooken inte existerade.
3. **Verklig avvägning?** Ja: nischen kunde ha varit bredare (Position A,
   billigare att bygga, men sediment-risken obestridd) eller inte finnas
   alls (Position C, noll ny mekanism, men dräneringskostnaden och den
   odesignade auto-compacten kvarstår obehandlade). Smal nisch + max en
   gång per session valdes trots att den är den mest begränsande — och
   därmed minst bekväma — av de tre.

## Alternativ som övervägdes

| Alternativ | Status | Skäl |
|---|---|---|
| **Position B — komplement med smal nisch** (vald) | Accepted | Löser den verkliga frågan (kontrollerad vs okontrollerad), inte den falska (compact vs paus); tre samtidiga villkor + max en gång håller nischen smal |
| **Position A — compact ersätter paus** | Avvisad | Motsagd av Pocock-korpusens sediment-varning; skulle göra kompaktering till standardväg i stället för undantag |
| **Position C — avvisa kontrollerad compact helt** | Avvisad | Ignorerar att harnessens auto-compact redan existerar odesignad, och betalar dräneringskostnaden vid varje gränsnärmande i stället för bara vid genuina landningspunkter |

## Konsekvenser

**Positiva:** kedjan är helt mekaniserad (§ Beslut 5) och kräver inga ögon på
statusraden — det nekade auto-compact-försöket bär hela zonlarmet. Push-
ekonomins princip (`ADR-097`) får en andra tillämpning utöver
arbetsform-tillståndsfilen: markör-kontraktets commit-räcker-divergens är nu
skriven, källbelagd och avsiktlig i stället för att se ut som ett hål i
paus-formens disciplin. Nischens smalhet (tre samtidiga villkor + max en
gång) gör att Pocock-korpusens sediment-varning respekteras strukturellt,
inte bara i teorin.

**Negativa/skuld, öppet burna:** detta beslut bygger INGEN mekanism —
`PreCompact`-grinden är `TASK-160.2`, hub-skillen är `TASK-160.3`,
`SessionStart`-igenkänningen är `TASK-160.4`, tröskel-konfigen är
`TASK-160.5`. Skarpbeviset för `PreCompact`-grinden kan per repots egen regel
(`CLAUDE.md` § "En ny hook kan ALDRIG skarpbevisas i sessionen som byggde
den") aldrig tas i byggsessionen — bokförs som öppen skuld där, inte här. De
två mätpunkterna (§ Källmärkning, notifikations-överlevnad och
retry-beteende) är HYPOTESER tills `TASK-148.5`s dedikerade HITL-mätsession
kör dem; till dess planerar skillen (`TASK-160.3`) för värsta fallet
(ingenting överlever) per PRD:ns robusthets-hållning. `T111`s äldre
bokförda "ingen PreCompact-hook finns" står kvar orörd i sin egen fil (fryst
text) men är nu vederlagd av en nyare verifiering — en framtida läsare som
bara hittar `T111` utan att se denna ADR kan bli vilseledd; risken bokförs
här öppet i stället för att åtgärdas genom att redigera `T111` (utanför
denna skivas scope).

## Relaterat

- [ADR-096](ADR-096-subagentens-vantekontrakt.md) — subagentens
  väntekontrakt; `TASK-148.5`s harness-mätprotokoll (§ Källmärkning, de två
  öppna mätpunkterna) är samma mätsession `TASK-160.6` lägger till.
- [ADR-097](ADR-097-arbetsformens-tillstandsbarare.md) — arbetsformens
  tillståndsbärare + push-ekonomins princip ("commit är gratis, push
  kostar"), grunden för § Beslut 4:s markör-kontrakt.
- [ADR-051](ADR-051-session-paus-lifecycle-verb.md) — paus-verbet, vars
  push-krav (§ Beslut 4) compact-formens markör-kontrakt medvetet avviker
  från.
- [ADR-052](ADR-052-lifecycle-frontmatter-falt.md) — `lifecycle`-fältet
  paus/resume bygger på; oförändrat av detta beslut.
- [ADR-053](ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md) — triage
  av det oväntade; styrande för hur ett oväntat compact-läge (t.ex. en andra
  impuls) triageas mot paus.
- [ADR-086](ADR-086-uppdragets-premisser-provas-av-mottagaren.md) —
  premiss-passet och läsregeln som denna ADR:s § Källmärkning tillämpar
  (förstapartsfakta re-verifierade, inte antagna ur grillningens
  sammanfattning).
- [ADR-100](ADR-100-sanningshierarkin-koden-ager-beteendet.md) — läsregeln
  (§3) som motiverar varför `T111`s äldre påstående verifierades på nytt i
  stället för att återanvändas.
- `tasks/threads/T111-autonom-orkestrering-kontexttroskel.md` — äldre
  (2026-07-31) bokföring som denna ADR:s § Källmärkning öppet vederlägger på
  en specifik punkt (PreCompact-hookens existens); filen själv orörd.
- `tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 9 — grillad samsyn, fem
  kvitterade frågor, samsyns-narrativet för hela detta beslut.
- `backlog/tasks/task-160*` — PRD + skivor (`TASK-160.1`–`.7`); denna ADR är
  `.1`.

## Källor

- [Claude Code — Hooks reference](https://code.claude.com/docs/en/hooks.md)
  — `PreCompact`-hookens matcher-värden (`manual`/`auto`), blockerings-
  förmåga (`exit 2`/`decision: "block"`), avsaknad av `additionalContext`;
  `SessionStart`s `source`-fält och dess `additionalContext`-stöd.
- [Claude Code — Settings reference](https://code.claude.com/docs/en/settings.md)
  — `autoCompactWindow`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`,
  `autoCompactEnabled`/`DISABLE_AUTO_COMPACT`.
- [Claude Code — Commands reference](https://code.claude.com/docs/en/commands.md)
  — `/compact [instructions]`-syntaxen och fokus-instruktionsstödet.
- [Claude Code — Sessions](https://code.claude.com/docs/en/sessions.md) +
  [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks.md) —
  "Background Bash and monitor tasks aren't [restored]" vid RESUME; grunden
  för § Källmärkning punkt 1:s HYPOTES-märkning (dokumentationen täcker
  resume efter stängning, inte kompaktering i en levande session).
- `docs/reference/pocock/matt-pocock-arbetssatt-for-ai-kodning.md` §
  "Kontextdisciplin: Grill → Execute → Clear" — sediment-varningen och "möjligen
  en gång"-undantaget, grunden för § Beslut 1 och § Decline-rationale
  Position A.
