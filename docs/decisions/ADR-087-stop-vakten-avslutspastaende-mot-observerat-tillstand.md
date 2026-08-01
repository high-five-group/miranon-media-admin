# ADR-087: Stop-vakten — avslutspåståendet stäms av mot observerat tillstånd

- Status: Accepted (Marcus GO 2026-08-01, klass A — bästa lösningen inom S91)
- Datum: 2026-08-01
- Fas: post-S91 (`TASK-113`, tråd `T108`)

## Kontext

Tråd `T108` (flaggad MÅSTE LÖSAS av Marcus 2026-07-29): aktörer avslutar sin
tur med ett påstående om framtiden som ingen mekanism bär — *"väntar på att
`#439` landar"* utan att någon notifierare existerar. Kostnaden är mätt, inte
befarad: åtta kort-stängningar fördröjdes en enda dag, och båda gångerna var
det Marcus som fångade det — husets dyraste fångst-mekanism. `L328`-empirin
visade samma dygn att en nedskriven regel utan mekanism inte efterlevs.

Formvalet avgjordes i research-passet
[`obevakade-tillstand-vaktens-form-2026-07-30.md`](../research/obevakade-tillstand-vaktens-form-2026-07-30.md):
trådens form (d) — omvänd default, anta aldrig att en väntan är bevakad —
mekaniserad som `Stop`/`SubagentStop`-hook. Passet mätte mekanismen skarp sex
gånger mot Claude Code v2.1.220: en `Stop`-hook kan vägra låta en tur avslutas
(mätning 1), `stop_hook_active` finns och vänder efter en blockering (mätning
2), harnesset bär ett eget tak på 8 blockeringar (mätning 3), hook-indatan bär
både påståendet och verkligheten — `last_assistant_message` +
`background_tasks` — i samma anrop (mätning 4), och `SubagentStop` täcker både
synkrona och bakgrundsspawnade subagenter (mätning 5–6).

Trådkartan satte ett förbehåll: formen är kortbar först när
`background_tasks`-täckningen är mätt. Mätningarna stängde det — åt det
obekväma hållet: **(a)** `background_tasks` var `[]` i båda
subagent-körningarna, även med en bakgrundsagent igång — en detektor som bara
läser fältet missar "väntar på en subagent". **(b)** Harnessets task-lista
visade "No tasks found" medan elva spawnade agenter var aktiva (`T112` §
Mätt 3). **(c)** Ersättningssignalen — task-notifikationer vid agent-stopp —
kan själv tystna mot en idle huvudsession: en fullbordad vakt väckte ingen
förrän nästa dag (`T112` § Mätt 1). Konsekvens: detektorn kan inte lita på en
enskild kanal, och dess blinda fläckar bokförs öppet i stället för att antas
täckta.

## Beslut

**En `Stop`- och `SubagentStop`-hook registreras i `.claude/settings.json`
(`scripts/stop-vakt.sh` + `.stop-vakt-policy.json`) som stämmer av aktörens
avslutspåstående mot observerat tillstånd i hook-indatan, och vägrar avslutet
— högst en gång — när ett väntepåstående inte bärs.**

Avstämningens ordning, mekanisk och icke-semantisk:

1. `stop_hook_active == true` → släpp igenom direkt, före all prövning.
   Vakten blockerar därmed högst EN gång per avslutssekvens; harnessets tak på
   8 är andra försvarslinje, inte design.
2. Matchar `last_assistant_message` inget väntepåstående (policy-mönster,
   efter att motparts-vänteformer strippats) → släpp igenom. Detta är
   normalvägen och den är billig: **~83 ms per turavslut, lokalt mätt**
   (10 körningar à 0,826 s totalt, macOS 2026-08-01 — hooks körs lokalt, så
   det lokala talet är det verkliga).
3. Väntepåstående matchat: bärs det av ett **körande** bakgrundsjobb i
   `background_tasks`, eller av en explicit deklaration på egen rad
   `VÄNTLÄGE: <vad som väcker, och hur det verifieras>` → släpp igenom.
   Markören ÄR form (d):s kärna — passiv väntan förbjuds inte, den görs till
   ett explicit, motiverat, granskningsbart val. Ett `completed`-jobb bär
   INTE: `T112` mätte att en fullbordad vakt inte väckte någon.
4. Annars: blockera med **avstämningens resultat** — vad som påstods (mönstret
   och den matchade texten), vad som observerades (antal jobb, antal körande), de
   kända blinda fläckarna, och de tre vägar som bär en väntan. Tillstånd,
   inte tillsägelse: passets mätning 5b visade att `reason` som instruktion
   kan ignoreras; det som levereras är underlaget, och mottagaren äger valet.

**Fail-closed** (förebild `scripts/ci-wait.sh`): jq saknas, indata oparsbar,
policyfil saknas/ogiltig, trasig regex — allt blockerar med felet som reason,
aldrig tyst släpp. Frisläppnings-kontraktet i punkt 1 håller även degraderat:
kan `stop_hook_active` inte läsas via jq läses det med grep ur råtexten, så en
trasig vakt kan aldrig hålla en tur fången förbi första blockeringen.

**Konfig-driven** (Lesson #6): logiken i skriptet är universell; mönstren bor
i `.stop-vakt-policy.json`. Formen är JSON och inte en bash-sourcad `.conf` av
ett skäl: sourcade conf-filer måste räknas upp i `ci.yml`:s shellcheck-scope
(en sourcad conf utanför scopet är en känd lucka), medan en jq-läst JSON
aldrig exekveras. Precedent: `.purge-staging-policy.json`.

**Per-repo-hemvist:** hooks distribueras INTE via pluginet — `hooks`-nyckeln
tappas tyst (`L370`, mätt). Vakten bor därför i repots `.claude/settings.json`
och måste dupliceras per spoke. Det är en verklig kostnad, medvetet buren;
precedent i samma settings-fil: `matcher: "Agent"` → `agent-spawn-log.sh`.

## Bevis — tvåsidigt, mätt

- **Testsviten `scripts/test-stop-vakt.sh`: 16/16 PASS.** Röd sida: planterat
  känt väntepåstående-fel (`T108`-empirins exakta form, *"Jag väntar på att
  #439 landar"*, tom `background_tasks`) FÄLLS med tillstånd i reason. Grön
  sida: korrekt avslut släpps med exakt 0 byte stdout. Därtill: körande jobb
  bär / completed bär inte, `stop_hook_active`-genomsläpp, VÄNTLÄGE-ventilen,
  undantags-strippning (motparts-väntan friar inte en obevakad CI-väntan i
  samma meddelande), engelska mönster, `SubagentStop`, tre
  fail-closed-fall och degraderad frisläppning. Payload-formerna är passets
  faktiskt uppmätta hook-indata, inte antagen dokumentation.
- **Live-fyrningsbevis mot det körande harnesset** (sandlåda med egen
  settings-fil, 2026-08-01): prompt som beordrade ett väntepåstående gav
  loggsekvensen `blockera/obevakad_vantan (stop_hook_active:false)` →
  `tillat/stop_hook_active (true)` — exakt en blockering, uppmätt
  frisläppning, och modellen korrigerade självmant sitt påstående efter att
  ha fått tillståndet. Prompt med normalt avslut (`KLAR`) gav en enda rad
  `tillat/inget_vantepastaende`. En hook som ser ut som grind men aldrig
  fyrar är dead config (`L369`) — därför mättes fyrningen, inte bara skriptet.

## Ärliga svagheter — utskrivna, inte dolda

1. **Detektionen är heuristisk med falska negativ.** Verkställigheten
   (blockeringen) är mekanisk och mätt skarp; upptäckten vilar på
   prosa-matchning mot en ändlig mönsterlista. En omskrivning som inte
   matchar passerar. Strikt bättre än nuläget — där detektorn är Marcus —
   men aldrig ett täckningsanspråk.
2. **`T112`-hålet täcks INTE.** Ett körande bakgrundsjobb *bär* påståendet i
   avstämningen, men `T112` § Mätt 1 visade att även en fullbordad vakts
   task-notifikation kan tystna mot en idle huvudsession. Vakten prövar att
   en väckningsmekanism *finns* — den kan inte bevisa att väckningen *når
   fram*. Det hålet är bokfört i tråden och kvarstår öppet.
3. **Spawnade agenter är osynliga i `background_tasks`** (mätt). En äkta
   väntan på en subagent ser obevakad ut och kostar en falsk blockering;
   ventilerna är VÄNTLÄGE-raden och engångs-kontraktet. Spegelbilden gäller
   också: bärare-prövningen är icke-semantisk, så ett körande men
   *orelaterat* jobb bär ett väntepåstående om något helt annat. Semantik
   grindas inte (ADR-083: en grind som gissar semantik fäller fel).
4. **Efterlevnad garanteras inte.** Mekanismen garanterar att turen inte tar
   slut oprövad — inte att aktören gör rätt sak (passets mätning 5b). Vakten
   är en snubbeltråd som levererar tillstånd en gång, inte ett fängelse.
5. **Per-repo-hemvist driver isär över tid** (`L370`) — varje spoke bär sin
   egen kopia, och ingen mekanism håller kopiorna lika.
6. **Falska positiv finns:** tredjepersons- och citatformer ("orkestreraren
   väntar på …" i en rapport) kan fällas. Kostnaden är en blockering med
   tillstånd levererat, sedan frisläppning — bunden av engångs-kontraktet.
7. **Latens på varje turavslut för varje aktör:** ~83 ms lokalt mätt
   (normalvägen). Betalas alltid; nyttan faller ut sällan.
8. **Testsviten körs INTE i CI ännu.** `ci.yml` ägs av en annan aktör i denna
   våg; `test-stop-vakt.sh` är körbar i repot men owirad — att påstå annat
   vore ADR-083:s felklass. Wiring är en öppen uppföljningspunkt.

## ADR-baren — prövad

1. *Svår att återställa?* Ja, i koherens: beslutet ändrar avsluts-kontraktet
   för varje aktör i repot, och dess gränser (vad som bär en väntan, varför
   completed inte bär, varför en blockering är max) är omöjliga att
   rekonstruera ur skriptet ensamt.
2. *Överraskande utan kontext?* Ja: en hook som vägrar låta en tur avslutas
   är oväntad mekanik, och VÄNTLÄGE-raden ser ut som konvention men är en
   ventil i en spärr.
3. *Verklig avvägning?* Ja: latens + falska positiv + per-repo-drift vägdes
   mot att detektorn annars är Marcus. Research-passets egen dom: formen
   *"bör beslutas som ADR, inte glida in via ett kort"*.

## Alternativ som övervägdes

Samtliga vägda i research-passet; sammanfattat:

- **(a) Parkoppling armering↔vakt** (`PreToolUse` på `gh pr merge --auto`) —
  rätt instinkt, för smal: varje ny väntetyp kräver en ny parkoppling, och
  täcker inte `TASK-89`-klassen. Behålls som möjligt komplement.
- **(b1) Avstämningsloop inuti aktören** — förkastad: detektorn dör i samma
  ögonblick den behövs. Repots egen nattvakt är byggd på just den insikten.
- **(b2) Utvidga `nightly-watchdog.yml`** — det reella alternativet:
  överlever aktörens död men upptäcker felet timmar senare i stället för i
  sekunden. Inte vald som huvudform; står kvar som framtida komplement.
- **(c) `check-backlog-closure.sh` i leverans-kadensen** — fångar utfallet
  (kort som blev stående), inte orsaken, och bara för korttypen.
- **(e) Väntan som harness-spårat objekt** — rätt och delvis byggd
  (`PreToolUse`-nekandet av förgrunds-watch), men täcker "hur man väntar",
  inte "att man råkade inte vänta alls" — `T108`:s kärna.
- **En lesson som säger "sätt alltid en vakt"** — prövad och fallen: `L328`
  var nedskriven sedan S81 och gicks i två gånger under en enda resume.

## Konsekvenser

**Positiva:** klassen "avslut med obevakat väntepåstående" har för första
gången en tvingande verkställighetspunkt, för båda aktörsklasserna, i
verktyget vi redan kör · passiv väntan blir ett explicit, granskningsbart val
(VÄNTLÄGE-raden) i stället för ett tyst antagande · fel i vakten själv larmar
högljutt i stället för att tysta den (fail-closed).

**Negativa / skuld:** posterna 1–8 under § Ärliga svagheter, i synnerhet:
`T112`-hålet kvarstår öppet, per-repo-kopiorna driver, testsviten är owirad i
CI, och mönsterlistan kräver skötsel när husets språkbruk ändras.

## Relaterat

- [Research-passet 2026-07-30](../research/obevakade-tillstand-vaktens-form-2026-07-30.md) — formvalet, de sex mätningarna, egenskapskraven
- `tasks/threads/README.md` tråd `T108` · [`T112`](../../tasks/threads/T112-vackningskedjan-over-turgransen.md) — väckningskedjan över turgränsen
- [ADR-083](ADR-083-prosa-som-pastar-mekanism.md) — prosa som påstår mekanism; semantik grindas inte
- [ADR-039](ADR-039-konsistens-grindar-kadens.md) — lesson→grind-kravet på bevisad fyrning
- `tasks/lessons.md` `L370` (plugin-agenter tappar `hooks` tyst) · `L369` (enforcement-claim bevisas empiriskt) · `L328` (regel utan mekanism efterlevs inte)
- [`scripts/ci-wait.sh`](../../scripts/ci-wait.sh) — fail-closed-förebilden
