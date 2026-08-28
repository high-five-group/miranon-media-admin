# ADR-097: Arbetsformens tillståndsbärare — regler bor i tillstånd, inte i startdörrar

- Status: Accepted (grillad samsyn S99 Del 3, Marcus-kvitterad 2026-08-07)
- Datum: 2026-08-07
- Fas: Session 99 (tråd `T126`, PRD `TASK-149`)

## Kontext

`T126` (registrerad 2026-08-06, S93 iterationsvåg 4, på Marcus uttryckliga
order — *"Rotorsak ska hittas och lösningen ska mekaniseras eller fixas så
det aldrig blir en fråga igen"*) dokumenterar ett mätt fel: under
iterationsvåg 3 pushades och armerades en PR per iterationsvarv i stället för
lokal commit per varv och EN push när Marcus säger klart. Det var andra
gången exakt samma fel begicks — första gången var `T116`/`TASK-127.2`
(S96), vars mätning bar siffrorna `#664` 15 minuter i kön och `#666` 20
minuter, 10–30 minuter mutex-kö per varv för sekunders faktiskt arbete, och
Marcus citat *"Vad är det som tar sådan tid???? Så här kan vi inte hålla på
vid iteration!!!"*.

**Regeln fanns, och den var inte svag.** Efter `T116` skrevs den in
verbatim i `prototype`-skillens § "Iterations-kadensen" (omverifierad mot
aktiva plugin-versionen 1.29.0 vid detta ADR:s författning, inte antagen ur
en äldre cache):

> "konvergens-varvet körs av den aktör som sitter med Marcus... commit/push/CI
> ger noll under iterationen. **Per varv: lokal commit, ingen push**
> (checkpoint + ångerknapp, ~1 s). **Push + PR EN gång**, när Marcus säger
> klart..."

Regeln var alltså korrekt, färsk, mätunderbyggd och specifik — och den
lästes ändå aldrig andra gången.

**Rotorsaks-HYPOTES, öppet oprövad vid detta besluts författning.** `T126`
formulerar en misstänkt mekanism: sessionen kom in i arbetet via
`session-resume` → HANDOFF-block → Marcus punktlista, och ingen av de
vägarna laddar `prototype`-skillen. Om hypotesen håller är den generella
formen att **arbete återupptas oftare än det startas** — resume, handoff,
"fortsätt där vi var", en ny punktlista i en pågående tråd hoppar alla över
den skill som definierar arbetsformens regler, eftersom den skillen bara
laddas när arbetsformen STARTAS. `T126` är själv uttrycklig om att detta är
"en hypotes formulerad av samma aktör som begick felet" och att den ska
"prövas mot faktiskt tillstånd innan något byggs" — det passet är
`TASK-149.2` (hypotes-beviset), en parallell skiva till denna ADR, inte en
förutsättning för den. Detta beslut bygger därför INTE på att den specifika
leveransväg-mekanismen är bekräftad; det bygger på det redan mätta faktumet
att en korrekt, färsk, specifik regel i prosa inte hölls två gånger i rad,
plus två oberoende precedent inom samma repo:

- **`T119`** (mekaniserings-programmet) har redan visat generellt att
  "regler i prosa bryts av färska kontexter".
- **`ADR-090`** löste samma problemklass för sessions-parallellitet — "regel
  utan leveransväg till utföraren" — genom att mekanisera den som ett
  detektionssteg i stället för att lämna den som prosa i en fil ingen läser
  vid rätt tillfälle.
- **`ADR-096`** (samma session, syskonbeslut) drog exakt denna slutsats för
  en annan felfamilj — subagentens väntekontrakt — och namngav principen
  *tillstånd/mekanism framför prosa*. `T126` är en instans av samma
  underliggande mönster i arbetsformens leveransväg, inte en ny observation.

**Grindklassens dubbla bärare är facit-modellen.** Kod-verifierat under
grillningen (`tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 3, punkt 3):
området som HAR koll — klassregeln `L147`, DoD-fyran (`ADR-036`),
`check:docs`, `verify:ci-parity` — har det kadensregeln saknade: **mekaniska
bärare**, konkret kort-DoD ur backlog-config OCH `.claude/agents/bygg-agent.md`
rad 90–96 samtidigt. Två bärare, inte en. Kontrasten mellan den klassen (som
håller) och kadensregeln (som inte höll trots att den var skriven) är
beviset för mekanismvalet nedan, och den dubbla-bärare-formen är mallen
`(a)+(b)` replikerar.

**Grillad samsyn**, fyra kvitterade frågor (`tasks/sessions/archive/2026-08/2026-08-07-session-99.md`
§ Del 3):

1. Tudelning: regel-leveransproblemet (`T126`) OCH push-ekonomin (Marcus
   generella fråga "pushar vi för ofta?") — svaret ur mätdata: **nej för
   färdiga enheter** (trunk-based/DORA), **ja för iterationsvarv**.
2. Mekanismvalet: `(a)+(b)` som ETT system.
3. Lokala grindar: kod-verifierat att grindklassen redan har mekaniska
   bärare — se ovan.
4. Leveransform: PRD `TASK-149` + sju skivor.

## Beslut

### 1. Principen

**Arbetsformens regler bärs av TILLSTÅND som mekanismer läser, inte av
prosa i startdörrar.** En "startdörr" är den skill eller det dokument som
STARTAR en arbetsform (t.ex. `prototype`-skillen när ett prototyp-pass
inleds) — och problemet är strukturellt, inte ett läs-slarv: en given
arbetsform startas EN gång men återupptas MÅNGA gånger (resume efter paus,
en ny punktlista i en levande tråd, en agent som tar över mitt i), och varje
sådan väg in hoppar per definition över startdörren. Ju längre ett arbete
lever, desto större andel av dess varv körs av någon som aldrig passerade
den.

Lösningen är att flytta reglernas bärare från dörren till en liten,
otrackad tillståndsartefakt: en fil sätts när arbetsformen inleds (av VILKEN
väg som helst — startdörr eller inte, se § 2) och LÄSES av en mekanism i
det ögonblick den reglerade handlingen sker (`git push`). Regeln blir
därmed **level-triggered och väg-oberoende**: den prövas mot tillståndet
som RÅDER, inte mot vilken dörr den aktuella turen kom in genom. Samma
filosofi som `scripts/heartbeat-svep.sh` redan bär för landningsläget
(`CLAUDE.md` § Landning, `L443`) och samma familj som Kubernetes'
watch+resync-mönster — tillämpad här på en annan regelklass.

### 2. Mekanismvalet — `(a)+(b)` som ETT system

`T126` § Åtgärdsriktningar identifierade fyra alternativ, uttryckligt inte
ömsesidigt uteslutande. Grillningen låste `(a)+(b)` tillsammans:

- **(a) Spärr vid handlingen.** En `PreToolUse`-hook på `Bash` med `git
  push` som läser arbetsform-tillståndsfilen och nekar med en anvisning så
  länge ett läge med push-förbud råder. Detta är den mekaniska bäraren —
  motsvarigheten till grindklassens kort-DoD.
- **(b) Leveransväg via handoffen.** Paus-/resume-blocket bär en explicit
  ARBETSFORM-rad; `session-paus` skriver den, `session-resume` läser den
  och återskapar tillståndsfilen. Detta är leveransvägen — motsvarigheten
  till `bygg-agent.md`s alltid-lästa instruktionsrader.

Tillsammans komponerar de exakt som `ADR-096`s PreToolUse-spärr +
instruktionskomplettering: (a) stänger den identifierade luckan mekaniskt,
(b) säkrar att tillståndet överlever ett paus/resume-varv utan att kräva att
någon läser en skill på nytt. Ingen av dem ensam räcker — (a) utan (b) har
inget sätt att återskapa tillståndet efter ett sessions-varv, (b) utan (a)
är bara prosa på en ny plats, exakt den svaghetsklass `T126` själv
uppstod ur.

**Mekaniken byggs INTE av detta beslut.** Tillståndsfilen + hooken är
`TASK-149.3`; hub-sidan (skills sätter/rensar tillståndet, ARBETSFORM-radens
paus/resume-rundtur, plugin-bump) är `TASK-149.4`. Detta beslut låser
FORMEN och avvisar alternativen — skarpbeviset för hooken kan dessutom
aldrig tas i byggsessionen (`CLAUDE.md` § "En ny hook kan ALDRIG
skarpbevisas i sessionen som byggde den") och bokförs som öppen skuld där,
inte här.

### 3. Push-ekonomins princip

Grundat i `docs/research/push-kadens-agent-arbetstrad-2026-07-26.md`:
**commit är gratis, push kostar.** En lokal commit blockerar städ-svepet
och överlever i den delade `.git`-katalogen utan att kosta CI eller en
mutex-plats; en push utlöser en full svit och en plats i det globala
staging-mutexet. Regeln: committa vid varje färdig enhet, pusha när enheten
är klar att granskas — push används aldrig som sparning.

Iterations-kadensen (`prototype` § 5) är EN instans av denna generella
princip, inte ett specialfall: ett iterationsvarv är per definition inte en
färdig enhet, och ska därför aldrig trigga push. Push-ekonomins fullständiga
undantagslista (vad som pushas direkt kontra väntar) kodifieras i
`TASK-149.5` — det hör inte hemma i denna ADR, som låser principen, inte
tabellen.

## Decline-rationale — tre avvisade alternativ

### `(c)` Skill-laddning som del av resume — avvisad

`T126` beskriver `(c)`: resume identifierar pågående arbetsform ur
handoffen och LADDAR motsvarande skill. Avvisad av tre skäl:

1. **Den löser inte enforcement, den upprepar leveransförsöket.** `(c)` är
   fortfarande en satsning på att TEXT läst en gång till ändrar beteende —
   exakt den strategi som redan mätt misslyckats på precis denna regel
   (`T116` → `T126`, samma text, andra gången) och tre gånger till i en
   angränsande felfamilj (`L323`, `L340`, 2026-08-05, dokumenterat i
   `ADR-096`s Alternativ B: "instruktion utan mekanism inte hållit"). Att
   leverera samma prosa via en ny kanal är inte samma sak som att gata
   HANDLINGEN — `(c)` kan i bästa fall göra att en agent LÄSER regeln igen,
   den kan inte hindra push om läsningen ändå inte biter.
2. **Fler rörliga delar än `(a)+(b)`.** `(c)` kräver att resume
   tillförlitligt parsar handoffen, mappar den till RÄTT skill-namn och
   triggar en skill-laddning — en ny automatiserad väg med sin egen
   felyta (fel mappning, skill-namn-drift, glapp mellan hubbens
   plugin-version och mappningstabellen) ovanpå den maskinläsbara
   tillstånds-deklaration `(a)+(b)` redan kräver. `(c)` bygger alltså
   samma förutsättning och lägger till en risk till.
3. **Bredare ingrepp än den reglerade handlingen motiverar.** Att ladda om
   en hel skill mitt i `session-resume`s egen, redan definierade
   stegsekvens riskerar att kollidera med resume-flödets övriga
   instruktioner (dubblettinstruktion, motstridig kontext) för att lösa ett
   problem som bara gäller EN specifik handling (`git push`). En smal spärr
   på handlingen är billigare och mer precis än ett brett återladdnings-steg.

### `(d)` Flytta regeln till en alltid-laddad yta — avvisad

`T126`: "Enklast, men den ytan har en budget — allt kan inte bo där, och
varje tillägg gör resten mindre läst." Avvisad av samma skäl som
motiverade `ADR-079` att sanera konstitutionen till under
200-radersriktvärdet: en alltid-laddad yta (spoke-`CLAUDE.md`, output
style) betalas i uppmärksamhet på VARJE tur, oavsett om den aktuella turen
befinner sig i den reglerade arbetsformen eller inte. Ju fler
arbetsform-specifika regler som flyttas dit (iterations-kadensen,
push-ekonomins undantagslista, framtida arbetsformer `TASK-149.6`s
inventering kan hitta), desto mer urvattnas ytan för ALLA turer — exakt
motsatsen till tillstånds-principens poäng, som är att en regel bara ska
väga tungt när dess arbetsform faktiskt råder. En tillståndsfil + hook
kostar noll uppmärksamhet när arbetsformen inte är aktiv; en rad i en
alltid-laddad fil kostar den på varje enda tur, aktiv eller ej.

Detta stänger inte dörren för att PRINCIPEN (denna ADR, namngiven) eller en
kort pekare till den nämns i en alltid-laddad yta — det är vad `ADR-096`
gjorde för väntekontraktet (`CLAUDE.md` § Landning, "Namnet på mönstret").
Det som avvisas är att lägga arbetsformens FAKTISKA regler (kadensen,
undantagslistan) där, inte att nämna att mekanismen finns.

### Session-batchad push — avvisad, fyra mätta skäl

Marcus generella fråga "pushar vi för ofta?" öppnade för ett bredare
alternativ än iterations-kadensen: batcha VARJE push till en enda gång per
session, i stället för en gång per färdig enhet. Explicit FÖRKASTAD, inte
tyst uteslutet:

1. **Parallell nummerallokering.** `CLAUDE.md` § Kortnummer dokumenterar en
   redan mätt kollisionsrisk: kort-ID:n allokeras säkert bara för
   COMMITTAT arbete på andra grenar (`check_active_branches`), och en
   skarp kollision inträffade `TASK-93` (2026-07-30) trots att flaggan
   fanns. En session-batchad push håller varje färdig enhets numrerade
   artefakter (ADR-nummer, lesson-nummer, kort-ID:n) opushade mot origin
   under HELA sessionens längd — vilket förlänger exakt det fönster där en
   parallell session kan allokera samma nästa-lediga-nummer, i stället för
   att stänga det.
2. **Agent-synlighet mot origin.** `CLAUDE.md` § Landning: "Kön bygger
   varje post mot `main` plus posterna före den... Vad kön inte ser är två
   diffar som mergar rent och ändå är fel tillsammans — och du kan inte se
   dina syskonagenter. Det kan orkestreraren." Den granskningen fungerar
   bara om varje färdig enhet faktiskt LANDAR i tur och ordning, så
   orkestreraren kan granska nästa diff MOT ett `origin/main` som redan
   bär de föregående. En session-batchad push håller alla syskon-agenters
   färdiga enheter osynliga för varandra och för orkestrerarens
   sekventiella granskning fram till en enda batch i slutet — vilket
   återinför precis den koordinations-lucka kön och den per-enhet-granskade
   landningen finns för att stänga.
3. **Write-ahead-principen** (`ADR-096` § Beslut del 3, "Persistens före
   väntan"). Samtliga granskade durable-execution-system kräver persistens
   FÖRE en väntan, aldrig som en eftertanke — och vår egen tredje
   parkerings-incident (2026-08-05) visade exakt varför: skillnaden mellan
   "arbetet låg på disk" och "arbetet var faktiskt räddat" var
   sekvenseringen `commit`/`push` FÖRE något som kunde trigga väntan, inte
   EFTER. Session-batchad push generaliserar samma anti-mönster till en
   hel sessions färdiga enheter: var och en ligger icke-durabel-mot-origin
   (återhämtningsbar bara via ett arbetsträd som kanske inte längre lever)
   under hela sessionens gång, i stället för att persisteras så snart den
   är klar.
4. **Stor-batch-risken** (DORA/trunk-based,
   `docs/research/push-kadens-agent-arbetstrad-2026-07-26.md` § 2 + §
   "Vad det betyder för OSS"). DORA 2025 namnger explicit små batchar som
   "a critical countermeasure to the risks of AI-assisted development",
   eftersom "higher AI adoption is associated with an increase in both
   software delivery throughput and software delivery instability".
   Forskningspasset fastslår att vår FAKTISKA kadens — flera små
   landningar per dag — redan ÄR den rekommenderade disciplinen; en
   session-batchad push skulle byta bort den mot en enda stor landning per
   session, rakt emot både DORA:s motmedel och trunk-based-golvet
   (integration minst en gång per dygn, per färdig enhet — inte per
   session). Kostnadsmotivet som skulle kunna försvara batchningen håller
   dessutom inte: samma forskningspass visar att den verkliga
   kostnadsdrivaren var `strict`-kravet på uppdaterad gren (skalar med
   antal ÖPPNA PR:er, inte med push-frekvens), och den mekanismen är redan
   avstängd sedan `ADR-076`s amendering 2026-08-05.

## Syskonmekanism — [ADR-096](ADR-096-subagentens-vantekontrakt.md), refererad och oförändrad

`ADR-096` och detta beslut löser två OLIKA felfamiljer med samma
underliggande princip (tillstånd/mekanism framför prosa i ett
handlingsögonblick), fattade i samma session:

- `ADR-096` gäter VÄNTAN — en subagent ska aldrig gå in i ett läge det
  inte kan komma ur, och PreToolUse-spärren nekar de verktyg som skulle
  låta den göra det.
- Detta beslut gäter ARBETSFORMENS REGLER — ett arbetsträd ska aldrig
  utföra en reglerad handling (`git push`) i strid med det läge som
  RÅDER, oavsett vilken dörr den aktuella turen kom in genom.

Båda mekaniseras som en `PreToolUse`-hook som läser tillstånd vid
handlingsögonblicket i stället för att lita på att en instruktion lästs i
förväg — samma medel, olika regelklass. Ingen av ADR:erna ändrar den andra.

## ADR-baren — prövad

1. **Svår att återställa?** Ja, i båda meningarna. I kod: hooken (byggs i
   `TASK-149.3`) ändrar vilket `git push`-anrop som faktiskt fungerar under
   en aktiv arbetsform, i varje arbetsträd — att riva den återinför en
   felklass redan mätt två gånger i pengar (10–30 minuters mutex-kö per
   varv, `T116`/`T126`). I koherens: utan denna ADR kan session-batchad
   push omprövas naivt av någon som inte känner de fyra mätta skälen, och
   gränsen mellan `(a)+(b)` och de avvisade `(c)`/`(d)` blir
   orekonstruerbar ur skripten ensamma.
2. **Överraskande utan kontext?** Ja — att en agent som ALDRIG laddade
   `prototype`-skillen ändå nekas push under ett iterationsläge är
   oväntat om man inte känner till att regeln nu bärs av en tillståndsfil
   satt av en TIDIGARE tur, inte av något den aktuella agenten läste. Utan
   denna ADR ser spärren ut som ett godtyckligt förbud kopplat till fel
   agent.
3. **Verklig avvägning?** Ja: `(a)+(b)` kostar ännu en hook-mekanism och en
   handoff-fält-disciplin i ett system som redan bär flera (`ADR-087`,
   `ADR-096`), vägt mot att prosa-i-startdörr redan mätt misslyckats två
   gånger på PRECIS denna regel och tre gånger till i en angränsande
   felfamilj. Session-batchad push vägdes uttryckligt mot CI-besparing och
   förkastades trots att den skulle ha varit den enklaste ändringen att
   göra — just för att enkelheten inte var gratis (fyra separata,
   oberoende grundade kostnader).

## Alternativ som övervägdes

| Alternativ | Status | Skäl |
|---|---|---|
| **(a) Spärr vid handlingen** (PreToolUse-hook på `git push`) | Vald, del av `(a)+(b)` | Mekanisk bärare, samma medel som `ADR-096`; icke-kringgåbar exekveringspunkt |
| **(b) Leveransväg via handoffen** (ARBETSFORM-rad, paus/resume) | Vald, del av `(a)+(b)` | Säkrar att tillståndet överlever ett sessions-varv utan att kräva ny skill-läsning |
| **(c) Skill-laddning som del av resume** | Avvisad | Upprepar den redan mätt otillräckliga strategin (leverera text) via en ny kanal, med fler rörliga delar och bredare ingrepp än den reglerade handlingen motiverar |
| **(d) Flytta regeln till en alltid-laddad yta** | Avvisad | Budget-problemet `ADR-079` redan löste; kostar uppmärksamhet på VARJE tur, inte bara de arbetsformen faktiskt gäller |
| **Status quo (prosa i startdörren)** | Avvisad, trivialt | Det ÄR felet detta beslut åtgärdar — redan mätt misslyckat två gånger |
| **Session-batchad push** | Avvisad | Fyra mätta/grundade skäl, se § Decline-rationale — parallell nummerallokering, agent-synlighet mot origin, write-ahead-principen, stor-batch-risken (DORA) |

## Konsekvenser

**Positiva:** arbetsformens regler får för första gången en bärare som inte
beror på VILKEN dörr en tur kom in genom — tillståndsfilen är
väg-oberoende per konstruktion. Push-ekonomins princip (commit gratis, push
kostar) får ett skrivet, källbelagt hemvist i stället för att leva som en
enskild regel i en enda skill. Session-batchad push, ett rimligt-låtande
svar på en verklig kostnadsfråga, är nu avvisat med fyra namngivna, källbelagda
skäl i stället för att förbli en öppen fråga som återkommer varje gång
CI-kostnad diskuteras. `ADR-096` och detta beslut visar tillsammans att
samma princip (tillstånd/mekanism framför prosa) löser två olika,
oberoende upptäckta felfamiljer — ett starkare argument för principen än
någon av instanserna ensam.

**Negativa/skuld, öppet burna:** detta beslut bygger INGEN mekanism —
tillståndsfilen och hooken är `TASK-149.3`, hub-integrationen är
`TASK-149.4`, skarpbeviset för hooken är därför per definition en öppen
skuld till en session EFTER byggsessionen (samma hook-laddningsregel som
`ADR-096`). Rotorsaks-hypotesen (leveransväg via startdörr) är vid detta
besluts författning fortfarande OPRÖVAD — `TASK-149.2` kan bekräfta,
förfina eller falsifiera den specifika mekanismen utan att rubba
PRINCIPEN, men om hypotesen falsifieras helt kan `(a)+(b)`s konkreta
utformning (vilka händelser som sätter/rensar tillståndet) behöva justeras.
Push-ekonomins fullständiga undantagslista är inte skriven här —
`TASK-149.5` kan i teorin hitta ett fall denna ADR:s princip beskriver fel;
det är då en korrigering av den ADR:n, inte av denna. Inventeringen
(`TASK-149.6`) kan hitta att fler arbetsform-regler delar `T126`s
felklass än de två (iterations-kadens, väntekontrakt) redan kända —
omfattningen av hur många regler som behöver samma bärare är alltså inte
fullt känd förrän den skivan landar.

## Relaterat

- `tasks/threads/T126-arbetsformens-leveransvag.md` — hela felbilden,
  rotorsaks-hypotesen och de fyra ospelade åtgärdsriktningarna `(a)`–`(d)`
  denna ADR väljer och avvisar mellan.
- `tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 3 — grillad samsyn, fyra
  kvitterade frågor.
- [`docs/research/push-kadens-agent-arbetstrad-2026-07-26.md`](../research/push-kadens-agent-arbetstrad-2026-07-26.md)
  — push-ekonomins fullständiga underlag, DORA/trunk-based-golvet,
  stor-batch-risken.
- [ADR-096](ADR-096-subagentens-vantekontrakt.md) — syskonbeslutet, samma
  princip (tillstånd/mekanism framför prosa) applicerad på en annan
  felfamilj; § "Persistens före väntan" är grunden för write-ahead-skälet
  ovan.
- [ADR-090](ADR-090-sessions-parallellitet-detektera-och-fraga.md) — tidigare
  instans av samma problemklass (regel utan leveransväg), mekaniserad som
  detektionssteg.
- [ADR-086](ADR-086-uppdragets-premisser-provas-av-mottagaren.md) — samma
  disciplin (kod-verifiera substratet före designen) som § Kontext
  premiss-passet tillämpar.
- [ADR-079](ADR-079-instruktionsleverans-barare-per-lager.md) — instruktionsleverans
  väljs per lager; grunden för att `(d)` avvisas (den alltid-laddade ytans
  budget).
- `tasks/lessons.md` `L323`, `L340` samt research-passet
  `docs/research/subagent-parkering-handoff-kontrakt-2026-08-05.md` — de
  tre mätta instanserna av instruktion-utan-mekanism som `ADR-096` bygger
  på och detta beslut delar.
- `backlog/tasks/task-149*` — PRD + skivor (`TASK-149.1`–`TASK-149.7`);
  mekaniken byggs i `TASK-149.3`/`TASK-149.4`, push-ekonomins undantagslista
  i `TASK-149.5`, hypotes-beviset i `TASK-149.2`, inventeringen i
  `TASK-149.6`.
