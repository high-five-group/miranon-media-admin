---
owner: marcus803
updated: 2026-08-04
review_by: 2026-11-15
status: stable
---

# CLAUDE.md — Miranon Media Admin (React)

---

## Vad är detta projekt?

Admin-app för **Miranon Media** (Roger & Lotta). Hanterar event, anmälningar, betalningar, personer, leads, närvaro och mail.

Detta är en **React-konvertering** av det Vue-byggda systemet i `~/Repon/miranon-media-os/`. Vue-projektet ligger kvar som referens under hela konverteringen — alla 4 komponenter på 11/11/11, 12 composables och hela arkitekturen porteras steg för steg enligt en styrande plan. Vue-repot `~/Repon/miranon-media-os/` är **fryst** referens — inte ett aktivt redigerings-mål.

**Styrande dokument för byggandet:** `docs/byggplan.md` (i detta repo). Vue-repots `react-migration/`-mapp är historiskt referensmaterial — användes som källa under Fas 0 + Fas 1 men ersätts av byggplan.md från och med Fas 2.

**Airtable-basen är en förstklassig LEVERABEL, inte ett provisorium:** den maxas till 11/10 / branschledarmässig och blir mall + övningsprojekt i Passionslyftet. Den är datakälla nu för att bygget ska avtäcka vad appen behöver av sin datakälla — defekt-registret (`docs/reference/data-model.md` §Kända fällor + T16) är kravspecen för bas-maximeringen (post-Fas-6-milstolpe). Resolution sker I BASEN, ej lappa, ej designa-bort; Supabase-migration är ett separat senare spår, ej en ersättning. Fullt beslut: [ADR-063](docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md).

---

## Instruktioner — Alltid gäller

- **Styrande dokument för byggandet:** `docs/byggplan.md`. Läs den innan varje fas. Avvik aldrig utan att uppdatera byggplanen först.
- Research före implementation: kolla React Aria, TanStack, Radix, FK Designsystemet INNAN du designar en lösning. Branschledarnas mönster är golvet.
- **Airtable-schema före write:** konsultera `docs/reference/data-model.md` (fält-skrivbarhet, formel/rollup-fält, §Kända fällor, write-fält-IDs) INNAN du designar någon Airtable-fält-operation. Anta aldrig fält-form — verifiera mot referensen eller live via Code. Gäller vid Code:s fält-operations-design och utförande.
- **Prod-basens UI-/automations-lager (historisk karta):** [`docs/reference/schema_reference.md`](docs/reference/schema_reference.md) — interfaces, vyer, formulär, Zapier/Make och automationerna A1–A11 med skriptkod; frusen ögonblicksbild mars 2026, kopierad ur frysta Vue-repot 2026-08-01. För fält-data är `data-model.md` auktoritativ.
- **Airtable-plattformens väggar:** `docs/reference/airtable-constraints.md` är den auktoritativa katalogen över vad Airtable strukturellt INTE kan (27 poster, A–F), var och en med `v1-kompensation` + `Fas E-krav` — den är därmed också migrations-kravspecen. Konsultera INNAN arkitektur-, test- eller CI-design som rör datakällan, och anta aldrig att en vägg är vår egen design. Vad valet kostar i testbarhet: [ADR-063](docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md) § S91-not.
- **Samarbetssystemets mekanik:** hur vårt Code/Marcus-system fungerar och sitter ihop bor i hubbens `SYSTEMET.md` (`marcus-system/SYSTEMET.md`) — den navigerbara mekanik-kartan (roller, hub/spoke, plugin/skills, governing/CI, lifecycle, tråd/backlog-substrat, MCP, distribution). Spoke-pekare: [`docs/reference/systemet.md`](docs/reference/systemet.md). Slå upp on-demand när du behöver systemets mekanik; läs inte in den i förväg.
- Testa nytt bibliotek/approach med minimalt test (1 komponent, 1 hook) innan full implementation
- Verifiera per komponent: 11/11/11 (bibliotek) eller 11/10/10 (vyer). Bevisa att det fungerar — "det funkar" ≠ "det är rätt".
- Fånga lärdomar i `tasks/lessons.md` efter varje korrigering. Markera universella med `[UNIVERSAL]`.
- **Uppdrag till agenter källmärker varje faktapåstående** (fil/commit/kommando) — obelagda påståenden behandlas av mottagaren som HYPOTES ([ADR-086](docs/decisions/ADR-086-uppdragets-premisser-provas-av-mottagaren.md)).

---

## Triage av det oväntade — alltid-på (ADR-053)

När något OVÄNTAT uppstår (utanför nuvarande scope — nära eller långt ifrån, men alltid
oväntat), kör denna triage innan du fortsätter. Lita inte på omdöme i stunden — det är den
empiriskt svagaste mekanismen (~9%), samma svaghetsklass ADR-043 kodade bort för lifecycle.
Klassa mot två axlar: närhet till nuvarande scope, och om det BLOCKERAR nuvarande arbete.

- Blockerar + i scope → hantera nu (enabling-detour, egen landning).
- Blockerar + utanför scope → STOPPA, eskalera till Marcus (väg-beslut).
- Blockerar ej + värdefullt → defer till tråd-registret (durabelt, för senare).
- Blockerar ej + lågvärde → förkasta EXPLICIT (noteras kort, aldrig tyst).

Ledstjärna: registrera — förkasta aldrig tyst. Ett oväntat värde som inte fångas dör med
sessionen. Baren för "blockerar" hålls hög: bara det som genuint stoppar nuvarande arbete
eskaleras eller hanteras nu; allt annat defereras eller förkastas, så inte varje småsak blir
en tråd.

Kriteriet ny session vs detour = sessions-paus-distinktionen (ADR-051): fortsätter samma
scope → detour; distinkt scope → egen session.

HUR (ge tråden ett ID, lägg en rad i indexet, skapa ev. tråd-kort): se
tasks/threads/README.md § "Så här registrerar du en ny tråd". Princip här, mekanik där.

---

## Stack

React + TypeScript + Vite + TanStack Router + Biome; se `package.json` för versioner.

---

## Bygg, testa, linta

Kanoniska kommandon (per `CONTRIBUTING.md` Definition of Done):

```bash
npm run test:api            # API-tester gröna
npm run typecheck           # 0 typfel (tsc -b, äkta över project references)
npx @biomejs/biome check .  # 0 lint-fel
npm run build               # bygg grön
```

### Granskningsdata i staging — bygg den ALDRIG för hand

Ska Marcus granska en yta som kräver data staging inte har (ett kommande event
med anmälningar i båda tillstånden, en fylld kö, en lång lista):

```bash
npm run seed:review -- --ort ZZ-GRANSKNING-SNN --bekraftade 8 --obekraftade 8 --dagar 8
npm run seed:review:clean -- --ort ZZ-GRANSKNING-SNN
```

Skriptet bär de fällor som kostade tid när jobbet gjordes för hand: bas-guard mot
prod, korsläsning mot `.purge-staging-policy.json` så granskningsdata inte städas
bort mitt i en pågående granskning, förbud mot att röra de permanenta
rollup-fixturerna, och ett datumval utanför sentinel-klustret. Detaljer +
`localStorage`-fällan: [`docs/reference/staging-verifiering-runbook.md`](docs/reference/staging-verifiering-runbook.md)
§ Granskningsfixtur.

**Fixturen har en livstid sedan `TASK-95`.** Skapandet stämplar ett utgångsdatum
i eventets `Notering` (14 dagar som default, `--livstid N`), och förfallo-svepet
städar det som passerat — automatiskt i båda lägena, eller ensamt med
`npm run seed:review -- --sweep`. En fixtur vars stämpel INTE passerat rörs
aldrig: det är "granskningen pågår". Svepet är ingen tidsdriven automat — det
körs när skriptet körs.

**`ZZ-GRANSKNING-*` får ALDRIG bli purge-bar.** Att lösa en kvarlämnad fixtur med
en target i `.purge-staging-policy.json` river skyddsräcke 2 i stället för att
laga något — setup-purgen kör före varje staging-CI-jobb och hade raderat datan
mitt under granskningen. Restlistan bokförde en gång `ZZ-GRANSKNING-*` och
`app-segment-test` som samma klass av lucka; de har **motsatta** rätta svar
(`app-segment-test` fick sin target i `TASK-87`). Gör inte analogin.

**Varför raden står här och inte bara i runbooken:** samma jobb gjordes för hand
två gånger (2026-07-22 och 2026-07-26) innan skriptet fanns, och ett verktyg som
inte ligger i sessionsstartens läs-ordning hittas inte när det behövs.

### Flakighet mäts med riggen — bygg ALDRIG en egen mätserie

Ska ett test bedömas som flakigt, eller en ändring mätas mot en flake-rat:

```bash
npm run metrics:flake            # scripts/flake-matserie.mjs
```

Riggen kodar de egenskaper som gjorde `TASK-74`:s mätning ärlig: **interfolierad**
A/B (`A,B,A,B,…`, aldrig blockad — blockade armar mäter tidsfönstret lika mycket
som ändringen), **loadavg per körning** i rådatan så ett utfall kan deflateras i
efterhand, `--retries=0` (retries döljer flaken inuti ett grönt jobb), och
**rådata per testresultat** så en efterhandsanalys inte kräver omkörning. Den
mäter — den dömer inte, och bär medvetet ingen tröskel för "acceptabel" flakighet.

**Varför raden står här:** fyra kort (`TASK-77`–`80`) behöver riggen, och bygger
var och en sin egen variant blir talen ojämförbara — vilket är precis det fel
riggen finns för att förhindra. Samma skäl som `seed:review` ovan: ett verktyg
utanför läs-ordningen hittas inte när det behövs.

**Läs alltid ut n innan ett noll-resultat tolkas.** `TASK-74` mätte 1 fällning av
14 CI-*jobb*; noll fällningar på sex lokala körningar är förenligt med den raten
och bevisar ingenting. Och klass B är övervägande **lokal** — för en flake som
bara CI ser kan en lokal serie vara fel instrument helt och hållet.

### En ny hook kan ALDRIG skarpbevisas i sessionen som byggde den

Hookar registrerade i `.claude/settings.json` **mitt i en session tas inte i
bruk i den sessionen**. Förstapartskällan
([hooks-guide](https://code.claude.com/docs/en/hooks-guide)) säger det i sitt
felsökningsavsnitt: *"the file watcher may have missed the change: restart
your session to force a reload."* Det finns ingen reload-väg —
`/reload-hooks` existerar inte och `/hooks`-menyn är read-only.

**Planera in det, upptäck det inte vid beviset:**

1. Bevisa **logiken** i byggsessionen — tvåsidig testsvit + manuell körning av
   skriptet mot verkligt tillstånd. Båda går utmärkt.
2. Bokför **skarpbeviset som öppen skuld i handoffen**, aldrig som gjort.
3. Betala skulden som en av **nästa sessions första handlingar**.

Skilj alltid "hooken är fel" från "hooken är inte laddad" med en
**differentialmätning**: kör skriptet manuellt med identisk hook-JSON (ska
fälla), och provocera samtidigt en BEFINTLIG hook via harnesset (ska fälla).
Faller den befintliga men inte den nya är det registreringen, inte logiken.

Samma strukturella klass som MCP-verktygsytan (S97 Del 2): båda bestäms vid
sessionsstart och uppdateras inte retroaktivt. **Fråga "bestäms detta vid
sessionsstart?" innan du planerar ett bevis som förutsätter motsatsen.**
Underlag: `tasks/lessons.md` L450 (konsoliderad ur det tidigare fragmentet
`tasks/lessons.d/hook-registrerad-mitt-i-sessionen-laddas-inte.md`).

### Agenter kan INTE arbeta cross-repo — och varje worktree kostar

En worktree-isolerad agent kan **bara** göra git-operationer i sin egen
worktree. Harnesset avvisar varje form som pekar utanför den — `cd ~/annat-repo
&& git status`, `git -C ~/annat-repo status`, `EnterWorktree` mot ett syskonrepo.
Mätt 2026-08-04 (S97) när en bygg-agent dispatchades mot hub-repot
`~/Repon/marcus-system`: tre oberoende former, alla avvisade.

**Konsekvensen är operativ, inte teoretisk:** hub-ändringar — plugin-skills,
`SYSTEMET.md`, hubbens lessons-volymer — **görs av orkestreraren själv**.
Delegera dem aldrig till en bygg- eller research-agent; uppdraget kan inte
utföras, och agenten bränner ett helt pass på att upptäcka det. Agenten i S97
stoppade korrekt i stället för att kringgå spärren, men passet var förlorat.

**Varje worktree-skapelse har dessutom en mätt bieffekt.** Claude Code skriver om
huvudrepots `core.hooksPath` till en ABSOLUT path i den DELADE `.git/config` vid
varje ny worktree — belagt i `anthropics/claude-code` `#27474`, `#66993`,
`#72714` (öppen) och verifierat i vår egen binär (S97). Följden: alla worktrees
kör huvudkatalogens hook-kopia i stället för sin egen, tills `.githooks/pre-commit`
självläker värdet vid nästa commit (`T121`).

Det går inte att laga hos oss. **Men exponeringen är vår:** en session som
spawnar tolv worktree-isolerade agenter triggar buggen tolv gånger. Isolering är
rätt när en agent skriver kod som kan kollidera vid merge — den är onödig för ett
research-pass som läser och skriver en enda fil under `docs/research/`. **Isolera
efter behov, inte som default.**

### Landning sker via MERGE QUEUE — maskinen äger ordningen sedan 2026-07-29

All landning går via branch + PR (direktpush till `main` avvisas av ruleset,
[ADR-076](docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)). Armera med
`gh pr merge --auto`; **kön sköter sekvenseringen**. Den bygger varje
post mot `main` plus posterna före den, så `BEHIND` uppstår inte längre av att
två PR:er landar nära varandra.

**Strategiflaggan är BORTA ur formen sedan 2026-08-04 (S97).** Raden sade
tidigare `gh pr merge --auto --merge`. Den formen avvisas nu: `gh` svarar
`! The merge strategy for main is set by the merge queue` och exit 1 — kön
äger strategin, och att också ange den är ett fel, inte en redundans. Mätt
skarpt vid armeringen av `#705`; `--auto` ensamt gav EXIT=0 och korrekt
`autoMergeRequest.mergeMethod: MERGE`.

**Den gamla regeln — *"armera aldrig två samtidigt"* — är UPPHÄVD.** Den var
korrekt så länge sekvenseringen var en mänsklig hand. Den handen är nu
mekaniserad (`TASK-70.1`, A7:3): kön är en `merge_queue`-regel i rulesetet
`main-skydd`, `min_entries_to_merge: 1` så en ensam PR landar direkt utan att
vänta på sällskap.

**Vad som fortfarande gäller:** armera aldrig en PR vars bygg-agent fortfarande
arbetar, och kör aldrig `update-branch` mot en sådan gren.

**Svep vid varje väckning — passiv väntan är avskaffad som arbetsläge
(`T112`, Marcus GO 2026-08-01).** Orkestreraren äger landnings- och
merge_group-verifikaten: agenters vakter väcker ingen över turgränsen
(`T112` § Mätt), och agenter parkerar inte längre på landnings-vakter
(`.claude/agents/bygg-agent.md` § Parkera aldrig på en landnings-vakt).
Stående form: `scripts/heartbeat-svep.sh` (mekaniserad ur `TASK-119`, config-driven
via `.heartbeat-svep-policy.conf`) — en persistent heartbeat-monitor som var
~90:e sekund (branschbelagt intervall,
`docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`)
tar en TREVÄGS-snapshot — main-SHA · röda check-rollups · DIRTY-mängd — plus
en fjärde väg (armerings-kandidater, se tabellen nedan). RÖTT och DIRTY
rapporteras level-triggered: varje svep tillståndet håller, inte bara vid
övergången (`L443`) — samma familj som Kubernetes' watch+resync-mönster,
immun mot exakt den envägs-blindhet som missade PR #572. Oberoende av
agenternas vakter, och varje väckning — notifikation ELLER heartbeat-event —
utlöser samma svep: verifiera faktiskt läge mot git/REST → armera det som
står oarmerat → väck ägar-agenter → starta nästa post.
Vakt-event är väckarklocka, aldrig fakta: förgrundsverifiera före varje
handling — fem falska terminal-signaler i ett enda pass är belagda
(S91 Del 39.5), inklusive ett "MERGED med SHA" vars SHA aldrig nådde `main`.

**`autoMergeRequest: null` betyder INTE "ej armerad".** Fältet beror på PR:ens
tillstånd i armerings-ögonblicket. `gh pr merge --help` säger det rakt ut:
*"If required checks have not yet passed, auto-merge will be enabled. If
required checks have passed, the pull request will be added to the merge queue."*

| Läge vid armering | Fältet | Vad det betyder |
|---|---|---|
| Checks körs — nypushad PR, normalfallet | **satt** | fältet ÄR signalen |
| PR:en redan `CLEAN` | `null` | köades direkt; inget `autoMergeRequest` skapas någonsin |
| Efter merge | `null` | nollas oavsett — säger ingenting om armeringen |
| PR:en sparkas ur kön (`failed_checks`-utsparkning) | `null` | **KONSUMERAD armering** — PR:en ser identisk ut med en aldrig armerad; kräver ett NYTT `gh pr merge --auto` |

Disambiguera med ett andra `gh pr merge --auto`: svaret
`already queued to merge` betyder köad.

**Automatiserad klassning ska fråga `isInMergeQueue` i SAMMA GraphQL-query,
inte bara `autoMergeRequest`.** Tabellrad 2 ovan — en PR som var `CLEAN` vid
armeringen köas direkt utan att `autoMergeRequest` någonsin sätts — är den
VANLIGA vägen genom kön, inte ett undantag. Ett skript som bara läser
`autoMergeRequest == null` kan därför inte skilja "korrekt köad" (tyst) från
"aldrig armerad"/"utsparkad med konsumerad armering" (larma) — precis den
förväxlingen som fick `scripts/heartbeat-svep.sh`s armerings-kandidat att
falsklarma sju gånger på en enda natt (PR #614, #617×3, #621, #623, #624,
2026-08-02). `isInMergeQueue` skiljer dem åt utan att röra den ursprungliga
ambiguiteten i raden ovan: `isInMergeQueue: true` ⇒ tyst, `false` ⇒ larma
(kan fortfarande vara ANTINGEN aldrig-armerad ELLER utsparkad — den
skillnaden kräver fortfarande det andra `gh pr merge --auto`).
Fixad i `TASK-128`.

**Det fjärde läget är dyrast, inte bara ett fjärde alternativ.** En
`failed_checks`-dequeue konsumerar armeringen tyst — ingen signal skiljer
PR:en från en som aldrig armerats. Utan ett svep som armerar om den står en
färdig PR still på obestämd tid (`T108`-klassen: ett tillstånd utan
bevakare). Mätt två gånger 2026-08-01 på samma dag (#527 12:24, #539 12:33),
och två gånger till på SAMMA PR inom sex minuter (#557, TASK-115 instans 6+7)
— i samtliga fall en falsk röd från G0-transienten (se
`scripts/check-staging-preflight-wiring.mjs` § bounded retry), inte ett
verkligt trädfel. Källa: `backlog/tasks/task-115` + `tasks/sessions/2026-07-26-session-91.md` rad ~7908–7909.

**En köad gren kan inte uppdateras via `gh`.** Push avvisas med `GH006` så
länge PR:en står i kön, och `--disable-auto` släpper inte låset — `gh` 2.96.0
har ingen dequeue-flagga. Det är fortfarande sant och oförändrat.

**Men CLI:ts yta är smalare än plattformens — en väg ur finns.** GraphQL-
mutationen `dequeuePullRequest(input: {id: <PR:ens GraphQL-nod-ID>})` tar
bort posten ur kön direkt, och kräver inga rättigheter utöver ett vanligt
repo-admin-token. Mätt skarpt 2026-08-01 mot en genuint köad, kastbar test-PR:
armerad 21:57:38 UTC, `dequeuePullRequest` lyckades 21:57:43 UTC, kön
bekräftat tom 21:57:49 UTC — 11 sekunder totalt, `main` opåverkad. Samma pass
prövade `enqueuePullRequest(input: {pullRequestId, jump: true})`: fungerar
också, men kräver att PR:ens egna required checks redan är gröna (den råa
mutationen kringgår inte den grinden — mätt: ett försök före grön status gav
`"Required status check ... is expected"`). Fullt underlag inklusive alla
kommandon och tidsstämplar:
[`docs/research/task-99-dequeue-enqueue-live-test-2026-08-01.md`](docs/research/task-99-dequeue-enqueue-live-test-2026-08-01.md).

**Den operativa regeln kvarstår ändå, med rätt skäl den här gången:** köa
inte förrän diffen är den du vill landa. Skälet är inte längre att
möjligheten att ändra "försvinner" — den gör inte det. Skälet är att den enda
vägen ur går via en handskriven GraphQL-mutation utanför `gh`, vår vanliga
verktygsyta, och att förlita sig på den som daglig rutin (i stället för ett
medvetet, mätt undantag) är en väg dit vi inte har anledning att gå.

**Om kön går sönder:** vägen tillbaka är att ta bort `merge_queue`-regeln ur
rulesetet via `gh api` — den kräver ingen landning och är därför oberoende av
felläget. Den är prövad skarpt (på → verifierad → av → verifierad) före
aktiveringen, inte efter. Formerna och kö-parametrarna:
[`CONTRIBUTING.md`](CONTRIBUTING.md) § Landnings-ordningen.

**Varför raden står här och inte bara i CONTRIBUTING:** regeln gäller i
armerings-ögonblicket, och `CONTRIBUTING.md` auto-laddas inte i en
Code-session — bara denna fil gör det. Historiken är värd att minnas: `L328`
var nedskriven sedan S81 och beskrev mekanismen korrekt, ändå gick
orkestreraren i fällan två gånger under en och samma resume 2026-07-28. Det
var beviset för att en regel utan mekanism inte efterlevs — och skälet till att
den nu har en.

### Kortnummer — verktyget skyddar, men bara halva vägen

`backlog/config.yml` har `check_active_branches: true` sedan `TASK-93`
(2026-07-30). CLI:t läser andra aktiva grenar före det allokerar ett kort-ID och
hoppar över nummer som redan är tagna där.

**Det är en riskMINSKNING, inte en garanti.** Skyddet ser bara **committat**
arbete. Tre hål är mätta och kända:

| Läge | Skyddar flaggan? |
|---|---|
| Kortet är committat på en annan gren | **Ja** — numret hoppas över |
| Kortet är skapat men **inte committat** i ett systerträd | **Nej** — osynligt |
| Kortet ligger **ospårat i huvudträdet** medan en agent räknar från `main` | **Nej** |
| Grenen är äldre än `active_branch_days` (30) | **Nej** |

Praktiskt, i den ordningen:

1. **`git fetch` + fast-forwarda före `task create`.** En föråldrad worktree ger
   dig ett nummer som redan är taget i merge-kön.
2. **Committa kortet i samma andetag som du skapar det.** Uppskjuten bokföring är
   inte neutral väntan — den är en osynlig reservation av en delad resurs.
3. **Krockar det ändå: rätta via CLI:t, aldrig för hand.** Parkera kortet utanför
   registret och återskapa det med `task create` när den andra posten landat. En
   handredigerad `id:`-rad löser symptomet och bryter den regel som gör registret
   trovärdigt.

**Kostnaden är mätt, och den träffar smalare än man tror:** `task list` går från
~0,52 s till ~6,50 s och `task create` från ~0,69 s till ~7,09 s, men
`task <id>` (view) är **opåverkad** (~0,52 → ~0,55 s). Kostnaden är per
`list`/`create` — inte per CLI-anrop. Därför tog `check-backlog-closure.sh`
164,60 s med flaggan på, trots sina ~173 anrop: den gör ett `list` och resten
`view`. Multiplicera inte per-anropstalet; mät.

**Varför raden står här:** den gäller i `task create`-ögonblicket, och en agent
som ska minta ett kort läser inte en ADR först. `ADR-081` påstod i tre månader att
kortnumren *"redan är lösta"* — det var falskt hela tiden, och kostade en skarp
kollision 2026-07-30 innan någon mätte efter. Rättelsen: `ADR-081` § Updates.

---

## Filstruktur

För aktuell struktur, kör `tree -L 3 -I 'node_modules|dist|.git|coverage|test-results|playwright/.auth'`.

---

## Synk-horisont och arkiv-åtkomst

claude.ai-projektkunskapen synkar INTE: `tasks/sessions/archive/`,
`docs/archive/` (+ `package-lock.json` om fil-urval stöds). Allt finns
kvar i git — exkluderingen gäller endast claude.ai-projektkunskapens synk (ADR-048).

Regel vid claude.ai-läsning: noll träffar i projektkunskapen på historiskt material
(arkiverade sessionsdok, superceded specs, frusna analyser) betyder INTE
att det saknas. Historik utanför synk-horisonten hämtas VIA CODE
(LÄS→RAPPORTERA mot lokal disk/git) eller genom att Marcus klistrar
innehållet — anta aldrig att materialet inte existerar.

`docs/research/` ligger kvar i synken tills Fas 6 är avslutad
(konsumeras aktivt av Fas 6) och exkluderas därefter (ADR-048 punkt 3).

---

## Design-system

**FK-inspirerat 3-lagers token-system** (DESIGN-SYSTEM-SPEC.md §1):

1. **Primitiv** (`src/styles/tokens/primitives.css`) — råa värden: `--mm-amber-500: #FFBA05`, `--mm-blue-900: #1B4965`, etc.
2. **Semantisk** (`src/styles/tokens/semantic.css`) — roller: `--mm-color-primary`, `--mm-color-focus-ring`, `--mm-color-text-default`.
3. **Komponent** (`src/styles/tokens/components.css`) — komponentspecifikt: `--mm-button-primary-bg`, `--mm-dialog-overlay-bg`.

**Regler:**

- Inga hårdkodade färger i komponenter — allt via CSS custom properties
- Inga komponentspecifika tokens utanför components.css
- Foundation: `~/Repon/marcus-system/design-system/DESIGN-FOUNDATION-v1.md` (4px spacing-bas, Inter, FK-inspirerat)
- Varje komponent ska klara prefers-contrast: more, prefers-reduced-motion, print

Fullständig spec: [`docs/specs/DESIGN-SYSTEM-SPEC.md`](docs/specs/DESIGN-SYSTEM-SPEC.md) (lokalt sedan ADR-021, ursprungligen i Vue-referensens `docs/react-migration/`).

---

## Arbetsflöde

**Verktyg:**

| Verktyg | Används för |
|---|---|
| Claude Code (terminal) | Planering, arkitektur, FK-research, kodning, git, filhantering, verifiering |
| Vite dev-server | Lokal utveckling med hot reload |
| Playwright | Visuell QA, screenshots, accessibility-tester |
| Airtable MCP | Verifiera fält, records, relationer live |

**Metod:** Marcus och Code planerar → Code bygger fas för fas → Marcus verifierar i browsern → feedback → nästa steg.

**Fasordning och fas-status:** se `docs/byggplan.md` §4 (styrande).

---

## Kvalitetsribba

| Typ | Tillgänglighet | Teknik | Återanvändbarhet |
|---|---|---|---|
| **Bibliotek** (komponenter, hooks) | **11** | **11** | **11** |
| **Vyer** (produktspecifika) | **11** | **10** | **10** |

Tillgänglighet är alltid 11 — inga undantag. Bibliotekskod ska bära flera produkter.

Fullständiga checklistor: [`docs/specs/KVALITETSDEFINITIONER-11-REACT.md`](docs/specs/KVALITETSDEFINITIONER-11-REACT.md) (lokalt sedan ADR-021; React-versionen ersätter Vue-eran per ADR-027 stack-skifte 2026-05-11).

---

## Vision: Dubbel output

1. **Miranon Media Admin** — produkten Lotta använder dagligen. Event, anmälningar, betalningar, personer, leads, närvaro, mail.
2. **Mm Component Library** — komponentbiblioteket som bär framtida produkter (Passionslyftet, Maxat Event, kommande SaaS). Hooks, primitiver och komponenter byggda för återanvändning utan ändringar.

Allt som byggs bedöms utifrån båda perspektiven:

- Löser det Lottas behov? (produkt)
- Kan det återanvändas i nästa produkt utan ändringar? (bibliotek)

---

## Operativ procedur

Operativa rutiner — sessionsstart, sessionsavslut, fas-avslut — bor i
`marcus-system`-pluginets disciplin-skills och triggas automatiskt via sin
`description`. Pluginet aktiveras via **user-scope install-record**
(`~/.claude/plugins/installed_plugins.json`) som kanonisk mekanism och laddas
därmed i varje Code-session oavsett repo — se
[ADR-035](docs/decisions/ADR-035-plugin-aktivering-user-scope.md). Spoke
`.claude/settings.json` (`extraKnownMarketplaces.marcus-hub` +
`enabledPlugins`) behålls som sekundär portabilitets-deklaration, inte primär
källa. Saknas pluginet (`claude plugin list` visar inte
`marcus-system@marcus-hub`, eller färre än 4 skills aktiva) — flagga det;
scope-migrering görs inte via plugin-CLI:t (#38271). Konstitutionen ovan slår
fast PROJEKT-SPECIFIKA regler; generella sessions-HUR-steg bor i pluginet.
